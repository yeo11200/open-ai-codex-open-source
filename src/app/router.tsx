import { createHashRouter } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { ROUTES } from '@/constants/routes';
import { PlaygroundView } from '@/features/playground';
import { RegexLensView } from '@/features/regex-lens';
import { SettingsView } from '@/features/settings';

/**
 * HashRouter를 사용해 정적 호스팅(GitHub Pages)에서도 새로고침/딥링크가 깨지지 않게 한다.
 * 공유 링크도 해시 기반으로 인코딩된다.
 */
export const router = createHashRouter([
  {
    path: ROUTES.playground,
    element: <AppShell />,
    children: [
      { index: true, element: <PlaygroundView /> },
      { path: ROUTES.regexLens, element: <RegexLensView /> },
      { path: ROUTES.settings, element: <SettingsView /> },
    ],
  },
]);
