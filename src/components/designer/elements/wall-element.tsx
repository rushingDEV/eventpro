"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Rect, Line, Circle, Text, Arc, Transformer } from "react-konva";
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
  const [hovered, setHovered] = useState(false);
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
  const halfW = element.width / 2;
  const halfT = thickness / 2;

  // Generate brick coursing lines (subtle horizontal lines)
  const brickLines: number[] = [];
  const brickSpacing = Math.max(3, thickness / 4);
  for (let y = -halfT + brickSpacing; y < halfT; y += brickSpacing) {
    brickLines.push(y);
  }

  // Door position calculations
  const doorStartX = -halfW + element.width * doorPosition - doorWidth / 2;
  const doorEndX = -halfW + element.width * doorPosition + doorWidth / 2;

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
        {/* Shadow */}
        <Rect
          x={-halfW}
          y={-halfT}
          width={element.width}
          height={thickness}
          fill="transparent"
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={hovered ? 8 : 6}
          shadowOffsetY={2}
        />

        {hasDoor ? (
          <>
            {/* Wall segment before door */}
            <Rect
              x={-halfW}
              y={-halfT}
              width={element.width * doorPosition - doorWidth / 2}
              height={thickness}
              fill={wallColor}
              stroke={wallStroke}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Brick coursing on segment before door */}
            {brickLines.map((lineY, i) => (
              <Line
                key={`brick-before-${i}`}
                points={[
                  -halfW + 1,
                  lineY,
                  -halfW + element.width * doorPosition - doorWidth / 2 - 1,
                  lineY,
                ]}
                stroke={wallStroke}
                strokeWidth={0.3}
                opacity={0.3}
                listening={false}
              />
            ))}

            {/* Door opening - dashed line */}
            <Line
              points={[doorStartX, 0, doorEndX, 0]}
              stroke="#A0522D"
              strokeWidth={2}
              dash={[4, 4]}
            />

            {/* Door swing arc (quarter circle) */}
            <Arc
              x={doorStartX}
              y={-halfT}
              innerRadius={0}
              outerRadius={doorWidth}
              angle={90}
              rotation={0}
              fill="transparent"
              stroke="#A0522D"
              strokeWidth={1}
              dash={[3, 3]}
              opacity={0.5}
              listening={false}
            />

            {/* Wall segment after door */}
            <Rect
              x={doorEndX}
              y={-halfT}
              width={element.width - (element.width * doorPosition + doorWidth / 2)}
              height={thickness}
              fill={wallColor}
              stroke={wallStroke}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Brick coursing on segment after door */}
            {brickLines.map((lineY, i) => (
              <Line
                key={`brick-after-${i}`}
                points={[
                  doorEndX + 1,
                  lineY,
                  halfW - 1,
                  lineY,
                ]}
                stroke={wallStroke}
                strokeWidth={0.3}
                opacity={0.3}
                listening={false}
              />
            ))}
          </>
        ) : (
          <>
            <Rect
              x={-halfW}
              y={-halfT}
              width={element.width}
              height={thickness}
              fill={wallColor}
              stroke={wallStroke}
              strokeWidth={isSelected ? 2 : 1}
              cornerRadius={2}
            />
            {/* Brick coursing texture lines */}
            {brickLines.map((lineY, i) => (
              <Line
                key={`brick-${i}`}
                points={[-halfW + 1, lineY, halfW - 1, lineY]}
                stroke={wallStroke}
                strokeWidth={0.3}
                opacity={0.3}
                listening={false}
              />
            ))}
          </>
        )}

        {/* End cap - left */}
        <Circle
          x={-halfW}
          y={0}
          radius={3}
          fill={wallColor}
          stroke={wallStroke}
          strokeWidth={0.5}
          listening={false}
        />

        {/* End cap - right */}
        <Circle
          x={halfW}
          y={0}
          radius={3}
          fill={wallColor}
          stroke={wallStroke}
          strokeWidth={0.5}
          listening={false}
        />

        {/* Label */}
        {element.name && (
          <Text
            text={element.name}
            fontSize={9}
            fontFamily="Heebo, sans-serif"
            fill="#888"
            align="center"
            x={-30}
            y={halfT + 4}
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
