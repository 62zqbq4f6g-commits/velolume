"use client";

import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "sm" | "md" | "lg" | "xl";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const roundedMap = {
  sm: "rounded-gummy-sm",
  md: "rounded-gummy",
  lg: "rounded-gummy-lg",
  xl: "rounded-gummy-xl",
};

export function GlassCard({
  children,
  className = "",
  hover = false,
  padding = "md",
  rounded = "md",
}: GlassCardProps) {
  return (
    <div
      className={`
        ${hover ? "glass-card-hover" : "glass-card"}
        ${paddingMap[padding]}
        ${roundedMap[rounded]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Glass Navigation Bar
export function GlassNav({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <nav className={`glass-nav ${className}`}>
      <div className="container-editorial py-4">
        {children}
      </div>
    </nav>
  );
}

// Glass Modal/Overlay
export function GlassOverlay({
  children,
  isOpen,
  onClose,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-velolume-600/80 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div className="relative glass-card rounded-gummy-lg p-8 max-w-lg w-full animate-scale-in">
        {children}
      </div>
    </div>
  );
}
