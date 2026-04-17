import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const autoInsertingSet = new Set()

const TEMPLATES = {
  kpr: [
    'Tanda Tangan PPJB',
    'Pengajuan KPR ke Bank',
    'Penerbitan SP3K',
    'Penerbitan SPR',
    'Akad Kredit',
    'Serah Terima',
  ],
  cash: [
    'Tanda Tangan PPJB',
    'Pembayaran Pelunasan',
    'Penerbitan SPR',
    'Serah Terima',
  ],
  cash_bertahap: [
    'Tanda Tangan PPJB',
    'Pembayaran DP Pertama',
    'Pelunasan Cicilan',
    'Penerbitan SPR',
    'Serah Terima',
  ],
}

const getTemplate = (method) => TEMPLATES[method] || TEMPLATES.cash

export function usePascaclosingChecklist(bookingId, paymentMethod) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    if (!bookingId || !paymentMethod) return
    const { data } = await supabase
      .from('pascaclosing_items')
      .select('*')
      .eq('booking_id', bookingId)
      .order('sort_order')
      .order('created_at')
    if (data && data.length === 0) {
      if (autoInsertingSet.has(bookingId)) {
        setLoading(false)
        return
      }
      autoInsertingSet.add(bookingId)
      try {
        const rows = getTemplate(paymentMethod).map((name, i) => ({
          booking_id: bookingId,
          item_name: name,
          sort_order: i,
        }))
        const { data: inserted } = await supabase.from('pascaclosing_items').insert(rows).select()
        setItems(inserted || [])
      } finally {
        autoInsertingSet.delete(bookingId)
      }
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!bookingId || !paymentMethod) return
    setLoading(true)
    fetch()
  }, [bookingId, paymentMethod])

  const addItem = async (itemName, profileId) => {
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0
    const { data, error } = await supabase
      .from('pascaclosing_items')
      .insert([{ booking_id: bookingId, item_name: itemName, sort_order: maxOrder, created_by: profileId }])
      .select()
      .single()
    if (error) throw error
    setItems((prev) => [...prev, data])
  }

  const addFromTemplate = async (profileId, method) => {
    const template = getTemplate(method || paymentMethod)
    const rows = template.map((name, i) => ({
      booking_id: bookingId,
      item_name: name,
      sort_order: i,
      created_by: profileId,
    }))
    const { data, error } = await supabase.from('pascaclosing_items').insert(rows).select()
    if (error) throw error
    setItems(data || [])
  }

  const toggleItem = async (id, currentValue) => {
    const updates = {
      is_complete: !currentValue,
      completed_at: !currentValue ? new Date().toISOString() : null,
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    await supabase.from('pascaclosing_items').update(updates).eq('id', id)
  }

  const deleteItem = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await supabase.from('pascaclosing_items').delete().eq('id', id)
  }

  const completedCount = items.filter((i) => i.is_complete).length

  return { items, loading, addItem, addFromTemplate, toggleItem, deleteItem, completedCount, getTemplate }
}
