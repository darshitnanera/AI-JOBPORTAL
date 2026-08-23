/**
 * Design Tokens System
 * Centralized design values used across the application
 */

export const colors = {
  // Primary
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  // Secondary
  secondary: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },
  // Success
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#145231",
    950: "#052e16",
  },
  // Error
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#4c0519",
  },
  // Warning
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  // Neutral
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
};

export const typography = {
  fontFamily: {
    sans: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ],
    mono: [
      '"SF Mono"',
      '"Monaco"',
      '"Fira Code"',
      '"Roboto Mono"',
      '"Courier New"',
      "monospace",
    ],
  },
  fontSize: {
    // Headings
    h1: { size: "3rem", weight: 700, lineHeight: 1.2 },
    h2: { size: "2.25rem", weight: 700, lineHeight: 1.3 },
    h3: { size: "1.875rem", weight: 600, lineHeight: 1.3 },
    h4: { size: "1.5rem", weight: 600, lineHeight: 1.4 },
    h5: { size: "1.25rem", weight: 600, lineHeight: 1.4 },
    h6: { size: "1rem", weight: 600, lineHeight: 1.5 },
    // Body
    body: { size: "1rem", weight: 400, lineHeight: 1.5 },
    "body-sm": { size: "0.875rem", weight: 400, lineHeight: 1.5 },
    "body-lg": { size: "1.125rem", weight: 400, lineHeight: 1.75 },
    // Caption
    caption: { size: "0.75rem", weight: 500, lineHeight: 1.5 },
  },
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
  "4xl": "6rem",
};

export const shadows = {
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
};

export const borders = {
  radius: {
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  width: {
    thin: "1px",
    base: "2px",
    thick: "4px",
  },
};

export const animations = {
  duration: {
    fast: "75ms",
    base: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
  easing: {
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    linear: "linear",
  },
};

/**
 * CSS Variables for theming
 * Can be injected into document root for dynamic theming
 */
export const getCSSVariables = (theme = "light") => {
  const isDark = theme === "dark";
  return `
    :root {
      /* Colors */
      --color-primary-500: ${colors.primary[500]};
      --color-primary-600: ${colors.primary[600]};
      --color-primary-700: ${colors.primary[700]};

      --color-secondary-500: ${colors.secondary[500]};
      --color-secondary-600: ${colors.secondary[600]};

      --color-success-500: ${colors.success[500]};
      --color-success-600: ${colors.success[600]};

      --color-error-500: ${colors.error[500]};
      --color-error-600: ${colors.error[600]};

      --color-warning-500: ${colors.warning[500]};
      --color-warning-600: ${colors.warning[600]};

      --color-text: ${isDark ? colors.neutral[100] : colors.neutral[900]};
      --color-text-secondary: ${isDark ? colors.neutral[400] : colors.neutral[600]};
      --color-bg: ${isDark ? colors.neutral[950] : colors.neutral[50]};
      --color-bg-secondary: ${isDark ? colors.neutral[900] : colors.neutral[100]};
      --color-border: ${isDark ? colors.neutral[800] : colors.neutral[200]};

      /* Typography */
      --font-family-sans: ${typography.fontFamily.sans.join(", ")};
      --font-family-mono: ${typography.fontFamily.mono.join(", ")};

      /* Spacing */
      --space-xs: ${spacing.xs};
      --space-sm: ${spacing.sm};
      --space-md: ${spacing.md};
      --space-lg: ${spacing.lg};
      --space-xl: ${spacing.xl};
      --space-2xl: ${spacing["2xl"]};

      /* Shadows */
      --shadow-md: ${shadows.md};
      --shadow-lg: ${shadows.lg};

      /* Transitions */
      --transition-fast: all ${animations.duration.fast} ${animations.easing.inOut};
      --transition-base: all ${animations.duration.base} ${animations.easing.inOut};
      --transition-normal: all ${animations.duration.normal} ${animations.easing.inOut};
    }
  `;
};
