import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { user } = useAppStore();
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => user ? apiClient.getCart(user.id) : [],
    enabled: !!user
  });
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => user ? apiClient.getUserAddresses?.(user.id) : [],
    enabled: !!user
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "upi" | "cod">("upi");

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: (data: any) => apiClient.createOrder(data),
    onSuccess: (order) => {
      toast({ title: "Order Placed Successfully!", description: `Order ID: #${order.id}` });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setLocation(`/orders/${order.id}`);
    },
    onError: () => toast({ title: "Error", description: "Failed to place order", variant: "destructive" })
  });

  const cartArray = Array.isArray(cart) ? cart : [];
  const cartSubtotal = cartArray.reduce((sum: number, item: any) => {
    const price = item.price ?? item.products?.price ?? 0;
    return sum + price * (item.quantity ?? 1);
  }, 0);

  if (!user) {
    setLocation("/");
    return null;
  }

  if (!cart || cartArray.length === 0) {
    setLocation("/cart");
    return null;
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) return toast({ title: "Select Address", variant: "destructive" });
    createOrder({
      user_id: user?.id,
      address_id: selectedAddress,
      payment_method: paymentMethod,
      total: cartSubtotal,
      status: 'pending',
      items: cartArray.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price ?? item.products?.price ?? 0,
      })),
    });
  };

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif font-bold">Secure Checkout</h1>
          <div className="flex items-center justify-center gap-4 mt-6 text-sm font-medium">
            <span className={step >= 1 ? "text-primary flex items-center" : "text-muted-foreground"}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Address
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className={step >= 2 ? "text-primary flex items-center" : "text-muted-foreground"}>
              <CreditCard className="w-4 h-4 mr-1" /> Payment
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        <div className="lg:w-2/3">
          {step === 1 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" /> Delivery Address</h2>
              
              {addresses && addresses.length > 0 ? (
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="space-y-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedAddress === addr.id.toString() ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <div className="flex items-start">
                        <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-1" />
                        <div className="ml-3 flex-1">
                          <Label htmlFor={`addr-${addr.id}`} className="text-base font-bold cursor-pointer">{addr.name}</Label>
                          <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {addr.line1}, {addr.line2 && <>{addr.line2}, </>}<br/>
                            {addr.city}, {addr.state} - {addr.pincode}<br/>
                            Phone: {addr.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-center py-8 bg-muted rounded-xl">No saved addresses found. Please add one in profile.</div>
              )}

              <Button 
                onClick={() => setStep(2)} 
                disabled={!selectedAddress} 
                className="mt-8 w-full md:w-auto px-8 h-12 rounded-xl bg-primary text-white"
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center"><CreditCard className="w-5 h-5 mr-2 text-primary" /> Payment Method</h2>
              
              <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="space-y-4">
                <div className={`p-4 border rounded-xl cursor-pointer ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center">
                    <RadioGroupItem value="upi" id="pm-upi" />
                    <Label htmlFor="pm-upi" className="ml-3 text-base font-bold cursor-pointer flex-1">UPI / QR Code</Label>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-6" alt="UPI" />
                  </div>
                </div>
                <div className={`p-4 border rounded-xl cursor-pointer ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center">
                    <RadioGroupItem value="razorpay" id="pm-razorpay" />
                    <Label htmlFor="pm-razorpay" className="ml-3 text-base font-bold cursor-pointer flex-1">Credit / Debit Card (Razorpay)</Label>
                  </div>
                </div>
                <div className={`p-4 border rounded-xl cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center">
                    <RadioGroupItem value="cod" id="pm-cod" />
                    <Label htmlFor="pm-cod" className="ml-3 text-base font-bold cursor-pointer flex-1">Cash on Delivery (COD)</Label>
                  </div>
                </div>
              </RadioGroup>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(1)} className="h-12 rounded-xl">Back</Button>
                <Button onClick={handlePlaceOrder} disabled={isPending} className="flex-1 h-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 text-lg">
                  {isPending ? "Processing..." : `Pay ₹${cartSubtotal}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-1/3">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-28">
            <h3 className="font-serif text-lg font-bold mb-4">Order Summary</h3>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cartArray.map((item: any) => {
                const prod = item.products || {};
                const name = item.product_name || prod.name || "Product";
                const img = item.product_image || prod.image_url || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=80";
                const price = item.price ?? prod.price ?? 0;
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded border bg-muted shrink-0 overflow-hidden"><img src={img} alt={name} className="w-full h-full object-cover"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-bold">₹{(price * (item.quantity ?? 1)).toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{cartSubtotal.toFixed(0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium text-green-600">Free</span></div>
              <div className="border-t border-border pt-3 mt-3 flex justify-between items-end">
                <span className="text-base font-bold">Total to Pay</span>
                <span className="text-2xl font-bold text-primary">₹{cartSubtotal.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
