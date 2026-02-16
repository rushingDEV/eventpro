import type { DesignerElement, DesignerSuggestion } from "./types";
import { generateElementId } from "./store";

// ── Constants ──
const MIN_TABLE_SPACING = 30; // ~1.2m
const WHEELCHAIR_SPACING = 50; // ~2m
const DANCE_FLOOR_PER_GUEST = 0.4; // m² per guest (industry standard)
const PX_PER_METER = 25; // 25 pixels = 1 meter at standard zoom

// ── Zone types ──
type ZoneType = "dining" | "dancing" | "ceremony" | "bar" | "entrance" | "lounge";

interface Zone {
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── AI Layout Generator ──

interface LayoutInput {
  venueWidth: number; // pixels
  venueHeight: number;
  guestCount: number;
  tableCapacity: number;
  includeChuppah: boolean;
  includeBar: boolean;
  includeDjBooth: boolean;
  includePhotosBooth: boolean;
  layoutStyle: "arcs" | "grid" | "mixed";
}

/**
 * Generate an optimal layout for the given parameters.
 */
export function generateLayout(input: LayoutInput): DesignerElement[] {
  const {
    venueWidth,
    venueHeight,
    guestCount,
    tableCapacity,
    includeChuppah,
    includeBar,
    includeDjBooth,
    includePhotosBooth,
    layoutStyle,
  } = input;

  const elements: DesignerElement[] = [];
  const cx = venueWidth / 2;
  const cy = venueHeight / 2;
  const tableCount = Math.ceil(guestCount / tableCapacity);
  const tableRadius = tableCapacity <= 8 ? 50 : 55;
  let tableNum = 1;

  // ── Zone allocation ──
  const zones = allocateZones(venueWidth, venueHeight, guestCount, includeChuppah);

  // ── Dance floor ──
  const danceZone = zones.find((z) => z.type === "dancing");
  if (danceZone) {
    elements.push(makeElement("dance-floor", "רחבת ריקודים", danceZone.x, danceZone.y, danceZone.width, danceZone.height, {
      shape: "rect",
      hasLedGrid: false,
    }, { fill: "#2D2D2D", stroke: "#555" }));
  }

  // ── Stage ──
  const stageY = (danceZone?.y || cy) - (danceZone?.height || 200) / 2 - 60;
  elements.push(makeElement("stage", "במה", cx, stageY, 200, 70, {
    elevationHeight: 40,
    hasSteps: true,
    subType: "stage",
  }, { fill: "#4A4A4A", stroke: "#333" }));

  // ── Chuppah ──
  if (includeChuppah) {
    elements.push(makeElement("chuppah", "חופה", cx, stageY - 90, 120, 100, {
      elevationHeight: 20,
      hasSteps: false,
      subType: "chuppah",
    }, { fill: "#F5E6D3", stroke: "#C8A882" }));
  }

  // ── Tables ──
  const danceFloorCenter = { x: danceZone?.x || cx, y: danceZone?.y || cy };
  const danceFloorRadius = Math.max(danceZone?.width || 200, danceZone?.height || 200) / 2;

  if (layoutStyle === "arcs") {
    placeTablesInArcs(elements, tableCount, tableCapacity, tableRadius, danceFloorCenter, danceFloorRadius, () => tableNum++, venueWidth, venueHeight);
  } else if (layoutStyle === "grid") {
    placeTablesInGrid(elements, tableCount, tableCapacity, tableRadius, danceFloorCenter, danceFloorRadius, () => tableNum++, venueWidth, venueHeight);
  } else {
    // Mixed: first ring arcs, rest grid
    const arcCount = Math.min(Math.floor(tableCount * 0.4), 12);
    placeTablesInArcs(elements, arcCount, tableCapacity, tableRadius, danceFloorCenter, danceFloorRadius, () => tableNum++, venueWidth, venueHeight);
    placeTablesInGrid(elements, tableCount - arcCount, tableCapacity, tableRadius, danceFloorCenter, danceFloorRadius + 160, () => tableNum++, venueWidth, venueHeight);
  }

  // ── Bar ──
  if (includeBar) {
    elements.push(makeElement("bar", "בר", 120, cy, 150, 40, {
      stoolCount: 5,
      barType: "cocktail",
    }, { fill: "#5C4033", stroke: "#3E2723" }));
  }

  // ── DJ Booth ──
  if (includeDjBooth) {
    elements.push(makeElement("dj-booth", "DJ", cx + (danceZone?.width || 200) / 2 + 50, danceZone?.y || cy, 80, 50, {
      stoolCount: 0,
      barType: "cocktail",
    }, { fill: "#3D3D3D", stroke: "#222" }));
  }

  // ── Photo Booth ──
  if (includePhotosBooth) {
    elements.push(makeElement("photo-booth", "פוטו בות׳", venueWidth - 80, venueHeight - 80, 80, 80, {
      decorationType: "photo-booth",
    }, { fill: "#F0E6FF", stroke: "#A855F7" }));
  }

  // ── Entrance ──
  elements.push(makeElement("entrance", "כניסה", cx, venueHeight - 40, 40, 40, {
    direction: "in",
    isEmergency: false,
  }, { fill: "#E8F5E9", stroke: "#22C55E" }));

  // ── Emergency exit ──
  elements.push(makeElement("exit", "יציאת חירום", 40, venueHeight / 2, 40, 40, {
    direction: "out",
    isEmergency: true,
  }, { fill: "#FEE2E2", stroke: "#EF4444" }));

  return elements;
}

function allocateZones(
  venueWidth: number,
  venueHeight: number,
  guestCount: number,
  includeChuppah: boolean,
): Zone[] {
  const cx = venueWidth / 2;
  const cy = venueHeight * 0.4;
  const danceFloorArea = guestCount * DANCE_FLOOR_PER_GUEST * PX_PER_METER * PX_PER_METER;
  const danceSize = Math.sqrt(danceFloorArea);
  const clampedSize = Math.min(Math.max(danceSize, 120), 350);

  return [
    { type: "dancing", x: cx, y: cy, width: clampedSize, height: clampedSize },
    { type: "ceremony", x: cx, y: cy - clampedSize / 2 - (includeChuppah ? 200 : 100), width: 200, height: includeChuppah ? 200 : 100 },
    { type: "bar", x: 120, y: cy, width: 150, height: 40 },
    { type: "entrance", x: cx, y: venueHeight - 40, width: 40, height: 40 },
  ];
}

function placeTablesInArcs(
  elements: DesignerElement[],
  count: number,
  capacity: number,
  radius: number,
  center: { x: number; y: number },
  danceRadius: number,
  nextNum: () => number,
  _vw: number,
  _vh: number,
) {
  const ringGap = radius * 2 + MIN_TABLE_SPACING;
  let placed = 0;
  let ringIdx = 0;

  while (placed < count) {
    const ringRadius = danceRadius + 40 + ringIdx * ringGap;
    const circumference = Math.PI * ringRadius; // half circle
    const maxPerRing = Math.floor(circumference / (radius * 2 + MIN_TABLE_SPACING));
    const toPlace = Math.min(maxPerRing, count - placed);

    const startAngle = Math.PI * 0.1;
    const endAngle = Math.PI * 0.9;

    for (let i = 0; i < toPlace; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / Math.max(1, toPlace - 1);
      const tx = center.x + Math.cos(angle + Math.PI / 2) * ringRadius;
      const ty = center.y + Math.sin(angle + Math.PI / 2) * ringRadius;
      const num = nextNum();

      elements.push(makeTableElement(num, tx, ty, capacity, radius));
      placed++;
    }
    ringIdx++;
  }
}

function placeTablesInGrid(
  elements: DesignerElement[],
  count: number,
  capacity: number,
  radius: number,
  center: { x: number; y: number },
  startY: number,
  nextNum: () => number,
  vw: number,
  _vh: number,
) {
  const spacing = radius * 2 + MIN_TABLE_SPACING;
  const cols = Math.floor((vw - 100) / spacing);
  let placed = 0;
  let row = 0;

  while (placed < count) {
    const toPlace = Math.min(cols, count - placed);
    const startX = center.x - ((toPlace - 1) * spacing) / 2;

    for (let col = 0; col < toPlace; col++) {
      const tx = startX + col * spacing;
      const ty = startY + row * spacing;
      const num = nextNum();

      elements.push(makeTableElement(num, tx, ty, capacity, radius));
      placed++;
    }
    row++;
  }
}

function makeTableElement(num: number, x: number, y: number, capacity: number, radius: number): DesignerElement {
  return {
    id: generateElementId(),
    type: "table",
    x,
    y,
    width: radius * 2,
    height: radius * 2,
    rotation: 0,
    zIndex: num,
    locked: false,
    visible: true,
    name: `שולחן ${num}`,
    style: { fill: "#8B7355", stroke: "#5D4037", strokeWidth: 2, opacity: 1 },
    metadata: {
      tableShape: "ROUND",
      capacity,
      radius,
      isVIP: false,
      tableNumber: num,
      guestIds: [],
    },
  };
}

function makeElement(
  type: DesignerElement["type"],
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  meta: Record<string, unknown>,
  style: Partial<DesignerElement["style"]>,
): DesignerElement {
  return {
    id: generateElementId(),
    type,
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    zIndex: 100,
    locked: false,
    visible: true,
    name,
    style: { fill: "#8B7355", stroke: "#5D4037", strokeWidth: 2, opacity: 1, ...style },
    metadata: meta,
  };
}

// ── Analyze & Suggest ──

/**
 * Analyze current layout and return suggestions for improvement.
 */
export function analyzeLayout(
  elements: DesignerElement[],
  guestCount: number,
  canvasWidth: number,
  canvasHeight: number,
): DesignerSuggestion[] {
  const suggestions: DesignerSuggestion[] = [];
  let sugId = 0;

  const tables = elements.filter((e) => e.type === "table");
  const danceFloors = elements.filter((e) => e.type === "dance-floor");
  const entrances = elements.filter((e) => e.type === "entrance" || e.type === "exit");
  const emergencyExits = elements.filter(
    (e) => e.type === "exit" && (e.metadata as Record<string, unknown>).isEmergency,
  );

  // 1. Total capacity check
  const totalCapacity = tables.reduce(
    (sum, t) => sum + ((t.metadata as Record<string, unknown>).capacity as number || 8),
    0,
  );
  if (totalCapacity < guestCount) {
    const deficit = guestCount - totalCapacity;
    const tablesToAdd = Math.ceil(deficit / 10);
    suggestions.push({
      id: `s-${sugId++}`,
      type: "capacity",
      message: `חסרים ${deficit} מקומות ישיבה. מומלץ להוסיף ${tablesToAdd} שולחנות.`,
      priority: "high",
      affectedElementIds: tables.map((t) => t.id),
    });
  } else if (totalCapacity > guestCount * 1.3) {
    suggestions.push({
      id: `s-${sugId++}`,
      type: "optimization",
      message: `יש עודף של ${totalCapacity - guestCount} מקומות. שקלו להוריד שולחנות כדי להרחיב מעברים.`,
      priority: "low",
    });
  }

  // 2. Dance floor size
  if (danceFloors.length > 0) {
    const danceArea = danceFloors.reduce((sum, d) => sum + d.width * d.height, 0);
    const danceAreaM2 = danceArea / (PX_PER_METER * PX_PER_METER);
    const recommendedM2 = guestCount * DANCE_FLOOR_PER_GUEST;

    if (danceAreaM2 < recommendedM2 * 0.7) {
      suggestions.push({
        id: `s-${sugId++}`,
        type: "spacing",
        message: `רחבת הריקודים קטנה מדי (${Math.round(danceAreaM2)} מ"ר). מומלץ ${Math.round(recommendedM2)} מ"ר ל-${guestCount} אורחים.`,
        priority: "medium",
        affectedElementIds: danceFloors.map((d) => d.id),
      });
    }
  } else if (guestCount > 30) {
    suggestions.push({
      id: `s-${sugId++}`,
      type: "layout",
      message: "אין רחבת ריקודים. מומלץ להוסיף אחת.",
      priority: "medium",
    });
  }

  // 3. Table spacing
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const a = tables[i];
      const b = tables[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (a.width + b.width) / 2 + MIN_TABLE_SPACING;

      if (dist < minDist) {
        suggestions.push({
          id: `s-${sugId++}`,
          type: "spacing",
          message: `שולחנות "${a.name}" ו-"${b.name}" קרובים מדי (${Math.round(dist)}px). מרחק מינימלי: ${Math.round(minDist)}px.`,
          priority: "medium",
          affectedElementIds: [a.id, b.id],
        });
      }
    }
  }

  // 4. Entrance check
  if (entrances.length === 0) {
    suggestions.push({
      id: `s-${sugId++}`,
      type: "safety",
      message: "אין כניסה או יציאה מסומנת. הוסיפו לפחות כניסה אחת.",
      priority: "high",
    });
  }

  // 5. Emergency exit check
  if (emergencyExits.length === 0 && guestCount > 50) {
    suggestions.push({
      id: `s-${sugId++}`,
      type: "safety",
      message: "אין יציאת חירום מסומנת. נדרש לפי תקנות בטיחות.",
      priority: "critical",
    });
  }

  // 6. Elements out of bounds
  for (const el of elements) {
    if (el.x < 0 || el.y < 0 || el.x > canvasWidth || el.y > canvasHeight) {
      suggestions.push({
        id: `s-${sugId++}`,
        type: "layout",
        message: `"${el.name}" מחוץ לגבולות הקנבס.`,
        priority: "low",
        affectedElementIds: [el.id],
      });
    }
  }

  // 7. Flow: entrance blocked by table
  for (const entrance of entrances) {
    for (const table of tables) {
      const dx = entrance.x - table.x;
      const dy = entrance.y - table.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < table.width / 2 + 60) {
        suggestions.push({
          id: `s-${sugId++}`,
          type: "flow",
          message: `"${table.name}" חוסם את "${entrance.name}". הרחיקו את השולחן לפחות 60px.`,
          priority: "high",
          affectedElementIds: [entrance.id, table.id],
        });
      }
    }
  }

  return suggestions;
}
