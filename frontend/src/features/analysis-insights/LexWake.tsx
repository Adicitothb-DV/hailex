import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Result = { isFinal: boolean; [index: number]: { transcript: string } };
type Event = { resultIndex: number; results: { length: number; [index: number]: Result } };
type Engine = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: Event) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Engine;
  webkitSpeechRecognition?: new () => Engine;
};

export function LexWake({ onWake }: { onWake: (command: string) => void }) {
  const { i18n, t } = useTranslation();
  const engine = useRef<Engine | null>(null);
  const enabled = useRef(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden || !enabled.current) return;
      enabled.current = false;
      const current = engine.current;
      engine.current = null;
      current?.abort();
      setListening(false);
      setStatus('wakeHidden');
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      enabled.current = false;
      engine.current?.abort();
    };
  }, []);

  function stop() {
    enabled.current = false;
    const current = engine.current;
    engine.current = null;
    current?.abort();
    setListening(false);
  }

  function toggle() {
    if (enabled.current) {
      stop();
      setStatus('wakeDisabled');
      return;
    }
    if (document.hidden) {
      setStatus('wakeOpenTab');
      return;
    }
    const browser = window as SpeechWindow;
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus('wakeUnavailable');
      return;
    }
    const instance = new Recognition();
    engine.current = instance;
    instance.lang = i18n.language;
    instance.continuous = true;
    instance.interimResults = false;
    instance.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result?.isFinal) continue;
        const transcript = result[0]?.transcript || '';
        const match = /\blex\b[\s,.:!?¡¿-]*/i.exec(transcript);
        if (match) {
          const command = transcript.slice(match.index + match[0].length).trim();
          stop();
          setStatus('wakeDetected');
          onWake(command);
          return;
        }
      }
    };
    instance.onerror = () => {
      enabled.current = false;
      engine.current = null;
      setListening(false);
      setStatus('wakeMicError');
    };
    instance.onend = () => {
      if (engine.current !== instance) return;
      enabled.current = false;
      engine.current = null;
      setListening(false);
      setStatus((previous) => (previous === 'wakeDetected' ? previous : 'wakeEnded'));
    };
    try {
      instance.start();
      enabled.current = true;
      setListening(true);
      setStatus('wakeListening');
    } catch {
      engine.current = null;
      setStatus('wakeStartError');
    }
  }

  return (
    <div className="lex-wake">
      <button
        type="button"
        className="button button-secondary"
        onClick={toggle}
        aria-pressed={listening}
      >
        {t(listening ? 'wakeDisable' : 'wakeEnable')}
      </button>
      {status && <span role="status">{t(status)}</span>}
    </div>
  );
}
