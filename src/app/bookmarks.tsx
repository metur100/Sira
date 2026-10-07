import { StyleSheet, View } from 'react-native';

import { SourceCard } from '@/components/content/Blocks';
import { ConnectionCard } from '@/components/content/Cards';
import { AppText } from '@/components/ui/AppText';
import { EmptyState, Screen, TopBar } from '@/components/ui/Layout';
import { getSource } from '@/content';
import { useI18n } from '@/hooks/useI18n';
import type { BookmarkType } from '@/models';
import { useAppStore } from '@/store/appStore';
import { spacing } from '@/theme';

const ORDER: readonly BookmarkType[] = ['episode', 'event', 'person', 'place', 'source'];

/** My Bookmarks – episodes, events, people, places and sources. */
export default function BookmarksScreen() {
  const { t } = useI18n();
  const bookmarks = useAppStore((s) => s.app.bookmarks);

  return (
    <Screen header={<TopBar title={t('bookmarks.title')} />}>
      {bookmarks.length === 0 ? (
        <EmptyState icon="bookmark" title={t('bookmarks.title')} body={t('bookmarks.empty')} />
      ) : (
        ORDER.map((type) => {
          const items = bookmarks.filter((b) => b.type === type);
          if (!items.length) return null;
          return (
            <View key={type} style={styles.section}>
              <AppText variant="label" muted accessibilityRole="header">
                {t(`type.${type}`)} · {items.length}
              </AppText>
              {items.map((b) => {
                if (b.type === 'source') {
                  const source = getSource(b.id);
                  return source ? <SourceCard key={b.id} source={source} compact /> : null;
                }
                return <ConnectionCard key={`${b.type}-${b.id}`} type={b.type} id={b.id} />;
              })}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
