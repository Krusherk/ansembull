import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const SEGMENT_LENGTH = 30;
const SEGMENT_COUNT = 8;
const LANE_WIDTH = 3.5;

// Individual ground segment
function GroundSegment({ index }: { index: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const initialZ = index * SEGMENT_LENGTH;

  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.08)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 16; i++) {
      const pos = (i / 16) * 512;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(512, pos);
      ctx.stroke();
    }

    // Lane dividers (brighter)
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.lineWidth = 2;
    const lanePositions = [512 / 3, (512 * 2) / 3];
    lanePositions.forEach(pos => {
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 512);
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    return texture;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const { speed, gameState } = useGameStore.getState();
    if (gameState !== 'playing') return;

    // Move toward camera — handled by z offset from distance
    const distance = useGameStore.getState().distance;
    const totalLength = SEGMENT_COUNT * SEGMENT_LENGTH;
    let z = initialZ - (distance % totalLength);
    if (z < -SEGMENT_LENGTH) z += totalLength;
    meshRef.current.position.z = z;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, initialZ]}
      receiveShadow
    >
      <planeGeometry args={[LANE_WIDTH * 3 + 2, SEGMENT_LENGTH]} />
      <meshStandardMaterial
        map={gridTexture}
        color="#0d0d15"
        roughness={0.8}
        metalness={0.3}
      />
    </mesh>
  );
}

// Side decoration: green/red candle sticks
function SideCandle({ side, index }: { side: 'left' | 'right'; index: number }) {
  const meshRef = useRef<THREE.Group>(null!);
  const height = 2 + Math.random() * 8;
  const isGreen = Math.random() > 0.4;
  const xPos = side === 'left' ? -(LANE_WIDTH * 1.5 + 3 + Math.random() * 4) : (LANE_WIDTH * 1.5 + 3 + Math.random() * 4);
  const initialZ = index * 15 + Math.random() * 10;

  const color = isGreen ? '#00ff88' : '#ff3355';
  const emissiveIntensity = 0.3 + Math.random() * 0.3;

  useFrame(() => {
    if (!meshRef.current) return;
    const { distance, gameState } = useGameStore.getState();
    if (gameState !== 'playing') return;

    const totalLength = 20 * 15;
    let z = initialZ - (distance % totalLength);
    if (z < -20) z += totalLength;
    meshRef.current.position.z = z;
  });

  return (
    <group ref={meshRef} position={[xPos, 0, initialZ]}>
      {/* Candle body */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.6, height, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Wick */}
      <mesh position={[0, height + 0.5, 0]}>
        <boxGeometry args={[0.08, 1.0, 0.08]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

// Neon edge rails
function EdgeRails() {
  const leftRef = useRef<THREE.Mesh>(null!);
  const rightRef = useRef<THREE.Mesh>(null!);

  return (
    <>
      <mesh position={[-(LANE_WIDTH * 1.5 + 1), 0.1, 50]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 200]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh position={[(LANE_WIDTH * 1.5 + 1), 0.1, 50]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 200]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  );
}

export default function World() {
  const segments = useMemo(() =>
    Array.from({ length: SEGMENT_COUNT }, (_, i) => i), []);

  const candles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => i), []);

  return (
    <group>
      {/* Ground segments */}
      {segments.map(i => (
        <GroundSegment key={i} index={i} />
      ))}

      {/* Side candles */}
      {candles.map(i => (
        <SideCandle key={`left-${i}`} side="left" index={i} />
      ))}
      {candles.map(i => (
        <SideCandle key={`right-${i}`} side="right" index={i} />
      ))}

      {/* Edge rails */}
      <EdgeRails />

      {/* Fog floor plane for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 60]} receiveShadow>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial
          color="#060610"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
