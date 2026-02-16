import { create } from "zustand";
import type {
  DesignerElement,
  ElementType,
  ToolMode,
  ViewMode,
  AlignmentGuide,
  DesignerSaveData,
  DESIGNER_SAVE_VERSION,
} from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────

let _idCounter = 0;
export function generateElementId(): string {
  return `el_${Date.now()}_${++_idCounter}`;
}

const MAX_HISTORY = 50;

// ── Store Interface ───────────────────────────────────────────────────────

interface DesignerStore {
  // Elements
  elements: DesignerElement[];
  addElement: (el: DesignerElement) => void;
  addElements: (els: DesignerElement[]) => void;
  updateElement: (id: string, patch: Partial<DesignerElement>) => void;
  deleteElements: (ids: string[]) => void;
  setElements: (els: DesignerElement[]) => void;

  // Selection
  selectedIds: string[];
  select: (id: string) => void;
  multiSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;

  // Clipboard
  clipboard: DesignerElement[];
  copy: () => void;
  paste: () => void;

  // History (undo/redo)
  history: DesignerElement[][];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Viewport
  zoom: number;
  panX: number;
  panY: number;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;

  // Grid
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
  toggleGrid: () => void;

  // Alignment guides (transient)
  guides: AlignmentGuide[];
  setGuides: (guides: AlignmentGuide[]) => void;

  // Canvas size
  canvasWidth: number;
  canvasHeight: number;
  setCanvasSize: (w: number, h: number) => void;

  // Tools & Mode
  activeTool: ToolMode;
  setActiveTool: (tool: ToolMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Save state
  isDirty: boolean;
  lastSavedAt: Date | null;
  markSaved: () => void;

  // Serialization
  exportToJson: () => DesignerSaveData;
  loadFromJson: (data: DesignerSaveData) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────

export const useDesignerStore = create<DesignerStore>((set, get) => ({
  // ── Elements ──
  elements: [],

  addElement: (el) => {
    const state = get();
    state.pushHistory();
    set({ elements: [...state.elements, el], isDirty: true });
  },

  addElements: (els) => {
    const state = get();
    state.pushHistory();
    set({ elements: [...state.elements, ...els], isDirty: true });
  },

  updateElement: (id, patch) => {
    const state = get();
    state.pushHistory();
    set({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...patch } : el
      ),
      isDirty: true,
    });
  },

  deleteElements: (ids) => {
    const state = get();
    state.pushHistory();
    const idSet = new Set(ids);
    set({
      elements: state.elements.filter((el) => !idSet.has(el.id)),
      selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
      isDirty: true,
    });
  },

  setElements: (els) => {
    set({ elements: els });
  },

  // ── Selection ──
  selectedIds: [],

  select: (id) => set({ selectedIds: [id] }),

  multiSelect: (id) => {
    const { selectedIds } = get();
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter((s) => s !== id) });
    } else {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  selectAll: () => {
    const { elements } = get();
    set({ selectedIds: elements.filter((e) => !e.locked).map((e) => e.id) });
  },

  clearSelection: () => set({ selectedIds: [] }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  // ── Clipboard ──
  clipboard: [],

  copy: () => {
    const { elements, selectedIds } = get();
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    set({ clipboard: selected });
  },

  paste: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;
    const state = get();
    state.pushHistory();

    const newElements = clipboard.map((el) => ({
      ...el,
      id: generateElementId(),
      x: el.x + 20,
      y: el.y + 20,
      name: `${el.name} (עותק)`,
    }));

    const newIds = newElements.map((e) => e.id);
    set({
      elements: [...state.elements, ...newElements],
      selectedIds: newIds,
      isDirty: true,
    });
  },

  // ── History ──
  history: [],
  historyIndex: -1,

  pushHistory: () => {
    const { elements, history, historyIndex } = get();
    // Truncate forward history if we branched
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(elements.map((el) => ({ ...el })));
    // Limit history size
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < 0) return;
    const elements = history[historyIndex];
    set({
      elements: elements.map((el) => ({ ...el })),
      historyIndex: historyIndex - 1,
      isDirty: true,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const elements = history[historyIndex + 1];
    set({
      elements: elements.map((el) => ({ ...el })),
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  canUndo: () => get().historyIndex >= 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // ── Viewport ──
  zoom: 1,
  panX: 0,
  panY: 0,

  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(4, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  zoomIn: () => set((s) => ({ zoom: Math.min(4, s.zoom * 1.15) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(0.2, s.zoom / 1.15) })),
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),

  // ── Grid ──
  gridSize: 25,
  snapToGrid: true,
  showGrid: true,

  setGridSize: (size) => set({ gridSize: size }),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  // ── Alignment guides ──
  guides: [],
  setGuides: (guides) => set({ guides }),

  // ── Canvas size ──
  canvasWidth: 1200,
  canvasHeight: 800,
  setCanvasSize: (w, h) => set({ canvasWidth: w, canvasHeight: h }),

  // ── Tools & Mode ──
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),

  viewMode: "2d",
  setViewMode: (mode) => set({ viewMode: mode }),

  // ── Save state ──
  isDirty: false,
  lastSavedAt: null,
  markSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),

  // ── Serialization ──
  exportToJson: (): DesignerSaveData => {
    const { elements, canvasWidth, canvasHeight, gridSize, viewMode } = get();
    return {
      version: 1 as unknown as typeof DESIGNER_SAVE_VERSION,
      elements,
      canvasWidth,
      canvasHeight,
      gridSize,
      viewMode,
    };
  },

  loadFromJson: (data: DesignerSaveData) => {
    set({
      elements: data.elements || [],
      canvasWidth: data.canvasWidth || 1200,
      canvasHeight: data.canvasHeight || 800,
      gridSize: data.gridSize || 25,
      viewMode: data.viewMode || "2d",
      history: [],
      historyIndex: -1,
      selectedIds: [],
      isDirty: false,
    });
  },
}));
