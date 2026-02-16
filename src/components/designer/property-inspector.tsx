"use client";

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
} from "lucide-react";
import type { DesignerElement, TableMetadata, WallMetadata, DanceFloorMetadata, StageMetadata, BarMetadata, DecorationMetadata, EntranceMetadata, FurnitureMetadata, TableShape } from "@/lib/designer/types";

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

  if (selectedElements.length === 0) {
    return (
      <div className="w-[260px] border-r bg-background/95 flex flex-col h-full">
        <div className="px-3 py-2.5 border-b">
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

  // Multi-select: show alignment tools
  if (selectedElements.length > 1) {
    return (
      <div className="w-[260px] border-r bg-background/95 flex flex-col h-full">
        <div className="px-3 py-2.5 border-b">
          <h3 className="text-sm font-bold">{selectedElements.length} אלמנטים נבחרו</h3>
        </div>
        <div className="p-3 space-y-3">
          <Label className="text-xs">יישור</Label>
          <div className="grid grid-cols-3 gap-1">
            <AlignButton icon={<AlignStartHorizontal className="h-3.5 w-3.5" />} label="שמאל" onClick={() => alignElements("left")} />
            <AlignButton icon={<AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />} label="מרכז אופקי" onClick={() => alignElements("centerH")} />
            <AlignButton icon={<AlignEndHorizontal className="h-3.5 w-3.5" />} label="ימין" onClick={() => alignElements("right")} />
            <AlignButton icon={<AlignStartVertical className="h-3.5 w-3.5" />} label="למעלה" onClick={() => alignElements("top")} />
            <AlignButton icon={<AlignVerticalJustifyCenter className="h-3.5 w-3.5" />} label="מרכז אנכי" onClick={() => alignElements("centerV")} />
            <AlignButton icon={<AlignEndVertical className="h-3.5 w-3.5" />} label="למטה" onClick={() => alignElements("bottom")} />
          </div>

          <Separator />

          <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteElements(selectedIds)}>
            <Trash2 className="h-3.5 w-3.5 ml-2" />
            מחק {selectedElements.length} אלמנטים
          </Button>
        </div>
      </div>
    );
  }

  const el = selectedElements[0];

  function update(patch: Partial<DesignerElement>) {
    pushHistory();
    updateElement(el.id, patch);
  }

  function updateMeta(key: string, value: unknown) {
    update({ metadata: { ...el.metadata, [key]: value } });
  }

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
          updateElement(sel.id, { x: (Math.min(...xs) + Math.max(...xs)) / 2 });
          break;
        case "top":
          updateElement(sel.id, { y: Math.min(...ys) });
          break;
        case "bottom":
          updateElement(sel.id, { y: Math.max(...ys) });
          break;
        case "centerV":
          updateElement(sel.id, { y: (Math.min(...ys) + Math.max(...ys)) / 2 });
          break;
      }
    }
  }

  return (
    <div className="w-[260px] border-r bg-background/95 flex flex-col h-full">
      <div className="px-3 py-2.5 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold">מאפיינים</h3>
        <div className="flex gap-1">
          <button onClick={() => copy()} className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => update({ locked: !el.locked })}
            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
          >
            {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => update({ visible: !el.visible })}
            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
          >
            {el.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label className="text-xs">שם</Label>
            <Input
              value={el.name}
              onChange={(e) => update({ name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={Math.round(el.x)}
                onChange={(e) => update({ x: Number(e.target.value) })}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={Math.round(el.y)}
                onChange={(e) => update({ y: Number(e.target.value) })}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">רוחב</Label>
              <Input
                type="number"
                value={Math.round(el.width)}
                onChange={(e) => update({ width: Number(e.target.value) })}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">גובה</Label>
              <Input
                type="number"
                value={Math.round(el.height)}
                onChange={(e) => update({ height: Number(e.target.value) })}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">סיבוב</Label>
              <button onClick={() => update({ rotation: 0 })} className="text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
            <Slider
              value={[el.rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={([val]) => update({ rotation: val })}
            />
            <div className="text-[10px] text-muted-foreground text-center" dir="ltr">{Math.round(el.rotation)}°</div>
          </div>

          {/* Z-Index */}
          <div className="flex items-center gap-2">
            <Label className="text-xs">שכבה</Label>
            <div className="flex gap-1 mr-auto">
              <button
                onClick={() => update({ zIndex: el.zIndex + 1 })}
                className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => update({ zIndex: Math.max(0, el.zIndex - 1) })}
                className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <Separator />

          {/* Style */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">עיצוב</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">מילוי</Label>
                <Input
                  type="color"
                  value={el.style.fill}
                  onChange={(e) =>
                    update({ style: { ...el.style, fill: e.target.value } })
                  }
                  className="h-8 p-1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">גבול</Label>
                <Input
                  type="color"
                  value={el.style.stroke}
                  onChange={(e) =>
                    update({ style: { ...el.style, stroke: e.target.value } })
                  }
                  className="h-8 p-1"
                />
              </div>
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

          <Separator />

          {/* Type-specific properties */}
          <TypeSpecificProps element={el} updateMeta={updateMeta} />

          <Separator />

          {/* Delete */}
          <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteElements([el.id])}>
            <Trash2 className="h-3.5 w-3.5 ml-2" />
            מחק
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

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
        <div className="space-y-3">
          <Label className="text-xs font-medium">שולחן</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">צורה</Label>
              <Select value={meta.tableShape} onValueChange={(val) => updateMeta("tableShape", val as TableShape)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUND">עגול</SelectItem>
                  <SelectItem value="RECTANGLE">מלבני</SelectItem>
                  <SelectItem value="SQUARE">מרובע</SelectItem>
                  <SelectItem value="OVAL">אובלי</SelectItem>
                  <SelectItem value="LONG">ארוך</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">קיבולת</Label>
                <Input
                  type="number"
                  value={meta.capacity}
                  onChange={(e) => updateMeta("capacity", Number(e.target.value))}
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
                  onChange={(e) => updateMeta("tableNumber", Number(e.target.value))}
                  className="h-8 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">VIP</Label>
              <Switch
                checked={meta.isVIP}
                onCheckedChange={(val) => updateMeta("isVIP", val)}
              />
            </div>
          </div>
        </div>
      );
    }

    case "wall":
    case "separator": {
      const meta = el.metadata as unknown as WallMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">קיר</Label>
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
        </div>
      );
    }

    case "dance-floor": {
      const meta = el.metadata as unknown as DanceFloorMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">רחבת ריקודים</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">צורה</Label>
              <Select value={meta.shape} onValueChange={(val) => updateMeta("shape", val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        </div>
      );
    }

    case "stage":
    case "chuppah": {
      const meta = el.metadata as unknown as StageMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">{meta.subType === "chuppah" ? "חופה" : "במה"}</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px]">מדרגות</Label>
              <Switch
                checked={meta.hasSteps}
                onCheckedChange={(val) => updateMeta("hasSteps", val)}
              />
            </div>
          </div>
        </div>
      );
    }

    case "bar":
    case "buffet":
    case "dj-booth": {
      const meta = el.metadata as unknown as BarMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">בר</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">סוג</Label>
              <Select value={meta.barType} onValueChange={(val) => updateMeta("barType", val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                onChange={(e) => updateMeta("stoolCount", Number(e.target.value))}
                className="h-8 text-sm"
                dir="ltr"
                min={0}
                max={20}
              />
            </div>
          </div>
        </div>
      );
    }

    case "flower-arrangement":
    case "lighting":
    case "sign":
    case "photo-booth": {
      const meta = el.metadata as unknown as DecorationMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">עיצוב</Label>
          <div className="space-y-2">
            {meta.decorationType === "lighting" && (
              <div className="space-y-1">
                <Label className="text-[10px]">עוצמה</Label>
                <Select value={meta.intensity || "medium"} onValueChange={(val) => updateMeta("intensity", val)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        </div>
      );
    }

    case "entrance":
    case "exit": {
      const meta = el.metadata as unknown as EntranceMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">כניסה/יציאה</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">כיוון</Label>
              <Select value={meta.direction} onValueChange={(val) => updateMeta("direction", val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        </div>
      );
    }

    case "lounge":
    case "gift-table": {
      const meta = el.metadata as unknown as FurnitureMetadata;
      return (
        <div className="space-y-3">
          <Label className="text-xs font-medium">ריהוט</Label>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[10px]">סוג</Label>
              <Select value={meta.furnitureType} onValueChange={(val) => updateMeta("furnitureType", val)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
        </div>
      );
    }

    default:
      return null;
  }
}

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
