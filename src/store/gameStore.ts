import { create } from 'zustand';

export type GameState = 'idle' | 'playing' | 'gameOver';
export type Lane = -1 | 0 | 1;

export type ObstacleType = 'redCandle' | 'bearTrap' | 'fudCloud' | 'liquidationSpike' | 'crashingChart' | 'pumpFun';

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: Lane;
  z: number;
  passed: boolean;
  nearMissTriggered: boolean;
}

interface GameStore {
  gameState: GameState;
  distance: number;
  speed: number;
  currentLane: Lane;
  targetLane: Lane;
  isJumping: boolean;
  isSliding: boolean;
  jumpProgress: number;
  slideProgress: number;
  startTime: number;
  obstacles: Obstacle[];
  nextObstacleId: number;
  lastSpawnDistance: number;
  nearMissCount: number;
  screenShake: boolean;
  difficultyLevel: number;

  startGame: () => void;
  endGame: () => void;
  switchLane: (direction: -1 | 1) => void;
  jump: () => void;
  slide: () => void;
  tick: (delta: number) => void;
  spawnObstacle: () => void;
  setScreenShake: (shake: boolean) => void;
  resetGame: () => void;
}

const INITIAL_SPEED = 18;
const MAX_SPEED = 50;
const SPEED_INCREMENT = 0.4; // per 100m — faster ramp
const LANE_WIDTH_VALUE = 3.5;
const JUMP_DURATION = 0.55;
const SLIDE_DURATION = 0.45;
const MIN_SPAWN_GAP = 14; // tighter at high difficulty
const INITIAL_SPAWN_INTERVAL = 30;

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'idle',
  distance: 0,
  speed: INITIAL_SPEED,
  currentLane: 0,
  targetLane: 0,
  isJumping: false,
  isSliding: false,
  jumpProgress: 0,
  slideProgress: 0,
  startTime: 0,
  obstacles: [],
  nextObstacleId: 0,
  lastSpawnDistance: 0,
  nearMissCount: 0,
  screenShake: false,
  difficultyLevel: 0,

  startGame: () => {
    set({
      gameState: 'playing',
      distance: 0,
      speed: INITIAL_SPEED,
      currentLane: 0,
      targetLane: 0,
      isJumping: false,
      isSliding: false,
      jumpProgress: 0,
      slideProgress: 0,
      startTime: Date.now(),
      obstacles: [],
      nextObstacleId: 0,
      lastSpawnDistance: 0,
      nearMissCount: 0,
      screenShake: false,
      difficultyLevel: 0,
    });
  },

  endGame: () => {
    set({ gameState: 'gameOver' });
  },

  switchLane: (direction: -1 | 1) => {
    const { targetLane, gameState } = get();
    if (gameState !== 'playing') return;
    const newLane = Math.max(-1, Math.min(1, targetLane + direction)) as Lane;
    if (newLane !== targetLane) {
      set({ targetLane: newLane });
    }
  },

  jump: () => {
    const { isJumping, isSliding, gameState } = get();
    if (gameState !== 'playing' || isJumping || isSliding) return;
    set({ isJumping: true, jumpProgress: 0 });
  },

  slide: () => {
    const { isJumping, isSliding, gameState } = get();
    if (gameState !== 'playing' || isJumping || isSliding) return;
    set({ isSliding: true, slideProgress: 0 });
  },

  tick: (delta: number) => {
    const state = get();
    if (state.gameState !== 'playing') return;

    const newDistance = state.distance + state.speed * delta;
    const speedLevel = Math.floor(newDistance / 100);
    const newSpeed = Math.min(INITIAL_SPEED + speedLevel * SPEED_INCREMENT, MAX_SPEED);

    // Difficulty level increases every 500m
    const newDifficulty = Math.floor(newDistance / 500);

    // Update jump
    let isJumping = state.isJumping;
    let jumpProgress = state.jumpProgress;
    if (isJumping) {
      jumpProgress += delta / JUMP_DURATION;
      if (jumpProgress >= 1) {
        isJumping = false;
        jumpProgress = 0;
      }
    }

    // Update slide
    let isSliding = state.isSliding;
    let slideProgress = state.slideProgress;
    if (isSliding) {
      slideProgress += delta / SLIDE_DURATION;
      if (slideProgress >= 1) {
        isSliding = false;
        slideProgress = 0;
      }
    }

    // Lane transition
    let newCurrentLane = state.targetLane;

    // Move obstacles
    const moveAmount = state.speed * delta;
    const updatedObstacles = state.obstacles
      .map(obs => ({
        ...obs,
        z: obs.z - moveAmount,
      }))
      .filter(obs => obs.z > -15);

    // Spawn new obstacles with difficulty scaling
    const spawnInterval = Math.max(
      MIN_SPAWN_GAP,
      INITIAL_SPAWN_INTERVAL - speedLevel * 0.6 - newDifficulty * 1.5
    );
    let lastSpawnDist = state.lastSpawnDistance;
    let nextId = state.nextObstacleId;
    if (newDistance - lastSpawnDist >= spawnInterval) {
      const types: ObstacleType[] = ['redCandle', 'bearTrap', 'fudCloud', 'liquidationSpike', 'crashingChart', 'pumpFun'];
      const type = types[Math.floor(Math.random() * types.length)];
      const lanes: Lane[] = [-1, 0, 1];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];

      updatedObstacles.push({
        id: nextId,
        type,
        lane,
        z: 100 + Math.random() * 20,
        passed: false,
        nearMissTriggered: false,
      });

      // At higher difficulty, spawn more obstacles per wave
      const multiObstacleChance = Math.min(0.8, 0.3 + newDifficulty * 0.1);
      if (Math.random() < multiObstacleChance) {
        const otherLanes = lanes.filter(l => l !== lane);
        const secondLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const secondType = types[Math.floor(Math.random() * types.length)];
        updatedObstacles.push({
          id: nextId + 1,
          type: secondType,
          lane: secondLane,
          z: 100 + Math.random() * 20,
          passed: false,
          nearMissTriggered: false,
        });
        nextId++;
      }

      // At very high difficulty (2000m+), sometimes triple obstacles
      if (newDifficulty >= 4 && Math.random() < 0.3) {
        const thirdLane = lanes[Math.floor(Math.random() * lanes.length)];
        const thirdType = types[Math.floor(Math.random() * types.length)];
        updatedObstacles.push({
          id: nextId + 1,
          type: thirdType,
          lane: thirdLane,
          z: 110 + Math.random() * 15,
          passed: false,
          nearMissTriggered: false,
        });
        nextId++;
      }

      lastSpawnDist = newDistance;
      nextId++;
    }

    set({
      distance: newDistance,
      speed: newSpeed,
      currentLane: newCurrentLane,
      isJumping,
      jumpProgress,
      isSliding,
      slideProgress,
      obstacles: updatedObstacles,
      lastSpawnDistance: lastSpawnDist,
      nextObstacleId: nextId,
      difficultyLevel: newDifficulty,
    });
  },

  spawnObstacle: () => {},

  setScreenShake: (shake: boolean) => {
    set({ screenShake: shake });
  },

  resetGame: () => {
    set({
      gameState: 'idle',
      distance: 0,
      speed: INITIAL_SPEED,
      currentLane: 0,
      targetLane: 0,
      isJumping: false,
      isSliding: false,
      jumpProgress: 0,
      slideProgress: 0,
      startTime: 0,
      obstacles: [],
      nextObstacleId: 0,
      lastSpawnDistance: 0,
      nearMissCount: 0,
      screenShake: false,
      difficultyLevel: 0,
    });
  },
}));

export const LANE_WIDTH = LANE_WIDTH_VALUE;
