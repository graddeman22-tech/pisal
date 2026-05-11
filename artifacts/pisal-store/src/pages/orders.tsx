import { Layout } from "@/components/layout/Layout";
import { apiClient } from "@/lib/api-client";
import { Link } from "wouter";
import { format } from "date-fns";
import { Package, ChevronRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";

export default function Orders() {
  const { user } = useAppStore();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => user ? apiClient.getOrders(user.id) : [],
    enabled: !!user
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold mb-8">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">When you place an order, it will appear here.</p>
            <Link href="/products" className="text-primary font-medium hover:underline">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <div className="bg-card hover:bg-muted/50 transition-colors border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                  
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold bg-muted px-2 py-1 rounded">#{order.id}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <div className="flex gap-4 overflow-hidden mb-4">
                      {order.items.slice(0,4).map((item, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg bg-white border border-border shrink-0 overflow-hidden">
                          <img src={item.productImage} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-2 md:pl-6 md:border-l border-border">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-xl font-bold text-foreground">₹{order.total}</p>
                    </div>
                    <div className="flex items-center text-primary font-medium text-sm group">
                      View Details <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
