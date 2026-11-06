/**
 * Memory Match - Brain Card Matching Mini-Game Engine
 * Interactive, responsive, accessible, with Web Audio sound synthesis.
 */

(function () {
  'use strict';

  // Distinct Arcade Symbols
  const SYMBOL_POOL = [
    { id: 'star', symbol: '⭐', label: 'Star' },
    { id: 'diamond', symbol: '💎', label: 'Diamond' },
    { id: 'rocket', symbol: '🚀', label: 'Rocket' },
    { id: 'crown', symbol: '👑', label: 'Crown' },
    { id: 'trophy', symbol: '🏆', label: 'Trophy' },
    { id: 'zap', symbol: '⚡', label: 'Lightning' },
    { id: 'fire', symbol: '🔥', label: 'Flame' },
    { id: 'heart', symbol: '💖', label: 'Heart' },
    { id: 'gamepad', symbol: '🎮', label: 'Gamepad' },
    { id: 'planet', symbol: '🪐', label: 'Planet' }
  ];

  class MemoryMatchGame {
    constructor() {
      this.gridEl = document.getElementById('card-grid');
      this.timerEl = document.getElementById('mem-timer');
      this.movesEl = document.getElementById('mem-moves');
      this.pairsEl = document.getElementById('mem-pairs');
      this.diffSelect = document.getElementById('diff-select');
      this.btnRestart = document.getElementById('btn-restart');
      this.btnMute = document.getElementById('btn-mute');

      // Victory Modal
      this.victoryModal = document.getElementById('victory-modal');
      this.vicTimeEl = document.getElementById('vic-time');
      this.vicMovesEl = document.getElementById('vic-moves');
      this.vicStarsEl = document.getElementById('vic-stars');
      this.btnPlayAgain = document.getElementById('btn-vic-play-again');

      // State
      this.cards = [];
      this.flippedCards = [];
      this.matchedPairs = 0;
      this.totalPairs = 8;
      this.moves = 0;
      this.timerSeconds = 0;
      this.timerInterval = null;
      this.isLocked = false;
      this.gameStarted = false;

      this.init();
    }

    init() {
      this.bindEvents();
      this.updateMuteUI();
      this.startNewGame();
    }

    bindEvents() {
      this.diffSelect.addEventListener('change', () => {
        this.startNewGame();
      });

      this.btnRestart.addEventListener('click', () => {
        if (window.soundManager) window.soundManager.playClick();
        this.startNewGame();
      });

      this.btnPlayAgain.addEventListener('click', () => {
        if (window.soundManager) window.soundManager.playClick();
        this.victoryModal.classList.remove('open');
        this.startNewGame();
      });

      this.btnMute.addEventListener('click', () => {
        if (window.soundManager) {
          window.soundManager.toggleMute();
          this.updateMuteUI();
        }
      });
    }

    updateMuteUI() {
      const isMuted = window.soundManager ? window.soundManager.getMuted() : false;
      this.btnMute.innerHTML = isMuted ? '🔇' : '🔊';
      this.btnMute.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
    }

    startNewGame() {
      this.stopTimer();
      this.timerSeconds = 0;
      this.moves = 0;
      this.matchedPairs = 0;
      this.flippedCards = [];
      this.isLocked = false;
      this.gameStarted = false;

      this.timerEl.textContent = '00:00';
      this.movesEl.textContent = '0';

      const diff = this.diffSelect.value;
      if (diff === 'easy') {
        this.totalPairs = 6;
        this.gridEl.className = 'card-grid grid-12';
      } else if (diff === 'hard') {
        this.totalPairs = 10;
        this.gridEl.className = 'card-grid grid-20';
      } else {
        this.totalPairs = 8;
        this.gridEl.className = 'card-grid grid-16';
      }

      this.pairsEl.textContent = `0 / ${this.totalPairs}`;
      this.generateCards();
    }

    generateCards() {
      this.gridEl.innerHTML = '';

      // Pick symbols for this game
      const chosenSymbols = SYMBOL_POOL.slice(0, this.totalPairs);
      const cardPairs = [...chosenSymbols, ...chosenSymbols];

      // Fisher-Yates Shuffle
      for (let i = cardPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
      }

      this.cards = cardPairs.map((item, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'memory-card';
        cardEl.setAttribute('role', 'button');
        cardEl.setAttribute('tabindex', '0');
        cardEl.setAttribute('aria-label', 'Hidden Card');
        cardEl.dataset.id = item.id;
        cardEl.dataset.index = index;

        cardEl.innerHTML = `
          <div class="card-inner">
            <div class="card-face card-back">
              <svg class="card-back-pattern" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="card-face card-front">
              <span>${item.symbol}</span>
            </div>
          </div>
        `;

        // Click / Touch
        cardEl.addEventListener('click', () => this.handleCardFlip(cardEl));

        // Keyboard navigation (Enter / Space)
        cardEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleCardFlip(cardEl);
          }
        });

        this.gridEl.appendChild(cardEl);
        return { el: cardEl, data: item };
      });
    }

    handleCardFlip(cardEl) {
      if (this.isLocked) return;
      if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

      if (!this.gameStarted) {
        this.gameStarted = true;
        this.startTimer();
      }

      cardEl.classList.add('flipped');
      if (window.soundManager) window.soundManager.playFlip();

      this.flippedCards.push(cardEl);

      if (this.flippedCards.length === 2) {
        this.moves++;
        this.movesEl.textContent = this.moves;
        this.checkMatch();
      }
    }

    checkMatch() {
      const [c1, c2] = this.flippedCards;
      const isMatch = c1.dataset.id === c2.dataset.id;

      if (isMatch) {
        this.isLocked = true;
        setTimeout(() => {
          c1.classList.add('matched');
          c2.classList.add('matched');
          c1.setAttribute('aria-label', `Matched: ${c1.dataset.id}`);
          c2.setAttribute('aria-label', `Matched: ${c2.dataset.id}`);

          this.matchedPairs++;
          this.pairsEl.textContent = `${this.matchedPairs} / ${this.totalPairs}`;
          if (window.soundManager) window.soundManager.playMatch();

          this.flippedCards = [];
          this.isLocked = false;

          if (this.matchedPairs === this.totalPairs) {
            this.handleVictory();
          }
        }, 400);
      } else {
        this.isLocked = true;
        if (window.soundManager) window.soundManager.playMismatch();

        setTimeout(() => {
          c1.classList.remove('flipped');
          c2.classList.remove('flipped');
          this.flippedCards = [];
          this.isLocked = false;
        }, 850);
      }
    }

    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
        const mins = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
        const secs = (this.timerSeconds % 60).toString().padStart(2, '0');
        this.timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    handleVictory() {
      this.stopTimer();
      if (window.soundManager) window.soundManager.playWin();

      // Calculate star rating
      let stars = '⭐⭐⭐';
      const optimalMoves = this.totalPairs * 1.6;
      if (this.moves > optimalMoves * 1.5) {
        stars = '⭐';
      } else if (this.moves > optimalMoves) {
        stars = '⭐⭐';
      }

      const mins = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
      const secs = (this.timerSeconds % 60).toString().padStart(2, '0');
      const timeStr = `${mins}:${secs}`;

      this.vicTimeEl.textContent = timeStr;
      this.vicMovesEl.textContent = this.moves;
      this.vicStarsEl.textContent = stars;

      // Save Best Records in localStorage
      const bestKey = `mem_best_${this.diffSelect.value}`;
      const prevBest = parseInt(localStorage.getItem(bestKey) || '9999', 10);
      if (this.moves < prevBest) {
        localStorage.setItem(bestKey, this.moves.toString());
      }

      if (window.arcadeDB) {
        window.arcadeDB.recordScore('memory-match', this.moves, {
          difficulty: this.diffSelect.value,
          timeFormatted: timeStr,
          timeSeconds: this.timerSeconds,
          stars: stars
        });
      }

      setTimeout(() => {
        this.victoryModal.classList.add('open');
      }, 400);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.memoryMatchInstance = new MemoryMatchGame();
  });
})();

