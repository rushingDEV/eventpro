"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Plus, Brain, Trash2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const FloorPlanCanvas = dynamic(
  () =>
    import("@/components/floor-plan/floor-plan-canvas").then(
      (mod) => mod.FloorPlanCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-lg bg-gray-50 flex items-center justify-center h-[600px]">
        <div className="text-muted-foreground">טוען מפת הושבה...</div>
      </div>
    ),
  }
);

interface SeatingResultData {
  assignments: Record<string, string>;
  score: number;
  tableScores: Record<string, number>;
  warnings: { type: string; severity: string; message: string }[];
  suggestions: { type: string; message: string; impact: string }[];
  stats: {
    totalSeated: number;
    totalCapacity: number;
    fillRate: number;
    emptySeats: number;
    estimatedWaste: number;
  };
}

export default function SeatingPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [seatingResult, setSeatingResult] = useState<SeatingResultData | null>(null);

  const { data: tables = [] } = useQuery({
    queryKey: ["tables", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/tables`);
      if (!res.ok) throw new Error("Failed to fetch tables");
      return res.json();
    },
  });

  const { data: unseatedGuests = [] } = useQuery({
    queryKey: ["unseated-guests", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/guests`);
      if (!res.ok) return [];
      const guests = await res.json();
      return guests.filter(
        (g: { tableId: string | null; rsvpStatus: string }) =>
          !g.tableId &&
          (g.rsvpStatus === "CONFIRMED" || g.rsvpStatus === "PENDING")
      );
    },
  });

  const smartSeating = useMutation({
    mutationFn: async (apply: boolean) => {
      const res = await fetch(`/api/events/${id}/seating/smart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply }),
      });
      if (!res.ok) throw new Error("Failed to run seating algorithm");
      return res.json();
    },
    onSuccess: (data, apply) => {
      setSeatingResult(data);
      if (apply) {
        queryClient.invalidateQueries({ queryKey: ["tables", id] });
        queryClient.invalidateQueries({ queryKey: ["unseated-guests", id] });
        toast.success(`הושבה חכמה הושלמה! ציון: ${data.score}/100`);
      }
    },
  });

  async function handleAddTable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/events/${id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        shape: formData.get("shape"),
        capacity: parseInt(formData.get("capacity") as string),
        isVIP: formData.get("isVIP") === "true",
      }),
    });

    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["tables", id] });
      setShowAddTable(false);
    }
  }

  async function handleMoveTable(tableId: string, x: number, y: number) {
    await fetch(`/api/events/${id}/tables/${tableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posX: x, posY: y }),
    });
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm("האם למחוק את השולחן?")) return;
    await fetch(`/api/events/${id}/tables/${tableId}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["tables", id] });
    setSelectedTableId(null);
  }

  async function handleToggleLock(tableId: string, isLocked: boolean) {
    await fetch(`/api/events/${id}/tables/${tableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !isLocked }),
    });
    queryClient.invalidateQueries({ queryKey: ["tables", id] });
  }

  async function seatGuest(guestId: string, tableId: string) {
    await fetch(`/api/events/${id}/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId }),
    });
    queryClient.invalidateQueries({ queryKey: ["tables", id] });
    queryClient.invalidateQueries({ queryKey: ["unseated-guests", id] });
  }

  const selectedTable = tables.find(
    (t: { id: string }) => t.id === selectedTableId
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">מפת הושבה</h1>
          <p className="text-muted-foreground">
            {tables.length} שולחנות · {unseatedGuests.length} לא מושבים
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddTable(true)}>
            <Plus className="ml-2 h-4 w-4" />
            שולחן חדש
          </Button>
          <Button
            onClick={() => smartSeating.mutate(false)}
            disabled={smartSeating.isPending}
          >
            <Brain className="ml-2 h-4 w-4" />
            {smartSeating.isPending ? "חושב..." : "הושבה חכמה"}
          </Button>
        </div>
      </div>

      {/* Seating Result Panel */}
      {seatingResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>תוצאת הושבה חכמה</span>
              <Badge variant="default">ציון: {seatingResult.score}/100</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {seatingResult.stats.totalSeated}
                </div>
                <div className="text-xs text-muted-foreground">מושבים</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {seatingResult.stats.fillRate}%
                </div>
                <div className="text-xs text-muted-foreground">מילוי</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {seatingResult.stats.emptySeats}
                </div>
                <div className="text-xs text-muted-foreground">ריקים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {seatingResult.stats.estimatedWaste > 0
                    ? `₪${seatingResult.stats.estimatedWaste.toLocaleString()}`
                    : "—"}
                </div>
                <div className="text-xs text-muted-foreground">בזבוז</div>
              </div>
            </div>

            <Progress value={seatingResult.stats.fillRate} className="h-2" />

            {/* Warnings */}
            {seatingResult.warnings.length > 0 && (
              <div className="space-y-1">
                {seatingResult.warnings.map((w, i) => (
                  <div
                    key={i}
                    className={`text-sm px-2 py-1 rounded ${
                      w.severity === "high"
                        ? "bg-red-100 text-red-700"
                        : w.severity === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {w.message}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {seatingResult.suggestions.length > 0 && (
              <div className="space-y-1">
                {seatingResult.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded flex justify-between"
                  >
                    <span>{s.message}</span>
                    <span className="font-medium">{s.impact}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => smartSeating.mutate(true)}
                disabled={smartSeating.isPending}
              >
                אשר ויישם
              </Button>
              <Button
                variant="outline"
                onClick={() => setSeatingResult(null)}
              >
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Canvas */}
        <FloorPlanCanvas
          tables={tables}
          selectedTableId={selectedTableId}
          onSelectTable={setSelectedTableId}
          onMoveTable={handleMoveTable}
        />

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Selected Table Info */}
          {selectedTable && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  שולחן {selectedTable.number}
                  {selectedTable.name && (
                    <Badge variant="outline">{selectedTable.name}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {selectedTable.guests?.length || 0} / {selectedTable.capacity}{" "}
                  מקומות
                </div>
                <Progress
                  value={
                    ((selectedTable.guests?.length || 0) /
                      selectedTable.capacity) *
                    100
                  }
                  className="h-2"
                />

                {/* Guests at table */}
                {selectedTable.guests?.length > 0 && (
                  <div className="space-y-1">
                    {selectedTable.guests.map(
                      (g: {
                        id: string;
                        firstName: string;
                        lastName: string;
                      }) => (
                        <div key={g.id} className="text-sm">
                          {g.firstName} {g.lastName || ""}
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleLock(selectedTable.id, selectedTable.isLocked)
                    }
                  >
                    {selectedTable.isLocked ? (
                      <>
                        <Unlock className="ml-1 h-3 w-3" />
                        בטל נעילה
                      </>
                    ) : (
                      <>
                        <Lock className="ml-1 h-3 w-3" />
                        נעל
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTable(selectedTable.id)}
                  >
                    <Trash2 className="ml-1 h-3 w-3" />
                    מחק
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unseated Guests */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                לא מושבים ({unseatedGuests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unseatedGuests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  כל המוזמנים מושבים
                </p>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {unseatedGuests.map(
                    (g: {
                      id: string;
                      firstName: string;
                      lastName: string;
                      group?: { name: string; color: string };
                    }) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => {
                          if (selectedTableId) {
                            seatGuest(g.id, selectedTableId);
                          }
                        }}
                      >
                        <span>
                          {g.firstName} {g.lastName || ""}
                        </span>
                        {g.group && (
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: g.group.color }}
                          />
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
              {selectedTableId && unseatedGuests.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  לחץ על אורח כדי להושיב בשולחן הנבחר
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Table Dialog */}
      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שולחן חדש</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTable} className="space-y-4">
            <div className="space-y-2">
              <Label>שם (אופציונלי)</Label>
              <Input name="name" placeholder="שולחן VIP" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>צורה</Label>
                <Select name="shape" defaultValue="ROUND">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUND">עגול</SelectItem>
                    <SelectItem value="RECTANGLE">מלבני</SelectItem>
                    <SelectItem value="SQUARE">ריבועי</SelectItem>
                    <SelectItem value="LONG">ארוך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>מקומות</Label>
                <Input
                  name="capacity"
                  type="number"
                  defaultValue="10"
                  min="2"
                  max="20"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>VIP</Label>
              <Select name="isVIP" defaultValue="false">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">רגיל</SelectItem>
                  <SelectItem value="true">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">הוסף שולחן</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
