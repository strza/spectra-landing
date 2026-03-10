import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useAnimationPhase } from "../hooks/useAnimationPhase";

const COLORS = {
  white: new THREE.Color("#e0e0e0"),
  vocals: new THREE.Color("#9580FF"),
  drums: new THREE.Color("#FF6B4A"),
  instruments: new THREE.Color("#3DDC84"),
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function generateWaveform(
  count: number,
  style: "smooth" | "punchy" | "flowing",
  seed: number
): number[] {
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = i / count;
    let h: number;
    switch (style) {
      case "smooth":
        h =
          0.3 +
          0.7 *
            Math.abs(
              Math.sin(x * Math.PI * 4 + seed) *
                Math.sin(x * Math.PI * 7 + seed * 2)
            );
        break;
      case "punchy":
        h =
          0.2 +
          0.8 *
            Math.pow(
              Math.abs(Math.sin(x * Math.PI * 12 + seed * 3)),
              3
            );
        break;
      case "flowing":
        h =
          0.3 +
          0.7 *
            Math.abs(
              Math.sin(x * Math.PI * 3 + seed) *
                Math.cos(x * Math.PI * 5 + seed * 1.5)
            );
        break;
    }
    heights.push(h);
  }
  return heights;
}

const BAR_COUNT = 120;
const BAR_WIDTH = 0.06;
const BAR_GAP = 0.02;
const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP);
const MAX_HEIGHT = 1.2;
const SPLIT_OFFSET = 1.6;

const SEGMENT_COUNT = 6;
function getSegment(barIndex: number): number {
  return Math.floor((barIndex / BAR_COUNT) * SEGMENT_COUNT);
}

const SEGMENT_SHIFTS = [2, -1, 3, -2, 1, -3].map(
  (s) => (s * TOTAL_WIDTH) / SEGMENT_COUNT
);

interface StemBarsProps {
  stemIndex: number;
  heights: number[];
  stemColor: THREE.Color;
}

function StemBars({ stemIndex, heights, stemColor }: StemBarsProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const materialRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  const { getPhase } = useAnimationPhase();

  const setMeshRef = (index: number) => (el: THREE.Mesh | null) => {
    if (el) meshRefs.current[index] = el;
  };
  const setMatRef =
    (index: number) => (el: THREE.MeshBasicMaterial | null) => {
      if (el) materialRefs.current[index] = el;
    };

  // Pre-allocate temp color to avoid GC pressure in useFrame
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const { phase, progress } = getPhase(clock.elapsedTime);
    const easedProgress = easeInOutCubic(progress);
    const splitY = (stemIndex - 1) * SPLIT_OFFSET;

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = materialRefs.current[i];
      const segment = getSegment(i);
      const baseX = i * (BAR_WIDTH + BAR_GAP) - TOTAL_WIDTH / 2;
      const baseH = heights[i] * MAX_HEIGHT;

      switch (phase) {
        case "track": {
          const pulse =
            1 + 0.05 * Math.sin(clock.elapsedTime * 3 + i * 0.1);
          mesh.scale.y = baseH * pulse;
          mesh.position.y = 0;
          mesh.position.x = baseX;
          if (mat) mat.color.copy(COLORS.white);
          break;
        }
        case "split": {
          mesh.scale.y = baseH;
          mesh.position.y = splitY * easedProgress;
          mesh.position.x = baseX;
          if (mat)
            mat.color.lerpColors(COLORS.white, stemColor, easedProgress);
          break;
        }
        case "remix": {
          mesh.scale.y = baseH;
          mesh.position.y = splitY;
          const shift = SEGMENT_SHIFTS[segment] * easedProgress;
          mesh.position.x = baseX + shift;
          if (mat) {
            mat.color.copy(stemColor);
            const brightness =
              1 + 0.3 * easedProgress * Math.sin(progress * Math.PI);
            mat.color.multiplyScalar(brightness);
          }
          break;
        }
        case "recombine": {
          const remixX = baseX + SEGMENT_SHIFTS[segment];
          mesh.scale.y = baseH;
          mesh.position.y = splitY * (1 - easedProgress);
          mesh.position.x = remixX + (baseX - remixX) * easedProgress;
          if (mat) {
            const gradientT = i / BAR_COUNT;
            if (gradientT < 0.33) {
              tempColor.lerpColors(
                COLORS.vocals,
                COLORS.drums,
                gradientT / 0.33
              );
            } else if (gradientT < 0.66) {
              tempColor.lerpColors(
                COLORS.drums,
                COLORS.instruments,
                (gradientT - 0.33) / 0.33
              );
            } else {
              tempColor.lerpColors(
                COLORS.instruments,
                COLORS.vocals,
                (gradientT - 0.66) / 0.34
              );
            }
            mat.color.lerpColors(stemColor, tempColor, easedProgress);
          }
          break;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {heights.map((_, i) => (
        <mesh
          key={i}
          ref={setMeshRef(i)}
          position={[i * (BAR_WIDTH + BAR_GAP) - TOTAL_WIDTH / 2, 0, 0]}
        >
          <boxGeometry args={[BAR_WIDTH, 1, BAR_WIDTH]} />
          <meshBasicMaterial
            ref={setMatRef(i)}
            color={COLORS.white}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaveformScene() {
  const vocalsHeights = useMemo(
    () => generateWaveform(BAR_COUNT, "smooth", 42),
    []
  );
  const drumsHeights = useMemo(
    () => generateWaveform(BAR_COUNT, "punchy", 17),
    []
  );
  const instrumentsHeights = useMemo(
    () => generateWaveform(BAR_COUNT, "flowing", 73),
    []
  );

  return (
    <>
      <StemBars
        stemIndex={0}
        heights={vocalsHeights}
        stemColor={COLORS.vocals}
      />
      <StemBars
        stemIndex={1}
        heights={drumsHeights}
        stemColor={COLORS.drums}
      />
      <StemBars
        stemIndex={2}
        heights={instrumentsHeights}
        stemColor={COLORS.instruments}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.8}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function WaveformAnimation() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <WaveformScene />
    </Canvas>
  );
}
