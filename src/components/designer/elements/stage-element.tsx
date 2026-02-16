"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Rect, Text, Line, Transformer } from "react-konva";
import type { DesignerElement, StageMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface StageElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

export function StageElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: StageElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const meta = element.metadata as unknown as StageMetadata;
  const subType = meta.subType || "stage";
  const hasSteps = meta.hasSteps ?? true;

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
      height: Math.max(40, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const w = element.width;
  const h = element.height;
  const isChuppah = subType === "chuppah";
  const fill = element.style.fill || (isChuppah ? "#F5E6D3" : "#4A4A4A");
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || (isChuppah ? "#C8A882" : "#333");
  const icon = isChuppah ? "💒" : "🎤";
  const label = element.name || (isChuppah ? "חופה" : "במה");

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
        {/* Elevated shadow */}
        <Rect
          x={-w / 2 + 3}
          y={-h / 2 + 5}
          width={w}
          height={h}
          fill="rgba(0,0,0,0.15)"
          cornerRadius={6}
          listening={false}
        />

        {/* Platform */}
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={6}
        />

        {/* Decorative border for chuppah */}
        {isChuppah && (
          <Rect
            x={-w / 2 + 4}
            y={-h / 2 + 4}
            width={w - 8}
            height={h - 8}
            fill="transparent"
            stroke="#D4A574"
            strokeWidth={1}
            dash={[6, 3]}
            cornerRadius={4}
            listening={false}
          />
        )}

        {/* Steps indicator */}
        {hasSteps && !isChuppah && (
          <Rect
            x={-w / 2}
            y={h / 2}
            width={w}
            height={6}
            fill="#5A5A5A"
            stroke={stroke}
            strokeWidth={1}
            cornerRadius={[0, 0, 3, 3]}
            listening={false}
          />
        )}

        {/* Chuppah poles */}
        {isChuppah && (
          <>
            <Rect x={-w / 2 + 2} y={-h / 2 + 2} width={6} height={6} fill="#C8A882" cornerRadius={3} listening={false} />
            <Rect x={w / 2 - 8} y={-h / 2 + 2} width={6} height={6} fill="#C8A882" cornerRadius={3} listening={false} />
            <Rect x={-w / 2 + 2} y={h / 2 - 8} width={6} height={6} fill="#C8A882" cornerRadius={3} listening={false} />
            <Rect x={w / 2 - 8} y={h / 2 - 8} width={6} height={6} fill="#C8A882" cornerRadius={3} listening={false} />
          </>
        )}

        {/* Icon */}
        <Text text={icon} fontSize={20} align="center" x={-10} y={-14} listening={false} />

        {/* Label */}
        <Text
          text={label}
          fontSize={10}
          fontFamily="Heebo, sans-serif"
          fill={isChuppah ? "#8B6F47" : "#CCC"}
          align="center"
          x={-30}
          y={10}
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
            height: Math.max(40, newBox.height),
          })}
        />
      )}
    </>
  );
}
