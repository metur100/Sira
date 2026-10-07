import { router, useLocalSearchParams } from 'expo-router';

import { SourceCard } from '@/components/content/Blocks';
import { AppText } from '@/components/ui/AppText';
import { EmptyState, Screen, TopBar } from '@/components/ui/Layout';
import { getSource } from '@/content';
import { useI18n } from '@/hooks/useI18n';

/** SourceCard in a modal, opened from the references under a statement. */
export default function SourceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const source = getSource(String(id));
  return (
    <Screen header={<TopBar title={t('type.source')} backIcon="close" />}>
      {source ? (
        <>
          <SourceCard source={source} />
          <AppText variant="small" muted>
            {t('sourcesPage.p2')}
          </AppText>
        </>
      ) : (
        <EmptyState icon="scroll" title={t('notFound.title')} actionLabel={t('common.back')} onAction={() => router.back()} />
      )}
    </Screen>
  );
}
