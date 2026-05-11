import { supabase } from './supabase';
import { SAMPLE_PRODUCTS } from './sample-products';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://aafgptxzavrpraehaexa.supabase.co';

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
};
