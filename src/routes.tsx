import type { ReactNode } from 'react';
import PrismExtract from './pages/PrismExtract';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Prism Extract',
    path: '/',
    element: <PrismExtract />
  }
];

export default routes;
