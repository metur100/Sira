import { router } from 'expo-router';

import { EmptyState, Screen } from '@/components/ui/Layout';
import { useI18n } from '@/hooks/useI18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
      <EmptyState icon="map" title={t('notFound.title')} actionLabel={t('notFound.home')} onAction={() => router.replace('/')} />
    </Screen>
  );
}
