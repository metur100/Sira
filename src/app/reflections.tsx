import { StyleSheet, View } from 'react-native';

import { ReflectionCard } from '@/components/content/ReflectionCard';
import { AppText } from '@/components/ui/AppText';
import { EmptyState, Screen, TopBar } from '@/components/ui/Layout';
import { EPISODES } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

/** All saved reflections, grouped by episode, editable in place. */
export default function ReflectionsScreen() {
  const { t, l } = useI18n();
  const reflections = useAppStore((s) => s.app.reflections);
  const episodes = EPISODES.filter((e) => e.reflectionQuestions.some((q) => reflections[q.id]));

  return (
    <Screen header={<TopBar title={t('profile.reflections')} />}>
      <AppText variant="small" muted>
        {t('reflection.note')}
      </AppText>
      {episodes.length === 0 ? (
        <EmptyState icon="feather" title={t('profile.reflections')} body={t('reflection.note')} />
      ) : (
        episodes.map((e) => (
          <View key={e.id} style={styles.section}>
            <AppText variant="label" muted accessibilityRole="header">
              {t('episode.label', { number: e.order })} · {l(e.title)}
            </AppText>
            {e.reflectionQuestions
              .filter((q) => reflections[q.id])
              .map((q) => (
                <ReflectionCard key={q.id} question={q} episodeId={e.id} />
              ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
