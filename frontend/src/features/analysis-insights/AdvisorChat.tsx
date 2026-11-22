import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import type { AdvisorResponse } from '../../types/monitoring';
import { LexVoice } from './LexVoice';
import { useTranslation } from 'react-i18next';
import { validLocale, type AppLocale, DEFAULT_LOCALE } from '../../i18n';

type Props = {
  region: string;
  crop: string;
  water: string;
  analysisId: string;
  active: boolean;
  activeAnalysisId: string;
  voiceCommand: { id: number; text: string } | null;
};
type Exchange = { question: string; response: AdvisorResponse; locale?: AppLocale };

function Typewriter({ text }: { text: string }) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const started = performance.now();
    let frame = 0;
    function tick(now: number) {
      const count = Math.min(text.length, Math.ceil(((now - started) / 280) * text.length));
      setVisible(count);
      if (count < text.length) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text]);
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{reduced ? text : text.slice(0, visible)}</span>
    </>
  );
}
type Profile = {
  municipality: string;
  locality: string;
  crops: string;
  water: string;
  objective: string;
  restrictions: string;
  notes: string;
};

function readProfile(): Profile | null {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem('hailex-agricultural-profile-v1') || 'null',
    );
    if (
      !data ||
      typeof data !== 'object' ||
      !('version' in data) ||
      data.version !== 1 ||
      !('profile' in data) ||
      !data.profile ||
      typeof data.profile !== 'object'
    )
      return null;
    const value = data.profile as Record<string, unknown>;
    const keys = [
      'municipality',
      'locality',
      'crops',
      'water',
      'objective',
      'restrictions',
      'notes',
    ] as const;
    if (!keys.every((key) => typeof value[key] === 'string')) return null;
    return Object.fromEntries(keys.map((key) => [key, value[key]])) as Profile;
  } catch {
    return null;
  }
}

export function AdvisorChat({
  region,
  crop,
  water,
  analysisId,
  active,
  activeAnalysisId,
  voiceCommand,
}: Props) {
  const { i18n, t } = useTranslation();
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(true);
  const [siap, setSiap] = useState(true);
  const [climate, setClimate] = useState(true);
  const [moisture, setMoisture] = useState(true);
  const [satellite, setSatellite] = useState(true);
  const [web, setWeb] = useState(true);
  const [autoVoice, setAutoVoice] = useState(true);
  const [latestVoice, setLatestVoice] = useState<{
    id: number;
    text: string;
    locale: AppLocale;
  } | null>(null);
  const voiceSequence = useRef(0);
  const showAnswer = useRef(false);
  const [useActiveAnalysis, setUseActiveAnalysis] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const clearAudio = () => {
      showAnswer.current = true;
      setLatestVoice(null);
      setStatus((previous) => (previous === 'audio' ? 'success' : previous));
    };
    window.addEventListener('hailex-close-lex', clearAudio);
    return () => window.removeEventListener('hailex-close-lex', clearAudio);
  }, []);
  useEffect(() => {
    if (!voiceCommand) return;
    const input = inputRef.current;
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(input, voiceCommand.text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }, [voiceCommand]);
  const [conversation, setConversation] = useState<Exchange[]>(() => {
    try {
      const raw = sessionStorage.getItem('hailex-lex-session-v1');
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              item &&
              typeof item === 'object' &&
              typeof item.question === 'string' &&
              item.response &&
              typeof item.response === 'object' &&
              item.response.answer &&
              typeof item.response.answer.conclusion === 'string',
          )
        )
          return parsed as Exchange[];
      }
    } catch {
      /* Storage is optional. */
    }
    return [];
  });
  function persist(exchanges: Exchange[]) {
    setConversation(exchanges);
    try {
      sessionStorage.setItem('hailex-lex-session-v1', JSON.stringify(exchanges.slice(-20)));
    } catch {
      /* Storage is optional. */
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || !consent) return;
    const question = message.trim();
    showAnswer.current = false;
    const turnLocale = validLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;
    setLatestVoice(null);
    window.dispatchEvent(new Event('hailex-stop-voice'));
    setStatus('loading');
    setError('');
    try {
      const history = conversation.slice(-2).flatMap(({ question: previous, response }) => [
        { role: 'user', content: previous },
        {
          role: 'assistant',
          content:
            [
              response.answer.conclusion,
              response.answer.interpretation,
              ...response.answer.actions,
              ...response.answer.limitations,
              ...response.answer.follow_up_questions,
            ]
              .filter(Boolean)
              .join('\n')
              .slice(0, 2000) || 'Sin respuesta.',
        },
      ]);
      const response = await api.advisorChat({
        message: question,
        locale: turnLocale,
        history,
        region: region || null,
        crop: crop || null,
        water_regime: water,
        analysis_id: satellite ? (useActiveAnalysis ? activeAnalysisId : analysisId) || null : null,
        profile: profile ? readProfile() : null,
        include_siap: siap,
        include_climate: climate,
        include_moisture: moisture,
        include_satellite: satellite,
        include_web: web,
      });
      persist([...conversation, { question, response: response.data, locale: turnLocale }]);
      const answer = response.data.answer;
      const speakAnswer = autoVoice && !showAnswer.current;
      if (speakAnswer) {
        setStatus('audio');
        setLatestVoice({
          id: ++voiceSequence.current,
          locale: turnLocale,
          text: [
            answer.conclusion,
            answer.interpretation,
            ...answer.actions,
            ...answer.limitations,
            ...answer.follow_up_questions,
          ]
            .filter(Boolean)
            .join(' '),
        });
      }
      setMessage('');
      if (!speakAnswer) setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lexError'));
      setStatus('error');
    }
  }
  return (
    <section className="surface advisor-chat">
      <h2>{t('lexTitle')}</h2>
      <p>{t('lexIntro')}</p>
      <p>{t('lexPrivacy')}</p>
      <p>{t('lexVoicePrivacy')}</p>
      {conversation.length > 0 && (
        <div className="advisor-conversation" aria-live="polite" aria-label={t('lexConversation')}>
          {conversation.map(({ question, response }, index) => (
            <div className="advisor-exchange" key={index}>
              <div className="advisor-user-message">
                <strong>{t('lexYou')}</strong>
                <p>{question}</p>
              </div>
              {!(status === 'audio' && index === conversation.length - 1) && (
                <article className="advisor-response">
                  <strong className="advisor-response-label">{t('lexAdvisor')}</strong>
                  <p className="advisor-conclusion">
                    {index === conversation.length - 1 && status === 'success' ? (
                      <Typewriter text={response.answer.conclusion} />
                    ) : (
                      response.answer.conclusion
                    )}
                  </p>
                  {response.answer.interpretation && <p>{response.answer.interpretation}</p>}
                  {response.answer.actions.length > 0 && (
                    <div className="advisor-section">
                      <h3>{t('lexActions')}</h3>
                      <ul>
                        {response.answer.actions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {response.answer.limitations.length > 0 && (
                    <div className="advisor-section advisor-limitations">
                      <h3>{t('lexLimitations')}</h3>
                      <ul>
                        {response.answer.limitations.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {response.answer.follow_up_questions.length > 0 && (
                    <div className="advisor-section">
                      <h3>{t('lexFollowUp')}</h3>
                      <ul>
                        {response.answer.follow_up_questions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {response.context.web_research != null &&
                    typeof response.context.web_research === 'object' &&
                    'status' in response.context.web_research && (
                      <p>
                        {t('lexResearch', { status: String(response.context.web_research.status) })}
                      </p>
                    )}
                  {response.context.web_research != null &&
                    typeof response.context.web_research === 'object' &&
                    'sources' in response.context.web_research &&
                    Array.isArray(response.context.web_research.sources) &&
                    response.context.web_research.sources.map((source: unknown, i: number) => {
                      if (
                        !source ||
                        typeof source !== 'object' ||
                        !('url' in source) ||
                        typeof source.url !== 'string' ||
                        !/^https?:\/\//i.test(source.url)
                      )
                        return null;
                      return (
                        <p key={i}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {'title' in source && typeof source.title === 'string'
                              ? source.title
                              : t('lexReference')}
                          </a>{' '}
                          ·{' '}
                          {t(
                            'verification_status' in source &&
                              source.verification_status === 'source_accessed_unverified'
                              ? 'lexSourceAccessed'
                              : 'lexUnverified',
                          )}
                        </p>
                      );
                    })}
                  <details>
                    <summary>{t('lexProvenance')}</summary>
                    <pre className="advisor-context">
                      {JSON.stringify(response.context, null, 2)}
                    </pre>
                  </details>
                </article>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit}>
        <label className="field">
          {t(conversation.length ? 'lexReply' : 'lexQuestion')}
          <textarea
            ref={inputRef}
            required
            maxLength={4000}
            rows={3}
            disabled={status === 'loading'}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <fieldset>
          <legend>{t('lexContext')}</legend>
          <label>
            <input
              type="checkbox"
              checked={profile}
              onChange={(e) => setProfile(e.target.checked)}
            />{' '}
            {t('lexProfile')}
          </label>
          {' · '}
          <label>
            <input type="checkbox" checked={siap} onChange={(e) => setSiap(e.target.checked)} />{' '}
            {t('lexSiap')}
          </label>
          {' · '}
          <label>
            <input
              type="checkbox"
              checked={climate}
              onChange={(e) => setClimate(e.target.checked)}
            />{' '}
            {t('lexClimate')}
          </label>
          {' · '}
          <label>
            <input
              type="checkbox"
              checked={moisture}
              onChange={(e) => setMoisture(e.target.checked)}
            />{' '}
            {t('lexMoisture')}
          </label>
          {' · '}
          <label>
            <input
              type="checkbox"
              checked={satellite}
              onChange={(e) => setSatellite(e.target.checked)}
            />{' '}
            {t('lexSatellite')}
          </label>
          {' · '}
          <label>
            <input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} />{' '}
            {t('lexWeb')}
          </label>
          {activeAnalysisId && (
            <label>
              <input
                type="checkbox"
                checked={useActiveAnalysis}
                onChange={(e) => setUseActiveAnalysis(e.target.checked)}
              />{' '}
              {t('lexActive', { id: activeAnalysisId.slice(0, 8) })}
            </label>
          )}
        </fieldset>
        <p>
          {t('lexPriorSelection', {
            region: region || t('lexNoMunicipality'),
            crop: crop || t('lexNoCrop'),
            water: t(
              water === 'unknown'
                ? 'lexUnknownWater'
                : water === 'rainfed'
                  ? 'lexRainfed'
                  : 'lexIrrigated',
            ),
            analysis:
              (useActiveAnalysis ? activeAnalysisId : analysisId) && satellite
                ? t('lexAnalysis', {
                    id: (useActiveAnalysis ? activeAnalysisId : analysisId).slice(0, 8),
                  })
                : t('lexNoAnalysis'),
          })}
        </p>
        <p>{t('lexSharing')}</p>
        <label>
          <input
            type="checkbox"
            checked={autoVoice}
            onChange={(e) => {
              setAutoVoice(e.target.checked);
              if (!e.target.checked) {
                showAnswer.current = true;
                setLatestVoice(null);
                window.dispatchEvent(new Event('hailex-stop-voice'));
                setStatus((previous) => (previous === 'audio' ? 'success' : previous));
              }
            }}
          />{' '}
          {t('lexAutoVoice')}
        </label>
        <label>
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />{' '}
          {t('lexConsent')}
        </label>
        <div className="monitor-actions">
          <button
            className="button button-primary"
            disabled={status === 'loading' || status === 'audio'}
          >
            {t(conversation.length ? 'lexSendReply' : 'lexSend')}
          </button>
          {conversation.length > 0 && (
            <button
              className="button button-secondary"
              type="button"
              disabled={status === 'loading' || status === 'audio'}
              onClick={() => {
                if (window.confirm(t('lexConfirmNew'))) {
                  persist([]);
                  setMessage('');
                  setError('');
                  setLatestVoice(null);
                  window.dispatchEvent(new Event('hailex-stop-voice'));
                }
              }}
            >
              {t('lexNew')}
            </button>
          )}
        </div>
      </form>
      {(status === 'loading' || status === 'audio') && (
        <p className="lex-waiting" role="status">
          {t(status === 'loading' ? 'lexLoading' : 'lexPreparingSync')}
          <span className="lex-waiting-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
      )}
      {latestVoice && latestVoice.text.length > 1800 && status !== 'audio' && (
        <p>{t('voiceTruncated')}</p>
      )}
      {error && <p role="alert">{error}</p>}
      {active && (
        <LexVoice
          active={active}
          onTranscript={(text) =>
            setMessage(text.replace(/^(?:oye|hola|ayudame|ayúdame)?\s*lex[\s,.:!?]*/i, ''))
          }
          autoRequest={latestVoice}
          onAutoReady={() => setStatus((previous) => (previous === 'audio' ? 'success' : previous))}
          textLocale={
            conversation[conversation.length - 1]?.locale ??
            (validLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE)
          }
          text={
            conversation.length
              ? [
                  conversation[conversation.length - 1]?.response.answer.conclusion,
                  conversation[conversation.length - 1]?.response.answer.interpretation,
                ]
                  .filter(Boolean)
                  .join(' ')
              : ''
          }
        />
      )}
      <p className="advisor-disclaimer">{t('lexDisclaimer')}</p>
    </section>
  );
}
