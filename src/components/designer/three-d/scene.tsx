"use client";

import { Suspense, useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useDesignerStore } from "@/lib/designer/store";
import { convertTo3D, type Element3D } from "@/lib/designer/converter-3d";
import { Button } from "@/components/ui/button";
import { Camera, Eye, Music, DoorOpen, ArrowUp } from "lucide-react";
import * as THREE from "three";

// Camera presets
const CAMERA_PRESETS = [
  { name: "מבט עילי", icon: <ArrowUp className="h-3.5 w-3.5" />, position: [0, 8, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  { name: "סקירה 45°", icon: <Eye className="h-3.5 w-3.5" />, position: [5, 5, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  { name: "נקודת מבט אורח", icon: <DoorOpen className="h-3.5 w-3.5" />, position: [0, 0.8, 6] as [number, number, number], target: [0, 0.5, 0] as [number, number, number] },
  { name: "מבט מהבמה", icon: <Music className="h-3.5 w-3.5" />, position: [0, 1.2, -4] as [number, number, number], target: [0, 0.5, 2] as [number, number, number] },
];

// Lighting presets
const LIGHTING_PRESETS = [
  { name: "ערב", ambient: 0.3, directional: 0.8, color: "#FFE4B5" },
  { name: "לילה", ambient: 0.15, directional: 0.4, color: "#B0C4DE" },
  { name: "יום", ambient: 0.6, directional: 1.0, color: "#FFFFFF" },
];

function Element3DRenderer({ el }: { el: Element3D }) {
  const color = new THREE.Color(el.color);
  const emissiveColor = el.emissive ? new THREE.Color(el.emissive) : undefined;

  // PBR material: prefer el.material fields, fall back to legacy metadata, then defaults
  const matRoughness = el.material?.roughness ?? 0.7;
  const matMetalness = el.material?.metalness ?? 0.1;
  const matTransparent = el.material?.transparent ?? (el.metadata?.transparent as boolean) ?? false;
  const matOpacity = el.material?.opacity ?? (el.metadata?.opacity as number) ?? 1;

  const geometryNode = useMemo(() => {
    switch (el.geometry) {
      case "cylinder":
        return <cylinderGeometry args={[el.scale[0], el.scale[0], el.scale[1], 32]} />;
      case "sphere":
        return <sphereGeometry args={[el.scale[0], 16, 16]} />;
      case "plane":
        return <planeGeometry args={[el.scale[0], el.scale[2]]} />;
      case "box":
      default:
        return <boxGeometry args={el.scale} />;
    }
  }, [el.geometry, el.scale]);

  return (
    <group>
      <mesh
        position={el.position}
        rotation={el.rotation}
        castShadow
        receiveShadow
      >
        {geometryNode}
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveColor ? 0.5 : 0}
          transparent={matTransparent}
          opacity={matOpacity}
          roughness={matRoughness}
          metalness={matMetalness}
        />
      </mesh>

      {/* Point light for lighting elements */}
      {el.metadata?.isLight ? (
        <pointLight
          position={el.position}
          color={el.emissive || "#FFD700"}
          intensity={(el.metadata?.intensity as number) || 1}
          distance={3}
          decay={2}
        />
      ) : null}
    </group>
  );
}

/**
 * Smooth camera transition component.
 * Lerps camera position and OrbitControls target when the preset changes.
 */
function SmoothCameraController({
  targetPosition,
  targetLookAt,
  controlsRef,
}: {
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const posRef = useRef(new THREE.Vector3(...targetPosition));
  const lookRef = useRef(new THREE.Vector3(...targetLookAt));
  const frameCountRef = useRef(0);
  const lerpSpeed = 0.06; // ~40 frames to converge

  // Reset lerp counter when target changes
  useEffect(() => {
    posRef.current.set(...targetPosition);
    lookRef.current.set(...targetLookAt);
    frameCountRef.current = 0;
  }, [targetPosition, targetLookAt]);

  useFrame(() => {
    if (frameCountRef.current > 120) return; // Stop after convergence
    frameCountRef.current++;

    camera.position.lerp(posRef.current, lerpSpeed);

    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.target.lerp(lookRef.current, lerpSpeed);
      controls.update();
    }
  });

  return null;
}

/**
 * Dynamic point lights placed above table tops.
 */
function TableLights({ elements3D }: { elements3D: Element3D[] }) {
  const tableTops = useMemo(
    () => elements3D.filter((el) => el.type === "table-top"),
    [elements3D]
  );

  return (
    <>
      {tableTops.map((tt) => (
        <pointLight
          key={`table-light-${tt.id}`}
          position={[tt.position[0], tt.position[1] + 1.2, tt.position[2]]}
          color="#FFF5E0"
          intensity={0.35}
          distance={2.5}
          decay={2}
        />
      ))}
    </>
  );
}

function Scene3D() {
  const elements = useDesignerStore((s) => s.elements);
  const canvasWidth = useDesignerStore((s) => s.canvasWidth);
  const canvasHeight = useDesignerStore((s) => s.canvasHeight);

  const elements3D = useMemo(() => convertTo3D(elements), [elements]);

  const [lightingPreset, setLightingPreset] = useState(LIGHTING_PRESETS[0]);

  const groundW = canvasWidth * 0.01;
  const groundH = canvasHeight * 0.01;

  return (
    <>
      {/* Lighting — warm key + cool fill */}
      <ambientLight intensity={lightingPreset.ambient} color={lightingPreset.color} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={lightingPreset.directional * 0.8}
        color="#FFE4B5"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-3, 6, -3]}
        intensity={lightingPreset.directional * 0.4}
        color="#B0C4DE"
      />

      {/* Dynamic table point lights */}
      <TableLights elements3D={elements3D} />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[groundW / 2, 0, groundH / 2]}>
        <planeGeometry args={[groundW * 1.5, groundH * 1.5]} />
        <meshStandardMaterial color="#F5F0E8" roughness={0.9} />
      </mesh>

      {/* Grid */}
      <Grid
        infiniteGrid
        fadeDistance={15}
        fadeStrength={5}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#D5CFC7"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#B5AFA7"
        position={[groundW / 2, 0.001, groundH / 2]}
      />

      {/* Contact shadows */}
      <ContactShadows
        position={[groundW / 2, 0.002, groundH / 2]}
        width={groundW}
        height={groundH}
        opacity={0.3}
        blur={2}
      />

      {/* Elements */}
      {elements3D.map((el) => (
        <Element3DRenderer key={el.id} el={el} />
      ))}

      {/* Environment — sunset for warmer lighting */}
      <Environment preset="sunset" background={false} />
    </>
  );
}

export function ThreeDScene() {
  const [cameraPresetIdx, setCameraPresetIdx] = useState(1); // Default: 45° overview
  const preset = CAMERA_PRESETS[cameraPresetIdx];
  const controlsRef = useRef<any>(null);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{
          position: preset.position,
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        className="rounded-xl"
      >
        {/* Atmospheric fog */}
        <fog attach="fog" args={["#F5F0E8", 8, 25]} />

        <Suspense fallback={null}>
          <Scene3D />

          {/* Smooth camera transitions */}
          <SmoothCameraController
            targetPosition={preset.position}
            targetLookAt={preset.target}
            controlsRef={controlsRef}
          />

          <OrbitControls
            ref={controlsRef}
            target={preset.target}
            enableDamping
            dampingFactor={0.1}
            maxPolarAngle={Math.PI / 2 - 0.1}
            minDistance={1}
            maxDistance={20}
          />

          {/* Post-processing */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.9} intensity={0.4} mipmapBlur />
            <Vignette offset={0.1} darkness={0.3} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Camera preset buttons — glass container */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10 designer-glass rounded-xl p-2 shadow-lg">
        {CAMERA_PRESETS.map((cp, idx) => (
          <Button
            key={cp.name}
            variant={idx === cameraPresetIdx ? "default" : "secondary"}
            size="sm"
            onClick={() => setCameraPresetIdx(idx)}
            className="gap-1.5 text-xs"
          >
            {cp.icon}
            {cp.name}
          </Button>
        ))}
      </div>

      {/* Lighting label */}
      <div className="absolute bottom-3 left-3 z-10 text-xs bg-black/50 text-white px-2 py-1 rounded">
        3D Preview
      </div>
    </div>
  );
}
