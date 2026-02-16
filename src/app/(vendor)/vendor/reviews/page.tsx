"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/marketplace/rating-stars";
import { MessageSquare, Send, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  text: string | null;
  eventType: string | null;
  createdAt: string;
  vendorResponse: string | null;
  respondedAt: string | null;
  user: { name: string };
}

export default function VendorReviewsPage() {
  const queryClient = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["vendor-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/reviews");
      return res.json();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/profile");
      return res.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ reviewId, vendorResponse }: { reviewId: string; vendorResponse: string }) => {
      const res = await fetch("/api/vendor/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, vendorResponse }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-reviews"] });
      toast.success("תגובה נשלחה");
      setRespondingId(null);
      setResponseText("");
    },
  });

  const totalReviews = Array.isArray(reviews) ? reviews.length : 0;
  const avgRating = profile?.ratingAverage || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ביקורות</h1>
        <p className="text-sm text-muted-foreground">
          ביקורות שהתקבלו מלקוחות
        </p>
      </div>

      {/* Summary */}
      {totalReviews > 0 && (
        <Card>
          <CardContent className="py-5 flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-black">{avgRating.toFixed(1)}</div>
              <RatingStars rating={avgRating} size="md" />
            </div>
            <div className="text-sm text-muted-foreground">
              <div>{totalReviews} ביקורות</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {totalReviews === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין ביקורות עדיין</h3>
            <p className="text-muted-foreground text-sm">
              ביקורות מלקוחות יופיעו כאן
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews!.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {review.user.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {review.user.name}
                      </div>
                      {review.eventType && (
                        <div className="text-xs text-muted-foreground">
                          {review.eventType}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: he })}
                  </div>
                </div>

                <RatingStars rating={review.rating} size="sm" />

                {review.title && (
                  <h4 className="font-bold text-sm mt-2">{review.title}</h4>
                )}
                {review.text && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {review.text}
                  </p>
                )}

                {/* Vendor response */}
                {review.vendorResponse ? (
                  <div className="mt-3 mr-4 p-3 bg-muted/50 rounded-lg border-r-2 border-primary">
                    <div className="text-xs font-medium text-primary mb-1">
                      התגובה שלכם
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.vendorResponse}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    {respondingId === review.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={2}
                          placeholder="כתבו תגובה..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              respondMutation.mutate({
                                reviewId: review.id,
                                vendorResponse: responseText,
                              })
                            }
                            disabled={!responseText.trim() || respondMutation.isPending}
                          >
                            {respondMutation.isPending ? (
                              <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="ml-2 h-3.5 w-3.5" />
                            )}
                            שלח
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRespondingId(null);
                              setResponseText("");
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRespondingId(review.id)}
                        className="text-primary"
                      >
                        <MessageSquare className="ml-2 h-3.5 w-3.5" />
                        הגיבו
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
