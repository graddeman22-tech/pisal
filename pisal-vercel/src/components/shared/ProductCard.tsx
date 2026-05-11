import { Link } from "wouter";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/api-client";
import { useAddToCart, useAddToWishlist, useRemoveFromWishlist, useGetWishlist } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token, setAuthModalOpen } = useAppStore();

  const { data: wishlistItems } = useGetWishlist({ query: { enabled: !!token } });
  const isWishlisted = wishlistItems?.some(item => item.productId === product.id);

  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart({
    mutation: {
      onSuccess: () => {
        toast({ title: "Added to cart!", description: `${product.name} is in your cart.` });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      },
    },
  });

  const { mutate: toggleWishlist } = useAddToWishlist({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }) },
  });
  const { mutate: removeWishlist } = useRemoveFromWishlist({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] }) },
  });

  const handleCartAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) return setAuthModalOpen(true);
    addToCart({ data: { productId: product.id, quantity: 1 } });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) return setAuthModalOpen(true);
    if (isWishlisted) removeWishlist({ productId: product.id });
    else toggleWishlist({ productId: product.id });
  };

  const savings = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`} className="group card-premium block bg-card relative">

      {/* ── Image ────────────────────────────────── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-t-[1.2rem]">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          style={{ "--tw-scale-x": "1.08", "--tw-scale-y": "1.08" } as React.CSSProperties}
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70"; }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.discount && product.discount > 0 ? (
            <span className="badge-offer">{product.discount}% OFF</span>
          ) : null}
          {product.isBestseller && (
            <span className="inline-block text-[0.62rem] font-bold px-2.5 py-1 rounded-full bg-accent text-accent-foreground shadow-sm">
              Bestseller
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md
            ${isWishlisted
              ? "bg-primary text-white shadow-primary/30"
              : "bg-white/85 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-white"
            }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? "fill-white scale-110" : ""}`} />
        </button>

        {/* Quick Add — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <Button
            onClick={handleCartAdd}
            disabled={isAddingToCart || !product.inStock}
            className="w-full btn-red rounded-xl font-bold h-10 text-sm shadow-lg"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {isAddingToCart ? "Adding…" : product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}
      <div className="p-4 pt-3">
        {/* Category + Rating row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.65rem] font-bold text-primary uppercase tracking-widest">
            {product.categoryName || "Spices"}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-accent text-accent" />
            <span className="text-xs font-bold text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
        </div>

        {/* Name */}
        <h3 className="font-serif text-[1.05rem] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 leading-snug mb-3">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="price-main">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="price-strike">₹{product.originalPrice}</span>
              {savings > 0 && <span className="price-save">Save {savings}%</span>}
            </>
          )}
        </div>

        {/* Add to Cart button — always visible */}
        <Button
          onClick={handleCartAdd}
          disabled={isAddingToCart || !product.inStock}
          className="w-full mt-3 btn-red rounded-xl font-bold h-10 text-sm"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {isAddingToCart ? "Adding…" : product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </Link>
  );
}
