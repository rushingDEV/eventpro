"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Rect, Circle, Text, Line, Transformer } from "react-konva";
import type { DesignerElement, BarMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface BarElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

export function BarElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: BarElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);
  const meta = element.metadata as unknown as BarMetadata;
  const stoolCount = meta.stoolCount || 4;
  const barType = meta.barType || "cocktail";

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
      height: Math.max(30, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const w = element.width;
  const h = element.height;
  const bodyFill = element.style.fill || "#4A3728";
  const counterFill = "#6B5344";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#3E2723";
  const label = element.name || (barType === "buffet" ? "בופה" : "בר");
  const shadowBlur = hovered ? 16 : 8;

  // Counter overhang dimensions
  const overhangX = 6; // extends this far beyond body on each side
  const counterHeight = 8;

  // Stool positions along the front of the bar
  const stools: { x: number; y: number }[] = [];
  for (let i = 0; i < stoolCount; i++) {
    const x = -w / 2 + (w / (stoolCount + 1)) * (i + 1);
    stools.push({ x, y: h / 2 + 18 });
  }

  // Glass decoration colors
  const glassColors = ["#88CCEE", "#FFAA66", "#AADDAA"];

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
        {/* Shadow / glow */}
        <Rect
          x={-w / 2 - overhangX}
          y={-h / 2 - 2}
          width={w + overhangX * 2}
          height={h + 4}
          fill="transparent"
          shadowColor={hovered ? "rgba(245,208,169,0.3)" : "rgba(0,0,0,0.25)"}
          shadowBlur={shadowBlur}
          shadowOffsetY={3}
          listening={false}
        />

        {/* Bar body (darker, narrower) */}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill={bodyFill}
          stroke={stroke}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={3}
        />

        {/* Wood grain lines on body */}
        <Line
          points={[-w / 2 + 4, -h / 2 + h * 0.3, w / 2 - 4, -h / 2 + h * 0.3]}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          listening={false}
        />
        <Line
          points={[-w / 2 + 4, -h / 2 + h * 0.6, w / 2 - 4, -h / 2 + h * 0.6]}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          listening={false}
        />

        {/* Counter top (lighter, wider — overhang effect) */}
        <Rect
          x={-w / 2 - overhangX}
          y={-h / 2 - counterHeight / 2}
          width={w + overhangX * 2}
          height={counterHeight}
          fill={counterFill}
          stroke="#7D6555"
          strokeWidth={1}
          cornerRadius={2}
          listening={false}
        />

        {/* Counter surface highlight */}
        <Rect
          x={-w / 2 - overhangX + 2}
          y={-h / 2 - counterHeight / 2 + 1}
          width={w + overhangX * 2 - 4}
          height={2}
          fill="rgba(255,255,255,0.1)"
          cornerRadius={1}
          listening={false}
        />

        {/* Glass decorations on counter surface */}
        {glassColors.map((color, i) => {
          const gx = -w / 4 + (i * w) / 4;
          const gy = -h / 2 - counterHeight / 2 + counterHeight / 2;
          return (
            <Circle
              key={`glass-${i}`}
              x={gx}
              y={gy}
              radius={3}
              fill={color}
              opacity={0.6}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={0.5}
              listening={false}
            />
          );
        })}

        {/* Detailed stools: seat circle + stem line + base circle */}
        {stools.map((stool, i) => {
          const seatY = stool.y;
          const stemLength = 8;
          const baseY = seatY + stemLength;
          return (
            <Group key={`stool-${i}`} listening={false}>
              {/* Seat */}
              <Circle
                x={stool.x}
                y={seatY}
                radius={6}
                fill="#9E9E9E"
                stroke="#757575"
                strokeWidth={1}
                listening={false}
              />
              {/* Seat cushion highlight */}
              <Circle
                x={stool.x}
                y={seatY - 1}
                radius={3.5}
                fill="rgba(255,255,255,0.1)"
                listening={false}
              />
              {/* Stem */}
              <Line
                points={[stool.x, seatY + 6, stool.x, baseY]}
                stroke="#757575"
                strokeWidth={2}
                listening={false}
              />
              {/* Base */}
              <Circle
                x={stool.x}
                y={baseY}
                radius={4}
                fill="#6B6B6B"
                stroke="#555"
                strokeWidth={0.5}
                listening={false}
              />
            </Group>
          );
        })}

        {/* Label text (replaces emoji) */}
        <Text
          text={label}
          fontSize={11}
          fontStyle="bold"
          fontFamily="Heebo, Arial, sans-serif"
          fill="#D7CCC8"
          align="center"
          x={-w / 2}
          y={-h / 2 + (h - 11) / 2}
          width={w}
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
            height: Math.max(30, newBox.height),
          })}
        />
      )}
    </>
  );
}
