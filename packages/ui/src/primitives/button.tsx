import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../utils/cn";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-foreground text-background hover:opacity-90",
  secondary:
    "border border-black/10 bg-white text-foreground hover:bg-black/[0.03] dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10",
  ghost: "text-foreground hover:bg-black/[0.04] dark:hover:bg-white/10",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
