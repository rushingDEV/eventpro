"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useDesignerStore } from "@/lib/designer/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  Star,
  Circle,
  Square,
  RectangleHorizontal,
} from "lucide-react";
import type {
  DesignerElement,
  TableMetadata,
  WallMetadata,
  DanceFloorMetadata,
  StageMetadata,
  BarMetadata,
  DecorationMetadata,
  EntranceMetadata,
  FurnitureMetadata,
  TableShape,
} from "@/lib/designer/types";

// ── Color Presets (wedding palette) ────────────────────────────────────────
const COLOR_PRESETS = [
  { value: "#3b2f1e", label: "Dark Wood" },
  { value: "#8B7355", label: "Warm Wood" },
  { value: "#5C4033", label: "Walnut" },
  { value: "#F5E6D3", label: "Cream" },
  { value: "#2D2D2D", label: "Charcoal" },
  { value: "#FFFFFF", label: "White" },
  { value: "#DAA520", label: "Gold" },
  { value: "#E8C6D0", label: "Blush Rose" },
] as const;

// ── Collapsible Section ────────────────────────────────────────────────────
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full group"
      >
        <Label className="text-xs font-medium pointer-events-none">
          {title}
        </Label>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      <div
        className={`section-collapse ${
          open
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
        style={{ transition: "max-height 0.25s ease, opacity 0.2s ease" }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Color Swatch Picker ────────────────────────────────────────────────────
function ColorSwatchPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px]">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            title={preset.label}
            onClick={() => onChange(preset.value)}
            className={`color-swatch ${
              value.toLowerCase() === preset.value.toLowerCase() ? "active" : ""
            }`}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: preset.value,
              border:
                value.toLowerCase() === preset.value.toLowerCase()
                  ? "2px solid #DAA520"
                  : preset.value === "#FFFFFF"
                  ? "1px solid hsl(var(--border))"
                  : "1px solid transparent",
              boxShadow:
                value.toLowerCase() === preset.value.toLowerCase()
                  ? "0 0 0 2px rgba(218,165,32,0.3)"
                  : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          />
        ))}
      </div>
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 p-0.5 w-full"
      />
    </div>
  );
}

// ── Numeric Input with Unit ────────────────────────────────────────────────
function UnitInput({
  label,
  value,
  onChange,
  unit = "px",
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={Math.round(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 text-sm pr-7"
          dir="ltr"
          min={min}
          max={max}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── Rotation Wheel ─────────────────────────────────────────────────────────
function RotationWheel({
  angle,
  onChange,
  onReset,
}: {
  angle: number;
  onChange: (deg: number) => void;
  onReset: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  const drawWheel = useCallback(
    (ctx: CanvasRenderingContext2D, deg: number) => {
      const size = 60;
      const cx = size / 2;
      const cy = size / 2;
      const r = 24;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, size * dpr, size * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Outer circle track
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Filled arc showing current angle
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const startRad = -Math.PI / 2;
      const endRad = startRad + (deg * Math.PI) / 180;
      ctx.arc(cx, cy, r, startRad, endRad, false);
      ctx.closePath();
      ctx.fillStyle = "rgba(218, 165, 32, 0.12)";
      ctx.fill();

      // Angle indicator line
      const ix = cx + r * Math.cos(endRad);
      const iy = cy + r * Math.sin(endRad);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ix, iy);
      ctx.strokeStyle = "#DAA520";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Indicator dot
      ctx.beginPath();
      ctx.arc(ix, iy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#DAA520";
      ctx.fill();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(var(--foreground))";
      ctx.fill();

      // Degree text
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "hsl(var(--muted-foreground))";
      ctx.fillText(`${Math.round(deg)}°`, cx, cy + r + 10);

      ctx.restore();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 60 * dpr;
    canvas.height = 60 * dpr;
    canvas.style.width = "60px";
    canvas.style.height = "60px";
    const ctx = canvas.getContext("2d");
    if (ctx) drawWheel(ctx, angle);
  }, [angle, drawWheel]);

  function getAngleFromEvent(
    e: React.MouseEvent | MouseEvent,
    canvas: HTMLCanvasElement
  ) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return Math.round(deg) % 360;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    isDragging.current = true;
    const canvas = canvasRef.current!;
    onChange(getAngleFromEvent(e, canvas));

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      onChange(getAngleFromEvent(ev, canvas));
    };

    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div className="flex items-center gap-3">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className="cursor-pointer flex-shrink-0"
        style={{ width: 60, height: 60 }}
      />
      <div className="flex flex-col gap-1.5 flex-1">
        <Input
          type="number"
          value={Math.round(angle)}
          onChange={(e) => {
            let v = Number(e.target.value) % 360;
            if (v < 0) v += 360;
            onChange(v);
          }}
          className="h-7 text-xs w-full"
          dir="ltr"
          min={0}
          max={359}
        />
        <button
          onClick={onReset}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          <span>איפוס</span>
        </button>
      </div>
    </div>
  );
}

// ── Table Shape Segmented Control ──────────────────────────────────────────
function TableShapeSegmented({
  value,
  onChange,
}: {
  value: TableShape;
  onChange: (shape: TableShape) => void;
}) {
  const shapes: { value: TableShape; label: string; icon: React.ReactNode }[] =
    [
      {
        value: "ROUND",
        label: "עגול",
        icon: <Circle className="h-3.5 w-3.5" />,
      },
      {
        value: "SQUARE",
        label: "מרובע",
        icon: <Square className="h-3.5 w-3.5" />,
      },
      {
        value: "RECTANGLE",
        label: "מלבני",
        icon: <RectangleHorizontal className="h-3.5 w-3.5" />,
      },
      {
        value: "OVAL",
        label: "אובלי",
        icon: (
          <span className="text-[9px] font-semibold leading-none">OVAL</span>
        ),
      },
      {
        value: "LONG",
        label: "ארוך",
        icon: (
          <span className="text-[9px] font-semibold leading-none">LONG</span>
        ),
      },
    ];

  return (
    <div className="space-y-1">
      <Label className="text-[10px]">צורה</Label>
      <div className="segmented-control flex rounded-md border border-border/60 overflow-hidden">
        {shapes.map((s) => (
          <button
            key={s.value}
            title={s.label}
            onClick={() => onChange(s.value)}
            className={`flex-1 flex items-center justify-center h-8 transition-all duration-150 ${
              value === s.value
                ? "bg-primary/10 text-primary shadow-sm"
                : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {s.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── VIP Toggle ─────────────────────────────────────────────────────────────
function VIPToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Star
          className={`h-3.5 w-3.5 transition-colors duration-200 ${
            checked
              ? "text-[#DAA520] fill-[#DAA520]"
              : "text-muted-foreground"
          }`}
        />
        <Label
          className={`text-[10px] font-semibold transition-colors duration-200 ${
            checked ? "text-[#DAA520]" : "text-muted-foreground"
          }`}
        >
          VIP
        </Label>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={
          checked
            ? "[&>span]:bg-[#DAA520] data-[state=checked]:bg-[#DAA520]/20 border-[#DAA520]/40"
            : ""
        }
      />
    </div>
  );
}

// ── Align Button ───────────────────────────────────────────────────────────
function AlignButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="h-8 w-full rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
    </button>
  );
}

// ── Type-Specific Properties ───────────────────────────────────────────────
function TypeSpecificProps({
  element: el,
  updateMeta,
}: {
  element: DesignerElement;
  updateMeta: (key: string, value: unknown) => void;
}) {
  switch (el.type) {
    case "table": {
      const meta = el.metadata as unknown as TableMetadata;
      return (
        <CollapsibleSection title="שולחן">
          <div className="space-y-2">
            <TableShapeSegmented
              value={meta.tableShape}
              onChange={(val) => updateMeta("tableShape", val)}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">קיבולת</Label>
                <Input
                  type="number"
                  value={meta.capacity}
                  onChange={(e) =>
                    updateMeta("capacity", Number(e.target.value))
                  }
                  className="h-8 text-sm"
                  dir="ltr"
                  min={1}
                  max={20}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">מספר</Label>
                <Input
                  type="number"
                  value={meta.tableNumber}
                  onChange={(e) =>
                    updateMeta("tableNumber", Number(e.target.value))
                  }
                  className="h-8 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <VIPToggle
              checked={meta.isVIP}
              onCheckedChange={(val) => updateMeta("isVIP", val)}
            />
          </div>
        </CollapsibleSection>
      );
    }

    case "wall":
    case "separator": {
      const meta = el.metadata as unknown as WallMetadata;
      return (
        <CollapsibleSection title="קיר">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">עובי</Label>
              <Slider
                value={[meta.thickness]}
                min={4}
                max={30}
                step={2}
                onValueChange={([val]) => updateMeta("thickness", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">דלת</Label>
              <Switch
                checked={meta.hasDoor}
                onCheckedChange={(val) => updateMeta("hasDoor", val)}
              />
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    case "dance-floor": {
      const meta = el.metadata as unknown as DanceFloorMetadata;
      return (
        <CollapsibleSection title="רחבת ריקודים">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">צורה</Label>
              <Select
                value={meta.shape}
                onValueChange={(val) => updateMeta("shape", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rect">מלבן</SelectItem>
                  <SelectItem value="circle">עיגול</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">LED Grid</Label>
              <Switch
                checked={meta.hasLedGrid}
                onCheckedChange={(val) => updateMeta("hasLedGrid", val)}
              />
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    case "stage":
    case "chuppah": {
      const meta = el.metadata as unknown as StageMetadata;
      return (
        <CollapsibleSection
          title={meta.subType === "chuppah" ? "חופה" : "במה"}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">מדרגות</Label>
              <Switch
                checked={meta.hasSteps}
                onCheckedChange={(val) => updateMeta("hasSteps", val)}
              />
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    case "bar":
    case "buffet":
    case "dj-booth": {
      const meta = el.metadata as unknown as BarMetadata;
      return (
        <CollapsibleSection title="בר">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">סוג</Label>
              <Select
                value={meta.barType}
                onValueChange={(val) => updateMeta("barType", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cocktail">קוקטיילים</SelectItem>
                  <SelectItem value="sit-down">ישיבה</SelectItem>
                  <SelectItem value="buffet">בופה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">כסאות בר</Label>
              <Input
                type="number"
                value={meta.stoolCount}
                onChange={(e) =>
                  updateMeta("stoolCount", Number(e.target.value))
                }
                className="h-8 text-sm"
                dir="ltr"
                min={0}
                max={20}
              />
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    case "flower-arrangement":
    case "lighting":
    case "sign":
    case "photo-booth": {
      const meta = el.metadata as unknown as DecorationMetadata;
      return (
        <CollapsibleSection title="עיצוב">
          <div className="space-y-2">
            {meta.decorationType === "lighting" && (
              <div className="space-y-1">
                <Label className="text-[10px]">עוצמה</Label>
                <Select
                  value={meta.intensity || "medium"}
                  onValueChange={(val) => updateMeta("intensity", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">חלשה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">חזקה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {meta.decorationType === "sign" && (
              <div className="space-y-1">
                <Label className="text-[10px]">טקסט</Label>
                <Input
                  value={meta.text || ""}
                  onChange={(e) => updateMeta("text", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="טקסט השילוט"
                />
              </div>
            )}
          </div>
        </CollapsibleSection>
      );
    }

    case "entrance":
    case "exit": {
      const meta = el.metadata as unknown as EntranceMetadata;
      return (
        <CollapsibleSection title="כניסה/יציאה">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">כיוון</Label>
              <Select
                value={meta.direction}
                onValueChange={(val) => updateMeta("direction", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">כניסה</SelectItem>
                  <SelectItem value="out">יציאה</SelectItem>
                  <SelectItem value="both">דו-כיווני</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">יציאת חירום</Label>
              <Switch
                checked={meta.isEmergency}
                onCheckedChange={(val) => updateMeta("isEmergency", val)}
              />
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    case "lounge":
    case "gift-table": {
      const meta = el.metadata as unknown as FurnitureMetadata;
      return (
        <CollapsibleSection title="ריהוט">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">סוג</Label>
              <Select
                value={meta.furnitureType}
                onValueChange={(val) => updateMeta("furnitureType", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="armchair">כורסה</SelectItem>
                  <SelectItem value="sofa">ספה</SelectItem>
                  <SelectItem value="side-table">שולחן צד</SelectItem>
                  <SelectItem value="lounge-set">לאונג׳</SelectItem>
                  <SelectItem value="gift-table">שולחן מתנות</SelectItem>
                  <SelectItem value="cake-table">שולחן עוגה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── Main Component ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

export function PropertyInspector() {
  const {
    elements,
    selectedIds,
    updateElement,
    deleteElements,
    copy,
    pushHistory,
  } = useDesignerStore();

  const selectedElements = elements.filter((e) => selectedIds.includes(e.id));

  // ── Empty state ──────────────────────────────────────────────────────────
  if (selectedElements.length === 0) {
    return (
      <div className="w-[260px] border-r designer-glass flex flex-col h-full">
        <div className="px-3 py-2.5 border-b designer-glass shadow-sm">
          <h3 className="text-sm font-bold">מאפיינים</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            בחרו אלמנט לעריכת מאפיינים
          </p>
        </div>
      </div>
    );
  }

  // ── Multi-select: alignment tools ────────────────────────────────────────
  if (selectedElements.length > 1) {
    return (
      <MultiSelectPanel
        selectedElements={selectedElements}
        selectedIds={selectedIds}
        updateElement={updateElement}
        deleteElements={deleteElements}
        pushHistory={pushHistory}
      />
    );
  }

  // ── Single element ───────────────────────────────────────────────────────
  return (
    <SingleElementPanel
      element={selectedElements[0]}
      updateElement={updateElement}
      deleteElements={deleteElements}
      copy={copy}
      pushHistory={pushHistory}
    />
  );
}

// ── Multi-Select Panel ─────────────────────────────────────────────────────
function MultiSelectPanel({
  selectedElements,
  selectedIds,
  updateElement,
  deleteElements,
  pushHistory,
}: {
  selectedElements: DesignerElement[];
  selectedIds: string[];
  updateElement: (id: string, patch: Partial<DesignerElement>) => void;
  deleteElements: (ids: string[]) => void;
  pushHistory: () => void;
}) {
  function alignElements(alignment: string) {
    pushHistory();
    const xs = selectedElements.map((e) => e.x);
    const ys = selectedElements.map((e) => e.y);

    for (const sel of selectedElements) {
      switch (alignment) {
        case "left":
          updateElement(sel.id, { x: Math.min(...xs) });
          break;
        case "right":
          updateElement(sel.id, { x: Math.max(...xs) });
          break;
        case "centerH":
          updateElement(sel.id, {
            x: (Math.min(...xs) + Math.max(...xs)) / 2,
          });
          break;
        case "top":
          updateElement(sel.id, { y: Math.min(...ys) });
          break;
        case "bottom":
          updateElement(sel.id, { y: Math.max(...ys) });
          break;
        case "centerV":
          updateElement(sel.id, {
            y: (Math.min(...ys) + Math.max(...ys)) / 2,
          });
          break;
      }
    }
  }

  return (
    <div className="w-[260px] border-r designer-glass flex flex-col h-full">
      <div className="px-3 py-2.5 border-b designer-glass shadow-sm">
        <h3 className="text-sm font-bold">
          {selectedElements.length} אלמנטים נבחרו
        </h3>
      </div>
      <div className="p-3 space-y-3">
        <Label className="text-xs">יישור</Label>
        <div className="grid grid-cols-3 gap-1">
          <AlignButton
            icon={<AlignStartHorizontal className="h-3.5 w-3.5" />}
            label="שמאל"
            onClick={() => alignElements("left")}
          />
          <AlignButton
            icon={<AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />}
            label="מרכז אופקי"
            onClick={() => alignElements("centerH")}
          />
          <AlignButton
            icon={<AlignEndHorizontal className="h-3.5 w-3.5" />}
            label="ימין"
            onClick={() => alignElements("right")}
          />
          <AlignButton
            icon={<AlignStartVertical className="h-3.5 w-3.5" />}
            label="למעלה"
            onClick={() => alignElements("top")}
          />
          <AlignButton
            icon={<AlignVerticalJustifyCenter className="h-3.5 w-3.5" />}
            label="מרכז אנכי"
            onClick={() => alignElements("centerV")}
          />
          <AlignButton
            icon={<AlignEndVertical className="h-3.5 w-3.5" />}
            label="למטה"
            onClick={() => alignElements("bottom")}
          />
        </div>

        <Separator />

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => deleteElements(selectedIds)}
        >
          <Trash2 className="h-3.5 w-3.5 ml-2" />
          מחק {selectedElements.length} אלמנטים
        </Button>
      </div>
    </div>
  );
}

// ── Single Element Panel ───────────────────────────────────────────────────
function SingleElementPanel({
  element: el,
  updateElement,
  deleteElements,
  copy,
  pushHistory,
}: {
  element: DesignerElement;
  updateElement: (id: string, patch: Partial<DesignerElement>) => void;
  deleteElements: (ids: string[]) => void;
  copy: () => void;
  pushHistory: () => void;
}) {
  function update(patch: Partial<DesignerElement>) {
    pushHistory();
    updateElement(el.id, patch);
  }

  function updateMeta(key: string, value: unknown) {
    update({ metadata: { ...el.metadata, [key]: value } });
  }

  return (
    <div className="w-[260px] border-r designer-glass flex flex-col h-full">
      {/* ── Glass Header ────────────────────────────────────────────────── */}
      <div className="px-3 py-2.5 border-b designer-glass shadow-sm flex items-center justify-between">
        <h3 className="text-sm font-bold">מאפיינים</h3>
        <div className="flex gap-1">
          <button
            onClick={() => copy()}
            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => update({ locked: !el.locked })}
            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center transition-colors"
          >
            {el.locked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => update({ visible: !el.visible })}
            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center transition-colors"
          >
            {el.visible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* ── Name ──────────────────────────────────────────────────── */}
          <div className="space-y-1">
            <Label className="text-xs">שם</Label>
            <Input
              value={el.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          {/* ── Position ──────────────────────────────────────────────── */}
          <CollapsibleSection title="מיקום">
            <div className="grid grid-cols-2 gap-2">
              <UnitInput
                label="X"
                value={el.x}
                onChange={(v) => update({ x: v })}
              />
              <UnitInput
                label="Y"
                value={el.y}
                onChange={(v) => update({ y: v })}
              />
            </div>
          </CollapsibleSection>

          {/* ── Size ──────────────────────────────────────────────────── */}
          <CollapsibleSection title="גודל">
            <div className="grid grid-cols-2 gap-2">
              <UnitInput
                label="W"
                value={el.width}
                onChange={(v) => update({ width: v })}
              />
              <UnitInput
                label="H"
                value={el.height}
                onChange={(v) => update({ height: v })}
              />
            </div>
          </CollapsibleSection>

          {/* ── Rotation ──────────────────────────────────────────────── */}
          <CollapsibleSection title="סיבוב">
            <RotationWheel
              angle={el.rotation}
              onChange={(deg) => update({ rotation: deg })}
              onReset={() => update({ rotation: 0 })}
            />
          </CollapsibleSection>

          {/* ── Z-Index ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <Label className="text-xs">שכבה</Label>
            <div className="flex gap-1 mr-auto">
              <button
                onClick={() => update({ zIndex: el.zIndex + 1 })}
                className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  update({ zIndex: Math.max(0, el.zIndex - 1) })
                }
                className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <Separator />

          {/* ── Style ─────────────────────────────────────────────────── */}
          <CollapsibleSection title="עיצוב">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorSwatchPicker
                  label="מילוי"
                  value={el.style.fill}
                  onChange={(color) =>
                    update({ style: { ...el.style, fill: color } })
                  }
                />
                <ColorSwatchPicker
                  label="גבול"
                  value={el.style.stroke}
                  onChange={(color) =>
                    update({ style: { ...el.style, stroke: color } })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">שקיפות</Label>
                <Slider
                  value={[el.style.opacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={([val]) =>
                    update({ style: { ...el.style, opacity: val / 100 } })
                  }
                />
              </div>
            </div>
          </CollapsibleSection>

          <Separator />

          {/* ── Type-specific properties ──────────────────────────────── */}
          <TypeSpecificProps element={el} updateMeta={updateMeta} />

          <Separator />

          {/* ── Delete ────────────────────────────────────────────────── */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => deleteElements([el.id])}
          >
            <Trash2 className="h-3.5 w-3.5 ml-2" />
            מחק
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
