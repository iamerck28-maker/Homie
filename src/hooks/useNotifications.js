import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'

export function useNotifications() {
  const { session } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!session) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }, [session])

  useEffect(() => {
    fetchNotifications()

    // Real-time: listen for new notifications for this user
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session?.user?.id}` },
        () => fetchNotifications()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications, session?.user?.id])

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      setUnreadCount(updated.filter((n) => !n.is_read).length)
      return updated
    })
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refetch: fetchNotifications }
}
