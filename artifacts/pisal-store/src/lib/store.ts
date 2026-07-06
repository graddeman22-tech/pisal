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
  authInitialized: boolean;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  token: null,
  setToken: (token) => set({ token }),
  user: null,
  setUser: (user) => set({ user }),
  session: null,
  setSession: (session) => set({ session }),
  cartDrawerOpen: false,
  setCartDrawerOpen: (isOpen) => set({ cartDrawerOpen: isOpen }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  authInitialized: false,
  logout: async () => {
    await supabase.auth.signOut();
    set({ token: null, user: null, session: null, isAuthModalOpen: false });
  },
}));

// Auto-sync Supabase session with store — handles page refresh, tab switch etc.
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    const store = useAppStore.getState();
    if (session) {
      store.setToken(session.access_token);
      store.setUser(session.user);
      store.setSession(session);
    }
    useAppStore.setState({ authInitialized: true });
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
    useAppStore.setState({ authInitialized: true });
  });
}
