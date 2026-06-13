import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { Badge } from '@/components/common/Badge';
import {
  BoltIcon,
  GithubIcon,
  PlaygroundIcon,
  RegexIcon,
  SettingsIcon,
} from '@/components/common/icons';
import { GITHUB_URL, ROUTES } from '@/constants/routes';

import styles from './AppShell.module.scss';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { to: ROUTES.playground, label: 'Playground', icon: <PlaygroundIcon />, end: true },
  { to: ROUTES.regexLens, label: 'Regex Lens', icon: <RegexIcon /> },
];

const buildNavClass = ({ isActive }: { isActive: boolean }): string =>
  [styles.navItem, isActive && styles.navItemActive].filter(Boolean).join(' ');

/**
 * 앱 전체 레이아웃.
 * 좌측 고정 네비 + 우측 콘텐츠(Outlet) 구조. 라우트는 이 셸 안에서 전환된다.
 */
export const AppShell = () => (
  <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <BoltIcon width={20} height={20} />
        </span>
        <div className={styles.brandText}>
          <strong>Lumen</strong>
          <span>Visual AI Workbench</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navGroupLabel}>워크스페이스</p>
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={buildNavClass}>
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <p className={styles.navGroupLabel}>설정</p>
        <NavLink to={ROUTES.settings} className={buildNavClass}>
          <span className={styles.navIcon}>
            <SettingsIcon />
          </span>
          API 키 / 설정
        </NavLink>
      </nav>

      <div className={styles.sidebarFooter}>
        <Badge tone="accent" dot>
          Local-first
        </Badge>
        <a className={styles.ghLink} href={GITHUB_URL} target="_blank" rel="noreferrer">
          <GithubIcon width={16} height={16} />
          GitHub
        </a>
      </div>
    </aside>

    <main className={styles.content}>
      <Outlet />
    </main>
  </div>
);
