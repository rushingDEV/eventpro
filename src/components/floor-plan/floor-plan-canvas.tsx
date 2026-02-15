"use client";

import { useState, useCallback, useRef } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import { TableShape } from "./table-shape";
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
  guests?: GuestData[];
}

interface FloorPlanCanvasProps {
  tables: TableData[];
  selectedTableId: string | null;
  dropTargetTableId: string | null;
  onSelectTable: (id: string | null) => void;
  onMoveTable: (id: string, x: number, y: number) => void;
  onDropGuest: (tableId: string) => void;
  width?: number;
  height?: number;
}

const GRID_SIZE = 50;
const BG_COLOR = "#FAF8F5";

export function FloorPlanCanvas({
  tables,
  selectedTableId,
  dropTargetTableId,
  onSelectTable,
  onMoveTable,
  onDropGuest,
  width = 900,
  height = 600,
}: FloorPlanCanvasProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef<Konva.Stage>(null);

  // Zoom to pointer
  const handleWheel = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.08;
      const oldScale = scale;
      const newScale =
        e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = Math.max(0.3, Math.min(3, newScale));

      // Zoom towards pointer
      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      setScale(clampedScale);
      setPosition({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [scale, position]
  );

  // Handle HTML5 drag-and-drop from guest cards
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      // Find which table is at the drop position
      const rect = (e.target as HTMLElement).closest(".floor-plan-container")?.getBoundingClientRect();
      if (!rect) return;

      const pointerX = (e.clientX - rect.left - position.x) / scale;
      const pointerY = (e.clientY - rect.top - position.y) / scale;

      // Find closest table within 80px
      let closestTable: string | null = null;
      let closestDist = 80;
      for (const table of tables) {
        const dx = table.posX - pointerX;
        const dy = table.posY - pointerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestTable = table.id;
        }
      }

      if (closestTable) {
        onDropGuest(closestTable);
      }
    },
    [tables, scale, position, onDropGuest]
  );

  // Generate grid
  const gridCols = Math.ceil((width * 3) / GRID_SIZE);
  const gridRows = Math.ceil((height * 3) / GRID_SIZE);

  return (
    <div
      className="floor-plan-container border rounded-xl overflow-hidden relative"
      style={{ backgroundColor: BG_COLOR }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Zoom controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <button
          className="w-8 h-8 rounded-lg bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-white transition-colors text-lg font-bold"
          onClick={() => setScale((s) => Math.min(3, s * 1.2))}
        >
          +
        </button>
        <button
          className="w-8 h-8 rounded-lg bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-white transition-colors text-lg font-bold"
          onClick={() => setScale((s) => Math.max(0.3, s / 1.2))}
        >
          −
        </button>
        <button
          className="w-8 h-8 rounded-lg bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-white transition-colors text-xs"
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
        >
          ⌂
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 left-3 z-10 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            onSelectTable(null);
          }
        }}
      >
        <Layer>
          {/* Grid dots */}
          {Array.from({ length: gridCols }).map((_, col) =>
            Array.from({ length: gridRows }).map((_, row) => (
              <Rect
                key={`dot-${col}-${row}`}
                x={col * GRID_SIZE - GRID_SIZE}
                y={row * GRID_SIZE - GRID_SIZE}
                width={2}
                height={2}
                fill="#D5CFC7"
                opacity={0.5}
                cornerRadius={1}
                listening={false}
              />
            ))
          )}

          {/* Empty state */}
          {tables.length === 0 && (
            <Text
              text="גרור שולחנות לכאן או לחץ ׳שולחן חדש׳"
              fontSize={16}
              fontFamily="Heebo, sans-serif"
              fill="#9CA3AF"
              align="center"
              x={width / 2 - 150}
              y={height / 2 - 10}
              width={300}
              listening={false}
            />
          )}

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
              guests={table.guests || []}
              isSelected={selectedTableId === table.id}
              isLocked={table.isLocked}
              isVIP={table.isVIP}
              isDropTarget={dropTargetTableId === table.id}
              onSelect={onSelectTable}
              onDragEnd={onMoveTable}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
