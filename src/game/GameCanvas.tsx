import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import Player from './Player';
import World from './World';
import Obstacles from './Obstacles';
import Collision from './Collision';
import Particles from './Particles';
import Controls from './Controls';

/** Drives the game loop each frame */
function GameTicker() {
  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameState === 'playing') {
      // Cap delta to prevent huge jumps on tab refocus
      const clampedDelta = Math.min(delta, 0.05);
      state.tick(clampedDelta);
    }
  });

  return null;
}

export default function GameCanvas() {
  const screenShake = useGameStore(state => state.screenShake);

  return (
    <div className={`game-container ${screenShake ? 'screen-shake' : ''}`}>
      <Canvas
        camera={{
          position: [0, 6, -8],
          fov: 65,
          near: 0.1,
          far: 200,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 1.5, 15);
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} color="#8888cc" />
        <directionalLight
          position={[5, 15, -5]}
          intensity={0.8}
          color="#ffffff"
        />
        {/* Neon green accent light from below */}
        <pointLight
          position={[0, 0.5, 5]}
          intensity={1.5}
          color="#00ff88"
          distance={20}
          decay={2}
        />
        {/* Purple ambient from sides */}
        <pointLight
          position={[-10, 5, 20]}
          intensity={0.6}
          color="#8b5cf6"
          distance={40}
          decay={2}
        />
        <pointLight
          position={[10, 5, 20]}
          intensity={0.6}
          color="#8b5cf6"
          distance={40}
          decay={2}
        />
        {/* Red warning light far ahead */}
        <pointLight
          position={[0, 3, 60]}
          intensity={0.4}
          color="#ff3355"
          distance={50}
          decay={2}
        />

        {/* Fog */}
        <fog attach="fog" args={['#0a0a0f', 30, 120]} />

        {/* Background color */}
        <color attach="background" args={['#0a0a0f']} />

        {/* Game elements */}
        <World />
        <Player />
        <Obstacles />
        <Collision />
        <Particles />
        <Controls />

        {/* Game loop ticker */}
        <GameTicker />
      </Canvas>
    </div>
  );
}
