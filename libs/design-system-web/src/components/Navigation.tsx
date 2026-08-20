import type { HTMLAttributes, MouseEvent } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Icon, type IconName } from "./Icon";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: IconName;
  current?: boolean;
  disabled?: boolean;
}

export interface NavigationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "onSelect"
> {
  label: string;
  items: NavigationItem[];
  orientation?: "horizontal" | "vertical";
  onNavigate?: (
    item: NavigationItem,
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
}

export function Navigation({
  label,
  items,
  orientation = "horizontal",
  onNavigate,
  className,
  ...props
}: NavigationProps) {
  return (
    <nav
      {...props}
      className={cx(
        styles.navigation,
        styles[`navigation_${orientation}`],
        className,
      )}
      aria-label={label}
    >
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.disabled ? (
              <span className={styles.navDisabled} aria-disabled="true">
                {item.icon ? <Icon name={item.icon} /> : null}
                {item.label}
              </span>
            ) : (
              <a
                href={item.href}
                aria-current={item.current ? "page" : undefined}
                onClick={(event) => onNavigate?.(item, event)}
              >
                {item.icon ? <Icon name={item.icon} /> : null}
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
