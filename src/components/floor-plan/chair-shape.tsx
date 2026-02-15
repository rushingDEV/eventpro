"use client";

import { Group, Circle, Text } from "react-konva";

interface ChairShapeProps {
  x: number;
  y: number;
  angle: number;
  isOccupied: boolean;
  guestInitials?: string;
  groupColor?: string;
  isHighlighted?: boolean;
}

const CHAIR_RADIUS = 10;

export function ChairShape({
  x,
  y,
  angle,
  isOccupied,
  guestInitials,
  groupColor,
  isHighlighted,
}: ChairShapeProps) {
  const fill = isOccupied
    ? groupColor || "#8B6F47"
    : "#E8E0D4";
  const stroke = isHighlighted
    ? "#3B82F6"
    : isOccupied
      ? "#6D4C41"
      : "#C4B8A8";

  return (
    <Group x={x} y={y} rotation={angle}>
      {/* Chair circle */}
      <Circle
        radius={CHAIR_RADIUS}
        fill={fill}
        stroke={stroke}
        strokeWidth={isHighlighted ? 2 : 1}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={3}
        shadowOffsetY={1}
      />
      {/* Guest initials */}
      {isOccupied && guestInitials && (
        <Text
          text={guestInitials}
          fontSize={8}
          fontFamily="Heebo, sans-serif"
          fontStyle="bold"
          fill="#FFFFFF"
          align="center"
          verticalAlign="middle"
          x={-CHAIR_RADIUS}
          y={-5}
          width={CHAIR_RADIUS * 2}
          rotation={-angle}
          listening={false}
        />
      )}
    </Group>
  );
}
