import { Layout } from "@/components/layout/Layout";
import { useGetWishlist, useRemoveFromWishlist, useAddToCart } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { token, setAuthModalOpen } = useAppStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: wishlist, isLoading } = useGetWishlist({ query: { enabled: !!token } });

  const { mutate: removeFromWishlist } = useRemoveFromWishlist({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] })
    }
  });

  const { mutate: addToCart } = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({ title: "Added to Cart", description: "Item moved to your cart." });
      }
    }
  });

  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-serif font-bold mb-2">Login to see your Wishlist</h2>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-primary text-white rounded-xl px-8 mt-2">Login</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold mb-8">My Wishlist</h1>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-72 bg-card rounded-2xl animate-pulse" />)}
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">Save items you love to your wishlist.</p>
            <Link href="/products">
              <Button className="bg-primary text-white rounded-xl px-8">Explore Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map((item) => {
              const product = item.product;
              if (!product) return null;
              return (
                <div key={item.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-white">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.discount && product.discount > 0 ? (
                        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">-{product.discount}%</span>
                      ) : null}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-medium text-sm leading-tight mb-2 hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-primary">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs"
                        onClick={() => addToCart({ data: { productId: product.id, quantity: 1 } })}
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" /> Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => removeFromWishlist({ productId: product.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
