import { Tabs } from 'expo-router/js-tabs';

import { BottomNavigation } from '@/components/ui/Controls';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <BottomNavigation state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="timeline" options={{ title: t('tabs.timeline') }} />
      <Tabs.Screen name="map" options={{ title: t('tabs.map') }} />
      <Tabs.Screen name="explore" options={{ title: t('tabs.explore') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
