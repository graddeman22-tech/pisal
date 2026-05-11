import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useGetCart, useUpdateCartItem, useRemoveFromCart, useValidateCoupon } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  X, Plus, Minus, Trash2, ShoppingBag, Tag, Truck, ArrowRight,
  Sparkles, CheckCircle2, Gift, ChevronRight, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FREE_DELIVERY_THRESHOLD = 500;

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen, token, setAuthModalOpen } = useAppStore();
  const { data: cart, isLoading } = useGetCart({ query: { enabled: !!token } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);

  const { mutate: updateQty } = useUpdateCartItem({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }) },
  });
  const { mutate: remove } = useRemoveFromCart({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }) },
  });
  const { mutate: validateCoupon, isPending: validating } = useValidateCoupon({
    mutation: {
      onSuccess: (data) => {
        if (data.valid) {
          setAppliedCoupon({ code: couponCode.toUpperCase(), amount: data.discountAmount ?? 0 });
          toast({ title: "🎉 Coupon Applied!", description: `You saved ₹${data.discountAmount}` });
        } else {
          toast({ title: "Invalid Coupon", description: data.message, variant: "destructive" });
        }
      },
      onError: () => toast({ title: "Error", description: "Could not apply coupon", variant: "destructive" }),
    },
  });

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    validateCoupon({ data: { code: couponCode, orderTotal: cart?.subtotal ?? 0 } });
  };

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    setLocation("/checkout");
  };

  const handleDecrement = (id: number, qty: number) => {
    if (qty <= 1) {
      remove({ id });
    } else {
      updateQty({ id, data: { quantity: qty - 1 } });
    }
  };

  const items = cart?.items ?? [];
  const mrp = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productDiscount = items.reduce((sum, item) => {
    const disc = item.price * item.quantity - (item.subtotal ?? item.price * item.quantity);
    return sum + Math.max(0, disc);
  }, 0);
  const couponDiscount = appliedCoupon?.amount ?? 0;
  const totalDiscount = productDiscount + couponDiscount;
  const payable = Math.max(0, (cart?.subtotal ?? mrp) - couponDiscount);
  const freeDelivery = payable >= FREE_DELIVERY_THRESHOLD;

  const bestDiscount = items.reduce(
    (best, item) => {
      const saved = item.price * item.quantity - (item.subtotal ?? item.price * item.quantity);
      return saved > best.saved ? { name: item.productName, saved } : best;
    },
    { name: "", saved: 0 }
  );

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
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base leading-tight">My Cart</h2>
                  <p className="text-xs text-muted-foreground">
                    {items.length === 0 ? "No items" : `${cart?.itemCount ?? 0} item${(cart?.itemCount ?? 0) > 1 ? "s" : ""}`}
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

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Not logged in */}
              {!token && (
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
              {token && isLoading && (
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
              {token && !isLoading && items.length === 0 && (
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
              {token && !isLoading && items.length > 0 && (
                <div className="p-4 space-y-3">

                  {/* Free delivery banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-sm font-medium ${freeDelivery ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200/60 dark:border-green-800/40" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"}`}
                  >
                    <Truck className="w-4 h-4 shrink-0" />
                    {freeDelivery
                      ? "🎉 You've unlocked FREE Delivery!"
                      : `Add ₹${(FREE_DELIVERY_THRESHOLD - payable).toFixed(0)} more for FREE Delivery`}
                  </motion.div>

                  {/* Best discount highlight */}
                  {bestDiscount.saved > 0 && (
                    <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-foreground/80">
                        Best deal: <span className="font-semibold text-primary">{bestDiscount.name}</span> — saves you <span className="font-bold text-primary">₹{bestDiscount.saved.toFixed(0)}</span>
                      </span>
                    </div>
                  )}

                  {/* Product cards */}
                  <AnimatePresence>
                    {items.map((item) => {
                      const itemMrp = item.price * item.quantity;
                      const itemFinal = item.subtotal ?? itemMrp;
                      const itemSaved = itemMrp - itemFinal;
                      const discPct = itemMrp > 0 ? Math.round((itemSaved / itemMrp) * 100) : 0;

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
                            {/* Image */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2 flex-1">{item.productName}</p>
                                <button onClick={() => remove({ id: item.id })} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {item.weight && <p className="text-xs text-muted-foreground mt-0.5">{item.weight}</p>}

                              {/* Price row */}
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="font-bold text-foreground text-sm">₹{itemFinal.toFixed(0)}</span>
                                {itemSaved > 0 && (
                                  <>
                                    <span className="text-xs text-muted-foreground line-through">₹{itemMrp.toFixed(0)}</span>
                                    <span className="text-xs font-bold text-green-600">{discPct}% off</span>
                                  </>
                                )}
                              </div>

                              {/* Quantity + subtotal */}
                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
                                  <button
                                    onClick={() => handleDecrement(item.id, item.quantity)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQty({ id: item.id, data: { quantity: item.quantity + 1 } })}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Subtotal</p>
                                  <p className="font-bold text-primary text-sm">₹{itemFinal.toFixed(0)}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Savings tag */}
                          {itemSaved > 0 && (
                            <div className="mt-2.5 flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-1.5">
                              <Gift className="w-3.5 h-3.5 text-green-600 shrink-0" />
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                                You save ₹{itemSaved.toFixed(0)} on this item!
                              </p>
                            </div>
                          )}
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
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200/60 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
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
                        <span>Total MRP ({cart?.itemCount} items)</span>
                        <span className="font-medium text-foreground">₹{mrp.toFixed(0)}</span>
                      </div>
                      {productDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Product Discount</span>
                          <span className="font-semibold">-₹{productDiscount.toFixed(0)}</span>
                        </div>
                      )}
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Coupon ({appliedCoupon?.code})</span>
                          <span className="font-semibold">-₹{couponDiscount.toFixed(0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span className={freeDelivery ? "text-green-600 font-semibold" : ""}>{freeDelivery ? "FREE" : "Calculated at checkout"}</span>
                      </div>
                      <div className="border-t border-border pt-2.5 flex justify-between items-center">
                        <span className="font-bold text-foreground">Total Payable</span>
                        <span className="text-xl font-black text-primary">₹{payable.toFixed(0)}</span>
                      </div>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
                        <p className="text-sm font-bold text-green-700 dark:text-green-400">
                          🎉 You're saving ₹{totalDiscount.toFixed(0)} on this order!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* ── Sticky Footer ── */}
            {token && !isLoading && items.length > 0 && (
              <div className="shrink-0 border-t border-border bg-card px-4 py-4 space-y-2.5">
                <Button
                  onClick={handleCheckout}
                  className="w-full h-13 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/25 flex items-center justify-between px-5"
                >
                  <span>Proceed to Checkout</span>
                  <div className="flex items-center gap-1">
                    <span>₹{payable.toFixed(0)}</span>
                    <ChevronRight className="w-5 h-5" />
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
