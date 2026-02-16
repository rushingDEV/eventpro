"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePlus, Trash2, Loader2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VendorImage {
  id: string;
  url: string;
  publicId: string | null;
  caption: string | null;
  order: number;
}

export default function VendorGalleryPage() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: images, isLoading } = useQuery<VendorImage[]>({
    queryKey: ["vendor-images"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/images");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await fetch(`/api/vendor/images?id=${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-images"] });
      toast.success("תמונה נמחקה");
    },
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Get upload signature
      const sigRes = await fetch("/api/vendor/upload", { method: "POST" });
      const sigData = await sigRes.json();

      if (!sigData.cloudName) {
        // Cloudinary not configured — use placeholder URL
        for (const file of Array.from(files)) {
          const url = URL.createObjectURL(file);
          await fetch("/api/vendor/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: `/placeholder-${file.name}` }),
          });
        }
        toast.info("Cloudinary לא מוגדר — התמונות נשמרו כ-placeholder");
        queryClient.invalidateQueries({ queryKey: ["vendor-images"] });
        setUploading(false);
        return;
      }

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sigData.apiKey);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        const uploadData = await uploadRes.json();

        // Save to DB
        await fetch("/api/vendor/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: uploadData.secure_url,
            publicId: uploadData.public_id,
            width: uploadData.width,
            height: uploadData.height,
          }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["vendor-images"] });
      toast.success(`${files.length} תמונות הועלו בהצלחה`);
    } catch {
      toast.error("שגיאה בהעלאת תמונות");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">גלריה</h1>
          <p className="text-sm text-muted-foreground">
            העלו תמונות מהעבודות שלכם (עד 10 תמונות)
          </p>
        </div>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading || (images?.length || 0) >= 10}
          />
          <Button
            disabled={uploading || (images?.length || 0) >= 10}
          >
            {uploading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                מעלה...
              </>
            ) : (
              <>
                <ImagePlus className="ml-2 h-4 w-4" />
                העלאת תמונות
              </>
            )}
          </Button>
        </div>
      </div>

      {(!images || images.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין תמונות עדיין</h3>
            <p className="text-muted-foreground text-sm mb-4">
              העלו תמונות מהעבודות שלכם כדי למשוך לקוחות
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group aspect-[4/3] rounded-xl overflow-hidden border bg-muted"
            >
              {img.url.startsWith("/placeholder") ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <Image
                  src={img.url}
                  alt={img.caption || ""}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                onClick={() => deleteMutation.mutate(img.id)}
                className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                  {img.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
