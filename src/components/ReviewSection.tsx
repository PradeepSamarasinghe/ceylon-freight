import { useState, useEffect } from "react";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_type: string;
  created_at: string;
}

interface ReviewSectionProps {
  shipmentId: string;
  isDelivered: boolean;
  isOwner: boolean;
}

const ReviewSection = ({ shipmentId, isDelivered, isOwner }: ReviewSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasReviewed = reviews.some(
    (r) => r.reviewer_type === (isOwner ? "shipper" : "driver")
  );

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: true });
      if (data) setReviews(data as Review[]);
      setLoading(false);
    };
    fetchReviews();
  }, [shipmentId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        shipment_id: shipmentId,
        rating,
        comment: comment.trim() || null,
        reviewer_type: isOwner ? "shipper" : "driver",
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setReviews((prev) => [...prev, data as Review]);
      setRating(0);
      setComment("");
    }
  };

  if (!isDelivered) return null;

  return (
    <Card className="mt-4 border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Star className="h-4 w-4 text-accent" /> Reviews & Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Reviews */}
        {loading ? (
          <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {r.reviewer_type}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= r.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No reviews yet for this shipment.</p>
        )}

        {/* Submit Review Form */}
        {user && !hasReviewed && (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <p className="text-sm font-medium text-foreground">Leave a review</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoveredStar(s)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      s <= (hoveredStar || rating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
              )}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="min-h-[80px] bg-secondary/30 border-border/50 text-foreground placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              size="sm"
              className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Submitting…" : "Submit Review"}
            </Button>
          </div>
        )}

        {user && hasReviewed && (
          <p className="text-xs text-muted-foreground/70 border-t border-border/50 pt-3">
            ✓ You've already reviewed this shipment.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSection;
