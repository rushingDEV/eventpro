"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, Users } from "lucide-react";
import { useDesignerStore, generateElementId } from "@/lib/designer/store";
import type { DesignerElement, DesignerTemplate } from "@/lib/designer/types";
import { toast } from "sonner";

// Built-in templates
const TEMPLATES: DesignerTemplate[] = [
  {
    id: "wedding-200",
    name: "חתונה 200 אורחים",
    description: "סידור קלאסי עם רחבת ריקודים מרכזית",
    guestCountRange: [150, 250],
    eventType: "WEDDING",
    canvasWidth: 1200,
    canvasHeight: 800,
    elements: generateWeddingTemplate(200, 20),
  },
  {
    id: "wedding-400",
    name: "חתונה 400 אורחים",
    description: "אולם גדול עם במה וחופה",
    guestCountRange: [300, 500],
    eventType: "WEDDING",
    canvasWidth: 1400,
    canvasHeight: 1000,
    elements: generateWeddingTemplate(400, 40),
  },
  {
    id: "bar-mitzvah",
    name: "בר/בת מצווה 150",
    description: "סידור עם רחבת ריקודים ובמה",
    guestCountRange: [100, 200],
    eventType: "BAR_MITZVAH",
    canvasWidth: 1000,
    canvasHeight: 700,
    elements: generateBarMitzvahTemplate(),
  },
  {
    id: "corporate",
    name: "אירוע חברה",
    description: "סידור תאטרון עם במה מרכזית",
    guestCountRange: [50, 150],
    eventType: "CORPORATE",
    canvasWidth: 1000,
    canvasHeight: 700,
    elements: generateCorporateTemplate(),
  },
];

function makeTable(
  num: number,
  x: number,
  y: number,
  capacity = 10,
  shape = "ROUND",
  radius = 55,
): DesignerElement {
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
      tableShape: shape,
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
  style?: Partial<DesignerElement["style"]>,
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
    style: {
      fill: "#8B7355",
      stroke: "#5D4037",
      strokeWidth: 2,
      opacity: 1,
      ...style,
    },
    metadata: meta,
  };
}

function generateWeddingTemplate(guests: number, tables: number): DesignerElement[] {
  const els: DesignerElement[] = [];
  const cx = guests <= 250 ? 600 : 700;
  const cy = guests <= 250 ? 400 : 500;

  // Dance floor
  els.push(
    makeElement("dance-floor", "רחבת ריקודים", cx, cy, 200, 200, { shape: "rect", hasLedGrid: false }, { fill: "#2D2D2D", stroke: "#555" }),
  );

  // Stage
  els.push(
    makeElement("stage", "במה", cx, cy - 180, 200, 70, { elevationHeight: 40, hasSteps: true, subType: "stage" }, { fill: "#4A4A4A", stroke: "#333" }),
  );

  // Chuppah
  els.push(
    makeElement("chuppah", "חופה", cx, cy - 280, 120, 100, { elevationHeight: 20, hasSteps: false, subType: "chuppah" }, { fill: "#F5E6D3", stroke: "#C8A882" }),
  );

  // Tables in arcs around dance floor
  let num = 1;
  const rings = tables <= 20 ? 2 : 3;
  const tablesPerRing = Math.ceil(tables / rings);

  for (let ring = 0; ring < rings; ring++) {
    const ringRadius = 220 + ring * 140;
    const count = Math.min(tablesPerRing, tables - num + 1);
    const startAngle = Math.PI * 0.15;
    const endAngle = Math.PI * 0.85;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / Math.max(1, count - 1);
      const tx = cx + Math.cos(angle + Math.PI / 2) * ringRadius;
      const ty = cy + Math.sin(angle + Math.PI / 2) * ringRadius;
      els.push(makeTable(num++, tx, ty));
    }
  }

  // Bar
  els.push(
    makeElement("bar", "בר", 150, cy, 150, 40, { stoolCount: 5, barType: "cocktail" }, { fill: "#5C4033", stroke: "#3E2723" }),
  );

  // Entrance
  els.push(
    makeElement("entrance", "כניסה", cx, cy + 350, 40, 40, { direction: "in", isEmergency: false }, { fill: "#E8F5E9", stroke: "#22C55E" }),
  );

  return els;
}

function generateBarMitzvahTemplate(): DesignerElement[] {
  const els: DesignerElement[] = [];
  const cx = 500;
  const cy = 350;

  els.push(
    makeElement("dance-floor", "רחבת ריקודים", cx, cy, 160, 160, { shape: "rect", hasLedGrid: true }, { fill: "#2D2D2D", stroke: "#555" }),
  );
  els.push(
    makeElement("stage", "במה", cx, cy - 150, 160, 60, { elevationHeight: 30, hasSteps: true, subType: "stage" }, { fill: "#4A4A4A", stroke: "#333" }),
  );

  // 15 tables
  for (let i = 0; i < 15; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 200 + col * 150;
    const y = cy + 120 + row * 130;
    els.push(makeTable(i + 1, x, y, 10));
  }

  els.push(
    makeElement("bar", "בר", 100, cy, 120, 35, { stoolCount: 4, barType: "cocktail" }, { fill: "#5C4033", stroke: "#3E2723" }),
  );
  els.push(
    makeElement("entrance", "כניסה", cx, cy + 320, 40, 40, { direction: "in", isEmergency: false }, { fill: "#E8F5E9", stroke: "#22C55E" }),
  );

  return els;
}

function generateCorporateTemplate(): DesignerElement[] {
  const els: DesignerElement[] = [];
  const cx = 500;

  // Stage
  els.push(
    makeElement("stage", "במה", cx, 100, 300, 80, { elevationHeight: 40, hasSteps: true, subType: "stage" }, { fill: "#4A4A4A", stroke: "#333" }),
  );

  // Theater-style tables (rows)
  let num = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const x = 200 + col * 170;
      const y = 280 + row * 140;
      els.push(makeTable(num++, x, y, 8));
    }
  }

  els.push(
    makeElement("bar", "קפה", 100, 350, 100, 35, { stoolCount: 0, barType: "buffet" }, { fill: "#5C4033", stroke: "#3E2723" }),
  );
  els.push(
    makeElement("entrance", "כניסה", cx, 620, 40, 40, { direction: "in", isEmergency: false }, { fill: "#E8F5E9", stroke: "#22C55E" }),
  );

  return els;
}

interface TemplateGalleryProps {
  trigger?: React.ReactNode;
}

export function TemplateGallery({ trigger }: TemplateGalleryProps) {
  const [open, setOpen] = useState(false);
  const { loadFromJson } = useDesignerStore();

  const handleSelectTemplate = (template: DesignerTemplate) => {
    // Regenerate IDs to avoid conflicts
    const newElements = template.elements.map((el) => ({
      ...el,
      id: generateElementId(),
    }));

    loadFromJson({
      version: 1,
      elements: newElements,
      canvasWidth: template.canvasWidth,
      canvasHeight: template.canvasHeight,
      gridSize: 25,
      viewMode: "2d",
    });

    setOpen(false);
    toast.success(`תבנית "${template.name}" נטענה`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            תבניות
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>תבניות עיצוב</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="h-28 bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <LayoutTemplate className="h-10 w-10 text-muted-foreground" />
                </div>
                <h4 className="font-bold text-sm">{template.name}</h4>
                {template.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-[10px]">
                    <Users className="h-3 w-3 ml-1" />
                    {template.guestCountRange[0]}-{template.guestCountRange[1]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {template.elements.filter((e) => e.type === "table").length} שולחנות
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
