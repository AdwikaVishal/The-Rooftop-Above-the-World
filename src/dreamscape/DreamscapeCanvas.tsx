import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Compass, Eye, HelpCircle, Telescope, X } from 'lucide-react';
import { CELESTIAL_BY_ID } from '../data/collectibles';
import {
  CONSTELLATIONS,
  isValidTraceStep,
  matchesConstellationTrace,
} from '../data/constellations';
import { DREAM_ISLANDS, ISLAND_BY_ID } from '../data/islands';
import type {
  CatReactionId,
  CelestialId,
  ConstellationId,
  IslandId,
  PlantId,
  WorldState,
} from '../types/world';

interface DreamscapeCanvasProps {
  state: WorldState;
  reducedMotion: boolean;
  onDiscoverConstellation: (id: ConstellationId) => void;
  onDiscoverCelestial: (id: CelestialId) => void;
  onClickMoon: () => void;
  onVisitIsland: (id: IslandId) => void;
  onPetCat: (reaction: CatReactionId) => void;
  onTouchPlant: (plant: PlantId) => void;
  onCatchFirefly: () => void;
  onOpenTelescope: () => void;
  onReturnHome: () => void;
  onRegisterEscapeLayer: (handler: (() => boolean) | null) => void;
}

interface DreamFocus {
  point: readonly [number, number, number];
  distance: number;
}

interface SceneActions {
  reducedMotion: boolean;
  state: WorldState;
  focus: DreamFocus;
  selectedConstellation: ConstellationId | null;
  trace: number[];
  dragged: React.MutableRefObject<boolean>;
  onDiscoverConstellation: (id: ConstellationId) => void;
  onDiscoverCelestial: (id: CelestialId) => void;
  onClickMoon: () => void;
  onVisitIsland: (id: IslandId) => void;
  onPetCat: (reaction: CatReactionId) => void;
  onTouchPlant: (plant: PlantId) => void;
  onCatchFirefly: () => void;
  onOpenTelescope: () => void;
  onInspect: (title: string, body: string) => void;
  onTrace: (id: ConstellationId, step: number[]) => void;
}

const INITIAL_FOCUS: DreamFocus = { point: [0, 2, 0], distance: 18 };
const YAW_BY_CONSTELLATION: Record<ConstellationId, number> = {
  'sleeping-fox': 0,
  'paper-crane': -1.22,
  'lantern-keeper': 1.22,
};

function useElapsedFrame(callback: (elapsed: number, delta: number) => void): void {
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    callback(elapsed.current, delta);
  });
}

function createStarGeometry(): THREE.BufferGeometry {
  const count = 2600;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color('#f5ebdd'),
    new THREE.Color('#c3b9e8'),
    new THREE.Color('#f2c879'),
    new THREE.Color('#dfe6ff'),
  ];
  for (let index = 0; index < count; index += 1) {
    const y = Math.random() * 2 - 1;
    const angle = Math.random() * Math.PI * 2;
    const radius = 44 + Math.random() * 68;
    const horizontal = Math.sqrt(1 - y * y);
    positions[index * 3] = Math.cos(angle) * horizontal * radius;
    positions[index * 3 + 1] = y * radius;
    positions[index * 3 + 2] = Math.sin(angle) * horizontal * radius;
    sizes[index] = 1.1 + Math.random() * 3.4;
    phases[index] = Math.random() * Math.PI * 2;
    const color = palette[Math.floor(Math.random() * palette.length)] ?? palette[0]!;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function StarField({ reducedMotion }: { reducedMotion: boolean }) {
  const geometry = useMemo(createStarGeometry, []);
  const material = useRef<THREE.ShaderMaterial>(null);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useElapsedFrame((elapsed) => {
    const uniform = material.current?.uniforms.uTime;
    if (uniform) uniform.value = reducedMotion ? 0 : elapsed;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          attribute vec3 aColor;
          uniform float uTime;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            float twinkle = 0.72 + 0.28 * sin(uTime * (0.45 + aSize * 0.08) + aPhase);
            gl_Position = projectionMatrix * viewPosition;
            gl_PointSize = clamp(aSize * (250.0 / max(1.0, -viewPosition.z)), 1.0, 6.0);
            vColor = aColor;
            vAlpha = twinkle;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec2 point = gl_PointCoord - vec2(0.5);
            float edge = 1.0 - smoothstep(0.15, 0.5, length(point));
            gl_FragColor = vec4(vColor, edge * vAlpha * 0.9);
          }
        `}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  );
}

function Moon({
  reducedMotion,
  onClick,
}: {
  reducedMotion: boolean;
  onClick: (event: import('@react-three/fiber').ThreeEvent<MouseEvent>) => void;
}) {
  const glow = useRef<THREE.Mesh>(null);
  useElapsedFrame((elapsed) => {
    if (glow.current && !reducedMotion) {
      glow.current.scale.setScalar(1.14 + Math.sin(elapsed * 0.6) * 0.025);
    }
  });
  return (
    <group position={[0, 32, -112]} onClick={onClick}>
      <mesh ref={glow}>
        <sphereGeometry args={[3.8, 20, 20]} />
        <meshBasicMaterial color="#f4dfb2" transparent opacity={0.11} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.7, 32, 32]} />
        <meshStandardMaterial
          color="#f5ebdd"
          emissive="#d7bf8e"
          emissiveIntensity={0.32}
          roughness={0.86}
        />
      </mesh>
      <mesh position={[-0.65, 0.42, 2.46]}>
        <sphereGeometry args={[2.25, 32, 24]} />
        <meshBasicMaterial color="#0d1427" />
      </mesh>
      <mesh position={[0.48, 1.02, 2.1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#fff5dc" />
      </mesh>
    </group>
  );
}

function CitySkyline() {
  const buildings = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => {
        const angle = (index / 42) * Math.PI * 2;
        const radius = 68 + (index % 4) * 3;
        return {
          position: [Math.sin(angle) * radius, -0.3, Math.cos(angle) * radius] as const,
          size: [2.2 + (index % 3) * 1.1, 2.8 + ((index * 7) % 9), 2 + (index % 4) * 0.5] as const,
          color: index % 3 === 0 ? '#4b5b7d' : '#3d4d70',
          windows: index % 3 === 0,
        };
      }),
    [],
  );
  return (
    <group>
      {buildings.map((building, index) => (
        <group key={index} position={building.position} rotation={[0, (index / 42) * Math.PI * 2, 0]}>
          <mesh position={[0, building.size[1] / 2, 0]}>
            <boxGeometry args={building.size} />
            <meshStandardMaterial
              color={building.color}
              emissive={building.color}
              emissiveIntensity={0.09}
              roughness={1}
            />
          </mesh>
          {building.windows && (
            <mesh position={[0, building.size[1] * 0.58, building.size[2] / 2 + 0.012]}>
              <planeGeometry args={[building.size[0] * 0.55, 0.35]} />
              <meshBasicMaterial color="#f2c879" transparent opacity={0.22} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function PottedPlant({
  position,
  color,
  dragged,
  onTouch,
}: {
  position: [number, number, number];
  color: string;
  dragged: React.MutableRefObject<boolean>;
  onTouch: () => void;
}) {
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); if (!dragged.current) onTouch(); }}>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.48, 0.34, 0.8, 8]} />
        <meshStandardMaterial color="#8e5f58" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.83, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.11, 8]} />
        <meshStandardMaterial color="#ac766b" roughness={0.85} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.sin(angle) * 0.32, 1.28 + (index % 3) * 0.12, Math.cos(angle) * 0.32]}
            rotation={[0.25, angle, -0.38]}
          >
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#c3b9e8" emissive="#9c91c8" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function Rooftop({
  reducedMotion,
  dragged,
  lightsOn,
  onPetCat,
  onTouchPlant,
  onOpenTelescope,
}: {
  reducedMotion: boolean;
  dragged: React.MutableRefObject<boolean>;
  lightsOn: boolean;
  onPetCat: (reaction: CatReactionId) => void;
  onTouchPlant: (plant: PlantId) => void;
  onOpenTelescope: () => void;
}) {
  const cat = useRef<THREE.Group>(null);
  const petCount = useRef(0);
  const lampMaterial = useRef<THREE.MeshStandardMaterial>(null);
  useElapsedFrame((elapsed, delta) => {
    if (!reducedMotion && cat.current) {
      cat.current.scale.y = 1 + Math.sin(elapsed * 1.2) * 0.012;
    }
    if (lampMaterial.current) {
      const target = lightsOn
        ? reducedMotion ? 0.42 : 0.42 + Math.sin(elapsed * 1.5) * 0.05
        : 0.02;
      lampMaterial.current.emissiveIntensity = reducedMotion
        ? target
        : THREE.MathUtils.damp(lampMaterial.current.emissiveIntensity, target, 4, delta);
    }
  });

  return (
    <group>
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[24, 24, 1.2, 64]} />
        <meshStandardMaterial color="#34405c" roughness={0.94} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[7.2, 48]} />
        <meshStandardMaterial color="#5e4b69" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[6.2, 6.5, 48]} />
        <meshStandardMaterial color="#d9a4b3" roughness={0.85} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh
          key={index}
          position={[
            Math.sin((index / 12) * Math.PI * 2) * 6.7,
            0.04,
            Math.cos((index / 12) * Math.PI * 2) * 6.7,
          ]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#c3b9e8" roughness={0.7} />
        </mesh>
      ))}

      <group ref={cat} position={[0, 0.42, 0.4]} onClick={(event) => {
        event.stopPropagation();
        if (dragged.current) return;
        const reactions: CatReactionId[] = ['purr', 'slow-blink', 'stretch', 'yawn', 'tail-curl'];
        onPetCat(reactions[petCount.current++ % reactions.length] ?? 'purr');
      }}>
        <mesh scale={[1.55, 0.5, 0.92]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#d6ae86" roughness={0.95} />
        </mesh>
        <mesh position={[0.98, 0.3, -0.03]} scale={[0.65, 0.55, 0.58]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#e7c9a8" roughness={0.9} />
        </mesh>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[0.98 + x, 0.88, -0.03]} rotation={[0, 0, x < 0 ? -0.25 : 0.25]}>
            <coneGeometry args={[0.2, 0.53, 4]} />
            <meshStandardMaterial color="#d6ae86" roughness={0.9} />
          </mesh>
        ))}
        {[-0.19, 0.19].map((x) => (
          <Line
            key={x}
            points={[[0.98 + x - 0.075, 0.31, 0.5], [0.98 + x + 0.075, 0.31, 0.5]]}
            color="#5c4636"
            lineWidth={1.4}
          />
        ))}
        <mesh position={[-1.25, 0.13, 0]} rotation={[0, 0, -0.7]}>
          <capsuleGeometry args={[0.15, 1.1, 4, 8]} />
          <meshStandardMaterial color="#b9865f" roughness={0.9} />
        </mesh>
      </group>

      <group position={[-5.2, 0, 2.8]}>
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 2.2, 8]} />
          <meshStandardMaterial color="#72513f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.28, 0]}>
          <cylinderGeometry args={[0.84, 0.84, 0.13, 16]} />
          <meshStandardMaterial color="#8f6951" roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.38, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.07, 12]} />
          <meshStandardMaterial color="#f5ebdd" roughness={0.75} />
        </mesh>
        <mesh position={[0, 2.43, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.015, 12]} />
          <meshStandardMaterial color="#654a3e" roughness={0.6} />
        </mesh>
      </group>
      <group
        position={[5.5, 1.8, 1.6]}
        rotation={[0, -0.22, -0.45]}
        onClick={(event) => { event.stopPropagation(); if (!dragged.current) onOpenTelescope(); }}
      >
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, 2.7, 16]} />
          <meshStandardMaterial color="#b99152" emissive="#805d35" emissiveIntensity={0.08} metalness={0.24} roughness={0.54} />
        </mesh>
        <mesh position={[0, 1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.065, 8, 20]} />
          <meshStandardMaterial color="#e1c28d" metalness={0.32} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.39, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.31, 20]} />
          <meshStandardMaterial color="#8eb5cf" emissive="#769dbd" emissiveIntensity={0.24} roughness={0.32} metalness={0.12} />
        </mesh>
        {Array.from({ length: 3 }, (_, index) => {
          const angle = (index / 3) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * 0.58, -1.48, Math.sin(angle) * 0.58]} rotation={[0, 0, Math.cos(angle) * 0.18]}>
              <cylinderGeometry args={[0.065, 0.08, 2.05, 8]} />
              <meshStandardMaterial color="#8590ae" metalness={0.24} roughness={0.64} />
            </mesh>
          );
        })}
      </group>

      <PottedPlant dragged={dragged} position={[-8.6, 0, 1]} color="#9caf98" onTouch={() => onTouchPlant('fern')} />
      <PottedPlant dragged={dragged} position={[-4.2, 0, -2.5]} color="#c3b9e8" onTouch={() => onTouchPlant('lavender')} />
      <PottedPlant dragged={dragged} position={[9.2, 0, -1]} color="#6f8a76" onTouch={() => onTouchPlant('ivy')} />

      <Line
        points={[
          [-16, 5.5, -8],
          [-8, 5.0, -8],
          [0, 5.35, -8],
          [8, 5.0, -8],
          [16, 5.5, -8],
        ]}
        color="#2b3150"
        lineWidth={2}
      />
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-14 + index * 3.5, 5.08 + (index % 2) * 0.12, -8]}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial
            {...(index === 0 ? { ref: lampMaterial } : {})}
            color="#f2c879"
            emissive="#f2c879"
            emissiveIntensity={lightsOn ? 0.42 : 0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

function FlowerIsland() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[3.4, 2.8, 1.15, 16]} />
        <meshStandardMaterial color="#45645e" emissive="#263b38" emissiveIntensity={0.12} roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <cylinderGeometry args={[3.38, 3.38, 0.22, 20]} />
        <meshStandardMaterial color="#84a17e" roughness={0.9} />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        const flowerColor = index % 3 === 0 ? '#e9b6c7' : index % 3 === 1 ? '#d0c5ec' : '#f0d5a2';
        return (
          <group
            key={index}
            position={[Math.cos(angle) * (1.1 + (index % 3) * 0.55), 0.92, Math.sin(angle) * (1.1 + (index % 3) * 0.55)]}
            rotation={[0, angle, 0]}
          >
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.035, 0.045, 0.75, 5]} />
              <meshStandardMaterial color="#9caf98" />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.16, 0.38, 0.02]}
                rotation={[0, 0, side * -0.55]}
                scale={[0.2, 0.075, 0.1]}
              >
                <sphereGeometry args={[1, 8, 6]} />
                <meshStandardMaterial color="#8eaa83" roughness={0.8} />
              </mesh>
            ))}
            {Array.from({ length: 5 }, (_, petal) => {
              const petalAngle = (petal / 5) * Math.PI * 2;
              return (
                <mesh
                  key={petal}
                  position={[Math.cos(petalAngle) * 0.15, 0.76, Math.sin(petalAngle) * 0.15]}
                  scale={[0.12, 0.07, 0.09]}
                >
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshStandardMaterial color={flowerColor} roughness={0.72} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.77, 0]}>
              <sphereGeometry args={[0.095, 10, 8]} />
              <meshStandardMaterial color="#f2c879" emissive="#f2c879" emissiveIntensity={0.24} roughness={0.65} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CloudCottage() {
  return (
    <group>
      <mesh scale={[3.8, 0.65, 2.3]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#b7b9d2" transparent opacity={0.76} roughness={1} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.2, 1.8, 1.8]} />
        <meshStandardMaterial color="#d9c7bc" roughness={0.88} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <coneGeometry args={[1.75, 1.25, 4]} />
        <meshStandardMaterial color="#9c7186" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.46, 0.92]}>
        <boxGeometry args={[0.48, 0.92, 0.1]} />
        <meshStandardMaterial color="#72566a" roughness={0.82} />
      </mesh>
      <mesh position={[-0.65, 1.18, 0.93]}>
        <boxGeometry args={[0.46, 0.42, 0.07]} />
        <meshStandardMaterial color="#f5d99d" emissive="#f2c879" emissiveIntensity={0.72} roughness={0.35} />
      </mesh>
      <mesh position={[0.65, 1.18, 0.93]}>
        <boxGeometry args={[0.46, 0.42, 0.07]} />
        <meshStandardMaterial color="#f5d99d" emissive="#f2c879" emissiveIntensity={0.72} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.98, 1]}>
        <boxGeometry args={[1.9, 0.08, 0.08]} />
        <meshStandardMaterial color="#8d6a65" roughness={0.8} />
      </mesh>
      {Array.from({ length: 4 }, (_, index) => (
        <mesh
          key={index}
          position={[-0.2 + index * 0.14, 0.72, 1.35 + index * 0.47]}
          rotation={[-Math.PI / 2, 0, index % 2 ? 0.12 : -0.12]}
        >
          <circleGeometry args={[0.22 - index * 0.02, 12]} />
          <meshStandardMaterial color={index % 2 ? '#d1b9c9' : '#c6b7d9'} roughness={0.94} />
        </mesh>
      ))}
      <pointLight position={[0, 1.2, 1.6]} color="#f2c879" intensity={1.1} distance={8} />
    </group>
  );
}

function LittleObservatory() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[3.4, 2.8, 1.15, 16]} />
        <meshStandardMaterial color="#495775" emissive="#273451" emissiveIntensity={0.16} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[1.65, 1.5, 1.45, 16]} />
        <meshStandardMaterial color="#827493" emissive="#382e50" emissiveIntensity={0.12} roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.57]} />
        <meshStandardMaterial color="#dfcfc6" metalness={0.08} roughness={0.72} />
      </mesh>
      <mesh position={[0, 2.8, 0]} rotation={[0.3, 0, -0.5]}>
        <cylinderGeometry args={[0.28, 0.42, 2.7, 12]} />
        <meshStandardMaterial color="#b99152" metalness={0.48} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.55, 1.48]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.56, 0.045, 6, 24]} />
        <meshStandardMaterial color="#e1c28d" emissive="#b99152" emissiveIntensity={0.22} metalness={0.38} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.68, 1.64]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshStandardMaterial color="#c3b9e8" emissive="#9c91c8" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
    </group>
  );
}

function IslandUnderside({ index }: { index: number }) {
  const palettes = [
    { upper: '#526d69', middle: '#3b5860', lower: '#35465e', crystal: '#a7c3b0' },
    { upper: '#685e78', middle: '#4a526e', lower: '#39445f', crystal: '#dfb5c6' },
    { upper: '#56627f', middle: '#414f70', lower: '#34415f', crystal: '#c3b9e8' },
  ];
  const palette = palettes[index % palettes.length] ?? palettes[0]!;
  return (
    <group>
      <mesh position={[0, -0.62, 0]} scale={[3.15, 0.88, 2.85]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={palette.upper} emissive={palette.upper} emissiveIntensity={0.08} roughness={0.96} />
      </mesh>
      <mesh position={[0, -1.24, 0]} scale={[2.65, 0.82, 2.35]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color={palette.middle} emissive={palette.middle} emissiveIntensity={0.12} roughness={0.94} />
      </mesh>
      <mesh position={[0, -1.82, 0]} scale={[1.9, 0.9, 1.65]}>
        <sphereGeometry args={[1, 12, 9]} />
        <meshStandardMaterial color={palette.lower} emissive={palette.lower} emissiveIntensity={0.16} roughness={0.92} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (1.45 + index * 0.12), -1.75, index === 1 ? side * 0.48 : -side * 0.4]}
          rotation={[0.12, side * 0.24, side * -0.08]}
        >
          <coneGeometry args={[0.11, 0.75 + index * 0.08, 6]} />
          <meshStandardMaterial
            color={palette.crystal}
            emissive={palette.crystal}
            emissiveIntensity={0.12}
            roughness={0.65}
          />
        </mesh>
      ))}
      <mesh position={[0, -2.35, 0]} scale={[0.18, 0.5, 0.18]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color={palette.crystal} emissive={palette.crystal} emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
    </group>
  );
}

function FloatingIslands({
  reducedMotion,
  dragged,
  onVisit,
}: {
  reducedMotion: boolean;
  dragged: React.MutableRefObject<boolean>;
  onVisit: (id: IslandId) => void;
}) {
  const roots = useRef<THREE.Group[]>([]);
  useElapsedFrame((elapsed) => {
    if (reducedMotion) return;
    roots.current.forEach((root, index) => {
      if (root) root.position.y = DREAM_ISLANDS[index]!.position[1] + Math.sin(elapsed * 0.36 + index) * 0.22;
    });
  });
  return (
    <>
      {DREAM_ISLANDS.map((island, index) => (
        <group
          key={island.id}
          ref={(element) => { if (element) roots.current[index] = element; }}
          position={island.position as [number, number, number]}
          onClick={(event) => { event.stopPropagation(); if (!dragged.current) onVisit(island.id); }}
          onPointerOver={(event) => {
            event.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => { document.body.style.cursor = ''; }}
        >
          {index % 3 === 0 ? <FlowerIsland /> : index % 3 === 1 ? <CloudCottage /> : <LittleObservatory />}
          <IslandUnderside index={index} />
          <mesh position={[0, 3.5, 0]}>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshBasicMaterial color={island.color} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Firefly({
  position,
  reducedMotion,
  dragged,
  onCatch,
}: {
  position: [number, number, number];
  reducedMotion: boolean;
  dragged: React.MutableRefObject<boolean>;
  onCatch: () => void;
}) {
  const glow = useRef<THREE.Mesh>(null);
  useElapsedFrame((elapsed) => {
    if (glow.current && !reducedMotion) {
      glow.current.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.18);
    }
  });
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); if (!dragged.current) onCatch(); }}>
      <mesh ref={glow}>
        <sphereGeometry args={[0.34, 10, 8]} />
        <meshBasicMaterial color="#f2c879" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshBasicMaterial color="#fff0bd" />
      </mesh>
    </group>
  );
}

function CelestialCollectible({
  position,
  reducedMotion,
  onClick,
}: {
  position: [number, number, number];
  reducedMotion: boolean;
  onClick: () => void;
}) {
  const object = useRef<THREE.Group>(null);
  useElapsedFrame((elapsed) => {
    if (object.current && !reducedMotion) {
      object.current.rotation.y = elapsed * 0.22;
      object.current.position.y = position[1] + Math.sin(elapsed * 0.7) * 0.13;
    }
  });
  return (
    <group ref={object} position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh>
        <icosahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial color="#9ebae0" emissive="#7d9fc9" emissiveIntensity={0.8} roughness={0.28} metalness={0.25} />
      </mesh>
      <mesh scale={1.5}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <meshBasicMaterial color="#9ebae0" transparent opacity={0.11} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ConstellationMarkers({
  state,
  reducedMotion,
  dragged,
  selectedConstellation,
  trace,
  onTrace,
}: Pick<
  SceneActions,
  'state' | 'reducedMotion' | 'dragged' | 'selectedConstellation' | 'trace' | 'onTrace'
>) {
  const starRefs = useRef<THREE.Mesh[]>([]);
  useElapsedFrame((elapsed) => {
    if (reducedMotion) return;
    starRefs.current.forEach((star, index) => {
      if (star) star.scale.setScalar(1 + Math.sin(elapsed * 1.15 + index) * 0.12);
    });
  });

  return (
    <>
      {CONSTELLATIONS.map((constellation) => {
        const yaw = YAW_BY_CONSTELLATION[constellation.id];
        const center = new THREE.Vector3(Math.sin(yaw) * 88, 18, -Math.cos(yaw) * 88);
        const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
        const points = constellation.points.map((point) =>
          center
            .clone()
            .addScaledVector(right, (point.x - 50) * 0.18)
            .add(new THREE.Vector3(0, (50 - point.y) * 0.18, 0)),
        );
        const discovered = state.constellations.includes(constellation.id);
        return (
          <group key={constellation.id}>
            {discovered &&
              constellation.lines.map(([from, to], index) => (
                <Line
                  key={index}
                  points={[points[from]!, points[to]!]}
                  color={constellation.accent}
                  lineWidth={1.1}
                  transparent
                  opacity={0.74}
                />
              ))}
            {!discovered &&
              selectedConstellation === constellation.id &&
              trace.slice(1).map((to, index) => (
                <Line
                  key={`trace-${index}`}
                  points={[points[trace[index]!]!, points[to]!]}
                  color={constellation.accent}
                  lineWidth={1.7}
                  transparent
                  opacity={0.95}
                />
              ))}
            {points.map((point, index) => (
              <mesh
                key={index}
                ref={(element) => { if (element) starRefs.current[index + CONSTELLATIONS.indexOf(constellation) * 20] = element; }}
                position={point}
                onClick={(event) => {
                  event.stopPropagation();
                  if (dragged.current || discovered) return;
                  onTrace(constellation.id, [index]);
                }}
              >
                <sphereGeometry args={[0.22, 10, 10]} />
                <meshBasicMaterial color={discovered ? '#fff6e6' : constellation.accent} />
                <mesh scale={2.8}>
                  <sphereGeometry args={[0.22, 8, 8]} />
                  <meshBasicMaterial
                    color={constellation.accent}
                    transparent
                    opacity={discovered ? 0.13 : 0.075}
                    depthWrite={false}
                  />
                </mesh>
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}

function DreamCamera({
  focus,
  reducedMotion,
  dragged,
}: {
  focus: DreamFocus;
  reducedMotion: boolean;
  dragged: React.MutableRefObject<boolean>;
}) {
  const { camera, gl, setFrameloop } = useThree();
  const orbit = useRef({ yaw: 0, pitch: -0.15, distance: 18 });
  const target = useRef({ yaw: 0, pitch: -0.15, distance: 18 });
  const anchor = useRef(new THREE.Vector3(...INITIAL_FOCUS.point));
  const anchorTarget = useRef(new THREE.Vector3(...INITIAL_FOCUS.point));
  const pointer = useRef<{ id: number; x: number; y: number; lastX: number; lastY: number } | null>(null);
  const keys = useRef(new Set<string>());

  useEffect(() => {
    target.current.distance = focus.distance;
    anchorTarget.current.set(...focus.point);
    target.current.yaw = 0;
    target.current.pitch = -0.18;
  }, [focus]);

  useEffect(() => {
    const element = gl.domElement;
    const onPointerDown = (event: PointerEvent): void => {
      pointer.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      dragged.current = false;
    };
    const onPointerMove = (event: PointerEvent): void => {
      const active = pointer.current;
      if (!active || active.id !== event.pointerId) return;
      const totalX = event.clientX - active.x;
      const totalY = event.clientY - active.y;
      if (Math.hypot(totalX, totalY) > 6) dragged.current = true;
      target.current.yaw -= (event.clientX - active.lastX) * 0.0045;
      target.current.pitch = THREE.MathUtils.clamp(
        target.current.pitch - (event.clientY - active.lastY) * 0.004,
        -1.18,
        1.18,
      );
      active.lastX = event.clientX;
      active.lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent): void => {
      if (pointer.current?.id === event.pointerId) pointer.current = null;
    };
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      target.current.distance = THREE.MathUtils.clamp(
        target.current.distance + Math.sign(event.deltaY) * 1.1,
        7,
        24,
      );
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      const elementTarget = event.target;
      if (
        elementTarget instanceof HTMLElement &&
        (elementTarget.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(elementTarget.tagName))
      ) return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        keys.current.add(key);
        event.preventDefault();
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => { keys.current.delete(event.key.toLowerCase()); };
    const onVisibility = (): void => setFrameloop(document.hidden ? 'never' : 'always');

    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    element.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();
    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.style.cursor = '';
    };
  }, [gl, setFrameloop]);

  useFrame((_, delta) => {
    const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * 5.5);
    orbit.current.yaw += (target.current.yaw - orbit.current.yaw) * ease;
    orbit.current.pitch += (target.current.pitch - orbit.current.pitch) * ease;
    orbit.current.distance += (target.current.distance - orbit.current.distance) * ease;
    anchor.current.lerp(anchorTarget.current, ease);

    const keysDown = keys.current;
    const forward = Number(keysDown.has('w') || keysDown.has('arrowup')) - Number(keysDown.has('s') || keysDown.has('arrowdown'));
    const side = Number(keysDown.has('d') || keysDown.has('arrowright')) - Number(keysDown.has('a') || keysDown.has('arrowleft'));
    const vertical = Number(keysDown.has(' '));
    if (forward || side || vertical) {
      const speed = delta * 5.2;
      anchorTarget.current.x += Math.sin(target.current.yaw) * forward * speed + Math.cos(target.current.yaw) * side * speed;
      anchorTarget.current.z -= Math.cos(target.current.yaw) * forward * speed - Math.sin(target.current.yaw) * side * speed;
      anchorTarget.current.y = THREE.MathUtils.clamp(anchorTarget.current.y + vertical * speed, -2, 28);
    }

    const { yaw, pitch, distance } = orbit.current;
    camera.position.set(
      anchor.current.x + Math.sin(yaw) * Math.cos(pitch) * distance,
      anchor.current.y - Math.sin(pitch) * distance,
      anchor.current.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    );
    camera.lookAt(anchor.current);
  });

  return null;
}

function DreamWorld(actions: SceneActions) {
  const {
    state,
    reducedMotion,
    focus,
    selectedConstellation,
    trace,
    dragged,
    onDiscoverCelestial,
    onClickMoon,
    onVisitIsland,
    onPetCat,
    onTouchPlant,
    onCatchFirefly,
    onOpenTelescope,
    onInspect,
    onTrace,
  } = actions;

  const clickMoon = (event: import('@react-three/fiber').ThreeEvent<MouseEvent>): void => {
    event.stopPropagation();
    if (dragged.current) return;
    onInspect(
      'The Moon',
      state.celestial.includes('moonthread')
        ? 'A silver strand of moonlight is already tucked into your Journal.'
        : 'The moon keeps a little silver thread for anyone patient enough to touch it.',
    );
  };

  return (
    <>
      <color attach="background" args={['#080c1b']} />
      <fog attach="fog" args={['#11182e', 32, 116]} />
      <hemisphereLight args={['#c4c9f0', '#45405f', 0.72]} />
      <ambientLight intensity={0.56} color="#a9b3d8" />
      <directionalLight position={[-9, 20, 12]} intensity={1.18} color="#d9d9f0" />
      <directionalLight position={[12, 8, -9]} intensity={0.42} color="#aeb8e3" />
      <pointLight position={[0, 6, 1]} intensity={1.7} color="#f2c879" distance={19} decay={2} />
      <pointLight position={[0, 15, -28]} intensity={1.1} color="#c3b9e8" distance={75} />
      <StarField reducedMotion={reducedMotion} />
      <Moon
        reducedMotion={reducedMotion}
        onClick={(event) => {
          if (dragged.current) return;
          clickMoon(event);
          onClickMoon();
        }}
      />
      <CitySkyline />
      <Rooftop
        reducedMotion={reducedMotion}
        dragged={dragged}
        lightsOn={state.lightsOn}
        onPetCat={onPetCat}
        onTouchPlant={onTouchPlant}
        onOpenTelescope={onOpenTelescope}
      />
      <ConstellationMarkers
        state={state}
        reducedMotion={reducedMotion}
        dragged={dragged}
        selectedConstellation={selectedConstellation}
        trace={trace}
        onTrace={(id, point) => onTrace(id, point)}
      />
      <FloatingIslands reducedMotion={reducedMotion} dragged={dragged} onVisit={onVisitIsland} />
      <Firefly position={[-7, 3.4, -12]} reducedMotion={reducedMotion} dragged={dragged} onCatch={onCatchFirefly} />
      <Firefly position={[10, 4.4, -17]} reducedMotion={reducedMotion} dragged={dragged} onCatch={onCatchFirefly} />
      {!state.celestial.includes('starglass') && (
        <CelestialCollectible
          position={[-7, 10, -24]}
          reducedMotion={reducedMotion}
          onClick={() => {
            if (dragged.current) return;
            onDiscoverCelestial('starglass');
            const item = CELESTIAL_BY_ID.get('starglass');
            if (item) onInspect(item.name, item.description);
          }}
        />
      )}
      <DreamCamera focus={focus} reducedMotion={reducedMotion} dragged={dragged} />
    </>
  );
}

function getIslandFocus(id: IslandId): DreamFocus {
  const island = ISLAND_BY_ID.get(id);
  if (!island) return INITIAL_FOCUS;
  return {
    point: island.position,
    distance: 10.5,
  };
}

export function DreamscapeCanvas({
  state,
  reducedMotion,
  onDiscoverConstellation,
  onDiscoverCelestial,
  onClickMoon,
  onVisitIsland,
  onPetCat,
  onTouchPlant,
  onCatchFirefly,
  onOpenTelescope,
  onReturnHome,
  onRegisterEscapeLayer,
}: DreamscapeCanvasProps) {
  const [focus, setFocus] = useState<DreamFocus>(INITIAL_FOCUS);
  const [selectedConstellation, setSelectedConstellation] = useState<ConstellationId | null>(null);
  const [trace, setTrace] = useState<number[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [inspect, setInspect] = useState<{ title: string; body: string } | null>(null);
  const [traceMessage, setTraceMessage] = useState('Click a quiet star to begin a trace.');
  const dragged = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const traceStar = (id: ConstellationId, selection: number[]): void => {
    const constellation = CONSTELLATIONS.find((item) => item.id === id);
    if (!constellation || stateRef.current.constellations.includes(id)) return;
    const candidate = selection[0];
    if (candidate === undefined) return;
    const previous = selectedConstellation === id ? trace : [];
    const nextStep = isValidTraceStep(constellation, previous, candidate)
      ? [...previous, candidate]
      : candidate === constellation.trace[0]
        ? [candidate]
        : [];
    if (nextStep.length === 0) {
      setTraceMessage('That star belongs to another shape. Start with the quietly glowing light.');
      setSelectedConstellation(id);
      setTrace([]);
      return;
    }
    setSelectedConstellation(id);
    setTrace(nextStep);
    setTraceMessage(`${Math.min(nextStep.length, constellation.trace.length)} gentle connections traced.`);
    if (matchesConstellationTrace(constellation, nextStep)) {
      onDiscoverConstellation(id);
      setTraceMessage(`${constellation.name} has found its name.`);
      setInspect({ title: constellation.name, body: constellation.story });
    }
  };

  const selectConstellation = (id: ConstellationId): void => {
    setSelectedConstellation(id);
    setTrace([]);
    setTraceMessage('Click the softly pulsing star to begin.');
  };

  const travelHome = (): void => {
    setFocus(INITIAL_FOCUS);
    setSelectedConstellation(null);
    setTrace([]);
  };

  const travelToIsland = (id: IslandId): void => {
    setFocus(getIslandFocus(id));
    setSelectedConstellation(null);
    setTrace([]);
    onVisitIsland(id);
    const island = ISLAND_BY_ID.get(id);
    if (island) {
      setInspect({
        title: island.name,
        body: [island.description, island.prompt ? `If you like: ${island.prompt}` : ''].filter(Boolean).join(' '),
      });
    }
  };

  useEffect(() => {
    const dismissDreamscapeLayer = (): boolean => {
      if (guideOpen) {
        setGuideOpen(false);
        return true;
      }
      if (inspect) {
        setInspect(null);
        return true;
      }
      if (selectedConstellation) {
        setSelectedConstellation(null);
        setTrace([]);
        setTraceMessage('Click a quiet star to begin a trace.');
        return true;
      }
      if (!focus.point.every((value, index) => value === INITIAL_FOCUS.point[index])) {
        travelHome();
        return true;
      }
      return false;
    };
    onRegisterEscapeLayer(dismissDreamscapeLayer);
    return () => onRegisterEscapeLayer(null);
  }, [focus, guideOpen, inspect, onRegisterEscapeLayer, selectedConstellation]);

  const activePattern = selectedConstellation
    ? CONSTELLATIONS.find((item) => item.id === selectedConstellation) ?? null
    : null;
  const initialFocus = focus.point.every((value, index) => value === INITIAL_FOCUS.point[index]);

  return (
    <section className="dreamscape-screen" aria-label="Interactive 3D rooftop dreamscape">
      <Canvas
        className="dreamscape-canvas"
        dpr={[1, Math.min(window.devicePixelRatio || 1, 1.5)]}
        camera={{ fov: 58, near: 0.1, far: 180, position: [0, 4.7, 18] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
        }}
        fallback={<div className="dreamscape-fallback">Your browser could not open the 3D sky. You can return to the rooftop.</div>}
      >
        <DreamWorld
          state={state}
          reducedMotion={reducedMotion}
          focus={focus}
          selectedConstellation={selectedConstellation}
          trace={trace}
          dragged={dragged}
          onDiscoverConstellation={onDiscoverConstellation}
          onDiscoverCelestial={onDiscoverCelestial}
          onClickMoon={onClickMoon}
          onVisitIsland={travelToIsland}
          onPetCat={onPetCat}
          onTouchPlant={onTouchPlant}
          onCatchFirefly={onCatchFirefly}
          onOpenTelescope={onOpenTelescope}
          onInspect={(title, body) => setInspect({ title, body })}
          onTrace={traceStar}
        />
      </Canvas>

      <header className="dreamscape-topbar">
        <button type="button" className="dreamscape-exit-button" onClick={onReturnHome}>
          <Compass size={16} aria-hidden="true" />
          <span>
            {guideOpen || inspect
              ? 'Close details'
              : selectedConstellation
                ? 'Clear selection'
                : initialFocus
                  ? 'Exit exploration'
                  : 'Return to rooftop'}
          </span>
        </button>
        <button
          type="button"
          className="dreamscape-icon-button"
          onClick={() => setGuideOpen((open) => !open)}
          aria-expanded={guideOpen}
          aria-label="Show dreamscape controls"
        >
          <HelpCircle size={18} aria-hidden="true" />
        </button>
      </header>

      {guideOpen && (
        <aside className="dreamscape-guide" aria-label="Dreamscape controls">
          <button type="button" aria-label="Close controls" onClick={() => setGuideOpen(false)}>
            <X size={14} />
          </button>
          <h3>Look around, gently</h3>
          <p>Drag with a mouse or finger to look all the way around. Scroll to drift nearer or farther.</p>
          <p>WASD or arrow keys drift; Space rises. Escape returns to the rooftop.</p>
          <p>Tap a star, firefly, moon, telescope, or island to explore it.</p>
        </aside>
      )}

      <div className="dreamscape-discovery" aria-live="polite">
        {activePattern ? (
          <>
            <p className="dreamscape-eyebrow">
              {state.constellations.includes(activePattern.id) ? 'Named in your Journal' : 'A pattern is almost clear'}
            </p>
            <h3>{state.constellations.includes(activePattern.id) ? activePattern.name : 'Faint lights'}</h3>
            <p>{state.constellations.includes(activePattern.id) ? activePattern.story : activePattern.whisper}</p>
            {!state.constellations.includes(activePattern.id) && (
              <>
                <p className="dreamscape-trace-status">{traceMessage}</p>
                <div className="dreamscape-star-keys" aria-label="Keyboard-accessible constellation stars">
                  {activePattern.points.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Connect star ${index + 1}`}
                      onClick={() => traceStar(activePattern.id, [index])}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="dreamscape-eyebrow">{initialFocus ? 'Your rooftop, from above' : 'A little world found'}</p>
            <h3>{initialFocus ? 'Look all the way around' : 'The view is yours to wander'}</h3>
            <p>Drag to look around. Touch a star to follow its quiet connections.</p>
          </>
        )}
      </div>

      <nav className="dreamscape-destinations" aria-label="Dreamscape destinations">
        <button type="button" className={initialFocus ? 'is-selected' : ''} onClick={travelHome}>
          <Compass size={15} aria-hidden="true" />
          Rooftop
        </button>
        {DREAM_ISLANDS.map((island) => (
          <button
            type="button"
            key={island.id}
            onClick={() => travelToIsland(island.id)}
            aria-label={`Travel to ${island.name}${state.islandsVisited.includes(island.id) ? ', visited' : ''}`}
          >
            <Eye size={14} aria-hidden="true" />
            {island.name}
            {state.islandsVisited.includes(island.id) && <span aria-hidden="true">•</span>}
          </button>
        ))}
      </nav>

      <div className="dreamscape-constellations" aria-label="Visible constellations">
        {CONSTELLATIONS.map((constellation) => {
          const found = state.constellations.includes(constellation.id);
          return (
            <button
              key={constellation.id}
              type="button"
              className={found ? 'is-found' : ''}
              onClick={() => selectConstellation(constellation.id)}
              aria-label={`${found ? 'Review' : 'Observe'} ${found ? constellation.name : 'faint lights'}`}
            >
              <span style={{ backgroundColor: constellation.accent }} aria-hidden="true" />
              {found ? constellation.name : 'Faint lights'}
            </button>
          );
        })}
      </div>

      {!reducedMotion && (
        <p className="dreamscape-control-hint" aria-hidden="true">
          Drag to look <span>·</span> Scroll to drift <span>·</span> Esc to return
        </p>
      )}

      {inspect && (
        <div className="dreamscape-inspect" role="dialog" aria-modal="false" aria-label={inspect.title}>
          <button type="button" onClick={() => setInspect(null)} aria-label="Close discovery details">
            <X size={15} />
          </button>
          <p className="dreamscape-eyebrow">A closer look</p>
          <h3>{inspect.title}</h3>
          <p>{inspect.body}</p>
        </div>
      )}

      <button type="button" className="dreamscape-telescope-shortcut" onClick={onOpenTelescope}>
        <Telescope size={15} aria-hidden="true" />
        Open the telescope
      </button>
    </section>
  );
}
