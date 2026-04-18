import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import { PageLoader } from './ui/LoadingSpinner'

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

async function fetchCompanies(companyIds) {
  if (!companyIds?.length) return []
  const { data } = await supabase
    .from('companies')
    .select('*')
    .in('id', companyIds)
    .order('name')
  return data ?? []
}

async function fetchProjects(profile) {
  if (profile.role === 'owner') {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('owner_id', profile.id)
      .order('name')
    return data ?? []
  }

  // Manager/Marketing: proyek dari project_ids ATAU yang manager_id-nya adalah user ini
  const conditions = []
  if (profile.project_ids?.length) {
    conditions.push(`id.in.(${profile.project_ids.join(',')})`)
  }
  if (profile.role === 'manager') {
    conditions.push(`manager_id.eq.${profile.id}`)
  }
  if (!conditions.length) return []

  const { data } = await supabase
    .from('projects')
    .select('id, name')
    .or(conditions.join(','))
    .order('name')
  return data ?? []
}

export default function AuthProvider({ children }) {
  const safetyTimeoutRef = useRef(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    const { setSession, setUser, setProfile, setLoading, setCompanies, setActiveCompany, clearAuth } =
      useAuthStore.getState()

    safetyTimeoutRef.current = setTimeout(() => setLoading(false), 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearAuth()
        return
      }

      setSession(session)
      setUser(session.user)

      const fetchId = ++fetchIdRef.current
      ;(async () => {
        try {
          const profile = await fetchProfile(session.user.id)
          if (fetchId !== fetchIdRef.current) return
          if (!profile) return

          setProfile(profile)

          // Fetch companies milik user
          const companies = await fetchCompanies(profile.company_ids)
          if (fetchId !== fetchIdRef.current) return
          setCompanies(companies)

          const { activeCompany } = useAuthStore.getState()
          const stillValid = activeCompany && companies.some((c) => c.id === activeCompany.id)
          if (!stillValid) {
            setActiveCompany(companies.length === 1 ? companies[0] : null)
          }

          // Fetch projects milik user
          const { setProjects, setActiveProject, activeProject } = useAuthStore.getState()
          const projects = await fetchProjects(profile)
          if (fetchId !== fetchIdRef.current) return
          setProjects(projects)

          // Auto-select: pertahankan jika masih valid, atau pilih otomatis jika hanya 1
          const projectStillValid = activeProject && projects.some((p) => p.id === activeProject.id)
          if (!projectStillValid) {
            setActiveProject(projects.length === 1 ? projects[0] : null)
          }
        } catch {
          // silent
        } finally {
          if (fetchId === fetchIdRef.current) setLoading(false)
        }
      })()
    })

    return () => {
      clearTimeout(safetyTimeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  const loading = useAuthStore((s) => s.loading)
  if (loading) return <PageLoader />
  return children
}
