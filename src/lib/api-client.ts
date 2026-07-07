import { supabase } from './supabase';

// Simple API client for Supabase operations
export const apiClient = {
  // Auth
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  // Products
  getProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  getProduct: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Orders
  createOrder: async (orderData: any) => {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getOrders: async (userId?: string) => {
    let query = supabase.from('orders').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Cart
  getCart: async (userId: string) => {
    const { data, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  addToCart: async (item: any) => {
    const { data, error } = await supabase
      .from('cart')
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCartItem: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('cart')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  removeFromCart: async (id: string) => {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Wishlist
  getWishlist: async (userId: string) => {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  addToWishlist: async (item: any) => {
    const { data, error } = await supabase
      .from('wishlist')
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  removeFromWishlist: async (id: string) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
// Authentication Hooks for Vercel Build Fix
export const useSendOtp = () => {
  return {
    mutate: async (data: { email: string }) => {
      const { error } = await supabase.auth.signInWithOtp({ email: data.email });
      if (error) throw error;
    },
    isLoading: false
  };
};

export const useVerifyOtp = () => {
  return {
    mutate: async (data: { email: string; token: string }) => {
      const { error } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink'
      });
      if (error) throw error;
    },
    isLoading: false
  };
};
// Fetch existing payment credentials for dashboard
export const getPaymentSettings = async () => {
  const { data, error } = await supabase
    .from('payment_settings')
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

// Update keys directly from settings dashboard
export const updatePaymentSettings = async (settings: { razorpay_key: string; stripe_key: string; stripe_secret: string; active_gateway: string }) => {
  const { data, error } = await supabase
    .from('payment_settings')
    .update(settings)
    .eq('id', 1);
  if (error) throw error;
  return data;
};

// Insert new product from dashboard with gallery image url
export const addProduct = async (product: { name: string; price: number; category: string; description: string; image_url: string }) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product]);
  if (error) throw error;
  return data;
};
