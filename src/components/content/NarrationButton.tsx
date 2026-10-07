import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useI18n } from '@/hooks/useI18n';
import { createNarration, type NarrationController } from '@/services/narration';
import { narrationFor } from '@/services/narrationRegistry';

/**
 * Play/pause for a recorded human narration of the episode. Renders nothing when no recording
 * exists (version 1 ships without recordings – narration is never generated automatically).
 */
export function NarrationButton({ episodeId }: { episodeId: string }) {
  const { t, language } = useI18n();
  const available = narrationFor(episodeId, language) !== null;
  const [controller, setController] = useState<NarrationController | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => controller?.release(), [controller]);

  if (!available) return null;

  const toggle = () => {
    const player = controller ?? createNarration(episodeId, language);
    if (!player) return;
    if (!controller) setController(player);
    if (playing) player.pause();
    else player.play();
    setPlaying(!playing);
  };

  return <Button label={playing ? t('narration.pause') : t('narration.play')} icon={playing ? 'pause' : 'play'} variant="secondary" onPress={toggle} />;
}
