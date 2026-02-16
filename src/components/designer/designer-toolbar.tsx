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
    <TooltipProvider delayDuration={150}>
      <div className="designer-glass flex items-center gap-1 px-3 py-1.5 border-b shadow-sm">
        {/* ── History ── */}
        <ToolGroup label="היסטוריה">
          <ToolbarButton tooltip="בטל" kbd="⌘Z" onClick={undo} disabled={!canUndo()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="בצע שוב" kbd="⌘Y" onClick={redo} disabled={!canRedo()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </ToolGroup>

        <Separator orientation="vertical" className="h-7 mx-0.5" />

        {/* ── Tools ── */}
        <ToolGroup label="כלים">
          <ToolbarButton tooltip="בחירה" kbd="V" onClick={() => setActiveTool("select")} active={activeTool === "select"}>
            <MousePointer2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="גרירה" kbd="H" onClick={() => setActiveTool("pan")} active={activeTool === "pan"}>
            <Hand className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="מדידה" kbd="M" onClick={() => setActiveTool("measure")} active={activeTool === "measure"}>
            <Ruler className="h-4 w-4" />
          </ToolbarButton>
        </ToolGroup>

        <Separator orientation="vertical" className="h-7 mx-0.5" />

        {/* ── Zoom ── */}
        <ToolGroup label="תצוגה">
          <ToolbarButton tooltip="הקטן" onClick={zoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="w-28 mx-1">
            <Slider
              value={[zoom * 100]}
              min={20}
              max={400}
              step={5}
              onValueChange={([val]) => setZoom(val / 100)}
              className="h-5"
            />
          </div>
          <button
            onClick={resetView}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground tabular-nums min-w-[42px] text-center transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolbarButton tooltip="הגדל" onClick={zoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton tooltip="התאם למסך" onClick={resetView}>
            <Maximize2 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolGroup>

        <Separator orientation="vertical" className="h-7 mx-0.5" />

        {/* ── Grid & Snap ── */}
        <ToolGroup label="רשת">
          <ToolbarButton tooltip="רשת" onClick={toggleGrid} active={showGrid}>
            <Grid3X3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton tooltip="הצמד" onClick={toggleSnap} active={snapToGrid}>
            <Magnet className="h-4 w-4" />
          </ToolbarButton>
        </ToolGroup>

        <Separator orientation="vertical" className="h-7 mx-0.5" />

        {/* ── View Mode Segmented Control ── */}
        <div className="relative flex items-center bg-muted/60 rounded-lg p-0.5 gap-0.5">
          {viewModes.map((vm) => (
            <button
              key={vm.mode}
              onClick={() => setViewMode(vm.mode)}
              className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 z-10 ${
                viewMode === vm.mode
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {vm.icon}
              {vm.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* ── AI ── */}
        <ToolbarButton tooltip="המלצות AI" onClick={onAiRecommend}>
          <Sparkles className="h-4 w-4 text-amber-500" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-7 mx-0.5" />

        {/* ── Save ── */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className={`gap-1.5 rounded-lg transition-all ${
            isDirty && !isSaving ? "text-primary" : ""
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : isDirty ? (
            <span className="relative">
              <Save className="h-3.5 w-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full save-pulse" />
            </span>
          ) : (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          )}
          <span className="text-[11px] font-medium">
            {isSaving ? "שומר..." : isDirty ? "שמור" : "נשמר"}
          </span>
        </Button>

        {/* Export */}
        <ToolbarButton tooltip="ייצוא PNG" onClick={onExport}>
          <Download className="h-4 w-4" />
        </ToolbarButton>

        {/* Last saved */}
        {lastSavedAt && (
          <span className="text-[10px] text-muted-foreground/70 font-mono mr-1">
            {lastSavedAt.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ── Tool Group wrapper with mini-label ── */
function ToolGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <span className="text-[8px] text-muted-foreground/50 font-medium leading-none select-none">{label}</span>
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  );
}

/* ── Premium Toolbar Button ── */
function ToolbarButton({
  children,
  tooltip,
  kbd,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  tooltip: string;
  kbd?: string;
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
          className={`h-7 w-7 rounded-md flex items-center justify-center transition-all duration-150 ${
            active
              ? "tool-active-glow text-primary"
              : disabled
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px] flex items-center gap-1">
        <span>{tooltip}</span>
        {kbd ? <span className="kbd-badge">{kbd}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}
