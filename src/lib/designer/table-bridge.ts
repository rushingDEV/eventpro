import type { DesignerElement, TableMetadata, TableShape } from "./types";
import { generateElementId } from "./store";

interface DBTable {
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
}

/**
 * Convert DB EventTable records into DesignerElements (for loading existing seating into designer).
 */
export function tablesToDesignerElements(tables: DBTable[]): DesignerElement[] {
  return tables.map((table, idx) => {
    const isRound = table.shape === "ROUND" || table.shape === "OVAL";
    const w = table.width || (table.shape === "LONG" ? 200 : isRound ? (table.radius || 50) * 2 : 120);
    const h = table.height || (table.shape === "LONG" ? 50 : isRound ? (table.radius || 50) * 2 : 60);

    return {
      id: generateElementId(),
      type: "table" as const,
      x: table.posX,
      y: table.posY,
      width: w,
      height: h,
      rotation: table.rotation,
      zIndex: idx + 1,
      locked: table.isLocked,
      visible: true,
      name: table.name || `שולחן ${table.number}`,
      style: {
        fill: "#8B7355",
        stroke: "#5D4037",
        strokeWidth: 2,
        opacity: 1,
      },
      metadata: {
        tableShape: table.shape as TableShape,
        capacity: table.capacity,
        radius: table.radius || 50,
        isVIP: table.isVIP,
        tableNumber: table.number,
        guestIds: [],
        eventTableId: table.id,
      } satisfies TableMetadata as unknown as Record<string, unknown>,
    };
  });
}

/**
 * Extract table elements from designer and convert to DB format.
 */
export function designerElementsToTables(
  elements: DesignerElement[],
): {
  number: number;
  name: string | null;
  shape: string;
  capacity: number;
  posX: number;
  posY: number;
  rotation: number;
  width: number;
  height: number;
  radius: number | null;
  isLocked: boolean;
  isVIP: boolean;
  eventTableId?: string;
}[] {
  return elements
    .filter((el) => el.type === "table")
    .map((el) => {
      const meta = el.metadata as unknown as TableMetadata;
      return {
        number: meta.tableNumber || 0,
        name: el.name || null,
        shape: meta.tableShape || "ROUND",
        capacity: meta.capacity || 8,
        posX: Math.round(el.x),
        posY: Math.round(el.y),
        rotation: Math.round(el.rotation),
        width: Math.round(el.width),
        height: Math.round(el.height),
        radius: meta.radius ? Math.round(meta.radius) : null,
        isLocked: el.locked,
        isVIP: meta.isVIP || false,
        eventTableId: meta.eventTableId,
      };
    });
}

/**
 * Get capacity status color for a table.
 */
export function getTableCapacityColor(
  guestCount: number,
  capacity: number,
): "green" | "yellow" | "red" {
  const rate = guestCount / capacity;
  if (rate >= 1) return "red";
  if (rate >= 0.8) return "yellow";
  return "green";
}
