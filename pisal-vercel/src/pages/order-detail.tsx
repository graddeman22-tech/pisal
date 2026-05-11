import { Layout } from "@/components/layout/Layout";
import { useGetOrder } from "@/lib/api-client";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, Phone, MessageCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

function getStatusIndex(status: string) {
  return STATUS_STEPS.indexOf(status);
}

export default function OrderDetail() {
  const { token } = useAppStore();
  const [, params] = useRoute("/orders/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: !!token && !!id } });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="h-96 bg-card rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  const statusIndex = getStatusIndex(order.status);

  const getPaymentLabel = (m: string) => {
    const map: Record<string, string> = { razorpay: "Razorpay", upi: "UPI", card: "Card", cod: "Cash on Delivery" };
    return map[m] || m;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-1">Order #{order.id}</h1>
            <p className="text-muted-foreground text-sm">Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' h:mm a")}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide ${
            order.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : order.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            {order.status}
          </span>
        </div>

        {/* Order Tracking */}
        {order.status !== "cancelled" && (
          <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-6 flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Order Tracking</h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border" />
              <div className="absolute top-5 left-[10%] h-0.5 bg-primary transition-all" style={{ width: `${Math.max(0, statusIndex) * 33.33}%` }} />
              {STATUS_STEPS.map((step, i) => {
                const icons = [CheckCircle, Package, Truck, CheckCircle];
                const Icon = icons[i];
                const isCompleted = i <= statusIndex;
                const labels = ["Confirmed", "Processing", "Shipped", "Delivered"];
                return (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? "bg-primary border-primary text-white" : "bg-card border-border text-muted-foreground"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-xs mt-2 font-medium ${isCompleted ? "text-primary" : "text-muted-foreground"}`}>{labels[i]}</p>
                  </div>
                );
              })}
            </div>
            {order.estimatedDelivery && order.status !== "delivered" && (
              <p className="text-sm text-center text-muted-foreground mt-6">
                <Clock className="w-4 h-4 inline mr-1" /> Estimated delivery: <span className="font-medium text-foreground">{order.estimatedDelivery}</span>
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold mb-4">Order Items ({order.items.length})</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="w-16 h-16 rounded-xl bg-white border border-border overflow-hidden flex-shrink-0">
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      {item.weight && <p className="text-sm text-muted-foreground">{item.weight}</p>}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold">₹{item.subtotal.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{order.subtotal.toFixed(0)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount.toFixed(0)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : "Free"}</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span>Total</span><span className="text-primary">₹{order.total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Payment</h2>
              <p className="text-sm"><span className="text-muted-foreground">Method:</span> {getPaymentLabel(order.paymentMethod)}</p>
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className={order.paymentStatus === "paid" ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </p>
            </div>

            {/* Delivery Address */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Delivery Address</h2>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.address.name}</p>
                <p className="text-muted-foreground">{order.address.phone}</p>
                <p className="text-muted-foreground">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                <p className="text-muted-foreground">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
