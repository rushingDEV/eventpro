"use client";

import { useDesignerStore } from "@/lib/designer/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Lock, Unlock, GripVertical } from "lucide-react";
import type { ElementType } from "@/lib/designer/types";

const TYPE_ICONS: Record<ElementType, string> = {
  table: "🪑",
  chair: "💺",
  wall: "🧱",
  "dance-floor": "💃",
  stage: "🎤",
  chuppah: "💒",
  bar: "🍸",
  "dj-booth": "🎵",
  "flower-arrangement": "🌸",
  lighting: "💡",
  sign: "🪧",
  entrance: "🚪",
  exit: "🚶",
  "photo-booth": "📸",
  "gift-table": "🎁",
  buffet: "🍽️",
  lounge: "🛋️",
  separator: "➖",
  custom: "📦",
};

export function LayersPanel() {
  const { elements, selectedIds, select, updateElement } = useDesignerStore();

  // Sort by z-index descending (highest on top)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-full h-full flex flex-col">
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
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0 cursor-grab" />

                <span className="text-sm flex-shrink-0">
                  {TYPE_ICONS[el.type] || "📦"}
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
