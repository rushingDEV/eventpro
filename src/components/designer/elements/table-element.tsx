"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Circle, Rect, Text, Ring, Arc, Transformer } from "react-konva";
import { ChairShape } from "@/components/floor-plan/chair-shape";
import { getChairPositions } from "@/lib/floor-plan/chair-layout";
import type { DesignerElement, TableMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface TableElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

// Premium dark wood palette
const WOOD_BASE = "#3b2f1e";
const WOOD_VIP = "#2c2417";
const WOOD_ACCENT = "#5c4a32";

/**
 * Returns the capacity-ring color based on occupancy ratio.
 * Green < 50%, Amber 50-90%, Rose > 90%
 */
function getCapacityColor(ratio: number): string {
  if (ratio > 0.9) return "#e11d48"; // rose-600
  if (ratio >= 0.5) return "#f59e0b"; // amber-500
  return "#22c55e"; // green-500
}

export function TableElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: TableElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);

  const meta = element.metadata as unknown as TableMetadata;
  const shape = meta.tableShape || "ROUND";
  const capacity = meta.capacity || 8;
  const isVIP = meta.isVIP || false;
  const guestCount = (meta.guestIds || []).length;
  const tableNumber = meta.tableNumber || 0;
  const radius = meta.radius || 50;
  const isRound = shape === "ROUND" || shape === "OVAL";

  // --- Occupancy calculations ---
  const occupancy = guestCount / Math.max(capacity, 1);
  const occupancyAngle = Math.min(occupancy, 1) * 360;
  const capacityColor = getCapacityColor(occupancy);

  // --- Chair positions ---
  const chairs = getChairPositions(shape, capacity, radius, element.width, element.height);

  // --- Sizing helpers for rectangular tables ---
  const halfW = element.width / 2;
  const halfH = element.height / 2;

  // The "orbit radius" used for arcs and VIP sparkles on non-round tables
  const rectOrbitRadius = Math.max(halfW, halfH);

  // --- Shadow / glow ---
  const shadowBlur = hovered ? 15 : isSelected ? 10 : 6;
  const shadowColor = hovered
    ? "#e11d48"
    : isSelected
      ? "#6366f1"
      : "rgba(0,0,0,0.3)";

  // --- VIP sparkle positions (0, 90, 180, 270 degrees) ---
  const vipSparkleAngles = [0, 90, 180, 270];
  const vipRingOrbit = isRound ? radius + 18 : rectOrbitRadius + 18;

  // --- Transformer attachment ---
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // --- Handlers ---
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
      width: Math.max(40, element.width * scaleX),
      height: Math.max(40, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

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
        onMouseEnter={(e) => {
          setHovered(true);
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "pointer";
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
      >
        {/* ===================== SELECTION INDICATOR ===================== */}
        {isSelected && (
          isRound ? (
            <Ring
              innerRadius={radius + 8}
              outerRadius={radius + 14}
              fill="#6366f1"
              opacity={0.65}
            />
          ) : (
            <Rect
              x={-halfW - 10}
              y={-halfH - 10}
              width={element.width + 20}
              height={element.height + 20}
              cornerRadius={10}
              stroke="#6366f1"
              strokeWidth={3}
              dash={[6, 3]}
              fill="transparent"
              opacity={0.75}
            />
          )
        )}

        {/* ===================== VIP GOLD RING ===================== */}
        {isVIP && (
          <>
            {isRound ? (
              <Ring
                innerRadius={radius + 14}
                outerRadius={radius + 18}
                fill="#DAA520"
                opacity={0.85}
                shadowBlur={6}
                shadowColor="#DAA520"
                shadowOpacity={0.4}
              />
            ) : (
              <Rect
                x={-halfW - 16}
                y={-halfH - 16}
                width={element.width + 32}
                height={element.height + 32}
                cornerRadius={12}
                stroke="#DAA520"
                strokeWidth={3}
                fill="transparent"
                shadowBlur={6}
                shadowColor="#DAA520"
                shadowOpacity={0.4}
              />
            )}

            {/* Sparkle dots at 0, 90, 180, 270 degrees */}
            {vipSparkleAngles.map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <Circle
                  key={`sparkle-${angle}`}
                  x={Math.cos(rad) * vipRingOrbit}
                  y={Math.sin(rad) * vipRingOrbit}
                  radius={3}
                  fill="#FFD700"
                  shadowBlur={4}
                  shadowColor="#FFD700"
                  shadowOpacity={0.8}
                />
              );
            })}
          </>
        )}

        {/* ===================== CAPACITY RING (background track) ===================== */}
        {isRound ? (
          <Arc
            innerRadius={radius + 2}
            outerRadius={radius + 7}
            angle={360}
            rotation={-90}
            fill="#e5e7eb"
            opacity={0.25}
          />
        ) : (
          <Arc
            innerRadius={rectOrbitRadius + 2}
            outerRadius={rectOrbitRadius + 7}
            angle={360}
            rotation={-90}
            fill="#e5e7eb"
            opacity={0.2}
          />
        )}

        {/* ===================== CAPACITY RING (filled arc) ===================== */}
        {occupancyAngle > 0 && (
          isRound ? (
            <Arc
              innerRadius={radius + 2}
              outerRadius={radius + 7}
              angle={occupancyAngle}
              rotation={-90}
              fill={capacityColor}
              opacity={0.9}
            />
          ) : (
            <Arc
              innerRadius={rectOrbitRadius + 2}
              outerRadius={rectOrbitRadius + 7}
              angle={occupancyAngle}
              rotation={-90}
              fill={capacityColor}
              opacity={0.8}
            />
          )
        )}

        {/* ===================== TABLE SURFACE ===================== */}
        {isRound ? (
          <Circle
            radius={radius}
            fill={isVIP ? WOOD_VIP : WOOD_BASE}
            stroke={isVIP ? "#DAA520" : WOOD_ACCENT}
            strokeWidth={isVIP ? 2 : 1.5}
            shadowBlur={shadowBlur}
            shadowColor={shadowColor}
            shadowOpacity={0.6}
            shadowOffsetY={2}
          />
        ) : (
          <Rect
            x={-halfW}
            y={-halfH}
            width={element.width}
            height={element.height}
            cornerRadius={8}
            fill={isVIP ? WOOD_VIP : WOOD_BASE}
            stroke={isVIP ? "#DAA520" : WOOD_ACCENT}
            strokeWidth={isVIP ? 2 : 1.5}
            shadowBlur={shadowBlur}
            shadowColor={shadowColor}
            shadowOpacity={0.6}
            shadowOffsetY={2}
          />
        )}

        {/* Decorative inner ring for round tables */}
        {isRound && (
          <Circle
            radius={radius - 6}
            stroke={isVIP ? "rgba(218,165,32,0.3)" : "rgba(92,74,50,0.25)"}
            strokeWidth={0.5}
            listening={false}
          />
        )}

        {/* ===================== TABLE NUMBER (centered, white, shadow) ===================== */}
        <Text
          text={String(tableNumber)}
          fontSize={isRound ? 22 : 18}
          fontFamily="Inter, Heebo, system-ui, sans-serif"
          fontStyle="bold"
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          x={isRound ? -radius : -halfW}
          y={-12}
          width={isRound ? radius * 2 : element.width}
          height={24}
          shadowColor="#000000"
          shadowBlur={3}
          shadowOpacity={0.5}
          shadowOffsetY={1}
          listening={false}
        />

        {/* Occupancy count beneath table number */}
        <Text
          text={`${guestCount}/${capacity}`}
          fontSize={10}
          fontFamily="Inter, Heebo, system-ui, sans-serif"
          fill="#d1d5db"
          align="center"
          verticalAlign="middle"
          x={isRound ? -radius : -halfW}
          y={12}
          width={isRound ? radius * 2 : element.width}
          height={14}
          shadowColor="#000000"
          shadowBlur={2}
          shadowOpacity={0.3}
          listening={false}
        />

        {/* ===================== CHAIRS ===================== */}
        {chairs.map((chair, idx) => (
          <ChairShape
            key={idx}
            x={chair.x}
            y={chair.y}
            angle={chair.angle}
            isOccupied={idx < guestCount}
            guestInitials={undefined}
            groupColor={undefined}
          />
        ))}

        {/* Name label below the table */}
        {element.name && (
          <Text
            text={element.name}
            fontSize={9}
            fontFamily="Inter, Heebo, system-ui, sans-serif"
            fill="#D7CCC8"
            align="center"
            x={-30}
            y={isRound ? radius + 22 : halfH + 22}
            width={60}
            listening={false}
          />
        )}
      </Group>

      {/* ===================== TRANSFORMER ===================== */}
      {isSelected && !element.locked && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
          boundBoxFunc={(_, newBox) => {
            const minSize = 40;
            return {
              ...newBox,
              width: Math.max(minSize, newBox.width),
              height: Math.max(minSize, newBox.height),
            };
          }}
          borderStroke="#6366f1"
          borderStrokeWidth={2}
          anchorStroke="#6366f1"
          anchorFill="#ffffff"
          anchorSize={8}
          anchorCornerRadius={2}
          rotateAnchorOffset={20}
        />
      )}
    </>
  );
}
