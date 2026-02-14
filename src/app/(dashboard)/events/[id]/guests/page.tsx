"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuestTable } from "@/components/guests/guest-table";
import { GuestForm } from "@/components/guests/guest-form";
import { ImportDialog } from "@/components/guests/import-dialog";

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["guests", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/guests`);
      if (!res.ok) throw new Error("Failed to fetch guests");
      return res.json();
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/groups`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["guests", id] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">מוזמנים</h1>
          <p className="text-muted-foreground">
            ניהול רשימת המוזמנים לאירוע
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="ml-2 h-4 w-4" />
            ייבוא
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="ml-2 h-4 w-4" />
            הוסף מוזמן
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : (
        <GuestTable guests={guests} eventId={id} onRefresh={refresh} />
      )}

      <GuestForm
        eventId={id}
        groups={groups}
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={refresh}
      />

      <ImportDialog
        eventId={id}
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={refresh}
      />
    </div>
  );
}
