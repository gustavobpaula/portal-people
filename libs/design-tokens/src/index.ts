import "./tokens.scss";

export const themeNames = ["light"] as const;
export type ThemeName = (typeof themeNames)[number];

/** CSS Custom Property references exposed to consumers of the local token package. */
export const tokens = {
  color: {
    brand: "var(--ds-color-brand)",
    actionPrimary: "var(--ds-color-action-primary)",
    actionSecondary: "var(--ds-color-action-secondary)",
    surface: "var(--ds-color-surface)",
    surfaceSubtle: "var(--ds-color-surface-subtle)",
    surfaceInverse: "var(--ds-color-surface-inverse)",
    text: "var(--ds-color-text)",
    textMuted: "var(--ds-color-text-muted)",
    textInverse: "var(--ds-color-text-inverse)",
    border: "var(--ds-color-border)",
    focus: "var(--ds-color-focus)",
    info: "var(--ds-color-info)",
    success: "var(--ds-color-success)",
    warning: "var(--ds-color-warning)",
    danger: "var(--ds-color-danger)",
  },
  space: {
    xs: "var(--ds-space-xs)",
    sm: "var(--ds-space-sm)",
    md: "var(--ds-space-md)",
    lg: "var(--ds-space-lg)",
    xl: "var(--ds-space-xl)",
  },
  radius: {
    sm: "var(--ds-radius-sm)",
    md: "var(--ds-radius-md)",
    lg: "var(--ds-radius-lg)",
  },
  shadow: {
    sm: "var(--ds-shadow-sm)",
    md: "var(--ds-shadow-md)",
    lg: "var(--ds-shadow-lg)",
  },
  motion: { fast: "var(--ds-motion-fast)", normal: "var(--ds-motion-normal)" },
} as const;
