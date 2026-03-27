import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Package, Truck, Clock, CheckCircle2, AlertCircle, Plus, User, Bell,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  in_transit: "bg-accent/20 text-accent border-accent/30",
  picked_up: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

type Tab = "loads" | "active" | "history";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("loads");
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; time: Date }>>([]);
  const queryClient = useQueryClient();

  // Realtime: listen for changes on user's shipments
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('shipper-shipments')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          if (oldRow.status === 'pending' && newRow.status === 'confirmed') {
            const msg = `🚛 A driver accepted your load ${newRow.pickup_district} → ${newRow.delivery_district}!`;
            toast.success(msg, { duration: 8000 });
            setNotifications((prev) => [
              { id: newRow.id, message: msg, time: new Date() },
              ...prev.slice(0, 19),
            ]);
          }
          queryClient.invalidateQueries({ queryKey: ["my-shipments"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["my-shipments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const shipmentIds = shipments.map((s) => s.id);
      if (shipmentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .in("shipment_id", shipmentIds);
      if (error) throw error;
      return data;
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Check if user has a role assigned
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return data;
    },
  });

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!userRoles || userRoles.length === 0) return <Navigate to="/onboarding" replace />;

  const postedLoads = shipments.filter((s) => ["pending", "confirmed"].includes(s.status));
  const activeShipments = shipments.filter((s) => ["in_transit", "picked_up"].includes(s.status));
  const historyShipments = shipments.filter((s) => ["delivered", "cancelled"].includes(s.status));

  const currentList = tab === "loads" ? postedLoads : tab === "active" ? activeShipments : historyShipments;

  const stats = [
    { label: "Posted Loads", value: postedLoads.length, icon: Package, color: "text-primary" },
    { label: "Active Shipments", value: activeShipments.length, icon: Truck, color: "text-accent" },
    { label: "Completed", value: historyShipments.filter((s) => s.status === "delivered").length, icon: CheckCircle2, color: "text-green-400" },
    { label: "Total Shipments", value: shipments.length, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Welcome, <span className="text-accent">{profile?.display_name || user.email}</span>
            </h1>
            {profile?.company_name && (
              <p className="text-sm text-muted-foreground mt-1">{profile.company_name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <div className="relative">
                <Bell className="h-5 w-5 text-accent" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {notifications.length}
                </span>
              </div>
            )}
            <Link to="/post-load">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Post New Load
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/50 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-secondary/50 p-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border/50">
          {([
            { key: "loads" as Tab, label: "Posted Loads", count: postedLoads.length },
            { key: "active" as Tab, label: "Active Shipments", count: activeShipments.length },
            { key: "history" as Tab, label: "History", count: historyShipments.length },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="ml-2 rounded-full bg-secondary/50 px-2 py-0.5 text-xs">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border/50 bg-card">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {tab === "loads" ? "No pending loads. Post a new load to get started!" :
                 tab === "active" ? "No active shipments right now." :
                 "No shipment history yet."}
              </p>
              {tab === "loads" && (
                <Link to="/post-load">
                  <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                    <Plus className="h-4 w-4" /> Post a Load
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-secondary/30">
                    <TableHead className="font-heading font-semibold">ID</TableHead>
                    <TableHead className="font-heading font-semibold">Route</TableHead>
                    <TableHead className="font-heading font-semibold">Cargo</TableHead>
                    <TableHead className="font-heading font-semibold">Truck</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Weight</TableHead>
                    <TableHead className="font-heading font-semibold">Status</TableHead>
                    <TableHead className="font-heading font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentList.map((s) => (
                    <TableRow key={s.id} className="border-border/30 hover:bg-secondary/20">
                      <TableCell className="font-mono text-xs">{s.id.slice(0, 14)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{s.pickup_district}</span>
                        <span className="mx-1 text-muted-foreground">→</span>
                        <span className="text-sm">{s.delivery_district}</span>
                      </TableCell>
                      <TableCell className="text-sm">{s.cargo_type}</TableCell>
                      <TableCell className="text-sm">{s.truck_type}</TableCell>
                      <TableCell className="text-right text-sm">{Number(s.weight_kg).toLocaleString()} kg</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[s.status] || ""} text-xs`}>
                          {s.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
