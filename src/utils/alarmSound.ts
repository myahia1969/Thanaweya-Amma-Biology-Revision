// Web Audio API Loud Alarm Synthesizer for Study Reminders
// Provides clear, crisp, and high-volume synthesized alarm sounds without external asset dependencies.

export type AlarmToneType = 'siren' | 'bell' | 'digital' | 'chime';

interface ActiveAlarm {
  stop: () => void;
}

let currentAudioCtx: AudioContext | null = null;
let currentActiveAlarm: ActiveAlarm | null = null;

function getAudioContext(): AudioContext {
  if (!currentAudioCtx || currentAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    currentAudioCtx = new AudioContextClass();
  }
  if (currentAudioCtx.state === 'suspended') {
    currentAudioCtx.resume();
  }
  return currentAudioCtx;
}

export function stopLoudAlarmSound() {
  if (currentActiveAlarm) {
    try {
      currentActiveAlarm.stop();
    } catch {
      // ignore
    }
    currentActiveAlarm = null;
  }
}

export function playLoudAlarmSound(tone: AlarmToneType = 'siren', volume: number = 0.9, durationSeconds: number = 8): ActiveAlarm {
  // Stop existing alarm if ringing
  stopLoudAlarmSound();

  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  // Ensure loud clear volume up to 1.0
  masterGain.gain.setValueAtTime(Math.min(Math.max(volume, 0.1), 1.0), ctx.currentTime);
  masterGain.connect(ctx.destination);

  let isPlaying = true;
  const timeoutIds: number[] = [];
  const oscillators: OscillatorNode[] = [];

  const stopAll = () => {
    if (!isPlaying) return;
    isPlaying = false;
    timeoutIds.forEach(id => window.clearTimeout(id));
    oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    try {
      masterGain.disconnect();
    } catch {
      // ignore
    }
  };

  if (tone === 'siren') {
    // 🚨 Dual-Tone Pulsing High Siren (880Hz <-> 1320Hz alternating pulses)
    const startTime = ctx.currentTime;
    const pulses = Math.floor(durationSeconds * 4); // 4 pulses per second

    for (let i = 0; i < pulses; i++) {
      if (!isPlaying) break;
      const pulseTime = startTime + i * 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1320, pulseTime);
      
      gain.gain.setValueAtTime(0.01, pulseTime);
      gain.gain.exponentialRampToValueAtTime(0.85, pulseTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, pulseTime + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.24);
      oscillators.push(osc);
    }
  } else if (tone === 'bell') {
    // 🔔 Loud School Alarm Bell (High harmonic ringing)
    const startTime = ctx.currentTime;
    const bursts = Math.floor(durationSeconds * 3);

    for (let i = 0; i < bursts; i++) {
      const burstTime = startTime + i * 0.33;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(1046.5, burstTime); // C6
      osc2.frequency.setValueAtTime(2093, burstTime);   // C7 (harmonics)

      gain.gain.setValueAtTime(0.9, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(burstTime);
      osc2.start(burstTime);
      osc1.stop(burstTime + 0.31);
      osc2.stop(burstTime + 0.31);
      oscillators.push(osc1, osc2);
    }
  } else if (tone === 'digital') {
    // ⚡ Digital Beep (Triple high pitch BEEP-BEEP-BEEP)
    const startTime = ctx.currentTime;
    const totalBeeps = Math.floor(durationSeconds * 2);

    for (let i = 0; i < totalBeeps; i++) {
      const cycleStart = startTime + i * 0.5;
      for (let b = 0; b < 3; b++) {
        const beepTime = cycleStart + b * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, beepTime); // A6

        gain.gain.setValueAtTime(0.8, beepTime);
        gain.gain.exponentialRampToValueAtTime(0.01, beepTime + 0.07);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(beepTime);
        osc.stop(beepTime + 0.08);
        oscillators.push(osc);
      }
    }
  } else {
    // 🎵 High Clarity Chime
    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, startTime); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, startTime + 0.3); // C6

    gain.gain.setValueAtTime(0.9, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + durationSeconds);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + durationSeconds);
    oscillators.push(osc);
  }

  // Auto stop after durationSeconds
  const autoStopId = window.setTimeout(() => {
    stopAll();
  }, durationSeconds * 1000);
  timeoutIds.push(autoStopId);

  const activeAlarmObj: ActiveAlarm = { stop: stopAll };
  currentActiveAlarm = activeAlarmObj;
  return activeAlarmObj;
}
