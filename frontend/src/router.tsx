import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './ui/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { WarrantiesPage } from './pages/WarrantiesPage';
import { GeographyPage } from './pages/GeographyPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { InsightsPage } from './pages/InsightsPage';
import { IntroPage } from './pages/IntroPage';
import { ErrorBoundary } from './ui/components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <IntroPage />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <ErrorBoundary><OverviewPage /></ErrorBoundary> },
      { path: 'warranties', element: <ErrorBoundary><WarrantiesPage /></ErrorBoundary> },
      { path: 'geography', element: <ErrorBoundary><GeographyPage /></ErrorBoundary> },
      { path: 'vehicles', element: <ErrorBoundary><VehiclesPage /></ErrorBoundary> },
      { path: 'anomalies', element: <ErrorBoundary><AnomaliesPage /></ErrorBoundary> },
      { path: 'claims', element: <ErrorBoundary><ClaimsPage /></ErrorBoundary> },
      { path: 'insights', element: <ErrorBoundary><InsightsPage /></ErrorBoundary> },
    ],
  },
]);
