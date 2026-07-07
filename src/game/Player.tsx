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
      color: '#2a2a3e',
      roughness: 0.25,
      metalness: 0.7,
    }),
    bodyDark: new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.3,
      metalness: 0.6,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#00ff88',
      emissive: '#00ff88',
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.9,
    }),
    horn: new THREE.MeshStandardMaterial({
      color: '#00ff88',
      emissive: '#00ff88',
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    }),
    eye: new THREE.MeshStandardMaterial({
      color: '#ff3355',
      emissive: '#ff3355',
      emissiveIntensity: 3.0,
    }),
    eyeGlow: new THREE.MeshStandardMaterial({
      color: '#ff3355',
      emissive: '#ff3355',
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.3,
    }),
    nostril: new THREE.MeshStandardMaterial({
      color: '#0a0a0f',
    }),
    hoofGlow: new THREE.MeshStandardMaterial({
      color: '#00ff88',
      emissive: '#00ff88',
      emissiveIntensity: 2.0,
    }),
  }), []);

  useFrame((_, delta) => {
    const { targetLane, isJumping, jumpProgress, isSliding, slideProgress, gameState, speed } = useGameStore.getState();

    if (!groupRef.current) return;

    // Smooth lane transition (faster response)
    const targetX = targetLane * LANE_WIDTH;
    currentXRef.current += (targetX - currentXRef.current) * 0.18;
    groupRef.current.position.x = currentXRef.current;

    // Jump arc
    if (isJumping) {
      const jumpHeight = 4.5;
      const arc = Math.sin(jumpProgress * Math.PI);
      groupRef.current.position.y = arc * jumpHeight;
      if (bodyRef.current) {
        bodyRef.current.rotation.x = -arc * 0.3;
      }
    } else {
      groupRef.current.position.y *= 0.85;
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
      {/* Player spotlight so bull is always visible */}
      <pointLight
        position={[0, 3, 0]}
        intensity={2.5}
        color="#ffffff"
        distance={12}
        decay={2}
      />
      <pointLight
        position={[0, 0.5, 2]}
        intensity={1.5}
        color="#00ff88"
        distance={8}
        decay={2}
      />

      <group ref={bodyRef}>
        {/* Main body */}
        <mesh position={[0, 1.2, 0]} material={materials.body}>
          <boxGeometry args={[1.4, 1.0, 2.4]} />
        </mesh>

        {/* Body top (back hump) */}
        <mesh position={[0, 1.8, -0.3]} material={materials.body}>
          <boxGeometry args={[1.1, 0.4, 1.2]} />
        </mesh>

        {/* Chest plate — neon accent */}
        <mesh position={[0, 1.0, 0.9]} material={materials.accent}>
          <boxGeometry args={[1.0, 0.15, 0.6]} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.6, 1.4]} material={materials.body}>
          <boxGeometry args={[1.0, 0.9, 0.8]} />
        </mesh>

        {/* Snout */}
        <mesh position={[0, 1.25, 1.7]} material={materials.bodyDark}>
          <boxGeometry args={[0.8, 0.5, 0.5]} />
        </mesh>

        {/* Nose ring — neon */}
        <mesh position={[0, 1.08, 1.96]} rotation={[Math.PI / 2, 0, 0]} material={materials.accent}>
          <torusGeometry args={[0.15, 0.03, 8, 12]} />
        </mesh>

        {/* Eyes — glowing red */}
        <mesh position={[-0.35, 1.75, 1.7]} material={materials.eye}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
        <mesh position={[0.35, 1.75, 1.7]} material={materials.eye}>
          <sphereGeometry args={[0.12, 8, 8]} />
        </mesh>
        {/* Eye glow halos */}
        <mesh position={[-0.35, 1.75, 1.71]} material={materials.eyeGlow}>
          <sphereGeometry args={[0.2, 8, 8]} />
        </mesh>
        <mesh position={[0.35, 1.75, 1.71]} material={materials.eyeGlow}>
          <sphereGeometry args={[0.2, 8, 8]} />
        </mesh>

        {/* Nostrils */}
        <mesh position={[-0.15, 1.15, 1.96]} material={materials.nostril}>
          <sphereGeometry args={[0.08, 6, 6]} />
        </mesh>
        <mesh position={[0.15, 1.15, 1.96]} material={materials.nostril}>
          <sphereGeometry args={[0.08, 6, 6]} />
        </mesh>

        {/* Horns — bright green neon */}
        <mesh position={[-0.45, 2.1, 1.3]} rotation={[0.3, -0.4, -0.6]} material={materials.horn}>
          <coneGeometry args={[0.1, 1.0, 6]} />
        </mesh>
        <mesh position={[0.45, 2.1, 1.3]} rotation={[0.3, 0.4, 0.6]} material={materials.horn}>
          <coneGeometry args={[0.1, 1.0, 6]} />
        </mesh>

        {/* Neon spine stripe */}
        <mesh position={[0, 1.92, -0.1]} material={materials.accent}>
          <boxGeometry args={[0.15, 0.08, 2.0]} />
        </mesh>

        {/* Side accent stripes */}
        <mesh position={[-0.71, 1.2, 0]} material={materials.accent}>
          <boxGeometry args={[0.02, 0.1, 2.0]} />
        </mesh>
        <mesh position={[0.71, 1.2, 0]} material={materials.accent}>
          <boxGeometry args={[0.02, 0.1, 2.0]} />
        </mesh>

        {/* Tail */}
        <mesh position={[0, 1.4, -1.4]} rotation={[-0.8, 0, 0]} material={materials.bodyDark}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
        </mesh>
        <mesh position={[0, 1.8, -1.7]} material={materials.accent}>
          <sphereGeometry args={[0.12, 6, 6]} />
        </mesh>

        {/* Legs with glowing hooves */}
        {/* Front Left */}
        <group position={[-0.45, 0.5, 0.7]}>
          <mesh ref={frontLeftLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.hoofGlow}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>

        {/* Front Right */}
        <group position={[0.45, 0.5, 0.7]}>
          <mesh ref={frontRightLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.hoofGlow}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>

        {/* Back Left */}
        <group position={[-0.45, 0.5, -0.7]}>
          <mesh ref={backLeftLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.hoofGlow}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>

        {/* Back Right */}
        <group position={[0.45, 0.5, -0.7]}>
          <mesh ref={backRightLegRef} material={materials.body}>
            <boxGeometry args={[0.3, 1.0, 0.3]} />
          </mesh>
          <mesh position={[0, -0.55, 0]} material={materials.hoofGlow}>
            <boxGeometry args={[0.32, 0.1, 0.32]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
