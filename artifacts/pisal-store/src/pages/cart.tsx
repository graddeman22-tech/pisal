import { Layout } from "@/components/layout/Layout";
import { apiClient } from "@/lib/api-client";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Shield, Tag } from "lucide-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { user, setAuthModalOpen } = useAppStore();
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => user ? apiClient.getCart(user.id) : [],
    enabled: !!user
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [validating, setValidating] = useState(false);

  const { mutate: updateQty } = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => apiClient.updateCartItem(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => apiClient.removeFromCart(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setValidating(true);
    try {
      const result = await apiClient.validateCoupon(couponCode);
      if (result.valid) {
        setAppliedCoupon({ code: couponCode.toUpperCase(), amount: result.discountAmount ?? 0 });
        toast({ title: "Coupon Applied!", description: `Saved ₹${result.discountAmount}` });
      } else {
        toast({ title: "Invalid Coupon", description: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not apply coupon", variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Your cart is waiting</h2>
          <p className="text-muted-foreground mb-8">Please login to view your cart and checkout.</p>
          <Button onClick={() => setAuthModalOpen(true)} className="rounded-full px-8 bg-[#8B0000] hover:bg-[#6b0000] text-white">Log In</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) return <Layout><div className="py-24 text-center">Loading cart...</div></Layout>;

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price ?? item.products?.price ?? 0) * (item.quantity ?? 1), 0);
  const couponDiscount = appliedCoupon?.amount ?? 0;
  const total = Math.max(0, subtotal - couponDiscount);

  if (!cartItems || cartItems.length === 0) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add some premium spices to get started!</p>
          <Button asChild className="rounded-full px-8 bg-[#8B0000] hover:bg-[#6b0000] text-white">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-10">Shopping Cart ({cartItems.length})</h1>
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3 space-y-4">
            {cartItems.map((item: any) => {
              const product = item.products || {};
              const name = item.product_name || product.name || "Product";
              const img = item.product_image || product.image_url || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80";
              const price = item.price || product.price || 0;
              return (
                <div key={item.id} className="flex gap-4 p-5 bg-card rounded-2xl border border-border/50 shadow-sm relative">
                  <button onClick={() => remove(item.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img src={img} alt={name} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80")} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-semibold text-foreground truncate">{name}</h3>
                    <div className="text-lg font-bold text-[#8B0000] mt-1">₹{price}</div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-border rounded-lg bg-background p-1">
                        <button onClick={() => updateQty({ id: item.id, quantity: Math.max(1, item.quantity - 1) })} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty({ id: item.id, quantity: item.quantity + 1 })} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-700 ml-auto">₹{(price * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:w-1/3">
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm sticky top-28 space-y-4">
              <h3 className="font-bold text-xl">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon ({appliedCoupon?.code})</span><span>-₹{couponDiscount}</span></div>}
                <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{subtotal >= 499 ? "Free" : "₹49"}</span></div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#8B0000]">₹{(total + (subtotal < 499 ? 49 : 0)).toFixed(0)}</span>
                </div>
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon} className="rounded-xl bg-background" />
                <Button type="submit" variant="outline" disabled={validating || !!appliedCoupon || !couponCode} className="rounded-xl">
                  <Tag className="w-4 h-4" />
                </Button>
              </form>

              <Button onClick={() => setLocation("/checkout")}
                className="w-full h-12 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white font-bold text-base shadow-lg">
                Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
