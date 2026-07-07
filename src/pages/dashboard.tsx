import { useState, useMemo, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useListOrders, useGetUserProfile, useGetMe, useListProducts, useAddToCart, useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase"; // Import Supabase Client
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  ShoppingBag, TrendingUp, Star, User, Package, Search, Calendar,
  Download, RotateCcw, ChevronRight, Sparkles, Gift, Trophy,
  BarChart2, CreditCard, MapPin, Phone, Edit2, Loader2, ArrowLeft,
  Heart, Zap, Tag, Shield, Truck, Home, LogOut, Settings2, PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "overview" | "orders" | "products" | "savings" | "profile" | "admin";

const COLORS = ["#8B0000", "#D4AF37", "#10b981", "#6366f1", "#f59e0b"];

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  confirmed: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const LUXURY_COLORS = [
  { border: "#8B0000", shadow: "rgba(139,0,0,0.55)", text: "#8B0000" },
  { border: "#D4AF37", shadow: "rgba(212,175,55,0.55)", text: "#a07c00" },
  { border: "#6B21A8", shadow: "rgba(107,33,168,0.55)", text: "#6B21A8" },
  { border: "#065F46", shadow: "rgba(6,95,70,0.55)", text: "#065F46" },
  { border: "#1e3a8a", shadow: "rgba(30,58,138,0.55)", text: "#1e3a8a" },
  { border: "#B76E79", shadow: "rgba(183,110,121,0.55)", text: "#9a3a48" },
];

function PisalLogoBox() {
  const [colorIdx, setColorIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    intervalRef.current = setInterval(() => setColorIdx(p => (p + 1) % LUXURY_COLORS.length), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);
  const c = LUXURY_COLORS[colorIdx];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: `2.5px solid ${c.border}`,
      boxShadow: `0 0 14px 3px ${c.shadow}, inset 0 0 8px 1px ${c.shadow}`,
      borderRadius: "6px", padding: "4px 16px",
      background: "rgba(255,255,255,0.98)",
      transition: "border-color 0.5s ease, box-shadow 0.5s ease",
      letterSpacing: "0.25em", fontFamily: "serif", fontWeight: 900,
      fontSize: "1.35rem", color: c.text, userSelect: "none",
    }}>
      PISAL
    </span>
  );
}

function ProductCard({ product }: { product: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token, setAuthModalOpen } = useAppStore();
  const { data: wishlistItems } = useGetWishlist({ query: { enabled: !!token } });
  const isWishlisted = wishlistItems?.some((i: any) => i.productId === product.id);
  const { mutate: addToCart, isPending } = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({ title: "Added to cart!", description: product.name });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      },
    },
  });
  const { mutate: addWish } = useAddToWishlist({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }) } });
  const { mutate: removeWish } = useRemoveFromWishlist({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }) } });
  const savings = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link href={`/products/${product.id}`} className="group block bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
        <div className="relative aspect-[4/5] bg-muted overflow-hidden">
          <img src={product.imageUrl} alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70"; }} />
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {savings > 0 && <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-primary text-white shadow">{savings}% OFF</span>}
            {product.isBestseller && <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-amber-400 text-black shadow">BESTSELLER</span>}
          </div>
          <button onClick={e => { e.preventDefault(); if (!token) return setAuthModalOpen(true); isWishlisted ? removeWish({ productId: product.id }) : addWish({ productId: product.id }); }}
            className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${isWishlisted ? "bg-primary text-white" : "bg-white/90 text-muted-foreground hover:text-primary"}`}>
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-2">
            <button onClick={e => { e.preventDefault(); if (!token) return setAuthModalOpen(true); addToCart({ data: { productId: product.id, quantity: 1 } }); }}
              disabled={isPending || !product.inStock}
              className="w-full bg-primary text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-60">
              <ShoppingBag className="w-3.5 h-3.5" />
              {isPending ? "Adding…" : product.inStock ? "Quick Add" : "Out of Stock"}
            </button>
          </div>
        </div>
        <div className="p-3">
          <p className="text-[0.6rem] font-bold text-primary uppercase tracking-widest mb-0.5">{product.categoryName || "Spices"}</p>
          <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors mb-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold">{product.rating ?? "4.5"}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount ?? 0})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
            <span className="text-base font-black">₹{product.price}</span>
            {product.originalPrice > product.price && <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>}
            {savings > 0 && <span className="text-xs font-bold text-green-600">Save ₹{product.originalPrice - product.price}</span>}
          </div>
          <button onClick={e => { e.preventDefault(); if (!token) return setAuthModalOpen(true); addToCart({ data: { productId: product.id, quantity: 1 } }); }}
            disabled={isPending || !product.inStock}
            className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60">
            <ShoppingBag className="w-3.5 h-3.5" />
            {isPending ? "Adding…" : product.inStock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { token, setAuthModalOpen, setToken } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const queryClient = useQueryClient();

  // OWNER ADMIN PANEL STATES
  const [razorpayKey, setRazorpayKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [activeGateway, setActiveGateway] = useState('razorpay');
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCategory, setPCategory] = useState('Spices');
  const [pDesc, setPDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adminStatus, setAdminStatus] = useState('');

  const { data: orders, isLoading: ordersLoading } = useListOrders({ query: { enabled: !!token } });
  const { data: profile, isLoading: profileLoading } = useGetUserProfile({ query: { enabled: !!token } });
  const { data: me } = useGetMe({ query: { enabled: !!token } });
  const { data: productsData, isLoading: productsLoading } = useListProducts({ limit: 40 });

  // Load Existing Keys for Admin Tab
  useEffect(() => {
    if (activeTab === "admin") {
      supabase.from('payment_settings').select('*').single()
        .then(({ data }) => {
          if (data) {
            setRazorpayKey(data.razorpay_key || '');
            setStripeKey(data.stripe_key || '');
            setStripeSecret(data.stripe_secret || '');
            setActiveGateway(data.active_gateway || 'razorpay');
          }
        }).catch(err => console.error(err));
    }
  }, [activeTab]);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdminStatus('Saving keys...');
      await supabase.from('payment_settings').update({
        razorpay_key: razorpayKey,
        stripe_key: stripeKey,
        stripe_secret: stripeSecret,
        active_gateway: activeGateway
      }).eq('id', 1);
      setAdminStatus('✅ Payment Settings Updated Successfully!');
      toast({ title: "Settings Saved", description: "Payment Gateway settings updated." });
    } catch (err: any) {
      setAdminStatus(`❌ Error: ${err.message}`);
    }
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert('Please select a product photo from gallery first!');
    try {
      setUploading(true);
      setAdminStatus('Uploading photo to gallery bucket...');
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(filePath);
      
      setAdminStatus('Publishing product details...');
      await supabase.from('products').insert([{
        name: pName,
        price: parseFloat(pPrice),
        category: pCategory,
        description: pDesc,
        image_url: urlData.publicUrl
      }]);

      setAdminStatus('🎉 Product Published Live Successfully!');
      toast({ title: "Published!", description: `${pName} is now live.` });
      setPName(''); setPPrice(''); setPDesc(''); setImageFile(null);
    } catch (err: any) {
      setAdminStatus(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const totalSpent = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const totalMRP = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.subtotal, 0);
    const totalSaved = totalMRP - totalSpent;
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === "delivered").length;
    const bestDeal = [...orders].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))[0];
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const label = format(d, "MMM");
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthOrders = orders.filter(o => {
        try { return isWithinInterval(parseISO(o.createdAt as string), { start, end }); } catch { return false; }
      });
      const spent = monthOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
      const saved = monthOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.discount ?? 0), 0);
      const count = monthOrders.length;
      return { month: label, spent, saved, orders: count };
    });
    const statusMap: Record<string, number> = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] ?? 0) + 1; });
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
    return { totalSpent, totalSaved, totalOrders, deliveredOrders, bestDeal, monthlyData, statusData };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchSearch = !search || o.id.toString().includes(search) ||
        o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()));
      const matchDate = !dateFilter || o.createdAt?.toString().startsWith(dateFilter);
      return matchSearch && matchDate;
    });
  }, [orders, search, dateFilter]);

  const filteredProducts = useMemo(() => {
    const all = productsData?.products ?? [];
    return all.filter((p: any) => {
      const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = !productCategory || p.categoryName?.toLowerCase().includes(productCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [productsData, productSearch, productCategory]);

  const categories = useMemo(() => {
    const all = productsData?.products ?? [];
    const cats = Array.from(new Set(all.map((p: any) => p.categoryName).filter(Boolean)));
    return cats;
  }, [productsData]);

  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="mb-6 flex justify-center"><PisalLogoBox /></div>
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-serif font-bold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6 text-sm">Login to view your personal dashboard with orders, savings & analytics.</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-primary rounded-full px-8">Login / Sign Up</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "orders", label: "My Orders", icon: ShoppingBag, badge: orders?.length },
    { id: "products", label: "Shop", icon: Package },
    { id: "savings", label: "Savings", icon: Gift },
    { id: "profile", label: "Profile", icon: User },
    { id: "admin", label: "Admin Panel", icon: Settings2 }, // Added Admin Tab Safely
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">

        {/* ── Premium Dashboard Header ── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl mb-6 bg-gradient-to-br from-[#0A0A0A] via-[#1a0000] to-[#3a0000] p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 80% 50%, #D4AF37 0%, transparent 60%)" }} />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 12px)" }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-3xl font-serif shadow-inner">
                {(me?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-semibold mb-0.5">My Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black font-serif text-white leading-tight">
                  Welcome, <span style={{ color: "#D4AF37" }}>{me?.name?.split(" ")[0] || "Customer"}</span>
                </h1>
                <p className="text-white/50 text-xs mt-1">Member since {me?.createdAt ? format(new Date(me.createdAt as string), "MMM yyyy") : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PisalLogoBox />
            </div>
          </div>

          {/* Mini stats strip */}
          <div className="relative z-10 mt-6 grid grid-cols-3 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Spent", value: `₹${(analytics?.totalSpent ?? 0).toLocaleString("en-IN")}`, color: "#D4AF37" },
              { label: "Total Saved", value: `₹${(analytics?.totalSaved ?? 0).toLocaleString("en-IN")}`, color: "#4ade80" },
              { label: "Loyalty Pts", value: `${profile?.loyaltyPoints ?? 0} pts`, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
                <p className="font-black text-xl sm:text-2xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-white/50 text-[0.65rem] font-semibold mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 overflow-x-auto bg-muted/40 rounded-2xl p-1.5 mb-6 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? "bg-card shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[0.6rem] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════ OVERVIEW ══════════════ */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* Stat cards */}
              {ordersLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Spent", value: `₹${(analytics?.totalSpent ?? 0).toLocaleString("en-IN")}`, icon: CreditCard, grad: "from-[#8B0000] to-[#5a0000]", sub: "Lifetime spending" },
                    { label: "Total Saved", value: `₹${(analytics?.totalSaved ?? 0).toLocaleString("en-IN")}`, icon: Gift, grad: "from-emerald-600 to-emerald-700", sub: "On discounts & coupons" },
                    { label: "Total Orders", value: analytics?.totalOrders ?? 0, icon: ShoppingBag, grad: "from-blue-600 to-blue-700", sub: "All time" },
                    { label: "Loyalty Points", value: profile?.loyaltyPoints ?? 0, icon: Star, grad: "from-amber-500 to-amber-600", sub: "1 pt = ₹1 off" },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${card.grad} rounded-2xl p-5 shadow-lg text-white`}>
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 translate-x-6 -translate-y-6" />
                        <Icon className="w-6 h-6 mb-3 opacity-90" />
                        <p className="text-2xl font-black mb-0.5">{card.value}</p>
                        <p className="text-xs font-semibold opacity-90">{card.label}</p>
                        <p className="text-xs opacity-60 mt-0.5">{card.sub}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {analytics && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold text-base mb-0.5">Monthly Spending & Savings</h3>
                      <p className="text-xs text-muted-foreground mb-5">Last 6 months breakdown</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={analytics.monthlyData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                            formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, name === "spent" ? "Spent" : "Saved"]} />
                          <Bar dataKey="spent" fill="#8B0000" radius={[6, 6, 0, 0]} name="spent" />
                          <Bar dataKey="saved" fill="#D4AF37" radius={[6, 6, 0, 0]} name="saved" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold mb-1">Order Status</h3>
                      <p className="text-xs text-muted-foreground mb-4">Breakdown of all orders</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={analytics.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                            {analytics.statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ══════════════ ORDERS ══════════════ */}
          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by order ID or product name…" value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-9 rounded-xl bg-muted/40 border-transparent h-11" />
                </div>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="bg-card border p-5 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-sm font-bold">Order #{order.id}</span>
                        <p className="text-lg font-black text-primary">₹{order.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ PRODUCTS / SHOP ══════════════ */}
          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}

          {/* ══════════════ 🛠️ NEW OWNER ADMIN PANEL ══════════════ */}
          {activeTab === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {adminStatus && <div className="p-3 bg-blue-100 text-blue-800 rounded-xl text-xs font-semibold">{adminStatus}</div>}

              {/* Gateway keys configuration */}
              <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Setup Payment Credentials</h3>
                <form onSubmit={handleSaveKeys} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium mb-1">Active Gateway</label>
                    <select value={activeGateway} onChange={(e) => setActiveGateway(e.target.value)} className="w-full p-2 border rounded-xl bg-muted/40">
                      <option value="razorpay">Razorpay (India)</option>
                      <option value="stripe">Stripe (International)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Razorpay Key ID</label>
                    <Input type="text" value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} placeholder="rzp_live_..." className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium mb-1">Stripe Publishable Key</label>
                      <Input type="text" value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} placeholder="pk_live_..." className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Stripe Secret Key</label>
                      <Input type="password" value={stripeSecret} onChange={(e) => setStripeSecret(e.target.value)} placeholder="sk_live_..." className="rounded-xl" />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="bg-green-700 hover:bg-green-800 text-white rounded-xl">Save Setup Credentials</Button>
                </form>
              </div>

              {/* Image upload and descriptions */}
              <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><PlusCircle className="w-5 h-5 text-primary" /> Add Premium Spices to Gallery</h3>
                <form onSubmit={handlePublishProduct} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium mb-1">Spice/Product Name</label>
                      <Input type="text" required value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g., Pure Turmeric" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Price (₹)</label>
                      <Input type="number" required value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="120" className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Category</label>
                    <Input type="text" value={pCategory} onChange={(e) => setPCategory(e.target.value)} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Product Description</label>
                    <textarea required rows={3} value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Enter details about freshness, quality, weights..." className="w-full p-2 border rounded-xl bg-card text-xs" />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Upload Product Image (Direct Gallery Select)</label>
                    <input type="file" accept="image/*" className="w-full text-xs mt-1 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-semibold" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                    }} />
                  </div>
                  <Button type="submit" disabled={uploading} className="w-full rounded-xl bg-primary text-white font-bold">
                    {uploading ? 'Processing & Uploading...' : 'Publish Product Live on Store'}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Savings and Profile fallbacks (simplified for layout completeness) */}
          {activeTab === "savings" && <div className="p-6 text-center text-muted-foreground bg-card border rounded-2xl">🎉 Coupon discounts and rewards center.</div>}
          {activeTab === "profile" && <div className="p-6 text-center text-muted-foreground bg-card border rounded-2xl">👤 Personal Account Details & Addresses.</div>}

        </AnimatePresence>
      </div>
    </Layout>
  );
}
