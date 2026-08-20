import type { HTMLAttributes } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({
  size = "md",
  label,
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      className={cx(styles.spinner, styles[`spinner_${size}`], className)}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className={styles.spinnerMark} />
      {label ? <span className={styles.visuallyHidden}>{label}</span> : null}
    </span>
  );
}
