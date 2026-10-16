// Zero-dependency Procedural Web Audio Sound Synthesizer & BGM Engine

let audioCtx: AudioContext | null = null;
let isMuted = false;

// BGM State
type BGMTrack = 'title' | 'game' | null;
let currentTrack: BGMTrack = null;
let bgmInterval: number | null = null;
let bgmMasterGain: GainNode | null = null;
let bgmStep = 0;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// User-gesture unlocker
if (typeof window !== 'undefined') {
  const unlock = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  try {
    localStorage.setItem('subway_surfers_sound_muted', muted ? '1' : '0');
  } catch {}

  if (bgmMasterGain && audioCtx) {
    const target = muted ? 0 : 0.12;
    bgmMasterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, audioCtx.currentTime);
    bgmMasterGain.gain.linearRampToValueAtTime(target, audioCtx.currentTime + 0.08);
  }
}

export function getMuted(): boolean {
  try {
    return localStorage.getItem('subway_surfers_sound_muted') === '1' || isMuted;
  } catch {
    return isMuted;
  }
}

// Frequency helper
function noteToFreq(note: string): number {
  const notes: Record<string, number> = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
    C6: 1046.5,
  };
  return notes[note] || 440;
}

// ---------------------------------------------------------------------------
// PROCEDURAL BACKGROUND MUSIC (BGM)
// ---------------------------------------------------------------------------

// Title track: Cheerful, uplifting, melodic 16-step loop (Tempo: ~110 BPM)
const TITLE_MELODY: (string | null)[] = [
  'C5', null, 'E5', 'G5', 'A5', 'G5', 'E5', null,
  'D5', 'E5', 'D5', 'C5', 'E5', 'G5', 'C6', null,
  'A5', null, 'C6', 'A5', 'G5', 'E5', 'C5', null,
  'D5', 'E5', 'F5', 'E5', 'D5', null, 'C5', null,
];

const TITLE_BASS: (string | null)[] = [
  'C3', null, 'C3', null, 'G2', null, 'G2', null,
  'A2', null, 'A2', null, 'F2', null, 'F2', null,
  'C3', null, 'C3', null, 'G2', null, 'G2', null,
  'F2', null, 'G2', null, 'C3', null, 'C3', null,
];

// Game runner track: Energetic, driving, fast-paced 16-step loop (Tempo: ~135 BPM)
const GAME_MELODY: (string | null)[] = [
  'D4', 'F4', 'A4', 'D5', 'C5', 'A4', 'F4', 'G4',
  'A4', 'G4', 'F4', 'E4', 'D4', 'F4', 'G4', 'A4',
  'D5', 'A4', 'F4', 'A4', 'C5', 'A4', 'G4', 'F4',
  'E4', 'F4', 'G4', 'A4', 'D4', null, 'D4', null,
];

const GAME_BASS: (string | null)[] = [
  'D2', null, 'D2', 'F2', 'G2', null, 'D2', null,
  'A2', null, 'G2', null, 'F2', 'E2', 'D2', null,
  'D2', null, 'D2', 'C2', 'D2', null, 'F2', null,
  'G2', null, 'A2', null, 'D2', null, 'D2', null,
];

function playSynthNote(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'triangle',
  gainVol = 0.1,
  targetNode: AudioNode = ctx.destination
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(gainVol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(targetNode);

  osc.start(now);
  osc.stop(now + duration + 0.05);
}

function playPercussionHiHat(ctx: AudioContext, targetNode: AudioNode) {
  const bufferSize = ctx.sampleRate * 0.03;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(targetNode);

  noise.start(now);
}

export function startBGM(track: 'title' | 'game' = 'title') {
  if (currentTrack === track && bgmInterval !== null) {
    return; // Already playing this track
  }
  stopBGM();

  const ctx = getAudioContext();
  if (!ctx) return;

  currentTrack = track;
  bgmStep = 0;

  // Master BGM gain node
  bgmMasterGain = ctx.createGain();
  bgmMasterGain.gain.setValueAtTime(getMuted() ? 0 : 0.12, ctx.currentTime);
  bgmMasterGain.connect(ctx.destination);

  const stepDurationMs = track === 'title' ? 140 : 110;

  bgmInterval = window.setInterval(() => {
    if (!ctx || ctx.state === 'suspended') return;
    if (getMuted()) return;

    const melodyArr = track === 'title' ? TITLE_MELODY : GAME_MELODY;
    const bassArr = track === 'title' ? TITLE_BASS : GAME_BASS;
    const stepIdx = bgmStep % melodyArr.length;

    // Play melody note
    const melNote = melodyArr[stepIdx];
    if (melNote && bgmMasterGain) {
      const freq = noteToFreq(melNote);
      playSynthNote(
        ctx,
        freq,
        stepDurationMs / 1000 * 0.9,
        track === 'title' ? 'triangle' : 'sine',
        track === 'title' ? 0.09 : 0.11,
        bgmMasterGain
      );
    }

    // Play bass note
    const bassNote = bassArr[stepIdx];
    if (bassNote && bgmMasterGain) {
      const freq = noteToFreq(bassNote);
      playSynthNote(
        ctx,
        freq,
        stepDurationMs / 1000 * 1.2,
        'sawtooth',
        track === 'title' ? 0.05 : 0.07,
        bgmMasterGain
      );
    }

    // Rhythm hi-hat on every off-beat
    if (stepIdx % 2 === 1 && bgmMasterGain) {
      playPercussionHiHat(ctx, bgmMasterGain);
    }

    bgmStep++;
  }, stepDurationMs);
}

export function stopBGM() {
  if (bgmInterval !== null) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  if (bgmMasterGain && audioCtx) {
    try {
      bgmMasterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      bgmMasterGain.disconnect();
    } catch {}
    bgmMasterGain = null;
  }
  currentTrack = null;
  bgmStep = 0;
}

export function getCurrentBGMTrack(): BGMTrack {
  return currentTrack;
}

// ---------------------------------------------------------------------------
// SOUND EFFECTS (SFX)
// ---------------------------------------------------------------------------

export function playJumpSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(460, now + 0.16);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.19);
}

export function playSlideSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

export function playCoinSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(987.77, now); // B5
  osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.24);
}

export function playHitSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

  gain.gain.setValueAtTime(0.38, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.31);
}

export function playQuestionBonusSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.05;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.16);
  });
}

export function playCorrectSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chords = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.07;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.28, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.36);
  });
}

export function playWrongSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.setValueAtTime(130, now + 0.12);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}

export function playGameOverSound() {
  if (getMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [392.0, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.14;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.3, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.32);
  });
}
