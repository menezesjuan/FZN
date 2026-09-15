// Procedural Web Audio API Sound Engine for FZN Farm Game
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastFootstep = 0;

    // Load mute preference from storage
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('fzn_muted') === 'true';
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fzn_muted', this.muted ? 'true' : 'false');
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Digging soil with hoe
  playTill() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Low frequency thud oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);

    // Filtered crunch noise
    this.playNoiseBuffer(0.08, 380, 0.25);
  }

  // Watering can stream
  playWater() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.linearRampToValueAtTime(750, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.22);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);

    // Water droplet bubble
    setTimeout(() => {
      if (this.muted || !this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, t2);
      osc2.frequency.exponentialRampToValueAtTime(1200, t2 + 0.06);
      gain2.gain.setValueAtTime(0.15, t2);
      gain2.gain.linearRampToValueAtTime(0.01, t2 + 0.06);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.07);
    }, 50);
  }

  // Planting seed
  playPlant() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Harvesting crops with quality melody
  playHarvest(quality = 'normal') {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Satisfying "pop" sound
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(320, t);
    popOsc.frequency.exponentialRampToValueAtTime(680, t + 0.07);
    popGain.gain.setValueAtTime(0.4, t);
    popGain.gain.linearRampToValueAtTime(0.01, t + 0.07);
    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(t);
    popOsc.stop(t + 0.08);

    // Chime chords based on quality
    const notes = quality === 'iridium' ? [523.25, 659.25, 783.99, 1046.50, 1318.51] :
                  quality === 'gold' ? [523.25, 659.25, 783.99, 1046.50] :
                  quality === 'silver' ? [523.25, 659.25, 783.99] :
                  [523.25, 659.25];

    notes.forEach((freq, index) => {
      const startTime = t + 0.04 + index * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.23);
    });
  }

  // Coins clinking in shop
  playCoin() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // First coin ring
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, t); // B5
    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.26);

    // Second coin harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, t + 0.06); // E6
    gain2.gain.setValueAtTime(0.22, t + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.32);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.33);
  }

  // Footstep when walking
  playFootstep() {
    if (this.muted) return;
    const now = performance.now();
    if (now - this.lastFootstep < 260) return; // Throttle footsteps
    this.lastFootstep = now;

    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Level Up triumphant fanfare
  playLevelUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const fanfareNotes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    fanfareNotes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  // Soft overnight sleep lullaby & morning chime
  playSleepTransition() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Gentle evening lullaby chords
    const eveningNotes = [392.00, 329.63, 261.63]; // G4, E4, C4
    eveningNotes.forEach((freq, idx) => {
      const startTime = t + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.52);
    });

    // Fresh morning dawn bird/chime sparkle after fade
    setTimeout(() => {
      if (this.muted || !this.ctx) return;
      const tDawn = this.ctx.currentTime;
      const dawnNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      dawnNotes.forEach((freq, idx) => {
        const startTime = tDawn + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.42);
      });
    }, 700);
  }

  // Cute chicken cluck sound
  playCluck() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.09].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 360 : 310, t + offset);
      osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 240 : 200, t + offset + 0.07);

      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.linearRampToValueAtTime(0.001, t + offset + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.08);
    });
  }

  // Tiny baby chick chirp sound
  playChirp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.linearRampToValueAtTime(2600, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.09);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Chopping tree with axe
  playChop() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Wood body resonance
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.1);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);

    // Axe blade impact crunch
    this.playNoiseBuffer(0.07, 500, 0.28);
  }

  // Tree falling down & crashing to ground
  playTreeFall() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Deep wood snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(220, t);
    snapOsc.frequency.exponentialRampToValueAtTime(50, t + 0.22);
    snapGain.gain.setValueAtTime(0.3, t);
    snapGain.gain.linearRampToValueAtTime(0.01, t + 0.25);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.26);

    // Foliage rustle tumble
    setTimeout(() => {
      this.playNoiseBuffer(0.28, 350, 0.22);
    }, 120);
  }

  // Warm, gentle cow moo
  playMoo() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Fundamental moo tone
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(125, t);
    osc1.frequency.linearRampToValueAtTime(135, t + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(95, t + 0.65);

    // Formant filter to give "moo" vowel resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, t);
    filter.frequency.linearRampToValueAtTime(260, t + 0.65);

    gain1.gain.setValueAtTime(0.01, t);
    gain1.gain.linearRampToValueAtTime(0.28, t + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.72);
  }

  // Milking stream squirting into metal bucket
  playMilkSquirt() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const doSquirt = (startTime, freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + 0.06);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.linearRampToValueAtTime(0.01, startTime + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.08);

      // Bucket metallic chime ping
      const pingOsc = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      pingOsc.type = 'triangle';
      pingOsc.frequency.setValueAtTime(880, startTime + 0.02);
      pingGain.gain.setValueAtTime(0.12, startTime + 0.02);
      pingGain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.18);
      pingOsc.connect(pingGain);
      pingGain.connect(this.ctx.destination);
      pingOsc.start(startTime + 0.02);
      pingOsc.stop(startTime + 0.2);
    };

    doSquirt(t, 1100);
    doSquirt(t + 0.09, 1250);
  }

  // Door opening: latch click and wooden creak
  playDoorOpen() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Latch click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(950, t);
    clickOsc.frequency.exponentialRampToValueAtTime(320, t + 0.04);
    clickGain.gain.setValueAtTime(0.2, t);
    clickGain.gain.linearRampToValueAtTime(0.01, t + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.05);

    // Wood creak
    const creakOsc = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(140, t + 0.04);
    creakOsc.frequency.linearRampToValueAtTime(260, t + 0.18);
    creakGain.gain.setValueAtTime(0.01, t + 0.04);
    creakGain.gain.linearRampToValueAtTime(0.12, t + 0.10);
    creakGain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
    creakOsc.connect(creakGain);
    creakGain.connect(this.ctx.destination);
    creakOsc.start(t + 0.04);
    creakOsc.stop(t + 0.23);
  }

  // Door closing: solid wood frame thud and latch snap
  playDoorClose() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Solid low wood impact
    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(160, t);
    thudOsc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    thudGain.gain.setValueAtTime(0.3, t);
    thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    thudOsc.connect(thudGain);
    thudGain.connect(this.ctx.destination);
    thudOsc.start(t);
    thudOsc.stop(t + 0.16);

    // Latch snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'square';
    snapOsc.frequency.setValueAtTime(720, t + 0.02);
    snapOsc.frequency.exponentialRampToValueAtTime(280, t + 0.07);
    snapGain.gain.setValueAtTime(0.15, t + 0.02);
    snapGain.gain.linearRampToValueAtTime(0.01, t + 0.07);
    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t + 0.02);
    snapOsc.stop(t + 0.08);
  }

  // Fireplace crackle: gentle micro pops of burning logs
  playFireplaceCrackle() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const delay = i * 0.07 + Math.random() * 0.04;
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        this.playNoiseBuffer(0.025, 1400 + Math.random() * 800, 0.12);
      }, delay * 1000);
    }
  }

  // Helper: white noise burst with bandpass filter for dirt/crunch sounds
  playNoiseBuffer(duration, filterFreq, volume) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }
}

export const audio = new SoundEngine();
