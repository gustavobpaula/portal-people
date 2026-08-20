import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      hint,
      error,
      className,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.fieldLabel}>
          {label}
        </label>
        <input
          {...props}
          ref={ref}
          id={inputId}
          className={cx(styles.input, className)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={
            [describedBy, hintId, errorId].filter(Boolean).join(" ") ||
            undefined
          }
        />
        {hint ? (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className={styles.fieldError} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);
