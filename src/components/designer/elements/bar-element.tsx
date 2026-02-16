"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Rect, Circle, Text, Transformer } from "react-konva";
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
  const fill = element.style.fill || "#5C4033";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#3E2723";
  const icon = barType === "buffet" ? "🍽️" : "🍸";
  const label = element.name || (barType === "buffet" ? "בופה" : "בר");

  // Stool positions along the front of the bar
  const stools: { x: number; y: number }[] = [];
  for (let i = 0; i < stoolCount; i++) {
    const x = -w / 2 + (w / (stoolCount + 1)) * (i + 1);
    stools.push({ x, y: h / 2 + 14 });
  }

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
      >
        {/* Shadow */}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill="transparent"
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={8}
          shadowOffsetY={3}
        />

        {/* Bar counter */}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={4}
        />

        {/* Counter top (lighter strip) */}
        <Rect
          x={-w / 2 + 2}
          y={-h / 2 + 2}
          width={w - 4}
          height={6}
          fill="#8B7355"
          cornerRadius={2}
          opacity={0.6}
          listening={false}
        />

        {/* Stools */}
        {stools.map((stool, i) => (
          <Circle
            key={i}
            x={stool.x}
            y={stool.y}
            radius={7}
            fill="#8D8D8D"
            stroke="#6B6B6B"
            strokeWidth={1}
            listening={false}
          />
        ))}

        {/* Icon */}
        <Text text={icon} fontSize={18} align="center" x={-10} y={-12} listening={false} />

        {/* Label */}
        <Text
          text={label}
          fontSize={9}
          fontFamily="Heebo, sans-serif"
          fill="#D7CCC8"
          align="center"
          x={-30}
          y={h / 2 + 28}
          width={60}
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
