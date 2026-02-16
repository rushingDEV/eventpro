// ── Element Types ──────────────────────────────────────────────────────────

export type ElementType =
  | "table"
  | "chair"
  | "wall"
  | "dance-floor"
  | "stage"
  | "chuppah"
  | "bar"
  | "dj-booth"
  | "flower-arrangement"
  | "lighting"
  | "sign"
  | "entrance"
  | "exit"
  | "photo-booth"
  | "gift-table"
  | "buffet"
  | "lounge"
  | "separator"
  | "custom";

export type TableShape = "ROUND" | "RECTANGLE" | "SQUARE" | "OVAL" | "LONG";

export type ToolMode = "select" | "pan" | "draw-wall" | "measure";

export type ViewMode = "2d" | "2.5d" | "3d";

// ── Element Style ─────────────────────────────────────────────────────────

export interface ElementShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface ElementStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  texture?: string;
  shadow?: ElementShadow;
}

// ── Designer Element (core) ───────────────────────────────────────────────

export interface DesignerElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  name: string;
  style: ElementStyle;
  groupId?: string;
  metadata: Record<string, unknown>;
}

// ── Type-specific metadata ────────────────────────────────────────────────

export interface TableMetadata {
  tableShape: TableShape;
  capacity: number;
  radius?: number;
  isVIP: boolean;
  tableNumber: number;
  guestIds: string[];
  eventTableId?: string; // link to DB EventTable
}

export interface WallMetadata {
  thickness: number;
  hasDoor: boolean;
  doorPosition?: number; // 0-1 along the wall
  doorWidth?: number;
}

export interface DanceFloorMetadata {
  shape: "rect" | "circle" | "custom";
  hasLedGrid: boolean;
  pattern?: string;
}

export interface StageMetadata {
  elevationHeight: number;
  hasSteps: boolean;
  stepsPosition?: "front" | "left" | "right" | "back";
  subType: "stage" | "chuppah";
}

export interface BarMetadata {
  stoolCount: number;
  barType: "cocktail" | "sit-down" | "buffet";
}

export interface DecorationMetadata {
  decorationType: "flowers" | "lighting" | "sign" | "photo-booth" | "other";
  intensity?: "low" | "medium" | "high";
  color?: string;
  text?: string; // for signs
}

export interface EntranceMetadata {
  direction: "in" | "out" | "both";
  isEmergency: boolean;
  label?: string;
}

export interface FurnitureMetadata {
  furnitureType: "armchair" | "sofa" | "side-table" | "lounge-set" | "cake-table" | "gift-table" | "other";
}

// ── Element Palette Definition ────────────────────────────────────────────

export interface PaletteItem {
  type: ElementType;
  label: string;
  icon: string; // lucide icon name
  category: PaletteCategory;
  defaultWidth: number;
  defaultHeight: number;
  defaultStyle: ElementStyle;
  defaultMetadata: Record<string, unknown>;
}

export type PaletteCategory =
  | "seating"
  | "structure"
  | "central"
  | "food-drink"
  | "decoration"
  | "furniture";

export const PALETTE_CATEGORY_LABELS: Record<PaletteCategory, string> = {
  seating: "הושבה",
  structure: "מבנה",
  central: "מרכזי",
  "food-drink": "אוכל ושתייה",
  decoration: "עיצוב",
  furniture: "ריהוט",
};

// ── Canvas / Designer State ───────────────────────────────────────────────

export interface DesignerViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface DesignerGrid {
  size: number;
  snapToGrid: boolean;
  showGrid: boolean;
}

export interface AlignmentGuide {
  type: "vertical" | "horizontal";
  position: number;
}

// ── AI / Suggestions ──────────────────────────────────────────────────────

export type SuggestionPriority = "low" | "medium" | "high" | "critical";

export interface DesignerSuggestion {
  id: string;
  type: "spacing" | "flow" | "capacity" | "safety" | "layout" | "optimization";
  message: string;
  priority: SuggestionPriority;
  affectedElementIds?: string[];
  autoFix?: DesignerElement[]; // replacement elements if auto-fix available
}

// ── Template ──────────────────────────────────────────────────────────────

export interface DesignerTemplate {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  elements: DesignerElement[];
  canvasWidth: number;
  canvasHeight: number;
  guestCountRange: [number, number]; // min, max
  eventType: string;
}

// ── Serializable state (for saving to DB) ─────────────────────────────────

export interface DesignerSaveData {
  version: number;
  elements: DesignerElement[];
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  viewMode: ViewMode;
}

export const DESIGNER_SAVE_VERSION = 1;
