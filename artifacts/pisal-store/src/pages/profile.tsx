import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Star, ShoppingBag, Edit2, Plus, Loader2, Phone } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

export default function Profile() {
  const { user, setAuthModalOpen } = useAppStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [addressForm, setAddressForm] = useState({ name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => user ? apiClient.getUserProfile?.(user.id) : null,
    enabled: !!user
  });
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => user ? apiClient.getUserAddresses?.(user.id) : [],
    enabled: !!user
  });

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: any) => apiClient.updateUserProfile?.(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      toast({ title: "Profile updated!" });
    }
  });

  const { mutate: addAddress, isPending: isAddingAddr } = useMutation({
    mutationFn: (data: any) => apiClient.addAddress?.(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowAddAddress(false);
      setAddressForm({ name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false });
      toast({ title: "Address added!" });
    }
  });

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login to view your profile.</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-primary text-white rounded-xl px-8">Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return <Layout><div className="max-w-5xl mx-auto px-4 py-12"><div className="h-96 bg-card rounded-2xl animate-pulse" /></div></Layout>;
  }

  const handleEditStart = () => {
    setFormData({ name: profile?.name || "", email: profile?.email || "" });
    setIsEditing(true);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-serif font-bold mb-1">{profile?.name || "PISAL Customer"}</h2>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> {profile?.phone}</p>
              {profile?.email && <p className="text-muted-foreground text-sm mt-1">{profile.email}</p>}

              <div className="grid grid-cols-3 gap-3 mt-6 text-center">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-primary">{profile?.totalOrders || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Orders</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-primary">{profile?.loyaltyPoints || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Points</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-primary">₹{((profile?.totalSpent || 0) / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground mt-1">Spent</p>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/30">
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{profile?.loyaltyPoints || 0} Loyalty Points</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">Worth ₹{((profile?.loyaltyPoints || 0) * 0.5).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><Edit2 className="w-4 h-4 text-primary" /> Personal Information</h3>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={handleEditStart} className="rounded-xl">Edit</Button>
                )}
              </div>
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); updateProfile({ data: formData }); }} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Full Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Your name" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" className="rounded-xl" />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-primary text-white rounded-xl" disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">Cancel</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{profile?.phone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{profile?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{profile?.email || "—"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Saved Addresses</h3>
                <Button variant="outline" size="sm" onClick={() => setShowAddAddress(true)} className="rounded-xl gap-1">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>

              {showAddAddress && (
                <form onSubmit={(e) => { e.preventDefault(); addAddress({ data: addressForm }); }} className="space-y-3 mb-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Full Name" value={addressForm.name} onChange={(e) => setAddressForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl" required />
                    <Input placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm(p => ({ ...p, phone: e.target.value }))} className="rounded-xl" required />
                  </div>
                  <Input placeholder="Address Line 1" value={addressForm.line1} onChange={(e) => setAddressForm(p => ({ ...p, line1: e.target.value }))} className="rounded-xl" required />
                  <Input placeholder="Address Line 2 (optional)" value={addressForm.line2} onChange={(e) => setAddressForm(p => ({ ...p, line2: e.target.value }))} className="rounded-xl" />
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))} className="rounded-xl" required />
                    <Input placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm(p => ({ ...p, state: e.target.value }))} className="rounded-xl" required />
                    <Input placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm(p => ({ ...p, pincode: e.target.value }))} className="rounded-xl" required />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" className="bg-primary text-white rounded-xl" disabled={isAddingAddr}>
                      {isAddingAddr ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Address"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddAddress(false)} className="rounded-xl">Cancel</Button>
                  </div>
                </form>
              )}

              {!addresses || addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No saved addresses. Add one above.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{addr.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                          <p className="text-xs text-muted-foreground mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                          <p className="text-xs text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                        {addr.isDefault && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Default</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
