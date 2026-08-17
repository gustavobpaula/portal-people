import type { ButtonHTMLAttributes } from "react";
import { tokens } from "@portal/design-tokens";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        background: tokens.color.brand,
        color: tokens.color.surface,
        padding: tokens.space.sm,
      }}
    />
  );
}
