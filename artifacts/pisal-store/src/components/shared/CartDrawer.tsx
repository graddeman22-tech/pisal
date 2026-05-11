import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  X, Plus, Minus, Trash2, ShoppingBag, Tag, Truck, ArrowRight,
  CheckCircle2, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FREE_DELIVERY_THRESHOLD = 499;

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen, user, setAuthModalOpen } = useAppStore();
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: () => user ? apiClient.getCart(user.id) : [],
    enabled: !!user,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);
  const [validating, setValidating] = useState(false);

  const { mutate: updateQty } = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => apiClient.updateCartItem(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const { mutate: removeItem } = useMutation({
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
        toast({ title: "Coupon Applied!", description: `You saved ₹${result.discountAmount}` });
      } else {
        toast({ title: "Invalid Coupon", description: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not apply coupon", variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  const handleDecrement = (id: string, qty: number) => {
    if (qty <= 1) {
      removeItem(id);
    } else {
      updateQty({ id, quantity: qty - 1 });
    }
  };

  const items = Array.isArray(cartItems) ? cartItems : [];
  const subtotal = items.reduce((sum: number, item: any) => {
    const price = item.price ?? item.products?.price ?? 0;
    return sum + price * (item.quantity ?? 1);
  }, 0);
  const couponDiscount = appliedCoupon?.amount ?? 0;
  const payable = Math.max(0, subtotal - couponDiscount);
  const freeDelivery = payable >= FREE_DELIVERY_THRESHOLD;

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/55 z-[80] backdrop-blur-sm"
            onClick={() => setCartDrawerOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-background z-[90] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base leading-tight">My Cart</h2>
                  <p className="text-xs text-muted-foreground">
                    {items.length === 0 ? "No items" : `${items.length} item${items.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-foreground/70" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* Not logged in */}
              {!user && (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Login to view cart</h3>
                  <p className="text-muted-foreground text-sm">Your cart is waiting for you!</p>
                  <Button onClick={() => { setCartDrawerOpen(false); setAuthModalOpen(true); }} className="bg-primary rounded-full px-8 mt-2">
                    Login / Sign Up
                  </Button>
                </div>
              )}

              {/* Loading */}
              {user && isLoading && (
                <div className="flex flex-col gap-4 p-5">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-3 p-4 bg-card rounded-xl border border-border animate-pulse">
                      <div className="w-20 h-20 bg-muted rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-6 bg-muted rounded w-1/3 mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty */}
              {user && !isLoading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-xl">Your cart is empty</h3>
                  <p className="text-muted-foreground text-sm">Add some premium spices to get started!</p>
                  <Button onClick={() => { setCartDrawerOpen(false); setLocation("/products"); }} className="bg-primary rounded-full px-8 mt-2">
                    Shop Now
                  </Button>
                </div>
              )}

              {/* Items */}
              {user && !isLoading && items.length > 0 && (
                <div className="p-4 space-y-3">
                  {/* Free delivery banner */}
                  <div className={`rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium ${freeDelivery ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    <Truck className="w-4 h-4 shrink-0" />
                    {freeDelivery
                      ? "You've unlocked FREE Delivery!"
                      : `Add ₹${(FREE_DELIVERY_THRESHOLD - payable).toFixed(0)} more for FREE Delivery`}
                  </div>

                  {/* Cart items */}
                  <AnimatePresence>
                    {items.map((item: any) => {
                      const product = item.products || {};
                      const name = item.product_name || product.name || "Product";
                      const img = item.product_image || product.image_url || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80";
                      const price = item.price ?? product.price ?? 0;
                      const qty = item.quantity ?? 1;

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                          className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm"
                        >
                          <div className="flex gap-3">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                              <img
                                src={img}
                                alt={name}
                                className="w-full h-full object-cover"
                                onError={e => (e.currentTarget.src = "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80")}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2 flex-1">{name}</p>
                                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="font-bold text-foreground text-sm">₹{(price * qty).toFixed(0)}</span>
                                <span className="text-xs text-muted-foreground">₹{price} each</span>
                              </div>
                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                                  <button
                                    onClick={() => handleDecrement(item.id, qty)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold text-foreground">{qty}</span>
                                  <button
                                    onClick={() => updateQty({ id: item.id, quantity: qty + 1 })}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="font-bold text-primary text-sm">₹{(price * qty).toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Coupon */}
                  <div className="bg-card border border-border/60 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-primary" />
                      <p className="font-semibold text-sm">Promo Code</p>
                    </div>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">{appliedCoupon.code}</span>
                          <span className="text-xs text-green-600">-₹{appliedCoupon.amount}</span>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          className="bg-background rounded-xl text-sm h-10 uppercase placeholder:normal-case"
                        />
                        <Button type="submit" disabled={validating || !couponCode.trim()} variant="outline" className="rounded-xl h-10 px-4 border-primary text-primary hover:bg-primary hover:text-white text-sm shrink-0">
                          {validating ? "..." : "Apply"}
                        </Button>
                      </form>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Try: <span className="font-mono font-semibold text-primary">PISAL20</span></p>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                    <p className="font-bold text-sm text-foreground">Price Breakdown</p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal ({items.length} items)</span>
                        <span className="font-medium text-foreground">₹{subtotal.toFixed(0)}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Coupon ({appliedCoupon?.code})</span>
                          <span className="font-semibold">-₹{couponDiscount.toFixed(0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span className={freeDelivery ? "text-green-600 font-semibold" : ""}>{freeDelivery ? "FREE" : "₹49"}</span>
                      </div>
                      <div className="border-t border-border pt-2.5 flex justify-between items-center">
                        <span className="font-bold text-foreground">Total Payable</span>
                        <span className="text-xl font-black text-primary">₹{(payable + (freeDelivery ? 0 : 49)).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {user && !isLoading && items.length > 0 && (
              <div className="shrink-0 border-t border-border bg-card px-4 py-4 space-y-2.5">
                <Button
                  onClick={() => { setCartDrawerOpen(false); setLocation("/checkout"); }}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg flex items-center justify-between px-5"
                >
                  <span>Checkout</span>
                  <div className="flex items-center gap-1">
                    <span>₹{(payable + (freeDelivery ? 0 : 49)).toFixed(0)}</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Button>
                <button
                  onClick={() => { setCartDrawerOpen(false); setLocation("/cart"); }}
                  className="w-full text-center text-sm text-primary font-medium hover:underline py-1"
                >
                  View Full Cart
                </button>
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> 100% Secure Checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
