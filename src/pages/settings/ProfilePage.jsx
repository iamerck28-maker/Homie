import { useState } from 'react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { getInitials } from '../../lib/utils'

export default function ProfilePage() {
  const { profile, setProfile } = useAuthStore()
  const [name, setName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Nama tidak boleh kosong'); return }
    setSaving(true)
    setError('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim(), updated_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (error) throw error
      setProfile({ ...profile, full_name: name.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword.length < 6) { setPwError('Password minimal 6 karakter'); return }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Password tidak cocok'); return }
    setPwLoading(true)
    setPwError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword })
      if (error) throw error
      setPwForm({ newPassword: '', confirm: '' })
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2000)
    } catch (err) {
      setPwError(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const roleLabel = { owner: 'Owner', manager: 'Manager Marketing', marketing: 'Marketing' }

  return (
    <PageWrapper title="Profil Saya" subtitle="Kelola informasi akun Anda">
      <div className="max-w-lg space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{getInitials(profile?.full_name)}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">{profile?.full_name}</p>
              <p className="text-sm text-gray-500">{roleLabel[profile?.role]}</p>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="space-y-4">
            <Input
              label="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={error}
            />
            <Button type="submit" loading={saving} size="sm">
              {saved ? '✓ Tersimpan' : 'Simpan Nama'}
            </Button>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ganti Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{pwError}</div>}
            <Input
              label="Password Baru"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Minimal 6 karakter"
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            />
            <Button type="submit" loading={pwLoading} size="sm" variant="secondary">
              {pwSaved ? '✓ Password Diperbarui' : 'Ganti Password'}
            </Button>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
