"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Circle, Rect, Line, Text, Transformer } from "react-konva";
import type { DesignerElement, DecorationMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface DecorationElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

const DECORATION_LABELS: Record<string, string> = {
  flowers: "פרחים",
  lighting: "תאורה",
  sign: "שילוט",
  "photo-booth": "פוטו בות׳",
  other: "עיצוב",
};

function FlowerShape({ r }: { r: number }) {
  const petalRadius = r * 0.32;
  const ringRadius = r * 0.42;
  const petalColors = ["#F8B4C8", "#FADADD", "#FFE4C9", "#F5C6D0", "#FBD5E0", "#FFD9C0"];
  const petalCount = 6;
  const petals = [];
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    petals.push(
      <Circle
        key={`petal-${i}`}
        x={Math.cos(angle) * ringRadius}
        y={Math.sin(angle) * ringRadius}
        radius={petalRadius}
        fill={petalColors[i % petalColors.length]}
        opacity={0.85}
        listening={false}
      />
    );
  }
  return (
    <>
      {petals}
      <Circle radius={r * 0.16} fill="#DAA520" listening={false} />
    </>
  );
}

function LightingShape({ r }: { r: number }) {
  const bulbRadius = r * 0.25;
  return (
    <>
      {/* Bulb */}
      <Circle y={-r * 0.15} radius={bulbRadius} fill="#FFE082" stroke="#FFC107" strokeWidth={1} listening={false} />
      {/* Left fixture line */}
      <Line
        points={[-bulbRadius * 0.6, bulbRadius * 0.5 - r * 0.15, -bulbRadius * 1.1, r * 0.35]}
        stroke="#9E9E9E"
        strokeWidth={1.5}
        listening={false}
      />
      {/* Right fixture line */}
      <Line
        points={[bulbRadius * 0.6, bulbRadius * 0.5 - r * 0.15, bulbRadius * 1.1, r * 0.35]}
        stroke="#9E9E9E"
        strokeWidth={1.5}
        listening={false}
      />
      {/* Base bar */}
      <Line
        points={[-bulbRadius * 1.1, r * 0.35, bulbRadius * 1.1, r * 0.35]}
        stroke="#9E9E9E"
        strokeWidth={1.5}
        listening={false}
      />
    </>
  );
}

function SignShape({ r, text }: { r: number; text?: string }) {
  const signW = r * 1.2;
  const signH = r * 0.8;
  return (
    <>
      <Rect
        x={-signW / 2}
        y={-signH / 2}
        width={signW}
        height={signH}
        fill="#FFF8E1"
        stroke="#A1887F"
        strokeWidth={1.5}
        cornerRadius={4}
        listening={false}
      />
      {text && (
        <Text
          text={text}
          fontSize={8}
          fontFamily="Heebo, sans-serif"
          fill="#5D4037"
          align="center"
          x={-signW / 2}
          y={-4}
          width={signW}
          listening={false}
        />
      )}
    </>
  );
}

function PhotoBoothShape({ r }: { r: number }) {
  const camW = r * 1.0;
  const camH = r * 0.7;
  const lensR = r * 0.2;
  return (
    <>
      {/* Camera body */}
      <Rect
        x={-camW / 2}
        y={-camH / 2}
        width={camW}
        height={camH}
        fill="#607D8B"
        stroke="#455A64"
        strokeWidth={1.5}
        cornerRadius={3}
        listening={false}
      />
      {/* Lens */}
      <Circle radius={lensR} fill="#263238" stroke="#90A4AE" strokeWidth={1} listening={false} />
      {/* Lens glare */}
      <Circle x={-lensR * 0.3} y={-lensR * 0.3} radius={lensR * 0.25} fill="#B0BEC5" opacity={0.6} listening={false} />
      {/* Flash bump */}
      <Rect
        x={camW / 2 - r * 0.22}
        y={-camH / 2 - r * 0.12}
        width={r * 0.18}
        height={r * 0.12}
        fill="#78909C"
        cornerRadius={1}
        listening={false}
      />
    </>
  );
}

function OtherDecorationShape({ r }: { r: number }) {
  const starPoints: number[] = [];
  const spikes = 4;
  const outerR = r * 0.4;
  const innerR = r * 0.18;
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? outerR : innerR;
    starPoints.push(Math.cos(angle) * rad, Math.sin(angle) * rad);
  }
  return (
    <Line
      points={starPoints}
      fill="#FFD54F"
      stroke="#FFC107"
      strokeWidth={1}
      closed
      listening={false}
    />
  );
}

export function DecorationElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: DecorationElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);
  const meta = element.metadata as unknown as DecorationMetadata;
  const decType = meta.decorationType || "other";
  const intensity = meta.intensity || "medium";

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onTransformEnd(element.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, element.width * scaleX),
      height: Math.max(20, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const label = element.name || DECORATION_LABELS[decType] || "עיצוב";
  const fill = element.style.fill || "#FFF8E7";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#D4A574";
  const r = Math.min(element.width, element.height) / 2;

  // Glow effect for lighting
  const glowOpacity =
    decType === "lighting"
      ? intensity === "high"
        ? 0.4
        : intensity === "medium"
          ? 0.25
          : 0.1
      : 0;

  // Hover glow
  const hoverGlowOpacity = hovered && decType !== "lighting" ? 0.12 : 0;

  return (
    <>
      <Group
        ref={groupRef}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable={!element.locked}
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hover glow for non-lighting elements */}
        {hoverGlowOpacity > 0 && (
          <Circle
            radius={r + 10}
            fill="#F5D0A9"
            opacity={hoverGlowOpacity}
            listening={false}
          />
        )}

        {/* Glow for lighting elements */}
        {glowOpacity > 0 && (
          <Circle
            radius={r + 15}
            fill="#FFD700"
            opacity={hovered ? glowOpacity + 0.1 : glowOpacity}
            listening={false}
          />
        )}

        {/* Main circle */}
        <Circle
          radius={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 3 : 1.5}
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={hovered ? 8 : 4}
          shadowOffsetY={2}
        />

        {/* Drawn decoration shape based on type */}
        {decType === "flowers" && <FlowerShape r={r} />}
        {decType === "lighting" && <LightingShape r={r} />}
        {decType === "sign" && <SignShape r={r} text={meta.text} />}
        {decType === "photo-booth" && <PhotoBoothShape r={r} />}
        {decType === "other" && <OtherDecorationShape r={r} />}

        {/* Label */}
        <Text
          text={label}
          fontSize={8}
          fontFamily="Heebo, sans-serif"
          fill="#999"
          align="center"
          x={-25}
          y={r + 4}
          width={50}
          listening={false}
        />
      </Group>

      {isSelected && !element.locked && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(20, newBox.width),
            height: Math.max(20, newBox.height),
          })}
        />
      )}
    </>
  );
}
