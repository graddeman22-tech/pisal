import { useState, useMemo, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  ShoppingBag, TrendingUp, Star, User, Package, Search, Calendar,
  Download, RotateCcw, ChevronRight, Sparkles, Gift, Trophy,
  BarChart2, CreditCard, MapPin, Phone, Edit2, Loader2, ArrowLeft,
  Heart, Zap, Tag, Shield, Truck, Home, LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";

type Tab = "overview" | "orders" | "products" | "savings" | "profile";

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
  const { user, setAuthModalOpen } = useAppStore();

  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => user ? apiClient.getWishlist(user.id) : [],
    enabled: !!user
  });
  const isWishlisted = wishlistItems?.some((i: any) => i.product_id === product.id);
  const addToCartMutation = useMutation({
    mutationFn: (item: any) => apiClient.addToCart(item),
    onSuccess: () => {
      toast({ title: "Added to cart!", description: product.name });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
  const { mutate: addWish } = useMutation({
    mutationFn: (item: any) => apiClient.addToWishlist(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });
  const { mutate: removeWish } = useMutation({
    mutationFn: (item: any) => apiClient.removeFromWishlist(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });
  const savings = 0; // Remove savings calculation for now

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link href={`/products/${product.id}`} className="group block bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-250">
        <div className="relative aspect-[4/5] bg-muted overflow-hidden">
          <img src={product.image_url} alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70"; }} />
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.is_featured && <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-amber-400 text-black shadow">FEATURED</span>}
          </div>
          <button onClick={e => { e.preventDefault(); if (!user) return setAuthModalOpen(true); isWishlisted ? removeWish({ product_id: product.id }) : addWish({ user_id: user.id, product_id: product.id }); }}
            className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all ${isWishlisted ? "bg-primary text-white" : "bg-white/90 text-muted-foreground hover:text-primary"}`}>
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-2">
            <button onClick={e => { e.preventDefault(); if (!user) return setAuthModalOpen(true); addToCartMutation.mutate({ user_id: user.id, product_id: product.id, quantity: 1 }); }}
              disabled={addToCartMutation.isPending || !product.stock_count}
              className="w-full bg-primary text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-60">
              <ShoppingBag className="w-3.5 h-3.5" />
              {addToCartMutation.isPending ? "Adding…" : product.stock_count > 0 ? "Quick Add" : "Out of Stock"}
            </button>
          </div>
        </div>
        <div className="p-3">
          <p className="text-[0.6rem] font-bold text-primary uppercase tracking-widest mb-0.5">{product.category || "Spices"}</p>
          <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors mb-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold">{4.5}</span>
            <span className="text-xs text-muted-foreground">(0)</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
            <span className="text-base font-black">₹{product.price}</span>
          </div>
          <button onClick={e => { e.preventDefault(); if (!user) return setAuthModalOpen(true); addToCartMutation.mutate({ user_id: user.id, product_id: product.id, quantity: 1 }); }}
            disabled={addToCartMutation.isPending || !product.stock_count}
            className="w-full bg-primary text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-60">
            <ShoppingBag className="w-3.5 h-3.5" />
            {addToCartMutation.isPending ? "Adding…" : product.stock_count > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, setAuthModalOpen } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const queryClient = useQueryClient();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => user ? apiClient.getOrders(user.id) : [],
    enabled: !!user
  });
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => user ? apiClient.getUserProfile?.(user.id) : null,
    enabled: !!user
  });
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
    select: (data) => ({ products: data.slice(0, 40) })
  });

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
    const cats = Array.from(new Set(all.map((p: any) => p.category).filter(Boolean)));
    return cats;
  }, [productsData]);

  if (!user) {
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
                {(user?.user_metadata?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white/50 text-xs uppercase tracking-[0.2em] font-semibold mb-0.5">My Dashboard</p>
                <h1 className="text-2xl sm:text-3xl font-black font-serif text-white leading-tight">
                  Welcome, <span style={{ color: "#D4AF37" }}>{user?.user_metadata?.name?.split(" ")[0] || "Customer"}</span>
                </h1>
                <p className="text-white/50 text-xs mt-1">Member since {user?.created_at ? format(new Date(user.created_at), "MMM yyyy") : "—"}</p>
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
              { label: "Loyalty Pts", value: `${profile?.loyalty_points ?? 0} pts`, color: "#f59e0b" },
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
                    { label: "Loyalty Points", value: profile?.loyalty_points ?? 0, icon: Star, grad: "from-amber-500 to-amber-600", sub: "1 pt = ₹1 off" },
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
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Amount Spent</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm" style={{ background: "#D4AF37" }} /> Amount Saved</div>
                      </div>
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
                      <div className="space-y-1.5 mt-2">
                        {analytics.statusData.map((s, i) => (
                          <div key={s.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 capitalize">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                              {s.name}
                            </div>
                            <span className="font-bold">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-1">Order Frequency</h3>
                    <p className="text-xs text-muted-foreground mb-5">Number of orders per month</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={analytics.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }} formatter={(v: number) => [v, "Orders"]} />
                        <Line type="monotone" dataKey="orders" stroke="#8B0000" strokeWidth={2.5} dot={{ fill: "#8B0000", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recent orders quick view */}
                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">Recent Orders</h3>
                      <button onClick={() => setActiveTab("orders")} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {orders?.slice(0, 3).map(order => (
                        <Link key={order.id} href={`/orders/${order.id}`}>
                          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold">Order #{order.id}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt as string), "MMM dd, yyyy")}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-primary text-sm">₹{order.total}</p>
                              <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.status] ?? STATUS_COLORS.confirmed}`}>{order.status}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!ordersLoading && !analytics && (
                <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-bold mb-2">No orders yet</p>
                  <p className="text-muted-foreground text-sm mb-4">Place your first order to see your analytics!</p>
                  <Button asChild className="bg-primary rounded-full px-8"><Link href="/products">Shop Now</Link></Button>
                </div>
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
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="month" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                    className="pl-9 rounded-xl bg-muted/40 border-transparent h-11 w-full sm:w-44" />
                </div>
                {(search || dateFilter) && (
                  <Button variant="ghost" onClick={() => { setSearch(""); setDateFilter(""); }} className="rounded-xl h-11 text-muted-foreground">Clear</Button>
                )}
              </div>

              {ordersLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{orders?.length === 0 ? "No orders yet" : "No orders match your search"}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <motion.div key={order.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm font-bold bg-muted px-2 py-1 rounded">#{order.id}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[order.status] ?? STATUS_COLORS.confirmed}`}>{order.status}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(order.createdAt as string), "MMM dd, yyyy")}</span>
                        </div>
                        <p className="text-lg font-black text-primary shrink-0">₹{order.total}</p>
                      </div>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {order.items.slice(0, 4).map((item, i) => (
                          <div key={i} className="w-14 h-14 rounded-lg bg-muted border border-border overflow-hidden shrink-0">
                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">+{order.items.length - 4}</div>
                        )}
                      </div>
                      <div className="bg-muted/40 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div><p className="text-muted-foreground">MRP</p><p className="font-bold mt-0.5">₹{order.subtotal}</p></div>
                        <div><p className="text-muted-foreground">Discount</p><p className="font-bold mt-0.5 text-green-600">-₹{order.discount ?? 0}</p></div>
                        <div><p className="text-muted-foreground">Paid</p><p className="font-bold mt-0.5 text-primary">₹{order.total}</p></div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm" className="rounded-xl bg-primary text-white h-9 px-4 text-xs flex items-center gap-1.5">
                            View Details <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs flex items-center gap-1.5"
                          onClick={() => toast({ title: "Invoice Download", description: "Invoice download coming soon!" })}>
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </Button>
                        {order.status === "delivered" && (
                          <Button size="sm" variant="ghost" className="rounded-xl h-9 px-4 text-xs text-primary flex items-center gap-1.5"
                            onClick={() => setLocation("/products")}>
                            <RotateCcw className="w-3.5 h-3.5" /> Reorder
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ PRODUCTS (SHOP) ══════════════ */}
          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">Shop Products</h2>
                  <p className="text-xs text-muted-foreground">Browse & add directly to cart</p>
                </div>
                <Link href="/products">
                  <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-1.5 text-xs">
                    View Full Store <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Offer strip */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl px-5 py-3 flex items-center gap-3">
                <Tag className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Use code <span className="text-primary">PISAL20</span> — Get 20% OFF your first order!</p>
              </div>

              {/* Search + Category filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="Search products…" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 h-10 rounded-xl bg-card border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <select value={productCategory} onChange={e => setProductCategory(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-card border border-border/50 text-sm focus:outline-none appearance-none cursor-pointer pr-8">
                  <option value="">All Categories</option>
                  {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                      <div className="aspect-[4/5] bg-muted" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-9 bg-muted rounded-xl mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-bold mb-1">No products found</p>
                  <button onClick={() => { setProductSearch(""); setProductCategory(""); }} className="text-xs text-primary font-bold hover:underline">Clear filters</button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{filteredProducts.length} products found</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ══════════════ SAVINGS ══════════════ */}
          {activeTab === "savings" && (
            <motion.div key="savings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {ordersLoading ? (
                <div className="h-64 bg-card rounded-2xl animate-pulse" />
              ) : !analytics ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Shop to start saving!</p>
                  <Button asChild className="bg-primary rounded-full px-8"><Link href="/products">Start Shopping</Link></Button>
                </div>
              ) : (
                <>
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#8B0000] to-[#5a0000] rounded-3xl p-8 text-white shadow-xl">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #D4AF37 0%, transparent 60%)" }} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold text-sm uppercase tracking-widest">Total Savings</span>
                      </div>
                      <p className="text-5xl font-black mb-1">₹{analytics.totalSaved.toLocaleString("en-IN")}</p>
                      <p className="text-white/70 text-sm">saved across {analytics.totalOrders} orders</p>
                      <div className="mt-6 flex gap-6 text-sm">
                        <div><p className="text-white/60">Amount Spent</p><p className="font-bold text-lg">₹{analytics.totalSpent.toLocaleString("en-IN")}</p></div>
                        <div><p className="text-white/60">Avg Saving/Order</p><p className="font-bold text-lg">₹{analytics.totalOrders > 0 ? (analytics.totalSaved / analytics.totalOrders).toFixed(0) : 0}</p></div>
                      </div>
                    </div>
                  </div>

                  {analytics.bestDeal && (analytics.bestDeal.discount ?? 0) > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5 flex items-center gap-4">
                      <Trophy className="w-10 h-10 text-amber-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-amber-700/70 dark:text-amber-400/70 font-semibold uppercase tracking-wider">Best Deal</p>
                        <p className="font-bold text-amber-800 dark:text-amber-300">Order #{analytics.bestDeal.id}</p>
                        <p className="text-sm text-amber-700/80 dark:text-amber-400">Saved ₹{analytics.bestDeal.discount ?? 0} on this order</p>
                      </div>
                      <Link href={`/orders/${analytics.bestDeal.id}`}>
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-8 px-3 text-xs">View</Button>
                      </Link>
                    </div>
                  )}

                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-1">Monthly Savings Trend</h3>
                    <p className="text-xs text-muted-foreground mb-5">How much you saved each month</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                          formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Saved"]} />
                        <Bar dataKey="saved" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4">Savings Per Order</h3>
                    <div className="space-y-3">
                      {orders?.filter(o => (o.discount ?? 0) > 0).slice(0, 8).map(order => {
                        const savePct = order.subtotal > 0 ? ((order.discount ?? 0) / order.subtotal * 100).toFixed(0) : 0;
                        return (
                          <div key={order.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Order #{order.id}</span>
                                <span className="text-green-600 font-bold">₹{order.discount ?? 0} off ({savePct}%)</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, Number(savePct))}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {profile && (
                    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Star className="w-7 h-7 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Loyalty Points</p>
                        <p className="text-3xl font-black text-amber-600">{profile.loyaltyPoints ?? 0} pts</p>
                        <p className="text-xs text-muted-foreground mt-1">1 point = ₹1 discount at checkout</p>
                      </div>
                      <Button asChild size="sm" className="bg-primary rounded-xl text-white shrink-0">
                        <Link href="/products">Earn More</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ══════════════ PROFILE ══════════════ */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {profileLoading ? (
                <div className="h-64 bg-card rounded-2xl animate-pulse" />
              ) : profile ? (
                <div className="space-y-5 max-w-2xl">
                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold">Personal Info</h3>
                      <Link href="/profile">
                        <Button size="sm" variant="outline" className="rounded-xl h-8 px-3 text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-2xl font-serif">
                        {(profile.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{profile.name || "Customer"}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {profile.phone}</p>
                        {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center bg-muted/40 rounded-xl p-4">
                      <div><p className="font-black text-primary text-xl">{analytics?.totalOrders ?? 0}</p><p className="text-xs text-muted-foreground">Orders</p></div>
                      <div><p className="font-black text-green-600 text-xl">₹{analytics?.totalSaved ?? 0}</p><p className="text-xs text-muted-foreground">Saved</p></div>
                      <div><p className="font-black text-amber-600 text-xl">{profile.loyaltyPoints ?? 0}</p><p className="text-xs text-muted-foreground">Points</p></div>
                    </div>
                  </div>

                  <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold mb-4">Quick Links</h3>
                    <div className="space-y-2">
                      {[
                        { label: "My Orders", href: "/orders", icon: ShoppingBag },
                        { label: "My Wishlist", href: "/wishlist", icon: Heart },
                        { label: "Manage Addresses", href: "/profile", icon: MapPin },
                        { label: "Shop Products", href: "/products", icon: Package },
                      ].map(l => {
                        const Icon = l.icon;
                        return (
                          <Link key={l.href} href={l.href}>
                            <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-xl transition-colors cursor-pointer group">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium flex-1">{l.label}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Layout>
  );
}
