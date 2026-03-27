import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  Clock,
  Phone,
  Building2,
  Weight,
  DollarSign,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import ReviewSection from "@/components/ReviewSection";
import { format } from "date-fns";
import { toast } from "sonner";

interface Shipment {
  id: string;
  status: string;
  shipper_name: string;
  shipper_phone: string;
  shipper_company: string | null;
  pickup_district: string;
  pickup_address: string | null;
  pickup_landmark: string | null;
  delivery_district: string;
  delivery_address: string | null;
  delivery_landmark: string | null;
  cargo_type: string;
  cargo_description: string | null;
  weight_kg: number;
  truck_type: string;
  load_type: string;
  dimensions_l: number | null;
  dimensions_w: number | null;
  dimensions_h: number | null;
  offered_price_lkr: number | null;
  estimated_price_low: number | null;
  estimated_price_high: number | null;
  payment_method: string | null;
  special_instructions: string | null;
  pickup_date: string | null;
  created_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  driver_helper: boolean | null;
  tail_lift_required: boolean | null;
  ac_required: boolean | null;
  user_id: string | null;
}

interface Driver {
  name: string;
  phone: string;
  truck_type: string;
  truck_registration: string | null;
  rating: number | null;
}

const STATUS_STEPS = ["pending", "accepted", "picked_up", "in_transit", "delivered"];

const statusColor = (s: string) => {
  switch (s) {
    case "pending": return "bg-muted text-muted-foreground";
    case "accepted": return "bg-primary/20 text-primary";
    case "picked_up": return "bg-accent/20 text-accent";
    case "in_transit": return "bg-primary/20 text-primary";
    case "delivered": return "bg-success/20 text-success";
    case "cancelled": return "bg-destructive/20 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const ShipmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchShipment = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setShipment(data as Shipment);
        if (data.driver_id) {
          const { data: driverData } = await supabase
            .from("drivers")
            .select("name, phone, truck_type, truck_registration, rating")
            .eq("id", data.driver_id)
            .single();
          if (driverData) setDriver(driverData);
        }
      }
      setLoading(false);
    };
    fetchShipment();
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h1 className="text-xl font-heading font-bold text-foreground">Shipment not found</h1>
          <p className="text-sm text-muted-foreground mt-1">The shipment you're looking for doesn't exist.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(shipment.status);
  const isCancelled = shipment.status === "cancelled";
  const isDelivered = shipment.status === "delivered";
  const isOwner = user?.id === shipment.user_id;
  const canCancel = isOwner && !isCancelled && !isDelivered;

  const handleCancel = async () => {
    setCancelling(true);
    const { error } = await supabase
      .from("shipments")
      .update({ status: "cancelled" })
      .eq("id", shipment.id);
    setCancelling(false);
    if (error) {
      toast.error("Failed to cancel shipment");
    } else {
      setShipment({ ...shipment, status: "cancelled" });
      toast.success("Shipment cancelled");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-heading font-bold text-foreground truncate">
                {shipment.pickup_district} → {shipment.delivery_district}
              </h1>
              <Badge className={statusColor(shipment.status)}>
                {shipment.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              ID: {shipment.id} · Created {format(new Date(shipment.created_at), "MMM d, yyyy")}
            </p>
          </div>
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4" /> Cancel Shipment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-heading">Cancel this shipment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the shipment from {shipment.pickup_district} to {shipment.delivery_district}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Keep Shipment</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelling ? "Cancelling…" : "Yes, Cancel"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <Card className="mb-4 border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div className={`h-0.5 flex-1 ${i <= currentStep ? "bg-primary" : "bg-border"}`} />
                        )}
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : done
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                        )}
                      </div>
                      <span className={`mt-1.5 text-[10px] font-medium capitalize ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Route */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium text-foreground">{shipment.pickup_district}</p>
                {shipment.pickup_address && <p className="text-xs text-muted-foreground">{shipment.pickup_address}</p>}
                {shipment.pickup_landmark && <p className="text-xs text-muted-foreground/70">Near: {shipment.pickup_landmark}</p>}
              </div>
              <Separator className="bg-border/50" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="text-sm font-medium text-foreground">{shipment.delivery_district}</p>
                {shipment.delivery_address && <p className="text-xs text-muted-foreground">{shipment.delivery_address}</p>}
                {shipment.delivery_landmark && <p className="text-xs text-muted-foreground/70">Near: {shipment.delivery_landmark}</p>}
              </div>
              {shipment.pickup_date && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Pickup: {format(new Date(shipment.pickup_date), "MMM d, yyyy h:mm a")}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cargo */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground font-medium">{shipment.cargo_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weight</span>
                <span className="text-foreground font-medium">{shipment.weight_kg} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Load</span>
                <span className="text-foreground font-medium">{shipment.load_type}</span>
              </div>
              {shipment.dimensions_l && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span className="text-foreground font-medium">
                    {shipment.dimensions_l}×{shipment.dimensions_w}×{shipment.dimensions_h} cm
                  </span>
                </div>
              )}
              {shipment.cargo_description && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">{shipment.cargo_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Truck & Requirements */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" /> Truck & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Truck Type</span>
                <span className="text-foreground font-medium">{shipment.truck_type}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {shipment.driver_helper && <Badge variant="secondary" className="text-xs">Driver Helper</Badge>}
                {shipment.tail_lift_required && <Badge variant="secondary" className="text-xs">Tail Lift</Badge>}
                {shipment.ac_required && <Badge variant="secondary" className="text-xs">AC Required</Badge>}
                {!shipment.driver_helper && !shipment.tail_lift_required && !shipment.ac_required && (
                  <span className="text-xs text-muted-foreground">No special requirements</span>
                )}
              </div>
              {shipment.special_instructions && (
                <div className="pt-1 border-t border-border/50 mt-2">
                  <p className="text-xs text-muted-foreground mt-2">{shipment.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Shipper */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" /> Pricing & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {shipment.offered_price_lkr && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offered Price</span>
                  <span className="text-foreground font-bold">LKR {shipment.offered_price_lkr.toLocaleString()}</span>
                </div>
              )}
              {shipment.estimated_price_low && shipment.estimated_price_high && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Range</span>
                  <span className="text-foreground font-medium">
                    LKR {shipment.estimated_price_low.toLocaleString()} – {shipment.estimated_price_high.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <span className="text-foreground font-medium">{shipment.payment_method || "N/A"}</span>
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground">{shipment.shipper_name}</span>
                {shipment.shipper_company && (
                  <span className="text-muted-foreground">· {shipment.shipper_company}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-foreground">{shipment.shipper_phone}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Card */}
        {driver && (
          <Card className="mt-4 border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading">Assigned Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{driver.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {driver.truck_type} · {driver.truck_registration || "N/A"} · ★ {driver.rating || "N/A"}
                  </p>
                </div>
                <a href={`tel:${driver.phone}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        {(shipment.picked_up_at || shipment.delivered_at) && (
          <Card className="mt-4 border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{format(new Date(shipment.created_at), "MMM d, yyyy h:mm a")}</span>
              </div>
              {shipment.picked_up_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Picked Up</span>
                  <span className="text-foreground">{format(new Date(shipment.picked_up_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
              {shipment.delivered_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivered</span>
                  <span className="text-foreground">{format(new Date(shipment.delivered_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Review Section */}
        <ReviewSection
          shipmentId={shipment.id}
          isDelivered={isDelivered}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
};

export default ShipmentDetails;
