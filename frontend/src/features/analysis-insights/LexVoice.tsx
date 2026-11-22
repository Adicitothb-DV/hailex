import { useCallback, useEffect, useRef, useState } from 'react';
import { apiBase } from '../../services/api';
import { useTranslation } from 'react-i18next';
import type { AppLocale } from '../../i18n';

type RecognitionResult = { isFinal: boolean; [index: number]: { transcript: string } };
type RecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function LexVoice({
  active,
  onTranscript,
  text,
  textLocale,
  autoRequest,
  onAutoReady,
}: {
  active: boolean;
  onTranscript: (text: string) => void;
  text: string;
  textLocale: AppLocale;
  autoRequest: { id: number; text: string; locale: AppLocale } | null;
  onAutoReady: () => void;
}) {
  const { i18n, t } = useTranslation();
  const recognition = useRef<Recognition | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const [state, setState] = useState('');
  const [listening, setListening] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const readyCallback = useRef(onAutoReady);
  useEffect(() => {
    readyCallback.current = onAutoReady;
  }, [onAutoReady]);
  const stopAudio = useCallback(() => {
    const current = controller.current;
    controller.current = null;
    current?.abort();
    if (audio.current) {
      audio.current.pause();
      audio.current.currentTime = 0;
      audio.current = null;
    }
    if (url.current) {
      URL.revokeObjectURL(url.current);
      url.current = null;
    }
    setPlaying(false);
    setPaused(false);
    setBusy(false);
    setBlocked(false);
  }, []);
  const stopListening = useCallback(() => {
    recognition.current?.abort();
    recognition.current = null;
    setListening(false);
  }, []);
  useEffect(() => {
    return () => {
      recognition.current?.abort();
      controller.current?.abort();
      audio.current?.pause();
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, [active]);
  useEffect(() => {
    const stopOnNewTurn = () => {
      stopListening();
      stopAudio();
    };
    window.addEventListener('hailex-stop-voice', stopOnNewTurn);
    return () => window.removeEventListener('hailex-stop-voice', stopOnNewTurn);
  }, [stopAudio, stopListening]);
  function listen() {
    readyCallback.current();
    if (listening) {
      stopListening();
      setState('voiceMicOff');
      return;
    }
    const browser = window as RecognitionWindow;
    const Engine = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Engine) {
      setState('voiceUnavailable');
      return;
    }
    stopAudio();
    const instance = new Engine();
    recognition.current = instance;
    instance.lang = i18n.language;
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) {
          onTranscript(result[0]?.transcript || '');
          setState('voiceRecognized');
        }
      }
    };
    instance.onerror = () => {
      recognition.current = null;
      setListening(false);
      setState('voiceMicError');
    };
    instance.onend = () => {
      recognition.current = null;
      setListening(false);
    };
    try {
      instance.start();
      setListening(true);
      setState('voiceListening');
    } catch {
      recognition.current = null;
      setState('voiceMicStartError');
    }
  }
  const speak = useCallback(
    async (spokenText: string, locale: AppLocale, automatic = false) => {
      stopListening();
      stopAudio();
      if (!spokenText.trim()) return;
      const abort = new AbortController();
      controller.current = abort;
      const timeout = window.setTimeout(() => {
        if (controller.current !== abort) return;
        if (automatic) readyCallback.current();
        stopAudio();
        setState('voiceErrorTimeout');
      }, 30000);
      setBusy(true);
      setState('voicePreparing');
      try {
        const response = await fetch(`${apiBase}/api/v1/advisor/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: spokenText.slice(0, 1800), locale }),
          signal: abort.signal,
        });
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const code =
            body &&
            typeof body === 'object' &&
            'error' in body &&
            body.error &&
            typeof body.error === 'object' &&
            'code' in body.error &&
            typeof body.error.code === 'string'
              ? body.error.code
              : 'unknown';
          throw new Error(code);
        }
        const blob = await response.blob();
        if (abort.signal.aborted) return;
        url.current = URL.createObjectURL(blob);
        const player = new Audio(url.current);
        audio.current = player;
        player.onended = () => {
          stopAudio();
          setState('voiceEnded');
        };
        await player.play();
        if (automatic) readyCallback.current();
        setPlaying(true);
        setState('voicePlaying');
      } catch (err) {
        if (!abort.signal.aborted) {
          if (err instanceof DOMException && err.name === 'NotAllowedError' && audio.current) {
            if (automatic) readyCallback.current();
            setBlocked(true);
            setState('voiceBlocked');
          } else {
            if (automatic) readyCallback.current();
            stopAudio();
            const errorKeys: Record<string, string> = {
              fish_audio_not_configured: 'voiceErrorConfig',
              fish_audio_auth_error: 'voiceErrorAuth',
              fish_audio_rate_limited: 'voiceErrorLimit',
              fish_audio_timeout: 'voiceErrorTimeout',
            };
            setState(
              err instanceof Error
                ? (errorKeys[err.message] ?? 'voiceErrorProvider')
                : 'voiceErrorProvider',
            );
          }
        } else if (controller.current === abort) {
          if (automatic) readyCallback.current();
          stopAudio();
          setState('voiceErrorTimeout');
        }
      } finally {
        window.clearTimeout(timeout);
        if (!abort.signal.aborted) setBusy(false);
      }
    },
    [stopAudio, stopListening],
  );
  const playedRequest = useRef<number | null>(null);
  useEffect(() => {
    if (!autoRequest || playedRequest.current === autoRequest.id) return;
    playedRequest.current = autoRequest.id;
    void speak(autoRequest.text, autoRequest.locale, true);
  }, [autoRequest, speak]);
  return (
    <div className="lex-voice">
      <button
        type="button"
        className="button button-secondary"
        onClick={listen}
        aria-pressed={listening}
      >
        {t(listening ? 'voiceStopMic' : 'voiceDictate')}
      </button>
      {text && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => void speak(text, textLocale)}
          disabled={busy || playing || blocked}
        >
          {t('voiceListen')}
        </button>
      )}
      {blocked && (
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            const player = audio.current;
            if (!player) return;
            void player
              .play()
              .then(() => {
                setBlocked(false);
                setPlaying(true);
                setState('voicePlaying');
              })
              .catch(() => setState('voicePlaybackError'));
          }}
        >
          {t('voicePlay')}
        </button>
      )}
      {(busy || playing || blocked) && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            stopAudio();
            readyCallback.current();
            setState('voiceStopped');
          }}
        >
          {t('voiceStop')}
        </button>
      )}
      {playing && (
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            const player = audio.current;
            if (!player) return;
            if (paused) {
              void player
                .play()
                .then(() => {
                  setPaused(false);
                  setState('voicePlaying');
                })
                .catch(() => setState('voiceResumeError'));
            } else {
              player.pause();
              setPaused(true);
              setState('voicePaused');
            }
          }}
        >
          {t(paused ? 'voiceResume' : 'voicePause')}
        </button>
      )}
      {state && <p role="status">{t(state)}</p>}
    </div>
  );
}
