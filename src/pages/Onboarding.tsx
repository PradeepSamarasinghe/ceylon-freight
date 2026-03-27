import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

type Role = "shipper" | "driver";

const truckTypes = ["Mini Truck", "Medium Truck", "Large Truck", "Semi-Trailer"];

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role>("shipper");
  const [phone, setPhone] = useState("");
  const [truckType, setTruckType] = useState("Medium Truck");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Insert role
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role });
    if (roleErr) {
      setLoading(false);
      toast({ title: "Error", description: roleErr.message, variant: "destructive" });
      return;
    }

    // If driver, create driver record
    if (role === "driver") {
      const displayName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.email || "Driver";
      const { error: driverErr } = await supabase.from("drivers").insert({
        user_id: user.id,
        name: displayName,
        phone: phone || "0000000000",
        truck_type: truckType,
        capacity_tons: truckType === "Mini Truck" ? 1 : truckType === "Medium Truck" ? 3 : truckType === "Large Truck" ? 8 : 15,
        current_district: "Colombo",
        is_available: true,
        is_online: true,
      });
      if (driverErr) {
        setLoading(false);
        toast({ title: "Error", description: driverErr.message, variant: "destructive" });
        return;
      }
    }

    setLoading(false);
    navigate(role === "driver" ? "/driver-dashboard" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Truck className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-heading text-xl font-bold tracking-wide text-foreground">
            CEYLON<span className="text-accent">FREIGHT</span>
          </span>
        </div>

        <Card className="border-border/50 bg-card p-8">
          <h2 className="font-heading text-2xl font-bold text-center mb-2">Welcome!</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Choose your role to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Picker */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("shipper")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                  role === "shipper"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border"
                }`}
              >
                <Package className="h-6 w-6" />
                <span className="text-sm font-medium">Shipper</span>
                <span className="text-[10px]">I need trucks</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("driver")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                  role === "driver"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border"
                }`}
              >
                <Truck className="h-6 w-6" />
                <span className="text-sm font-medium">Driver</span>
                <span className="text-[10px]">I have a truck</span>
              </button>
            </div>

            {role === "driver" && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Phone Number</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X XXXX XXX" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Truck Type</label>
                  <select
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {truckTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
