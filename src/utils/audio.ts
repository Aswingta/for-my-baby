// Procedural Romantic Synthesizer using Web Audio API
// No assets required, absolutely robust and beautiful!

class RomanticSynth {
  private ctx: AudioContext | null = null;
  private loopId: any = null;
  private isPlaying: boolean = false;
  private bpm: number = 55; // Cozy slow tempo
  private currentVibe: string = "gentle_piano";
  private rootVolumeNode: GainNode | null = null;
  private currentVolume: number = 0.4;

  // Romantic chord progressions
  // Chords are arrays of midi note numbers
  private progressions: Record<string, number[][]> = {
    always_love_you: [
      [43, 47, 50, 54, 59], // Gmaj7 (G, B, D, F#, B)
      [40, 43, 47, 52, 55], // Em7 (E, G, B, E, G)
      [36, 40, 43, 48, 52], // Cadd9 (C, E, G, C, E)
      [38, 42, 45, 50, 54], // D7 (D, F#, A, D, F#)
    ],
    gentle_piano: [
      [48, 52, 55, 59, 62], // Cmaj9 (C, E, G, B, D)
      [45, 48, 52, 55, 59], // Am9 (A, C, E, G, B)
      [41, 45, 48, 52, 57], // Fmaj9 (F, A, C, E, G)
      [43, 47, 50, 53, 57], // G9 (G, B, D, F, A)
    ],
    warm_acoustic: [
      [36, 48, 55, 60, 64], // C major open
      [33, 45, 52, 57, 60], // A minor open
      [41, 48, 53, 57, 60], // F major open
      [43, 50, 55, 59, 62], // G major open
    ],
    cosmic_lullaby: [
      [50, 54, 57, 61, 66], // Dmaj9
      [47, 50, 54, 57, 62], // Bm9
      [43, 47, 50, 54, 59], // Gmaj9
      [45, 49, 52, 56, 61], // Amaj9
    ],
    rainy_day: [
      [45, 48, 52, 55],     // Am7
      [38, 41, 45, 48],     // Dm7
      [43, 47, 50, 53],     // G7
      [48, 52, 55, 59],     // Cmaj7
    ],
  };

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.rootVolumeNode = this.ctx.createGain();
      this.rootVolumeNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.rootVolumeNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Convert MIDI note to frequency
  private midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Synthesize a romantic soft piano key sound
  private playSoftKey(note: number, time: number, duration: number, isPluck: boolean = false, volumeScale: number = 0.15) {
    if (!this.ctx || !this.rootVolumeNode) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Soft sine combined with a warm triangle
    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(this.midiToFreq(note), time);
    // slightly detune second oscillator for lush width
    osc2.frequency.setValueAtTime(this.midiToFreq(note) + 0.4, time);

    // Warm nostalgic tape vibrato / slow pitching LFO for romance
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(3.8, time); // Slow, warm 3.8Hz wobble
    lfoGain.gain.setValueAtTime(1.5, time); // Gentle vibrato range in Hz
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    // Filter to make it sound warm and acoustic (plucked sine)
    filter.type = "lowpass";
    if (isPluck) {
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + duration * 0.8);
    } else {
      filter.frequency.setValueAtTime(850, time);
      filter.frequency.exponentialRampToValueAtTime(130, time + duration * 0.95);
    }
    filter.Q.setValueAtTime(1.2, time);

    // ADSR Envelope
    const attack = 0.15; // Slow romantic bloom attack
    const decay = 0.35;
    const sustain = 0.45;
    const release = duration - attack - decay;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volumeScale, time + attack);
    gainNode.gain.exponentialRampToValueAtTime(volumeScale * sustain, time + attack + decay);
    gainNode.gain.setValueAtTime(volumeScale * sustain, time + attack + decay + release);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Connections
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.rootVolumeNode);

    // Start/Stop
    lfo.start(time);
    osc1.start(time);
    osc2.start(time);
    
    lfo.stop(time + duration);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  // Play a beautiful rolling chord
  private playArpeggiatedChord(chordNotes: number[], startTime: number) {
    const isPluck = this.currentVibe === "warm_acoustic";
    const stagger = 0.16; // Gentler, slower romantic sweep
    const duration = 4.6;  // Deeper ringing of sound

    chordNotes.forEach((note, index) => {
      // stagger notes slightly for realistic acoustic feeling
      const noteTime = startTime + index * stagger;
      // also lower velocity for higher notes to keep notes gentle
      const relativeVolume = 0.16 - (index * 0.015);
      this.playSoftKey(note, noteTime, duration - index * stagger, isPluck, Math.max(0.06, relativeVolume));
    });

    // Add a stunning high-octave countermelody note that blooms like starlight
    if (chordNotes.length > 0) {
      const rootNote = chordNotes[0];
      const melodyCandidates = [rootNote + 24, rootNote + 26, rootNote + 28, rootNote + 31, rootNote + 19];
      const randomMelodyNote = melodyCandidates[Math.floor(Math.random() * melodyCandidates.length)];
      
      // Floating starlight melody note plays 2.0 seconds into the bar
      this.playSoftKey(randomMelodyNote, startTime + 2.0, 2.5, true, 0.045);
    }
  }

  private loopChords() {
    if (!this.isPlaying || !this.ctx) return;

    const chords = this.progressions[this.currentVibe] || this.progressions.gentle_piano;
    let step = 0;
    
    const secPerChord = 4.5;
    
    const playNext = () => {
      const chordIdx = step % chords.length;
      const chord = chords[chordIdx];
      const now = this.ctx!.currentTime;
      this.playArpeggiatedChord(chord, now);
      
      // Beautiful layered melody for Dolly Parton / Whitney Houston's "I Will Always Love You"
      if (this.currentVibe === "always_love_you") {
        const isPluck = true;
        if (chordIdx === 0) {
          // Chord 1 (Gmaj7): "And I..."
          this.playSoftKey(74, now + 0.6, 1.2, isPluck, 0.14); // D5 ("And")
          this.playSoftKey(71, now + 1.4, 2.0, isPluck, 0.16); // B4 ("I")
        } else if (chordIdx === 1) {
          // Chord 2 (Em7): "will always"
          this.playSoftKey(69, now + 0.5, 0.8, isPluck, 0.12); // A4 ("will")
          this.playSoftKey(67, now + 1.0, 0.8, isPluck, 0.12); // G4 ("al-")
          this.playSoftKey(67, now + 1.5, 1.0, isPluck, 0.12); // G4 ("ways")
          this.playSoftKey(69, now + 2.2, 1.2, isPluck, 0.12); // A4 ("love")
        } else if (chordIdx === 2) {
          // Chord 3 (Cadd9): "love you..."
          this.playSoftKey(71, now + 0.5, 1.6, isPluck, 0.18); // B4 ("you")
          this.playSoftKey(67, now + 1.5, 1.2, isPluck, 0.12); // G4 (sustain)
          this.playSoftKey(64, now + 2.5, 1.5, isPluck, 0.10); // E4 (resolve)
        } else if (chordIdx === 3) {
          // Chord 4 (D7): "...always love you"
          this.playSoftKey(67, now + 0.5, 0.8, isPluck, 0.14); // G4
          this.playSoftKey(69, now + 1.2, 1.0, isPluck, 0.14); // A4 ("love")
          this.playSoftKey(67, now + 2.0, 2.0, isPluck, 0.16); // G4 ("you")
        }
      }
      
      step++;
      // Program next step
      this.loopId = setTimeout(playNext, secPerChord * 1000);
    };

    playNext();
  }

  public play(vibe: string = "gentle_piano") {
    this.initCtx();
    if (this.isPlaying) {
      if (this.currentVibe !== vibe) {
        this.currentVibe = vibe;
      }
      return;
    }
    
    this.currentVibe = vibe;
    this.isPlaying = true;
    this.loopChords();
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.rootVolumeNode && this.ctx) {
      this.rootVolumeNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.loopId) {
      clearTimeout(this.loopId);
      this.loopId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVibeName(vibe: string): string {
    switch (vibe) {
      case "always_love_you": return "I Will Always Love You (Whitney Chimes)";
      case "gentle_piano": return "Glistening Piano Tears";
      case "warm_acoustic": return "Acoustic Cozy Promise";
      case "cosmic_lullaby": return "Stardust Love Lullaby";
      case "rainy_day": return "Calming Rainy Window";
      default: return "Sweet Apology Ballad";
    }
  }
}

export const romanticSynth = new RomanticSynth();
