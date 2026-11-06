/**
 * Fruit Blade - Browser Fruit Slicing Mini-Game Engine
 * Built with HTML5 Canvas, responsive physics, touch & mouse support, and Web Audio.
 */

(function () {
  'use strict';

  // Game Constants
  const GRAVITY = 0.38;
  const FRUIT_RADIUS = 34;
  const BOMB_RADIUS = 30;
  const MAX_STRIKES = 3;
  const TRAIL_MAX_POINTS = 16;
  const COMBO_WINDOW_MS = 380;

  // Fruit Color & Rendering Definitions
  const FRUIT_TYPES = [
    {
      id: 'watermelon',
      name: 'Watermelon',
      color: '#FF1744',
      rindColor: '#2E7D32',
      points: 10,
      radius: 36
    },
    {
      id: 'orange',
      name: 'Orange',
      color: '#FF6D00',
      rindColor: '#FFA000',
      points: 10,
      radius: 32
    },
    {
      id: 'apple',
      name: 'Apple',
      color: '#D50000',
      rindColor: '#B71C1C',
      points: 10,
      radius: 30
    },
    {
      id: 'banana',
      name: 'Banana',
      color: '#FFEA00',
      rindColor: '#F57F17',
      points: 15,
      radius: 32
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      color: '#FF2A6D',
      rindColor: '#00F5D4',
      points: 15,
      radius: 28
    }
  ];

  class FruitSliceGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.viewport = document.querySelector('.game-viewport');

      // HUD elements
      this.scoreValEl = document.getElementById('hud-score');
      this.highScoreEl = document.getElementById('hud-high-score');
      this.strikeIcons = [
        document.getElementById('strike-1'),
        document.getElementById('strike-2'),
        document.getElementById('strike-3')
      ];
      this.comboBanner = document.getElementById('combo-banner');
      this.btnPause = document.getElementById('btn-pause');
      this.btnMute = document.getElementById('btn-mute');
      this.btnFullscreen = document.getElementById('btn-fullscreen');

      // Screens
      this.startScreen = document.getElementById('screen-start');
      this.pauseScreen = document.getElementById('screen-pause');
      this.gameOverScreen = document.getElementById('screen-game-over');
      this.finalScoreEl = document.getElementById('final-score');
      this.finalHighScoreEl = document.getElementById('final-high-score');

      // Buttons
      this.btnStart = document.getElementById('btn-start-game');
      this.btnResume = document.getElementById('btn-resume-game');
      this.btnRestartPause = document.getElementById('btn-restart-from-pause');
      this.btnPlayAgain = document.getElementById('btn-play-again');

      // Game State
      this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('fruit_slice_highscore') || '0', 10);
      this.strikes = 0;
      this.gameTime = 0;
      this.lastSpawnTime = 0;
      this.spawnInterval = 2000;

      // Entities
      this.fruits = [];
      this.halves = [];
      this.particles = [];
      this.splatters = [];
      this.bombs = [];
      this.floatingTexts = [];

      // Blade Trail & Input Tracking
      this.trail = [];
      this.isSwiping = false;
      this.currentCombo = 0;
      this.lastSliceTime = 0;

      // Screen Shake
      this.shakeDuration = 0;
      this.shakeIntensity = 0;

      this.init();
    }

    init() {
      this.updateHighScoresDisplay();
      this.setupCanvasDPR();
      this.bindEvents();
      this.updateMuteButtonUI();

      // Start rendering loop
      this.lastFrameTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    setupCanvasDPR() {
      const rect = this.viewport.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;

      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.setupCanvasDPR();
      });

      // Pointer / Touch / Mouse Input
      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      };

      this.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.canvas.setPointerCapture(e.pointerId);
        this.isSwiping = true;
        const pos = getPos(e);
        this.trail = [{ x: pos.x, y: pos.y, time: Date.now() }];
        if (window.soundManager) window.soundManager.playSwoosh();
      });

      this.canvas.addEventListener('pointermove', (e) => {
        if (!this.isSwiping) return;
        e.preventDefault();
        const pos = getPos(e);
        const now = Date.now();
        this.trail.push({ x: pos.x, y: pos.y, time: now });

        if (this.trail.length > TRAIL_MAX_POINTS) {
          this.trail.shift();
        }

        if (this.state === 'PLAYING') {
          this.checkSlices();
        }
      });

      const endSwipe = (e) => {
        if (!this.isSwiping) return;
        this.isSwiping = false;
        this.trail = [];
        this.evaluateComboEnd();
      };

      this.canvas.addEventListener('pointerup', endSwipe);
      this.canvas.addEventListener('pointercancel', endSwipe);

      // UI Buttons
      this.btnStart.addEventListener('click', () => this.startGame());
      this.btnResume.addEventListener('click', () => this.resumeGame());
      this.btnRestartPause.addEventListener('click', () => this.startGame());
      this.btnPlayAgain.addEventListener('click', () => this.startGame());

      this.btnPause.addEventListener('click', () => {
        if (this.state === 'PLAYING') {
          this.pauseGame();
        } else if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      });

      this.btnMute.addEventListener('click', () => {
        if (window.soundManager) {
          const muted = window.soundManager.toggleMute();
          this.updateMuteButtonUI();
        }
      });

      this.btnFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
      });

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyP' || e.code === 'Space') {
          if (this.state === 'PLAYING') this.pauseGame();
          else if (this.state === 'PAUSED') this.resumeGame();
        }
        if (e.code === 'KeyM') {
          if (window.soundManager) {
            window.soundManager.toggleMute();
            this.updateMuteButtonUI();
          }
        }
      });
    }

    updateMuteButtonUI() {
      const isMuted = window.soundManager ? window.soundManager.getMuted() : false;
      this.btnMute.innerHTML = isMuted ? '🔇' : '🔊';
      this.btnMute.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.viewport.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }

    updateHighScoresDisplay() {
      if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;
      if (this.finalHighScoreEl) this.finalHighScoreEl.textContent = this.highScore;
    }

    startGame() {
      if (window.soundManager) window.soundManager.playClick();
      this.state = 'PLAYING';
      this.score = 0;
      this.strikes = 0;
      this.gameTime = 0;
      this.lastSpawnTime = 0;
      this.spawnInterval = 2100;
      this.currentCombo = 0;

      this.fruits = [];
      this.halves = [];
      this.particles = [];
      this.splatters = [];
      this.bombs = [];
      this.floatingTexts = [];
      this.trail = [];

      this.scoreValEl.textContent = '0';
      this.updateStrikesUI();

      this.startScreen.classList.add('hidden');
      this.pauseScreen.classList.add('hidden');
      this.gameOverScreen.classList.add('hidden');
      this.btnPause.innerHTML = '⏸';
    }

    pauseGame() {
      if (this.state !== 'PLAYING') return;
      this.state = 'PAUSED';
      this.pauseScreen.classList.remove('hidden');
      this.btnPause.innerHTML = '▶';
    }

    resumeGame() {
      if (this.state !== 'PAUSED') return;
      this.state = 'PLAYING';
      this.pauseScreen.classList.add('hidden');
      this.btnPause.innerHTML = '⏸';
      this.lastFrameTime = performance.now();
    }

    gameOver() {
      this.state = 'GAMEOVER';
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('fruit_slice_highscore', this.highScore.toString());
        this.updateHighScoresDisplay();
      }

      this.finalScoreEl.textContent = this.score;
      this.finalHighScoreEl.textContent = this.highScore;
      this.gameOverScreen.classList.remove('hidden');

      if (window.arcadeDB) {
        window.arcadeDB.recordScore('fruit-blade', this.score, {
          durationSec: Math.floor(this.gameTime),
          highScore: this.highScore
        });
      }

      if (window.soundManager) window.soundManager.playExplosion();
    }

    addStrike() {
      this.strikes++;
      this.updateStrikesUI();
      if (window.soundManager) window.soundManager.playStrike();

      this.triggerScreenShake(8, 200);

      if (this.strikes >= MAX_STRIKES) {
        this.gameOver();
      }
    }

    updateStrikesUI() {
      this.strikeIcons.forEach((el, index) => {
        if (index < this.strikes) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }

    triggerScreenShake(intensity, duration) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
    }

    // --- Entity Spawning ---

    spawnWave() {
      const count = Math.random() < 0.35 ? 3 : (Math.random() < 0.65 ? 2 : 1);
      const hasBomb = Math.random() < 0.28 && this.score >= 30;

      for (let i = 0; i < count; i++) {
        this.spawnFruit(i, count);
      }

      if (hasBomb) {
        this.spawnBomb();
      }
    }

    spawnFruit(index, total) {
      const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
      
      // Spawn along bottom boundary
      const margin = 80;
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = this.height + 30;

      // Projectile arc velocity towards center
      const targetX = this.width * 0.5 + (Math.random() - 0.5) * (this.width * 0.4);
      const vx = (targetX - x) * 0.018 + (Math.random() - 0.5) * 2;
      const vy = -(13 + Math.random() * 3.5);

      this.fruits.push({
        type: type,
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: type.radius,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.08,
        sliced: false
      });
    }

    spawnBomb() {
      const margin = 100;
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = this.height + 30;
      const targetX = this.width * 0.5 + (Math.random() - 0.5) * (this.width * 0.3);
      const vx = (targetX - x) * 0.016 + (Math.random() - 0.5) * 1.5;
      const vy = -(12 + Math.random() * 3);

      this.bombs.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: BOMB_RADIUS,
        angle: 0,
        fuseTimer: 0
      });
    }

    // --- Slice Collision Detection ---

    checkSlices() {
      if (this.trail.length < 2) return;
      const p1 = this.trail[this.trail.length - 2];
      const p2 = this.trail[this.trail.length - 1];

      // Check Fruit Collisions
      for (let i = this.fruits.length - 1; i >= 0; i--) {
        const fruit = this.fruits[i];
        if (fruit.sliced) continue;

        if (this.lineIntersectsCircle(p1, p2, fruit, fruit.radius)) {
          this.sliceFruit(fruit, i, p1, p2);
        }
      }

      // Check Bomb Collisions
      for (let i = this.bombs.length - 1; i >= 0; i--) {
        const bomb = this.bombs[i];
        if (this.lineIntersectsCircle(p1, p2, bomb, bomb.radius)) {
          this.sliceBomb(bomb, i);
        }
      }
    }

    lineIntersectsCircle(p1, p2, c, r) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) return false;

      const u = Math.max(0, Math.min(1, ((c.x - p1.x) * dx + (c.y - p1.y) * dy) / (len * len)));
      const nearestX = p1.x + u * dx;
      const nearestY = p1.y + u * dy;

      return Math.hypot(c.x - nearestX, c.y - nearestY) <= r;
    }

    sliceFruit(fruit, index, p1, p2) {
      fruit.sliced = true;
      this.fruits.splice(index, 1);

      const now = Date.now();
      if (now - this.lastSliceTime < COMBO_WINDOW_MS) {
        this.currentCombo++;
      } else {
        this.currentCombo = 1;
      }
      this.lastSliceTime = now;

      // Slice angle
      const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perpAngle = sliceAngle + Math.PI / 2;
      const spreadSpeed = 3.2;

      // Spawn two distinct halves
      this.halves.push({
        type: fruit.type,
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx + Math.cos(perpAngle) * spreadSpeed,
        vy: fruit.vy + Math.sin(perpAngle) * spreadSpeed - 1,
        angle: fruit.angle,
        angularVelocity: -0.12,
        half: 'left',
        radius: fruit.radius
      });

      this.halves.push({
        type: fruit.type,
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx - Math.cos(perpAngle) * spreadSpeed,
        vy: fruit.vy - Math.sin(perpAngle) * spreadSpeed - 1,
        angle: fruit.angle,
        angularVelocity: 0.12,
        half: 'right',
        radius: fruit.radius
      });

      // Juice Burst Particles
      this.createJuiceSplash(fruit.x, fruit.y, fruit.type.color);

      // Score calculation & Combo bonus
      let points = fruit.type.points;
      if (this.currentCombo >= 2) {
        const bonus = this.currentCombo * 10;
        points += bonus;
        this.showComboNotice(this.currentCombo, bonus);
        if (window.soundManager) window.soundManager.playCombo(this.currentCombo);
      } else {
        if (window.soundManager) window.soundManager.playSplat();
      }

      this.score += points;
      this.scoreValEl.textContent = this.score;

      this.floatingTexts.push({
        text: `+${points}`,
        x: fruit.x,
        y: fruit.y,
        alpha: 1,
        color: fruit.type.color
      });
    }

    showComboNotice(combo, bonus) {
      this.comboBanner.textContent = `COMBO x${combo}! +${bonus}`;
      this.comboBanner.classList.add('show');
      clearTimeout(this.comboTimeout);
      this.comboTimeout = setTimeout(() => {
        this.comboBanner.classList.remove('show');
      }, 700);
    }

    evaluateComboEnd() {
      // Combo ends when swiping finishes
      setTimeout(() => {
        if (Date.now() - this.lastSliceTime > COMBO_WINDOW_MS) {
          this.currentCombo = 0;
        }
      }, COMBO_WINDOW_MS);
    }

    sliceBomb(bomb, index) {
      this.bombs.splice(index, 1);
      this.createExplosionParticles(bomb.x, bomb.y);
      this.triggerScreenShake(20, 450);
      this.addStrike();
    }

    createJuiceSplash(x, y, color) {
      const count = 18;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 7;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random() * 3.5,
          color: color,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02
        });
      }

      // Splatter Decal on Canvas background
      this.splatters.push({
        x: x,
        y: y,
        radius: 12 + Math.random() * 16,
        color: color,
        alpha: 0.5,
        decay: 0.003
      });
      if (this.splatters.length > 25) this.splatters.shift();
    }

    createExplosionParticles(x, y) {
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 10;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 5,
          color: Math.random() < 0.5 ? '#FF0055' : '#FFEA00',
          alpha: 1,
          decay: 0.025
        });
      }
    }

    // --- Main Game Loop ---

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
      if (this.state !== 'PLAYING') return;

      this.gameTime += dt;

      // Dynamic difficulty scaling
      this.spawnInterval = Math.max(900, 2100 - Math.floor(this.score / 60) * 150);

      if (performance.now() - this.lastSpawnTime > this.spawnInterval) {
        this.spawnWave();
        this.lastSpawnTime = performance.now();
      }

      // Update Screen Shake
      if (this.shakeDuration > 0) {
        this.shakeDuration -= dt * 1000;
        if (this.shakeDuration <= 0) this.shakeIntensity = 0;
      }

      // Update Fruits
      for (let i = this.fruits.length - 1; i >= 0; i--) {
        const f = this.fruits[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += GRAVITY;
        f.angle += f.angularVelocity;

        // If fell below screen without being sliced
        if (f.y > this.height + 60 && f.vy > 0) {
          this.fruits.splice(i, 1);
          this.addStrike();
        }
      }

      // Update Halves
      for (let i = this.halves.length - 1; i >= 0; i--) {
        const h = this.halves[i];
        h.x += h.vx;
        h.y += h.vy;
        h.vy += GRAVITY * 1.1;
        h.angle += h.angularVelocity;

        if (h.y > this.height + 80) {
          this.halves.splice(i, 1);
        }
      }

      // Update Bombs
      for (let i = this.bombs.length - 1; i >= 0; i--) {
        const b = this.bombs[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += GRAVITY;
        b.fuseTimer += dt * 10;

        if (b.y > this.height + 60 && b.vy > 0) {
          this.bombs.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY * 0.6;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // Update Splatters
      for (let i = this.splatters.length - 1; i >= 0; i--) {
        const s = this.splatters[i];
        s.alpha -= s.decay;
        if (s.alpha <= 0) {
          this.splatters.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const t = this.floatingTexts[i];
        t.y -= 1.2;
        t.alpha -= 0.02;
        if (t.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }

      // Age swipe trail points
      const now = Date.now();
      this.trail = this.trail.filter(pt => now - pt.time < 160);
    }

    render() {
      this.ctx.save();

      // Screen shake translation
      if (this.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        this.ctx.translate(sx, sy);
      }

      // Clear Canvas
      this.ctx.clearRect(0, 0, this.width, this.height);

      // Render Juice Splatters on background
      this.renderSplatters();

      // Render Halves
      this.halves.forEach(h => this.drawFruitHalf(h));

      // Render Whole Fruits
      this.fruits.forEach(f => this.drawFruit(f));

      // Render Bombs
      this.bombs.forEach(b => this.drawBomb(b));

      // Render Particles
      this.renderParticles();

      // Render Blade Swipe Trail
      this.renderBladeTrail();

      // Render Floating Score Popups
      this.renderFloatingTexts();

      this.ctx.restore();
    }

    renderSplatters() {
      this.splatters.forEach(s => {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, s.alpha);
        this.ctx.fillStyle = s.color;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    drawFruit(f) {
      this.ctx.save();
      this.ctx.translate(f.x, f.y);
      this.ctx.rotate(f.angle);

      const r = f.radius;

      if (f.type.id === 'watermelon') {
        // Outer dark green rind
        this.ctx.fillStyle = '#1B5E20';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
        // Inner white rind
        this.ctx.fillStyle = '#E8F5E9';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        this.ctx.fill();
        // Red pulp
        this.ctx.fillStyle = '#FF1744';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
        this.ctx.fill();
        // Seeds
        this.ctx.fillStyle = '#212121';
        [-8, 8].forEach(sx => {
          this.ctx.beginPath();
          this.ctx.ellipse(sx, -4, 2, 3.5, 0.3, 0, Math.PI * 2);
          this.ctx.fill();
        });
      } else if (f.type.id === 'orange') {
        this.ctx.fillStyle = '#E65100';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FFE082';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#FF6D00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (f.type.id === 'apple') {
        this.ctx.fillStyle = '#D50000';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
        // Apple shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.beginPath();
        this.ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Generic bright fruit circle with highlights
        this.ctx.fillStyle = f.type.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(-r * 0.28, -r * 0.28, r * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    drawFruitHalf(h) {
      this.ctx.save();
      this.ctx.translate(h.x, h.y);
      this.ctx.rotate(h.angle);

      const r = h.radius;
      const startAngle = h.half === 'left' ? Math.PI * 0.5 : -Math.PI * 0.5;
      const endAngle = h.half === 'left' ? Math.PI * 1.5 : Math.PI * 0.5;

      this.ctx.fillStyle = h.type.rindColor || '#2E7D32';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.fillStyle = h.type.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r * 0.8, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    drawBomb(b) {
      this.ctx.save();
      this.ctx.translate(b.x, b.y);

      // Black bomb sphere
      this.ctx.fillStyle = '#1A1A24';
      this.ctx.beginPath();
      this.ctx.arc(0, 4, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#323246';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Shiny highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(-b.radius * 0.35, -b.radius * 0.25 + 4, b.radius * 0.25, b.radius * 0.15, -0.6, 0, Math.PI * 2);
      this.ctx.fill();

      // Fuse collar & rope
      this.ctx.fillStyle = '#6D4C41';
      this.ctx.fillRect(-4, -b.radius + 1, 8, 6);
      this.ctx.strokeStyle = '#D7CCC8';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -b.radius + 1);
      this.ctx.quadraticCurveTo(8, -b.radius - 8, 4, -b.radius - 14);
      this.ctx.stroke();

      // Fuse animated Spark
      const sparkSize = 4 + Math.sin(b.fuseTimer) * 2;
      this.ctx.fillStyle = '#FFEA00';
      this.ctx.shadowColor = '#FF3D00';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(4, -b.radius - 14, sparkSize, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    renderParticles() {
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    renderBladeTrail() {
      if (this.trail.length < 2) return;

      this.ctx.save();
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      for (let i = 1; i < this.trail.length; i++) {
        const p1 = this.trail[i - 1];
        const p2 = this.trail[i];
        const progress = i / this.trail.length;

        // Glowing outer blade
        this.ctx.strokeStyle = 'rgba(0, 245, 212, ' + (progress * 0.8) + ')';
        this.ctx.lineWidth = progress * 7;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();

        // Sharp white inner blade
        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + progress + ')';
        this.ctx.lineWidth = progress * 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    renderFloatingTexts() {
      this.floatingTexts.forEach(t => {
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, t.alpha);
        this.ctx.fillStyle = t.color || '#FFFFFF';
        this.ctx.font = 'bold 22px system-ui, sans-serif';
        this.ctx.shadowColor = 'rgba(0,0,0,0.6)';
        this.ctx.shadowBlur = 6;
        this.ctx.fillText(t.text, t.x, t.y);
        this.ctx.restore();
      });
    }
  }

  // Auto-initialize when DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new FruitSliceGame();
  });
})();

