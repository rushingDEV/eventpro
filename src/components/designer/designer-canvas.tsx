"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { Stage, Layer, Rect, Line, Text, Circle, Group } from "react-konva";
import type Konva from "konva";
import { useDesignerStore, generateElementId } from "@/lib/designer/store";
import type { DesignerElement } from "@/lib/designer/types";
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Clipboard,
} from "lucide-react";
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

// ── Context menu state ───────────────────────────────────────────────────────
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  elementId: string | null;
}

// ── Render element by type ───────────────────────────────────────────────────
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

// ── Minimap element color helper ─────────────────────────────────────────────
function minimapColor(type: string): string {
  switch (type) {
    case "table":
      return "#B89470";
    case "wall":
    case "separator":
      return "#8B8178";
    case "dance-floor":
      return "#D4A0D0";
    case "stage":
    case "chuppah":
      return "#E8C468";
    case "bar":
    case "buffet":
    case "dj-booth":
      return "#6BAED6";
    case "flower-arrangement":
    case "lighting":
    case "sign":
    case "photo-booth":
      return "#90C47D";
    case "entrance":
    case "exit":
      return "#E87461";
    case "lounge":
    case "gift-table":
      return "#C4956A";
    default:
      return "#A0A0A0";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DesignerCanvas Component
// ═══════════════════════════════════════════════════════════════════════════════

export function DesignerCanvas({ width, height }: DesignerCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rubber-band selection
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  }>({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });

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
    addElement,
  } = useDesignerStore();

  // Sort elements by zIndex for rendering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // ── Zoom to pointer ────────────────────────────────────────────────────────
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

  // ── Element handlers ───────────────────────────────────────────────────────
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

  // ── Stage click (deselect) ─────────────────────────────────────────────────
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  // ── Rubber-band selection ──────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
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

      // Escape — deselect + close context menu
      if (e.key === "Escape") {
        clearSelection();
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, elements, deleteElements, undo, redo, copy, paste, selectAll, clearSelection, pushHistory, updateElement]);

  // ── Drop handler (from palette) ────────────────────────────────────────────
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

  // ── Context menu handler ───────────────────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const containerEl = containerRef.current;
      if (!containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // Determine which element (if any) is under cursor using canvas coords
      const canvasX = (e.clientX - containerRect.left - panX) / zoom;
      const canvasY = (e.clientY - containerRect.top - panY) / zoom;

      // Find topmost element under cursor
      let targetElement: DesignerElement | null = null;
      for (let i = sortedElements.length - 1; i >= 0; i--) {
        const el = sortedElements[i];
        if (!el.visible) continue;
        if (
          canvasX >= el.x &&
          canvasX <= el.x + el.width &&
          canvasY >= el.y &&
          canvasY <= el.y + el.height
        ) {
          targetElement = el;
          break;
        }
      }

      if (targetElement) {
        // Select the element if not already selected
        if (!selectedIds.includes(targetElement.id)) {
          select(targetElement.id);
        }
        setContextMenu({
          visible: true,
          x: mouseX,
          y: mouseY,
          elementId: targetElement.id,
        });
      } else {
        setContextMenu({ visible: false, x: 0, y: 0, elementId: null });
      }
    },
    [panX, panY, zoom, sortedElements, selectedIds, select],
  );

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [contextMenu.visible]);

  // ── Context menu actions ───────────────────────────────────────────────────
  const contextMenuActions = useMemo(() => {
    const elementId = contextMenu.elementId;
    if (!elementId) return null;
    const el = elements.find((e) => e.id === elementId);
    if (!el) return null;

    return {
      duplicate: () => {
        pushHistory();
        addElement({
          ...el,
          id: generateElementId(),
          x: el.x + 20,
          y: el.y + 20,
          name: `${el.name} (עותק)`,
        });
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      delete: () => {
        deleteElements([elementId]);
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      toggleLock: () => {
        pushHistory();
        updateElement(elementId, { locked: !el.locked });
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      bringForward: () => {
        pushHistory();
        const maxZ = Math.max(...elements.map((e) => e.zIndex));
        updateElement(elementId, { zIndex: maxZ + 1 });
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      sendBackward: () => {
        pushHistory();
        const minZ = Math.min(...elements.map((e) => e.zIndex));
        updateElement(elementId, { zIndex: minZ - 1 });
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      copyToClipboard: () => {
        if (!selectedIds.includes(elementId)) {
          select(elementId);
        }
        // Small delay to ensure selection is set before copy
        setTimeout(() => {
          copy();
        }, 0);
        setContextMenu((prev) => ({ ...prev, visible: false }));
      },
      isLocked: el.locked,
    };
  }, [contextMenu.elementId, elements, selectedIds, pushHistory, addElement, deleteElements, updateElement, select, copy]);

  // ── Dotted grid (circles instead of rects) ────────────────────────────────
  const gridDots = useMemo(() => {
    if (!showGrid) return [];
    const dots: React.ReactNode[] = [];
    const cols = Math.ceil(canvasWidth / gridSize);
    const rows = Math.ceil(canvasHeight / gridSize);

    for (let col = 0; col <= cols; col++) {
      for (let row = 0; row <= rows; row++) {
        const isMajor = col % 4 === 0 && row % 4 === 0;
        dots.push(
          <Circle
            key={`gd-${col}-${row}`}
            x={col * gridSize}
            y={row * gridSize}
            radius={isMajor ? 2.5 : 1.5}
            fill={isMajor ? "#B0A090" : "#C8BAA8"}
            opacity={isMajor ? 0.5 : 0.4}
            listening={false}
            perfectDrawEnabled={false}
          />,
        );
      }
    }
    return dots;
  }, [showGrid, canvasWidth, canvasHeight, gridSize]);

  // ── Alignment guides ───────────────────────────────────────────────────────
  const guideLines = guides.map((guide, i) =>
    guide.type === "vertical" ? (
      <Line key={`guide-${i}`} points={[guide.position, 0, guide.position, canvasHeight]} stroke="#3B82F6" strokeWidth={1} dash={[4, 4]} listening={false} />
    ) : (
      <Line key={`guide-${i}`} points={[0, guide.position, canvasWidth, guide.position]} stroke="#3B82F6" strokeWidth={1} dash={[4, 4]} listening={false} />
    ),
  );

  // ── Minimap calculations ───────────────────────────────────────────────────
  const MINIMAP_W = 160;
  const MINIMAP_H = 110;
  const minimapScaleX = MINIMAP_W / canvasWidth;
  const minimapScaleY = MINIMAP_H / canvasHeight;
  const minimapScale = Math.min(minimapScaleX, minimapScaleY);

  // Current viewport rect in canvas coordinates
  const viewportX = -panX / zoom;
  const viewportY = -panY / zoom;
  const viewportW = width / zoom;
  const viewportH = height / zoom;

  return (
    <div
      ref={containerRef}
      className="designer-canvas-container border rounded-xl overflow-hidden relative flex-1"
      style={{ backgroundColor: BG_COLOR, width, height }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
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
          {/* Canvas boundary with shadow */}
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#FFFFFF"
            stroke="#E5E0D8"
            strokeWidth={1}
            shadowBlur={20}
            shadowColor="rgba(0,0,0,0.08)"
            shadowOffsetX={0}
            shadowOffsetY={4}
            listening={false}
          />

          {/* Dotted grid */}
          {gridDots}

          {/* Alignment guides */}
          {guideLines}

          {/* Enhanced empty state */}
          {elements.length === 0 && (
            <Group x={canvasWidth / 2} y={canvasHeight / 2 - 40} listening={false}>
              {/* Layout icon — stylized grid */}
              <Rect x={-28} y={-28} width={22} height={22} cornerRadius={4} fill="#D5CFC7" opacity={0.6} />
              <Rect x={-2} y={-28} width={30} height={22} cornerRadius={4} fill="#C8BAA8" opacity={0.5} />
              <Rect x={-28} y={-2} width={30} height={16} cornerRadius={4} fill="#C8BAA8" opacity={0.5} />
              <Rect x={6} y={-2} width={22} height={16} cornerRadius={4} fill="#D5CFC7" opacity={0.6} />

              {/* Primary CTA text */}
              <Text
                text="התחילו לעצב"
                fontSize={22}
                fontFamily="Heebo, sans-serif"
                fontStyle="bold"
                fill="#6B6054"
                align="center"
                x={-120}
                y={30}
                width={240}
                listening={false}
              />
              {/* Secondary hint text */}
              <Text
                text="גררו אלמנטים מהפאנל השמאלי"
                fontSize={14}
                fontFamily="Heebo, sans-serif"
                fill="#A39888"
                align="center"
                x={-140}
                y={58}
                width={280}
                listening={false}
              />
            </Group>
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

      {/* ── Context Menu (HTML overlay) ────────────────────────────────────── */}
      {contextMenu.visible && contextMenuActions && (
        <div
          className="designer-context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={contextMenuActions.duplicate}>
            <Copy size={14} />
            <span>שכפל</span>
          </button>
          <button onClick={contextMenuActions.copyToClipboard}>
            <Clipboard size={14} />
            <span>העתק</span>
          </button>

          <div className="separator" />

          <button onClick={contextMenuActions.toggleLock}>
            {contextMenuActions.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{contextMenuActions.isLocked ? "בטל נעילה" : "נעל"}</span>
          </button>

          <div className="separator" />

          <button onClick={contextMenuActions.bringForward}>
            <ArrowUp size={14} />
            <span>הבא קדימה</span>
          </button>
          <button onClick={contextMenuActions.sendBackward}>
            <ArrowDown size={14} />
            <span>שלח אחורה</span>
          </button>

          <div className="separator" />

          <button onClick={contextMenuActions.delete}>
            <Trash2 size={14} />
            <span>מחק</span>
          </button>
        </div>
      )}

      {/* ── Minimap (HTML + SVG overlay) ───────────────────────────────────── */}
      <div className="designer-minimap">
        <svg
          width={MINIMAP_W}
          height={MINIMAP_H}
          viewBox={`0 0 ${MINIMAP_W} ${MINIMAP_H}`}
          style={{ display: "block" }}
        >
          {/* Canvas background */}
          <rect
            x={0}
            y={0}
            width={canvasWidth * minimapScale}
            height={canvasHeight * minimapScale}
            fill="#FFFFFF"
            opacity={0.6}
          />

          {/* Elements as colored dots / rects */}
          {sortedElements.map((el) => {
            if (!el.visible) return null;
            const ex = el.x * minimapScale;
            const ey = el.y * minimapScale;
            const ew = Math.max(el.width * minimapScale, 3);
            const eh = Math.max(el.height * minimapScale, 3);
            const color = minimapColor(el.type);

            // Round tables as circles
            if (el.type === "table" && el.metadata?.tableShape === "ROUND") {
              const r = Math.max(ew, eh) / 2;
              return (
                <circle
                  key={`mm-${el.id}`}
                  cx={ex + ew / 2}
                  cy={ey + eh / 2}
                  r={r}
                  fill={color}
                  opacity={0.8}
                />
              );
            }

            return (
              <rect
                key={`mm-${el.id}`}
                x={ex}
                y={ey}
                width={ew}
                height={eh}
                rx={1}
                fill={color}
                opacity={0.8}
              />
            );
          })}

          {/* Viewport rectangle */}
          <rect
            x={Math.max(0, viewportX * minimapScale)}
            y={Math.max(0, viewportY * minimapScale)}
            width={Math.min(viewportW * minimapScale, MINIMAP_W)}
            height={Math.min(viewportH * minimapScale, MINIMAP_H)}
            fill="rgba(59,130,246,0.08)"
            stroke="rgba(59,130,246,0.5)"
            strokeWidth={1.5}
            rx={2}
          />
        </svg>
      </div>
    </div>
  );
}
