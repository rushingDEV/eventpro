"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Rect, Arrow, Line, Text, Transformer } from "react-konva";
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
  const [hovered, setHovered] = useState(false);
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
  const borderColor = isSelected
    ? "#F5D0A9"
    : isEmergency
      ? "#EF4444"
      : direction === "out"
        ? "#F59E0B"
        : "#22C55E";
  const arrowColor = isEmergency ? "#DC2626" : direction === "out" ? "#D97706" : "#16A34A";

  const label =
    element.name ||
    (isEmergency
      ? "יציאת חירום"
      : direction === "out"
        ? "יציאה"
        : direction === "both"
          ? "כניסה/יציאה"
          : "כניסה");

  // Warning triangle dimensions for emergency
  const triSize = Math.min(w, h) * 0.28;
  const triCenterX = w / 2 - triSize * 0.7;
  const triCenterY = -h / 2 + triSize * 0.7;

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
        {/* Background */}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={10}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={hovered ? 8 : 4}
          shadowOffsetY={2}
        />

        {/* Arrow indicator(s) */}
        {direction === "both" ? (
          <>
            {/* Arrow pointing in (down) */}
            <Arrow
              points={[0, -10, 0, 6]}
              fill={arrowColor}
              stroke={arrowColor}
              strokeWidth={3}
              pointerLength={8}
              pointerWidth={8}
              listening={false}
            />
            {/* Arrow pointing out (up) */}
            <Arrow
              points={[0, 10, 0, -6]}
              fill={arrowColor}
              stroke={arrowColor}
              strokeWidth={3}
              pointerLength={8}
              pointerWidth={8}
              listening={false}
            />
          </>
        ) : (
          <Arrow
            points={
              direction === "out"
                ? [0, 5, 0, -12]
                : [0, -12, 0, 5]
            }
            fill={arrowColor}
            stroke={arrowColor}
            strokeWidth={3}
            pointerLength={8}
            pointerWidth={8}
            listening={false}
          />
        )}

        {/* Emergency warning: drawn triangle + exclamation */}
        {isEmergency && (
          <>
            {/* Warning triangle */}
            <Line
              points={[
                triCenterX, triCenterY - triSize * 0.5,
                triCenterX - triSize * 0.5, triCenterY + triSize * 0.35,
                triCenterX + triSize * 0.5, triCenterY + triSize * 0.35,
              ]}
              fill="#FEF08A"
              stroke="#DC2626"
              strokeWidth={1.5}
              closed
              listening={false}
            />
            {/* Exclamation mark inside triangle */}
            <Text
              text="!"
              fontSize={Math.max(8, triSize * 0.6)}
              fontStyle="bold"
              fontFamily="Arial, sans-serif"
              fill="#DC2626"
              align="center"
              x={triCenterX - triSize * 0.2}
              y={triCenterY - triSize * 0.25}
              width={triSize * 0.4}
              listening={false}
            />
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
