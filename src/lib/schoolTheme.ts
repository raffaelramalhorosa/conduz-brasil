/**
 * Utility to apply a driving school theme globally by overriding
 * both custom --school-* vars AND the shadcn/ui semantic CSS vars
 * (--background, --foreground, --card, etc.) so every component
 * reacts to the theme automatically.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToHsl(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function isLightBackground(bgColor: string): boolean {
  const [r, g, b] = hexToRgb(bgColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export interface SchoolThemeColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
}

export function applySchoolTheme(colors: SchoolThemeColors) {
  const root = document.documentElement;
  const isLight = isLightBackground(colors.background_color);

  // Custom school vars (used by sidebar/header inline styles)
  root.style.setProperty('--school-primary', colors.primary_color);
  root.style.setProperty('--school-secondary', colors.secondary_color);
  root.style.setProperty('--school-accent', colors.accent_color);
  root.style.setProperty('--school-bg', colors.background_color);

  // Text vars based on luminance
  if (isLight) {
    root.style.setProperty('--school-text', '#0F172A');
    root.style.setProperty('--school-text-secondary', 'rgba(15,23,42,0.6)');
    root.style.setProperty('--school-text-muted', 'rgba(15,23,42,0.4)');
  } else {
    root.style.setProperty('--school-text', '#F8FAFC');
    root.style.setProperty('--school-text-secondary', 'rgba(248,250,252,0.6)');
    root.style.setProperty('--school-text-muted', 'rgba(248,250,252,0.4)');
  }

  // Override shadcn semantic HSL vars so all components respond
  const bgHsl = hexToHsl(colors.background_color);
  const cardHsl = hexToHsl(colors.secondary_color);
  const primaryHsl = hexToHsl(colors.primary_color);
  const accentHsl = hexToHsl(colors.accent_color);
  const fgHsl = isLight ? '222 47% 11%' : '210 40% 98%';
  const mutedFgHsl = isLight ? '215 16% 47%' : '215 20% 65%';
  const borderHsl = isLight ? '214 32% 91%' : '217 19% 17%';

  root.style.setProperty('--background', bgHsl);
  root.style.setProperty('--foreground', fgHsl);
  root.style.setProperty('--card', cardHsl);
  root.style.setProperty('--card-foreground', fgHsl);
  root.style.setProperty('--popover', cardHsl);
  root.style.setProperty('--popover-foreground', fgHsl);
  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--primary-foreground', isLight ? '0 0% 100%' : '0 0% 100%');
  root.style.setProperty('--accent', accentHsl);
  root.style.setProperty('--accent-foreground', isLight ? '0 0% 0%' : '0 0% 100%');
  root.style.setProperty('--muted', isLight ? '210 40% 96%' : '217 19% 17%');
  root.style.setProperty('--muted-foreground', mutedFgHsl);
  root.style.setProperty('--border', borderHsl);
  root.style.setProperty('--input', borderHsl);
  root.style.setProperty('--ring', primaryHsl);

  // Sidebar vars
  root.style.setProperty('--sidebar', cardHsl);
  root.style.setProperty('--sidebar-foreground', fgHsl);
  root.style.setProperty('--sidebar-primary', primaryHsl);
  root.style.setProperty('--sidebar-accent', accentHsl);
  root.style.setProperty('--sidebar-border', borderHsl);
}

const SCHOOL_CSS_VARS = [
  '--school-primary', '--school-secondary', '--school-accent', '--school-bg',
  '--school-text', '--school-text-secondary', '--school-text-muted',
  '--background', '--foreground', '--card', '--card-foreground',
  '--popover', '--popover-foreground', '--primary', '--primary-foreground',
  '--accent', '--accent-foreground', '--muted', '--muted-foreground',
  '--border', '--input', '--ring',
  '--sidebar', '--sidebar-foreground', '--sidebar-primary', '--sidebar-accent', '--sidebar-border',
];

export function clearSchoolTheme() {
  const root = document.documentElement;
  SCHOOL_CSS_VARS.forEach(v => root.style.removeProperty(v));
}
