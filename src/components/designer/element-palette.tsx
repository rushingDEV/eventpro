"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  Clock,
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

// ── Category colors for accent bars ──
const CATEGORY_COLORS: Record<PaletteCategory, string> = {
  seating: "#C44569",
  structure: "#888888",
  central: "#D4A04A",
  "food-drink": "#7C5C3C",
  decoration: "#9B59B6",
  furniture: "#5C8A5C",
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

// Group items by category
const categorizedItems = Object.entries(PALETTE_CATEGORY_LABELS).map(([cat, label]) => ({
  category: cat as PaletteCategory,
  label,
  items: PALETTE_ITEMS.filter((item) => item.category === cat),
}));

let _tableCounter = 0;

// ── Draw thumbnail on a canvas ──
function drawThumbnail(canvas: HTMLCanvasElement, item: PaletteItem) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = 48;
  canvas.width = s;
  canvas.height = s;
  ctx.clearRect(0, 0, s, s);

  const cx = s / 2;
  const cy = s / 2;
  const fill = item.defaultStyle.fill || "#8B7355";
  const stroke = item.defaultStyle.stroke || "#5D4037";

  switch (item.type) {
    case "table": {
      const shape = item.defaultMetadata?.tableShape;
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      if (shape === "ROUND" || shape === "OVAL") {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // chairs
        const cap = (item.defaultMetadata?.capacity as number) || 8;
        ctx.fillStyle = "#D7CCC8";
        for (let i = 0; i < cap; i++) {
          const a = (Math.PI * 2 * i) / cap;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (shape === "LONG") {
        ctx.beginPath();
        ctx.roundRect(cx - 20, cy - 6, 40, 12, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#D7CCC8";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(cx - 16 + i * 8, cy - 11, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx - 16 + i * 8, cy + 11, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.roundRect(cx - 14, cy - 8, 28, 16, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#D7CCC8";
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(cx - 10 + i * 10, cy - 13, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx - 10 + i * 10, cy + 13, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case "wall":
    case "separator": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy - 3, 40, 6, 2);
      ctx.fill();
      ctx.stroke();
      if (item.defaultMetadata?.hasDoor) {
        ctx.strokeStyle = "#A0522D";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx + 5, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      break;
    }
    case "entrance":
    case "exit": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 10, cy - 10, 20, 20, 5);
      ctx.fill();
      ctx.stroke();
      // arrow
      ctx.strokeStyle = item.defaultMetadata?.isEmergency ? "#DC2626" : stroke;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 5);
      ctx.lineTo(cx, cy - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 2);
      ctx.lineTo(cx, cy - 6);
      ctx.lineTo(cx + 4, cy - 2);
      ctx.fill();
      break;
    }
    case "dance-floor": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 14, 28, 28, 2);
      ctx.fill();
      ctx.stroke();
      // checkerboard
      ctx.fillStyle = "#383838";
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(cx - 14 + c * 7, cy - 14 + r * 7, 7, 7);
          }
        }
      }
      break;
    }
    case "stage":
    case "chuppah": {
      const isChuppah = item.defaultMetadata?.subType === "chuppah";
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 16, cy - 10, 32, 20, 3);
      ctx.fill();
      ctx.stroke();
      if (isChuppah) {
        // corner dots
        ctx.fillStyle = "#C8A882";
        [[cx - 14, cy - 8], [cx + 14, cy - 8], [cx - 14, cy + 8], [cx + 14, cy + 8]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // steps
        ctx.fillStyle = "#5A5A5A";
        ctx.fillRect(cx - 16, cy + 10, 32, 3);
        ctx.fillStyle = "#6A6A6A";
        ctx.fillRect(cx - 14, cy + 13, 28, 2);
      }
      break;
    }
    case "dj-booth": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 12, cy - 8, 24, 16, 3);
      ctx.fill();
      ctx.stroke();
      // music note
      ctx.fillStyle = "#888";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DJ", cx, cy + 5);
      break;
    }
    case "bar":
    case "buffet": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 18, cy - 6, 36, 12, 3);
      ctx.fill();
      ctx.stroke();
      // counter top highlight
      ctx.fillStyle = "#8B7355";
      ctx.fillRect(cx - 16, cy - 5, 32, 3);
      // stools
      ctx.fillStyle = "#8D8D8D";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(cx - 12 + i * 8, cy + 12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "gift-table": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 12, cy - 8, 24, 16, 3);
      ctx.fill();
      ctx.stroke();
      // bow
      ctx.strokeStyle = "#D4A574";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 2);
      ctx.lineTo(cx, cy - 5);
      ctx.lineTo(cx + 5, cy - 2);
      ctx.stroke();
      break;
    }
    case "flower-arrangement": {
      // petals
      const petalColors = ["#FFB6C1", "#FFDAB9", "#FFE4E1", "#FFC0CB", "#F8C8DC"];
      petalColors.forEach((c, i) => {
        const a = (Math.PI * 2 * i) / petalColors.length;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      // center
      ctx.fillStyle = "#DAA520";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "lighting": {
      // bulb
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1;
      ctx.stroke();
      // rays
      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 9, cy - 4 + Math.sin(a) * 9);
        ctx.lineTo(cx + Math.cos(a) * 13, cy - 4 + Math.sin(a) * 13);
        ctx.stroke();
      }
      // base
      ctx.fillStyle = "#888";
      ctx.fillRect(cx - 3, cy + 3, 6, 4);
      break;
    }
    case "sign": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 7, 28, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8B6F47";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ABC", cx, cy + 3);
      break;
    }
    case "photo-booth": {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cx - 12, cy - 10, 24, 20, 4);
      ctx.fill();
      ctx.stroke();
      // lens
      ctx.strokeStyle = "#7C3AED";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#DDD6FE";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "lounge": {
      const ft = item.defaultMetadata?.furnitureType;
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      if (ft === "sofa") {
        ctx.beginPath();
        ctx.roundRect(cx - 16, cy - 8, 32, 16, 6);
        ctx.fill();
        ctx.stroke();
        // armrests
        ctx.fillStyle = "#8A6C42";
        ctx.fillRect(cx - 18, cy - 6, 4, 12);
        ctx.fillRect(cx + 14, cy - 6, 4, 12);
      } else {
        ctx.beginPath();
        ctx.roundRect(cx - 10, cy - 10, 20, 20, 5);
        ctx.fill();
        ctx.stroke();
        // armrests
        ctx.fillStyle = "#8A6C42";
        ctx.fillRect(cx - 12, cy - 6, 3, 12);
        ctx.fillRect(cx + 9, cy - 6, 3, 12);
      }
      break;
    }
    case "custom": {
      const ft = item.defaultMetadata?.furnitureType;
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      if (ft === "side-table" || item.defaultMetadata?.customShape === "circle") {
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (ft === "cake-table") {
        ctx.beginPath();
        ctx.roundRect(cx - 10, cy - 4, 20, 12, 2);
        ctx.fill();
        ctx.stroke();
        // tiered cake
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(cx - 7, cy - 10, 14, 6);
        ctx.fillRect(cx - 5, cy - 15, 10, 5);
        ctx.fillRect(cx - 3, cy - 19, 6, 4);
      } else {
        ctx.beginPath();
        ctx.roundRect(cx - 10, cy - 10, 20, 20, 3);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }
    default: {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 10, cy - 10, 20, 20, 3);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// ── Thumbnail Component ──
function PaletteThumbnail({ item }: { item: PaletteItem }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawThumbnail(canvasRef.current, item);
    }
  }, [item]);

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={48}
      className="w-12 h-12 rounded-lg"
      style={{ imageRendering: "auto" }}
    />
  );
}

export function ElementPalette() {
  const [expandedCategories, setExpandedCategories] = useState<Set<PaletteCategory>>(
    new Set(["seating", "central", "structure"]),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [recentItems, setRecentItems] = useState<PaletteItem[]>([]);

  const toggleCategory = (cat: PaletteCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const addToRecent = useCallback((item: PaletteItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.label !== item.label);
      return [item, ...filtered].slice(0, 6);
    });
  }, []);

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
    addToRecent(item);

    // Create a custom drag image
    const ghost = document.createElement("canvas");
    ghost.width = 64;
    ghost.height = 64;
    drawThumbnail(ghost, item);
    ghost.style.position = "absolute";
    ghost.style.top = "-1000px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 32, 32);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  // Filter items by search
  const filteredItems = searchTerm.trim()
    ? PALETTE_ITEMS.filter((item) => item.label.includes(searchTerm.trim()))
    : null;

  return (
    <div className="w-[230px] border-l designer-glass flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b">
        <h3 className="text-sm font-bold">אלמנטים</h3>
        <p className="text-[10px] text-muted-foreground/70">גררו לקנבס</p>
      </div>

      {/* Search */}
      <div className="px-2.5 py-2 border-b">
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            placeholder="חיפוש אלמנט..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 text-xs pr-8 bg-muted/40 border-transparent focus:border-primary/30"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Search results */}
          {filteredItems ? (
            <div className="grid grid-cols-2 gap-1.5 px-1 pb-2">
              {filteredItems.map((item, idx) => (
                <PaletteItemCard key={`search-${idx}`} item={item} onDragStart={handleDragStart} />
              ))}
              {filteredItems.length === 0 && (
                <p className="col-span-2 text-center text-xs text-muted-foreground/50 py-4">
                  לא נמצאו תוצאות
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Recently used */}
              {recentItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-[10px] font-medium text-muted-foreground/60">אחרונים</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-1 pb-2">
                    {recentItems.map((item, idx) => (
                      <PaletteItemCard key={`recent-${idx}`} item={item} onDragStart={handleDragStart} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized items */}
              {categorizedItems.map(({ category, label, items }) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[category] }}
                      />
                      <span>{label}</span>
                      <span className="text-[9px] font-normal text-muted-foreground/40">{items.length}</span>
                    </div>
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronLeft className="h-3 w-3" />
                    )}
                  </button>

                  <div className={`section-collapse ${expandedCategories.has(category) ? "open" : ""}`}>
                    <div>
                      <div
                        className="grid grid-cols-2 gap-1.5 px-1 pb-2"
                        style={{ borderInlineEnd: `2px solid ${CATEGORY_COLORS[category]}20` }}
                      >
                        {items.map((item, idx) => (
                          <PaletteItemCard key={`${item.type}-${idx}`} item={item} onDragStart={handleDragStart} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Single palette item card ──
function PaletteItemCard({
  item,
  onDragStart,
  compact,
}: {
  item: PaletteItem;
  onDragStart: (e: React.DragEvent, item: PaletteItem) => void;
  compact?: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      className={`flex flex-col items-center gap-1 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-sm ${
        compact ? "p-1" : "p-1.5"
      }`}
    >
      <PaletteThumbnail item={item} />
      <span className={`text-center leading-tight font-medium ${compact ? "text-[9px]" : "text-[10px]"}`}>
        {item.label}
      </span>
    </div>
  );
}
