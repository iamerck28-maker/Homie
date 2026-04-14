import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePayments(bookingId = null) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPayments = async () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, created_by_profile:profiles!payments_created_by_fkey(full_name)')
        .eq('booking_id', bookingId)
        .order('payment_date', { ascending: true })
      if (error) throw error
      setPayments(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addPayment = async (paymentData) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([{ ...paymentData, booking_id: bookingId }])
      .select()
      .single()
    if (error) throw error
    await fetchPayments()
    return data
  }

  const deletePayment = async (id) => {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) throw error
    await fetchPayments()
  }

  useEffect(() => {
    let mounted = true
    if (!bookingId) return
    setLoading(true)
    supabase
      .from('payments')
      .select('*, created_by_profile:profiles!payments_created_by_fkey(full_name)')
      .eq('booking_id', bookingId)
      .order('payment_date', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) setError(error.message)
        else setPayments(data || [])
        setLoading(false)
      })
    return () => { mounted = false }
  }, [bookingId])

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)

  return { payments, loading, error, totalPaid, addPayment, deletePayment, refetch: fetchPayments }
}
