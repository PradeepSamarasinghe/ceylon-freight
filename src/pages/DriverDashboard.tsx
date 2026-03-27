import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Truck, Package, DollarSign, Star, MapPin, Clock, CheckCircle2,
  AlertCircle, TrendingUp, Eye, Calendar, ArrowUpRight, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  in_transit: "bg-accent/20 text-accent border-accent/30",
  picked_up: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
  matched: "bg-primary/20 text-primary border-primary/30",
};

type Tab = "available" | "bookings" | "earnings";

// Custom tooltip for chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-accent">Rs. {Number(payload[0].value).toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{payload[0].payload.trips} trip{payload[0].payload.trips !== 1 ? "s" : ""}</p>
    </div>
  );
};

const EarningsTab = ({
  driver, bookings, myShipments, completedBookings, activeBookings,
  totalEarnings, pendingEarnings,
}: {
  driver: any; bookings: any[]; myShipments: any[]; completedBookings: any[];
  activeBookings: any[]; totalEarnings: number; pendingEarnings: number;
}) => {
  const grandTotal = totalEarnings + Number(driver.earnings_total_lkr || 0);
  const avgPerTrip = completedBookings.length > 0
    ? Math.round(totalEarnings / completedBookings.length) : 0;

  // Monthly earnings chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthBookings = completedBookings.filter((b) =>
        isWithinInterval(new Date(b.created_at), { start, end })
      );
      months.push({
        month: format(date, "MMM"),
        earnings: monthBookings.reduce((s, b) => s + Number(b.agreed_price_lkr), 0),
        trips: monthBookings.length,
      });
    }
    return months;
  }, [completedBookings]);

  // Trip history with shipment details
  const tripHistory = useMemo(() => {
    return myShipments.map((s) => {
      const booking = bookings.find((b) => b.shipment_id === s.id);
      return { ...s, booking };
    });
  }, [myShipments, bookings]);

  return (
    <div className="p-6 space-y-6">
      {/* Earnings Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-secondary/30 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2.5">
              <Wallet className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="font-heading text-2xl font-bold text-accent">
                Rs. {grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/50 bg-secondary/30 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Payout</p>
              <p className="font-heading text-2xl font-bold text-primary">
                Rs. {pendingEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/50 bg-secondary/30 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed Trips</p>
              <p className="font-heading text-2xl font-bold text-foreground">
                {Number(driver.total_trips) || completedBookings.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/50 bg-secondary/30 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-2.5">
              <TrendingUp className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg per Trip</p>
              <p className="font-heading text-2xl font-bold text-foreground">
                Rs. {avgPerTrip.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly Earnings Chart */}
      <Card className="border-border/50 bg-card p-5">
        <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" /> Monthly Earnings
        </h3>
        {monthlyData.some((m) => m.earnings > 0) ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 25% 20%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(215 16% 47%)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(215 16% 47%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(216 35% 18% / 0.5)" }} />
                <Bar dataKey="earnings" fill="hsl(24 94% 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Complete trips to see your earnings chart
          </div>
        )}
      </Card>

      {/* Trip History */}
      <div>
        <h3 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" /> Trip History
        </h3>
        {tripHistory.length > 0 ? (
          <div className="space-y-2">
            {tripHistory.map((trip) => (
              <Link
                key={trip.id}
                to={`/shipment/${trip.id}`}
                className="block rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-lg bg-secondary/50 p-2 shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {trip.pickup_district} → {trip.delivery_district}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {trip.cargo_type} · {Number(trip.weight_kg).toLocaleString()} kg
                        </span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(trip.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {trip.booking && (
                        <p className="text-sm font-mono font-bold text-accent">
                          Rs. {Number(trip.booking.agreed_price_lkr).toLocaleString()}
                        </p>
                      )}
                      <Badge className={`${statusColors[trip.status] || ""} text-[10px] mt-0.5`}>
                        {trip.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 bg-card">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Truck className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Complete trips to see your history here.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const DriverDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("available");
  const queryClient = useQueryClient();

  // Get driver record
  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ["driver-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Available loads (pending shipments without a driver)
  const { data: availableLoads = [] } = useQuery({
    queryKey: ["available-loads"],
    enabled: !!driver,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("status", "pending")
        .is("driver_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // My bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["driver-bookings", driver?.id],
    enabled: !!driver,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("driver_id", driver!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Shipments assigned to this driver
  const { data: myShipments = [] } = useQuery({
    queryKey: ["driver-shipments", driver?.id],
    enabled: !!driver,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("driver_id", driver!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Accept a load
  const acceptLoad = useMutation({
    mutationFn: async (shipment: any) => {
      // Update shipment
      const { error: sErr } = await supabase
        .from("shipments")
        .update({ driver_id: driver!.id, status: "confirmed" })
        .eq("id", shipment.id);
      if (sErr) throw sErr;

      // Create booking
      const { error: bErr } = await supabase.from("bookings").insert({
        shipment_id: shipment.id,
        driver_id: driver!.id,
        agreed_price_lkr: shipment.offered_price_lkr || shipment.estimated_price_low || 5000,
        status: "confirmed",
        payment_method: shipment.payment_method || "Cash on Delivery",
      });
      if (bErr) throw bErr;
    },
    onSuccess: () => {
      toast.success("Load accepted! Check your bookings.");
      queryClient.invalidateQueries({ queryKey: ["available-loads"] });
      queryClient.invalidateQueries({ queryKey: ["driver-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["driver-shipments"] });
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to accept load");
    },
  });

  // Toggle online
  const toggleOnline = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const { error } = await supabase
        .from("drivers")
        .update({ is_online: isOnline })
        .eq("id", driver!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    },
  });

  if (authLoading || driverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!driver) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">No Driver Profile Found</h1>
          <p className="text-muted-foreground">Please sign up as a driver to access this dashboard.</p>
        </div>
      </div>
    );
  }

  const completedBookings = bookings.filter((b) => b.status === "completed" || b.status === "delivered");
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "in_transit");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + Number(b.agreed_price_lkr), 0);
  const pendingEarnings = activeBookings.reduce((sum, b) => sum + Number(b.agreed_price_lkr), 0);

  const stats = [
    { label: "Available Loads", value: availableLoads.length, icon: Package, color: "text-accent" },
    { label: "Active Bookings", value: activeBookings.length, icon: Truck, color: "text-primary" },
    { label: "Completed Trips", value: Number(driver.total_trips) || completedBookings.length, icon: CheckCircle2, color: "text-green-400" },
    { label: "Total Earnings", value: `Rs. ${(totalEarnings + Number(driver.earnings_total_lkr || 0)).toLocaleString()}`, icon: DollarSign, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">
              Driver <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {driver.name} · {driver.truck_type} · {driver.current_district}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Online</span>
              <Switch
                checked={driver.is_online ?? false}
                onCheckedChange={(checked) => toggleOnline.mutate(checked)}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="font-heading font-bold">{Number(driver.rating)?.toFixed(1) || "4.5"}</span>
            </div>
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
                  <p className="font-heading text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border/50">
          {([
            { key: "available" as Tab, label: "Available Loads", count: availableLoads.length },
            { key: "bookings" as Tab, label: "My Bookings", count: bookings.length },
            { key: "earnings" as Tab, label: "Earnings", count: null },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className="ml-2 rounded-full bg-secondary/50 px-2 py-0.5 text-xs">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="border-border/50 bg-card">
          {tab === "available" && (
            availableLoads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No loads available right now. Check back soon!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-secondary/30">
                      <TableHead className="font-heading font-semibold">Route</TableHead>
                      <TableHead className="font-heading font-semibold">Cargo</TableHead>
                      <TableHead className="font-heading font-semibold">Truck</TableHead>
                      <TableHead className="font-heading font-semibold text-right">Weight</TableHead>
                      <TableHead className="font-heading font-semibold text-right">Price</TableHead>
                      <TableHead className="font-heading font-semibold">Posted</TableHead>
                      <TableHead className="font-heading font-semibold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableLoads.map((s) => (
                      <TableRow key={s.id} className="border-border/30 hover:bg-secondary/20">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="text-sm">{s.pickup_district}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm">{s.delivery_district}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{s.cargo_type}</TableCell>
                        <TableCell className="text-sm">{s.truck_type}</TableCell>
                        <TableCell className="text-right text-sm">{Number(s.weight_kg).toLocaleString()} kg</TableCell>
                        <TableCell className="text-right font-mono text-sm text-accent">
                          {s.offered_price_lkr ? `Rs. ${Number(s.offered_price_lkr).toLocaleString()}` : "Bid"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => acceptLoad.mutate(s)}
                            disabled={acceptLoad.isPending}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Accept
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}

          {tab === "bookings" && (
            bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Truck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No bookings yet. Accept a load to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 bg-secondary/30">
                      <TableHead className="font-heading font-semibold">Shipment</TableHead>
                      <TableHead className="font-heading font-semibold">Status</TableHead>
                      <TableHead className="font-heading font-semibold text-right">Price</TableHead>
                      <TableHead className="font-heading font-semibold">Payment</TableHead>
                      <TableHead className="font-heading font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id} className="border-border/30 hover:bg-secondary/20">
                        <TableCell className="font-mono text-xs">{b.shipment_id.slice(0, 14)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[b.status] || ""} text-xs`}>
                            {b.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-accent">
                          Rs. {Number(b.agreed_price_lkr).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.payment_method || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(b.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}

          {tab === "earnings" && (
            <EarningsTab
              driver={driver}
              bookings={bookings}
              myShipments={myShipments}
              completedBookings={completedBookings}
              activeBookings={activeBookings}
              totalEarnings={totalEarnings}
              pendingEarnings={pendingEarnings}
            />
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DriverDashboard;
