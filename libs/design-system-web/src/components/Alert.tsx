import type { HTMLAttributes } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Icon } from "./Icon";
import { Text } from "./Text";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "error";
  title: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function Alert({
  tone = "info",
  title,
  onDismiss,
  dismissLabel = "Fechar alerta",
  className,
  children,
  ...props
}: AlertProps) {
  const iconName =
    tone === "error"
      ? "error"
      : tone === "success"
        ? "success"
        : tone === "warning"
          ? "warning"
          : "info";

  return (
    <div
      {...props}
      className={cx(styles.alert, styles[`alert_${tone}`], className)}
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
    >
      <Icon name={iconName} />
      <div>
        <Text as="h2" variant="label" weight="bold">
          {title}
        </Text>
        {children ? <div className={styles.alertBody}>{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          className={styles.iconButton}
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <Icon name="close" />
        </button>
      ) : null}
    </div>
  );
}
