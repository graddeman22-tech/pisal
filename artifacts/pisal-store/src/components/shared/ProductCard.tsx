import { Link } from "wouter";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_count: number;
  is_featured: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, setAuthModalOpen } = useAppStore();

  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => user ? apiClient.getWishlist(user.id) : [],
    enabled: !!user
  });
  
  const isWishlisted = wishlistItems?.some(item => item.product_id === product.id);

  const addToCartMutation = useMutation({
    mutationFn: (item: any) => apiClient.addToCart(item),
    onSuccess: () => {
      toast({ title: "Added to cart!", description: `${product.name} is in your cart.` });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: (item: any) => apiClient.addToWishlist(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeWishlistMutation = useMutation({
    mutationFn: (id: string) => apiClient.removeFromWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const handleCartAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return setAuthModalOpen(true);
    addToCartMutation.mutate({ 
      user_id: user.id, 
      product_id: product.id, 
      quantity: 1 
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return setAuthModalOpen(true);
    if (isWishlisted) {
      const wishlistItem = wishlistItems?.find(item => item.product_id === product.id);
      if (wishlistItem) {
        removeWishlistMutation.mutate(wishlistItem.id);
      }
    } else {
      toggleWishlistMutation.mutate({ 
        user_id: user.id, 
        product_id: product.id 
      });
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="group card-premium block bg-card relative">
      {/* Image Section */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-t-[1.2rem]">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          style={{ "--tw-scale-x": "1.08", "--tw-scale-y": "1.08" } as React.CSSProperties}
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70"; }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_featured && (
            <span className="inline-block text-[0.62rem] font-bold px-2.5 py-1 rounded-full bg-accent text-accent-foreground shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={toggleWishlistMutation.isPending || removeWishlistMutation.isPending}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md
            ${isWishlisted
              ? "bg-primary text-white shadow-primary/30"
              : "bg-card hover:bg-primary hover:text-white"
            }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick Add Button */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <Button
            onClick={handleCartAdd}
            disabled={addToCartMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-10 font-medium shadow-lg shadow-primary/25 transition-all"
          >
            {addToCartMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground leading-tight line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">₹{product.price}</span>
            <span className="text-xs text-muted-foreground">per piece</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < 4 ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">(4.0)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
