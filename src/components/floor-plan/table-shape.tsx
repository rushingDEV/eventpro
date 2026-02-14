"use client";

import { Group, Circle, Rect, Text } from "react-konva";

interface TableShapeProps {
  id: string;
  number: number;
  name: string | null;
  shape: string;
  capacity: number;
  posX: number;
  posY: number;
  rotation: number;
  width?: number | null;
  height?: number | null;
  radius?: number | null;
  guestCount: number;
  isSelected: boolean;
  isLocked: boolean;
  isVIP: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

function getFillColor(guestCount: number, capacity: number): string {
  if (guestCount === 0) return "#f3f4f6";
  const rate = guestCount / capacity;
  if (rate >= 0.9) return "#bbf7d0"; // green
  if (rate >= 0.7) return "#fef08a"; // yellow
  return "#fecaca"; // red
}

function getStrokeColor(
  isSelected: boolean,
  isVIP: boolean,
  isLocked: boolean
): string {
  if (isSelected) return "#3b82f6";
  if (isVIP) return "#eab308";
  if (isLocked) return "#6b7280";
  return "#d1d5db";
}

export function TableShape({
  id,
  number,
  name,
  shape,
  capacity,
  posX,
  posY,
  rotation,
  width,
  height,
  radius,
  guestCount,
  isSelected,
  isLocked,
  isVIP,
  onSelect,
  onDragEnd,
}: TableShapeProps) {
  const fill = getFillColor(guestCount, capacity);
  const stroke = getStrokeColor(isSelected, isVIP, isLocked);
  const tableRadius = radius || 50;
  const tableWidth = width || 120;
  const tableHeight = height || 60;

  return (
    <Group
      x={posX}
      y={posY}
      rotation={rotation}
      draggable={!isLocked}
      onClick={() => onSelect(id)}
      onTap={() => onSelect(id)}
      onDragEnd={(e) => {
        onDragEnd(id, e.target.x(), e.target.y());
      }}
    >
      {shape === "ROUND" || shape === "OVAL" ? (
        <Circle
          radius={tableRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 3 : 2}
        />
      ) : (
        <Rect
          x={-tableWidth / 2}
          y={-tableHeight / 2}
          width={tableWidth}
          height={tableHeight}
          fill={fill}
          stroke={stroke}
          strokeWidth={isSelected ? 3 : 2}
          cornerRadius={8}
        />
      )}

      {/* Table number */}
      <Text
        text={String(number)}
        fontSize={18}
        fontFamily="Heebo"
        fontStyle="bold"
        fill="#374151"
        align="center"
        verticalAlign="middle"
        x={-15}
        y={-12}
        width={30}
      />

      {/* Guest count */}
      <Text
        text={`${guestCount}/${capacity}`}
        fontSize={11}
        fontFamily="Heebo"
        fill="#6b7280"
        align="center"
        x={-20}
        y={10}
        width={40}
      />

      {/* VIP indicator */}
      {isVIP && (
        <Text
          text="VIP"
          fontSize={9}
          fontFamily="Heebo"
          fontStyle="bold"
          fill="#eab308"
          align="center"
          x={-12}
          y={-30}
          width={24}
        />
      )}

      {/* Lock indicator */}
      {isLocked && (
        <Text
          text="🔒"
          fontSize={10}
          x={tableRadius ? tableRadius - 15 : tableWidth / 2 - 15}
          y={-(tableRadius || tableHeight / 2) - 5}
        />
      )}
    </Group>
  );
}
