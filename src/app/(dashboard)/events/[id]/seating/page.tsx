"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  Plus,
  Brain,
  Trash2,
  Lock,
  Unlock,
  CircleDot,
  RectangleHorizontal,
  Square,
  Minus,
  Users,
  GripVertical,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div
        className="border rounded-xl flex items-center justify-center h-[600px]"
        style={{ backgroundColor: "#FAF8F5" }}
      >
        <div className="text-muted-foreground">טוען מפת הושבה...</div>
      </div>
    ),
  }
);

interface GuestData {
  id: string;
  firstName: string;
  lastName: string | null;
  groupId: string | null;
  side: string;
  rsvpStatus: string;
  seatNumber?: number | null;
  tableId?: string | null;
  group?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

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
  const [seatingResult, setSeatingResult] = useState<SeatingResultData | null>(
    null
  );
  const [dragGuestId, setDragGuestId] = useState<string | null>(null);
  const [dropTargetTableId, setDropTargetTableId] = useState<string | null>(
    null
  );
  const [sideTab, setSideTab] = useState("guests");

  const { data: tables = [] } = useQuery({
    queryKey: ["tables", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/tables`);
      if (!res.ok) throw new Error("Failed to fetch tables");
      return res.json();
    },
  });

  const { data: allGuests = [] } = useQuery({
    queryKey: ["all-guests", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/guests`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const unseatedGuests: GuestData[] = allGuests.filter(
    (g: GuestData) =>
      !g.tableId &&
      (g.rsvpStatus === "CONFIRMED" || g.rsvpStatus === "PENDING")
  );

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/groups`);
      if (!res.ok) return [];
      return res.json();
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
      setSideTab("results");
      if (apply) {
        queryClient.invalidateQueries({ queryKey: ["tables", id] });
        queryClient.invalidateQueries({ queryKey: ["all-guests", id] });
        toast.success(`הושבה חכמה הושלמה! ציון: ${data.score}/100`);
      }
    },
  });

  // Quick add table
  async function quickAddTable(shape: string) {
    const res = await fetch(`/api/events/${id}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shape,
        capacity: shape === "LONG" ? 12 : 10,
      }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["tables", id] });
      toast.success("שולחן נוסף בהצלחה");
    }
  }

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
      toast.success("שולחן נוסף בהצלחה");
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
    queryClient.invalidateQueries({ queryKey: ["all-guests", id] });
    toast.success("אורח הושב בהצלחה");
  }

  async function unseatGuest(guestId: string) {
    await fetch(`/api/events/${id}/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: null }),
    });
    queryClient.invalidateQueries({ queryKey: ["tables", id] });
    queryClient.invalidateQueries({ queryKey: ["all-guests", id] });
  }

  // Drag and drop handlers
  const handleGuestDragStart = useCallback(
    (e: React.DragEvent, guestId: string) => {
      setDragGuestId(guestId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", guestId);
    },
    []
  );

  const handleDropOnCanvas = useCallback(
    (tableId: string) => {
      if (dragGuestId) {
        seatGuest(dragGuestId, tableId);
        setDragGuestId(null);
        setDropTargetTableId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dragGuestId, id]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedTable = tables.find((t: any) => t.id === selectedTableId);

  // Stats
  const totalCapacity = tables.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, t: any) => sum + t.capacity,
    0
  );
  const totalSeated = tables.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, t: any) => sum + (t.guests?.length || 0),
    0
  );

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl border p-3 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">מפת הושבה</h1>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{tables.length} שולחנות</span>
            <span>·</span>
            <span>{totalSeated}/{totalCapacity} מושבים</span>
            <span>·</span>
            <span className="text-amber-600 font-medium">
              {unseatedGuests.length} ממתינים
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick add buttons */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all"
              title="שולחן עגול"
              onClick={() => quickAddTable("ROUND")}
            >
              <CircleDot className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all"
              title="שולחן מלבני"
              onClick={() => quickAddTable("RECTANGLE")}
            >
              <RectangleHorizontal className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all"
              title="שולחן ריבועי"
              onClick={() => quickAddTable("SQUARE")}
            >
              <Square className="h-4 w-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all"
              title="שולחן ארוך"
              onClick={() => quickAddTable("LONG")}
            >
              <Minus className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddTable(true)}
          >
            <Plus className="ml-1 h-3.5 w-3.5" />
            מותאם
          </Button>

          <div className="h-6 w-px bg-gray-200" />

          <Button
            size="sm"
            onClick={() => smartSeating.mutate(false)}
            disabled={smartSeating.isPending}
            className="bg-gradient-to-l from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Brain className="ml-1 h-3.5 w-3.5" />
            {smartSeating.isPending ? "חושב..." : "הושבה חכמה"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-[1fr_320px] gap-3 items-start">
        {/* Canvas */}
        <FloorPlanCanvas
          tables={tables}
          selectedTableId={selectedTableId}
          dropTargetTableId={dropTargetTableId}
          onSelectTable={(tableId) => {
            setSelectedTableId(tableId);
            if (tableId) setSideTab("table");
          }}
          onMoveTable={handleMoveTable}
          onDropGuest={handleDropOnCanvas}
        />

        {/* Side Panel */}
        <div className="space-y-3">
          <Tabs value={sideTab} onValueChange={setSideTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="guests" className="text-xs">
                <Users className="ml-1 h-3 w-3" />
                אורחים ({unseatedGuests.length})
              </TabsTrigger>
              <TabsTrigger value="table" className="text-xs">
                שולחן
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs">
                תוצאות
              </TabsTrigger>
            </TabsList>

            {/* Unseated Guests Tab */}
            <TabsContent value="guests" className="mt-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    ממתינים להושבה ({unseatedGuests.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    גרור אורח לשולחן או בחר שולחן ולחץ
                  </p>
                </CardHeader>
                <CardContent>
                  {unseatedGuests.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-2xl mb-1">🎉</div>
                      <p className="text-sm text-muted-foreground">
                        כל המוזמנים מושבים!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[450px] overflow-y-auto">
                      {/* Group by group */}
                      {groups
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .filter((g: any) =>
                          unseatedGuests.some(
                            (guest) => guest.groupId === g.id
                          )
                        )
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((group: any) => (
                          <div key={group.id} className="mb-2">
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: group.color }}
                              />
                              <span className="text-xs font-medium text-gray-500">
                                {group.name}
                              </span>
                            </div>
                            {unseatedGuests
                              .filter((g) => g.groupId === group.id)
                              .map((guest) => (
                                <GuestCard
                                  key={guest.id}
                                  guest={guest}
                                  selectedTableId={selectedTableId}
                                  onDragStart={handleGuestDragStart}
                                  onSeat={(guestId) => {
                                    if (selectedTableId)
                                      seatGuest(guestId, selectedTableId);
                                  }}
                                />
                              ))}
                          </div>
                        ))}

                      {/* Ungrouped guests */}
                      {unseatedGuests.filter((g) => !g.groupId).length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                            <span className="text-xs font-medium text-gray-500">
                              ללא קבוצה
                            </span>
                          </div>
                          {unseatedGuests
                            .filter((g) => !g.groupId)
                            .map((guest) => (
                              <GuestCard
                                key={guest.id}
                                guest={guest}
                                selectedTableId={selectedTableId}
                                onDragStart={handleGuestDragStart}
                                onSeat={(guestId) => {
                                  if (selectedTableId)
                                    seatGuest(guestId, selectedTableId);
                                }}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Table Details Tab */}
            <TabsContent value="table" className="mt-3">
              {selectedTable ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>שולחן {selectedTable.number}</span>
                      <div className="flex items-center gap-1">
                        {selectedTable.isVIP && (
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-300 text-amber-600"
                          >
                            VIP
                          </Badge>
                        )}
                        {selectedTable.name && (
                          <Badge variant="outline" className="text-xs">
                            {selectedTable.name}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">תפוסה</span>
                      <span className="font-medium">
                        {selectedTable.guests?.length || 0} /{" "}
                        {selectedTable.capacity}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((selectedTable.guests?.length || 0) /
                          selectedTable.capacity) *
                        100
                      }
                      className="h-2"
                    />

                    {/* Seated guests list */}
                    {selectedTable.guests?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          אורחים בשולחן
                        </div>
                        {selectedTable.guests.map(
                          (g: GuestData) => (
                            <div
                              key={g.id}
                              className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50 group"
                            >
                              <div className="flex items-center gap-2">
                                {g.group && (
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor: g.group.color,
                                    }}
                                  />
                                )}
                                <span>
                                  {g.firstName} {g.lastName || ""}
                                </span>
                              </div>
                              <button
                                className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                                onClick={() => unseatGuest(g.id)}
                              >
                                הסר
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          handleToggleLock(
                            selectedTable.id,
                            selectedTable.isLocked
                          )
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      בחר שולחן במפה כדי לראות פרטים
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="mt-3">
              {seatingResult ? (
                <Card className="border-purple-200 bg-purple-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>תוצאת הושבה חכמה</span>
                      <Badge className="bg-gradient-to-l from-purple-600 to-blue-600">
                        {seatingResult.score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-lg font-bold">
                          {seatingResult.stats.totalSeated}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          מושבים
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-lg font-bold">
                          {seatingResult.stats.fillRate}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          מילוי
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-lg font-bold">
                          {seatingResult.stats.emptySeats}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ריקים
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-red-600">
                          {seatingResult.stats.estimatedWaste > 0
                            ? `₪${seatingResult.stats.estimatedWaste.toLocaleString()}`
                            : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          בזבוז
                        </div>
                      </div>
                    </div>

                    <Progress
                      value={seatingResult.stats.fillRate}
                      className="h-2"
                    />

                    {/* Warnings */}
                    {seatingResult.warnings.length > 0 && (
                      <div className="space-y-1">
                        {seatingResult.warnings.map((w, i) => (
                          <div
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
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
                            className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded flex justify-between"
                          >
                            <span>{s.message}</span>
                            <span className="font-medium">{s.impact}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => smartSeating.mutate(true)}
                        disabled={smartSeating.isPending}
                      >
                        אשר ויישם
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSeatingResult(null)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                    <p className="text-sm text-muted-foreground">
                      הפעל הושבה חכמה כדי לראות תוצאות
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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

// Guest Card component for drag & drop
function GuestCard({
  guest,
  selectedTableId,
  onDragStart,
  onSeat,
}: {
  guest: GuestData;
  selectedTableId: string | null;
  onDragStart: (e: React.DragEvent, guestId: string) => void;
  onSeat: (guestId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, guest.id)}
      className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:bg-gray-50 border border-transparent hover:border-gray-200 hover:shadow-sm ${
        selectedTableId ? "hover:bg-blue-50 hover:border-blue-200" : ""
      }`}
      onClick={() => {
        if (selectedTableId) onSeat(guest.id);
      }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-3 w-3 text-gray-300" />
        {guest.group && (
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: guest.group.color }}
          />
        )}
        <span className="truncate">
          {guest.firstName} {guest.lastName || ""}
        </span>
      </div>
      {guest.side !== "SHARED" && (
        <span className="text-[10px] text-gray-400">
          {guest.side === "BRIDE" ? "כלה" : "חתן"}
        </span>
      )}
    </div>
  );
}
