import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Truck, LogOut, Settings } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Find Trucks", href: "/find-trucks" },
  { label: "Post Load", href: "/post-load" },
  { label: "Track", href: "/tracking" },
  { label: "Market Rates", href: "/market-rates" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dashPath, setDashPath] = useState("/dashboard");
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    // Fetch role + profile in parallel
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      if (data?.some((r) => r.role === "driver")) setDashPath("/driver-dashboard");
      else setDashPath("/dashboard");
    });
    supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single().then(({ data }) => {
      setProfile(data);
    });
  }, [user]);

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : null;
  const initials = (profile?.display_name || user?.email || "U").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Truck className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-heading text-xl font-bold tracking-wide text-foreground">
            CEYLON<span className="text-accent">FREIGHT</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="relative px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to={dashPath} className="flex items-center gap-2">
                <Avatar className="h-7 w-7 border border-border/50">
                  <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback className="bg-secondary text-foreground text-[10px] font-heading">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 px-1">
                  Dashboard
                </Button>
              </Link>
              <NotificationBell />
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                  <Settings className="h-4 w-4" /> Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground gap-1.5">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 shimmer">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to={dashPath} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2">
                    <Avatar className="h-7 w-7 border border-border/50">
                      <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                      <AvatarFallback className="bg-secondary text-foreground text-[10px] font-heading">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
                  </Link>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <NotificationBell />
                    <span className="text-sm text-muted-foreground">Notifications</span>
                  </div>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground gap-1.5">
                      <Settings className="h-4 w-4" /> Profile
                    </Button>
                  </Link>
                  <Button onClick={handleSignOut} variant="ghost" className="justify-start text-muted-foreground gap-1.5">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground">Sign In</Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
