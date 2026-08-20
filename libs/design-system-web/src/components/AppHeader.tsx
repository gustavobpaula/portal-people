import {
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Icon } from "./Icon";
import {
  Navigation,
  type NavigationItem,
  type NavigationProps,
} from "./Navigation";

export interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
  brand?: string;
  homeHref?: string;
  navigationItems?: NavigationItem[];
  onNavigate?: NavigationProps["onNavigate"];
  onHomeNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
  actions?: ReactNode;
  menuLabel?: string;
}

export function AppHeader({
  brand = "Portal Pessoas",
  homeHref = "/",
  navigationItems = [],
  onNavigate,
  onHomeNavigate,
  actions,
  menuLabel = "Abrir navegação",
  className,
  ...props
}: AppHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header {...props} className={cx(styles.header, className)}>
      <div className={styles.headerBar}>
        <a className={styles.brand} href={homeHref} onClick={onHomeNavigate}>
          {brand}
        </a>
        {navigationItems.length ? (
          <button
            type="button"
            className={cx(styles.iconButton, styles.menuButton)}
            aria-label={menuLabel}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name="menu" />
          </button>
        ) : null}
        <div className={styles.headerActions}>{actions}</div>
      </div>
      {navigationItems.length ? (
        <Navigation
          label="Navegação principal"
          items={navigationItems}
          onNavigate={onNavigate}
          className={cx(
            styles.headerNavigation,
            open && styles.headerNavigation_open,
          )}
        />
      ) : null}
    </header>
  );
}
