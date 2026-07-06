import { create } from 'zustand';

export type GameState = 'idle' | 'playing' | 'gameOver';
export type Lane = -1 | 0 | 1;

export type ObstacleType = 'redCandle' | 'bearTrap' | 'fudCloud' | 'liquidationSpike' | 'crashingChart';

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: Lane;
  z: number;
  passed: boolean;
  nearMissTriggered: boolean;
}

interface GameStore {
  // State
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

  // Actions
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
const MAX_SPEED = 45;
const SPEED_INCREMENT = 0.3; // per 100m
const LANE_WIDTH_VALUE = 3.5;
const JUMP_DURATION = 0.55;
const SLIDE_DURATION = 0.45;
const MIN_SPAWN_GAP = 20;
const INITIAL_SPAWN_INTERVAL = 35;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
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

    // Update distance and speed
    const newDistance = state.distance + state.speed * delta;
    const speedLevel = Math.floor(newDistance / 100);
    const newSpeed = Math.min(INITIAL_SPEED + speedLevel * SPEED_INCREMENT, MAX_SPEED);

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

    // Smooth lane transition
    const laneX = state.targetLane * LANE_WIDTH_VALUE;
    const currentLaneSmooth = state.currentLane * LANE_WIDTH_VALUE;
    const diff = laneX - currentLaneSmooth;
    let newCurrentLane = state.targetLane;
    if (Math.abs(diff) > 0.01) {
      // Keep currentLane as target while transitioning (visual handled in Player)
      newCurrentLane = state.targetLane;
    }

    // Move obstacles
    const moveAmount = state.speed * delta;
    const updatedObstacles = state.obstacles
      .map(obs => ({
        ...obs,
        z: obs.z - moveAmount,
      }))
      .filter(obs => obs.z > -15); // Remove obstacles that passed

    // Spawn new obstacles
    const spawnInterval = Math.max(
      MIN_SPAWN_GAP,
      INITIAL_SPAWN_INTERVAL - speedLevel * 0.5
    );
    let lastSpawnDist = state.lastSpawnDistance;
    let nextId = state.nextObstacleId;
    if (newDistance - lastSpawnDist >= spawnInterval) {
      const types: ObstacleType[] = ['redCandle', 'bearTrap', 'fudCloud', 'liquidationSpike', 'crashingChart'];
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

      // Sometimes spawn a second obstacle in a different lane for difficulty
      if (newSpeed > 25 && Math.random() > 0.5) {
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
    });
  },

  spawnObstacle: () => {
    // Manual spawn (handled in tick now)
  },

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
    });
  },
}));

export const LANE_WIDTH = LANE_WIDTH_VALUE;
