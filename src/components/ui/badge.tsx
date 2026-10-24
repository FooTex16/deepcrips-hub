import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-2 text-text-muted",
  info: "border-brand/30 bg-brand-soft text-brand",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  brand: "border-brand/40 bg-brand/10 text-brand",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ReactNode;
}

/**
 * Badge dengan teks label selalu terbaca — status tidak disampaikan lewat
 * warna saja (accessibility).
 */
export function Badge({ className, tone = "neutral", icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn("badge", toneStyles[tone], className)} {...props}>
      {icon}
      {children}
    </span>
  );
}
