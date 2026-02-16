"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line, Text } from "react-konva";
import type Konva from "konva";
import { useDesignerStore } from "@/lib/designer/store";
import type { DesignerElement } from "@/lib/designer/types";
import {
  TableElement,
  WallElement,
  DanceFloorElement,
  StageElement,
  BarElement,
  DecorationElement,
  EntranceElement,
  FurnitureElement,
  CustomElement,
} from "./elements";

const BG_COLOR = "#FAF8F5";

interface DesignerCanvasProps {
  width: number;
  height: number;
}

function renderElement(
  el: DesignerElement,
  isSelected: boolean,
  onSelect: (id: string) => void,
  onDragEnd: (id: string, x: number, y: number) => void,
  onTransformEnd: (id: string, updates: Partial<DesignerElement>) => void,
) {
  if (!el.visible) return null;

  const props = { element: el, isSelected, onSelect, onDragEnd, onTransformEnd };

  switch (el.type) {
    case "table":
      return <TableElement key={el.id} {...props} />;
    case "wall":
    case "separator":
      return <WallElement key={el.id} {...props} />;
    case "dance-floor":
      return <DanceFloorElement key={el.id} {...props} />;
    case "stage":
    case "chuppah":
      return <StageElement key={el.id} {...props} />;
    case "bar":
    case "buffet":
    case "dj-booth":
      return <BarElement key={el.id} {...props} />;
    case "flower-arrangement":
    case "lighting":
    case "sign":
    case "photo-booth":
      return <DecorationElement key={el.id} {...props} />;
    case "entrance":
    case "exit":
      return <EntranceElement key={el.id} {...props} />;
    case "lounge":
    case "gift-table":
      return <FurnitureElement key={el.id} {...props} />;
    default:
      return <CustomElement key={el.id} {...props} />;
  }
}

export function DesignerCanvas({ width, height }: DesignerCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  }>({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  const {
    elements,
    selectedIds,
    zoom,
    panX,
    panY,
    gridSize,
    showGrid,
    snapToGrid,
    activeTool,
    guides,
    canvasWidth,
    canvasHeight,
    select,
    multiSelect,
    clearSelection,
    setSelectedIds,
    updateElement,
    deleteElements,
    setZoom,
    setPan,
    undo,
    redo,
    copy,
    paste,
    selectAll,
    pushHistory,
  } = useDesignerStore();

  // Sort elements by zIndex for rendering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // ── Zoom to pointer ──
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.08;
      const oldScale = zoom;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = Math.max(0.2, Math.min(4, newScale));

      const mousePointTo = {
        x: (pointer.x - panX) / oldScale,
        y: (pointer.y - panY) / oldScale,
      };

      setZoom(clampedScale);
      setPan(pointer.x - mousePointTo.x * clampedScale, pointer.y - mousePointTo.y * clampedScale);
    },
    [zoom, panX, panY, setZoom, setPan],
  );

  // ── Element handlers ──
  const handleSelect = useCallback(
    (id: string) => {
      if (activeTool !== "select") return;
      const evt = window.event as KeyboardEvent | undefined;
      if (evt?.shiftKey) {
        multiSelect(id);
      } else {
        select(id);
      }
    },
    [activeTool, select, multiSelect],
  );

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      let finalX = x;
      let finalY = y;
      if (snapToGrid) {
        finalX = Math.round(x / gridSize) * gridSize;
        finalY = Math.round(y / gridSize) * gridSize;
      }
      pushHistory();
      updateElement(id, { x: finalX, y: finalY });
    },
    [snapToGrid, gridSize, pushHistory, updateElement],
  );

  const handleTransformEnd = useCallback(
    (id: string, updates: Partial<DesignerElement>) => {
      let x = updates.x ?? 0;
      let y = updates.y ?? 0;
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }
      updateElement(id, { ...updates, x, y });
    },
    [snapToGrid, gridSize, updateElement],
  );

  // ── Stage click (deselect) ──
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  // ── Rubber-band selection ──
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "select") return;
      if (e.target !== e.target.getStage()) return;

      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - panX) / zoom;
      const y = (pointer.y - panY) / zoom;
      selectionStartRef.current = { x, y };
      setSelectionRect({ x, y, width: 0, height: 0, visible: true });
    },
    [activeTool, panX, panY, zoom],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!selectionStartRef.current) return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - panX) / zoom;
      const y = (pointer.y - panY) / zoom;
      const start = selectionStartRef.current;

      setSelectionRect({
        x: Math.min(start.x, x),
        y: Math.min(start.y, y),
        width: Math.abs(x - start.x),
        height: Math.abs(y - start.y),
        visible: true,
      });
    },
    [panX, panY, zoom],
  );

  const handleStageMouseUp = useCallback(() => {
    if (!selectionStartRef.current) return;
    selectionStartRef.current = null;

    if (selectionRect.width > 5 && selectionRect.height > 5) {
      const selected = elements
        .filter((el) => {
          if (el.locked || !el.visible) return false;
          return (
            el.x >= selectionRect.x &&
            el.x <= selectionRect.x + selectionRect.width &&
            el.y >= selectionRect.y &&
            el.y <= selectionRect.y + selectionRect.height
          );
        })
        .map((el) => el.id);
      setSelectedIds(selected);
    }

    setSelectionRect((prev) => ({ ...prev, visible: false }));
  }, [selectionRect, elements, setSelectedIds]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedIds.length > 0) {
          deleteElements(selectedIds);
        }
      }

      // Ctrl+Z / Cmd+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Shift+Z / Ctrl+Y — redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Ctrl+C — copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        copy();
      }

      // Ctrl+V — paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        paste();
      }

      // Ctrl+A — select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      }

      // Arrow keys — nudge
      const nudge = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const dx = e.key === "ArrowLeft" ? -nudge : e.key === "ArrowRight" ? nudge : 0;
        const dy = e.key === "ArrowUp" ? -nudge : e.key === "ArrowDown" ? nudge : 0;
        if (selectedIds.length > 0) {
          pushHistory();
          for (const id of selectedIds) {
            const el = elements.find((e) => e.id === id);
            if (el && !el.locked) {
              updateElement(id, { x: el.x + dx, y: el.y + dy });
            }
          }
        }
      }

      // Escape — deselect
      if (e.key === "Escape") {
        clearSelection();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, elements, deleteElements, undo, redo, copy, paste, selectAll, clearSelection, pushHistory, updateElement]);

  // ── Drop handler (from palette) ──
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/designer-element");
      if (!data) return;

      const stage = stageRef.current;
      if (!stage) return;

      const rect = (e.target as HTMLElement).closest(".designer-canvas-container")?.getBoundingClientRect();
      if (!rect) return;

      let x = (e.clientX - rect.left - panX) / zoom;
      let y = (e.clientY - rect.top - panY) / zoom;
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      // Parse element template & dispatch to store
      try {
        const template = JSON.parse(data) as DesignerElement;
        const { addElement } = useDesignerStore.getState();
        addElement({ ...template, x, y });
      } catch {
        // invalid data
      }
    },
    [panX, panY, zoom, snapToGrid, gridSize],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // ── Grid ──
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    const cols = Math.ceil(canvasWidth / gridSize) + 2;
    const rows = Math.ceil(canvasHeight / gridSize) + 2;
    for (let col = 0; col <= cols; col++) {
      gridLines.push(
        <Rect
          key={`gc-${col}`}
          x={col * gridSize}
          y={0}
          width={1}
          height={canvasHeight}
          fill="#D5CFC7"
          opacity={col % 4 === 0 ? 0.3 : 0.1}
          listening={false}
        />,
      );
    }
    for (let row = 0; row <= rows; row++) {
      gridLines.push(
        <Rect
          key={`gr-${row}`}
          x={0}
          y={row * gridSize}
          width={canvasWidth}
          height={1}
          fill="#D5CFC7"
          opacity={row % 4 === 0 ? 0.3 : 0.1}
          listening={false}
        />,
      );
    }
  }

  // ── Alignment guides ──
  const guideLines = guides.map((guide, i) =>
    guide.type === "vertical" ? (
      <Line key={`guide-${i}`} points={[guide.position, 0, guide.position, canvasHeight]} stroke="#3B82F6" strokeWidth={1} dash={[4, 4]} listening={false} />
    ) : (
      <Line key={`guide-${i}`} points={[0, guide.position, canvasWidth, guide.position]} stroke="#3B82F6" strokeWidth={1} dash={[4, 4]} listening={false} />
    ),
  );

  return (
    <div
      className="designer-canvas-container border rounded-xl overflow-hidden relative flex-1"
      style={{ backgroundColor: BG_COLOR, width, height }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        draggable={activeTool === "pan" || activeTool === "select"}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setPan(e.target.x(), e.target.y());
          }
        }}
      >
        <Layer>
          {/* Canvas boundary */}
          <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#FFFFFF" stroke="#E5E0D8" strokeWidth={1} listening={false} />

          {/* Grid */}
          {gridLines}

          {/* Alignment guides */}
          {guideLines}

          {/* Empty state */}
          {elements.length === 0 && (
            <Text
              text="גררו אלמנטים מהפאנל השמאלי לכאן"
              fontSize={16}
              fontFamily="Heebo, sans-serif"
              fill="#9CA3AF"
              align="center"
              x={canvasWidth / 2 - 150}
              y={canvasHeight / 2 - 10}
              width={300}
              listening={false}
            />
          )}

          {/* Elements */}
          {sortedElements.map((el) =>
            renderElement(el, selectedIds.includes(el.id), handleSelect, handleDragEnd, handleTransformEnd),
          )}

          {/* Rubber-band selection rect */}
          {selectionRect.visible && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(59,130,246,0.1)"
              stroke="#3B82F6"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
