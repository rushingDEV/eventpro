"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet } from "lucide-react";

interface ImportDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Column name mapping (Hebrew -> English)
const columnMap: Record<string, string> = {
  "שם פרטי": "firstName",
  "שם משפחה": "lastName",
  טלפון: "phone",
  אימייל: "email",
  קבוצה: "group",
  צד: "side",
  "מספר מוזמנים": "invitedCount",
  הערות: "notes",
  // English fallbacks
  firstName: "firstName",
  lastName: "lastName",
  phone: "phone",
  email: "email",
  group: "group",
  side: "side",
  invitedCount: "invitedCount",
  notes: "notes",
};

function mapRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = columnMap[key.trim()] || key;
    mapped[mappedKey] = value;
  }
  return mapped;
}

export function ImportDialog({
  eventId,
  open,
  onOpenChange,
  onSuccess,
}: ImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setResult(null);

      try {
        let rows: Record<string, unknown>[];

        if (file.name.endsWith(".csv")) {
          const text = await file.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          rows = parsed.data as Record<string, unknown>[];
        } else {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws);
        }

        const mappedRows = rows.map(mapRow);

        const res = await fetch(`/api/events/${eventId}/guests/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guests: mappedRows }),
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data);
          onSuccess();
        }
      } catch {
        setResult({ created: 0, skipped: 0 });
      }

      setLoading(false);
    },
    [eventId, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ייבוא מוזמנים</DialogTitle>
          <DialogDescription>
            העלה קובץ Excel (.xlsx) או CSV עם רשימת המוזמנים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              העמודות הנדרשות: שם פרטי, שם משפחה, טלפון, קבוצה, צד, מספר מוזמנים
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="max-w-xs mx-auto"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              disabled={loading}
            />
          </div>

          {loading && (
            <p className="text-center text-sm text-muted-foreground">
              מייבא מוזמנים...
            </p>
          )}

          {result && (
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="font-medium">
                {result.created > 0
                  ? `יובאו ${result.created} מוזמנים בהצלחה!`
                  : "לא יובאו מוזמנים"}
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.skipped} שורות דולגו (חסרים נתונים)
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
