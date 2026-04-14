import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

export function useProspects(projectId = null) {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { role } = useAuthStore()

  const fetchProspects = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('prospects')
        .select(`
          *,
          assigned_to_profile:profiles!prospects_assigned_to_fkey(id, full_name),
          unit:units(id, nomor, blok, cluster, tipe, harga),
          project:projects(id, name),
          campaign:campaigns(id, name, channel)
        `)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error
      setProspects(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addProspect = async (prospectData) => {
    const { data, error } = await supabase
      .from('prospects')
      .insert([prospectData])
      .select()
      .single()

    if (error) throw error
    await fetchProspects()
    return data
  }

  const updateProspect = async (id, updates) => {
    const { data, error } = await supabase
      .from('prospects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchProspects()
    return data
  }

  const deleteProspect = async (id) => {
    const { error } = await supabase.from('prospects').delete().eq('id', id)
    if (error) throw error
    await fetchProspects()
  }

  const addActivity = async (activityData) => {
    const { data, error } = await supabase
      .from('prospect_activities')
      .insert([activityData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const getActivities = async (prospectId) => {
    const { data, error } = await supabase
      .from('prospect_activities')
      .select('*, created_by_profile:profiles!prospect_activities_created_by_fkey(id, full_name)')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  useEffect(() => {
    let mounted = true
    const safeFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('prospects')
          .select(`
            *,
            assigned_to_profile:profiles!prospects_assigned_to_fkey(id, full_name),
            unit:units(id, nomor, blok, cluster, tipe, harga),
            project:projects(id, name),
            campaign:campaigns(id, name, channel)
          `)
          .order('created_at', { ascending: false })
        if (projectId) query = query.eq('project_id', projectId)
        const { data, error } = await query
        if (!mounted) return
        if (error) throw error
        setProspects(data || [])
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    safeFetch()
    return () => { mounted = false }
  }, [projectId])

  return {
    prospects,
    loading,
    error,
    refetch: fetchProspects,
    addProspect,
    updateProspect,
    deleteProspect,
    addActivity,
    getActivities,
  }
}
