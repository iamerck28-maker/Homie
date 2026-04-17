import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Home, Upload, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { fetchBookingFormData, submitBookingRequest, uploadBookingFile } from '../../lib/supabase'
import { formatRupiah } from '../../lib/utils'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function InputText({ ...props }) {
  return (
    <input
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      {...props}
    />
  )
}

function UploadBox({ label, accept, file, onChange, onRemove }) {
  return (
    <div>
      {file ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          <span className="text-sm text-green-700 flex-1 truncate">{file.name}</span>
          <button onClick={onRemove} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
          <Upload size={20} className="text-gray-400" />
          <span className="text-sm text-gray-500">{label}</span>
          <span className="text-xs text-gray-400">JPG, PNG, PDF · Maks 5MB</span>
          <input type="file" accept={accept} className="hidden" onChange={onChange} />
        </label>
      )}
    </div>
  )
}

export default function BookingFormPage() {
  const { code } = useParams()
  const [formData, setFormData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    buyer_name: '',
    buyer_phone: '',
    buyer_address: '',
    unit_id: '',
    payment_method: '',
    transfer_amount: '',
  })
  const [ktpFile, setKtpFile] = useState(null)
  const [transferFile, setTransferFile] = useState(null)

  useEffect(() => {
    let mounted = true
    fetchBookingFormData(code?.toUpperCase()).then((data) => {
      if (!mounted) return
      if (!data?.project) {
        setNotFound(true)
      } else {
        setFormData(data)
      }
      setLoading(false)
    })
    return () => { mounted = false }
  }, [code])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.buyer_name || !form.buyer_phone || !form.buyer_address || !form.unit_id || !form.payment_method) {
      setError('Harap lengkapi semua field yang wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      const timestamp = Date.now()
      const projectId = formData.project.id
      let ktp_url = null
      let transfer_proof_url = null

      if (ktpFile) {
        ktp_url = await uploadBookingFile(ktpFile, `${projectId}/${timestamp}-ktp-${ktpFile.name}`)
      }
      if (transferFile) {
        transfer_proof_url = await uploadBookingFile(transferFile, `${projectId}/${timestamp}-transfer-${transferFile.name}`)
      }

      await submitBookingRequest({
        project_id: projectId,
        unit_id: form.unit_id,
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone,
        buyer_address: form.buyer_address,
        payment_method: form.payment_method,
        ktp_url,
        transfer_proof_url,
        transfer_amount: form.transfer_amount ? parseFloat(form.transfer_amount) : null,
      })

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat formulir...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Formulir Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 text-center">
          Link formulir tidak valid atau proyek sudah tidak aktif.
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-5">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Permintaan Terkirim!</h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Permintaan booking Anda sedang ditinjau oleh tim marketing.
          Kami akan menghubungi Anda melalui WhatsApp <span className="font-medium text-gray-700">{form.buyer_phone}</span> setelah disetujui.
        </p>
      </div>
    )
  }

  const { project, units } = formData
  const selectedUnit = units?.find((u) => u.id === form.unit_id)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <Home size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Formulir Permintaan Booking</p>
            <p className="text-sm font-bold text-gray-900">{project.name}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Info Rekening */}
          {project.bank_name && (
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-primary-700 mb-2 uppercase tracking-wide">Rekening Pembayaran Booking Fee</p>
              <p className="text-sm font-bold text-gray-900">{project.bank_name}</p>
              <p className="text-sm text-gray-700">{project.bank_account_number}</p>
              <p className="text-xs text-gray-500 mt-0.5">a.n. {project.bank_account_name}</p>
              {project.booking_fee_default && (
                <p className="text-xs font-medium text-primary-700 mt-2">
                  Booking fee: {formatRupiah(project.booking_fee_default)}
                </p>
              )}
            </div>
          )}

          {/* Data Diri */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Data Diri</h3>
            <Field label="Nama Lengkap" required>
              <InputText placeholder="Nama sesuai KTP" value={form.buyer_name} onChange={set('buyer_name')} />
            </Field>
            <Field label="Nomor WhatsApp" required>
              <InputText placeholder="08xxxxxxxxxx" type="tel" value={form.buyer_phone} onChange={set('buyer_phone')} />
            </Field>
            <Field label="Alamat Domisili" required>
              <textarea
                rows={2}
                placeholder="Alamat lengkap..."
                value={form.buyer_address}
                onChange={set('buyer_address')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </Field>
            <Field label="Foto KTP">
              <UploadBox
                label="Upload foto KTP"
                accept="image/*,application/pdf"
                file={ktpFile}
                onChange={(e) => setKtpFile(e.target.files[0] || null)}
                onRemove={() => setKtpFile(null)}
              />
            </Field>
          </div>

          {/* Pilih Unit */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Pilih Unit <span className="text-red-500">*</span></h3>
            {!units?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">Tidak ada unit tersedia saat ini.</p>
            ) : (
              <div className="space-y-2">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      form.unit_id === unit.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="unit"
                      value={unit.id}
                      checked={form.unit_id === unit.id}
                      onChange={set('unit_id')}
                      className="accent-primary-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Unit {unit.nomor}{unit.blok ? ` Blok ${unit.blok}` : ''}{unit.cluster ? ` · ${unit.cluster}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {unit.tipe}{unit.luas_tanah ? ` · LT ${unit.luas_tanah}m²` : ''}{unit.luas_bangunan ? ` · LB ${unit.luas_bangunan}m²` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary-700 shrink-0">{formatRupiah(unit.harga)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Metode Pembayaran */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Metode Pembayaran <span className="text-red-500">*</span></h3>
            <div className="space-y-2">
              {[
                { value: 'cash', label: 'Cash Keras', desc: 'Pembayaran lunas sekaligus' },
                { value: 'cash_bertahap', label: 'Cash Bertahap', desc: 'Pembayaran cicilan langsung ke developer' },
                { value: 'kpr', label: 'KPR', desc: 'Kredit Pemilikan Rumah melalui bank' },
              ].map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    form.payment_method === m.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={m.value}
                    checked={form.payment_method === m.value}
                    onChange={set('payment_method')}
                    className="accent-primary-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <Field label="Bukti Transfer Booking Fee">
              <UploadBox
                label="Upload bukti transfer"
                accept="image/*,application/pdf"
                file={transferFile}
                onChange={(e) => setTransferFile(e.target.files[0] || null)}
                onRemove={() => setTransferFile(null)}
              />
            </Field>
            <Field label="Nominal Transfer">
              <InputText
                type="number"
                placeholder="Nominal yang ditransfer"
                value={form.transfer_amount}
                onChange={set('transfer_amount')}
              />
            </Field>
          </div>

          {/* Summary unit terpilih */}
          {selectedUnit && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm">
              <p className="text-gray-500 text-xs mb-1">Unit yang dipilih</p>
              <p className="font-semibold text-gray-900">
                Unit {selectedUnit.nomor}{selectedUnit.blok ? ` Blok ${selectedUnit.blok}` : ''} — {formatRupiah(selectedUnit.harga)}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !units?.length}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            {submitting ? 'Mengirim...' : 'Kirim Permintaan Booking'}
          </button>
        </form>
      </main>

      <footer className="py-5 text-center text-xs text-gray-400">
        {project.location && <p>{project.location}</p>}
        <p className="mt-0.5">© {new Date().getFullYear()} {project.name}</p>
      </footer>
    </div>
  )
}
