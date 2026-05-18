import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Building, Phone, MapPin, Mail, Lock, Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  // Fetch user profile info from DB
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Edit fields state
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync state once profile is loaded
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || "");
      setPhone(profile.contact_phone || "");
      setAddress(profile.default_delivery_address || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!businessName.trim()) {
      toast.error("Business Name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone Number is required");
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: businessName.trim(),
          contact_phone: phone.trim(),
          default_delivery_address: address.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update auth metadata for redundancy and token claims
      await supabase.auth.updateUser({
        data: {
          business_name: businessName.trim(),
          contact_phone: phone.trim(),
        },
      });

      toast.success("Profile updated successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your wholesale account credentials and delivery settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="md:col-span-1 h-fit shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-lg truncate max-w-full font-bold">
              {profile?.business_name || "Valued Wholesaler"}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm border-t pt-4">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Building className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{profile?.business_name || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>{profile?.contact_phone || "N/A"}</span>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="line-clamp-2 text-xs leading-normal">
                {profile?.default_delivery_address || "No default address set"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Tabs Card */}
        <Card className="md:col-span-2 shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="details" className="gap-1.5">
                  <User className="w-4 h-4" /> Personal & Business
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5">
                  <Lock className="w-4 h-4" /> Password & Security
                </TabsTrigger>
              </TabsList>

              {/* Personal & Business Form */}
              <TabsContent value="details">
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Account Email (Read-only)
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="pl-9 bg-muted/50 cursor-not-allowed text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="business" className="text-xs font-semibold">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="business"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Beauty Emporium Ltd"
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      Phone Number (WhatsApp)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +234 80 1234 5678"
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-semibold">
                      Default Delivery Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your standard warehouse or shop shipping address details..."
                        rows={3}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={savingProfile} className="w-full gap-2 mt-2">
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Profile Changes
                  </Button>
                </form>
              </TabsContent>

              {/* Password & Security Form */}
              <TabsContent value="security">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-pass" className="text-xs font-semibold">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-pass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-pass" className="text-xs font-semibold">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-pass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={updatingPassword} className="w-full gap-2 mt-2">
                    {updatingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Update Account Password
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
