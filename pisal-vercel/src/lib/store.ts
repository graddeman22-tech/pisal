import { create } from 'zustand';

interface AppState {
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
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
  cartDrawerOpen: false,
  setCartDrawerOpen: (isOpen) => set({ cartDrawerOpen: isOpen }),
}));
