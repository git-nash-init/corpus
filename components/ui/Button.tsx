import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "default" | "primary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  default: "",
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};
const sizeClass: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  className?: string;
  children?: ReactNode;
}

export function buttonClass({ variant = "default", size = "md", icon, className = "" }: Common) {
  return `btn ${variantClass[variant]} ${sizeClass[size]} ${icon ? "btn-icon" : ""} ${className}`.replace(/\s+/g, " ").trim();
}

export function Button({ variant, size, icon, className, children, type = "button", ...rest }: Common & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass({ variant, size, icon, className })} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ variant, size, icon, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, icon, className })} {...rest}>
      {children}
    </Link>
  );
}
