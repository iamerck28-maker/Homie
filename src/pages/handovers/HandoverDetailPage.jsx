import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input, { Select, Textarea } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { generateBAST } from '../../lib/bast'

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'in_progress', label: 'Dalam Proses' },
  { value: 'done', label: 'Selesai' },
]

export default function HandoverDetailPage() {
  const { id } = useParams()
  const { role } = useAuthStore()
  const [handover, setHandover] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checklist, setChecklist] = useState([])
  const [defectNotes, setDefectNotes] = useState('')
  const [actualDate, setActualDate] = useState('')
  const [status, setStatus] = useState('scheduled')

  useEffect(() => {
    fetchHandover()
  }, [id])

  const fetchHandover = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('handovers')
      .select(`
        *,
        booking:bookings(
          id, buyer_name, buyer_phone, buyer_email, buyer_nik,
          unit:units(id, nomor, tipe, blok, cluster, luas_bangunan, luas_tanah, harga),
          project:projects(name)
        ),
        unit:units(id, nomor, tipe, blok, cluster, luas_bangunan, luas_tanah, harga)
      `)
      .eq('id', id)
      .single()

    if (data) {
      setHandover(data)
      setChecklist(data.checklist || [])
      setDefectNotes(data.defect_notes || '')
      setActualDate(data.actual_date || '')
      setStatus(data.status || 'scheduled')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('handovers').update({
      checklist,
      defect_notes: defectNotes || null,
      actual_date: actualDate || null,
      status,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    setSaving(false)
    fetchHandover()
  }

  const handleGenerateBAST = async () => {
    const unit = handover.unit || handover.booking?.unit
    generateBAST({ ...handover, unit, checklist, defect_notes: defectNotes })
    await supabase.from('handovers').update({
      bast_generated_at: new Date().toISOString(),
    }).eq('id', id)
    fetchHandover()
  }

  const toggleCheck = (idx) => {
    const updated = [...checklist]
    updated[idx] = { ...updated[idx], checked: !updated[idx].checked }
    setChecklist(updated)
  }

  const updateNote = (idx, notes) => {
    const updated = [...checklist]
    updated[idx] = { ...updated[idx], notes }
    setChecklist(updated)
  }

  if (loading) return <PageWrapper><LoadingSpinner /></PageWrapper>
  if (!handover) return <PageWrapper><p className="text-gray-500">Data tidak ditemukan</p></PageWrapper>

  const unit = handover.unit || handover.booking?.unit
  const checkedCount = checklist.filter((c) => c.checked).length

  return (
    <PageWrapper
      title={`Serah Terima — ${handover.booking?.buyer_name || '-'}`}
      subtitle={`Unit ${unit?.nomor || '-'} · ${handover.booking?.project?.name || '-'}`}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleSave} loading={saving}>
            Simpan
          </Button>
          <Button size="sm" onClick={handleGenerateBAST}>
            <FileText size={14} /> {handover.bast_generated_at ? 'Cetak Ulang BAST' : 'Generate BAST'}
          </Button>
        </div>
      }
    >
      <Link to="/handovers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Kembali
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info & Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Info Serah Terima</h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Pembeli', value: handover.booking?.buyer_name },
                { label: 'No. HP', value: handover.booking?.buyer_phone || '-' },
                { label: 'NIK', value: handover.booking?.buyer_nik || '-' },
                { label: 'Unit', value: `Unit ${unit?.nomor || '-'} · ${unit?.tipe || '-'}` },
                { label: 'Tgl. Rencana', value: formatDate(handover.scheduled_date) },
                { label: 'BAST', value: handover.bast_generated_at ? formatDate(handover.bast_generated_at) : 'Belum' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-500 flex-shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Update Status</h3>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Input label="Tanggal Realisasi" type="date" value={actualDate}
              onChange={(e) => setActualDate(e.target.value)} />
          </div>
        </div>

        {/* Checklist */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Checklist Kondisi Unit</h3>
              <span className="text-sm text-gray-500">
                {checkedCount}/{checklist.length} item
              </span>
            </div>

            {/* Progress */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${checklist.length > 0 ? (checkedCount / checklist.length) * 100 : 0}%` }}
              />
            </div>

            <div className="space-y-3">
              {checklist.map((item, idx) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleCheck(idx)}
                    className={`flex-shrink-0 mt-0.5 transition-colors ${item.checked ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    {item.checked ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.checked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.label}
                    </p>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateNote(idx, e.target.value)}
                      placeholder="Catatan (opsional)"
                      className="mt-1 w-full text-xs text-gray-500 bg-transparent border-0 border-b border-gray-100 focus:border-primary-300 focus:outline-none py-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defect notes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Catatan Defect / Keluhan</h3>
            <Textarea
              value={defectNotes}
              onChange={(e) => setDefectNotes(e.target.value)}
              placeholder="Tuliskan kerusakan atau hal yang perlu diperbaiki sebelum/sesudah serah terima..."
              rows={4}
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
