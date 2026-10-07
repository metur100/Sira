import type { BlockKind, Precision } from '@/models';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  /** Deep blue in light mode, warm gold in dark mode – used for primary buttons and highlights. */
  primary: string;
  onPrimary: string;
  /** Gold that is readable as text on the background. */
  accent: string;
  gold: string;
  goldSoft: string;
  night: string;
  onNight: string;
  onNightMuted: string;
  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  fact: string;
  factSoft: string;
  interpretation: string;
  interpretationSoft: string;
  reflection: string;
  reflectionSoft: string;
  mapLand: string;
  mapSea: string;
  mapLine: string;
  overlay: string;
}

const light: Palette = {
  background: '#F5EEDF',
  surface: '#FFFBF2',
  surfaceAlt: '#EFE5D1',
  border: '#DCCFB4',
  text: '#1A2238',
  textMuted: '#565C6F',
  primary: '#1C2A4A',
  onPrimary: '#FFFFFF',
  accent: '#8A6418',
  gold: '#C9A24D',
  goldSoft: '#F2E4C2',
  night: '#101830',
  onNight: '#F5EEDF',
  onNightMuted: '#BFC4D6',
  success: '#26704F',
  successSoft: '#DCEFE4',
  error: '#A8392D',
  errorSoft: '#F6DEDA',
  fact: '#235E7C',
  factSoft: '#DDEBF2',
  interpretation: '#8A5B0B',
  interpretationSoft: '#F6EAD0',
  reflection: '#6C4280',
  reflectionSoft: '#EDE2F2',
  mapLand: '#EADDC1',
  mapSea: '#C7D5DB',
  mapLine: '#B49A6A',
  overlay: 'rgba(10, 14, 30, 0.55)',
};

const dark: Palette = {
  background: '#0D1324',
  surface: '#151D33',
  surfaceAlt: '#1C2642',
  border: '#2B3657',
  text: '#EFE8D8',
  textMuted: '#A9B0C3',
  primary: '#D7B266',
  onPrimary: '#101830',
  accent: '#E2C27E',
  gold: '#D7B266',
  goldSoft: '#3A311C',
  night: '#080D1A',
  onNight: '#EFE8D8',
  onNightMuted: '#A9B0C3',
  success: '#71C99E',
  successSoft: '#173428',
  error: '#EC9184',
  errorSoft: '#3E201C',
  fact: '#86BEDB',
  factSoft: '#1B3142',
  interpretation: '#E6B95E',
  interpretationSoft: '#3A2F17',
  reflection: '#CDA6DE',
  reflectionSoft: '#32243C',
  mapLand: '#1F2A45',
  mapSea: '#111C30',
  mapLine: '#6F6550',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

/** High contrast: muted text becomes full-strength text and borders become stronger. */
function highContrast(p: Palette, isDark: boolean): Palette {
  return {
    ...p,
    textMuted: p.text,
    onNightMuted: p.onNight,
    border: isDark ? '#8A93B0' : '#6E6250',
    background: isDark ? '#000000' : '#FFFDF7',
    surface: isDark ? '#0B0F1C' : '#FFFFFF',
  };
}

export function palette(isDark: boolean, contrast: boolean): Palette {
  const base = isDark ? dark : light;
  return contrast ? highContrast(base, isDark) : base;
}

export const blockColors = (c: Palette, kind: BlockKind) =>
  kind === 'fact'
    ? { fg: c.fact, bg: c.factSoft }
    : kind === 'interpretation'
      ? { fg: c.interpretation, bg: c.interpretationSoft }
      : { fg: c.reflection, bg: c.reflectionSoft };

export const precisionColor = (c: Palette, precision: Precision) =>
  precision === 'historical' ? c.primary : precision === 'approximate' ? c.interpretation : c.textMuted;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;

export const fonts = {
  serif: 'Lora_600SemiBold',
  serifBold: 'Lora_700Bold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
} as const;

export const TOUCH_TARGET = 48;
