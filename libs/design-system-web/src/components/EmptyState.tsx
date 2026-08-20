import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface EmptyStateProps extends HTMLAttributes<HTMLElement> {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = "info",
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <section {...props} className={cx(styles.emptyState, className)}>
      <Icon name={icon} size="lg" />
      <Text as="h2" variant="heading">
        {title}
      </Text>
      {description ? <Text tone="muted">{description}</Text> : null}
      {action}
    </section>
  );
}
