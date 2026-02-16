"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Check, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VendorPackage {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export default function VendorPackagesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<VendorPackage | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [isPopular, setIsPopular] = useState(false);

  const { data: packages, isLoading } = useQuery<VendorPackage[]>({
    queryKey: ["vendor-packages"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/packages");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/vendor/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
      toast.success("חבילה נוצרה בהצלחה");
      resetForm();
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/vendor/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
      toast.success("חבילה עודכנה");
      resetForm();
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendor/packages?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-packages"] });
      toast.success("חבילה נמחקה");
    },
  });

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setFeatures("");
    setIsPopular(false);
    setEditingPkg(null);
  }

  function openEdit(pkg: VendorPackage) {
    setEditingPkg(pkg);
    setName(pkg.name);
    setDescription(pkg.description || "");
    setPrice(pkg.price?.toString() || "");
    setFeatures(pkg.features.join("\n"));
    setIsPopular(pkg.isPopular);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name,
      description,
      price: price || null,
      features: features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      isPopular,
    };

    if (editingPkg) {
      updateMutation.mutate({ ...data, id: editingPkg.id });
    } else {
      createMutation.mutate(data);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">חבילות שירות</h1>
          <p className="text-sm text-muted-foreground">
            הגדירו חבילות מחירים להצגה בפרופיל
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              חבילה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPkg ? "עריכת חבילה" : "חבילה חדשה"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>שם החבילה *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="למשל: חבילת פרימיום"
                />
              </div>
              <div className="space-y-2">
                <Label>תיאור</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>מחיר (₪)</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  dir="ltr"
                  className="text-left"
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label>פיצ׳רים (שורה לכל פיצ׳ר)</Label>
                <Textarea
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  rows={4}
                  placeholder={"צילום 8 שעות\nאלבום דיגיטלי\n300 תמונות ערוכות"}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>חבילה פופולרית</Label>
                <Switch checked={isPopular} onCheckedChange={setIsPopular} />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingPkg ? "שמור שינויים" : "צור חבילה"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {(!packages || packages.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין חבילות עדיין</h3>
            <p className="text-muted-foreground text-sm">
              צרו חבילות שירות כדי להציג ללקוחות
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.isPopular ? "border-primary shadow-md" : ""
              } ${!pkg.isActive ? "opacity-60" : ""}`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-0.5 rounded-full">
                  פופולרי
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(pkg.id)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {pkg.price && (
                  <div className="text-2xl font-black text-primary" dir="ltr">
                    ₪{pkg.price.toLocaleString()}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {pkg.description}
                  </p>
                )}
                {pkg.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
