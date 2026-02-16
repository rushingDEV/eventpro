"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useDesignerStore } from "@/lib/designer/store";
import { tablesToDesignerElements } from "@/lib/designer/table-bridge";
import { DesignerToolbar } from "@/components/designer/designer-toolbar";
import { ElementPalette } from "@/components/designer/element-palette";
import { PropertyInspector } from "@/components/designer/property-inspector";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Monitor } from "lucide-react";
import type { DesignerSaveData } from "@/lib/designer/types";

// Dynamic import for Konva (no SSR)
const DesignerCanvas = dynamic(
  () =>
    import("@/components/designer/designer-canvas").then(
      (m) => m.DesignerCanvas,
    ),
  { ssr: false, loading: () => <CanvasLoading /> },
);

function CanvasLoading() {
  return (
    <div className="flex-1 border rounded-xl bg-[#FAF8F5] flex items-center justify-center">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

export default function DesignerPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedRef = useRef(false);

  const { loadFromJson, exportToJson, isDirty, markSaved, elements } =
    useDesignerStore();

  // ── Fetch event data ──
  const { data, isLoading } = useQuery({
    queryKey: ["designer", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/designer`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json() as Promise<{
        floorPlan: DesignerSaveData | null;
        tables: Array<{
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
          _count: { guests: number };
        }>;
      }>;
    },
  });

  // ── Load initial data ──
  useEffect(() => {
    if (!data || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    if (data.floorPlan && data.floorPlan.elements?.length > 0) {
      // Load from saved designer state
      loadFromJson(data.floorPlan);
    } else if (data.tables.length > 0) {
      // Convert existing tables to designer elements
      const els = tablesToDesignerElements(data.tables);
      loadFromJson({
        version: 1,
        elements: els,
        canvasWidth: 1200,
        canvasHeight: 800,
        gridSize: 25,
        viewMode: "2d",
      });
    }
    markSaved();
  }, [data, loadFromJson, markSaved]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const saveData = exportToJson();
      const res = await fetch(`/api/events/${eventId}/designer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      markSaved();
    },
    onError: () => {
      toast.error("שגיאה בשמירה");
    },
  });

  const handleSave = useCallback(() => {
    saveMutation.mutate();
  }, [saveMutation]);

  // ── Auto-save every 30s ──
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      const { isDirty } = useDesignerStore.getState();
      if (isDirty) {
        saveMutation.mutate();
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveMutation]);

  // ── Ctrl+S handler ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // ── Canvas resize ──
  useEffect(() => {
    function resize() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasSize({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    }

    resize();
    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Export ──
  const handleExport = useCallback(() => {
    // Get Konva stage and export to image
    const stageEl = document.querySelector(".designer-canvas-container canvas") as HTMLCanvasElement;
    if (!stageEl) {
      toast.error("לא ניתן לייצא");
      return;
    }
    const dataUrl = stageEl.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `event-design-${eventId}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("תמונה יוצאה בהצלחה");
  }, [eventId]);

  // ── AI Recommendations (placeholder) ──
  const handleAiRecommend = useCallback(() => {
    toast.info("המלצות AI — בקרוב!");
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <Skeleton className="h-12 w-full" />
        <div className="flex-1 flex">
          <Skeleton className="w-[220px] h-full" />
          <Skeleton className="flex-1 h-full mx-2" />
          <Skeleton className="w-[260px] h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Mobile warning */}
      <div className="md:hidden p-4 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-sm text-amber-700">
        <Monitor className="h-4 w-4 flex-shrink-0" />
        <span>מומלץ לעבוד על מחשב לחוויה הטובה ביותר</span>
      </div>

      {/* Toolbar */}
      <DesignerToolbar
        onSave={handleSave}
        onExport={handleExport}
        onAiRecommend={handleAiRecommend}
        isSaving={saveMutation.isPending}
      />

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Element Palette (left) */}
        <div className="hidden md:block">
          <ElementPalette />
        </div>

        {/* Canvas (center) */}
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <DesignerCanvas width={canvasSize.width} height={canvasSize.height} />
        </div>

        {/* Property Inspector (right) */}
        <div className="hidden md:block">
          <PropertyInspector />
        </div>
      </div>

      {/* Status bar */}
      <div className="h-7 border-t bg-muted/50 flex items-center px-3 text-[10px] text-muted-foreground gap-4">
        <span>{elements.length} אלמנטים</span>
        <span>{useDesignerStore.getState().canvasWidth}×{useDesignerStore.getState().canvasHeight} px</span>
        <span>{Math.round(useDesignerStore.getState().zoom * 100)}%</span>
        <span className="mr-auto">
          {isDirty ? "שינויים לא שמורים" : "נשמר ✓"}
        </span>
      </div>
    </div>
  );
}
