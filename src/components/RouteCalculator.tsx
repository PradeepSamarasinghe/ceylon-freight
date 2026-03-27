import { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const districts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Trincomalee", "Batticaloa",
  "Ampara", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
  "Badulla", "Moneragala", "Ratnapura", "Kegalle", "Mannar", "Vavuniya", "Kilinochchi"
];

const truckTypes = ["Mini Truck (up to 1T)", "Medium Truck (1-5T)", "Large Truck (5-15T)", "Semi-Trailer (15T+)"];

// Simplified rate lookup: base rate per km by truck type
const ratesPerKm: Record<string, number> = {
  "Mini Truck (up to 1T)": 73,
  "Medium Truck (1-5T)": 122,
  "Large Truck (5-15T)": 190,
  "Semi-Trailer (15T+)": 310,
};

// Simplified distances (Colombo-based, km)
const distancesFromColombo: Record<string, number> = {
  Colombo: 0, Gampaha: 29, Kalutara: 43, Kandy: 116, Matale: 142,
  "Nuwara Eliya": 180, Galle: 119, Matara: 160, Hambantota: 239,
  Jaffna: 396, Trincomalee: 257, Batticaloa: 314, Ampara: 360,
  Kurunegala: 94, Puttalam: 137, Anuradhapura: 205, Polonnaruwa: 227,
  Badulla: 231, Moneragala: 290, Ratnapura: 101, Kegalle: 82,
  Mannar: 316, Vavuniya: 266, Kilinochchi: 356,
};

function estimateDistance(from: string, to: string): number {
  if (from === to) return 10;
  const d1 = distancesFromColombo[from] || 100;
  const d2 = distancesFromColombo[to] || 100;
  return Math.abs(d1 - d2) || Math.round((d1 + d2) / 2);
}

const RouteCalculator = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState(500);
  const [truckType, setTruckType] = useState(truckTypes[1]);
  const [result, setResult] = useState<{ distance: number; low: number; high: number } | null>(null);

  const calculate = () => {
    if (!from || !to) return;
    const distance = estimateDistance(from, to);
    const rate = ratesPerKm[truckType] || 120;
    const base = distance * rate;
    const weightFactor = weight > 2000 ? 1.15 : weight > 1000 ? 1.08 : 1;
    const low = Math.round(base * weightFactor * 0.9);
    const high = Math.round(base * weightFactor * 1.15);
    setResult({ distance, low, high });
  };

  const selectClass = "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <section className="relative bg-surface py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Rate Calculator</p>
          <h2 className="mt-3 font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Get Instant Estimates
          </h2>
        </div>

        <div className="mx-auto max-w-2xl rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
              <select value={from} onChange={e => setFrom(e.target.value)} className={selectClass}>
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
              <select value={to} onChange={e => setTo(e.target.value)} className={selectClass}>
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Cargo Weight: {weight} kg</label>
              <input
                type="range" min={50} max={15000} step={50} value={weight}
                onChange={e => setWeight(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-muted-foreground"><span>50 kg</span><span>15,000 kg</span></div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Truck Type</label>
              <select value={truckType} onChange={e => setTruckType(e.target.value)} className={selectClass}>
                {truckTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <Button onClick={calculate} className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shimmer" size="lg">
            <Calculator className="h-4 w-4" /> Get Instant Estimate
          </Button>

          {result && (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-5 animate-fade-in-up">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{from}</span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <span>{to}</span>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">{result.distance} km</span>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">Estimated Price Range</p>
                <p className="mt-1 font-heading text-3xl font-bold text-foreground">
                  LKR {result.low.toLocaleString()} <span className="text-muted-foreground">—</span> {result.high.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RouteCalculator;
