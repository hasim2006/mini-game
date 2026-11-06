/**
 * Mini Game Arcade - Custom Music Player & BGM Synthesizer
 * Allows players to upload their own custom songs (.mp3, .wav, etc.)
 * or enjoy built-in procedural synth beats while playing!
 */

(function () {
  'use strict';

  class ArcadeMusicPlayer {
    constructor() {
      this.isPlaying = false;
      this.currentMode = 'synth'; // 'synth' | 'custom'
      this.currentSynthTrack = 0; // 0: Neon Grooves, 1: Lofi Chill
      this.synthTracks = [
        { name: 'Neon Arcade Grooves', desc: 'Upbeat 120 BPM Synthwave' },
        { name: 'Cyber Lofi Chill', desc: 'Relaxing 85 BPM Ambient' }
      ];

      this.customSongName = null;
      this.customAudio = new Audio();
      this.customAudio.loop = true;

      this.synthInterval = null;
      this.volume = parseFloat(localStorage.getItem('arcade_music_vol') || '0.35');
      this.customAudio.volume = this.volume;

      this.initUI();
      this.bindEvents();
    }

    initUI() {
      const container = document.createElement('div');
      container.className = 'arcade-music-player';
      container.id = 'arcade-music-player';

      container.innerHTML = `
        <!-- Collapsed Floating Pill -->
        <div class="music-toggle-pill" id="music-pill">
          <div class="eq-bars" id="eq-bars">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
          <span id="pill-label">🎵 BGM Player</span>
        </div>

        <!-- Expanded Music Card -->
        <div class="music-card" id="music-card">
          <div class="music-header">
            <div class="music-title-wrap">
              <span class="music-heading">Background Music</span>
            </div>
            <button class="btn-close-music" id="btn-close-music" aria-label="Minimize Player">✕</button>
          </div>

          <div class="track-info-box">
            <div class="track-icon" id="track-icon">🎧</div>
            <div class="track-details">
              <div class="track-name" id="track-name">Neon Arcade Grooves</div>
              <div class="track-sub" id="track-sub">Built-in Synth BGM</div>
            </div>
          </div>

          <!-- Controls -->
          <div class="music-controls-row">
            <button class="music-btn" id="btn-prev-track" title="Previous Track">⏮</button>
            <button class="music-btn btn-play-pause" id="btn-music-play" title="Play / Pause">▶</button>
            <button class="music-btn" id="btn-next-track" title="Next Track">⏭</button>
          </div>

          <!-- Volume Slider -->
          <div class="volume-wrap">
            <span>🔈</span>
            <input type="range" class="volume-slider" id="music-vol" min="0" max="1" step="0.05" value="${this.volume}">
            <span>🔊</span>
          </div>

          <!-- Upload Custom Song -->
          <label class="upload-song-btn">
            📂 Play Your Own Song (.mp3, .wav)
            <input type="file" id="custom-song-input" class="hidden-file-input" accept="audio/*">
          </label>
        </div>
      `;

      document.body.appendChild(container);

      // Element References
      this.playerEl = container;
      this.pillEl = container.querySelector('#music-pill');
      this.cardEl = container.querySelector('#music-card');
      this.btnClose = container.querySelector('#btn-close-music');
      this.btnPlay = container.querySelector('#btn-music-play');
      this.btnPrev = container.querySelector('#btn-prev-track');
      this.btnNext = container.querySelector('#btn-next-track');
      this.volSlider = container.querySelector('#music-vol');
      this.fileInput = container.querySelector('#custom-song-input');
      this.eqBars = container.querySelector('#eq-bars');
      this.trackNameEl = container.querySelector('#track-name');
      this.trackSubEl = container.querySelector('#track-sub');
      this.trackIconEl = container.querySelector('#track-icon');
      this.pillLabelEl = container.querySelector('#pill-label');
    }

    bindEvents() {
      // Toggle card open/close
      this.pillEl.addEventListener('click', () => {
        this.playerEl.classList.add('open');
      });

      this.btnClose.addEventListener('click', () => {
        this.playerEl.classList.remove('open');
      });

      // Play / Pause
      this.btnPlay.addEventListener('click', () => {
        this.togglePlay();
      });

      // Prev / Next track
      this.btnNext.addEventListener('click', () => this.switchTrack(1));
      this.btnPrev.addEventListener('click', () => this.switchTrack(-1));

      // Volume
      this.volSlider.addEventListener('input', (e) => {
        this.volume = parseFloat(e.target.value);
        this.customAudio.volume = this.volume;
        localStorage.setItem('arcade_music_vol', this.volume.toString());
      });

      // Custom File Upload
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          this.loadCustomSong(file.name, url);
        }
      });
    }

    loadCustomSong(name, url) {
      this.stopSynthBeat();
      this.currentMode = 'custom';
      this.customSongName = name;
      this.customAudio.src = url;
      this.customAudio.volume = this.volume;

      this.trackNameEl.textContent = name;
      this.trackSubEl.textContent = 'Custom User Song';
      this.trackIconEl.textContent = '🎵';
      this.pillLabelEl.textContent = `🎵 ${name.slice(0, 15)}...`;

      this.playCustom();
    }

    switchTrack(direction) {
      if (this.currentMode === 'custom') {
        // Return to built-in tracks
        this.currentMode = 'synth';
        this.customAudio.pause();
      }

      this.currentSynthTrack = (this.currentSynthTrack + direction + this.synthTracks.length) % this.synthTracks.length;
      const track = this.synthTracks[this.currentSynthTrack];
      this.trackNameEl.textContent = track.name;
      this.trackSubEl.textContent = track.desc;
      this.trackIconEl.textContent = '🎧';
      this.pillLabelEl.textContent = `🎵 ${track.name}`;

      if (this.isPlaying) {
        this.stopSynthBeat();
        this.startSynthBeat();
      }
    }

    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    play() {
      this.isPlaying = true;
      this.btnPlay.textContent = '⏸';
      this.eqBars.classList.add('playing');

      if (this.currentMode === 'custom') {
        this.playCustom();
      } else {
        this.startSynthBeat();
      }
    }

    pause() {
      this.isPlaying = false;
      this.btnPlay.textContent = '▶';
      this.eqBars.classList.remove('playing');

      if (this.currentMode === 'custom') {
        this.customAudio.pause();
      } else {
        this.stopSynthBeat();
      }
    }

    playCustom() {
      this.isPlaying = true;
      this.btnPlay.textContent = '⏸';
      this.eqBars.classList.add('playing');
      this.customAudio.play().catch(e => console.warn('Autoplay prevented:', e));
    }

    // --- Procedural BGM Synthesizer via Web Audio API ---

    startSynthBeat() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const bpm = this.currentSynthTrack === 0 ? 120 : 85;
      const intervalMs = (60 / bpm) * 1000 / 2; // 8th notes

      // Harmonious progression
      const neonScale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]; // A minor / C major
      const lofiScale = [174.61, 220, 261.63, 329.63, 392]; // Fmaj7
      const activeScale = this.currentSynthTrack === 0 ? neonScale : lofiScale;

      let step = 0;
      this.synthInterval = setInterval(() => {
        if (!this.isPlaying || this.volume <= 0) return;

        const now = this.audioCtx.currentTime;
        const note = activeScale[step % activeScale.length];

        // Bass/lead tone
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = this.currentSynthTrack === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(step % 4 === 0 ? note / 2 : note, now);

          const peakGain = this.volume * 0.18;
          gain.gain.setValueAtTime(peakGain, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.9);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now);
          osc.stop(now + (intervalMs / 1000) * 0.95);
        } catch (e) {
          // Ignore sound interruption
        }

        step++;
      }, intervalMs);
    }

    stopSynthBeat() {
      if (this.synthInterval) {
        clearInterval(this.synthInterval);
        this.synthInterval = null;
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.arcadeMusic = new ArcadeMusicPlayer();
  });
})();

