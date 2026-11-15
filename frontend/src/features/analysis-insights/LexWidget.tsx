import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { AdvisorChat } from './AdvisorChat';
import { LexWake } from './LexWake';
import { useTranslation } from 'react-i18next';

type Context = { region: string; crop: string; water: string; analysisId: string };

export function LexWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<{ id: number; text: string } | null>(null);
  const [context, setContext] = useState<Context>({
    region: '',
    crop: '',
    water: 'unknown',
    analysisId: '',
  });
  const { fieldAnalysis } = useApp();
  useEffect(() => {
    const show = () => setOpen(true);
    const update = (event: Event) => {
      const data: unknown = (event as CustomEvent<unknown>).detail;
      if (
        data &&
        typeof data === 'object' &&
        'region' in data &&
        'crop' in data &&
        'water' in data &&
        'analysisId' in data &&
        typeof data.region === 'string' &&
        typeof data.crop === 'string' &&
        typeof data.water === 'string' &&
        typeof data.analysisId === 'string'
      )
        setContext({
          region: data.region,
          crop: data.crop,
          water: data.water,
          analysisId: data.analysisId,
        });
    };
    window.addEventListener('hailex-open-lex', show);
    window.addEventListener('hailex-lex-context', update);
    return () => {
      window.removeEventListener('hailex-open-lex', show);
      window.removeEventListener('hailex-lex-context', update);
    };
  }, []);
  return (
    <>
      <button
        type="button"
        className="lex-trigger"
        onClick={() => setOpen(true)}
        aria-label={t('lexOpen')}
        aria-expanded={open}
      >
        <MessageCircle size={20} /> Lex
      </button>
      {!open && (
        <LexWake
          onWake={(text) => {
            setVoiceCommand({ id: Date.now(), text });
            setOpen(true);
          }}
        />
      )}
      <aside className="lex-panel" hidden={!open} aria-label={t('lexAssistant')}>
        <header>
          <strong>Lex · HaiLex</strong>
          <button
            className="icon-button"
            type="button"
            aria-label={t('lexClose')}
            onClick={() => {
              window.dispatchEvent(new Event('hailex-close-lex'));
              setOpen(false);
            }}
          >
            <X size={20} />
          </button>
        </header>
        <AdvisorChat
          {...context}
          active={open}
          activeAnalysisId={fieldAnalysis?.analysis_id || ''}
          voiceCommand={voiceCommand}
        />
      </aside>
    </>
  );
}
