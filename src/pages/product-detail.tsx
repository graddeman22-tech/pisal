import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetProduct, useAddToCart } from "@/lib/api-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Heart, Star, Truck, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, isLoading } = useGetProduct(Number(id));
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token, setAuthModalOpen } = useAppStore();

  const { mutate: addToCart, isPending } = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({ title: "Added to Cart", description: `${quantity}x ${product?.name} added to your cart.` });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
    }
  });

  const handleAdd = () => {
    if (!token) return setAuthModalOpen(true);
    if (!product) return;
    addToCart({ data: { productId: product.id, quantity, weight: selectedWeight || undefined } });
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        <Skeleton className="w-full md:w-1/2 aspect-square rounded-2xl" />
        <div className="w-full md:w-1/2 space-y-6">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-full h-12" />
          <Skeleton className="w-24 h-8" />
          <Skeleton className="w-full h-32" />
        </div>
      </div>
    </Layout>
  );

  if (!product) return <Layout><div className="text-center py-24">Product not found</div></Layout>;

  // Initialize selected weight
  if (product.weightOptions && product.weightOptions.length > 0 && !selectedWeight) {
    setSelectedWeight(product.weightOptions[0].weight);
  }

  const activePrice = selectedWeight && product.weightOptions 
    ? product.weightOptions.find(w => w.weight === selectedWeight)?.price || product.price
    : product.price;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Images */}
          <div className="w-full lg:w-1/2">
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden border border-border/50 shadow-sm relative">
              {product.discount && product.discount > 0 && (
                <span className="absolute top-4 left-4 z-10 bg-destructive text-white text-sm font-bold px-3 py-1 rounded-full">
                  {product.discount}% OFF
                </span>
              )}
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.images && product.images.length > 0 && (
              <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                {[product.imageUrl, ...product.images].map((img, i) => (
                  <button key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent focus:border-primary shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                {product.categoryName || "Premium"}
              </span>
              <div className="flex items-center text-accent">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-bold">{product.rating}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary underline decoration-dashed">
                  {product.reviewCount} Reviews
                </a>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">₹{activePrice}</span>
              {product.originalPrice && product.originalPrice > activePrice && (
                <span className="text-lg text-muted-foreground line-through mb-1">₹{product.originalPrice}</span>
              )}
              <span className="text-sm text-muted-foreground mb-1 ml-2">Inclusive of all taxes</span>
            </div>

            <p className="text-foreground/80 leading-relaxed mb-8 text-lg font-light">
              {product.description || "Experience the authentic, rich flavors sourced directly from the finest farms. Perfect for elevating your everyday meals."}
            </p>

            {/* Weights */}
            {product.weightOptions && product.weightOptions.length > 0 && (
              <div className="mb-8">
                <h4 className="font-semibold mb-3">Select Weight</h4>
                <div className="flex flex-wrap gap-3">
                  {product.weightOptions.map(opt => (
                    <button
                      key={opt.weight}
                      onClick={() => setSelectedWeight(opt.weight)}
                      disabled={!opt.inStock}
                      className={`px-5 py-2.5 rounded-xl border font-medium transition-all ${
                        selectedWeight === opt.weight 
                          ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' 
                          : 'border-border bg-card hover:border-primary/50 text-foreground disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {opt.weight}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10 pt-6 border-t border-border/50">
              <div className="flex items-center border border-border rounded-xl bg-card p-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <Button 
                onClick={handleAdd} 
                disabled={isPending || !product.inStock}
                className="flex-1 h-14 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-bold shadow-xl shadow-primary/20"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {isPending ? "Adding..." : product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
              
              <Button variant="outline" className="h-14 w-14 rounded-xl shrink-0 border-border bg-card hover:bg-muted hover:text-primary">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-4 py-6 bg-muted/50 rounded-2xl px-6">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-primary"><Shield className="w-5 h-5" /></div>
                <span className="text-sm font-medium">100% Authentic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-primary"><Truck className="w-5 h-5" /></div>
                <span className="text-sm font-medium">Fast Shipping</span>
              </div>
            </div>
            
            {/* Ingredients/Benefits Tabs could go here */}
          </div>
        </div>
      </div>
    </Layout>
  );
}
