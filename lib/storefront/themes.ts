/**
 * Velolume Storefront Theme System
 *
 * "Velolume Noir" - New York Soho Agency Aesthetic
 *
 * Design Philosophy:
 * - Neo-Deco minimalism with asymmetric layouts
 * - "After-Dark" cinematic drama
 * - Editorial identity over utility
 * - "Gimme Gummy" tactile UI
 */

export interface ThemeColors {
  // Core palette
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceGlass: string;

  // Text
  text: string;
  textMuted: string;
  textAccent: string;

  // Accents
  accent: string;
  accentHover: string;
  accentMuted: string;

  // Semantic
  success: string;
  warning: string;
  error: string;

  // Borders & Shadows
  border: string;
  borderGlass: string;
  shadow: string;
}

export interface ThemeTypography {
  // Font families
  fontSerif: string;
  fontMono: string;
  fontSans: string;

  // Font weights
  weightLight: number;
  weightNormal: number;
  weightMedium: number;
  weightBold: number;
  weightBlack: number;
}

export interface ThemeSpacing {
  // Asymmetric spacing multipliers
  asymmetricOffset: string;
  breathingRoom: string;
  editorialGap: string;
  galleryGutter: string;
}

export interface ThemeEffects {
  // Glass morphism
  glassBlur: string;
  glassOpacity: string;

  // Shadows
  shadowSoft: string;
  shadowDramatic: string;
  shadowGummy: string;

  // Transitions
  transitionFast: string;
  transitionMedium: string;
  transitionSlow: string;
}

export interface Theme {
  name: string;
  slug: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  effects: ThemeEffects;
}

// ============================================================================
// VELOLUME NOIR - The Flagship Soho Theme
// ============================================================================

export const velolumeNoir: Theme = {
  name: "Velolume Noir",
  slug: "velolume-noir",
  description: "New York Soho agency aesthetic. Neo-Deco minimalism with cinematic drama.",

  colors: {
    // Core - Dirty Purple foundation
    background: "#3D2B3D",        // Dirty Purple - deep raisin
    backgroundAlt: "#2D1F2D",     // Darker variation
    surface: "#4A3649",           // Elevated surface
    surfaceGlass: "rgba(61, 43, 61, 0.7)", // Frosted plum

    // Text - Off-white hierarchy
    text: "#F5F5F5",              // Primary text - warm off-white
    textMuted: "#B8A8B8",         // Secondary text - muted lavender
    textAccent: "#A38A7E",        // Accent text - Mocha Mousse

    // Accents - Mocha Mousse warmth
    accent: "#A38A7E",            // Mocha Mousse - 2025 Pantone inspired
    accentHover: "#BFA393",       // Lighter mocha on hover
    accentMuted: "#7A6A62",       // Subdued mocha

    // Semantic
    success: "#7A9E7A",           // Muted sage
    warning: "#C4A35A",           // Antique gold
    error: "#A35A5A",             // Dusty rose

    // Borders & Shadows
    border: "rgba(245, 245, 245, 0.1)",
    borderGlass: "rgba(245, 245, 245, 0.15)",
    shadow: "rgba(0, 0, 0, 0.4)",
  },

  typography: {
    // Serif for editorial headers - "Artistic Vision"
    fontSerif: "'Playfair Display', 'Young Serif', Georgia, serif",
    // Mono for data precision - "Technical Authority"
    fontMono: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    // Sans for body - clean readability
    fontSans: "'Inter', 'SF Pro Display', system-ui, sans-serif",

    weightLight: 300,
    weightNormal: 400,
    weightMedium: 500,
    weightBold: 700,
    weightBlack: 900,
  },

  spacing: {
    // Asymmetric offsets for gallery feel
    asymmetricOffset: "clamp(2rem, 8vw, 6rem)",
    breathingRoom: "clamp(3rem, 10vh, 8rem)",
    editorialGap: "clamp(1.5rem, 4vw, 3rem)",
    galleryGutter: "clamp(1rem, 3vw, 2rem)",
  },

  effects: {
    // Glass morphism - frosted plum overlays
    glassBlur: "blur(16px)",
    glassOpacity: "0.7",

    // Shadows - "Gimme Gummy" soft depth
    shadowSoft: "0 4px 20px rgba(0, 0, 0, 0.15)",
    shadowDramatic: "0 8px 40px rgba(0, 0, 0, 0.3)",
    shadowGummy: "0 8px 32px rgba(163, 138, 126, 0.2)", // Mocha-tinted

    // Transitions - smooth, editorial pace
    transitionFast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    transitionMedium: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    transitionSlow: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// ============================================================================
// Theme Variations
// ============================================================================

export const velolumeDay: Theme = {
  ...velolumeNoir,
  name: "Velolume Day",
  slug: "velolume-day",
  description: "Light mode variation with warm ivory foundation.",

  colors: {
    ...velolumeNoir.colors,
    background: "#FAF8F5",        // Warm ivory
    backgroundAlt: "#F0EDE8",     // Slightly darker
    surface: "#FFFFFF",           // Pure white cards
    surfaceGlass: "rgba(255, 255, 255, 0.8)",

    text: "#2D1F2D",              // Dark purple text
    textMuted: "#6B5A6B",         // Muted purple
    textAccent: "#8B7355",        // Darker mocha

    border: "rgba(45, 31, 45, 0.1)",
    borderGlass: "rgba(45, 31, 45, 0.08)",
    shadow: "rgba(45, 31, 45, 0.1)",
  },
};

// ============================================================================
// Theme Registry & Utilities
// ============================================================================

export const themes: Record<string, Theme> = {
  "velolume-noir": velolumeNoir,
  "velolume-day": velolumeDay,
};

export const defaultTheme = velolumeNoir;

export function getTheme(slug: string): Theme {
  return themes[slug] || defaultTheme;
}

/**
 * Generate CSS custom properties from theme
 */
export function themeToCSSVariables(theme: Theme): Record<string, string> {
  return {
    // Colors
    "--color-background": theme.colors.background,
    "--color-background-alt": theme.colors.backgroundAlt,
    "--color-surface": theme.colors.surface,
    "--color-surface-glass": theme.colors.surfaceGlass,
    "--color-text": theme.colors.text,
    "--color-text-muted": theme.colors.textMuted,
    "--color-text-accent": theme.colors.textAccent,
    "--color-accent": theme.colors.accent,
    "--color-accent-hover": theme.colors.accentHover,
    "--color-accent-muted": theme.colors.accentMuted,
    "--color-success": theme.colors.success,
    "--color-warning": theme.colors.warning,
    "--color-error": theme.colors.error,
    "--color-border": theme.colors.border,
    "--color-border-glass": theme.colors.borderGlass,
    "--color-shadow": theme.colors.shadow,

    // Typography
    "--font-serif": theme.typography.fontSerif,
    "--font-mono": theme.typography.fontMono,
    "--font-sans": theme.typography.fontSans,

    // Spacing
    "--spacing-asymmetric": theme.spacing.asymmetricOffset,
    "--spacing-breathing": theme.spacing.breathingRoom,
    "--spacing-editorial": theme.spacing.editorialGap,
    "--spacing-gallery": theme.spacing.galleryGutter,

    // Effects
    "--glass-blur": theme.effects.glassBlur,
    "--shadow-soft": theme.effects.shadowSoft,
    "--shadow-dramatic": theme.effects.shadowDramatic,
    "--shadow-gummy": theme.effects.shadowGummy,
    "--transition-fast": theme.effects.transitionFast,
    "--transition-medium": theme.effects.transitionMedium,
    "--transition-slow": theme.effects.transitionSlow,
  };
}

/**
 * Get Tailwind-compatible color config
 */
export function themeToTailwindColors(theme: Theme) {
  return {
    velolume: {
      bg: theme.colors.background,
      "bg-alt": theme.colors.backgroundAlt,
      surface: theme.colors.surface,
      text: theme.colors.text,
      "text-muted": theme.colors.textMuted,
      accent: theme.colors.accent,
      "accent-hover": theme.colors.accentHover,
      mocha: theme.colors.accent,
      border: theme.colors.border,
    },
  };
}
