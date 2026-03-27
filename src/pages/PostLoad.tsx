import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Truck, Package, MapPin, Settings, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const districts = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Trincomalee", "Batticaloa",
  "Ampara", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
  "Badulla", "Moneragala", "Ratnapura", "Kegalle", "Mannar", "Vavuniya", "Kilinochchi"
];

const loadTypes = [
  { id: "FTL", label: "Full Truck Load", icon: "🚛" },
  { id: "LTL", label: "Less Than Truckload", icon: "📦" },
  { id: "Refrigerated", label: "Refrigerated", icon: "❄️" },
  { id: "Heavy Equipment", label: "Heavy Equipment", icon: "⚙️" },
  { id: "Hazardous", label: "Hazardous", icon: "⚠️" },
  { id: "Oversized", label: "Oversized", icon: "📐" },
];

const truckTypes = [
  { id: "Mini Truck", label: "Mini Truck", desc: "Up to 1T", icon: "🚐" },
  { id: "Medium Truck", label: "Medium Truck", desc: "1-5T", icon: "🚚" },
  { id: "Large Truck", label: "Large Truck", desc: "5-15T", icon: "🚛" },
  { id: "Semi-Trailer", label: "Semi-Trailer", desc: "15T+", icon: "🚜" },
  { id: "Flatbed", label: "Flatbed", desc: "Open cargo", icon: "🛻" },
  { id: "Tipper", label: "Tipper", desc: "Bulk cargo", icon: "🏗️" },
  { id: "Tanker", label: "Tanker", desc: "Liquids", icon: "🛢️" },
];

const cargoTypes = [
  "Tea chests", "Apparel/garments", "FMCG goods", "Building materials",
  "Coconut products", "Rice/grain", "Pharmaceuticals", "Electronics",
  "Refrigerated produce", "Export containers", "Furniture",
  "Industrial machinery", "Sand/gravel", "Fuel (tanker)", "Other"
];

const paymentMethods = ["Cash on Delivery", "Bank Transfer", "eZ Cash"];

const stepLabels = ["Shipment", "Route", "Truck", "Review"];
const stepIcons = [Package, MapPin, Truck, Check];

const ratesPerKm: Record<string, number> = {
  "Mini Truck": 73, "Medium Truck": 122, "Large Truck": 190,
  "Semi-Trailer": 310, "Flatbed": 175, "Tipper": 160, "Tanker": 200,
};

const distancesFromColombo: Record<string, number> = {
  Colombo: 0, Gampaha: 29, Kalutara: 43, Kandy: 116, Matale: 142,
  "Nuwara Eliya": 180, Galle: 119, Matara: 160, Hambantota: 239,
  Jaffna: 396, Trincomalee: 257, Batticaloa: 314, Ampara: 360,
  Kurunegala: 94, Puttalam: 137, Anuradhapura: 205, Polonnaruwa: 227,
  Badulla: 231, Moneragala: 290, Ratnapura: 101, Kegalle: 82,
  Mannar: 316, Vavuniya: 266, Kilinochchi: 356,
};

function estimatePrice(from: string, to: string, truckType: string, weight: number) {
  const d1 = distancesFromColombo[from] || 100;
  const d2 = distancesFromColombo[to] || 100;
  const dist = from === to ? 10 : Math.abs(d1 - d2) || Math.round((d1 + d2) / 2);
  const rate = ratesPerKm[truckType] || 120;
  const base = dist * rate;
  const wf = weight > 5000 ? 1.15 : weight > 2000 ? 1.08 : 1;
  return { low: Math.round(base * wf * 0.9), high: Math.round(base * wf * 1.15) };
}

function generateDisplayId() {
  const num = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `CF-2026-${num}`;
}

const inputClass = "w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "mb-1.5 block text-xs font-medium text-muted-foreground";

const PostLoad = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    loadType: "FTL",
    cargoType: "FMCG goods",
    cargoDescription: "",
    weightKg: 1000,
    dimL: "", dimW: "", dimH: "",
    cargoValue: "",
    pickupDistrict: "",
    pickupAddress: "",
    pickupLandmark: "",
    pickupDate: "",
    deliveryDistrict: "",
    deliveryAddress: "",
    deliveryLandmark: "",
    specialInstructions: "",
    truckType: "Medium Truck",
    acRequired: false,
    tailLift: false,
    driverHelper: false,
    maxBudget: "",
    name: "",
    phone: "",
    company: "",
    paymentMethod: "Cash on Delivery",
  });

  const set = (k: string, v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.cargoType && form.weightKg > 0;
    if (step === 1) return form.pickupDistrict && form.deliveryDistrict;
    if (step === 2) return !!form.truckType;
    if (step === 3) return form.name && form.phone;
    return true;
  };

  const est = form.pickupDistrict && form.deliveryDistrict && form.truckType
    ? estimatePrice(form.pickupDistrict, form.deliveryDistrict, form.truckType, form.weightKg)
    : null;

  const handleSubmit = async () => {
    setSubmitting(true);
    const shipmentId = crypto.randomUUID();
    const displayId = generateDisplayId();
    try {
      const { error } = await supabase.from("shipments").insert({
        id: shipmentId,
        shipper_name: form.name,
        shipper_phone: form.phone,
        shipper_company: form.company || null,
        pickup_district: form.pickupDistrict,
        pickup_address: form.pickupAddress || null,
        pickup_landmark: form.pickupLandmark || null,
        delivery_district: form.deliveryDistrict,
        delivery_address: form.deliveryAddress || null,
        delivery_landmark: form.deliveryLandmark || null,
        cargo_type: form.cargoType,
        cargo_description: form.cargoDescription || null,
        weight_kg: form.weightKg,
        dimensions_l: form.dimL ? Number(form.dimL) : null,
        dimensions_w: form.dimW ? Number(form.dimW) : null,
        dimensions_h: form.dimH ? Number(form.dimH) : null,
        cargo_value_lkr: form.cargoValue ? Number(form.cargoValue) : null,
        truck_type: form.truckType,
        load_type: form.loadType,
        ac_required: form.acRequired,
        tail_lift_required: form.tailLift,
        driver_helper: form.driverHelper,
        max_budget_lkr: form.maxBudget ? Number(form.maxBudget) : null,
        offered_price_lkr: est ? Math.round((est.low + est.high) / 2) : null,
        estimated_price_low: est?.low ?? null,
        estimated_price_high: est?.high ?? null,
        pickup_date: form.pickupDate || null,
        special_instructions: form.specialInstructions || null,
        payment_method: form.paymentMethod,
        status: "pending",
        user_id: user?.id || null,
      });
      if (error) throw error;
      setSuccess(displayId);
      toast.success("Load posted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to post load");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16">
          <div className="animate-fade-in-up max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
              <PartyPopper className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-heading text-3xl font-bold text-foreground">Your load is live! 🎉</h2>
            <div className="mx-auto mt-4 inline-block rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 font-heading text-lg font-bold text-primary">
              {success}
            </div>
            <p className="mt-4 text-muted-foreground">Truckers are being notified now...</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/")} variant="outline" className="border-primary/40 text-primary">
                Back to Home
              </Button>
              <Button onClick={() => { setSuccess(null); setStep(0); setForm(f => ({ ...f, cargoDescription: "", pickupAddress: "", deliveryAddress: "", name: "", phone: "" })); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Post Another Load
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pb-16 pt-24">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Post a Load</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fill in your shipment details to get matched with verified truckers.</p>

        {/* Progress */}
        <div className="mt-8 flex items-center gap-1">
          {stepLabels.map((label, i) => {
            const Icon = stepIcons[i];
            const active = i === step;
            const done = i < step;
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${done ? "border-success bg-success/15 text-success" : active ? "border-primary bg-primary/15 text-primary animate-pulse-glow" : "border-border text-muted-foreground"}`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-primary" : done ? "text-success" : "text-muted-foreground"}`}>{label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1">
          {stepLabels.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < step ? "bg-success" : i === step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {/* Form steps */}
        <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <label className={labelClass}>Load Type</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {loadTypes.map(lt => (
                    <button key={lt.id} onClick={() => set("loadType", lt.id)}
                      className={`rounded-lg border p-3 text-left text-sm transition-all ${form.loadType === lt.id ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-muted-foreground hover:border-primary/30"}`}>
                      <span className="text-lg">{lt.icon}</span>
                      <div className="mt-1 font-medium">{lt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Cargo Type</label>
                <select value={form.cargoType} onChange={e => set("cargoType", e.target.value)} className={inputClass}>
                  {cargoTypes.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Cargo Description</label>
                <textarea value={form.cargoDescription} onChange={e => set("cargoDescription", e.target.value)} rows={2} placeholder="Describe your cargo..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Weight: {form.weightKg.toLocaleString()} kg</label>
                <input type="range" min={50} max={20000} step={50} value={form.weightKg} onChange={e => set("weightKg", Number(e.target.value))} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>50 kg</span><span>20,000 kg</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelClass}>Length (cm)</label><input value={form.dimL} onChange={e => set("dimL", e.target.value)} className={inputClass} placeholder="L" /></div>
                <div><label className={labelClass}>Width (cm)</label><input value={form.dimW} onChange={e => set("dimW", e.target.value)} className={inputClass} placeholder="W" /></div>
                <div><label className={labelClass}>Height (cm)</label><input value={form.dimH} onChange={e => set("dimH", e.target.value)} className={inputClass} placeholder="H" /></div>
              </div>
              <div>
                <label className={labelClass}>Cargo Value (LKR) — for insurance</label>
                <input value={form.cargoValue} onChange={e => set("cargoValue", e.target.value)} className={inputClass} placeholder="e.g. 500000" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in-up">
              <h3 className="font-heading text-lg font-bold text-foreground">Pickup</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>District *</label><select value={form.pickupDistrict} onChange={e => set("pickupDistrict", e.target.value)} className={inputClass}><option value="">Select</option>{districts.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className={labelClass}>Address</label><input value={form.pickupAddress} onChange={e => set("pickupAddress", e.target.value)} className={inputClass} placeholder="Street address" /></div>
              </div>
              <div><label className={labelClass}>Landmark</label><input value={form.pickupLandmark} onChange={e => set("pickupLandmark", e.target.value)} className={inputClass} placeholder="Near landmark" /></div>
              <div><label className={labelClass}>Pickup Date & Time</label><input type="datetime-local" value={form.pickupDate} onChange={e => set("pickupDate", e.target.value)} className={inputClass} /></div>

              <div className="mt-4 border-t border-border/50 pt-4">
                <h3 className="font-heading text-lg font-bold text-foreground">Delivery</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>District *</label><select value={form.deliveryDistrict} onChange={e => set("deliveryDistrict", e.target.value)} className={inputClass}><option value="">Select</option>{districts.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label className={labelClass}>Address</label><input value={form.deliveryAddress} onChange={e => set("deliveryAddress", e.target.value)} className={inputClass} placeholder="Street address" /></div>
              </div>
              <div><label className={labelClass}>Landmark</label><input value={form.deliveryLandmark} onChange={e => set("deliveryLandmark", e.target.value)} className={inputClass} placeholder="Near landmark" /></div>
              <div><label className={labelClass}>Special Instructions</label><textarea value={form.specialInstructions} onChange={e => set("specialInstructions", e.target.value)} rows={2} className={inputClass} placeholder="Any special requirements..." /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              <div>
                <label className={labelClass}>Truck Type</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {truckTypes.map(t => (
                    <button key={t.id} onClick={() => set("truckType", t.id)}
                      className={`rounded-lg border p-3 text-left text-sm transition-all ${form.truckType === t.id ? "border-accent bg-accent/10 text-foreground" : "border-border bg-secondary text-muted-foreground hover:border-accent/30"}`}>
                      <span className="text-lg">{t.icon}</span>
                      <div className="mt-1 font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { key: "acRequired", label: "AC Required" },
                  { key: "tailLift", label: "Tail-lift Required" },
                  { key: "driverHelper", label: "Driver Helper Required" },
                ].map(opt => (
                  <label key={opt.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary p-3 transition-colors hover:border-primary/30">
                    <input type="checkbox" checked={form[opt.key as keyof typeof form] as boolean} onChange={e => set(opt.key, e.target.checked)} className="h-4 w-4 accent-primary" />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className={labelClass}>Maximum Budget (LKR) — optional</label>
                <input value={form.maxBudget} onChange={e => set("maxBudget", e.target.value)} className={inputClass} placeholder="e.g. 25000" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in-up">
              <h3 className="font-heading text-lg font-bold text-foreground">Summary</h3>
              <div className="rounded-lg border border-border/50 bg-secondary/50 p-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Load:</span> <span className="text-foreground">{form.loadType}</span></div>
                  <div><span className="text-muted-foreground">Cargo:</span> <span className="text-foreground">{form.cargoType}</span></div>
                  <div><span className="text-muted-foreground">Weight:</span> <span className="text-foreground">{form.weightKg.toLocaleString()} kg</span></div>
                  <div><span className="text-muted-foreground">Truck:</span> <span className="text-foreground">{form.truckType}</span></div>
                  <div><span className="text-muted-foreground">From:</span> <span className="text-foreground">{form.pickupDistrict || "—"}</span></div>
                  <div><span className="text-muted-foreground">To:</span> <span className="text-foreground">{form.deliveryDistrict || "—"}</span></div>
                </div>
                {est && (
                  <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Estimated Price</p>
                    <p className="font-heading text-2xl font-bold text-foreground">LKR {est.low.toLocaleString()} — {est.high.toLocaleString()}</p>
                  </div>
                )}
              </div>

              <h3 className="font-heading text-lg font-bold text-foreground">Contact Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} className={inputClass} placeholder="Your name" /></div>
                <div><label className={labelClass}>Phone *</label><input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputClass} placeholder="07X XXXX XXX" /></div>
              </div>
              <div><label className={labelClass}>Company (optional)</label><input value={form.company} onChange={e => set("company", e.target.value)} className={inputClass} placeholder="Company name" /></div>
              <div>
                <label className={labelClass}>Payment Method</label>
                <div className="flex gap-2">
                  {paymentMethods.map(pm => (
                    <button key={pm} onClick={() => set("paymentMethod", pm)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-all ${form.paymentMethod === pm ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      {pm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button onClick={() => setStep(s => s - 1)} disabled={step === 0} variant="outline" className="border-border text-muted-foreground gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canNext() || submitting} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shimmer">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Load Now 🚀"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostLoad;
