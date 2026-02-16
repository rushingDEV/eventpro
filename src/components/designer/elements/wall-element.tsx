"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Rect, Line, Text, Transformer } from "react-konva";
import type { DesignerElement, WallMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface WallElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

export function WallElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: WallElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const meta = element.metadata as unknown as WallMetadata;
  const thickness = meta.thickness || 12;
  const hasDoor = meta.hasDoor || false;
  const doorPosition = meta.doorPosition ?? 0.5;
  const doorWidth = meta.doorWidth || 40;

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
      height: Math.max(8, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const wallColor = element.style.fill || "#8D8D8D";
  const wallStroke = isSelected ? "#F5D0A9" : element.style.stroke || "#6B6B6B";

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
          x={-element.width / 2}
          y={-thickness / 2}
          width={element.width}
          height={thickness}
          fill="transparent"
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={6}
          shadowOffsetY={2}
        />

        {hasDoor ? (
          <>
            {/* Wall segment before door */}
            <Rect
              x={-element.width / 2}
              y={-thickness / 2}
              width={element.width * doorPosition - doorWidth / 2}
              height={thickness}
              fill={wallColor}
              stroke={wallStroke}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Door opening - dashed line */}
            <Line
              points={[
                -element.width / 2 + element.width * doorPosition - doorWidth / 2,
                0,
                -element.width / 2 + element.width * doorPosition + doorWidth / 2,
                0,
              ]}
              stroke="#A0522D"
              strokeWidth={2}
              dash={[4, 4]}
            />
            {/* Wall segment after door */}
            <Rect
              x={-element.width / 2 + element.width * doorPosition + doorWidth / 2}
              y={-thickness / 2}
              width={element.width - (element.width * doorPosition + doorWidth / 2)}
              height={thickness}
              fill={wallColor}
              stroke={wallStroke}
              strokeWidth={isSelected ? 2 : 1}
            />
          </>
        ) : (
          <Rect
            x={-element.width / 2}
            y={-thickness / 2}
            width={element.width}
            height={thickness}
            fill={wallColor}
            stroke={wallStroke}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={2}
          />
        )}

        {/* Label */}
        {element.name && (
          <Text
            text={element.name}
            fontSize={9}
            fontFamily="Heebo, sans-serif"
            fill="#888"
            align="center"
            x={-30}
            y={thickness / 2 + 4}
            width={60}
            listening={false}
          />
        )}
      </Group>

      {isSelected && !element.locked && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["middle-left", "middle-right"]}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(20, newBox.width),
            height: Math.max(8, newBox.height),
          })}
        />
      )}
    </>
  );
}
