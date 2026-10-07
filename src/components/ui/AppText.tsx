import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/theme';
import { isMostlyArabic } from '@/utils/text';

export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyBold' | 'small' | 'tiny' | 'label';

const VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.serifBold, fontSize: 31, lineHeight: 39 },
  title: { fontFamily: fonts.serifBold, fontSize: 24, lineHeight: 31 },
  heading: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 26 },
  subheading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25 },
  bodyBold: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  tiny: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15, letterSpacing: 1.1, textTransform: 'uppercase' },
};

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  muted?: boolean;
  /** 'arabic' forces the Arabic font; 'auto' switches when the text is mostly Arabic. */
  script?: 'auto' | 'arabic';
}

export function AppText({ variant = 'body', color, align, muted, script = 'auto', style, children, ...rest }: AppTextProps) {
  const { c, scale } = useTheme();
  const base = VARIANTS[variant];
  const arabic = script === 'arabic' || (typeof children === 'string' && isMostlyArabic(children));
  const fontSize = (base.fontSize ?? 16) * scale;
  return (
    <Text
      {...rest}
      style={[
        base,
        { color: color ?? (muted ? c.textMuted : c.text), fontSize, lineHeight: (base.lineHeight ?? 22) * scale },
        arabic && { fontFamily: variant === 'body' || variant === 'small' ? fonts.arabic : fonts.arabicBold, lineHeight: fontSize * 1.8, writingDirection: 'rtl' },
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const textStyles = StyleSheet.create({ center: { textAlign: 'center' } });
