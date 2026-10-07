import { StyleSheet, Text } from 'react-native';

import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Honorific, Person } from '@/models';
import { fonts } from '@/theme';

import { AppText, type TextVariant } from './AppText';

/** Arabic honorifics as they are written after the name. */
export const HONORIFIC_TEXT: Record<Exclude<Honorific, 'none'>, string> = {
  saw: 'ﷺ',
  ra: 'رضي الله عنه',
  raha: 'رضي الله عنها',
  rh: 'رحمه الله',
};

/** A person's name followed by the appropriate honorific; screen readers hear the translated meaning. */
export function PersonName({ person, variant = 'bodyBold', color }: { person: Person; variant?: TextVariant; color?: string }) {
  const { t, l } = useI18n();
  const { c } = useTheme();
  const name = l(person.name);
  const honorific = person.honorific === 'none' ? null : person.honorific;
  const spoken = honorific ? `${name}, ${t(`honorific.${honorific}`)}` : name;
  return (
    <AppText variant={variant} color={color} accessibilityLabel={spoken}>
      {name}
      {honorific ? (
        <Text style={[styles.honorific, { color: color ?? c.accent }]}>{` ${HONORIFIC_TEXT[honorific]}`}</Text>
      ) : null}
    </AppText>
  );
}

const styles = StyleSheet.create({
  honorific: { fontFamily: fonts.arabic, fontSize: 15 },
});
