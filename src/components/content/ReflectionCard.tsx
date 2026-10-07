import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { inputStyle } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import { HistoricalCard } from '@/components/ui/Layout';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { ReflectionQuestion } from '@/models';
import { useAppStore } from '@/store/appStore';
import { radius, spacing } from '@/theme';

import { KindTag } from './Blocks';

/**
 * THINK ABOUT IT: write a reflection, choose a ready-made one, or simply continue.
 * Reflections are saved locally and never evaluated.
 */
export function ReflectionCard({ question, episodeId }: { question: ReflectionQuestion; episodeId: string }) {
  const { c, scale } = useTheme();
  const { t, l } = useI18n();
  const saved = useAppStore((s) => s.app.reflections[question.id]);
  const saveReflection = useAppStore((s) => s.saveReflection);
  const [text, setText] = useState(saved?.text ?? '');
  const [option, setOption] = useState<number | null>(saved?.optionIndex ?? null);
  const dirty = text.trim() !== (saved?.text ?? '') || option !== (saved?.optionIndex ?? null);

  const save = () => saveReflection({ questionId: question.id, episodeId, text, optionIndex: option });

  return (
    <HistoricalCard tone="alt">
      <KindTag kind="reflection" />
      <AppText variant="heading">{l(question.prompt)}</AppText>

      <AppText variant="label" muted>
        {t('reflection.select')}
      </AppText>
      <View style={styles.options} accessibilityRole="radiogroup">
        {question.options.map((o, i) => {
          const active = option === i;
          return (
            <Pressable
              key={i}
              onPress={() => setOption(active ? null : i)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={l(o)}
              style={[styles.option, { borderColor: active ? c.reflection : c.border, backgroundColor: active ? c.reflectionSoft : c.surface }]}
            >
              <Icon name={active ? 'check' : 'feather'} size={18} color={active ? c.reflection : c.textMuted} />
              <AppText variant="body" style={styles.flex}>
                {l(o)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText variant="label" muted>
        {t('reflection.write')}
      </AppText>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('reflection.placeholder')}
        placeholderTextColor={c.textMuted}
        multiline
        maxLength={2000}
        accessibilityLabel={t('reflection.write')}
        style={[inputStyle(c), { fontSize: 16 * scale }]}
      />
      <View style={styles.row}>
        <Button label={saved && !dirty ? t('reflection.saved') : t('reflection.save')} icon={saved && !dirty ? 'check' : 'feather'} onPress={save} disabled={!dirty} style={styles.flex} compact />
        {saved ? (
          <Button
            label={t('reflection.clear')}
            variant="ghost"
            compact
            onPress={() => {
              setText('');
              setOption(null);
              saveReflection({ questionId: question.id, episodeId, text: '', optionIndex: null });
            }}
          />
        ) : null}
      </View>
      <AppText variant="tiny" muted>
        {t('reflection.note')}
      </AppText>
    </HistoricalCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  options: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.md, minHeight: 52 },
});
