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
  material?: {
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
  };
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

  // Tablecloth — slightly larger, slightly lower, semi-transparent white
  const clothScale: [number, number, number] = isRound
    ? [r * 1.05, 0.025, r * 1.05]
    : [w * 1.05, 0.025, h * 1.05];
  elements.push({
    id: `${el.id}-tablecloth`,
    type: "tablecloth",
    position: [x, tableHeight - 0.005, z],
    rotation: [0, rotY, 0],
    scale: clothScale,
    color: "#FFFFFF",
    geometry: isRound ? "cylinder" : "box",
    material: { roughness: 0.9, metalness: 0, transparent: true, opacity: 0.3 },
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

  // Detailed chairs
  const capacity = meta.capacity || 8;
  const chairDistance = isRound ? r + 0.15 : Math.max(w, h) / 2 + 0.15;
  for (let i = 0; i < capacity; i++) {
    const angle = (2 * Math.PI * i) / capacity;
    const cx = x + Math.cos(angle) * chairDistance;
    const cz = z + Math.sin(angle) * chairDistance;
    const chairMaterial = { roughness: 0.6, metalness: 0.05 };

    // Chair seat — box 0.04 x 0.005 x 0.04 at y=0.45
    elements.push({
      id: `${el.id}-chair-seat-${i}`,
      type: "chair-seat",
      position: [cx, 0.45, cz],
      rotation: [0, -angle, 0],
      scale: [0.04, 0.005, 0.04],
      color: "#E8E0D4",
      geometry: "box",
      material: chairMaterial,
    });

    // Chair backrest — box 0.04 x 0.08 x 0.005, tilted slightly (~5 deg), at y=0.52
    const backTilt = 0.09; // ~5 degrees tilt backward
    elements.push({
      id: `${el.id}-chair-back-${i}`,
      type: "chair-back",
      position: [cx + Math.cos(angle) * 0.018, 0.52, cz + Math.sin(angle) * 0.018],
      rotation: [Math.cos(-angle) * backTilt, -angle, Math.sin(-angle) * backTilt],
      scale: [0.04, 0.08, 0.005],
      color: "#D7CCC8",
      geometry: "box",
      material: chairMaterial,
    });

    // 4 chair legs — thin cylinders (radius=0.005, height=0.45)
    const chairLegOffsets: [number, number][] = [
      [-0.015, -0.015],
      [0.015, -0.015],
      [-0.015, 0.015],
      [0.015, 0.015],
    ];
    for (let li = 0; li < chairLegOffsets.length; li++) {
      const [dlx, dlz] = chairLegOffsets[li];
      // Rotate leg offset around the chair angle
      const rotatedDlx = dlx * Math.cos(-angle) - dlz * Math.sin(-angle);
      const rotatedDlz = dlx * Math.sin(-angle) + dlz * Math.cos(-angle);
      elements.push({
        id: `${el.id}-chair-leg-${i}-${li}`,
        type: "chair-leg",
        position: [cx + rotatedDlx, 0.225, cz + rotatedDlz],
        rotation: [0, 0, 0],
        scale: [0.005, 0.45, 0.005],
        color: "#5D4037",
        geometry: "cylinder",
        material: chairMaterial,
      });
    }
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
    material: { roughness: 0.1, metalness: 0.3 },
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

  // Stage stairs — 3 steps in front of the stage
  if (!isChuppah) {
    const stairCount = 3;
    const stairDepth = 0.08;
    const stairHeightStep = stageHeight / stairCount;
    const baseColor = el.style.fill || "#4A4A4A";

    for (let si = 0; si < stairCount; si++) {
      const stepY = stageHeight - stairHeightStep * (si + 1) + stairHeightStep / 2;
      const stepZ = z + h / 2 + stairDepth * (si + 0.5);
      const stepW = w + 0.02 * (si + 1); // Each step slightly wider

      // Lighten the color for stairs
      const lightenAmount = (si + 1) * 15;
      const r = Math.min(255, parseInt(baseColor.slice(1, 3), 16) + lightenAmount);
      const g = Math.min(255, parseInt(baseColor.slice(3, 5), 16) + lightenAmount);
      const b = Math.min(255, parseInt(baseColor.slice(5, 7), 16) + lightenAmount);
      const stepColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

      elements.push({
        id: `${el.id}-stair-${si}`,
        type: "stage-stair",
        position: [x, stepY, stepZ],
        rotation: [0, rotY, 0],
        scale: [stepW, stairHeightStep, stairDepth],
        color: stepColor,
        geometry: "box",
      });
    }
  }

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

    // Canopy (flat plane on top) with fabric material
    elements.push({
      id: `${el.id}-canopy`,
      type: "chuppah-canopy",
      position: [x, stageHeight + poleHeight, z],
      rotation: [0, rotY, 0],
      scale: [w * 1.1, 0.005, h * 1.1],
      color: "#FFFFFF",
      geometry: "box",
      metadata: { transparent: true, opacity: 0.6 },
      material: { roughness: 0.95, metalness: 0, transparent: true, opacity: 0.5 },
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

  // Detailed bar stools
  const stoolCount = meta.stoolCount || 4;
  const stoolMaterial = { roughness: 0.3, metalness: 0.6 };

  for (let i = 0; i < stoolCount; i++) {
    const sx = x - w / 2 + (w / (stoolCount + 1)) * (i + 1);
    const sz = z + h / 2 + 0.1;

    // Stool seat disk — cylinder (radius=0.04, height=0.02) at y=0.7
    elements.push({
      id: `${el.id}-stool-seat-${i}`,
      type: "stool-seat",
      position: [sx, 0.7, sz],
      rotation: [0, 0, 0],
      scale: [0.04, 0.02, 0.04],
      color: "#8D8D8D",
      geometry: "cylinder",
      material: stoolMaterial,
    });

    // Stool stem — thin cylinder (radius=0.008, height=0.5)
    elements.push({
      id: `${el.id}-stool-stem-${i}`,
      type: "stool-stem",
      position: [sx, 0.44, sz],
      rotation: [0, 0, 0],
      scale: [0.008, 0.5, 0.008],
      color: "#707070",
      geometry: "cylinder",
      material: stoolMaterial,
    });

    // Stool base — flat cylinder (radius=0.05, height=0.01)
    elements.push({
      id: `${el.id}-stool-base-${i}`,
      type: "stool-base",
      position: [sx, 0.005, sz],
      rotation: [0, 0, 0],
      scale: [0.05, 0.01, 0.05],
      color: "#606060",
      geometry: "cylinder",
      material: stoolMaterial,
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
