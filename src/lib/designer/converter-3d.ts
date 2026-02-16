import type { DesignerElement, TableMetadata, StageMetadata, BarMetadata, DanceFloorMetadata, DecorationMetadata, EntranceMetadata, WallMetadata } from "./types";

/**
 * 3D element representation for React Three Fiber.
 */
export interface Element3D {
  id: string;
  type: string;
  position: [number, number, number]; // x, y (up), z
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  emissive?: string;
  geometry: "box" | "cylinder" | "plane" | "sphere";
  children?: Element3D[];
  metadata?: Record<string, unknown>;
}

const SCALE_FACTOR = 0.01; // Convert from px to 3D units
const HEIGHT_UNIT = 0.02;

/**
 * Convert 2D designer elements to 3D representations.
 */
export function convertTo3D(elements: DesignerElement[]): Element3D[] {
  const result: Element3D[] = [];

  for (const el of elements) {
    if (!el.visible) continue;
    const converted = convertElement(el);
    if (converted) result.push(...converted);
  }

  return result;
}

function convertElement(el: DesignerElement): Element3D[] | null {
  const x = el.x * SCALE_FACTOR;
  const z = el.y * SCALE_FACTOR;
  const w = el.width * SCALE_FACTOR;
  const h = el.height * SCALE_FACTOR;
  const rotY = -(el.rotation * Math.PI) / 180;

  switch (el.type) {
    case "table":
      return convertTable(el, x, z, w, h, rotY);
    case "wall":
    case "separator":
      return convertWall(el, x, z, w, h, rotY);
    case "dance-floor":
      return convertDanceFloor(el, x, z, w, h, rotY);
    case "stage":
    case "chuppah":
      return convertStage(el, x, z, w, h, rotY);
    case "bar":
    case "buffet":
    case "dj-booth":
      return convertBar(el, x, z, w, h, rotY);
    case "flower-arrangement":
    case "lighting":
    case "sign":
    case "photo-booth":
      return convertDecoration(el, x, z, w, h, rotY);
    case "entrance":
    case "exit":
      return convertEntrance(el, x, z, w, h, rotY);
    case "lounge":
    case "gift-table":
      return convertFurniture(el, x, z, w, h, rotY);
    default:
      return [{ id: el.id, type: el.type, position: [x, 0.1, z], rotation: [0, rotY, 0], scale: [w, 0.1, h], color: el.style.fill, geometry: "box" }];
  }
}

function convertTable(el: DesignerElement, x: number, z: number, w: number, h: number, rotY: number): Element3D[] {
  const meta = el.metadata as unknown as TableMetadata;
  const isRound = meta.tableShape === "ROUND" || meta.tableShape === "OVAL";
  const tableHeight = 0.75 * SCALE_FACTOR * 100; // 75cm
  const legHeight = tableHeight - 0.02;
  const r = isRound ? Math.max(w, h) / 2 : 0;

  const elements: Element3D[] = [];

  // Table top
  elements.push({
    id: `${el.id}-top`,
    type: "table-top",
    position: [x, tableHeight, z],
    rotation: [0, rotY, 0],
    scale: isRound ? [r, 0.02, r] : [w, 0.02, h],
    color: el.style.fill || "#8B7355",
    geometry: isRound ? "cylinder" : "box",
  });

  // Table legs
  const legRadius = 0.015;
  const legPositions: [number, number][] = isRound
    ? [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]].map(([lx, lz]) => [lx * r, lz * r])
    : [[-w / 2 + 0.05, -h / 2 + 0.05], [w / 2 - 0.05, -h / 2 + 0.05], [-w / 2 + 0.05, h / 2 - 0.05], [w / 2 - 0.05, h / 2 - 0.05]];

  for (const [lx, lz] of legPositions) {
    elements.push({
      id: `${el.id}-leg-${lx}-${lz}`,
      type: "table-leg",
      position: [x + lx, legHeight / 2, z + lz],
      rotation: [0, 0, 0],
      scale: [legRadius, legHeight, legRadius],
      color: "#5D4037",
      geometry: "cylinder",
    });
  }

  // Chairs (simple cylinders)
  const capacity = meta.capacity || 8;
  const chairDistance = isRound ? r + 0.15 : Math.max(w, h) / 2 + 0.15;
  for (let i = 0; i < capacity; i++) {
    const angle = (2 * Math.PI * i) / capacity;
    const cx = x + Math.cos(angle) * chairDistance;
    const cz = z + Math.sin(angle) * chairDistance;

    // Chair seat
    elements.push({
      id: `${el.id}-chair-${i}`,
      type: "chair",
      position: [cx, 0.22, cz],
      rotation: [0, -angle, 0],
      scale: [0.04, 0.02, 0.04],
      color: "#E8E0D4",
      geometry: "cylinder",
    });

    // Chair back
    elements.push({
      id: `${el.id}-chair-back-${i}`,
      type: "chair-back",
      position: [cx + Math.cos(angle) * 0.03, 0.35, cz + Math.sin(angle) * 0.03],
      rotation: [0, -angle, 0],
      scale: [0.04, 0.12, 0.005],
      color: "#D7CCC8",
      geometry: "box",
    });
  }

  return elements;
}

function convertWall(el: DesignerElement, x: number, z: number, w: number, _h: number, rotY: number): Element3D[] {
  const meta = el.metadata as unknown as WallMetadata;
  const wallHeight = 2.5 * SCALE_FACTOR * 100;
  const thickness = (meta.thickness || 12) * SCALE_FACTOR;

  return [{
    id: el.id,
    type: "wall",
    position: [x, wallHeight / 2, z],
    rotation: [0, rotY, 0],
    scale: [w, wallHeight, thickness],
    color: el.style.fill || "#8D8D8D",
    geometry: "box",
  }];
}

function convertDanceFloor(el: DesignerElement, x: number, z: number, w: number, h: number, rotY: number): Element3D[] {
  const meta = el.metadata as unknown as DanceFloorMetadata;
  return [{
    id: el.id,
    type: "dance-floor",
    position: [x, 0.005, z],
    rotation: [0, rotY, 0],
    scale: [w, 0.01, h],
    color: el.style.fill || "#2D2D2D",
    emissive: meta.hasLedGrid ? "#111133" : undefined,
    geometry: meta.shape === "circle" ? "cylinder" : "box",
  }];
}

function convertStage(el: DesignerElement, x: number, z: number, w: number, h: number, rotY: number): Element3D[] {
  const meta = el.metadata as unknown as StageMetadata;
  const isChuppah = meta.subType === "chuppah";
  const stageHeight = (meta.elevationHeight || 30) * SCALE_FACTOR;
  const elements: Element3D[] = [];

  // Platform
  elements.push({
    id: el.id,
    type: isChuppah ? "chuppah-base" : "stage",
    position: [x, stageHeight / 2, z],
    rotation: [0, rotY, 0],
    scale: [w, stageHeight, h],
    color: el.style.fill || (isChuppah ? "#F5E6D3" : "#4A4A4A"),
    geometry: "box",
  });

  // Chuppah poles
  if (isChuppah) {
    const poleHeight = 2.0 * SCALE_FACTOR * 100;
    const poles: [number, number][] = [
      [-w / 2 + 0.02, -h / 2 + 0.02],
      [w / 2 - 0.02, -h / 2 + 0.02],
      [-w / 2 + 0.02, h / 2 - 0.02],
      [w / 2 - 0.02, h / 2 - 0.02],
    ];

    for (const [px, pz] of poles) {
      elements.push({
        id: `${el.id}-pole-${px}-${pz}`,
        type: "chuppah-pole",
        position: [x + px, stageHeight + poleHeight / 2, z + pz],
        rotation: [0, 0, 0],
        scale: [0.015, poleHeight, 0.015],
        color: "#C8A882",
        geometry: "cylinder",
      });
    }

    // Canopy (flat plane on top)
    elements.push({
      id: `${el.id}-canopy`,
      type: "chuppah-canopy",
      position: [x, stageHeight + poleHeight, z],
      rotation: [0, rotY, 0],
      scale: [w * 1.1, 0.005, h * 1.1],
      color: "#FFFFFF",
      geometry: "box",
      metadata: { transparent: true, opacity: 0.6 },
    });
  }

  return elements;
}

function convertBar(el: DesignerElement, x: number, z: number, w: number, h: number, rotY: number): Element3D[] {
  const meta = el.metadata as unknown as BarMetadata;
  const barHeight = 1.1 * SCALE_FACTOR * 100;
  const elements: Element3D[] = [];

  // Counter
  elements.push({
    id: el.id,
    type: "bar-counter",
    position: [x, barHeight / 2, z],
    rotation: [0, rotY, 0],
    scale: [w, barHeight, h],
    color: el.style.fill || "#5C4033",
    geometry: "box",
  });

  // Counter top
  elements.push({
    id: `${el.id}-top`,
    type: "bar-top",
    position: [x, barHeight, z],
    rotation: [0, rotY, 0],
    scale: [w + 0.02, 0.015, h + 0.02],
    color: "#8B7355",
    geometry: "box",
  });

  // Stools
  const stoolCount = meta.stoolCount || 4;
  for (let i = 0; i < stoolCount; i++) {
    const sx = x - w / 2 + (w / (stoolCount + 1)) * (i + 1);
    elements.push({
      id: `${el.id}-stool-${i}`,
      type: "stool",
      position: [sx, 0.35, z + h / 2 + 0.1],
      rotation: [0, 0, 0],
      scale: [0.03, 0.02, 0.03],
      color: "#8D8D8D",
      geometry: "cylinder",
    });
  }

  return elements;
}

function convertDecoration(el: DesignerElement, x: number, z: number, w: number, _h: number, _rotY: number): Element3D[] {
  const meta = el.metadata as unknown as DecorationMetadata;
  const r = Math.max(w, _h) / 2;

  if (meta.decorationType === "lighting") {
    return [{
      id: el.id,
      type: "light-fixture",
      position: [x, 2.0 * SCALE_FACTOR * 100, z],
      rotation: [0, 0, 0],
      scale: [0.05, 0.05, 0.05],
      color: "#FFD700",
      emissive: "#FFD700",
      geometry: "sphere",
      metadata: { isLight: true, intensity: meta.intensity === "high" ? 2 : meta.intensity === "medium" ? 1 : 0.5 },
    }];
  }

  return [{
    id: el.id,
    type: "decoration",
    position: [x, r / 2, z],
    rotation: [0, 0, 0],
    scale: [r, r, r],
    color: el.style.fill || "#FFF8E7",
    geometry: "sphere",
  }];
}

function convertEntrance(el: DesignerElement, x: number, z: number, w: number, h: number, rotY: number): Element3D[] {
  const meta = el.metadata as unknown as EntranceMetadata;
  const color = meta.isEmergency ? "#EF4444" : meta.direction === "out" ? "#F59E0B" : "#22C55E";

  return [{
    id: el.id,
    type: "entrance-marker",
    position: [x, 0.01, z],
    rotation: [0, rotY, 0],
    scale: [w, 0.02, h],
    color,
    emissive: color,
    geometry: "box",
  }];
}

function convertFurniture(el: DesignerElement, x: number, z: number, w: number, h: number, rotY: number): Element3D[] {
  const furnitureHeight = 0.4 * SCALE_FACTOR * 100;

  return [{
    id: el.id,
    type: "furniture",
    position: [x, furnitureHeight / 2, z],
    rotation: [0, rotY, 0],
    scale: [w, furnitureHeight, h],
    color: el.style.fill || "#A0845C",
    geometry: "box",
  }];
}
