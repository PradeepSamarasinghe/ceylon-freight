import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Building2, Save, Loader2, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  company_name: z.string().trim().max(100).optional().or(z.literal("")),
});

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ProfileSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setCompanyName(profile.company_name || "");
    }
  }, [profile]);

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 2MB");
      return;
    }

    setAvatarUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    // Upload file (upsert to replace existing)
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }

    // Update profile with avatar path
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: filePath })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Failed to save avatar");
    } else {
      toast.success("Avatar updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
    setAvatarUploading(false);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAvatar = useMutation({
    mutationFn: async () => {
      if (!profile?.avatar_url || !user) return;
      await supabase.storage.from("avatars").remove([profile.avatar_url]);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avatar removed");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to remove avatar"),
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.parse({
        display_name: displayName,
        phone,
        company_name: companyName,
      });
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: parsed.display_name,
          phone: parsed.phone || null,
          company_name: parsed.company_name || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setErrors({});
    },
    onError: (e: any) => {
      if (e instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(e.message || "Failed to update profile");
      }
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    updateProfile.mutate();
  };

  const avatarUrl = getAvatarUrl(profile?.avatar_url ?? null);
  const initials = (profile?.display_name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <h1 className="font-heading text-3xl font-bold mb-2">
          Profile <span className="text-accent">Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Manage your personal information
        </p>

        <Card className="border-border/50 bg-card p-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-border/50">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-secondary text-foreground text-xl font-heading">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {avatarUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                ) : (
                  <Camera className="h-5 w-5 text-accent" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.display_name || user.email}</p>
              <p className="text-xs text-muted-foreground mb-2">JPG, PNG or WebP · Max 2MB</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-xs gap-1"
                >
                  <Camera className="h-3 w-3" /> Upload
                </Button>
                {profile?.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAvatar.mutate()}
                    disabled={removeAvatar.isPending}
                    className="text-xs gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Email (read-only) */}
          <div className="mb-6">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </Label>
            <Input value={user.email || ""} disabled className="bg-secondary/50 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <User className="h-3.5 w-3.5" /> Display Name
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
              />
              {errors.display_name && (
                <p className="text-xs text-destructive mt-1">{errors.display_name}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07X XXXX XXX"
                maxLength={20}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Building2 className="h-3.5 w-3.5" /> Company Name
              </Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Optional"
                maxLength={100}
              />
              {errors.company_name && (
                <p className="text-xs text-destructive mt-1">{errors.company_name}</p>
              )}
            </div>

            <Button
              type="submit"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileSettings;
