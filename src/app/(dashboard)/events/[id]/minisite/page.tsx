"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Globe, Copy, ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function MinisitePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [slug, setSlug] = useState("");
  const [wazeLink, setWazeLink] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [parking, setParking] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    if (event) {
      setSlug(event.miniSiteSlug || "");
      const config = event.miniSiteConfig as Record<string, string> | null;
      setWazeLink(config?.wazeLink || "");
      setDressCode(config?.dressCode || "");
      setParking(config?.parking || "");
      setGreeting(config?.greeting || "");
    }
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miniSiteSlug: slug || null,
          miniSiteConfig: {
            wazeLink,
            dressCode,
            parking,
            greeting,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      toast.success("מיני-סייט נשמר בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
  });

  const rsvpUrl = slug ? `${window.location.origin}/rsvp/${slug}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">מיני-סייט</h1>
          <p className="text-muted-foreground">
            דף אישור הגעה מעוצב לאורחים
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          <Save className="ml-2 h-4 w-4" />
          {saveMutation.isPending ? "שומר..." : "שמור"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">הגדרות קישור</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>כתובת מותאמת (slug)</Label>
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground pt-2">
                    /rsvp/
                  </span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="dana-yossi"
                    dir="ltr"
                  />
                </div>
              </div>

              {rsvpUrl && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate" dir="ltr">
                    {rsvpUrl}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(rsvpUrl);
                      toast.success("הקישור הועתק");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => window.open(rsvpUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי האירוע</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ברכה / טקסט מותאם</Label>
                <Textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="שמחים להזמין אתכם..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>קישור Waze</Label>
                <Input
                  value={wazeLink}
                  onChange={(e) => setWazeLink(e.target.value)}
                  placeholder="https://waze.com/ul/..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>Dress Code</Label>
                <Input
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  placeholder="אלגנט"
                />
              </div>
              <div className="space-y-2">
                <Label>חניה</Label>
                <Input
                  value={parking}
                  onChange={(e) => setParking(e.target.value)}
                  placeholder="חניה חינם במגרש הצמוד"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">תצוגה מקדימה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-gradient-to-b from-rose-50 to-white p-6 text-center space-y-4">
              <div className="text-3xl">💕</div>
              <h2 className="text-xl font-bold">{event?.name || "שם האירוע"}</h2>
              {greeting && (
                <p className="text-muted-foreground text-sm">{greeting}</p>
              )}
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>📅 תאריך האירוע</div>
                {event?.time && <div>🕖 שעה {event.time}</div>}
                {dressCode && <div>👔 {dressCode}</div>}
                {parking && <div>🅿️ {parking}</div>}
              </div>
              {wazeLink && (
                <Button variant="outline" size="sm">
                  📍 הגעה ב-Waze
                </Button>
              )}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">האם תגיעו?</div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline">
                    🎉 מגיעים!
                  </Button>
                  <Button size="sm" variant="outline">
                    😔 לא הפעם
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
