"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Rect, Arrow, Text, Transformer } from "react-konva";
import type { DesignerElement, EntranceMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface EntranceElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

export function EntranceElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: EntranceElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const meta = element.metadata as unknown as EntranceMetadata;
  const direction = meta.direction || "in";
  const isEmergency = meta.isEmergency || false;

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
      width: Math.max(30, element.width * scaleX),
      height: Math.max(30, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const w = element.width;
  const h = element.height;
  const bgColor = isEmergency ? "#FEE2E2" : direction === "out" ? "#FEF3C7" : "#E8F5E9";
  const borderColor = isSelected ? "#F5D0A9" : isEmergency ? "#EF4444" : direction === "out" ? "#F59E0B" : "#22C55E";
  const arrowColor = isEmergency ? "#DC2626" : direction === "out" ? "#D97706" : "#16A34A";

  const arrowPoints =
    direction === "out"
      ? [0, 5, 0, -12] // pointing up/out
      : direction === "both"
        ? [0, 8, 0, -8] // bidirectional (just show one arrow, rotate)
        : [0, -12, 0, 5]; // pointing down/in

  const label =
    element.name ||
    (isEmergency ? "יציאת חירום" : direction === "out" ? "יציאה" : direction === "both" ? "כניסה/יציאה" : "כניסה");

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
        {/* Background */}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={6}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={4}
          shadowOffsetY={2}
        />

        {/* Arrow indicator */}
        <Arrow
          points={arrowPoints}
          fill={arrowColor}
          stroke={arrowColor}
          strokeWidth={2}
          pointerLength={6}
          pointerWidth={6}
          listening={false}
        />

        {/* Emergency X marks */}
        {isEmergency && (
          <>
            <Text text="⚠" fontSize={14} x={w / 2 - 18} y={-h / 2 + 2} listening={false} />
          </>
        )}

        {/* Label */}
        <Text
          text={label}
          fontSize={8}
          fontFamily="Heebo, sans-serif"
          fill="#666"
          align="center"
          x={-25}
          y={h / 2 + 4}
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
            width: Math.max(30, newBox.width),
            height: Math.max(30, newBox.height),
          })}
        />
      )}
    </>
  );
}
