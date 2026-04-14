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
          ),
          kpr_documents(*)
        `)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('booking.project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error
      setKprList(data || [])
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

  const updateDocument = async (docId, updates) => {
    const { data, error } = await supabase
      .from('kpr_documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', docId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const addDocument = async (docData) => {
    const { data, error } = await supabase
      .from('kpr_documents')
      .insert([docData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  useEffect(() => {
    fetchKpr()
  }, [projectId])

  return { kprList, loading, error, refetch: fetchKpr, addKpr, updateKpr, updateDocument, addDocument }
}
