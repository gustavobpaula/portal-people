import { useId, type FormEvent, type InputHTMLAttributes } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "size"
> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
  submitLabel?: string;
  clearLabel?: string;
  loading?: boolean;
  error?: string;
}

export function SearchField({
  label,
  value,
  onValueChange,
  onSearch,
  submitLabel = "Buscar",
  clearLabel = "Limpar busca",
  loading = false,
  error,
  id,
  className,
  ...props
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value);
  };

  return (
    <form
      className={cx(styles.search, className)}
      role="search"
      onSubmit={submit}
    >
      <label className={styles.visuallyHidden} htmlFor={inputId}>
        {label}
      </label>
      <Icon name="search" />
      <input
        {...props}
        id={inputId}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId}
      />
      {value ? (
        <button
          className={styles.iconButton}
          type="button"
          onClick={() => onValueChange("")}
          aria-label={clearLabel}
        >
          <Icon name="close" />
        </button>
      ) : null}
      <Button type="submit" size="sm" loading={loading} loadingLabel="Buscando">
        {submitLabel}
      </Button>
      {error ? (
        <span id={errorId} className={styles.fieldError} role="alert">
          {error}
        </span>
      ) : null}
    </form>
  );
}
