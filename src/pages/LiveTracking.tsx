import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, Truck, Clock, Phone, Navigation, Package,
  ArrowRight, ChevronRight, Radio, Shield, Star, X
} from "lucide-react";

// Sri Lankan route waypoints (lat/lng paths)
const ROUTES = [
  {
    id: "SHP-2026-0301",
    shipperName: "Dilshan Perera",
    shipperPhone: "+94 77 234 5678",
    cargo: "Electronics – 2,400 kg",
    truckType: "Medium Lorry",
    driverName: "Kasun Jayawardena",
    driverPhone: "+94 76 111 2233",
    driverRating: 4.8,
    from: "Colombo",
    to: "Kandy",
    status: "in_transit" as const,
    progress: 62,
    eta: "1h 24m",
    distanceKm: 116,
    price: 18500,
    waypoints: [
      [6.9271, 79.8612], [6.9400, 79.9200], [6.9700, 80.0100],
      [7.0200, 80.1000], [7.0800, 80.2200], [7.1500, 80.3000],
      [7.2200, 80.3800], [7.2906, 80.6337],
    ],
  },
  {
    id: "SHP-2026-0298",
    shipperName: "Amali Fernando",
    shipperPhone: "+94 71 876 5432",
    cargo: "Garments – 1,800 kg",
    truckType: "Large Lorry",
    driverName: "Ruwan Wijesinghe",
    driverPhone: "+94 77 444 5566",
    driverRating: 4.6,
    from: "Galle",
    to: "Colombo",
    status: "in_transit" as const,
    progress: 78,
    eta: "32m",
    distanceKm: 126,
    price: 22000,
    waypoints: [
      [6.0535, 80.2210], [6.1200, 80.1800], [6.2100, 80.1400],
      [6.3500, 80.0800], [6.5000, 80.0200], [6.6500, 79.9500],
      [6.8000, 79.9000], [6.9271, 79.8612],
    ],
  },
  {
    id: "SHP-2026-0295",
    shipperName: "Nimal Silva",
    shipperPhone: "+94 70 555 6677",
    cargo: "Tea Crates – 3,200 kg",
    truckType: "Semi-Trailer",
    driverName: "Pradeep Kumara",
    driverPhone: "+94 76 888 9900",
    driverRating: 4.9,
    from: "Nuwara Eliya",
    to: "Hambantota",
    status: "in_transit" as const,
    progress: 35,
    eta: "3h 10m",
    distanceKm: 198,
    price: 42000,
    waypoints: [
      [6.9497, 80.7891], [6.8800, 80.7500], [6.7800, 80.6800],
      [6.6500, 80.6000], [6.5200, 80.5500], [6.3800, 80.5800],
      [6.2500, 80.6200], [6.1241, 81.1185],
    ],
  },
  {
    id: "SHP-2026-0290",
    shipperName: "Chaminda Rajapakse",
    shipperPhone: "+94 72 333 4455",
    cargo: "Spices – 900 kg",
    truckType: "Mini Lorry",
    driverName: "Sampath De Silva",
    driverPhone: "+94 71 222 3344",
    driverRating: 4.7,
    from: "Matara",
    to: "Kurunegala",
    status: "picked_up" as const,
    progress: 12,
    eta: "4h 45m",
    distanceKm: 245,
    price: 35000,
    waypoints: [
      [5.9549, 80.5550], [6.0500, 80.4000], [6.2000, 80.2500],
      [6.4000, 80.1000], [6.6000, 79.9500], [6.8000, 79.9000],
      [7.1000, 80.0500], [7.4863, 80.3623],
    ],
  },
  {
    id: "SHP-2026-0288",
    shipperName: "Lakshmi Wickramasinghe",
    shipperPhone: "+94 75 999 0011",
    cargo: "Machinery Parts – 4,100 kg",
    truckType: "Large Lorry",
    driverName: "Ajith Bandara",
    driverPhone: "+94 77 666 7788",
    driverRating: 4.5,
    from: "Jaffna",
    to: "Colombo",
    status: "in_transit" as const,
    progress: 51,
    eta: "3h 55m",
    distanceKm: 398,
    price: 65000,
    waypoints: [
      [9.6615, 80.0255], [9.3000, 80.0500], [8.7500, 80.1000],
      [8.3000, 80.2000], [7.8000, 80.1500], [7.4000, 80.0000],
      [7.0000, 79.9500], [6.9271, 79.8612],
    ],
  },
];

const statusColors: Record<string, string> = {
  in_transit: "bg-primary/20 text-primary border-primary/30",
  picked_up: "bg-accent/20 text-accent border-accent/30",
  delivered: "bg-success/20 text-success border-success/30",
};

const statusLabels: Record<string, string> = {
  in_transit: "In Transit",
  picked_up: "Picked Up",
  delivered: "Delivered",
};

function lerp(a: number[], b: number[], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function getPositionOnRoute(waypoints: number[][], progress: number) {
  const p = Math.min(Math.max(progress / 100, 0), 1);
  const totalSegments = waypoints.length - 1;
  const segFloat = p * totalSegments;
  const segIndex = Math.min(Math.floor(segFloat), totalSegments - 1);
  const segT = segFloat - segIndex;
  return lerp(waypoints[segIndex], waypoints[segIndex + 1], segT);
}

const LiveTracking = () => {
  const [selectedId, setSelectedId] = useState<string | null>(ROUTES[0].id);
  const [animProgress, setAnimProgress] = useState<Record<string, number>>({});

  // Initialize progress from route data
  useEffect(() => {
    const init: Record<string, number> = {};
    ROUTES.forEach((r) => (init[r.id] = r.progress));
    setAnimProgress(init);
  }, []);

  // Animate progress ticking up
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimProgress((prev) => {
        const next = { ...prev };
        ROUTES.forEach((r) => {
          if (r.status === "in_transit" || r.status === "picked_up") {
            const current = next[r.id] ?? r.progress;
            if (current < 98) next[r.id] = current + 0.15;
          }
        });
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const selected = ROUTES.find((r) => r.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
          {/* Sidebar — shipment list */}
          <div className="w-full lg:w-[380px] border-r border-border/50 overflow-y-auto bg-surface">
            <div className="p-4 border-b border-border/50">
              <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary animate-pulse" />
                Live Tracking
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {ROUTES.length} active shipments
              </p>
            </div>
            <div className="flex flex-col">
              {ROUTES.map((route) => {
                const prog = animProgress[route.id] ?? route.progress;
                const pos = getPositionOnRoute(route.waypoints, prog);
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedId(route.id)}
                    className={`w-full text-left p-4 border-b border-border/30 transition-colors hover:bg-secondary/50 ${
                      selectedId === route.id ? "bg-secondary/70 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading text-sm font-semibold text-foreground">{route.id}</span>
                      <Badge variant="outline" className={`text-xs ${statusColors[route.status]}`}>
                        {statusLabels[route.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{route.from}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{route.to}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        <span>{route.truckType}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>ETA {route.eta}</span>
                      </div>
                    </div>
                    <Progress value={prog} className="mt-2 h-1.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main area — map visualization + detail */}
          <div className="flex-1 relative overflow-hidden">
            {/* SVG Map of Sri Lanka */}
            <SriLankaMap routes={ROUTES} animProgress={animProgress} selectedId={selectedId} />

            {/* Detail panel overlay */}
            {selected && (
              <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto animate-slide-in-right">
                <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-heading text-lg">{selected.id}</CardTitle>
                      <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Badge variant="outline" className={`w-fit text-xs ${statusColors[selected.status]}`}>
                      {statusLabels[selected.status]}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Route */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <div className="w-0.5 h-8 bg-border" />
                          <div className="h-3 w-3 rounded-full bg-accent" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Pickup</p>
                            <p className="text-sm font-medium text-foreground">{selected.from}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Delivery</p>
                            <p className="text-sm font-medium text-foreground">{selected.to}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Progress</span>
                        <span>{Math.round(animProgress[selected.id] ?? selected.progress)}%</span>
                      </div>
                      <Progress value={animProgress[selected.id] ?? selected.progress} className="h-2" />
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-muted-foreground">{selected.distanceKm} km total</span>
                        <span className="text-primary font-medium">ETA {selected.eta}</span>
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Cargo */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> Cargo</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{selected.cargo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Truck</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{selected.truckType}</p>
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Driver */}
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground font-medium">DRIVER</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          <span className="text-xs font-medium text-foreground">{selected.driverRating}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{selected.driverName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Phone className="h-3 w-3" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Navigation className="h-3 w-3" />
                          Navigate
                        </Button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 p-3">
                      <span className="text-sm text-muted-foreground">Agreed Price</span>
                      <span className="font-heading text-lg font-bold text-primary">
                        LKR {selected.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Shipper */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-medium text-foreground">Shipper:</span> {selected.shipperName}</p>
                      <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selected.shipperPhone}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Minimal SVG map of Sri Lanka with animated truck dots
function SriLankaMap({
  routes,
  animProgress,
  selectedId,
}: {
  routes: typeof ROUTES;
  animProgress: Record<string, number>;
  selectedId: string | null;
}) {
  // Sri Lanka bounding box approx: lat 5.9 - 9.85, lng 79.5 - 81.9
  const mapProject = useCallback((lat: number, lng: number) => {
    const x = ((lng - 79.4) / (81.95 - 79.4)) * 100;
    const y = ((9.9 - lat) / (9.9 - 5.85)) * 100;
    return [x, y];
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-hero relative">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[500px] max-h-[90%]" preserveAspectRatio="xMidYMid meet">
        {/* Sri Lanka outline (simplified) */}
        <path
          d="M45,5 Q42,8 38,15 Q35,22 33,30 Q30,38 28,45 Q25,52 23,58 Q22,62 24,68 Q26,72 30,78 Q34,82 38,86 Q42,90 47,93 Q50,95 54,93 Q58,90 61,85 Q64,80 65,74 Q66,68 66,62 Q65,56 64,50 Q63,44 61,38 Q59,32 57,26 Q55,20 52,14 Q50,10 48,7 Z"
          fill="hsl(var(--secondary))"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          opacity="0.6"
        />

        {/* Route lines */}
        {routes.map((route) => {
          const points = route.waypoints.map(([lat, lng]) => mapProject(lat, lng));
          const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
          const isSelected = route.id === selectedId;
          return (
            <g key={route.id}>
              <path
                d={pathD}
                fill="none"
                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                strokeWidth={isSelected ? "1.2" : "0.6"}
                strokeDasharray={isSelected ? "none" : "3,2"}
                opacity={isSelected ? 1 : 0.5}
              />
              {/* Animated truck dot */}
              {(() => {
                const prog = animProgress[route.id] ?? route.progress;
                const pos = getPositionOnRoute(route.waypoints, prog);
                const [cx, cy] = mapProject(pos[0], pos[1]);
                return (
                  <g>
                    {isSelected && (
                      <circle cx={cx} cy={cy} r="4" fill="hsl(var(--primary))" opacity="0.2">
                        <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? "2.5" : "1.8"}
                      fill={isSelected ? "hsl(var(--accent))" : "hsl(var(--primary))"}
                      stroke="hsl(var(--background))"
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })()}
              {/* Origin & destination markers */}
              {(() => {
                const [ox, oy] = mapProject(route.waypoints[0][0], route.waypoints[0][1]);
                const last = route.waypoints[route.waypoints.length - 1];
                const [dx, dy] = mapProject(last[0], last[1]);
                return (
                  <>
                    <circle cx={ox} cy={oy} r="1.5" fill="hsl(var(--primary))" opacity={isSelected ? 1 : 0.4} />
                    <circle cx={dx} cy={dy} r="1.5" fill="hsl(var(--accent))" opacity={isSelected ? 1 : 0.4} />
                  </>
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Origin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> Destination
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="h-3 w-3 text-primary" /> Live
        </span>
      </div>
    </div>
  );
}

export default LiveTracking;
