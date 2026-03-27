import { Zap, MapPin, CreditCard, ShieldCheck, FileText, TrendingUp } from "lucide-react";

const features = [
  { icon: Zap, title: "Instant Matching", description: "AI matches your cargo to available trucks nearby in seconds." },
  { icon: MapPin, title: "Live GPS Tracking", description: "Real-time location shared with consignee via tracking link." },
  { icon: CreditCard, title: "Secure Payments", description: "Escrow-held funds, released automatically on delivery confirmation." },
  { icon: ShieldCheck, title: "Verified Drivers", description: "NIC + license + vehicle verified for every driver on the platform." },
  { icon: FileText, title: "Digital POD", description: "Photo + e-signature proof of delivery for every shipment." },
  { icon: TrendingUp, title: "Best Market Rates", description: "See real-time freight rates by route across Sri Lanka." },
];

const FeaturesGrid = () => {
  return (
    <section className="relative bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Platform Features</p>
          <h2 className="mt-3 font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Built for Sri Lanka's Roads
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:glow-primary"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-heading text-lg font-bold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
