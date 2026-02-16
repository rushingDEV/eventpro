"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { Group, Rect, Circle, Text, Transformer } from "react-konva";
import type { DesignerElement, DanceFloorMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface DanceFloorElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

/**
 * Simple deterministic hash from a string, used to seed sparkle positions
 * so they don't flicker on every render.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministic pseudo-random number derived from a seed.
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 127.1 + index * index * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function DanceFloorElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: DanceFloorElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);
  const meta = element.metadata as unknown as DanceFloorMetadata;
  const shape = meta.shape || "rect";
  const hasLed = meta.hasLedGrid || false;

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
      width: Math.max(60, element.width * scaleX),
      height: Math.max(60, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const w = element.width;
  const h = element.height;
  const r = Math.min(w, h) / 2;
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#666";
  const shadowBlur = hovered ? 18 : 8;

  // --- LED checkerboard tile pattern ---
  const tileSize = 20;
  const ledTiles = useMemo(() => {
    if (!hasLed || shape !== "rect") return null;
    const tiles: React.ReactNode[] = [];
    const cols = Math.floor(w / tileSize);
    const rows = Math.floor(h / tileSize);
    const offsetX = (w - cols * tileSize) / 2;
    const offsetY = (h - rows * tileSize) / 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dark = (row + col) % 2 === 0;
        tiles.push(
          <Rect
            key={`tile-${row}-${col}`}
            x={-w / 2 + offsetX + col * tileSize}
            y={-h / 2 + offsetY + row * tileSize}
            width={tileSize}
            height={tileSize}
            fill={dark ? "#2D2D2D" : "#383838"}
            listening={false}
          />
        );
      }
    }
    return tiles;
  }, [hasLed, shape, w, h]);

  // --- Deterministic sparkle positions ---
  const sparkles = useMemo(() => {
    if (!hasLed) return null;
    const seed = hashCode(element.id);
    return Array.from({ length: 10 }).map((_, i) => {
      const sx = (seededRandom(seed, i * 2) - 0.5) * w * 0.75;
      const sy = (seededRandom(seed, i * 2 + 1) - 0.5) * h * 0.75;
      const radius = 1.5 + seededRandom(seed, i * 3) * 1.5;
      const opacity = 0.3 + seededRandom(seed, i * 4) * 0.4;
      return (
        <Circle
          key={`spark-${i}`}
          x={sx}
          y={sy}
          radius={radius}
          fill="#FFD700"
          opacity={opacity}
          listening={false}
        />
      );
    });
  }, [hasLed, element.id, w, h]);

  const displayName = element.name || "DANCE FLOOR";

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
        {/* Shadow / glow layer */}
        {shape === "circle" ? (
          <Circle
            radius={r + 2}
            fill="transparent"
            shadowColor={hovered ? "rgba(255,215,0,0.25)" : "rgba(0,0,0,0.2)"}
            shadowBlur={shadowBlur}
            shadowOffsetY={3}
            listening={false}
          />
        ) : (
          <Rect
            x={-w / 2 - 2}
            y={-h / 2 - 2}
            width={w + 4}
            height={h + 4}
            fill="transparent"
            shadowColor={hovered ? "rgba(255,215,0,0.25)" : "rgba(0,0,0,0.2)"}
            shadowBlur={shadowBlur}
            shadowOffsetY={3}
            listening={false}
          />
        )}

        {/* Base floor surface */}
        {shape === "circle" ? (
          <Circle
            radius={r}
            fill="#2D2D2D"
            stroke={stroke}
            strokeWidth={3}
          />
        ) : (
          <Rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill="#2D2D2D"
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={4}
          />
        )}

        {/* LED checkerboard tiles (rect only) */}
        {ledTiles}

        {/* Sparkle dots */}
        {sparkles}

        {/* Metallic border highlight (inner) */}
        {shape === "rect" && (
          <Rect
            x={-w / 2 + 3}
            y={-h / 2 + 3}
            width={w - 6}
            height={h - 6}
            fill="transparent"
            stroke="#555"
            strokeWidth={0.5}
            cornerRadius={2}
            listening={false}
          />
        )}

        {/* Text label — replaces emoji */}
        <Text
          text={displayName}
          fontSize={12}
          fontStyle="bold"
          fontFamily="Heebo, Arial, sans-serif"
          fill="#DDD"
          align="center"
          verticalAlign="middle"
          x={-w / 2}
          y={-8}
          width={w}
          letterSpacing={1}
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
            width: Math.max(60, newBox.width),
            height: Math.max(60, newBox.height),
          })}
        />
      )}
    </>
  );
}
