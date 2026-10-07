import { useLocalSearchParams } from 'expo-router';

import { KindLegend } from '@/components/content/Blocks';
import { AppText } from '@/components/ui/AppText';
import { ChapterHeader, EmptyState, HistoricalCard, Screen, TopBar } from '@/components/ui/Layout';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/localization/i18n';

const PAGES: Record<string, { title: TranslationKey; paragraphs: TranslationKey[]; legend?: boolean }> = {
  about: { title: 'about.title', paragraphs: ['about.p1', 'about.p2', 'about.p3'], legend: true },
  privacy: { title: 'privacy.title', paragraphs: ['privacy.p1', 'privacy.p2'] },
  sources: { title: 'sourcesPage.title', paragraphs: ['sourcesPage.p1', 'sourcesPage.p2', 'sourcesPage.p3'] },
};

export default function InfoPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const { t } = useI18n();
  const config = PAGES[String(page)];
  if (!config) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="info" title={t('notFound.title')} />
      </Screen>
    );
  }
  return (
    <Screen header={<TopBar title={t(config.title)} />}>
      <ChapterHeader title={t(config.title)} />
      {config.paragraphs.map((key) => (
        <HistoricalCard key={key}>
          <AppText variant="body">{t(key)}</AppText>
        </HistoricalCard>
      ))}
      {config.legend ? <KindLegend /> : null}
    </Screen>
  );
}
