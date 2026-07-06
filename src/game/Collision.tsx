import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../lib/sounds';

const LANE_WIDTH = 3.5;

// Player hitbox dimensions (slightly smaller than visual for fairness)
const PLAYER_WIDTH = 1.0;  // visual is 1.4
const PLAYER_HEIGHT = 2.0; // visual is ~2.2
const PLAYER_DEPTH = 1.8;  // visual is 2.4

// Obstacle hitbox dimensions per type
const OBSTACLE_HITBOXES: Record<string, { w: number; h: number; d: number; yOffset: number }> = {
  redCandle:        { w: 0.7, h: 4.5, d: 0.7, yOffset: 2.25 },
  bearTrap:         { w: 2.2, h: 0.8, d: 2.2, yOffset: 0.4 },
  fudCloud:         { w: 2.0, h: 2.0, d: 2.0, yOffset: 3.0 },
  liquidationSpike: { w: 1.2, h: 2.8, d: 1.2, yOffset: 1.4 },
  crashingChart:    { w: 2.2, h: 1.0, d: 0.4, yOffset: 0.6 },
};

const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();

export default function Collision() {
  const stepTimerRef = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;

    // Calculate player position
    const playerX = state.targetLane * LANE_WIDTH;
    let playerY = 0;
    let playerHeight = PLAYER_HEIGHT;

    if (state.isJumping) {
      playerY = Math.sin(state.jumpProgress * Math.PI) * 4.5;
    }

    if (state.isSliding) {
      const slideAmount = Math.sin(state.slideProgress * Math.PI);
      playerHeight = PLAYER_HEIGHT * (1 - slideAmount * 0.5);
      playerY = -slideAmount * 0.6;
    }

    // Player bounding box
    playerBox.min.set(
      playerX - PLAYER_WIDTH / 2,
      playerY,
      -PLAYER_DEPTH / 2
    );
    playerBox.max.set(
      playerX + PLAYER_WIDTH / 2,
      playerY + playerHeight,
      PLAYER_DEPTH / 2
    );

    // Check each obstacle
    for (const obstacle of state.obstacles) {
      const hitbox = OBSTACLE_HITBOXES[obstacle.type];
      if (!hitbox) continue;

      const obsX = obstacle.lane * LANE_WIDTH;
      const obsZ = obstacle.z;

      // Obstacle bounding box
      obstacleBox.min.set(
        obsX - hitbox.w / 2,
        hitbox.yOffset - hitbox.h / 2,
        obsZ - hitbox.d / 2
      );
      obstacleBox.max.set(
        obsX + hitbox.w / 2,
        hitbox.yOffset + hitbox.h / 2,
        obsZ + hitbox.d / 2
      );

      // Collision check
      if (playerBox.intersectsBox(obstacleBox)) {
        soundManager.playCrash();
        state.endGame();
        state.setScreenShake(true);
        setTimeout(() => state.setScreenShake(false), 400);
        return;
      }

      // Near-miss detection (within 2.5 units of Z and same lane)
      if (
        !obstacle.nearMissTriggered &&
        !obstacle.passed &&
        obstacle.lane === state.targetLane &&
        obsZ < 3 && obsZ > -1
      ) {
        // Mark as near miss if we didn't collide but were close
        if (obsZ < 1 && obsZ > -0.5) {
          obstacle.nearMissTriggered = true;
          soundManager.playNearMiss();
        }
      }

      // Mark obstacle as passed
      if (!obstacle.passed && obsZ < -2) {
        obstacle.passed = true;
      }
    }

    // Running footstep sounds
    stepTimerRef.current += delta;
    const stepInterval = 0.15 - (state.speed - 18) * 0.002;
    if (stepTimerRef.current > Math.max(0.06, stepInterval)) {
      stepTimerRef.current = 0;
      if (!state.isJumping) {
        soundManager.playStep();
      }
    }
  });

  return null; // No visual component
}
