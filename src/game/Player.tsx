import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const LANE_WIDTH = 3.5;

export default function Player() {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const currentXRef = useRef(0);
  const legPhaseRef = useRef(0);
  const frontLeftLegRef = useRef<THREE.Mesh>(null!);
  const frontRightLegRef = useRef<THREE.Mesh>(null!);
  const backLeftLegRef = useRef<THREE.Mesh>(null!);
  const backRightLegRef = useRef<THREE.Mesh>(null!);

  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({
      color: '#111118',
      roughness: 0.3,
      metalness: 0.6,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#00ff88',
      emissive: '#00ff88',
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    }),
    horn: new THREE.MeshStandardMaterial({
      color: '#222230',
      roughness: 0.4,
      metalness: 0.7,
    }),
    eye: new THREE.MeshStandardMaterial({
      color: '#00ff88',
      emissive: '#00ff88',
      emissiveIntensity: 2.0,
    }),
    nostril: new THREE.MeshStandardMaterial({
      color: '#0a0a0f',
    }),
  }), []);

  useFrame((_, delta) => {
    const { targetLane, isJumping, jumpProgress, isSliding, slideProgress, gameState, speed } = useGameStore.getState();

    if (!groupRef.current) return;

    // Smooth lane transition
    const targetX = targetLane * LANE_WIDTH;
    currentXRef.current += (targetX - currentXRef.current) * 0.12;
    groupRef.current.position.x = currentXRef.current;

    // Jump arc
    if (isJumping) {
      const jumpHeight = 4.5;
      const arc = Math.sin(jumpProgress * Math.PI);
      groupRef.current.position.y = arc * jumpHeight;
      // Tilt forward slightly during jump
      if (bodyRef.current) {
        bodyRef.current.rotation.x = -arc * 0.3;
      }
    } else {
      groupRef.current.position.y *= 0.85; // Smooth landing
      if (groupRef.current.position.y < 0.05) groupRef.current.position.y = 0;
      if (bodyRef.current) {
        bodyRef.current.rotation.x *= 0.85;
      }
    }

    // Slide
    if (isSliding) {
      const slideAmount = Math.sin(slideProgress * Math.PI);
      if (bodyRef.current) {
        bodyRef.current.scale.y = 1 - slideAmount * 0.5;
        bodyRef.current.position.y = -slideAmount * 0.6;
      }
    } else if (!isJumping && bodyRef.current) {
      bodyRef.current.scale.y += (1 - bodyRef.current.scale.y) * 0.15;
      bodyRef.current.position.y *= 0.85;
    }

    // Running leg animation
    if (gameState === 'playing' && !isJumping && !isSliding) {
      const legSpeed = speed * 0.4;
      legPhaseRef.current += delta * legSpeed;
      const phase = legPhaseRef.current;

      if (frontLeftLegRef.current) {
        frontLeftLegRef.current.rotation.x = Math.sin(phase) * 0.6;
      }
      if (frontRightLegRef.current) {
        frontRightLegRef.current.rotation.x = Math.sin(phase + Math.PI) * 0.6;
      }
      if (backLeftLegRef.current) {
        backLeftLegRef.current.rotation.x = Math.sin(phase + Math.PI) * 0.5;
      }
      if (backRightLegRef.current) {
        backRightLegRef.current.rotation.x = Math.sin(phase) * 0.5;
      }
    }

    // Subtle body bob
    if (gameState === 'playing' && !isJumping && bodyRef.current) {
      const bob = Math.sin(legPhaseRef.current * 2) * 0.05;
      bodyRef.current.position.y += bob;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={bodyRef}>
        {/* Main body */}
        <mesh position={[0, 1.2, 0]} material={materials.body}>
          <boxGeometry args={[1.4, 1.0, 2.4]} />
        </mesh>

        {/* Body top (back hump) */}
        <mesh position={[0, 1.8, -0.3]} material={materials.body}>
          <boxGeometry args={[1.1, 0.4, 1.2]} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.6, 1.4]} material={materials.body}>
          <boxGeometry args={[1.0, 0.9, 0.8]} />
        </mesh>

        {/* Snout */}
        <mesh position={[0, 1.25, 1.7]} material={materials.body}>
          <boxGeometry args={[0.8, 0.5, 0.5]} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.35, 1.75, 1.7]} material={materials.eye}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
        <mesh position={[0.35, 1.75, 1.7]} material={materials.eye}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>

        {/* Nostrils */}
        <mesh position={[-0.15, 1.15, 1.96]} material={materials.nostril}>
          <sphereGeometry args={[0.08, 6, 6]} />
        </mesh>
        <mesh position={[0.15, 1.15, 1.96]} material={materials.nostril}>
          <sphereGeometry args={[0.08, 6, 6]} />
        </mesh>

        {/* Horns */}
        <mesh position={[-0.45, 2.1, 1.3]} rotation={[0.3, -0.4, -0.6]} material={materials.accent}>
          <coneGeometry args={[0.08, 0.9, 6]} />
        </mesh>
        <mesh position={[0.45, 2.1, 1.3]} rotation={[0.3, 0.4, 0.6]} material={materials.accent}>
          <coneGeometry args={[0.08, 0.9, 6]} />
        </mesh>

        {/* Neon accent stripe along spine */}
        <mesh position={[0, 1.92, -0.1]} material={materials.accent}>
          <boxGeometry args={[0.15, 0.08, 2.0]} />
        </mesh>

        {/* Tail */}
        <mesh position={[0, 1.4, -1.4]} rotation={[-0.8, 0, 0]} material={materials.body}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
        </mesh>
        <mesh position={[0, 1.8, -1.7]} material={materials.accent}>
          <sphereGeometry args={[0.1, 6, 6]} />
        </mesh>

        {/* Legs */}
        {/* Front Left */}
        <group position={[-0.45, 0.5, 0.7]}>
          <mesh ref={frontLeftLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.accent}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>

        {/* Front Right */}
        <group position={[0.45, 0.5, 0.7]}>
          <mesh ref={frontRightLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.accent}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>

        {/* Back Left */}
        <group position={[-0.45, 0.5, -0.7]}>
          <mesh ref={backLeftLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.accent}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>

        {/* Back Right */}
        <group position={[0.45, 0.5, -0.7]}>
          <mesh ref={backRightLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.accent}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
