"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Rect, Circle, Text, Line, Transformer } from "react-konva";
import type { DesignerElement, DanceFloorMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface DanceFloorElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
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

  const fill = element.style.fill || "#2D2D2D";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#555";
  const w = element.width;
  const h = element.height;
  const r = Math.min(w, h) / 2;

  // LED grid lines
  const ledLines: React.ReactNode[] = [];
  if (hasLed && shape === "rect") {
    const gridStep = 30;
    for (let x = -w / 2 + gridStep; x < w / 2; x += gridStep) {
      ledLines.push(
        <Line key={`v-${x}`} points={[x, -h / 2, x, h / 2]} stroke="#444" strokeWidth={0.5} opacity={0.5} listening={false} />
      );
    }
    for (let y = -h / 2 + gridStep; y < h / 2; y += gridStep) {
      ledLines.push(
        <Line key={`h-${y}`} points={[-w / 2, y, w / 2, y]} stroke="#444" strokeWidth={0.5} opacity={0.5} listening={false} />
      );
    }
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
          x={-w / 2 - 2}
          y={-h / 2 - 2}
          width={w + 4}
          height={h + 4}
          fill="transparent"
          shadowColor="rgba(0,0,0,0.15)"
          shadowBlur={8}
          shadowOffsetY={3}
        />

        {/* Floor surface */}
        {shape === "circle" ? (
          <Circle radius={r} fill={fill} stroke={stroke} strokeWidth={isSelected ? 3 : 2} />
        ) : (
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
        )}

        {/* LED grid overlay */}
        {ledLines}

        {/* Sparkle pattern (simple dots) */}
        {hasLed &&
          Array.from({ length: 8 }).map((_, i) => (
            <Circle
              key={`spark-${i}`}
              x={(Math.random() - 0.5) * w * 0.7}
              y={(Math.random() - 0.5) * h * 0.7}
              radius={2}
              fill="#FFD700"
              opacity={0.4}
              listening={false}
            />
          ))}

        {/* Icon label */}
        <Text
          text="💃"
          fontSize={24}
          align="center"
          x={-12}
          y={-14}
          listening={false}
        />

        {/* Name */}
        <Text
          text={element.name || "רחבת ריקודים"}
          fontSize={10}
          fontFamily="Heebo, sans-serif"
          fill="#CCC"
          align="center"
          x={-40}
          y={16}
          width={80}
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
