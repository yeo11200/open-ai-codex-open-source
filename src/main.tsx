import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { router } from '@/app/router';
import '@/styles/global.scss';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('루트 엘리먼트(#root)를 찾을 수 없습니다.');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
    {/* Vercel 방문자/페이지뷰 집계 + Web Vitals 성능 측정. 화면에는 렌더되지 않는다. */}
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
