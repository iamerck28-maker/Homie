import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBookings(projectId = null) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          unit:units(id, nomor, blok, cluster, tipe, harga),
          project:projects(id, name),
          prospect:prospects(id, full_name),
          created_by_profile:profiles!bookings_created_by_fkey(id, full_name)
        `)
        .is('cancelled_at', null)
        .order('created_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query
      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addBooking = async (bookingData) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (error) throw error
    await fetchBookings()
    return data
  }

  const updateBooking = async (id, updates) => {
    const { data, error } = await supabase
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    await fetchBookings()
    return data
  }

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('bookings')
          .select(`
            *,
            unit:units(id, nomor, blok, cluster, tipe, harga),
            project:projects(id, name),
            prospect:prospects(id, full_name),
            created_by_profile:profiles!bookings_created_by_fkey(id, full_name)
          `)
          .is('cancelled_at', null)
          .order('created_at', { ascending: false })
        if (projectId) query = query.eq('project_id', projectId)
        const { data, error } = await query
        if (!mounted) return
        if (error) throw error
        setBookings(data || [])
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [projectId])

  return { bookings, loading, error, refetch: fetchBookings, addBooking, updateBooking }
}
