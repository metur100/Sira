import { type AudioPlayer, createAudioPlayer } from 'expo-audio';

import type { Language } from '@/models';

import { narrationFor } from './narrationRegistry';

export interface NarrationController {
  play(): void;
  pause(): void;
  stop(): void;
  release(): void;
}

/** Wraps an audio player for a registered recording; returns null when none exists. */
export function createNarration(episodeId: string, language: Language): NarrationController | null {
  const source = narrationFor(episodeId, language);
  if (source === null) return null;
  let player: AudioPlayer | null = null;
  try {
    player = createAudioPlayer(source);
  } catch {
    return null;
  }
  return {
    play: () => player?.play(),
    pause: () => player?.pause(),
    stop: () => {
      player?.pause();
      player?.seekTo(0).catch(() => undefined);
    },
    release: () => {
      player?.remove();
      player = null;
    },
  };
}
