import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Heart, Star, Truck, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.getProduct(String(id)),
    retry: false,
  });
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, setAuthModalOpen } = useAppStore();

  const { mutate: addToCart, isPending } = useMutation({
    mutationFn: (item: any) => apiClient.addToCart(item),
    onSuccess: () => {
      toast({ title: "Added to Cart", description: `${quantity}x ${product?.name} added to your cart.` });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const handleAdd = () => {
    if (!user) return setAuthModalOpen(true);
    if (!product) return;
    addToCart({ 
      user_id: user.id,
      product_id: product.id, 
      quantity,
      weight: selectedWeight || undefined 
    });
  };

  if (isLoading) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-48 rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!product) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold mb-2">Product Not Found</h2>
          <Link href="/products">
            <Button className="bg-primary text-white rounded-xl px-8">Browse Products</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70"; }}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">{product.description}</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">₹{product.price}</span>
              <span className="text-sm text-muted-foreground">per piece</span>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="w-16 text-center font-medium">{quantity}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAdd}
              disabled={isPending || !product.stock_count}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-medium shadow-lg disabled:opacity-60"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>

            {/* Product Features */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="text-sm">Free Delivery on orders above ₹500</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm">100% Authentic Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
