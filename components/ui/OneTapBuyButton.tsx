"use client";

import Link from "next/link";

interface OneTapBuyButtonProps {
  href: string;
  price?: string;
  platform?: "tiktok" | "shopee" | "taobao" | "generic";
  className?: string;
  children?: React.ReactNode;
}

const platformLabels = {
  tiktok: "Buy on TikTok Shop",
  shopee: "Buy on Shopee",
  taobao: "Buy on Taobao",
  generic: "Buy Now",
};

const platformIcons = {
  tiktok: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  ),
  shopee: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  ),
  taobao: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  generic: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="square" strokeLinejoin="miter" d="M3 3h18v18H3z"/>
      <path d="M9 9h6v6H9z"/>
    </svg>
  ),
};

export function OneTapBuyButton({
  href,
  price,
  platform = "generic",
  className = "",
  children,
}: OneTapBuyButtonProps) {
  const isExternal = href.startsWith("http");

  const buttonContent = (
    <>
      {/* Sharp minimalist tag design */}
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-3">
          {platformIcons[platform]}
          <span className="font-mono text-sm uppercase tracking-wider">
            {children || platformLabels[platform]}
          </span>
        </div>
        {price && (
          <span className="font-mono text-lg font-semibold">
            {price}
          </span>
        )}
      </div>
    </>
  );

  const buttonClasses = `
    one-tap-buy
    block w-full px-6 py-4
    bg-mocha-500 text-ivory-100
    font-mono uppercase tracking-wider
    transition-all duration-200
    hover:bg-mocha-400 hover:shadow-lg
    active:translate-y-px
    ${className}
  `;

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <Link href={href} className={buttonClasses}>
      {buttonContent}
    </Link>
  );
}

// Compact variant for product cards
export function OneTapBuyButtonCompact({
  href,
  platform = "generic",
  className = "",
}: Omit<OneTapBuyButtonProps, "price" | "children">) {
  const isExternal = href.startsWith("http");

  const buttonClasses = `
    one-tap-buy-compact
    inline-flex items-center gap-2 px-4 py-2
    bg-mocha-500 text-ivory-100
    font-mono text-xs uppercase tracking-wider
    transition-all duration-200
    hover:bg-mocha-400
    active:translate-y-px
    ${className}
  `;

  const content = (
    <>
      {platformIcons[platform]}
      <span>Buy</span>
    </>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={buttonClasses}>
      {content}
    </Link>
  );
}
