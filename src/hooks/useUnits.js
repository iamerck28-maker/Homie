import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useUnits(projectId = null) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUnits = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('units')
        .select('*, projects(name)')
        .order('nomor', { ascending: true })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error
      const sorted = (data || []).sort((a, b) => {
        const tipe = (a.tipe || '').localeCompare(b.tipe || '', undefined, { sensitivity: 'base' })
        if (tipe !== 0) return tipe
        return (a.nomor || '').localeCompare(b.nomor || '', undefined, { numeric: true, sensitivity: 'base' })
      })
      setUnits(sorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addUnit = async (unitData) => {
    const { data, error } = await supabase
      .from('units')
      .insert([unitData])
      .select()
      .single()

    if (error) throw error
    await fetchUnits()
    return data
  }

  const updateUnit = async (id, updates) => {
    const { data, error } = await supabase
      .from('units')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchUnits()
    return data
  }

  const updateUnitStatus = async (id, status, heldBy = null) => {
    const updates = {
      status,
      held_by: status === 'hold' ? heldBy : null,
      held_at: status === 'hold' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    return updateUnit(id, updates)
  }

  useEffect(() => {
    let mounted = true
    const safeFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('units')
          .select('*, projects(name)')
          .order('nomor', { ascending: true })
        if (projectId) query = query.eq('project_id', projectId)
        const { data, error } = await query
        if (!mounted) return
        if (error) throw error
        const sorted = (data || []).sort((a, b) => {
          const tipe = (a.tipe || '').localeCompare(b.tipe || '', undefined, { sensitivity: 'base' })
          if (tipe !== 0) return tipe
          return (a.nomor || '').localeCompare(b.nomor || '', undefined, { numeric: true, sensitivity: 'base' })
        })
        setUnits(sorted)
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    safeFetch()
    return () => { mounted = false }
  }, [projectId])

  const bulkAddUnits = async (unitsData) => {
    const { data, error } = await supabase
      .from('units')
      .insert(unitsData)
      .select()

    if (error) throw error
    await fetchUnits()
    return { success: data.length, failed: 0 }
  }

  return { units, loading, error, refetch: fetchUnits, addUnit, bulkAddUnits, updateUnit, updateUnitStatus }
}
