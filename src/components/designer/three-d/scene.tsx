"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, ContactShadows } from "@react-three/drei";
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
  const isTransparent = (el.metadata?.transparent as boolean) || false;
  const opacity = (el.metadata?.opacity as number) ?? 1;

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
          transparent={isTransparent}
          opacity={opacity}
          roughness={0.7}
          metalness={0.1}
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
      {/* Lighting */}
      <ambientLight intensity={lightingPreset.ambient} color={lightingPreset.color} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={lightingPreset.directional}
        color={lightingPreset.color}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

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

      {/* Environment */}
      <Environment preset="apartment" background={false} />
    </>
  );
}

export function ThreeDScene() {
  const [cameraPresetIdx, setCameraPresetIdx] = useState(1); // Default: 45° overview
  const preset = CAMERA_PRESETS[cameraPresetIdx];

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
        <Suspense fallback={null}>
          <Scene3D />
          <OrbitControls
            target={preset.target}
            enableDamping
            dampingFactor={0.1}
            maxPolarAngle={Math.PI / 2 - 0.1}
            minDistance={1}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>

      {/* Camera preset buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
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
