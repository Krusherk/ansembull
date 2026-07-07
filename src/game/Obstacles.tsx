import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, ObstacleType, Obstacle } from '../store/gameStore';

const LANE_WIDTH = 3.5;

interface ObstacleMeshProps {
  obstacle: Obstacle;
}

// Red Candle — tall vertical obstacle, must dodge lanes
function RedCandle({ obstacle }: ObstacleMeshProps) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(obstacle.lane * LANE_WIDTH, 0, obstacle.z);
    ref.current.rotation.y += 0.01;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[0.8, 5, 0.8]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#991122" />
      </mesh>
      {/* Glow ring at base */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 1.2, 16]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={1.0}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Bear Trap — low obstacle on ground, must jump
function BearTrap({ obstacle }: ObstacleMeshProps) {
  const ref = useRef<THREE.Group>(null!);
  const jawRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.set(obstacle.lane * LANE_WIDTH, 0, obstacle.z);
    // Snap animation
    if (jawRef.current) {
      jawRef.current.rotation.x = Math.sin(Date.now() * 0.005) * 0.3;
    }
  });

  return (
    <group ref={ref}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 8]} />
        <meshStandardMaterial color="#333344" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Teeth spikes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.0, 0.5, Math.sin(angle) * 1.0]}
          >
            <coneGeometry args={[0.1, 0.7, 4]} />
            <meshStandardMaterial
              color="#ff3355"
              emissive="#ff3355"
              emissiveIntensity={0.5}
              metalness={0.8}
            />
          </mesh>
        );
      })}
      {/* Jaw */}
      <mesh ref={jawRef} position={[0, 0.6, 0]}>
        <torusGeometry args={[1.0, 0.08, 4, 8]} />
        <meshStandardMaterial color="#ff5577" metalness={0.9} />
      </mesh>
    </group>
  );
}

// FUD Cloud — floating obstacle, must slide under
function FudCloud({ obstacle }: ObstacleMeshProps) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(obstacle.lane * LANE_WIDTH, 3.0, obstacle.z);
    ref.current.rotation.y += 0.008;
  });

  return (
    <group ref={ref}>
      {/* Cloud spheres */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 12, 12]} />
        <meshStandardMaterial
          color="#2a1530"
          emissive="#ff3355"
          emissiveIntensity={0.15}
          transparent
          opacity={0.7}
          roughness={1}
        />
      </mesh>
      <mesh position={[-0.6, 0.3, 0.3]}>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshStandardMaterial
          color="#2a1530"
          transparent
          opacity={0.6}
          roughness={1}
        />
      </mesh>
      <mesh position={[0.7, -0.2, -0.2]}>
        <sphereGeometry args={[0.9, 10, 10]} />
        <meshStandardMaterial
          color="#1a0a20"
          transparent
          opacity={0.6}
          roughness={1}
        />
      </mesh>
      {/* "FUD" text would go here - using a marker */}
      <mesh position={[0, 0, 1.0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// Liquidation Spike — sharp spike from ground, must switch lanes
function LiquidationSpike({ obstacle }: ObstacleMeshProps) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(obstacle.lane * LANE_WIDTH, 0, obstacle.z);
  });

  return (
    <group ref={ref}>
      {/* Main spike */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.6, 3.0, 6]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      {/* Side spikes */}
      <mesh position={[-0.5, 0.8, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.3, 1.6, 4]} />
        <meshStandardMaterial
          color="#cc2244"
          emissive="#ff3355"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0.5, 0.8, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.3, 1.6, 4]} />
        <meshStandardMaterial
          color="#cc2244"
          emissive="#ff3355"
          emissiveIntensity={0.3}
          metalness={0.8}
        />
      </mesh>
      {/* Base glow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 16]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={0.8}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Crashing Chart Line — zigzag across lane, must jump
function CrashingChart({ obstacle }: ObstacleMeshProps) {
  const ref = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(obstacle.lane * LANE_WIDTH, 0, obstacle.z);
  });

  return (
    <group ref={ref}>
      {/* Zigzag chart line built from small box segments */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = (i - 3) * 0.35;
        const y = 0.5 + ((i % 2 === 0) ? 0.8 : 0.2);
        const nextY = 0.5 + (((i + 1) % 2 === 0) ? 0.8 : 0.2);
        const angle = Math.atan2(nextY - y, 0.35);
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
            <meshStandardMaterial
              color="#ff3355"
              emissive="#ff3355"
              emissiveIntensity={0.8}
            />
          </mesh>
        );
      })}
      {/* Solid barrier version */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2.5, 1.2, 0.3]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      {/* Chart arrow down */}
      <mesh position={[0.8, 1.5, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.2, 0.5, 4]} />
        <meshStandardMaterial
          color="#ff3355"
          emissive="#ff3355"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

const ObstacleComponents: Record<ObstacleType, React.ComponentType<ObstacleMeshProps>> = {
  redCandle: RedCandle,
  bearTrap: BearTrap,
  fudCloud: FudCloud,
  liquidationSpike: LiquidationSpike,
  crashingChart: CrashingChart,
};

export default function Obstacles() {
  const obstacles = useGameStore(state => state.obstacles);

  return (
    <group>
      {obstacles.map(obstacle => {
        const Component = ObstacleComponents[obstacle.type];
        return <Component key={obstacle.id} obstacle={obstacle} />;
      })}
    </group>
  );
}
