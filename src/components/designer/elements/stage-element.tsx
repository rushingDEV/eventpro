"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Rect, Circle, Text, Line, Transformer } from "react-konva";
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
  const [hovered, setHovered] = useState(false);
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
  const label = element.name || (isChuppah ? "חופה" : "במה");
  const shadowBlur = hovered ? 16 : 8;

  // 3D elevation depth for stage (not chuppah)
  const elevationDepth = 12;

  // Step configuration for stage
  const stepCount = 3;
  const stepHeight = 5;
  const stepWidthGrow = 8; // each step extends this much wider on each side

  // Chuppah pole positions (inset from corners)
  const poleInset = 6;
  const poleRadius = 4;

  // Flower accent colors for chuppah
  const flowerColors = ["#F8B4C8", "#FADAC1", "#FFF5E1", "#E8C6D0"];

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
        {/* === STAGE (non-chuppah) rendering === */}
        {!isChuppah && (
          <>
            {/* Shadow / glow */}
            <Rect
              x={-w / 2 + 3}
              y={-h / 2 + 5}
              width={w}
              height={h}
              fill="transparent"
              shadowColor={hovered ? "rgba(245,208,169,0.3)" : "rgba(0,0,0,0.2)"}
              shadowBlur={shadowBlur}
              shadowOffsetY={3}
              listening={false}
            />

            {/* 3D side face (darker area below stage) */}
            <Line
              points={[
                -w / 2, h / 2,                           // bottom-left of top face
                -w / 2 + 4, h / 2 + elevationDepth,      // bottom-left of side face
                w / 2 - 4, h / 2 + elevationDepth,        // bottom-right of side face
                w / 2, h / 2,                              // bottom-right of top face
              ]}
              closed
              fill="#2E2E2E"
              stroke="#222"
              strokeWidth={1}
              listening={false}
            />

            {/* Stage top surface */}
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

            {/* Subtle surface texture lines */}
            <Rect
              x={-w / 2 + 4}
              y={-h / 2 + 4}
              width={w - 8}
              height={h - 8}
              fill="transparent"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
              cornerRadius={2}
              listening={false}
            />

            {/* Steps below the stage */}
            {hasSteps &&
              Array.from({ length: stepCount }).map((_, i) => {
                const sw = w + (i + 1) * stepWidthGrow * 2;
                const sy = h / 2 + elevationDepth + i * stepHeight;
                const baseLightness = 60;
                const lighten = i * 12;
                const stepFill = `rgb(${baseLightness + lighten}, ${baseLightness + lighten}, ${baseLightness + lighten})`;
                return (
                  <Rect
                    key={`step-${i}`}
                    x={-sw / 2}
                    y={sy}
                    width={sw}
                    height={stepHeight}
                    fill={stepFill}
                    stroke="#444"
                    strokeWidth={0.5}
                    cornerRadius={[0, 0, i === stepCount - 1 ? 3 : 0, i === stepCount - 1 ? 3 : 0]}
                    listening={false}
                  />
                );
              })}

            {/* Stage label (replaces emoji) */}
            <Text
              text={label}
              fontSize={13}
              fontStyle="bold"
              fontFamily="Heebo, Arial, sans-serif"
              fill="#CCC"
              align="center"
              x={-w / 2}
              y={-8}
              width={w}
              listening={false}
            />
          </>
        )}

        {/* === CHUPPAH rendering === */}
        {isChuppah && (
          <>
            {/* Shadow */}
            <Rect
              x={-w / 2 + 2}
              y={-h / 2 + 3}
              width={w}
              height={h}
              fill="transparent"
              shadowColor={hovered ? "rgba(200,168,130,0.35)" : "rgba(0,0,0,0.15)"}
              shadowBlur={shadowBlur}
              shadowOffsetY={2}
              listening={false}
            />

            {/* Chuppah base platform */}
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

            {/* Decorative inner border (dashed) */}
            <Rect
              x={-w / 2 + 5}
              y={-h / 2 + 5}
              width={w - 10}
              height={h - 10}
              fill="transparent"
              stroke="#D4A574"
              strokeWidth={1}
              dash={[6, 3]}
              cornerRadius={3}
              listening={false}
            />

            {/* Draped fabric lines — top edge */}
            <Line
              points={[
                -w / 2 + poleInset, -h / 2 + poleInset,
                0, -h / 2 + poleInset + 8,
                w / 2 - poleInset, -h / 2 + poleInset,
              ]}
              stroke="#D4A574"
              strokeWidth={1.5}
              tension={0.3}
              opacity={0.7}
              listening={false}
            />

            {/* Draped fabric lines — bottom edge */}
            <Line
              points={[
                -w / 2 + poleInset, h / 2 - poleInset,
                0, h / 2 - poleInset - 8,
                w / 2 - poleInset, h / 2 - poleInset,
              ]}
              stroke="#D4A574"
              strokeWidth={1.5}
              tension={0.3}
              opacity={0.7}
              listening={false}
            />

            {/* Draped fabric lines — left edge */}
            <Line
              points={[
                -w / 2 + poleInset, -h / 2 + poleInset,
                -w / 2 + poleInset + 8, 0,
                -w / 2 + poleInset, h / 2 - poleInset,
              ]}
              stroke="#D4A574"
              strokeWidth={1.5}
              tension={0.3}
              opacity={0.6}
              listening={false}
            />

            {/* Draped fabric lines — right edge */}
            <Line
              points={[
                w / 2 - poleInset, -h / 2 + poleInset,
                w / 2 - poleInset - 8, 0,
                w / 2 - poleInset, h / 2 - poleInset,
              ]}
              stroke="#D4A574"
              strokeWidth={1.5}
              tension={0.3}
              opacity={0.6}
              listening={false}
            />

            {/* Corner poles */}
            <Circle x={-w / 2 + poleInset} y={-h / 2 + poleInset} radius={poleRadius} fill="#C8A882" stroke="#A67C52" strokeWidth={1} listening={false} />
            <Circle x={w / 2 - poleInset} y={-h / 2 + poleInset} radius={poleRadius} fill="#C8A882" stroke="#A67C52" strokeWidth={1} listening={false} />
            <Circle x={-w / 2 + poleInset} y={h / 2 - poleInset} radius={poleRadius} fill="#C8A882" stroke="#A67C52" strokeWidth={1} listening={false} />
            <Circle x={w / 2 - poleInset} y={h / 2 - poleInset} radius={poleRadius} fill="#C8A882" stroke="#A67C52" strokeWidth={1} listening={false} />

            {/* Flower accents at each corner */}
            {[
              { cx: -w / 2 + poleInset, cy: -h / 2 + poleInset },
              { cx: w / 2 - poleInset, cy: -h / 2 + poleInset },
              { cx: -w / 2 + poleInset, cy: h / 2 - poleInset },
              { cx: w / 2 - poleInset, cy: h / 2 - poleInset },
            ].map((pos, cornerIdx) => (
              <Group key={`flowers-${cornerIdx}`} listening={false}>
                <Circle x={pos.cx - 5} y={pos.cy - 5} radius={2.5} fill={flowerColors[0]} opacity={0.8} listening={false} />
                <Circle x={pos.cx + 5} y={pos.cy - 4} radius={2} fill={flowerColors[1]} opacity={0.75} listening={false} />
                <Circle x={pos.cx - 4} y={pos.cy + 5} radius={2} fill={flowerColors[2]} opacity={0.7} listening={false} />
                <Circle x={pos.cx + 4} y={pos.cy + 4} radius={2.5} fill={flowerColors[3]} opacity={0.8} listening={false} />
              </Group>
            ))}

            {/* Chuppah label (replaces emoji) */}
            <Text
              text={label}
              fontSize={13}
              fontStyle="bold"
              fontFamily="Heebo, Arial, sans-serif"
              fill="#8B6F47"
              align="center"
              x={-w / 2}
              y={-8}
              width={w}
              listening={false}
            />
          </>
        )}
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
