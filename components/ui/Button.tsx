import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-white shadow-md hover:bg-brand-dark hover:shadow-lg active:scale-[0.97]",
  secondary: "bg-surface text-ink border border-border-strong shadow-sm hover:bg-paper hover:border-brand/40 active:scale-[0.97]",
  ghost: "bg-transparent text-ink hover:bg-black/5 active:scale-[0.97]",
  danger: "bg-danger text-white shadow-md hover:opacity-90 active:scale-[0.97]",
  gold: "bg-accent text-ink shadow-md hover:brightness-95 active:scale-[0.97]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-sm rounded-lg gap-1.5",
  md: "px-4 py-3 text-base rounded-xl gap-2",
  lg: "px-6 py-4 text-lg font-bold rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "touch-target no-select inline-flex items-center justify-center font-semibold transition-all duration-150",
          variantClasses[variant],
          sizeClasses[size],
          "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none",
          className
        )}
        {...props}
      >
        {loading && <Spinner className={variant === "primary" || variant === "danger" ? "text-white" : "text-ink"} />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
