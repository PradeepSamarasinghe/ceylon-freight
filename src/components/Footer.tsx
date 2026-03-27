import { Truck } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 bg-background py-16">
    <div className="container mx-auto px-4">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Truck className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">CEYLON<span className="text-accent">FREIGHT</span></span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Move Sri Lanka. Move Fast.</p>
          <p className="mt-1 text-xs text-muted-foreground">Sri Lanka's first digital freight marketplace.</p>
        </div>

        {/* Company */}
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-foreground">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {["About", "Careers", "Blog", "Privacy Policy"].map(l => (
              <a key={l} href="#" className="transition-colors hover:text-foreground">{l}</a>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-foreground">Products</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {["Driver App", "Shipper App", "Market Rates", "API Access"].map(l => (
              <a key={l} href="#" className="transition-colors hover:text-foreground">{l}</a>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div>
          <h4 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-foreground">Partners</h4>
          <div className="flex flex-wrap gap-2">
            {["Dialog", "Mobitel", "BOC", "Commercial Bank", "Sri Lanka Ports Authority"].map(p => (
              <span key={p} className="rounded-md border border-border/50 bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
        © 2026 CeylonFreight. All rights reserved. Built in Sri Lanka 🇱🇰
      </div>
    </div>
  </footer>
);

export default Footer;
