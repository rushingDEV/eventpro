"use client";

import { useState, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { TableShape } from "./table-shape";

interface TableData {
  id: string;
  number: number;
  name: string | null;
  shape: string;
  capacity: number;
  posX: number;
  posY: number;
  rotation: number;
  width: number | null;
  height: number | null;
  radius: number | null;
  isLocked: boolean;
  isVIP: boolean;
  zone: string | null;
  _count?: { guests: number };
  guests?: { id: string }[];
}

interface FloorPlanCanvasProps {
  tables: TableData[];
  selectedTableId: string | null;
  onSelectTable: (id: string | null) => void;
  onMoveTable: (id: string, x: number, y: number) => void;
  width?: number;
  height?: number;
}

export function FloorPlanCanvas({
  tables,
  selectedTableId,
  onSelectTable,
  onMoveTable,
  width = 900,
  height = 600,
}: FloorPlanCanvasProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleWheel = useCallback(
    (e: any) => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const newScale =
        e.evt.deltaY > 0 ? scale / scaleBy : scale * scaleBy;
      const clampedScale = Math.max(0.3, Math.min(3, newScale));

      setScale(clampedScale);
    },
    [scale]
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-50">
      <Stage
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          setPosition({ x: e.target.x(), y: e.target.y() });
        }}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            onSelectTable(null);
          }
        }}
      >
        <Layer>
          {/* Background grid */}
          {Array.from({ length: Math.ceil(width / 50) + 1 }).map((_, i) => (
            <Rect
              key={`vline-${i}`}
              x={i * 50}
              y={0}
              width={1}
              height={height * 3}
              fill="#e5e7eb"
              opacity={0.5}
            />
          ))}
          {Array.from({ length: Math.ceil(height / 50) + 1 }).map((_, i) => (
            <Rect
              key={`hline-${i}`}
              x={0}
              y={i * 50}
              width={width * 3}
              height={1}
              fill="#e5e7eb"
              opacity={0.5}
            />
          ))}

          {/* Tables */}
          {tables.map((table) => (
            <TableShape
              key={table.id}
              id={table.id}
              number={table.number}
              name={table.name}
              shape={table.shape}
              capacity={table.capacity}
              posX={table.posX}
              posY={table.posY}
              rotation={table.rotation}
              width={table.width}
              height={table.height}
              radius={table.radius}
              guestCount={
                table._count?.guests ?? table.guests?.length ?? 0
              }
              isSelected={selectedTableId === table.id}
              isLocked={table.isLocked}
              isVIP={table.isVIP}
              onSelect={onSelectTable}
              onDragEnd={onMoveTable}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
