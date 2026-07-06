import { supabase } from './supabase';
import { SAMPLE_PRODUCTS } from './sample-products';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

let _supabaseOk: boolean | null = null;

async function isSupabaseAvailable(): Promise<boolean> {
  if (_supabaseOk !== null) return _supabaseOk;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id&limit=1`, {
      signal: ctrl.signal,
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
    });
    clearTimeout(timer);
    _supabaseOk = res.ok || res.status === 401 || res.status === 403;
  } catch {
    _supabaseOk = false;
  }
  return _supabaseOk!;
}

export const apiClient = {
  getCurrentUser: async () => {
    try {
      if (!await isSupabaseAvailable()) return null;
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch { return null; }
  },

  getCategories: async () => {
    try {
      if (!await isSupabaseAvailable()) return [];
      const { data, error } = await supabase.from('categories').select('*');
      if (error || !data) return [];
      return data;
    } catch { return []; }
  },

  getProducts: async (filters?: { category?: string; search?: string }) => {
    try {
      const avail = await isSupabaseAvailable();
      if (!avail) {
        let result = [...SAMPLE_PRODUCTS];
        if (filters?.category && filters.category !== '') {
          result = result.filter(p => p.category_slug === filters.category);
        }
        if (filters?.search) {
          result = result.filter(p => p.name.toLowerCase().includes(filters.search!.toLowerCase()));
        }
        return result;
      }
      let query = supabase.from('products').select('*');
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.category && filters.category !== 'all' && filters.category !== '') {
        query = query.eq('category_slug', filters.category);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) return SAMPLE_PRODUCTS;
      return data;
    } catch { return SAMPLE_PRODUCTS; }
  },

  getProduct: async (id: string) => {
    try {
      if (!await isSupabaseAvailable()) {
        const fallback = SAMPLE_PRODUCTS.find(p => p.id === id);
        if (fallback) return fallback;
        throw new Error('Product not found');
      }
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error || !data) {
        const fallback = SAMPLE_PRODUCTS.find(p => p.id === id);
        if (fallback) return fallback;
        throw new Error('Product not found');
      }
      return data;
    } catch {
      const fallback = SAMPLE_PRODUCTS.find(p => p.id === id);
      if (fallback) return fallback;
      throw new Error('Product not found');
    }
  },

  createOrder: async (orderData: any) => {
    const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
    if (error) throw error;
    return data;
  },

  getOrders: async (userId?: string) => {
    try {
      if (!await isSupabaseAvailable()) return [];
      let query = supabase.from('orders').select('*');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data;
    } catch { return []; }
  },

  getCart: async (userId: string) => {
    try {
      if (!await isSupabaseAvailable()) return [];
      const { data, error } = await supabase.from('cart').select('*, products(*)').eq('user_id', userId);
      if (error || !data) return [];
      return data;
    } catch { return []; }
  },

  addToCart: async (item: any) => {
    const { data, error } = await supabase.from('cart').insert([item]).select().single();
    if (error) throw error;
    return data;
  },

  updateCartItem: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('cart').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  removeFromCart: async (id: string) => {
    const { error } = await supabase.from('cart').delete().eq('id', id);
    if (error) throw error;
  },

  getWishlist: async (userId: string) => {
    try {
      if (!await isSupabaseAvailable()) return [];
      const { data, error } = await supabase.from('wishlist').select('*, products(*)').eq('user_id', userId);
      if (error || !data) return [];
      return data;
    } catch { return []; }
  },

  addToWishlist: async (item: any) => {
    const { data, error } = await supabase.from('wishlist').insert([item]).select().single();
    if (error) throw error;
    return data;
  },

  removeFromWishlist: async (id: string) => {
    const { error } = await supabase.from('wishlist').delete().eq('id', id);
    if (error) throw error;
  },

  validateCoupon: async (code: string) => {
    if (code.toUpperCase() === 'PISAL20') return { valid: true, discountAmount: 50, discountType: 'flat' };
    try {
      if (!await isSupabaseAvailable()) return { valid: false, message: 'Invalid or expired coupon' };
      const { data, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single();
      if (error || !data) return { valid: false, message: 'Invalid or expired coupon' };
      const now = new Date();
      if (data.expires_at && new Date(data.expires_at) < now) return { valid: false, message: 'Coupon has expired' };
      if (data.usage_limit && data.usage_count >= data.usage_limit) return { valid: false, message: 'Coupon usage limit reached' };
      return { valid: true, discountAmount: data.discount_value, discountType: data.discount_type };
    } catch {
      return { valid: false, message: 'Invalid or expired coupon' };
    }
  },

  getUserAddresses: async (userId: string) => {
    try {
      if (!await isSupabaseAvailable()) return [];
      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId);
      if (error || !data) return [];
      return data;
    } catch { return []; }
  },

  saveAddress: async (address: any) => {
    const { data, error } = await supabase.from('addresses').insert([address]).select().single();
    if (error) throw error;
    return data;
  },

  addAddress: async (userId: string, addressData: any) => {
    const payload = { ...addressData, user_id: userId };
    try {
      if (!await isSupabaseAvailable()) {
        const stored = JSON.parse(localStorage.getItem('pisal_addresses') || '[]');
        const newAddr = { ...payload, id: Date.now().toString() };
        stored.push(newAddr);
        localStorage.setItem('pisal_addresses', JSON.stringify(stored));
        return newAddr;
      }
      const { data, error } = await supabase.from('addresses').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch {
      const stored = JSON.parse(localStorage.getItem('pisal_addresses') || '[]');
      const newAddr = { ...payload, id: Date.now().toString() };
      stored.push(newAddr);
      localStorage.setItem('pisal_addresses', JSON.stringify(stored));
      return newAddr;
    }
  },

  getUserProfile: async (userId: string) => {
    try {
      if (!await isSupabaseAvailable()) {
        const profile = JSON.parse(localStorage.getItem(`pisal_profile_${userId}`) || 'null');
        const { data: { user } } = await supabase.auth.getUser();
        return profile || {
          id: userId,
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          totalOrders: 0,
          loyaltyPoints: 0,
          totalSpent: 0,
        };
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) {
        const { data: { user } } = await supabase.auth.getUser();
        return {
          id: userId,
          name: user?.user_metadata?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          totalOrders: 0,
          loyaltyPoints: 0,
          totalSpent: 0,
        };
      }
      return data;
    } catch {
      return null;
    }
  },

  updateUserProfile: async (userId: string, updates: any) => {
    try {
      const payload = updates?.data || updates;
      if (!await isSupabaseAvailable()) {
        const existing = JSON.parse(localStorage.getItem(`pisal_profile_${userId}`) || '{}');
        const updated = { ...existing, ...payload, id: userId };
        localStorage.setItem(`pisal_profile_${userId}`, JSON.stringify(updated));
        return updated;
      }
      const { data, error } = await supabase.from('profiles').upsert({ id: userId, ...payload }).select().single();
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  getCartLocal: (userId: string) => {
    try {
      return JSON.parse(localStorage.getItem(`pisal_cart_${userId}`) || '[]');
    } catch { return []; }
  },

  addToCartLocal: (userId: string, item: any) => {
    try {
      const cart = JSON.parse(localStorage.getItem(`pisal_cart_${userId}`) || '[]');
      const existing = cart.find((c: any) => c.product_id === item.product_id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      } else {
        cart.push({ ...item, id: Date.now().toString(), user_id: userId });
      }
      localStorage.setItem(`pisal_cart_${userId}`, JSON.stringify(cart));
      return cart;
    } catch { return []; }
  },

  removeFromCartLocal: (userId: string, itemId: string) => {
    try {
      const cart = JSON.parse(localStorage.getItem(`pisal_cart_${userId}`) || '[]');
      const updated = cart.filter((c: any) => c.id !== itemId);
      localStorage.setItem(`pisal_cart_${userId}`, JSON.stringify(updated));
      return updated;
    } catch { return []; }
  },

  createOrderWithFallback: async (orderData: any) => {
    try {
      if (!await isSupabaseAvailable()) {
        const order = { ...orderData, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
        const orders = JSON.parse(localStorage.getItem('pisal_orders') || '[]');
        orders.unshift(order);
        localStorage.setItem('pisal_orders', JSON.stringify(orders));
        if (orderData.user_id) {
          localStorage.removeItem(`pisal_cart_${orderData.user_id}`);
        }
        return order;
      }
      const { data, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      return data;
    } catch {
      const order = { ...orderData, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
      const orders = JSON.parse(localStorage.getItem('pisal_orders') || '[]');
      orders.unshift(order);
      localStorage.setItem('pisal_orders', JSON.stringify(orders));
      return order;
    }
  },
};
