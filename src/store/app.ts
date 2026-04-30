import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'user' | 'agent' | 'admin';
export type User = { id: string; name: string; email: string; role: Role; verified: boolean };

type AppState = {
  user: User | null;
  walletBalance: number;
  escrowBalance: number;
  login: (email: string, role: Role, name?: string) => void;
  logout: () => void;
  fundWallet: (amt: number) => void;
  toEscrow: (amt: number) => void;
  releaseEscrow: (amt: number) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      walletBalance: 250_000,
      escrowBalance: 250_000,
      favorites: [],
      login: (email, role, name) =>
        set({
          user: {
            id: 'u_' + Math.random().toString(36).slice(2, 8),
            email,
            role,
            name: name || email.split('@')[0],
            verified: role !== 'agent',
          },
        }),
      logout: () => set({ user: null }),
      fundWallet: (amt) => set((s) => ({ walletBalance: s.walletBalance + amt })),
      toEscrow: (amt) =>
        set((s) => ({ walletBalance: Math.max(0, s.walletBalance - amt), escrowBalance: s.escrowBalance + amt })),
      releaseEscrow: (amt) => set((s) => ({ escrowBalance: Math.max(0, s.escrowBalance - amt) })),
      toggleFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
    }),
    { name: 'homelet-app' },
  ),
);
