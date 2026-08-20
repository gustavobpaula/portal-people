import { createElement, type HTMLAttributes } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";

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
