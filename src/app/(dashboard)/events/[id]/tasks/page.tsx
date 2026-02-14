"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  category: string | null;
  priority: number;
}

const categories = ["הושבה", "ספקים", "תקשורת", "לוגיסטיקה", "מוזמנים", "כללי"];

export default function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: tasks = [] } = useQuery<TaskData[]>({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/tasks`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  async function toggleTask(taskId: string, completed: boolean) {
    await fetch(`/api/events/${id}/tasks`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, completed: !completed }),
    });
    queryClient.invalidateQueries({ queryKey: ["tasks", id] });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    await fetch(`/api/events/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        dueDate: formData.get("dueDate") || null,
        category: formData.get("category"),
        priority: formData.get("priority"),
      }),
    });

    setLoading(false);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["tasks", id] });
  }

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">משימות</h1>
          <p className="text-muted-foreground">
            {pendingTasks.length} משימות פתוחות ·{" "}
            {completedTasks.length} הושלמו
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="ml-2 h-4 w-4" />
          משימה חדשה
        </Button>
      </div>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">משימות פתוחות</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="mx-auto h-8 w-8 mb-2" />
              <p>אין משימות פתוחות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 py-2 border-b last:border-0"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground">
                        {task.description}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1">
                      {task.category && (
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          עד{" "}
                          {format(new Date(task.dueDate), "dd/MM/yyyy", {
                            locale: he,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              הושלמו ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 border-b last:border-0 opacity-60"
                >
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                  />
                  <span className="line-through">{task.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>משימה חדשה</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input name="title" required placeholder="מה צריך לעשות?" />
            </div>
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea name="description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תאריך יעד</Label>
                <Input name="dueDate" type="date" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>קטגוריה</Label>
                <Select name="category" defaultValue="כללי">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>עדיפות (1-10)</Label>
              <Input
                name="priority"
                type="number"
                min="1"
                max="10"
                defaultValue="5"
                dir="ltr"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "יוצר..." : "צור משימה"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
