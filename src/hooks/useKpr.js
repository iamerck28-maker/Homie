import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useKpr(projectId = null) {
  const [kprList, setKprList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchKpr = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('kpr_tracking')
        .select(`
          *,
          booking:bookings(
            id, buyer_name, buyer_phone, payment_method, booking_date,
            unit:units(id, nomor, blok, cluster, tipe, harga),
            project:projects(id, name)
          )
        `)
        .order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      const filtered = projectId
        ? (data || []).filter((k) => k.booking?.project?.id === projectId)
        : (data || [])
      setKprList(filtered)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addKpr = async (kprData) => {
    const { data, error } = await supabase
      .from('kpr_tracking')
      .insert([kprData])
      .select()
      .single()

    if (error) throw error
    await fetchKpr()
    return data
  }

  const updateKpr = async (id, updates) => {
    const { data, error } = await supabase
      .from('kpr_tracking')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchKpr()
    return data
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('kpr_tracking')
          .select(`
            *,
            booking:bookings(
              id, buyer_name, buyer_phone, payment_method, booking_date,
              unit:units(id, nomor, blok, cluster, tipe, harga),
              project:projects(id, name)
            )
          `)
          .order('created_at', { ascending: false })
        const { data, error } = await query
        if (!mounted) return
        if (error) throw error
        const filtered = projectId
          ? (data || []).filter((k) => k.booking?.project?.id === projectId)
          : (data || [])
        setKprList(filtered)
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [projectId])

  return { kprList, loading, error, refetch: fetchKpr, addKpr, updateKpr }
}
