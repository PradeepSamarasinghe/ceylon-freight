import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Star, MapPin, Truck, Filter, X, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const districts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Trincomalee", "Batticaloa",
  "Ampara", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
  "Badulla", "Moneragala", "Ratnapura", "Kegalle", "Mannar", "Vavuniya", "Kilinochchi"
];

const truckTypeOptions = ["Mini Truck", "Medium Truck", "Large Truck", "Semi-Trailer", "Flatbed", "Tipper", "Tanker"];

const specialtyTags: Record<string, string[]> = {
  "Tanker": ["Fuel Runs", "Liquid Cargo"],
  "Semi-Trailer": ["Long Haul", "Port Runs", "Export Containers"],
  "Large Truck": ["Long Haul", "Heavy Cargo"],
  "Medium Truck": ["City Runs", "FMCG"],
  "Mini Truck": ["Last Mile", "Fragile Cargo"],
  "Flatbed": ["Construction", "Oversized"],
  "Tipper": ["Sand/Gravel", "Bulk"],
};

const rateRanges: Record<string, string> = {
  "Mini Truck": "LKR 65–85/km",
  "Medium Truck": "LKR 100–135/km",
  "Large Truck": "LKR 170–210/km",
  "Semi-Trailer": "LKR 280–340/km",
  "Flatbed": "LKR 155–195/km",
  "Tipper": "LKR 140–180/km",
  "Tanker": "LKR 180–220/km",
};

const distancesFromColombo: Record<string, number> = {
  Colombo: 0, Gampaha: 29, Kalutara: 43, Kandy: 116, Matale: 142,
  "Nuwara Eliya": 180, Galle: 119, Matara: 160, Hambantota: 239,
  Jaffna: 396, Trincomalee: 257, Batticaloa: 314, Ampara: 360,
  Kurunegala: 94, Puttalam: 137, Anuradhapura: 205, Polonnaruwa: 227,
  Badulla: 231, Moneragala: 290, Ratnapura: 101, Kegalle: 82,
  Mannar: 316, Vavuniya: 266, Kilinochchi: 356,
};

function estimateDistance(from: string, to: string) {
  if (from === to) return 10;
  const d1 = distancesFromColombo[from] || 100;
  const d2 = distancesFromColombo[to] || 100;
  return Math.abs(d1 - d2) || Math.round((d1 + d2) / 2);
}

const ratesPerKm: Record<string, number> = {
  "Mini Truck": 73, "Medium Truck": 122, "Large Truck": 190,
  "Semi-Trailer": 310, "Flatbed": 175, "Tipper": 160, "Tanker": 200,
};

type Driver = {
  id: string; name: string; phone: string; truck_type: string;
  truck_registration: string | null; capacity_tons: number;
  current_district: string | null; rating: number | null;
  total_trips: number | null; is_verified: boolean | null;
  is_available: boolean | null; is_online: boolean | null;
};

const inputClass = "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

const QuotePanel = ({ driver, onClose }: { driver: Driver; onClose: () => void }) => {
  const { user } = useAuth();
  const [from, setFrom] = useState(driver.current_district || "");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState(1000);
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ base: number; fuel: number; toll: number; service: number; total: number } | null>(null);
  const [booking, setBooking] = useState(false);

  const calculate = () => {
    if (!from || !to) return;
    const dist = estimateDistance(from, to);
    const rate = ratesPerKm[driver.truck_type] || 120;
    const wf = weight > 5000 ? 1.12 : 1;
    const base = Math.round(dist * rate * wf);
    const fuel = Math.round(base * 0.15);
    const toll = Math.round(dist * 3.5);
    const service = Math.round(base * 0.05);
    setResult({ base, fuel, toll, service, total: base + fuel + toll + service });
  };

  const book = async () => {
    if (!result) return;
    setBooking(true);
    try {
      const shipId = `CF-2026-${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}`;
      await supabase.from("shipments").insert({
        id: shipId, shipper_name: "Guest", shipper_phone: "0770000000",
        pickup_district: from, delivery_district: to,
        cargo_type: "General", weight_kg: weight, truck_type: driver.truck_type,
        load_type: "FTL", offered_price_lkr: result.total, status: "matched",
        driver_id: driver.id, pickup_date: date || null,
        user_id: user?.id || null,
      });
      await supabase.from("bookings").insert({
        shipment_id: shipId, driver_id: driver.id,
        agreed_price_lkr: result.total, status: "confirmed",
        payment_method: "Cash on Delivery",
      });
      toast.success(`Truck booked! Shipment ${shipId}`);
      onClose();
    } catch {
      toast.error("Failed to book truck");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-md animate-fade-in-up overflow-y-auto border-l border-border bg-card p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-bold text-foreground">Get Quote</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Quote from <span className="text-primary">{driver.name}</span> — {driver.truck_type}</p>

        <div className="mt-6 space-y-4">
          <div><label className={labelClass}>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className={inputClass}>
              <option value="">Select</option>{districts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>To</label>
            <select value={to} onChange={e => setTo(e.target.value)} className={inputClass}>
              <option value="">Select</option>{districts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Cargo Weight: {weight.toLocaleString()} kg</label>
            <input type="range" min={50} max={15000} step={50} value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full accent-accent" />
          </div>
          <div><label className={labelClass}>Preferred Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <Button onClick={calculate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Calculate Price</Button>

          {result && (
            <div className="animate-fade-in-up rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Base rate</span><span className="text-foreground">LKR {result.base.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Fuel surcharge</span><span className="text-foreground">LKR {result.fuel.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Toll charges</span><span className="text-foreground">LKR {result.toll.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-muted-foreground"><span>Service fee</span><span className="text-foreground">LKR {result.service.toLocaleString()}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-heading text-lg font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-accent">LKR {result.total.toLocaleString()}</span>
              </div>
              <Button onClick={book} disabled={booking} className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90 shimmer">
                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book This Truck"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DriverCard = ({ driver, onQuote }: { driver: Driver; onQuote: () => void }) => {
  const initials = driver.name.split(" ").map(n => n[0]).join("");
  const tags = specialtyTags[driver.truck_type] || [];
  const regBlurred = driver.truck_registration ? driver.truck_registration.slice(0, 3) + "•••••" : "—";

  return (
    <div className="group rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-primary/40 hover:glow-primary">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-lg font-bold text-primary">
          {initials}
          {driver.is_online && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-success animate-pulse" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-base font-bold text-foreground">{driver.name}</h3>
            {driver.is_verified && (
              <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">VERIFIED ✓</span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{driver.truck_type} · {driver.capacity_tons}T</span>
            {driver.current_district && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />Near {driver.current_district}
                {driver.is_available && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-success" />}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-accent">
              <Star className="h-3 w-3 fill-accent" />{driver.rating?.toFixed(1)}
              <span className="text-muted-foreground">({driver.total_trips} trips)</span>
            </span>
            <span className="text-primary font-medium">{rateRanges[driver.truck_type] || "—"}</span>
          </div>

          <div className="mt-1 text-[10px] text-muted-foreground">Reg: {regBlurred}</div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map(t => (
                <span key={t} className="rounded-md border border-border/50 bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={onQuote} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-8">
              Get Quote
            </Button>
            <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:text-foreground text-xs h-8">
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

type SortKey = "price" | "rating" | "trips" | "availability";

const FindTrucks = () => {
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(1);
  const [district, setDistrict] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [quoteDriver, setQuoteDriver] = useState<Driver | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("*");
      if (error) throw error;
      return data as Driver[];
    },
  });

  const toggleType = (t: string) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const filtered = useMemo(() => {
    let list = [...drivers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.current_district?.toLowerCase().includes(q) || d.truck_type.toLowerCase().includes(q));
    }
    if (availableOnly) list = list.filter(d => d.is_available);
    if (selectedTypes.length) list = list.filter(d => selectedTypes.includes(d.truck_type));
    if (minRating > 1) list = list.filter(d => (d.rating || 0) >= minRating);
    if (district) list = list.filter(d => d.current_district === district);
    if (verifiedOnly) list = list.filter(d => d.is_verified);

    list.sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "trips") return (b.total_trips || 0) - (a.total_trips || 0);
      if (sortBy === "availability") return (a.is_available ? 0 : 1) - (b.is_available ? 0 : 1);
      return 0;
    });
    return list;
  }, [drivers, search, availableOnly, selectedTypes, minRating, district, verifiedOnly, sortBy]);

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Route or driver name..." className={`${inputClass} pl-9`} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary p-3 transition-colors hover:border-success/30">
        <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="h-4 w-4 accent-success" />
        <span className="text-sm text-foreground">Available Now</span>
        <span className="ml-auto h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
      </label>

      <div>
        <label className={labelClass}>Truck Type</label>
        <div className="flex flex-wrap gap-1.5">
          {truckTypeOptions.map(t => (
            <button key={t} onClick={() => toggleType(t)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-all ${selectedTypes.includes(t) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Min Rating: {minRating} ⭐</label>
        <input type="range" min={1} max={5} step={0.5} value={minRating} onChange={e => setMinRating(Number(e.target.value))} className="w-full accent-accent" />
      </div>

      <div>
        <label className={labelClass}>District</label>
        <select value={district} onChange={e => setDistrict(e.target.value)} className={inputClass}>
          <option value="">All districts</option>
          {districts.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary p-3 transition-colors hover:border-primary/30">
        <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
        <span className="text-sm text-foreground">Verified Only</span>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pb-16 pt-24">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Find Trucks</h1>
            <p className="mt-1 text-sm text-muted-foreground">{filtered.length} trucks available across Sri Lanka</p>
          </div>
          <Button variant="outline" className="border-border text-muted-foreground lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>

        <div className="mt-8 flex gap-8">
          {/* Filters — desktop */}
          <aside className="hidden w-[280px] shrink-0 lg:block">
            <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-5">
              <h3 className="mb-4 font-heading text-sm font-bold uppercase tracking-wider text-foreground">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setShowFilters(false)}>
              <div className="h-full w-[300px] overflow-y-auto border-r border-border bg-card p-5" onClick={e => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-foreground">Filters</h3>
                  <button onClick={() => setShowFilters(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
                </div>
                <FilterPanel />
              </div>
              <div className="flex-1 bg-background/60 backdrop-blur-sm" />
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {/* Sort */}
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Sort by:</span>
              {([["rating", "Rating"], ["trips", "Trips"], ["availability", "Availability"]] as [SortKey, string][]).map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)}
                  className={`rounded-md border px-2.5 py-1 transition-all ${sortBy === k ? "border-primary bg-primary/15 text-primary" : "border-border hover:border-primary/30"}`}>
                  {l}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No trucks match your filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(d => (
                  <DriverCard key={d.id} driver={d} onQuote={() => setQuoteDriver(d)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {quoteDriver && <QuotePanel driver={quoteDriver} onClose={() => setQuoteDriver(null)} />}
    </div>
  );
};

export default FindTrucks;
