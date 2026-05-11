import { Layout } from "@/components/layout/Layout";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useValidateCoupon } from "@/lib/api-client";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowRight, TicketPercent, ShoppingBag, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { token, setAuthModalOpen } = useAppStore();
  const { data: cart, isLoading } = useGetCart({ query: { enabled: !!token } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const { mutate: updateQty } = useUpdateCartItem({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }) }
  });

  const { mutate: remove } = useRemoveFromCart({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }) }
  });

  const { mutate: validateCoupon, isPending: validating } = useValidateCoupon({
    mutation: {
      onSuccess: (data) => {
        if (data.valid) {
          setAppliedCoupon(couponCode);
          toast({ title: "Coupon Applied", description: `Saved ₹${data.discountAmount}` });
        } else {
          toast({ title: "Invalid Coupon", description: data.message, variant: "destructive" });
        }
      },
      onError: () => toast({ title: "Error", description: "Could not apply coupon", variant: "destructive" })
    }
  });

  if (!token) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <TicketPercent className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4">Your cart is waiting</h2>
          <p className="text-muted-foreground mb-8">Please login to view your cart and checkout.</p>
          <Button onClick={() => setAuthModalOpen(true)} className="rounded-full px-8 bg-primary">Log In</Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) return <Layout><div className="py-24 text-center">Loading cart...</div></Layout>;

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added any premium spices yet.</p>
          <Button asChild className="rounded-full px-8 bg-primary">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    validateCoupon({ data: { code: couponCode, orderTotal: cart.subtotal } });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-serif font-bold mb-10">Shopping Cart ({cart.itemCount})</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-6">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-6 p-6 bg-card rounded-2xl border border-border/50 shadow-sm relative pr-12">
                <button 
                  onClick={() => remove({ id: item.id })}
                  className="absolute top-6 right-6 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-muted shrink-0">
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex flex-col justify-between py-1 flex-1">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      <Link href={`/products/${item.productId}`}>{item.productName}</Link>
                    </h3>
                    {item.weight && <p className="text-sm text-muted-foreground mt-1">Weight: {item.weight}</p>}
                    <div className="text-lg font-bold text-foreground mt-2">₹{item.price}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center border border-border rounded-lg bg-background p-1 w-fit">
                      <button 
                        onClick={() => updateQty({ id: item.id, data: { quantity: Math.max(1, item.quantity - 1) } })} 
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty({ id: item.id, data: { quantity: item.quantity + 1 } })} 
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-foreground"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-primary ml-auto">₹{item.subtotal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm sticky top-28">
              <h3 className="font-serif text-xl font-bold mb-6">Order Summary</h3>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">₹{cart.subtotal}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{cart.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-end">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{cart.total}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input 
                    placeholder="Coupon code" 
                    value={couponCode} 
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="bg-background rounded-xl"
                  />
                  <Button type="submit" variant="secondary" disabled={validating || !!appliedCoupon || !couponCode} className="rounded-xl">
                    {appliedCoupon ? "Applied" : "Apply"}
                  </Button>
                </form>
              </div>

              <Button 
                onClick={() => setLocation("/checkout")} 
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Secure checkout powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
