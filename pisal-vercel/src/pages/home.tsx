import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useListProducts, useAddToCart, useGetWishlist, useAddToWishlist, useRemoveFromWishlist, useListCategories } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag, Star, ChevronRight, ChevronLeft, Zap, Truck, Shield, Tag, SlidersHorizontal, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Banner slides ─────────────────────────────────────────────── */
const BANNERS = [
  {
    id: 1,
    title: "Flat 20% OFF on First Order",
    subtitle: "Use code PISAL20 at checkout",
    cta: "Shop Now",
    href: "/products",
    bg: "from-[#8B0000] via-[#6b0000] to-[#3a0000]",
    accent: "#D4AF37",
    badge: "LIMITED TIME",
    img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80",
  },
  {
    id: 2,
    title: "Premium Spices, Pure Taste",
    subtitle: "100% natural · Farm to kitchen",
    cta: "Explore Collection",
    href: "/products",
    bg: "from-[#1a3a1a] via-[#0f2d0f] to-[#0a1a0a]",
    accent: "#D4AF37",
    badge: "NEW ARRIVALS",
    img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80",
  },
  {
    id: 3,
    title: "Free Delivery on ₹499+",
    subtitle: "Across all products · No minimum restrictions",
    cta: "Start Shopping",
    href: "/products",
    bg: "from-[#1a1a3a] via-[#0f0f2d] to-[#0a0a1a]",
    accent: "#D4AF37",
    badge: "FREE SHIPPING",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  },
];

const CATS = [
  { name: "All", slug: "" },
  { name: "Whole Spices", slug: "whole" },
  { name: "Masala Blends", slug: "blended" },
  { name: "Ground Spices", slug: "ground" },
  { name: "Oils", slug: "oil" },
  { name: "Atta & Flour", slug: "atta" },
  { name: "Rice", slug: "rice" },
  { name: "Pulses", slug: "pulses" },
  { name: "Combo Packs", slug: "combo" },
];

const SORT_OPTIONS = [
  { label: "Popular", value: "rating" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest", value: "newest" },
  { label: "Discount", value: "discount" },
];

const TRUST = [
  { icon: Zap, text: "Fast Delivery" },
  { icon: Shield, text: "100% Genuine" },
  { icon: Truck, text: "Free on ₹499+" },
  { icon: Tag, text: "Best Prices" },
];

/* ── Skeleton Card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/5] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-9 bg-muted rounded-xl mt-2" />
      </div>
    </div>
  );
}

/* ── Product Card ─────────────────────────────────────────────── */
function FlipkartCard({ product }: { product: any }) {
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

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) return setAuthModalOpen(true);
    addToCart({ data: { productId: product.id, quantity: 1 } });
  };
  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) return setAuthModalOpen(true);
    isWishlisted ? removeWish({ productId: product.id }) : addWish({ productId: product.id });
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Link href={`/products/${product.id}`} className="group block bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-250">
        {/* Image */}
        <div className="relative aspect-[4/5] bg-muted overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70"; }}
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {savings > 0 && (
              <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-primary text-white shadow">
                {savings}% OFF
              </span>
            )}
            {product.isBestseller && (
              <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-accent text-accent-foreground shadow">
                BESTSELLER
              </span>
            )}
            {product.stockQuantity < 15 && product.inStock && (
              <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-orange-500 text-white shadow">
                LIMITED
              </span>
            )}
          </div>
          {/* Wishlist */}
          <button onClick={handleWish}
            className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all
              ${isWishlisted ? "bg-primary text-white" : "bg-white/90 text-muted-foreground hover:text-primary"}`}>
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-2">
            <button onClick={handleCart} disabled={isPending || !product.inStock}
              className="w-full bg-primary text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-60">
              <ShoppingBag className="w-3.5 h-3.5" />
              {isPending ? "Adding…" : product.inStock ? "Quick Add" : "Out of Stock"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[0.6rem] font-bold text-primary uppercase tracking-widest mb-1">{product.categoryName || "Spices"}</p>
          <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1 leading-snug">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
            <span className="text-base font-black text-foreground">₹{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
            )}
            {savings > 0 && <span className="text-xs font-bold text-green-600">Save ₹{product.originalPrice - product.price}</span>}
          </div>
          <button onClick={handleCart} disabled={isPending || !product.inStock}
            className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60">
            <ShoppingBag className="w-3.5 h-3.5" />
            {isPending ? "Adding…" : product.inStock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Banner Carousel ───────────────────────────────────────────── */
function BannerCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const b = BANNERS[idx];
  return (
    <div className="relative overflow-hidden rounded-2xl h-40 sm:h-52 md:h-60 mb-4 shadow-md">
      <AnimatePresence mode="wait">
        <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-r ${b.bg} flex items-center`}>
          {/* Background image */}
          <img src={b.img} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" />
          <div className="relative z-10 px-6 sm:px-10 max-w-lg">
            <span className="text-[0.6rem] font-black tracking-[0.2em] px-2 py-0.5 rounded-full border mb-2 inline-block"
              style={{ color: b.accent, borderColor: b.accent }}>
              {b.badge}
            </span>
            <h2 className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-tight mb-1">{b.title}</h2>
            <p className="text-white/70 text-xs sm:text-sm mb-4">{b.subtitle}</p>
            <Link href={b.href}>
              <button className="text-xs font-bold px-5 py-2 rounded-full flex items-center gap-1.5"
                style={{ background: b.accent, color: "#0A0A0A" }}>
                {b.cta} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-3 right-4 flex gap-1.5 z-20">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/40"}`} />
        ))}
      </div>
      {/* Arrows */}
      <button onClick={() => setIdx(i => (i - 1 + BANNERS.length) % BANNERS.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={() => setIdx(i => (i + 1) % BANNERS.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function Home() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState("");
  const [sort, setSort] = useState("rating");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: allProducts, isLoading } = useListProducts({ limit: 40, sort });
  const { data: extraProducts } = useListProducts({ limit: 40 });

  // Filter locally by category + search
  const filtered = allProducts?.products?.filter((p: any) => {
    const matchCat = !activeCategory || p.categorySlug === activeCategory || p.categoryName?.toLowerCase().includes(activeCategory);
    const matchSearch = !debouncedSearch || p.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Derive deals (highest discount) and featured (bestseller or high rating)
  const allBase = extraProducts?.products ?? [];
  const dealsProducts = [...allBase].sort((a: any, b: any) => (b.discount ?? 0) - (a.discount ?? 0)).slice(0, 4);
  const featuredProducts = allBase.filter((p: any) => p.isBestseller || p.rating >= 4.5).slice(0, 4);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">

        {/* ── Trust bar ── */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TRUST.map(t => {
            const Icon = t.icon;
            return (
              <div key={t.text} className="flex items-center gap-1.5 bg-card border border-border/40 rounded-xl px-3 py-2 text-xs font-semibold">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline text-foreground/80">{t.text}</span>
              </div>
            );
          })}
        </div>

        {/* ── Banner ── */}
        <BannerCarousel />

        {/* ── Search + Sort bar ── */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search spices, masala, oil…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 rounded-xl bg-card border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl bg-card border border-border/50 text-sm focus:outline-none appearance-none cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* ── Category pills (scrollable) ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {CATS.map(c => (
            <button
              key={c.slug}
              onClick={() => setActiveCategory(c.slug)}
              className={`flex-none text-xs font-bold px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                activeCategory === c.slug
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card border-border/50 text-foreground/70 hover:border-primary/50 hover:text-primary"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* ── Best Deals section ── */}
        {!debouncedSearch && !activeCategory && dealsProducts.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <h2 className="text-lg font-black">🔥 Best Deals</h2>
                <span className="text-xs text-muted-foreground">Today's top offers</span>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
              {dealsProducts.map((p: any) => (
                <FlipkartCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Mini offer banner ── */}
        {!debouncedSearch && !activeCategory && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-black text-amber-900 dark:text-amber-300">Use code <span className="text-primary">PISAL20</span> — Get 20% OFF your first order</p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400">Valid on all products · Limited time offer</p>
              </div>
            </div>
            <Link href="/products">
              <button className="shrink-0 text-xs font-black bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                Shop Now
              </button>
            </Link>
          </div>
        )}

        {/* ── All Products grid ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h2 className="text-lg font-black">
                {debouncedSearch ? `Results for "${debouncedSearch}"` : activeCategory ? CATS.find(c => c.slug === activeCategory)?.name : "All Products"}
              </h2>
              {!isLoading && filtered && (
                <span className="text-xs text-muted-foreground">({filtered.length} items)</span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((p: any) => <FlipkartCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-bold mb-1">No products found</p>
              <p className="text-sm text-muted-foreground mb-4">Try a different search or category</p>
              <button onClick={() => { setSearch(""); setActiveCategory(""); }}
                className="text-sm font-bold text-primary hover:underline">Clear filters</button>
            </div>
          )}
        </section>

        {/* ── Featured products ── */}
        {!debouncedSearch && !activeCategory && featuredProducts.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-accent rounded-full" />
                <h2 className="text-lg font-black">⭐ Trending & Featured</h2>
              </div>
              <Link href="/products" className="flex items-center gap-1 text-xs text-primary font-bold hover:underline">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {featuredProducts.map((p: any) => (
                <FlipkartCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Bottom CTA ── */}
        <div className="mt-10 bg-gradient-to-br from-[#8B0000] to-[#5a0000] rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #D4AF37, transparent 60%)" }} />
          <p className="relative z-10 text-xs font-black tracking-[0.2em] text-accent uppercase mb-2">PISAL Family</p>
          <h2 className="relative z-10 text-2xl font-black text-white mb-2">Fresh Spices. Real Taste.</h2>
          <p className="relative z-10 text-white/60 text-sm mb-6">Sourced directly from farms. Delivered to your kitchen.</p>
          <Link href="/products">
            <button className="relative z-10 bg-accent text-black font-black px-8 py-3 rounded-full text-sm hover:opacity-90 transition-opacity">
              Shop All Products →
            </button>
          </Link>
        </div>

      </div>
    </Layout>
  );
}
