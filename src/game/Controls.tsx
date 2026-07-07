import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../lib/sounds';

export default function Controls() {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();

      if (state.gameState === 'idle') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          state.startGame();
        }
        return;
      }

      if (state.gameState !== 'playing') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          // Camera behind player: left on screen = positive lane direction
          state.switchLane(1);
          soundManager.playSwitchLane();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          state.switchLane(-1);
          soundManager.playSwitchLane();
          break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          state.jump();
          soundManager.playJump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          state.slide();
          soundManager.playSlide();
          break;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      const state = useGameStore.getState();

      if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 300) {
        if (state.gameState === 'idle') {
          state.startGame();
        }
        touchStartRef.current = null;
        return;
      }

      if (state.gameState !== 'playing') {
        touchStartRef.current = null;
        return;
      }

      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) >= minSwipe) {
          // Swipe right on screen = lane left (inverted due to camera behind)
          if (dx > 0) {
            state.switchLane(-1);
            soundManager.playSwitchLane();
          } else {
            state.switchLane(1);
            soundManager.playSwitchLane();
          }
        }
      } else {
        if (Math.abs(dy) >= minSwipe) {
          if (dy < 0) {
            state.jump();
            soundManager.playJump();
          } else {
            state.slide();
            soundManager.playSlide();
          }
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null;
}
