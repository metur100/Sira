import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundName = 'click' | 'success' | 'failure' | 'reward';

const SOURCES: Record<SoundName, number> = {
  click: require('../../assets/sounds/click.wav'),
  success: require('../../assets/sounds/success.wav'),
  failure: require('../../assets/sounds/failure.wav'),
  reward: require('../../assets/sounds/reward.wav'),
};

const VOLUME: Record<SoundName, number> = { click: 0.35, success: 0.6, failure: 0.5, reward: 0.7 };

const players = new Map<SoundName, AudioPlayer>();
let configured = false;

async function configure() {
  if (configured) return;
  configured = true;
  try {
    // Respect the silent switch: UI sounds should never surprise anyone.
    await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
  } catch {
    // Audio mode is a best-effort optimisation.
  }
}

function playerFor(name: SoundName): AudioPlayer | null {
  try {
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      player.volume = VOLUME[name];
      players.set(name, player);
    }
    return player;
  } catch {
    return null;
  }
}

/** Plays a short UI sound. Audio is optional: failures are ignored so the app keeps working. */
export function playSound(name: SoundName): void {
  void configure();
  const player = playerFor(name);
  if (!player) return;
  try {
    player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // ignore
  }
}
