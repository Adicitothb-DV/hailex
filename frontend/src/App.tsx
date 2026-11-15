import { AppLayout } from './app/layout/AppLayout';
import { lazy, Suspense } from 'react';
import { useScreenNavigation } from './hooks/useScreenNavigation';
import { PageHeading } from './components/PageHeading';
import { useTranslation } from 'react-i18next';

const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const EarthExplorerPage = lazy(() =>
  import('./features/earth-explorer/EarthExplorerPage').then((m) => ({
    default: m.EarthExplorerPage,
  })),
);
const ClimateIntelligencePage = lazy(() =>
  import('./features/climate-intelligence/ClimateIntelligencePage').then((m) => ({
    default: m.ClimateIntelligencePage,
  })),
);
const RotationStudioPage = lazy(() =>
  import('./features/agroalert/AgroAlertPage').then((m) => ({
    default: m.AgroAlertPage,
  })),
);
const AnalysisInsightsPage = lazy(() =>
  import('./features/analysis-insights/AnalysisInsightsPage').then((m) => ({
    default: m.AnalysisInsightsPage,
  })),
);
const PestMonitorPage = lazy(() =>
  import('./features/pest-monitor/PestMonitorPage').then((m) => ({ default: m.PestMonitorPage })),
);

const pages = {
  dashboard: DashboardPage,
  'earth-explorer': EarthExplorerPage,
  'climate-intelligence': ClimateIntelligencePage,
  'rotation-studio': RotationStudioPage,
  'analysis-insights': AnalysisInsightsPage,
  'pest-monitor': PestMonitorPage,
};

export default function App() {
  const { t } = useTranslation();
  const { hash, screen } = useScreenNavigation();
  const Page = screen ? pages[screen.id] : null;

  return (
    <AppLayout
      active={screen?.id ?? null}
      label={screen ? t(screen.id) : t('notFound')}
      routeKey={hash}
    >
      {Page ? (
        <Suspense fallback={<p role="status">{t('loading')}</p>}>
          <Page />
        </Suspense>
      ) : (
        <>
          <PageHeading
            eyebrow={t('unavailable')}
            title={t('missingTitle')}
            description={t('missingDescription')}
          />
          <a className="button button-primary" href="#/dashboard">
            {t('back')}
          </a>
        </>
      )}
    </AppLayout>
  );
}
