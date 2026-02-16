"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Circle, Rect, Text, Transformer } from "react-konva";
import type { DesignerElement, DecorationMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface DecorationElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

const DECORATION_ICONS: Record<string, string> = {
  flowers: "🌸",
  lighting: "💡",
  sign: "🪧",
  "photo-booth": "📸",
  other: "✨",
};

const DECORATION_LABELS: Record<string, string> = {
  flowers: "פרחים",
  lighting: "תאורה",
  sign: "שילוט",
  "photo-booth": "פוטו בות׳",
  other: "עיצוב",
};

export function DecorationElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: DecorationElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
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

  const icon = DECORATION_ICONS[decType] || "✨";
  const label = element.name || DECORATION_LABELS[decType] || "עיצוב";
  const fill = element.style.fill || "#FFF8E7";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#D4A574";
  const r = Math.min(element.width, element.height) / 2;

  // Glow effect for lighting
  const glowOpacity = decType === "lighting" ? (intensity === "high" ? 0.4 : intensity === "medium" ? 0.25 : 0.1) : 0;

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
        {/* Glow for lighting elements */}
        {glowOpacity > 0 && (
          <Circle
            radius={r + 15}
            fill="#FFD700"
            opacity={glowOpacity}
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
          shadowBlur={4}
          shadowOffsetY={2}
        />

        {/* Icon */}
        <Text text={icon} fontSize={18} align="center" x={-10} y={-10} listening={false} />

        {/* Sign text */}
        {decType === "sign" && meta.text && (
          <Text
            text={meta.text}
            fontSize={8}
            fontFamily="Heebo, sans-serif"
            fill="#5D4037"
            align="center"
            x={-20}
            y={-4}
            width={40}
            listening={false}
          />
        )}

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
