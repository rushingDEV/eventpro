"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Magnet,
  MousePointer2,
  Hand,
  Ruler,
  Save,
  Download,
  Sparkles,
  Monitor,
  Layers,
  Box,
  Check,
  Loader2,
} from "lucide-react";
import { useDesignerStore } from "@/lib/designer/store";
import type { ViewMode } from "@/lib/designer/types";

interface DesignerToolbarProps {
  onSave: () => void;
  onExport: () => void;
  onAiRecommend: () => void;
  isSaving?: boolean;
}

export function DesignerToolbar({ onSave, onExport, onAiRecommend, isSaving }: DesignerToolbarProps) {
  const {
    zoom,
    showGrid,
    snapToGrid,
    activeTool,
    viewMode,
    isDirty,
    lastSavedAt,
    setZoom,
    zoomIn,
    zoomOut,
    resetView,
    toggleGrid,
    toggleSnap,
    setActiveTool,
    setViewMode,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useDesignerStore();

  const viewModes: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: "2d", label: "2D", icon: <Monitor className="h-3.5 w-3.5" /> },
    { mode: "2.5d", label: "2.5D", icon: <Layers className="h-3.5 w-3.5" /> },
    { mode: "3d", label: "3D", icon: <Box className="h-3.5 w-3.5" /> },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Undo / Redo */}
        <ToolbarButton tooltip="בטל (Ctrl+Z)" onClick={undo} disabled={!canUndo()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="בצע שוב (Ctrl+Y)" onClick={redo} disabled={!canRedo()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Tools */}
        <ToolbarButton
          tooltip="בחירה (V)"
          onClick={() => setActiveTool("select")}
          active={activeTool === "select"}
        >
          <MousePointer2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="גרירה (H)"
          onClick={() => setActiveTool("pan")}
          active={activeTool === "pan"}
        >
          <Hand className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip="מדידה"
          onClick={() => setActiveTool("measure")}
          active={activeTool === "measure"}
        >
          <Ruler className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Zoom */}
        <ToolbarButton tooltip="הקטן" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-24 mx-1">
          <Slider
            value={[zoom * 100]}
            min={20}
            max={400}
            step={5}
            onValueChange={([val]) => setZoom(val / 100)}
            className="h-6"
          />
        </div>
        <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <ToolbarButton tooltip="הגדל" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="התאם למסך" onClick={resetView}>
          <Maximize2 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Grid & Snap */}
        <ToolbarButton tooltip="רשת" onClick={toggleGrid} active={showGrid}>
          <Grid3X3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton tooltip="הצמד לרשת" onClick={toggleSnap} active={snapToGrid}>
          <Magnet className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* View Mode */}
        <div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
          {viewModes.map((vm) => (
            <button
              key={vm.mode}
              onClick={() => setViewMode(vm.mode)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === vm.mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {vm.icon}
              {vm.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* AI */}
        <ToolbarButton tooltip="המלצות AI" onClick={onAiRecommend}>
          <Sparkles className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Save */}
        <Button variant="ghost" size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isDirty ? (
            <Save className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5 text-green-500" />
          )}
          <span className="text-xs">{isSaving ? "שומר..." : isDirty ? "שמור" : "נשמר"}</span>
        </Button>

        {/* Export */}
        <ToolbarButton tooltip="ייצוא (PNG/PDF)" onClick={onExport}>
          <Download className="h-4 w-4" />
        </ToolbarButton>

        {/* Last saved indicator */}
        {lastSavedAt && (
          <span className="text-[10px] text-muted-foreground mr-2">
            {lastSavedAt.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  children,
  tooltip,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
            active
              ? "bg-primary/10 text-primary"
              : disabled
                ? "text-muted-foreground/40 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
