import { useEffect, useRef, useState } from "react";
import { Truck, Bell, MapPin } from "lucide-react";

const steps = [
  {
    icon: Truck,
    number: "01",
    title: "Post Your Load",
    description: "Enter pickup, destination, cargo details. Takes 60 seconds.",
    color: "accent",
  },
  {
    icon: Bell,
    number: "02",
    title: "Get Instant Quotes",
    description: "Verified truckers bid on your load. Compare price, rating, ETA.",
    color: "primary",
  },
  {
    icon: MapPin,
    number: "03",
    title: "Track in Real-Time",
    description: "GPS tracking from pickup to delivery. Pay only on delivery.",
    color: "success",
  },
];

const HowItWorks = () => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative bg-surface py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How It Works</p>
          <h2 className="mt-3 font-heading text-4xl font-bold text-foreground sm:text-5xl">
            Three Steps to Ship
          </h2>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`group relative rounded-xl border border-border/50 bg-card p-8 transition-all duration-500 hover:border-primary/40 hover:glow-primary ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  step.color === "accent" ? "bg-accent/15 text-accent" :
                  step.color === "success" ? "bg-success/15 text-success" :
                  "bg-primary/15 text-primary"
                }`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="font-heading text-3xl font-bold text-muted-foreground/30">{step.number}</span>
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              
              {i < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
