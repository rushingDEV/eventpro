"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Group, Rect, Circle, Line, Text, Transformer } from "react-konva";
import type { DesignerElement, FurnitureMetadata } from "@/lib/designer/types";
import type Konva from "konva";

interface FurnitureElementProps {
  element: DesignerElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void;
}

const FURNITURE_LABELS: Record<string, string> = {
  armchair: "כורסה",
  sofa: "ספה",
  "side-table": "שולחן צד",
  "lounge-set": "לאונג׳",
  "cake-table": "שולחן עוגה",
  "gift-table": "שולחן מתנות",
  other: "ריהוט",
};

function ArmchairShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  const seatW = w * 0.6;
  const seatH = h * 0.65;
  const armW = w * 0.15;
  const armH = h * 0.5;
  const darkerFill = "#8B7355";
  return (
    <>
      {/* Main seat */}
      <Rect
        x={-seatW / 2}
        y={-seatH / 2}
        width={seatW}
        height={seatH}
        fill={fill}
        cornerRadius={4}
        listening={false}
      />
      {/* Left armrest */}
      <Rect
        x={-seatW / 2 - armW}
        y={-armH / 2}
        width={armW}
        height={armH}
        fill={darkerFill}
        cornerRadius={3}
        listening={false}
      />
      {/* Right armrest */}
      <Rect
        x={seatW / 2}
        y={-armH / 2}
        width={armW}
        height={armH}
        fill={darkerFill}
        cornerRadius={3}
        listening={false}
      />
      {/* Back cushion */}
      <Rect
        x={-seatW / 2 + 2}
        y={-seatH / 2 + 2}
        width={seatW - 4}
        height={seatH * 0.35}
        fill="#B8956A"
        cornerRadius={3}
        opacity={0.5}
        listening={false}
      />
    </>
  );
}

function SofaShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  const seatW = w * 0.78;
  const seatH = h * 0.65;
  const armW = w * 0.1;
  const armH = h * 0.55;
  const darkerFill = "#8B7355";
  return (
    <>
      {/* Main seat */}
      <Rect
        x={-seatW / 2}
        y={-seatH / 2}
        width={seatW}
        height={seatH}
        fill={fill}
        cornerRadius={6}
        listening={false}
      />
      {/* Left armrest */}
      <Rect
        x={-seatW / 2 - armW}
        y={-armH / 2}
        width={armW}
        height={armH}
        fill={darkerFill}
        cornerRadius={4}
        listening={false}
      />
      {/* Right armrest */}
      <Rect
        x={seatW / 2}
        y={-armH / 2}
        width={armW}
        height={armH}
        fill={darkerFill}
        cornerRadius={4}
        listening={false}
      />
      {/* Back cushion line */}
      <Line
        points={[-seatW / 2 + 4, -seatH / 2 + seatH * 0.3, seatW / 2 - 4, -seatH / 2 + seatH * 0.3]}
        stroke="#B8956A"
        strokeWidth={1.5}
        opacity={0.6}
        listening={false}
      />
      {/* Seat cushion divider */}
      <Line
        points={[0, -seatH / 2 + seatH * 0.3, 0, seatH / 2 - 3]}
        stroke="#B8956A"
        strokeWidth={1}
        opacity={0.4}
        listening={false}
      />
    </>
  );
}

function SideTableShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  const outerR = Math.min(w, h) / 2;
  const innerR = outerR * 0.55;
  return (
    <>
      {/* Outer circle */}
      <Circle radius={outerR} fill={fill} listening={false} />
      {/* Decorative inner ring */}
      <Circle
        radius={innerR}
        fill="transparent"
        stroke="#C4A882"
        strokeWidth={1.5}
        opacity={0.6}
        listening={false}
      />
    </>
  );
}

function LoungeSetShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  const darkerFill = "#8B7355";
  // L-shaped arrangement: horizontal piece + vertical piece
  const horzW = w * 0.75;
  const horzH = h * 0.35;
  const vertW = w * 0.35;
  const vertH = h * 0.6;
  return (
    <>
      {/* Horizontal piece */}
      <Rect
        x={-w / 2 + w * 0.05}
        y={h / 2 - horzH - h * 0.05}
        width={horzW}
        height={horzH}
        fill={fill}
        cornerRadius={5}
        listening={false}
      />
      {/* Vertical piece */}
      <Rect
        x={-w / 2 + w * 0.05}
        y={-h / 2 + h * 0.05}
        width={vertW}
        height={vertH}
        fill={fill}
        cornerRadius={5}
        listening={false}
      />
      {/* Corner cushion accent */}
      <Rect
        x={-w / 2 + w * 0.08}
        y={h / 2 - horzH - h * 0.02}
        width={vertW - w * 0.06}
        height={horzH * 0.6}
        fill={darkerFill}
        cornerRadius={3}
        opacity={0.4}
        listening={false}
      />
    </>
  );
}

function CakeTableShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  // Table top
  const tableW = w * 0.8;
  const tableH = h * 0.35;
  // Tiered cake
  const tier1W = w * 0.38;
  const tier1H = h * 0.14;
  const tier2W = w * 0.28;
  const tier2H = h * 0.12;
  const tier3W = w * 0.18;
  const tier3H = h * 0.1;
  const cakeBaseY = -h * 0.05 - tableH / 2;
  return (
    <>
      {/* Table surface */}
      <Rect
        x={-tableW / 2}
        y={-tableH / 2}
        width={tableW}
        height={tableH}
        fill={fill}
        cornerRadius={3}
        listening={false}
      />
      {/* Tier 1 (bottom) */}
      <Rect
        x={-tier1W / 2}
        y={cakeBaseY - tier1H}
        width={tier1W}
        height={tier1H}
        fill="#FFF0F0"
        stroke="#E8C4C4"
        strokeWidth={0.8}
        cornerRadius={2}
        listening={false}
      />
      {/* Tier 2 (middle) */}
      <Rect
        x={-tier2W / 2}
        y={cakeBaseY - tier1H - tier2H}
        width={tier2W}
        height={tier2H}
        fill="#FFF5F5"
        stroke="#E8C4C4"
        strokeWidth={0.8}
        cornerRadius={2}
        listening={false}
      />
      {/* Tier 3 (top) */}
      <Rect
        x={-tier3W / 2}
        y={cakeBaseY - tier1H - tier2H - tier3H}
        width={tier3W}
        height={tier3H}
        fill="#FFFAFA"
        stroke="#E8C4C4"
        strokeWidth={0.8}
        cornerRadius={2}
        listening={false}
      />
    </>
  );
}

function GiftTableShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  const tableW = w * 0.8;
  const tableH = h * 0.35;
  const bowCenterY = -tableH / 2 - h * 0.08;
  const bowSize = w * 0.1;
  return (
    <>
      {/* Table surface */}
      <Rect
        x={-tableW / 2}
        y={-tableH / 2}
        width={tableW}
        height={tableH}
        fill={fill}
        cornerRadius={3}
        listening={false}
      />
      {/* Gift box */}
      <Rect
        x={-w * 0.15}
        y={-tableH / 2 - h * 0.25}
        width={w * 0.3}
        height={h * 0.2}
        fill="#E8D5E0"
        stroke="#C4A0B8"
        strokeWidth={0.8}
        cornerRadius={2}
        listening={false}
      />
      {/* Ribbon vertical */}
      <Line
        points={[0, -tableH / 2 - h * 0.25, 0, -tableH / 2 - h * 0.05]}
        stroke="#D4A0C0"
        strokeWidth={1.5}
        listening={false}
      />
      {/* Bow left triangle */}
      <Line
        points={[0, bowCenterY, -bowSize, bowCenterY - bowSize * 0.7, -bowSize * 0.2, bowCenterY]}
        fill="#D4A0C0"
        closed
        listening={false}
      />
      {/* Bow right triangle */}
      <Line
        points={[0, bowCenterY, bowSize, bowCenterY - bowSize * 0.7, bowSize * 0.2, bowCenterY]}
        fill="#D4A0C0"
        closed
        listening={false}
      />
    </>
  );
}

function OtherFurnitureShape({ w, h, fill }: { w: number; h: number; fill: string }) {
  return (
    <Rect
      x={-w * 0.35}
      y={-h * 0.35}
      width={w * 0.7}
      height={h * 0.7}
      fill={fill}
      cornerRadius={4}
      listening={false}
    />
  );
}

export function FurnitureElement({
  element,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: FurnitureElementProps) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);
  const meta = element.metadata as unknown as FurnitureMetadata;
  const furnitureType = meta.furnitureType || "other";

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
      width: Math.max(25, element.width * scaleX),
      height: Math.max(25, element.height * scaleY),
      rotation: node.rotation(),
    });
  }, [element.id, element.width, element.height, onTransformEnd]);

  const w = element.width;
  const h = element.height;
  const fill = element.style.fill || "#A0845C";
  const stroke = isSelected ? "#F5D0A9" : element.style.stroke || "#7C6548";
  const label = element.name || FURNITURE_LABELS[furnitureType] || "ריהוט";

  const isRound = furnitureType === "side-table";

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
        {isRound ? (
          <Circle
            radius={Math.min(w, h) / 2}
            fill="transparent"
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={hovered ? 10 : 6}
            shadowOffsetY={2}
          />
        ) : (
          <Rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill="transparent"
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={hovered ? 10 : 6}
            shadowOffsetY={2}
          />
        )}

        {/* Outer shape / background */}
        {isRound ? (
          <Circle
            radius={Math.min(w, h) / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 1.5}
          />
        ) : (
          <Rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 3 : 1.5}
            cornerRadius={
              furnitureType === "sofa" || furnitureType === "lounge-set" ? 12 : 6
            }
          />
        )}

        {/* Drawn furniture shape based on type */}
        {furnitureType === "armchair" && <ArmchairShape w={w} h={h} fill={fill} />}
        {furnitureType === "sofa" && <SofaShape w={w} h={h} fill={fill} />}
        {furnitureType === "side-table" && <SideTableShape w={w} h={h} fill={fill} />}
        {furnitureType === "lounge-set" && <LoungeSetShape w={w} h={h} fill={fill} />}
        {furnitureType === "cake-table" && <CakeTableShape w={w} h={h} fill={fill} />}
        {furnitureType === "gift-table" && <GiftTableShape w={w} h={h} fill={fill} />}
        {furnitureType === "other" && <OtherFurnitureShape w={w} h={h} fill={fill} />}

        {/* Label */}
        <Text
          text={label}
          fontSize={8}
          fontFamily="Heebo, sans-serif"
          fill="#999"
          align="center"
          x={-25}
          y={(isRound ? Math.min(w, h) / 2 : h / 2) + 4}
          width={50}
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
            width: Math.max(25, newBox.width),
            height: Math.max(25, newBox.height),
          })}
        />
      )}
    </>
  );
}
