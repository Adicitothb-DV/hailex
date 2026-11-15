import { AppLayout } from './app/layout/AppLayout';
import { useScreenNavigation } from './hooks/useScreenNavigation';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EarthExplorerPage } from './features/earth-explorer/EarthExplorerPage';
import { ClimateIntelligencePage } from './features/climate-intelligence/ClimateIntelligencePage';
import { RotationStudioPage } from './features/rotation-studio/RotationStudioPage';
import { AnalysisInsightsPage } from './features/analysis-insights/AnalysisInsightsPage';
import { PageHeading } from './components/PageHeading';

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
        <Page />
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
