import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Truck, ArrowLeft, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

type Mode = "login" | "signup" | "forgot";
type Role = "shipper" | "driver";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<Role>("shipper");
  const [phone, setPhone] = useState("");
  const [truckType, setTruckType] = useState("Medium Truck");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
    }
    setGoogleLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    // Check role to redirect
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    setLoading(false);
    const isDriver = roles?.some((r) => r.role === "driver");
    navigate(isDriver ? "/driver-dashboard" : "/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, company_name: companyName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      // Insert role
      await supabase.from("user_roles").insert({ user_id: userId, role });

      // If driver, create driver record
      if (role === "driver") {
        await supabase.from("drivers").insert({
          user_id: userId,
          name: displayName,
          phone: phone || "0000000000",
          truck_type: truckType,
          capacity_tons: truckType === "Mini Truck" ? 1 : truckType === "Medium Truck" ? 3 : truckType === "Large Truck" ? 8 : 15,
          current_district: "Colombo",
          is_available: true,
          is_online: true,
        });
      }
    }

    setLoading(false);
    if (data.session) {
      navigate(role === "driver" ? "/driver-dashboard" : "/dashboard");
    } else {
      toast({ title: "Check your email", description: "We sent a verification link to your email." });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent", description: "Check your inbox for a password reset link." });
    }
  };

  const truckTypes = ["Mini Truck", "Medium Truck", "Large Truck", "Semi-Trailer"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Truck className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-heading text-xl font-bold tracking-wide text-foreground">
            CEYLON<span className="text-accent">FREIGHT</span>
          </span>
        </Link>

        <Card className="border-border/50 bg-card p-8">
          <h2 className="font-heading text-2xl font-bold text-center mb-6">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </h2>

          <form onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot} className="space-y-4">
            {mode === "signup" && (
              <>
                {/* Role Picker */}
                <div>
                  <label className="mb-2 block text-xs text-muted-foreground">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("shipper")}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${role === "shipper"
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border"
                        }`}
                    >
                      <Package className="h-6 w-6" />
                      <span className="text-sm font-medium">Shipper</span>
                      <span className="text-[10px]">I need trucks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("driver")}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${role === "driver"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border"
                        }`}
                    >
                      <Truck className="h-6 w-6" />
                      <span className="text-sm font-medium">Driver</span>
                      <span className="text-[10px]">I have a truck</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Display Name</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required />
                </div>

                {role === "shipper" && (
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Company Name</label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
                  </div>
                )}

                {role === "driver" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Phone Number</label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07X XXXX XXX" required />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Truck Type</label>
                      <select
                        value={truckType}
                        onChange={(e) => setTruckType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                      >
                        {truckTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.lk" required />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            )}

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>

            {mode !== "forgot" && (
              <>
                <div className="flex items-center gap-3 my-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {googleLoading ? "Connecting..." : "Continue with Google"}
                </Button>
              </>
            )}
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-primary hover:underline block mx-auto">Forgot password?</button>
                <p>Don't have an account? <button onClick={() => setMode("signup")} className="text-primary hover:underline">Sign up</button></p>
              </>
            )}
            {mode === "signup" && (
              <p>Already have an account? <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign in</button></p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-primary hover:underline flex items-center gap-1 mx-auto">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
