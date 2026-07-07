import { useState, useMemo, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { useListOrders, useGetUserProfile, useGetMe, useListProducts, useAddToCart, useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase"; 
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  ShoppingBag, TrendingUp, Star, User, Package, Search, Calendar,
  Download, RotateCcw, ChevronRight, Sparkles, Gift, Trophy,
  BarChart2, CreditCard, MapPin, Phone, Edit2, Loader2, ArrowLeft,
  Heart, Zap, Tag, Shield, Truck, Home, LogOut, Settings2, PlusCircle, Camera, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "overview" | "orders" | "products" | "savings" | "profile" | "admin";

const COLORS = ["#8B0000", "#D4AF37", "#10b981", "#6366f1", "#f59e0b"];

const LUXURY_COLORS = [
  { border: "#8B0000", shadow: "rgba(139,0,0,0.55)", text: "#8B0000" },
  { border: "#D4AF37", shadow: "rgba(212,175,55,0.55)", text: "#a07c00" },
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

export default function Dashboard() {
  const { token, setAuthModalOpen } = useAppStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const queryClient = useQueryClient();

  // ADMIN STATE CONTROLS
  const [razorpayKey, setRazorpayKey] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [activeGateway, setActiveGateway] = useState('razorpay');
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCategory, setPCategory] = useState('Spices');
  const [pDesc, setPDesc] = useState('');
  
  // File System Upload States
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [adminStatus, setAdminStatus] = useState('');

  // API Data Hooks
  const { data: orders, isLoading: ordersLoading } = useListOrders({ query: { enabled: !!token } });
  const { data: profile } = useGetUserProfile({ query: { enabled: !!token } });
  const { data: me } = useGetMe({ query: { enabled: !!token } });
  const { data: productsData } = useListProducts({ limit: 40 });
  const { mutate: addToCart } = useAddToCart();
  const { data: wishlist } = useGetWishlist();
  const { mutate: addToWishlist } = useAddToWishlist();
  const { mutate: removeFromWishlist } = useRemoveFromWishlist();

  // Sync admin view data from DB on active tab state trigger
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

  // Handler Submissions
  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdminStatus('Saving production configurations...');
      await supabase.from('payment_settings').update({
        razorpay_key: razorpayKey,
        stripe_key: stripeKey,
        stripe_secret: stripeSecret,
        active_gateway: activeGateway
      }).eq('id', 1);
      setAdminStatus('✅ Payment Settings System Globally Updated!');
      toast({ title: "Config Saved", description: "Payment settings synchronized successfully." });
    } catch (err: any) {
      setAdminStatus(`❌ Sync Failed: ${err.message}`);
    }
  };

  const handleUpdateProfilePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFile) return;
    try {
      setUploading(true);
      setAdminStatus('Compressing and uploading profile picture...');
      const fileExt = profileFile.name.split('.').pop();
      const fileName = `avatar_${me?.id || Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, profileFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('profiles').getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', me?.id);

      setAdminStatus('🎉 Owner profile photo dynamic updating successful!');
      toast({ title: "Avatar Live", description: "Profile layout updated automatically." });
      setProfileFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    } catch (err: any) {
      setAdminStatus(`❌ Profile Edit Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    try {
      setUploading(true);
      setAdminStatus('Uploading premium stock asset to database...');
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `spice_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('products').getPublicUrl(filePath);
      
      await supabase.from('products').insert([{
        name: pName,
        price: parseFloat(pPrice),
        category: pCategory,
        description: pDesc,
        image_url: urlData.publicUrl
      }]);

      setAdminStatus('🎉 New spice item added to storefront live catalog catalog!');
      toast({ title: "Product Live", description: `${pName} is ready to order.` });
      setPName(''); setPPrice(''); setPDesc(''); setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (err: any) {
      setAdminStatus(`❌ Catalog Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Complex Analytics Memo Calculus
  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    
    let filtered = [...orders];
    const now = new Date();
    if (dateFilter === "month") {
      filtered = orders.filter(o => isWithinInterval(parseISO(o.createdAt), { start: startOfMonth(now), end: endOfMonth(now) }));
    } else if (dateFilter === "3months") {
      filtered = orders.filter(o => isWithinInterval(parseISO(o.createdAt), { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now) }));
    }

    const totalSpent = filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const totalMRP = filtered.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.subtotal, 0);
    const totalSaved = totalMRP - totalSpent;
    const totalOrders = filtered.length;
    
    const monthlyMap: Record<string, { month: string; spent: number; saved: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const mLabel = format(subMonths(new Date(), i), "MMM");
      monthlyMap[mLabel] = { month: mLabel, spent: 0, saved: 0 };
    }

    orders.forEach(o => {
      if (o.status !== "cancelled") {
        const mLabel = format(parseISO(o.createdAt), "MMM");
        if (monthlyMap[mLabel]) {
          monthlyMap[mLabel].spent += o.total;
          monthlyMap[mLabel].saved += (o.subtotal - o.total);
        }
      }
    });

    const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    return { totalSpent, totalSaved, totalOrders, monthlyData: Object.values(monthlyMap), statusData, filteredOrders: filtered };
  }, [orders, dateFilter]);

  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return [];
    return productsData.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [productsData, search]);

  if (!token) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 space-y-4">
          <p className="text-muted-foreground font-medium">Please login to access your executive dashboard panel.</p>
          <Button onClick={() => setAuthModalOpen(true)} className="bg-primary rounded-full px-8 shadow-lg">Login / Sign Up</Button>
        </div>
      </Layout>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "products", label: "Shop Store", icon: Package },
    { id: "savings", label: "Savings Tracker", icon: Gift },
    { id: "profile", label: "Profile", icon: User },
    { id: "admin", label: "Admin Control Panel", icon: Settings2 }, 
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0F0F0F] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white/5 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 to-amber-950/20 opacity-50" />
          <div className="relative flex items-center gap-5 z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center text-2xl font-bold shadow-inner">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (me?.name || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {me?.name || "Founder Member"}</h1>
              <p className="text-sm text-white/50 font-medium">Manage and check your corporate updates live</p>
            </div>
          </div>
          <div className="relative z-10 self-end md:self-center">
            <PisalLogoBox />
          </div>
        </div>

        {/* Scrollable Tab Controls */}
        <div className="flex gap-2 overflow-x-auto bg-muted/40 backdrop-blur-md rounded-2xl p-1.5 scrollbar-none border shadow-inner">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id ? "bg-card shadow-lg text-primary scale-105 border border-primary/10" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Core Layout Panels */}
        <AnimatePresence mode="wait">
          
          {/* OVERVIEW COMPREHENSIVE VIEW PANEL */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"><BarChart2 className="text-primary w-5 h-5" /> Executive Overview</h2>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-card border rounded-xl p-2 text-xs font-semibold shadow-sm">
                    <option value="all">Lifetime Analytics</option>
                    <option value="month">Current Month</option>
                    <option value="3months">Last 3 Months</option>
                  </select>
                </div>
              </div>

              {analytics ? (
                <>
                  {/* Performance Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gross Investments</p>
                        <h3 className="text-3xl font-black mt-1">₹{analytics.totalSpent.toLocaleString("en-IN")}</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/10 text-primary"><TrendingUp className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Retained Savings</p>
                        <h3 className="text-3xl font-black mt-1 text-emerald-600">₹{analytics.totalSaved.toLocaleString("en-IN")}</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600"><Trophy className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Processed Orders</p>
                        <h3 className="text-3xl font-black mt-1">{analytics.totalOrders}</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 text-blue-600"><Package className="w-6 h-6" /></div>
                    </div>
                  </div>

                  {/* Complex Double Charts Visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-card border rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
                      <h4 className="font-bold text-sm text-foreground">Revenue Expansion vs Profit Retained</h4>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.monthlyData}>
                            <defs>
                              <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B0000" stopOpacity={0.2}/><stop offset="95%" stopColor="#8B0000" stopOpacity={0}/></linearGradient>
                              <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" fontSize={11} tickLine={false} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="spent" name="Spent" stroke="#8B0000" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={2} />
                            <Area type="monotone" dataKey="saved" name="Saved" stroke="#10b981" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                      <h4 className="font-bold text-sm text-foreground mb-2">Order Distribution Allocation</h4>
                      <div className="h-56 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={analytics.statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                              {analytics.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        {analytics.statusData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="capitalize text-muted-foreground">{d.name}: {d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground font-medium">No system metrics recorded for this specified time scale timeline.</div>
              )}
            </motion.div>
          )}

          {/* MY ORDERS INTERACTIVE LIST COMPONENT */}
          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"><ShoppingBag className="text-primary w-5 h-5" /> Order Fulfillment Registry</h2>
              
              {ordersLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-card border rounded-2xl p-5 shadow-sm space-y-4 hover:border-muted-foreground/20 transition-all">
                      <div className="flex flex-wrap justify-between items-center border-b pb-3 gap-2">
                        <div>
                          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Order ID Reference</p>
                          <h4 className="font-mono text-sm font-bold text-foreground">#PX-{order.id.slice(0,8).toUpperCase()}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-medium">{format(parseISO(order.createdAt), "dd MMM yyyy, hh:mm a")}</p>
                          <span className={`inline-flex mt-1 items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            order.status === "delivered" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                          }`}>{order.status}</span>
                        </div>
                      </div>

                      {/* Dynamic items looping within the card architecture */}
                      <div className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-foreground/80">{item.name || "Premium Spice Blend"} <span className="text-muted-foreground font-normal">x{item.quantity || 1}</span></span>
                            <span className="font-bold">₹{((item.price || order.total) * (item.quantity || 1)).toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center border-t pt-3 bg-muted/20 -mx-5 -mb-5 p-5 rounded-b-2xl">
                        <span className="text-xs font-bold text-muted-foreground">Total Paid Amount</span>
                        <span className="text-lg font-black text-primary">₹{order.total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground">No transaction records found on this profile pipeline.</div>
              )}
            </motion.div>
          )}

          {/* SHOP STOREFRONT DYNAMIC INTERACTIVE GRID CATALOG */}
          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"><Package className="text-primary w-5 h-5" /> Premium Wholesale Catalog</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="text" placeholder="Search direct inventory stocks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl text-xs" />
                </div>
              </div>

              {filteredProducts.length > 3 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const isWish = wishlist?.some(w => w.productId === product.id);
                    return (
                      <div key={product.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-all duration-300">
                        <div className="relative aspect-square bg-muted overflow-hidden">
                          <img src={product.imageUrl || "/placeholder-spice.png"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                          <button onClick={() => isWish ? removeFromWishlist(product.id) : addToWishlist({ productId: product.id })} 
                            className="absolute top-2 right-2 p-2 rounded-xl bg-background/80 backdrop-blur-md shadow-sm text-muted-foreground hover:text-red-600 transition-colors">
                            <Heart className={`w-4 h-4 ${isWish ? "fill-red-600 text-red-600" : ""}`} />
                          </button>
                        </div>
                        <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md tracking-wider">{product.category}</span>
                            <h4 className="font-bold text-sm text-foreground mt-1 line-clamp-1">{product.name}</h4>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{product.description}</p>
                          </div>
                          <div className="pt-2 flex items-center justify-between mt-auto">
                            <span className="text-base font-black text-foreground">₹{product.price}</span>
                            <Button onClick={() => { addToCart({ productId: product.id, quantity: 1 }); toast({ title: "Added", description: "Item appended to procurement cart." }); }} size="sm" className="rounded-xl px-3 text-xs font-bold gap-1 shadow-sm"><PlusCircle className="w-3.5 h-3.5" /> Buy</Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground">No live catalog stock components found matching query criteria.</div>
              )}
            </motion.div>
          )}

          {/* RETENTION SAVINGS TRACKER TARGET VISUALIZER */}
          {activeTab === "savings" && (
            <motion.div key="savings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"><Gift className="text-primary w-5 h-5" /> Retained Capital Safeguard</h2>
              {analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-white/5 rounded-full blur-2xl" />
                    <div className="space-y-2">
                      <span className="text-xs uppercase font-bold tracking-widest text-emerald-300">Net Profit Margins Saved</span>
                      <h3 className="text-4xl font-black">₹{analytics.totalSaved.toLocaleString("en-IN")}</h3>
                      <p className="text-xs text-white/60 font-medium">Accumulated capital conservation over active lifecycle operations.</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-md flex items-center gap-3">
                      <Shield className="w-5 h-5 text-emerald-300" />
                      <p className="text-xs font-semibold">Your structural supply chain optimization retains an avg of 18% surplus values.</p>
                    </div>
                  </div>

                  <div className="bg-card border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <h4 className="font-bold text-sm text-foreground">Incremental Optimization Progress Map</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Current Savings Reserve</span>
                        <span className="text-primary">₹{analytics.totalSaved.toLocaleString("en-IN")} / ₹50,000 Milestone</span>
                      </div>
                      <div className="w-full bg-muted h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((analytics.totalSaved / 50000) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Once this operational tier pool reaches equilibrium milestone, special wholesale corporate distributions incentives trigger on dynamic orders pipelines.</p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground">Initialize order interactions to chart retention metrics parameters.</div>
              )}
            </motion.div>
          )}

          {/* PROFILE USER DATA SCHEMATICS */}
          {activeTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="bg-card border rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"><User className="text-primary w-5 h-5" /> Account Architecture</h2>
                <Button variant="outline" size="sm" onClick={() => { useAppStore.getState().logout(); setLocation("/"); }} className="rounded-xl font-bold text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"><LogOut className="w-3.5 h-3.5" /> Close Session</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border">
                  <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Registered Full Legal Name</p>
                  <p className="text-sm font-black text-foreground">{me?.name || "N/A"}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border">
                  <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Authenticated Email System</p>
                  <p className="text-sm font-black text-foreground">{me?.email || "N/A"}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border">
                  <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Contact Handset Linkage</p>
                  <p className="text-sm font-black text-foreground">{profile?.phone || "Verification Outstanding"}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border">
                  <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Primary Logistic Drop Point</p>
                  <p className="text-sm font-black text-foreground line-clamp-1">{profile?.address || "No baseline logistical mapping saved"}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* EXECUTIVE ADMINISTRATIVE PANEL & PRODUCTION UTILITIES CONTROL */}
          {activeTab === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2"><Settings2 className="text-primary w-5 h-5" /> Corporate Admin Control Center</h2>
              
              {adminStatus && (
                <div className="p-3.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>{adminStatus}</span>
                </div>
              )}

              {/* TIER 1: Profile Avatar Storage Integration Control */}
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2"><Camera className="w-4 h-4 text-primary" /> Global Profile Branding Overwrite</h3>
                <form onSubmit={handleUpdateProfilePhoto} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">Select New High-Definition Custom Profile Picture File</label>
                    <input type="file" accept="image/*" required className="w-full text-xs mt-1 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-bold file:uppercase file:tracking-wider cursor-pointer" 
                      onChange={(e) => { if (e.target.files && e.target.files[0]) setProfileFile(e.target.files[0]); }} />
                  </div>
                  <Button type="submit" disabled={uploading || !profileFile} className="bg-primary text-white rounded-xl text-xs font-bold shadow-md px-5 py-2.5">
                    {uploading ? 'Processing Image Pipeline...' : 'Deploy Profile Layout Overwrite'}
                  </Button>
                </form>
              </div>

              {/* TIER 2: Direct Product Insertion Pipeline Asset Engine */}
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2"><PlusCircle className="w-4 h-4 text-primary" /> Deploy New Spices Commodities Assets Live</h3>
                <form onSubmit={handlePublishProduct} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Premium Blend Label Title</label>
                      <Input type="text" mountaineering-attr="true" required value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Premium Shahi Garam Masala" className="rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Wholesale Base Cost (INR ₹)</label>
                      <Input type="number" required value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="e.g. 240" className="rounded-xl text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Categorization Classification</label>
                      <select value={pCategory} onChange={(e) => setPCategory(e.target.value)} className="w-full p-2.5 border rounded-xl bg-card text-xs font-semibold shadow-sm">
                        <option value="Spices">Premium Pure Ground Spices</option>
                        <option value="Blends">Formulated Commercial Blends</option>
                        <option value="Whole">Exotic Whole Spices Array</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Commodity Media Photo Upload</label>
                      <input type="file" required accept="image/*" className="w-full text-xs mt-1 file:py-2 file:px-4 file:rounded-xl file:border shadow-sm file:text-xs cursor-pointer" onChange={(e) => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]); }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Technical Product Merchandising Description</label>
                    <textarea required rows={3} value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Elaborate flavor characteristics profiles, ingredients breakdown ratios, weights metrics packaging specifications..." className="w-full p-3 border rounded-xl bg-card text-xs shadow-inner focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>

                  <Button type="submit" disabled={uploading} className="w-full rounded-xl bg-primary text-white font-bold py-3 uppercase tracking-wider text-xs shadow-lg shadow-red-950/20">
                    {uploading ? 'Processing Database Transaction Matrix...' : 'Launch Product live to Global Catalog Grid'}
                  </Button>
                </form>
              </div>

              {/* TIER 3: Security & Cryptographic Financial Gateway Switches */}
              <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2"><CreditCard className="w-4 h-4 text-primary" /> Financial Infrastructure Key Integrity Management</h3>
                <form onSubmit={handleSaveKeys} className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider block">Active Core Billing System Gateway Configuration</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input type="radio" name="gateway" value="razorpay" checked={activeGateway === 'razorpay'} onChange={() => setActiveGateway('razorpay')} className="text-primary accent-primary" />
                        <span>Razorpay Payment Engine (India Domestic Operations)</span>
                      </label>
                      <label className="flex items-center gap-2 font-bold cursor-pointer">
                        <input type="radio" name="gateway" value="stripe" checked={activeGateway === 'stripe'} onChange={() => setActiveGateway('stripe')} className="text-primary accent-primary" />
                        <span>Stripe Global Network (Export Processing API Matrix)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Razorpay Production Live API Public Key</label>
                      <Input type="text" value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} placeholder="rzp_live_..." className="rounded-xl font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Stripe Public Token Matrix Identification</label>
                      <Input type="text" value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} placeholder="pk_live_..." className="rounded-xl font-mono text-xs" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">Stripe Highly Cryptographic Confidential Secret Passphrase</label>
                    <Input type="password" value={stripeSecret} onChange={(e) => setStripeSecret(e.target.value)} placeholder="••••••••••••••••••••••••••••••••••••" className="rounded-xl font-mono text-xs" />
                  </div>

                  <Button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl px-6 py-2.5 uppercase tracking-wider text-[11px] shadow-md">
                    Synchronize Financial Vault Keys Matrix
                  </Button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Layout>
  );
}
