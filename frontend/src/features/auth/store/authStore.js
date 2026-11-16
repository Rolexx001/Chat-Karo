import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isLoading: false,
    }),

  setAccessToken: (accessToken) =>
    set((state) => ({
      accessToken,
      isAuthenticated: !!accessToken && !!state.user,
    })),

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user && !!state.accessToken,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
