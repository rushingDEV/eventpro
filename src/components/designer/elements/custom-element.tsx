"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Rect, Circle, Text, Transformer } from "react-konva";
import type { DesignerElement } from "@/lib/designer/types";
import type Konva from "konva";

interface CustomElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

export function CustomElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: CustomElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);
  const customShape = (element.metadata.customShape as string) || "rect";

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

  const w = element.width;
  const h = element.height;
  const r = Math.min(w, h) / 2;
  const fill = element.style.fill || "#E8E0D4";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#B0A090";
  const innerStroke = isSelected ? "#E8D5C0" : "#C8BAA8";

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
        {customShape === "circle" ? (
          <>
            {/* Main shape */}
            <Circle
              radius={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSelected ? 3 : 1.5}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={hovered ? 8 : 4}
              shadowOffsetY={2}
            />
            {/* Inner border for visual depth */}
            <Circle
              radius={r - 3}
              fill="transparent"
              stroke={innerStroke}
              strokeWidth={0.8}
              opacity={0.5}
              listening={false}
            />
          </>
        ) : (
          <>
            {/* Main shape */}
            <Rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSelected ? 3 : 1.5}
              cornerRadius={4}
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={hovered ? 8 : 4}
              shadowOffsetY={2}
            />
            {/* Inner border for visual depth */}
            <Rect
              x={-w / 2 + 3}
              y={-h / 2 + 3}
              width={w - 6}
              height={h - 6}
              fill="transparent"
              stroke={innerStroke}
              strokeWidth={0.8}
              cornerRadius={2}
              opacity={0.5}
              listening={false}
            />
          </>
        )}

        {/* Label */}
        <Text
          text={element.name || "אלמנט"}
          fontSize={10}
          fontFamily="Heebo, sans-serif"
          fill="#666"
          align="center"
          x={-30}
          y={-6}
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
            width: Math.max(20, newBox.width),
            height: Math.max(20, newBox.height),
          })}
        />
      )}
    </>
  );
}
