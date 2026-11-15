import { AppLayout } from './app/layout/AppLayout';
import { lazy, Suspense } from 'react';
import { useScreenNavigation } from './hooks/useScreenNavigation';
import { PageHeading } from './components/PageHeading';

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

const pages = {
  dashboard: DashboardPage,
  'earth-explorer': EarthExplorerPage,
  'climate-intelligence': ClimateIntelligencePage,
  'rotation-studio': RotationStudioPage,
  'analysis-insights': AnalysisInsightsPage,
};

export default function App() {
  const { hash, screen } = useScreenNavigation();
  const Page = screen ? pages[screen.id] : null;

  return (
    <AppLayout
      active={screen?.id ?? null}
      label={screen?.label ?? 'Página no encontrada'}
      routeKey={hash}
    >
      {Page ? (
        <Suspense fallback={<p role="status">Cargando pantalla…</p>}>
          <Page />
        </Suspense>
      ) : (
        <>
          <PageHeading
            eyebrow="RUTA NO DISPONIBLE"
            title="No encontramos esta pantalla."
            description="El enlace no corresponde a una de las cinco secciones de HaiLex."
          />
          <a className="button button-primary" href="#/dashboard">
            Volver al Dashboard
          </a>
        </>
      )}
    </AppLayout>
  );
}
