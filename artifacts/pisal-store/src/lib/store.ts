import { create } from 'zustand';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AppState {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  session: Session | null;
  setSession: (session: Session | null) => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  token: typeof window !== 'undefined' ? localStorage.getItem('pisal_token') : null,
  setToken: (token) => {
    if (token) {
      localStorage.setItem('pisal_token', token);
    } else {
      localStorage.removeItem('pisal_token');
    }
    set({ token });
  },
  user: null,
  setUser: (user) => set({ user }),
  session: null,
  setSession: (session) => set({ session }),
  cartDrawerOpen: false,
  setCartDrawerOpen: (isOpen) => set({ cartDrawerOpen: isOpen }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('pisal_token');
    set({ token: null, user: null, session: null, isAuthModalOpen: false });
  },
}));

// Initialize auth state from Supabase session
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    const store = useAppStore.getState();
    if (session) {
      store.setToken(session.access_token);
      store.setUser(session.user);
      store.setSession(session);
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const store = useAppStore.getState();
    if (session) {
      store.setToken(session.access_token);
      store.setUser(session.user);
      store.setSession(session);
    } else {
      store.setToken(null);
      store.setUser(null);
      store.setSession(null);
    }
  });
}
