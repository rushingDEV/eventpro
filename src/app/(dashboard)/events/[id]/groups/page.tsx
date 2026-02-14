"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sideLabels: Record<string, string> = {
  GROOM: "חתן",
  BRIDE: "כלה",
  SHARED: "משותף",
};

const defaultColors = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

interface Group {
  id: string;
  name: string;
  side: string;
  color: string;
  priority: number;
  _count: { guests: number };
}

export default function GroupsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["groups", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/groups`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["groups", id] });
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch(`/api/events/${id}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        side: formData.get("side"),
        color: formData.get("color"),
      }),
    });

    setLoading(false);

    if (res.ok) {
      refresh();
      setShowForm(false);
    }
  }

  async function handleDelete(groupId: string) {
    if (!confirm("האם למחוק את הקבוצה? המוזמנים לא יימחקו.")) return;
    await fetch(`/api/events/${id}/groups/${groupId}`, {
      method: "DELETE",
    });
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">קבוצות קרבה</h1>
          <p className="text-muted-foreground">
            ארגון המוזמנים לקבוצות להושבה חכמה
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="ml-2 h-4 w-4" />
          קבוצה חדשה
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">אין קבוצות עדיין</h3>
            <p className="text-muted-foreground mb-4">
              צור קבוצות כמו &quot;משפחת החתן&quot;, &quot;חברים מהצבא&quot; וכו&apos;
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="ml-2 h-4 w-4" />
              צור קבוצה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <CardTitle className="text-base">{group.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(group.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{sideLabels[group.side]}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {group._count.guests} מוזמנים
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>קבוצה חדשה</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם הקבוצה</Label>
              <Input
                id="name"
                name="name"
                placeholder='למשל: "משפחת החתן", "חברים מהצבא"'
                required
              />
            </div>

            <div className="space-y-2">
              <Label>צד</Label>
              <Select name="side" defaultValue="SHARED">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROOM">חתן</SelectItem>
                  <SelectItem value="BRIDE">כלה</SelectItem>
                  <SelectItem value="SHARED">משותף</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>צבע</Label>
              <div className="flex gap-2">
                {defaultColors.map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      defaultChecked={color === "#3B82F6"}
                      className="sr-only peer"
                    />
                    <div
                      className="h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-foreground transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "יוצר..." : "צור קבוצה"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
