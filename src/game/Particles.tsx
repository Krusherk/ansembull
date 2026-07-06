import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const PARTICLE_COUNT = 80;
const LANE_WIDTH = 3.5;

export default function Particles() {
  const dustRef = useRef<THREE.Points>(null!);
  const positionsRef = useRef<Float32Array>(null!);
  const velocitiesRef = useRef<Float32Array>(null!);
  const lifetimesRef = useRef<Float32Array>(null!);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const lifetimes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -10; // Start hidden below
      positions[i * 3 + 2] = 0;
      lifetimes[i] = 0;
    }

    positionsRef.current = positions;
    velocitiesRef.current = velocities;
    lifetimesRef.current = lifetimes;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: '#00ff88',
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat };
  }, []);

  let nextParticle = useRef(0);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.gameState !== 'playing') return;
    if (!positionsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;

    const playerX = state.targetLane * LANE_WIDTH;

    // Spawn new particles (running dust)
    if (!state.isJumping) {
      for (let s = 0; s < 2; s++) {
        const idx = nextParticle.current;
        positions[idx * 3] = playerX + (Math.random() - 0.5) * 1.0;
        positions[idx * 3 + 1] = 0.1 + Math.random() * 0.3;
        positions[idx * 3 + 2] = -1.5 + (Math.random() - 0.5) * 0.5;

        velocities[idx * 3] = (Math.random() - 0.5) * 2;
        velocities[idx * 3 + 1] = Math.random() * 2;
        velocities[idx * 3 + 2] = -state.speed * 0.3 - Math.random() * 3;

        lifetimes[idx] = 0.5 + Math.random() * 0.5;

        nextParticle.current = (nextParticle.current + 1) % PARTICLE_COUNT;
      }
    }

    // Update particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (lifetimes[i] > 0) {
        lifetimes[i] -= delta;

        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Gravity
        velocities[i * 3 + 1] -= 4 * delta;
      } else {
        positions[i * 3 + 1] = -10; // Hide
      }
    }

    if (dustRef.current) {
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={dustRef} geometry={geometry} material={material} />
  );
}
