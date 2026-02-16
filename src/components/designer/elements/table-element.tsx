"use client";

import { useRef, useEffect, useCallback } from "react";
import { Group, Circle, Rect, Text, Ring, Transformer } from "react-konva";
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

const WOOD_LIGHT = "#8B7355";
const WOOD_MID = "#6D4C41";
const WOOD_DARK = "#5D4037";

function getTableFill(guestCount: number, capacity: number, isVIP: boolean): string {
  if (isVIP) return "#5C4033";
  if (guestCount === 0) return WOOD_LIGHT;
  const rate = guestCount / capacity;
  if (rate >= 0.9) return WOOD_DARK;
  if (rate >= 0.5) return WOOD_MID;
  return WOOD_LIGHT;
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
  const meta = element.metadata as unknown as TableMetadata;
  const shape = meta.tableShape || "ROUND";
  const capacity = meta.capacity || 8;
  const isVIP = meta.isVIP || false;
  const guestCount = (meta.guestIds || []).length;
  const tableNumber = meta.tableNumber || 0;
  const radius = meta.radius || 50;
  const isRound = shape === "ROUND" || shape === "OVAL";

  const fill = getTableFill(guestCount, capacity, isVIP);
  const stroke = isSelected ? "#F5D0A9" : isVIP ? "#DAA520" : element.locked ? "#9E9E9E" : "#5D4037";
  const strokeWidth = isSelected ? 3 : 2;

  const chairs = getChairPositions(shape, capacity, radius, element.width, element.height);

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
      >
        {/* Shadow */}
        {isRound ? (
          <Circle
            radius={radius + 2}
            fill="transparent"
            shadowColor="rgba(0,0,0,0.25)"
            shadowBlur={12}
            shadowOffsetY={4}
          />
        ) : (
          <Rect
            x={-element.width / 2 - 2}
            y={-element.height / 2 - 2}
            width={element.width + 4}
            height={element.height + 4}
            fill="transparent"
            shadowColor="rgba(0,0,0,0.25)"
            shadowBlur={12}
            shadowOffsetY={4}
            cornerRadius={10}
          />
        )}

        {/* Table surface */}
        {isRound ? (
          <Circle radius={radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        ) : (
          <Rect
            x={-element.width / 2}
            y={-element.height / 2}
            width={element.width}
            height={element.height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            cornerRadius={8}
          />
        )}

        {/* Inner ring (wood grain) */}
        {isRound && (
          <Ring innerRadius={radius * 0.35} outerRadius={radius * 0.38} fill="#5D4037" opacity={0.2} />
        )}

        {/* Selection ring */}
        {isSelected && isRound && (
          <Ring innerRadius={radius + 4} outerRadius={radius + 7} fill="#F5D0A9" opacity={0.6} />
        )}

        {/* Chairs */}
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

        {/* Table number */}
        <Text
          text={String(tableNumber)}
          fontSize={isRound ? 20 : 16}
          fontFamily="Heebo, sans-serif"
          fontStyle="bold"
          fill="#FAF8F5"
          align="center"
          verticalAlign="middle"
          x={-15}
          y={-16}
          width={30}
          listening={false}
        />

        {/* Occupancy */}
        <Text
          text={`${guestCount}/${capacity}`}
          fontSize={10}
          fontFamily="Heebo, sans-serif"
          fill="#D7CCC8"
          align="center"
          x={-20}
          y={6}
          width={40}
          listening={false}
        />

        {/* Name label */}
        {element.name && (
          <Text
            text={element.name}
            fontSize={9}
            fontFamily="Heebo, sans-serif"
            fill="#D7CCC8"
            align="center"
            x={-30}
            y={isRound ? radius + 22 : element.height / 2 + 22}
            width={60}
            listening={false}
          />
        )}

        {/* VIP */}
        {isVIP && (
          <Text
            text="★"
            fontSize={14}
            fill="#DAA520"
            align="center"
            x={-7}
            y={isRound ? -radius - 18 : -element.height / 2 - 18}
            width={14}
            listening={false}
          />
        )}
      </Group>

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
        />
      )}
    </>
  );
}
