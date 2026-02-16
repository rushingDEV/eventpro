"use client";

import { useDesignerStore } from "@/lib/designer/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  GripVertical,
  Circle,
  CircleDot,
  Minus,
  Music,
  Presentation,
  Heart,
  Wine,
  Music2,
  Flower2,
  Lightbulb,
  Type,
  DoorOpen,
  DoorClosed,
  Camera,
  Gift,
  UtensilsCrossed,
  Sofa,
  Box,
} from "lucide-react";
import type { ElementType } from "@/lib/designer/types";
import React from "react";

const TYPE_ICONS: Record<ElementType, React.ReactNode> = {
  table: <Circle className="h-3 w-3" />,
  chair: <CircleDot className="h-3 w-3" />,
  wall: <Minus className="h-3 w-3" />,
  "dance-floor": <Music className="h-3 w-3" />,
  stage: <Presentation className="h-3 w-3" />,
  chuppah: <Heart className="h-3 w-3" />,
  bar: <Wine className="h-3 w-3" />,
  "dj-booth": <Music2 className="h-3 w-3" />,
  "flower-arrangement": <Flower2 className="h-3 w-3" />,
  lighting: <Lightbulb className="h-3 w-3" />,
  sign: <Type className="h-3 w-3" />,
  entrance: <DoorOpen className="h-3 w-3" />,
  exit: <DoorClosed className="h-3 w-3" />,
  "photo-booth": <Camera className="h-3 w-3" />,
  "gift-table": <Gift className="h-3 w-3" />,
  buffet: <UtensilsCrossed className="h-3 w-3" />,
  lounge: <Sofa className="h-3 w-3" />,
  separator: <Minus className="h-3 w-3" />,
  custom: <Box className="h-3 w-3" />,
};

export function LayersPanel() {
  const { elements, selectedIds, select, updateElement } = useDesignerStore();

  // Sort by z-index descending (highest on top)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-full h-full flex flex-col designer-glass">
      <div className="px-3 py-2 border-b">
        <h4 className="text-xs font-bold">שכבות</h4>
        <p className="text-[10px] text-muted-foreground">{elements.length} אלמנטים</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {sortedElements.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onClick={() => select(el.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 text-primary border-r-[3px] border-r-primary"
                    : "hover:bg-muted text-foreground border-r-[3px] border-r-transparent"
                }`}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-grab" />

                {/* Color dot */}
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0 ring-1 ring-black/10"
                  style={{ backgroundColor: el.style?.fill || "#8B7355" }}
                />

                <span className="flex-shrink-0 text-muted-foreground">
                  {TYPE_ICONS[el.type] || <Box className="h-3 w-3" />}
                </span>

                <span className="truncate flex-1 text-[11px]">
                  {el.name || el.type}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(el.id, { visible: !el.visible });
                  }}
                  className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted-foreground/10"
                >
                  {el.visible ? (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateElement(el.id, { locked: !el.locked });
                  }}
                  className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted-foreground/10"
                >
                  {el.locked ? (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-3 w-3 text-muted-foreground/50" />
                  )}
                </button>
              </div>
            );
          })}

          {elements.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-8">
              אין אלמנטים
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
