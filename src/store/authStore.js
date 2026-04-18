import { create } from 'zustand'

const ACTIVE_COMPANY_KEY = 'homie_active_company'
const ACTIVE_PROJECT_KEY = 'homie_active_project'

function loadActiveCompany() {
  try {
    const raw = localStorage.getItem(ACTIVE_COMPANY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadActiveProject() {
  try {
    const raw = localStorage.getItem(ACTIVE_PROJECT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const useAuthStore = create((set) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,

  companies: [],
  activeCompany: loadActiveCompany(),

  projects: [],
  activeProject: loadActiveProject(),

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({
      profile,
      role: profile?.role ?? null,
    }),
  setLoading: (loading) => set({ loading }),

  setCompanies: (companies) => set({ companies }),

  setActiveCompany: (company) => {
    try {
      if (company) localStorage.setItem(ACTIVE_COMPANY_KEY, JSON.stringify(company))
      else localStorage.removeItem(ACTIVE_COMPANY_KEY)
    } catch {}
    set({ activeCompany: company })
  },

  setProjects: (projects) => set({ projects }),

  setActiveProject: (project) => {
    try {
      if (project) localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project))
      else localStorage.removeItem(ACTIVE_PROJECT_KEY)
    } catch {}
    set({ activeProject: project })
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(ACTIVE_COMPANY_KEY)
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    } catch {}
    set({
      session: null,
      user: null,
      profile: null,
      role: null,
      loading: false,
      companies: [],
      activeCompany: null,
      projects: [],
      activeProject: null,
    })
  },
}))

export default useAuthStore
