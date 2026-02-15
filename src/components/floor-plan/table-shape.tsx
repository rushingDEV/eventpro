"use client";

import { useRef, useEffect } from "react";
import { Group, Circle, Rect, Text, Ring } from "react-konva";
import { ChairShape } from "./chair-shape";
import { getChairPositions } from "@/lib/floor-plan/chair-layout";
import type Konva from "konva";

interface GuestData {
  id: string;
  firstName: string;
  lastName: string | null;
  seatNumber?: number | null;
  group?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

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
  guests: GuestData[];
  isSelected: boolean;
  isLocked: boolean;
  isVIP: boolean;
  isDropTarget?: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

// Wood-grain gradient colors
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

function getStroke(isSelected: boolean, isVIP: boolean, isLocked: boolean, isDropTarget: boolean): string {
  if (isDropTarget) return "#22C55E";
  if (isSelected) return "#F5D0A9";
  if (isVIP) return "#DAA520";
  if (isLocked) return "#9E9E9E";
  return "#5D4037";
}

function getInitials(firstName: string, lastName: string | null): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return first + last;
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
  guests,
  isSelected,
  isLocked,
  isVIP,
  isDropTarget = false,
  onSelect,
  onDragEnd,
}: TableShapeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const guestCount = guests.length;
  const fill = getTableFill(guestCount, capacity, isVIP);
  const stroke = getStroke(isSelected, isVIP, isLocked, isDropTarget);
  const strokeWidth = isSelected || isDropTarget ? 3 : 2;
  const tableRadius = radius || 50;
  const tableWidth = width || (shape === "LONG" ? 200 : 120);
  const tableHeight = height || (shape === "LONG" ? 50 : 60);
  const isRound = shape === "ROUND" || shape === "OVAL";

  // Chair positions
  const chairs = getChairPositions(shape, capacity, radius, width, height);

  // Hover animation
  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    const handleEnter = () => {
      node.to({ scaleX: 1.05, scaleY: 1.05, duration: 0.15 });
    };
    const handleLeave = () => {
      node.to({ scaleX: 1, scaleY: 1, duration: 0.15 });
    };

    node.on("mouseenter", handleEnter);
    node.on("mouseleave", handleLeave);
    return () => {
      node.off("mouseenter", handleEnter);
      node.off("mouseleave", handleLeave);
    };
  }, []);

  // Drop target glow animation
  useEffect(() => {
    const node = groupRef.current;
    if (!node || !isDropTarget) return;
    node.to({ scaleX: 1.08, scaleY: 1.08, duration: 0.2 });
    return () => {
      node.to({ scaleX: 1, scaleY: 1, duration: 0.15 });
    };
  }, [isDropTarget]);

  return (
    <Group
      ref={groupRef}
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
      {/* Shadow */}
      {isRound ? (
        <Circle
          radius={tableRadius + 2}
          fill="transparent"
          shadowColor="rgba(0,0,0,0.25)"
          shadowBlur={12}
          shadowOffsetY={4}
        />
      ) : (
        <Rect
          x={-tableWidth / 2 - 2}
          y={-tableHeight / 2 - 2}
          width={tableWidth + 4}
          height={tableHeight + 4}
          fill="transparent"
          shadowColor="rgba(0,0,0,0.25)"
          shadowBlur={12}
          shadowOffsetY={4}
          cornerRadius={10}
        />
      )}

      {/* Table surface */}
      {isRound ? (
        <Circle
          radius={tableRadius}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ) : (
        <Rect
          x={-tableWidth / 2}
          y={-tableHeight / 2}
          width={tableWidth}
          height={tableHeight}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={8}
        />
      )}

      {/* Inner ring for round tables (wood grain effect) */}
      {isRound && (
        <Ring
          innerRadius={tableRadius * 0.35}
          outerRadius={tableRadius * 0.38}
          fill="#5D4037"
          opacity={0.2}
        />
      )}

      {/* Selection ring */}
      {isSelected && isRound && (
        <Ring
          innerRadius={tableRadius + 4}
          outerRadius={tableRadius + 7}
          fill="#F5D0A9"
          opacity={0.6}
          dash={[6, 4]}
        />
      )}

      {/* Chairs */}
      {chairs.map((chair, idx) => {
        const guest = guests[idx];
        return (
          <ChairShape
            key={idx}
            x={chair.x}
            y={chair.y}
            angle={chair.angle}
            isOccupied={!!guest}
            guestInitials={guest ? getInitials(guest.firstName, guest.lastName) : undefined}
            groupColor={guest?.group?.color}
          />
        );
      })}

      {/* Table number */}
      <Text
        text={String(number)}
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

      {/* Occupancy count */}
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

      {/* Table name */}
      {name && (
        <Text
          text={name}
          fontSize={9}
          fontFamily="Heebo, sans-serif"
          fill="#D7CCC8"
          align="center"
          x={-30}
          y={isRound ? tableRadius + 22 : tableHeight / 2 + 22}
          width={60}
          listening={false}
        />
      )}

      {/* VIP crown */}
      {isVIP && (
        <Text
          text="★"
          fontSize={14}
          fill="#DAA520"
          align="center"
          x={-7}
          y={isRound ? -tableRadius - 18 : -tableHeight / 2 - 18}
          width={14}
          listening={false}
        />
      )}

      {/* Lock indicator */}
      {isLocked && (
        <Text
          text="🔒"
          fontSize={10}
          x={isRound ? tableRadius - 5 : tableWidth / 2 - 5}
          y={isRound ? -tableRadius - 8 : -tableHeight / 2 - 8}
          listening={false}
        />
      )}

      {/* Drop target indicator */}
      {isDropTarget && isRound && (
        <Ring
          innerRadius={tableRadius + 6}
          outerRadius={tableRadius + 10}
          fill="#22C55E"
          opacity={0.4}
        />
      )}
    </Group>
  );
}
