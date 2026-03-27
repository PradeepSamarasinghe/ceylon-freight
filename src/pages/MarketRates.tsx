import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Search, TrendingUp, Fuel, MapPin, ArrowRight, Truck, Calculator,
} from "lucide-react";

const SRI_LANKA_DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar",
  "Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla",
  "Monaragala","Ratnapura",
];

const TRUCK_TYPES = ["Mini", "Medium", "Large", "Semi-Trailer"] as const;

const FUEL_PRICE_PER_LITER = 366; // LKR avg diesel
const AVG_KM_PER_LITER: Record<string, number> = {
  Mini: 10,
  Medium: 7,
  Large: 5,
  "Semi-Trailer": 3.5,
};

const MarketRates = () => {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [lookupFrom, setLookupFrom] = useState("");
  const [lookupTo, setLookupTo] = useState("");
  const [fuelDistance, setFuelDistance] = useState([100]);
  const [fuelTruck, setFuelTruck] = useState<string>("Medium");

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["route_rates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("route_rates").select("*");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      const from = r.from_district.toLowerCase();
      const to = r.to_district.toLowerCase();
      const sf = searchFrom.toLowerCase();
      const st = searchTo.toLowerCase();
      return (!sf || from.includes(sf)) && (!st || to.includes(st));
    });
  }, [routes, searchFrom, searchTo]);

  const lookupResult = useMemo(() => {
    if (!lookupFrom || !lookupTo) return null;
    return routes.find(
      (r) => r.from_district === lookupFrom && r.to_district === lookupTo
    ) || null;
  }, [routes, lookupFrom, lookupTo]);

  const fuelCost = useMemo(() => {
    const kmPerL = AVG_KM_PER_LITER[fuelTruck] || 7;
    const liters = fuelDistance[0] / kmPerL;
    return Math.round(liters * FUEL_PRICE_PER_LITER);
  }, [fuelDistance, fuelTruck]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <Badge className="mb-3 bg-accent/20 text-accent border-accent/30">
            <TrendingUp className="mr-1 h-3 w-3" /> Live Pricing
          </Badge>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            Market <span className="text-accent">Rates</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Transparent district-to-district freight pricing across Sri Lanka.
            Updated regularly from real market data.
          </p>
        </div>

        {/* Cards Row */}
        <div className="grid gap-6 lg:grid-cols-3 mb-10">
          {/* District Lookup */}
          <Card className="col-span-1 border-border/50 bg-card p-6 lg:col-span-2">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> District-to-District Lookup
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">From</label>
                <Select value={lookupFrom} onValueChange={setLookupFrom}>
                  <SelectTrigger><SelectValue placeholder="Origin district" /></SelectTrigger>
                  <SelectContent>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="hidden h-5 w-5 text-muted-foreground sm:block" />
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">To</label>
                <Select value={lookupTo} onValueChange={setLookupTo}>
                  <SelectTrigger><SelectValue placeholder="Destination district" /></SelectTrigger>
                  <SelectContent>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lookupResult ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  { label: "Mini", value: lookupResult.rate_mini_lkr },
                  { label: "Medium", value: lookupResult.rate_medium_lkr },
                  { label: "Large", value: lookupResult.rate_large_lkr },
                  { label: "Semi-Trailer", value: lookupResult.rate_semi_lkr },
                ] as const).map((t) => (
                  <div key={t.label} className="rounded-lg border border-border/50 bg-secondary/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{t.label}</p>
                    <p className="font-heading text-xl font-bold text-accent">
                      {t.value.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">LKR</p>
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-4 rounded-lg border border-border/50 bg-secondary/30 p-2 text-center text-sm text-muted-foreground">
                  Distance: <span className="font-semibold text-foreground">{lookupResult.distance_km} km</span>
                </div>
              </div>
            ) : lookupFrom && lookupTo ? (
              <p className="mt-5 text-sm text-muted-foreground text-center">
                No rate found for this route. Try reversing the direction.
              </p>
            ) : null}
          </Card>

          {/* Fuel Calculator */}
          <Card className="border-border/50 bg-card p-6">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Fuel className="h-5 w-5 text-accent" /> Fuel Cost Calculator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Truck Type</label>
                <Select value={fuelTruck} onValueChange={setFuelTruck}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRUCK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Distance: {fuelDistance[0]} km
                </label>
                <Slider
                  value={fuelDistance}
                  onValueChange={setFuelDistance}
                  min={10}
                  max={500}
                  step={5}
                  className="mt-2"
                />
              </div>
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-center">
                <p className="text-xs text-muted-foreground">Estimated Fuel Cost</p>
                <p className="font-heading text-3xl font-bold text-accent">
                  {fuelCost.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">LKR</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Diesel @ Rs.{FUEL_PRICE_PER_LITER}/L · {AVG_KM_PER_LITER[fuelTruck]} km/L
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Rate Matrix Table */}
        <Card className="border-border/50 bg-card p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Full Rate Matrix
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="From district..."
                  value={searchFrom}
                  onChange={(e) => setSearchFrom(e.target.value)}
                  className="pl-8 h-9 bg-secondary/50 border-border/50"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="To district..."
                  value={searchTo}
                  onChange={(e) => setSearchTo(e.target.value)}
                  className="pl-8 h-9 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 bg-secondary/30">
                    <TableHead className="font-heading font-semibold">From</TableHead>
                    <TableHead className="font-heading font-semibold">To</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Dist (km)</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Mini</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Medium</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Large</TableHead>
                    <TableHead className="font-heading font-semibold text-right">Semi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No routes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} className="border-border/30 hover:bg-secondary/20">
                        <TableCell className="font-medium">{r.from_district}</TableCell>
                        <TableCell className="font-medium">{r.to_district}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{r.distance_km}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.rate_mini_lkr.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.rate_medium_lkr.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.rate_large_lkr.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{r.rate_semi_lkr.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground text-center">
            {filtered.length} route{filtered.length !== 1 ? "s" : ""} · Prices in LKR · Updated from market data
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MarketRates;
