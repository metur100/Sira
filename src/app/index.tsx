import { Redirect } from 'expo-router';

import { useAppStore } from '@/store/appStore';

export default function Index() {
  const onboarded = useAppStore((s) => s.app.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
