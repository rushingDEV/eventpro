"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Send, MessageSquare, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { messageTemplates, renderTemplate } from "@/lib/templates";
import { toast } from "sonner";

interface Guest {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  rsvpStatus: string;
}

export default function CommunicationPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: ["guests", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/guests`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: [...selectedGuests],
          type: "whatsapp",
          template: selectedTemplate,
          content: messageContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`נשלחו ${data.sent} הודעות`);
      setSelectedGuests(new Set());
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId);
    const template = messageTemplates.find((t) => t.id === templateId);
    if (template) {
      setMessageContent(template.content);
    }
  }

  function toggleGuest(guestId: string) {
    const next = new Set(selectedGuests);
    if (next.has(guestId)) {
      next.delete(guestId);
    } else {
      next.add(guestId);
    }
    setSelectedGuests(next);
  }

  function selectAll() {
    const filtered = filteredGuests();
    if (selectedGuests.size === filtered.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filtered.map((g) => g.id)));
    }
  }

  function filteredGuests(): Guest[] {
    return guests.filter((g) => {
      if (filterStatus === "all") return true;
      return g.rsvpStatus === filterStatus;
    });
  }

  const rsvpLabels: Record<string, string> = {
    PENDING: "ממתין",
    CONFIRMED: "אישר",
    DECLINED: "לא מגיע",
    MAYBE: "אולי",
    NO_RESPONSE: "לא ענה",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">תקשורת</h1>
        <p className="text-muted-foreground">שליחת הודעות WhatsApp ו-SMS</p>
      </div>

      <div className="grid grid-cols-[1fr_350px] gap-6">
        {/* Message Composer */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">חיבור הודעה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>תבנית</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תבנית או כתוב מאפס" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>תוכן ההודעה</Label>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={10}
                  placeholder="כתוב את ההודעה כאן..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  משתנים: {"{guestName}"}, {"{eventName}"}, {"{eventDate}"},{" "}
                  {"{rsvpLink}"}
                </p>
              </div>

              <Button
                onClick={() => sendMutation.mutate()}
                disabled={
                  selectedGuests.size === 0 ||
                  !messageContent ||
                  sendMutation.isPending
                }
              >
                <Send className="ml-2 h-4 w-4" />
                {sendMutation.isPending
                  ? "שולח..."
                  : `שלח ל-${selectedGuests.size} אורחים`}
              </Button>
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                היסטוריה ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין הודעות עדיין</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {messages.map(
                    (m: {
                      id: string;
                      guest: { firstName: string; lastName: string };
                      type: string;
                      status: string;
                      sentAt: string;
                      content: string;
                    }) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                      >
                        <div>
                          <span className="font-medium">
                            {m.guest.firstName} {m.guest.lastName}
                          </span>
                          <span className="text-muted-foreground mr-2">
                            — {m.type}
                          </span>
                        </div>
                        <Badge
                          variant={
                            m.status === "sent" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {m.status === "sent" ? "נשלח" : m.status}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guest Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                <Users className="inline ml-2 h-4 w-4" />
                נמענים
              </span>
              <Badge variant="outline">{selectedGuests.size} נבחרו</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="PENDING">ממתינים</SelectItem>
                <SelectItem value="CONFIRMED">אישרו</SelectItem>
                <SelectItem value="DECLINED">לא מגיעים</SelectItem>
                <SelectItem value="NO_RESPONSE">לא ענו</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedGuests.size === filteredGuests().length
                ? "בטל הכל"
                : "בחר הכל"}
            </Button>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredGuests().map((guest) => (
                <label
                  key={guest.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedGuests.has(guest.id)}
                    onCheckedChange={() => toggleGuest(guest.id)}
                  />
                  <span className="flex-1">
                    {guest.firstName} {guest.lastName || ""}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {rsvpLabels[guest.rsvpStatus] || guest.rsvpStatus}
                  </Badge>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
