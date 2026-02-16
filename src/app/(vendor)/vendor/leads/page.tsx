"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Mail, Calendar, Users2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface Lead {
  id: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  eventDate: string | null;
  eventType: string | null;
  guestCount: number | null;
  message: string | null;
  status: string;
  vendorNotes: string | null;
  createdAt: string;
  user: { name: string; email: string | null };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: "חדש", color: "bg-primary/10 text-primary" },
  VIEWED: { label: "נצפה", color: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "נוצר קשר", color: "bg-indigo-100 text-indigo-700" },
  IN_PROGRESS: { label: "בטיפול", color: "bg-amber-100 text-amber-700" },
  WON: { label: "נסגר", color: "bg-green-100 text-green-700" },
  LOST: { label: "הפסד", color: "bg-red-100 text-red-700" },
  EXPIRED: { label: "פג תוקף", color: "bg-gray-100 text-gray-700" },
};

export default function VendorLeadsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["vendor-leads"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/leads");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch("/api/vendor/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      toast.success("סטטוס עודכן");
    },
  });

  const filteredLeads = Array.isArray(leads)
    ? statusFilter === "all"
      ? leads
      : leads.filter((l) => l.status === statusFilter)
    : [];

  const newCount = Array.isArray(leads) ? leads.filter((l) => l.status === "NEW").length : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">לידים ופניות</h1>
          <p className="text-sm text-muted-foreground">
            {newCount > 0
              ? `${newCount} פניות חדשות מחכות לכם`
              : "כל הפניות שהגיעו אליכם"}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="סינון" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל ({leads?.length || 0})</SelectItem>
            {Object.entries(statusLabels).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין פניות</h3>
            <p className="text-muted-foreground text-sm">
              פניות מזוגות מתכננים יופיעו כאן
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const statusInfo = statusLabels[lead.status] || statusLabels.NEW;
            return (
              <Card key={lead.id} className={lead.status === "NEW" ? "border-primary/30" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{lead.contactName}</h3>
                        <Badge className={statusInfo.color} variant="secondary">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(lead.createdAt).toLocaleDateString("he-IL")}{" "}
                        {new Date(lead.createdAt).toLocaleTimeString("he-IL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <Select
                      value={lead.status}
                      onValueChange={(status) =>
                        updateMutation.mutate({ id: lead.id, status })
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, val]) => (
                          <SelectItem key={key} value={key}>
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    {lead.contactPhone && (
                      <a
                        href={`tel:${lead.contactPhone}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span dir="ltr">{lead.contactPhone}</span>
                      </a>
                    )}
                    {(lead.contactEmail || lead.user.email) && (
                      <a
                        href={`mailto:${lead.contactEmail || lead.user.email}`}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {lead.contactEmail || lead.user.email}
                      </a>
                    )}
                    {lead.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(lead.eventDate).toLocaleDateString("he-IL")}
                      </span>
                    )}
                    {lead.guestCount && (
                      <span className="flex items-center gap-1">
                        <Users2 className="h-3.5 w-3.5" />
                        {lead.guestCount} מוזמנים
                      </span>
                    )}
                  </div>

                  {lead.message && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <MessageSquare className="h-3.5 w-3.5 inline-block ml-1 text-muted-foreground" />
                      {lead.message}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
