import { createElement, type HTMLAttributes } from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";

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
