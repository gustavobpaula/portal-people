import {
  createElement,
  forwardRef,
  useId,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type FormEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { tokens } from "@portal/design-tokens";
import styles from "./components.module.scss";

export { themeNames, tokens, type ThemeName } from "@portal/design-tokens";
const cx = (...names: Array<string | false | undefined>) =>
  names.filter(Boolean).join(" ");

export type TextVariant = "display" | "heading" | "body" | "label" | "caption";
export type TextTone = "default" | "muted" | "inverse" | "danger" | "success";
export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
  variant?: TextVariant;
  tone?: TextTone;
  weight?: "regular" | "semibold" | "bold";
}
export function Text({
  as = "p",
  variant = "body",
  tone = "default",
  weight = "regular",
  className,
  ...props
}: TextProps) {
  return createElement(as, {
    ...props,
    className: cx(
      styles.text,
      styles[`text_${variant}`],
      styles[`text_${tone}`],
      styles[`text_${weight}`],
      className,
    ),
  });
}

export type IconName =
  | "menu"
  | "search"
  | "bell"
  | "chevron-right"
  | "close"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "calendar"
  | "gift"
  | "arrow-left";
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: IconName;
  size?: "sm" | "md" | "lg";
  label?: string;
}
const ICON_PATHS: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M12 9v11M3 9h18M12 9c-4 0-5-5-2-5 2 0 2 3 2 5Zm0 0c4 0 5-5 2-5-2 0-2 3-2 5Z" />
    </>
  ),
  "arrow-left": <path d="M19 12H5m6 6-6-6 6-6" />,
};
export function Icon({
  name,
  size = "md",
  label,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      {...props}
      className={cx(styles.icon, styles[`icon_${size}`], className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

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

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "article" | "div" | "aside";
  tone?: "default" | "subtle" | "inverse";
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "sm" | "md" | "lg";
  elevation?: 0 | 1 | 2;
}
export function Surface({
  as = "div",
  tone = "default",
  padding = "md",
  radius = "md",
  elevation = 0,
  className,
  ...props
}: SurfaceProps) {
  return createElement(as, {
    ...props,
    className: cx(
      styles.surface,
      styles[`surface_${tone}`],
      styles[`surface_padding_${padding}`],
      styles[`surface_radius_${radius}`],
      styles[`surface_elevation_${elevation}`],
      className,
    ),
  });
}
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
export interface AppHeaderProps extends HTMLAttributes<HTMLElement> {
  brand?: string;
  homeHref?: string;
  navigationItems?: NavigationItem[];
  actions?: ReactNode;
  menuLabel?: string;
}
export function AppHeader({
  brand = "Portal Pessoas",
  homeHref = "/",
  navigationItems = [],
  actions,
  menuLabel = "Abrir navegação",
  className,
  ...props
}: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <header {...props} className={cx(styles.header, className)}>
      <div className={styles.headerBar}>
        <a className={styles.brand} href={homeHref}>
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
          className={cx(
            styles.headerNavigation,
            open && styles.headerNavigation_open,
          )}
        />
      ) : null}
    </header>
  );
}
export interface JourneyCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
  description: string;
  icon?: IconName;
  eyebrow?: string;
  badge?: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}
export const JourneyCard = forwardRef<HTMLAnchorElement, JourneyCardProps>(
  function JourneyCard(
    {
      title,
      description,
      icon = "chevron-right",
      eyebrow,
      badge,
      onNavigate,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <a
        {...props}
        ref={ref}
        className={cx(styles.journeyCard, className)}
        onClick={onNavigate}
      >
        <span className={styles.journeyIcon}>
          <Icon name={icon} />
        </span>
        <span className={styles.journeyContent}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <Text as="span" variant="label" weight="bold">
            {title}
          </Text>
          <span className={styles.journeyDescription}>{description}</span>
          {children}
        </span>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        <Icon name="chevron-right" />
      </a>
    );
  },
);
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
export { tokens as tokenReferences };
