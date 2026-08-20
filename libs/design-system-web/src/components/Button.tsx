import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      startIcon,
      endIcon,
      loading = false,
      loadingLabel = "Carregando",
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        className={cx(
          styles.button,
          styles[`button_${variant}`],
          styles[`button_${size}`],
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading ? <Spinner size="sm" label={loadingLabel} /> : startIcon}
        <span>{children}</span>
        {!loading && endIcon}
      </button>
    );
  },
);
