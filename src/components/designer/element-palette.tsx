"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Circle,
  Square,
  RectangleHorizontal,
  Minus,
  DoorOpen,
  LogOut,
  Music,
  UtensilsCrossed,
  Gift,
  Cake,
  Flower2,
  Lightbulb,
  Camera,
  Type,
  Armchair,
  Sofa,
  Table2,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";
import type {
  PaletteCategory,
  PaletteItem,
  ElementStyle,
  DesignerElement,
} from "@/lib/designer/types";
import { PALETTE_CATEGORY_LABELS } from "@/lib/designer/types";
import { generateElementId } from "@/lib/designer/store";

// ── Default style ──
const defaultStyle: ElementStyle = {
  fill: "#8B7355",
  stroke: "#5D4037",
  strokeWidth: 2,
  opacity: 1,
};

// ── Palette items ──
const PALETTE_ITEMS: PaletteItem[] = [
  // Seating
  { type: "table", label: "שולחן עגול 8", icon: "circle", category: "seating", defaultWidth: 100, defaultHeight: 100, defaultStyle: { ...defaultStyle }, defaultMetadata: { tableShape: "ROUND", capacity: 8, radius: 50, isVIP: false, tableNumber: 0, guestIds: [] } },
  { type: "table", label: "שולחן עגול 10", icon: "circle", category: "seating", defaultWidth: 110, defaultHeight: 110, defaultStyle: { ...defaultStyle }, defaultMetadata: { tableShape: "ROUND", capacity: 10, radius: 55, isVIP: false, tableNumber: 0, guestIds: [] } },
  { type: "table", label: "שולחן עגול 12", icon: "circle", category: "seating", defaultWidth: 120, defaultHeight: 120, defaultStyle: { ...defaultStyle }, defaultMetadata: { tableShape: "ROUND", capacity: 12, radius: 60, isVIP: false, tableNumber: 0, guestIds: [] } },
  { type: "table", label: "שולחן מלבני", icon: "rect-h", category: "seating", defaultWidth: 120, defaultHeight: 60, defaultStyle: { ...defaultStyle }, defaultMetadata: { tableShape: "RECTANGLE", capacity: 8, isVIP: false, tableNumber: 0, guestIds: [] } },
  { type: "table", label: "שולחן ארוך", icon: "rect-h", category: "seating", defaultWidth: 200, defaultHeight: 50, defaultStyle: { ...defaultStyle }, defaultMetadata: { tableShape: "LONG", capacity: 12, isVIP: false, tableNumber: 0, guestIds: [] } },
  { type: "table", label: "שולחן מרובע", icon: "square", category: "seating", defaultWidth: 80, defaultHeight: 80, defaultStyle: { ...defaultStyle }, defaultMetadata: { tableShape: "SQUARE", capacity: 4, isVIP: false, tableNumber: 0, guestIds: [] } },

  // Structure
  { type: "wall", label: "קיר", icon: "minus", category: "structure", defaultWidth: 200, defaultHeight: 12, defaultStyle: { fill: "#8D8D8D", stroke: "#6B6B6B", strokeWidth: 1, opacity: 1 }, defaultMetadata: { thickness: 12, hasDoor: false } },
  { type: "wall", label: "קיר + דלת", icon: "door", category: "structure", defaultWidth: 200, defaultHeight: 12, defaultStyle: { fill: "#8D8D8D", stroke: "#6B6B6B", strokeWidth: 1, opacity: 1 }, defaultMetadata: { thickness: 12, hasDoor: true, doorPosition: 0.5, doorWidth: 40 } },
  { type: "separator", label: "מחיצה", icon: "minus", category: "structure", defaultWidth: 120, defaultHeight: 6, defaultStyle: { fill: "#B0A090", stroke: "#8A7A6A", strokeWidth: 1, opacity: 0.8 }, defaultMetadata: { thickness: 6, hasDoor: false } },
  { type: "entrance", label: "כניסה", icon: "door-open", category: "structure", defaultWidth: 40, defaultHeight: 40, defaultStyle: { fill: "#E8F5E9", stroke: "#22C55E", strokeWidth: 2, opacity: 1 }, defaultMetadata: { direction: "in", isEmergency: false } },
  { type: "exit", label: "יציאה", icon: "log-out", category: "structure", defaultWidth: 40, defaultHeight: 40, defaultStyle: { fill: "#FEF3C7", stroke: "#F59E0B", strokeWidth: 2, opacity: 1 }, defaultMetadata: { direction: "out", isEmergency: false } },
  { type: "exit", label: "יציאת חירום", icon: "log-out", category: "structure", defaultWidth: 40, defaultHeight: 40, defaultStyle: { fill: "#FEE2E2", stroke: "#EF4444", strokeWidth: 2, opacity: 1 }, defaultMetadata: { direction: "out", isEmergency: true } },

  // Central
  { type: "dance-floor", label: "רחבת ריקודים", icon: "square", category: "central", defaultWidth: 200, defaultHeight: 200, defaultStyle: { fill: "#2D2D2D", stroke: "#555", strokeWidth: 2, opacity: 1 }, defaultMetadata: { shape: "rect", hasLedGrid: false } },
  { type: "stage", label: "במה", icon: "rect-h", category: "central", defaultWidth: 180, defaultHeight: 80, defaultStyle: { fill: "#4A4A4A", stroke: "#333", strokeWidth: 2, opacity: 1 }, defaultMetadata: { elevationHeight: 40, hasSteps: true, subType: "stage" } },
  { type: "chuppah", label: "חופה", icon: "square", category: "central", defaultWidth: 120, defaultHeight: 100, defaultStyle: { fill: "#F5E6D3", stroke: "#C8A882", strokeWidth: 2, opacity: 1 }, defaultMetadata: { elevationHeight: 20, hasSteps: false, subType: "chuppah" } },
  { type: "dj-booth", label: "DJ", icon: "music", category: "central", defaultWidth: 80, defaultHeight: 50, defaultStyle: { fill: "#3D3D3D", stroke: "#222", strokeWidth: 2, opacity: 1 }, defaultMetadata: { stoolCount: 0, barType: "cocktail" } },

  // Food & Drink
  { type: "bar", label: "בר קוקטיילים", icon: "utensils", category: "food-drink", defaultWidth: 150, defaultHeight: 40, defaultStyle: { fill: "#5C4033", stroke: "#3E2723", strokeWidth: 2, opacity: 1 }, defaultMetadata: { stoolCount: 5, barType: "cocktail" } },
  { type: "buffet", label: "בופה", icon: "utensils", category: "food-drink", defaultWidth: 180, defaultHeight: 50, defaultStyle: { fill: "#5C4033", stroke: "#3E2723", strokeWidth: 2, opacity: 1 }, defaultMetadata: { stoolCount: 0, barType: "buffet" } },
  { type: "gift-table", label: "שולחן מתנות", icon: "gift", category: "food-drink", defaultWidth: 100, defaultHeight: 60, defaultStyle: { fill: "#A0845C", stroke: "#7C6548", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { furnitureType: "gift-table" } },
  { type: "custom", label: "עוגה", icon: "cake", category: "food-drink", defaultWidth: 60, defaultHeight: 60, defaultStyle: { fill: "#FFF0DB", stroke: "#D4A574", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { furnitureType: "cake-table" } },

  // Decoration
  { type: "flower-arrangement", label: "פרחים", icon: "flower", category: "decoration", defaultWidth: 40, defaultHeight: 40, defaultStyle: { fill: "#FFF8E7", stroke: "#D4A574", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { decorationType: "flowers", intensity: "medium" } },
  { type: "lighting", label: "תאורה", icon: "lightbulb", category: "decoration", defaultWidth: 30, defaultHeight: 30, defaultStyle: { fill: "#FFFBEB", stroke: "#F59E0B", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { decorationType: "lighting", intensity: "medium" } },
  { type: "sign", label: "שילוט", icon: "type", category: "decoration", defaultWidth: 60, defaultHeight: 30, defaultStyle: { fill: "#FFF8E7", stroke: "#D4A574", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { decorationType: "sign", text: "" } },
  { type: "photo-booth", label: "פוטו בות׳", icon: "camera", category: "decoration", defaultWidth: 80, defaultHeight: 80, defaultStyle: { fill: "#F0E6FF", stroke: "#A855F7", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { decorationType: "photo-booth" } },

  // Furniture
  { type: "lounge", label: "כורסה", icon: "armchair", category: "furniture", defaultWidth: 50, defaultHeight: 50, defaultStyle: { fill: "#A0845C", stroke: "#7C6548", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { furnitureType: "armchair" } },
  { type: "lounge", label: "ספה", icon: "sofa", category: "furniture", defaultWidth: 100, defaultHeight: 50, defaultStyle: { fill: "#A0845C", stroke: "#7C6548", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { furnitureType: "sofa" } },
  { type: "custom", label: "שולחן צד", icon: "table", category: "furniture", defaultWidth: 40, defaultHeight: 40, defaultStyle: { fill: "#A0845C", stroke: "#7C6548", strokeWidth: 1.5, opacity: 1 }, defaultMetadata: { furnitureType: "side-table", customShape: "circle" } },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  circle: <Circle className="h-4 w-4" />,
  square: <Square className="h-4 w-4" />,
  "rect-h": <RectangleHorizontal className="h-4 w-4" />,
  minus: <Minus className="h-4 w-4" />,
  door: <DoorOpen className="h-4 w-4" />,
  "door-open": <DoorOpen className="h-4 w-4" />,
  "log-out": <LogOut className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  utensils: <UtensilsCrossed className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
  cake: <Cake className="h-4 w-4" />,
  flower: <Flower2 className="h-4 w-4" />,
  lightbulb: <Lightbulb className="h-4 w-4" />,
  type: <Type className="h-4 w-4" />,
  camera: <Camera className="h-4 w-4" />,
  armchair: <Armchair className="h-4 w-4" />,
  sofa: <Sofa className="h-4 w-4" />,
  table: <Table2 className="h-4 w-4" />,
};

// Group items by category
const categorizedItems = Object.entries(PALETTE_CATEGORY_LABELS).map(([cat, label]) => ({
  category: cat as PaletteCategory,
  label,
  items: PALETTE_ITEMS.filter((item) => item.category === cat),
}));

let _tableCounter = 0;

export function ElementPalette() {
  const [expandedCategories, setExpandedCategories] = useState<Set<PaletteCategory>>(
    new Set(["seating", "central", "structure"]),
  );

  const toggleCategory = (cat: PaletteCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    const el: DesignerElement = {
      id: generateElementId(),
      type: item.type,
      x: 0,
      y: 0,
      width: item.defaultWidth,
      height: item.defaultHeight,
      rotation: 0,
      zIndex: Date.now(),
      locked: false,
      visible: true,
      name: item.label,
      style: { ...item.defaultStyle },
      metadata: {
        ...item.defaultMetadata,
        ...(item.type === "table" ? { tableNumber: ++_tableCounter } : {}),
      },
    };
    e.dataTransfer.setData("application/designer-element", JSON.stringify(el));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="w-[220px] border-l bg-background/95 flex flex-col h-full">
      <div className="px-3 py-2.5 border-b">
        <h3 className="text-sm font-bold">אלמנטים</h3>
        <p className="text-[10px] text-muted-foreground">גררו לקנבס</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {categorizedItems.map(({ category, label, items }) => (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                <span>{label}</span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronLeft className="h-3 w-3" />
                )}
              </button>

              {expandedCategories.has(category) && (
                <div className="grid grid-cols-2 gap-1 px-1 pb-2">
                  {items.map((item, idx) => (
                    <div
                      key={`${item.type}-${idx}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-colors"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                        {ICON_MAP[item.icon] || <Square className="h-4 w-4" />}
                      </div>
                      <span className="text-[10px] text-center leading-tight">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
