"use client";

import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "accent";
  className?: string;
}

const variantStyles = {
  default: "bg-mocha-500/15 text-mocha-400 border-mocha-500/20",
  success: "bg-green-500/15 text-green-400 border-green-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  accent: "bg-ivory-100/10 text-ivory-100 border-ivory-100/20",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-micro font-mono uppercase tracking-wider
        border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
