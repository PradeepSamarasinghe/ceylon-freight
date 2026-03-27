import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, MapPin, Banknote, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const Globe3D = lazy(() => import("@/components/Globe3D"));

const stats = [
  { value: 12847, label: "Shipments Delivered", suffix: "" },
  { value: 4291, label: "Verified Drivers", suffix: "" },
  { value: 25, label: "Districts Covered", suffix: "" },
  { value: 2.3, label: "Freight Moved", suffix: "B LKR", decimals: 1 },
];

const trustBadges = [
  { icon: Shield, label: "Bank-Grade Security" },
  { icon: MapPin, label: "Real-Time GPS" },
  { icon: Banknote, label: "Same-Day Payout" },
  { icon: Headphones, label: "24/7 Support" },
];

function useCountUp(target: number, duration = 1500, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(parseFloat((eased * target).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { value, ref };
}

const StatCounter = ({ target, label, suffix, decimals = 0 }: { target: number; label: string; suffix: string; decimals?: number }) => {
  const { value, ref } = useCountUp(target, 1500, decimals);
  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        {decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()}{suffix && <span className="text-accent">{suffix}</span>}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
};

const HeroGlobe = () => (
  <div className="relative flex items-center justify-center">
    <div className="animate-float relative h-64 w-64 sm:h-80 sm:w-80 lg:h-[420px] lg:w-[420px]">
      {/* Globe */}
      <div className="absolute inset-0 rounded-full border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 animate-pulse-glow" />
      <div className="absolute inset-4 rounded-full border border-primary/10 bg-gradient-to-br from-background to-surface" />
      {/* Grid lines */}
      <div className="absolute inset-8 rounded-full border border-dashed border-primary/15" />
      <div className="absolute inset-16 rounded-full border border-dashed border-primary/10" />
      {/* Sri Lanka highlight */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="h-12 w-6 rounded-full bg-primary/40 blur-md" />
          <div className="absolute inset-0 h-12 w-6 rounded-full bg-primary/60" />
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-accent shadow-lg shadow-accent/50" />
        </div>
      </div>
      {/* Route arcs */}
      {[45, 90, 135, 200, 250, 310].map((deg, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2"
          style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
        >
          <div className="absolute left-1/2 top-0 h-1 w-1 rounded-full bg-accent shadow-lg shadow-accent/50"
            style={{ animation: `orbit-dot 3s linear ${i * 0.5}s infinite` }}
          />
        </div>
      ))}
      {/* City nodes */}
      {[
        { top: '35%', left: '42%' },
        { top: '25%', left: '55%' },
        { top: '60%', left: '38%' },
        { top: '75%', left: '45%' },
        { top: '15%', left: '48%' },
      ].map((pos, i) => (
        <div key={i} className="absolute h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50" style={pos} />
      ))}
      {/* Stars */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-foreground/20"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
    <style>{`
      @keyframes orbit-dot {
        0% { transform: translateX(0) translateY(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateX(60px) translateY(-20px); opacity: 0; }
      }
    `}</style>
  </div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero pt-16">
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(hsl(199 89% 48% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(199 89% 48% / 0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />

      <div className="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center gap-12 px-4 py-12 lg:flex-row lg:gap-8 lg:py-0">
        {/* Left */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Sri Lanka's #1 Digital Freight Platform
          </div>

          <h1 className="font-heading text-5xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-8xl opacity-0 animate-fade-in-up">
            MOVE SRI LANKA.
            <br />
            <span className="text-gradient-accent">MOVE FAST.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg opacity-0 animate-fade-in-up animate-delay-200">
            Sri Lanka's first digital freight marketplace. Connect shippers with 50,000+ verified truck owners instantly.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 opacity-0 animate-fade-in-up animate-delay-300">
            <Link to="/post-load">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shimmer gap-2 text-base font-semibold px-6">
                Post a Load <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 gap-2 text-base font-semibold px-6">
              Find Trucks Now
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid w-full max-w-lg grid-cols-2 gap-6 sm:grid-cols-4 opacity-0 animate-fade-in-up animate-delay-400">
            {stats.map((s) => (
              <StatCounter key={s.label} target={s.value} label={s.label} suffix={s.suffix} decimals={s.decimals || 0} />
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start opacity-0 animate-fade-in-up animate-delay-500">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
                <b.icon className="h-3.5 w-3.5 text-primary" />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — 3D Globe */}
        <div className="flex flex-1 items-center justify-center opacity-0 animate-fade-in-up animate-delay-300">
          <Suspense fallback={<HeroGlobe />}>
            <Globe3D />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
