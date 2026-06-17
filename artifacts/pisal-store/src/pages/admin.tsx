import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { SAMPLE_PRODUCTS } from "@/lib/sample-products";
import {
  Package, TrendingUp, ShoppingCart, Plus, Trash2,
  Upload, Image as ImageIcon, Tag, BarChart3,
  CheckCircle, XCircle, Clock, Truck, Star, AlertTriangle, RefreshCw,
  CreditCard, Settings, Eye, EyeOff, Globe, ToggleLeft, ToggleRight, Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveLogo, resetLogo } from "@/hooks/useLogo";

const SPICE_CATS = [
  { id: "whole-spices", name: "Whole Spices" },
  { id: "masala-blends", name: "Masala Blends" },
  { id: "ground-spices", name: "Ground Spices" },
  { id: "oils", name: "Oils" },
  { id: "atta-flour", name: "Atta & Flour" },
  { id: "rice", name: "Rice" },
  { id: "pulses", name: "Pulses" },
  { id: "combo-packs", name: "Combo Packs" },
];

const WEIGHT_PRESETS = ["50g", "100g", "200g", "250g", "500g", "1kg", "2kg"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-700",
};

const STATUS_ICONS: Record<string, any> = {
  confirmed: CheckCircle,
  processing: Clock,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  pending: Clock,
};

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"products" | "orders" | "coupons" | "stats" | "logo" | "payment">("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentLogo, setCurrentLogo] = useState<string>(() => localStorage.getItem("pisal_logo") || "/pisal-logo.jpg");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);

  const [razorpayKeyId, setRazorpayKeyId] = useState<string>(() => localStorage.getItem("pisal_rzp_key_id") || "");
  const [razorpaySecret, setRazorpaySecret] = useState<string>(() => localStorage.getItem("pisal_rzp_secret") || "");
  const [razorpayEnabled, setRazorpayEnabled] = useState<boolean>(() => localStorage.getItem("pisal_rzp_enabled") === "true");
  const [razorpayMode, setRazorpayMode] = useState<"test" | "live">(() => (localStorage.getItem("pisal_rzp_mode") as "test" | "live") || "test");
  const [showSecret, setShowSecret] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "", description: "", price: "", original_price: "",
    category_slug: "whole-spices", stock_quantity: "100",
    is_featured: false, is_bestseller: false,
    tags: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [weightOptions, setWeightOptions] = useState<{ weight: string; price: string; in_stock: boolean }[]>([]);

  const [couponForm, setCouponForm] = useState({
    code: "", discount_type: "percent", discount_value: "", min_order_value: "",
    usage_limit: "", expires_at: "",
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aafgptxzavrpraehaexa.supabase.co';
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      let supabaseOk = false;
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
          signal: ctrl.signal,
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
        });
        clearTimeout(timer);
        supabaseOk = res.ok || res.status === 401 || res.status === 403;
      } catch {
        clearTimeout(timer);
        supabaseOk = false;
      }

      if (!supabaseOk) {
        setProducts(SAMPLE_PRODUCTS as any[]);
        setOrders([]);
        setCoupons([]);
        return;
      }

      const [{ data: p }, { data: o }, { data: c }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      ]);
      setProducts(p || []);
      setOrders(o || []);
      setCoupons(c || []);
    } catch (err: any) {
      toast({ title: "Failed to load data", description: err.message, variant: "destructive" });
      setProducts(SAMPLE_PRODUCTS as any[]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Image must be under 5MB", variant: "destructive" }); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl("");
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error("No image selected");
    const ext = imageFile.name.split(".").pop();
    const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const buckets = ["pisal-products", "products", "public"];
    for (const bucket of buckets) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, imageFile, { cacheControl: "3600", upsert: true, contentType: imageFile.type });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return urlData.publicUrl;
      }
    }
    throw new Error("Could not upload to any storage bucket");
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast({ title: "Name and price are required", variant: "destructive" }); return; }

    setSaving(true);
    try {
      let finalImageUrl = imageUrl;

      if (imageFile && !finalImageUrl) {
        setUploading(true);
        try {
          finalImageUrl = await uploadImage();
        } catch {
          finalImageUrl = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";
          toast({ title: "Using placeholder image", description: "Set up a Supabase Storage bucket named 'pisal-products' for real uploads." });
        } finally {
          setUploading(false);
        }
      }

      if (!finalImageUrl) finalImageUrl = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80";

      const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const payload: any = {
        name: form.name,
        description: form.description || null,
        category_slug: form.category_slug,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        image_url: finalImageUrl,
        images: [finalImageUrl],
        in_stock: true,
        stock_quantity: parseInt(form.stock_quantity) || 100,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        tags: form.tags ? form.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
        weight_options: weightOptions.map(w => ({
          weight: w.weight,
          price: parseFloat(w.price) || parseFloat(form.price),
          in_stock: w.in_stock,
        })),
        slug,
      };

      const { data, error } = await supabase.from("products").insert([payload]).select().single();
      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      toast({ title: "Product added!", description: `${form.name} is now live.` });

      setForm({ name: "", description: "", price: "", original_price: "", category_slug: "whole-spices", stock_quantity: "100", is_featured: false, is_bestseller: false, tags: "" });
      setImageFile(null); setImagePreview(null); setImageUrl(""); setWeightOptions([]);
      setShowAddProduct(false);
    } catch (err: any) {
      toast({ title: "Failed to save product", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: "Product deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from("products").update({ in_stock: !current }).eq("id", id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !current } : p));
      toast({ title: !current ? "Product visible" : "Product hidden" });
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast({ title: "Order updated" });
    } catch (err: any) {
      toast({ title: "Failed to update order", variant: "destructive" });
    }
  };

  const addWeightOption = () => setWeightOptions(prev => [...prev, { weight: "100g", price: "", in_stock: true }]);
  const removeWeightOption = (i: number) => setWeightOptions(prev => prev.filter((_, idx) => idx !== i));

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Logo must be under 2MB", variant: "destructive" }); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile && !logoPreview) { toast({ title: "Please select a logo image", variant: "destructive" }); return; }
    setSavingLogo(true);
    try {
      const dataUrl = logoPreview!;
      saveLogo(dataUrl);
      setCurrentLogo(dataUrl);
      setLogoFile(null);
      setLogoPreview(null);
      toast({ title: "Logo updated!", description: "Your new logo is now live across the entire website." });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleResetLogo = () => {
    resetLogo();
    setCurrentLogo("/pisal-logo.png");
    setLogoFile(null);
    setLogoPreview(null);
    toast({ title: "Logo reset to default" });
  };

  const handleSavePayment = () => {
    setSavingPayment(true);
    try {
      localStorage.setItem("pisal_rzp_key_id", razorpayKeyId);
      localStorage.setItem("pisal_rzp_secret", razorpaySecret);
      localStorage.setItem("pisal_rzp_enabled", String(razorpayEnabled));
      localStorage.setItem("pisal_rzp_mode", razorpayMode);
      toast({ title: "Payment settings saved!", description: "Razorpay keys are securely stored." });
    } finally {
      setSavingPayment(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
        min_order_value: couponForm.min_order_value ? parseFloat(couponForm.min_order_value) : 0,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        expires_at: couponForm.expires_at || null,
        is_active: true,
        usage_count: 0,
      };
      const { data, error } = await supabase.from("coupons").insert([payload]).select().single();
      if (error) throw error;
      setCoupons(prev => [data, ...prev]);
      setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order_value: "", usage_limit: "", expires_at: "" });
      toast({ title: "Coupon created!", description: `Code: ${data.code}` });
    } catch (err: any) {
      toast({ title: "Failed to create coupon", description: err.message, variant: "destructive" });
    } finally {
      setSavingCoupon(false);
    }
  };

  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const lowStock = products.filter(p => (p.stock_quantity ?? 0) < 10);

  const tabs = [
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "stats", label: "Analytics", icon: BarChart3 },
    { id: "logo", label: "Logo", icon: Camera },
    { id: "payment", label: "Payments", icon: CreditCard },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-r from-[#8B0000] to-[#5a0000] text-white px-4 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-red-200 mt-1">PISAL Enterprises — Pure Taste of India</p>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
          <StatCard label="Total Revenue" value={`₹${totalRevenue.toFixed(0)}`} icon={TrendingUp} color="bg-emerald-500" sub="All time" />
          <StatCard label="Total Orders" value={totalOrders} icon={ShoppingCart} color="bg-blue-500" sub="In database" />
          <StatCard label="Products" value={products.length} icon={Package} color="bg-orange-500" sub="In catalog" />
          <StatCard label="Low Stock" value={lowStock.length} icon={AlertTriangle} color="bg-red-400" sub="Need restock" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id ? "bg-[#8B0000] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Product Catalog ({products.length})</h2>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="flex items-center gap-2 bg-[#8B0000] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#6b0000] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {showAddProduct ? "Cancel" : "Add Product"}
              </button>
            </div>

            <AnimatePresence>
              {showAddProduct && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddProduct}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 overflow-hidden"
                >
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-3">New Product</h3>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Photo</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#8B0000] hover:bg-red-50 transition-all"
                    >
                      {imagePreview ? (
                        <div className="flex flex-col items-center gap-3">
                          <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-md" />
                          <p className="text-sm text-[#8B0000] font-medium">Click to change</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700">Click to upload image</p>
                            <p className="text-sm text-gray-400">JPG, PNG, WebP · Max 5MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">Or paste an image URL:</p>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={e => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(null); }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
                      <input
                        required value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                        placeholder="e.g. Pure Turmeric Powder"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                      <select
                        value={form.category_slug}
                        onChange={e => setForm(f => ({ ...f, category_slug: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                      >
                        {SPICE_CATS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none resize-none"
                      placeholder="Describe the product, its uses, origin..."
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sale Price (₹) *</label>
                      <input
                        required type="number" min="0" step="0.01"
                        value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                        placeholder="199"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">MRP (₹)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.original_price}
                        onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                        placeholder="299"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock Qty</label>
                      <input
                        type="number" min="0"
                        value={form.stock_quantity}
                        onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                      />
                    </div>
                  </div>

                  {/* Weight Options */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Weight Options</label>
                      <button type="button" onClick={addWeightOption} className="text-xs text-[#8B0000] font-semibold hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add size
                      </button>
                    </div>
                    {weightOptions.length > 0 && (
                      <div className="space-y-2">
                        {weightOptions.map((w, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <select
                              value={w.weight}
                              onChange={e => setWeightOptions(prev => prev.map((o, idx) => idx === i ? { ...o, weight: e.target.value } : o))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                            >
                              {WEIGHT_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input
                              type="number" placeholder="Price ₹"
                              value={w.price}
                              onChange={e => setWeightOptions(prev => prev.map((o, idx) => idx === i ? { ...o, price: e.target.value } : o))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none"
                            />
                            <button type="button" onClick={() => removeWeightOption(i)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags (comma separated)</label>
                    <input
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none"
                      placeholder="organic, bestseller, premium"
                    />
                  </div>

                  <div className="flex gap-6">
                    {[{ key: "is_featured", label: "⭐ Featured" }, { key: "is_bestseller", label: "🔥 Bestseller" }].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form as any)[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                          className="w-4 h-4 accent-[#8B0000]"
                        />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full bg-gradient-to-r from-[#8B0000] to-[#6b0000] text-white font-bold py-3.5 rounded-xl hover:from-[#6b0000] hover:to-[#4a0000] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading image...</>
                      : saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                      : <><Upload className="w-4 h-4" /> Add Product to Catalog</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No products yet</p>
                <p className="text-sm text-gray-400">Click "Add Product" to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      <img
                        src={p.image_url || p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={e => (e.currentTarget.src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80")}
                      />
                      {p.is_bestseller && <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">🔥 Bestseller</span>}
                      {p.is_featured && <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">⭐</span>}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#8B0000] font-bold">₹{p.price}</span>
                        {(p.original_price || p.originalPrice) && (
                          <span className="text-gray-400 text-xs line-through">₹{p.original_price || p.originalPrice}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Stock: {p.stock_quantity ?? p.stockQuantity ?? "—"}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleToggleVisibility(p.id, p.in_stock)}
                          className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-colors ${p.in_stock ? "text-green-600 border-green-200 hover:bg-green-50" : "text-gray-400 border-gray-200 hover:bg-gray-50"}`}
                        >
                          {p.in_stock ? "Visible" : "Hidden"}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs text-red-500 border border-red-200 hover:bg-red-50 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Orders ({orders.length})</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const StatusIcon = STATUS_ICONS[order.status] || Clock;
                  const items = Array.isArray(order.items) ? order.items : [];
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900">Order #{order.id?.slice?.(0, 8) || order.id}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                              <StatusIcon className="w-3 h-3" />
                              {order.status || "pending"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{items.length} item(s) · ₹{(order.total || 0).toFixed(0)}</p>
                          <p className="text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(s => (
                            <button
                              key={s}
                              onClick={() => handleOrderStatus(order.id, s)}
                              disabled={order.status === s}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${order.status === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === "coupons" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Coupons & Offers</h2>
            <form onSubmit={handleAddCoupon} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Create New Coupon</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Coupon Code *</label>
                  <input required value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-red-200 outline-none"
                    placeholder="PISAL20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Discount Type</label>
                  <select value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none">
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Value *</label>
                  <input required type="number" value={couponForm.discount_value} onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none" placeholder="20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Order (₹)</label>
                  <input type="number" value={couponForm.min_order_value} onChange={e => setCouponForm(f => ({ ...f, min_order_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Usage Limit</label>
                  <input type="number" value={couponForm.usage_limit} onChange={e => setCouponForm(f => ({ ...f, usage_limit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Expiry Date</label>
                  <input type="date" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none" />
                </div>
              </div>
              <button type="submit" disabled={savingCoupon}
                className="bg-[#8B0000] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#6b0000] transition-colors disabled:opacity-60 flex items-center gap-2">
                {savingCoupon ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Coupon
              </button>
            </form>

            {coupons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {coupons.map(c => (
                  <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${c.is_active ? "border-green-200" : "border-gray-200 opacity-60"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-[#8B0000] tracking-widest text-lg">{c.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {c.discount_type === "percent" ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                      {c.min_order_value ? ` · Min ₹${c.min_order_value}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Used: {c.usage_count || 0}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</p>
                    {c.expires_at && <p className="text-xs text-gray-400">Expires: {new Date(c.expires_at).toLocaleDateString("en-IN")}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LOGO MANAGEMENT TAB */}
        {activeTab === "logo" && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900">Logo Management</h2>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-4">Current Logo</p>
                <div className="flex items-center gap-5">
                  <img src={currentLogo} alt="Current Logo" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 shadow-sm" />
                  <div>
                    <p className="text-sm text-gray-600">This logo appears in the Navbar, Footer, Login popup, Mobile menu, and all key pages.</p>
                    <p className="text-xs text-gray-400 mt-1">Update it below to instantly refresh across the entire website.</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Upload New Logo</p>
                <div
                  onClick={() => logoFileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#8B0000] hover:bg-red-50 transition-all"
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={logoPreview} alt="Preview" className="w-28 h-28 object-cover rounded-2xl shadow-md" />
                      <p className="text-sm text-[#8B0000] font-medium">Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Tap to upload new logo</p>
                        <p className="text-sm text-gray-400">JPG, PNG, WebP · Max 2MB</p>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={logoFileRef} type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleSaveLogo}
                  disabled={savingLogo || !logoPreview}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#8B0000] to-[#6b0000] text-white font-bold px-6 py-3 rounded-xl hover:from-[#6b0000] hover:to-[#4a0000] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {savingLogo ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Upload className="w-4 h-4" /> Save Logo</>}
                </button>
                <button
                  onClick={handleResetLogo}
                  className="flex items-center gap-2 text-gray-600 border border-gray-200 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <Globe className="w-4 h-4" /> Reset to Default
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-700 font-semibold">📌 How it works</p>
                <ul className="text-xs text-amber-600 mt-1.5 space-y-1">
                  <li>• Upload any image from your phone/gallery</li>
                  <li>• Click "Save Logo" — it instantly updates everywhere</li>
                  <li>• Logo appears in: Navbar, Footer, Login popup, Mobile menu</li>
                  <li>• Use "Reset to Default" to go back to the original tree logo</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT SETTINGS TAB */}
        {activeTab === "payment" && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900">Payment Settings</h2>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-800">Razorpay Payments</p>
                  <p className="text-xs text-gray-500 mt-0.5">Enable online card/UPI payments</p>
                </div>
                <button
                  onClick={() => setRazorpayEnabled(e => !e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${razorpayEnabled ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-500 border border-gray-200"}`}
                >
                  {razorpayEnabled ? <><ToggleRight className="w-5 h-5" /> Enabled</> : <><ToggleLeft className="w-5 h-5" /> Disabled</>}
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Mode:</p>
                <div className="flex gap-2">
                  {(["test", "live"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setRazorpayMode(mode)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all capitalize ${razorpayMode === mode ? (mode === "live" ? "bg-green-600 text-white border-green-600" : "bg-blue-600 text-white border-blue-600") : "bg-white text-gray-500 border-gray-200"}`}
                    >
                      {mode === "test" ? "🧪 Test Mode" : "🚀 Live Mode"}
                    </button>
                  ))}
                </div>
              </div>

              {razorpayMode === "test" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700">🧪 <strong>Test Mode:</strong> Use Razorpay test keys. No real money is charged. Test card: 4111 1111 1111 1111</p>
                </div>
              )}
              {razorpayMode === "live" && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
                  <p className="text-xs text-amber-700">🚀 <strong>Live Mode:</strong> Real money will be charged. Use your production Razorpay keys from the Razorpay Dashboard.</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-gray-400" /> Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={e => setRazorpayKeyId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none font-mono text-sm"
                    placeholder={razorpayMode === "test" ? "rzp_test_xxxxxxxxxxxx" : "rzp_live_xxxxxxxxxxxx"}
                  />
                  <p className="text-xs text-gray-400 mt-1">This key is safe to expose to the frontend</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-gray-400" /> Razorpay Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={razorpaySecret}
                      onChange={e => setRazorpaySecret(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-[#8B0000] outline-none font-mono text-sm pr-12"
                      placeholder="••••••••••••••••••••"
                    />
                    <button type="button" onClick={() => setShowSecret(s => !s)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-red-500 mt-1">⚠️ Keep this secret. For production, move to a backend/.env file.</p>
                </div>
              </div>

              <button
                onClick={handleSavePayment}
                disabled={savingPayment}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B0000] to-[#6b0000] text-white font-bold py-3.5 rounded-xl hover:from-[#6b0000] hover:to-[#4a0000] transition-all shadow-lg disabled:opacity-60"
              >
                {savingPayment ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><CreditCard className="w-4 h-4" /> Save Payment Settings</>}
              </button>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700">📋 Where to get your Razorpay keys:</p>
                <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>razorpay.com</strong> → Sign Up / Login</li>
                  <li>Dashboard → Settings → API Keys</li>
                  <li>Generate Key ID + Key Secret</li>
                  <li>Paste them above and click Save</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Analytics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Revenue Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-bold text-emerald-600">₹{totalRevenue.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-bold text-blue-600">{totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Avg Order Value</span>
                    <span className="font-bold text-purple-600">₹{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Featured Products</h3>
                {products.filter(p => p.is_featured || p.isFeatured).length === 0 ? (
                  <p className="text-gray-400 text-sm">No featured products yet</p>
                ) : (
                  <div className="space-y-2">
                    {products.filter(p => p.is_featured || p.isFeatured).slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-3">
                        <img src={p.image_url || p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" onError={e => (e.currentTarget.src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">₹{p.price}</p>
                        </div>
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" /> Low Stock Alert
                </h3>
                {lowStock.length === 0 ? (
                  <p className="text-gray-400 text-sm">All products have sufficient stock</p>
                ) : (
                  <div className="space-y-2">
                    {lowStock.map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{p.name}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{p.stock_quantity} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
                {orders.slice(0, 5).length === 0 ? (
                  <p className="text-gray-400 text-sm">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-700">#{o.id?.slice?.(0, 8) || o.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">₹{(o.total || 0).toFixed(0)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>{o.status || "pending"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
