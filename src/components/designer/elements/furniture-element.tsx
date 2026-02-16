"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Rect, Circle, Text, Transformer } from "react-konva";
import type { DesignerElement, FurnitureMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface FurnitureElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

const FURNITURE_ICONS: Record<string, string> = {
  armchair: "🪑",
  sofa: "🛋️",
  "side-table": "🪵",
  "lounge-set": "🛋️",
  "cake-table": "🎂",
  "gift-table": "🎁",
  other: "📦",
};

const FURNITURE_LABELS: Record<string, string> = {
  armchair: "כורסה",
  sofa: "ספה",
  "side-table": "שולחן צד",
  "lounge-set": "לאונג׳",
  "cake-table": "שולחן עוגה",
  "gift-table": "שולחן מתנות",
  other: "ריהוט",
};

export function FurnitureElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: FurnitureElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const meta = element.metadata as unknown as FurnitureMetadata;
  const furnitureType = meta.furnitureType || "other";

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
      width: Math.max(25, element.width * scaleX),
      height: Math.max(25, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const w = element.width;
  const h = element.height;
  const fill = element.style.fill || "#A0845C";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#7C6548";
  const icon = FURNITURE_ICONS[furnitureType] || "📦";
  const label = element.name || FURNITURE_LABELS[furnitureType] || "ריהוט";

  const isRound = furnitureType === "side-table";

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
        {isRound ? (
          <Circle
            radius={Math.min(w, h) / 2}
            fill="transparent"
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={6}
            shadowOffsetY={2}
          />
        ) : (
          <Rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill="transparent"
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={6}
            shadowOffsetY={2}
          />
        )}

        {/* Shape */}
        {isRound ? (
          <Circle
            radius={Math.min(w, h) / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 1.5}
          />
        ) : (
          <Rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 1.5}
            cornerRadius={furnitureType === "sofa" || furnitureType === "lounge-set" ? 12 : 6}
          />
        )}

        {/* Sofa cushion detail */}
        {(furnitureType === "sofa" || furnitureType === "lounge-set") && (
          <Rect
            x={-w / 2 + 4}
            y={-h / 2 + 4}
            width={w - 8}
            height={h * 0.6}
            fill="#B8956A"
            cornerRadius={8}
            opacity={0.5}
            listening={false}
          />
        )}

        {/* Icon */}
        <Text text={icon} fontSize={16} align="center" x={-8} y={-10} listening={false} />

        {/* Label */}
        <Text
          text={label}
          fontSize={8}
          fontFamily="Heebo, sans-serif"
          fill="#999"
          align="center"
          x={-25}
          y={(isRound ? Math.min(w, h) / 2 : h / 2) + 4}
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
            width: Math.max(25, newBox.width),
            height: Math.max(25, newBox.height),
          })}
        />
      )}
    </>
  );
}
