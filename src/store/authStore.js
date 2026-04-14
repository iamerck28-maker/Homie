import { create } from 'zustand'

const useAuthStore = create((set) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({
      profile,
      role: profile?.role ?? null,
    }),
  setLoading: (loading) => set({ loading }),

  clearAuth: () =>
    set({
      session: null,
      user: null,
      profile: null,
      role: null,
      loading: false,
    }),
}))

export default useAuthStore
