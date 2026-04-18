import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, FileSpreadsheet, Image, AlertCircle, CheckCircle2,
  Download, Trash2, Plus, X
} from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatRupiah } from '../../lib/utils'

const TEMPLATE_HEADERS = ['cluster', 'blok', 'nomor', 'tipe', 'luas_tanah', 'luas_bangunan', 'harga', 'notes']

const EMPTY_ROW = { cluster: '', blok: '', nomor: '', tipe: '', luas_tanah: '', luas_bangunan: '', harga: '', notes: '' }

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ['Mawar', 'A', '01', 'Type 36/72', '72', '36', '500000000', ''],
    ['Mawar', 'A', '02', 'Type 45/84', '84', '45', '650000000', ''],
  ])
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 16 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Unit')
  XLSX.writeFile(wb, 'template_import_unit.xlsx')
}

function parseSheet(wb) {
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  return rows.map((row) => ({
    cluster: String(row['cluster'] ?? row['Cluster'] ?? ''),
    blok: String(row['blok'] ?? row['Blok'] ?? ''),
    nomor: String(row['nomor'] ?? row['Nomor'] ?? row['No'] ?? ''),
    tipe: String(row['tipe'] ?? row['Tipe'] ?? row['Type'] ?? ''),
    luas_tanah: String(row['luas_tanah'] ?? row['Luas Tanah'] ?? ''),
    luas_bangunan: String(row['luas_bangunan'] ?? row['Luas Bangunan'] ?? ''),
    harga: String(row['harga'] ?? row['Harga'] ?? row['Price'] ?? ''),
    notes: String(row['notes'] ?? row['Notes'] ?? row['Catatan'] ?? ''),
  }))
}

function EditableRow({ row, index, onChange, onRemove }) {
  const cell = (key, type = 'text', placeholder = '') => (
    <input
      type={type}
      value={row[key]}
      onChange={(e) => onChange(index, key, e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-xs border border-transparent rounded hover:border-gray-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 focus:outline-none bg-transparent"
    />
  )

  const hasError = !row.nomor || !row.harga

  return (
    <tr className={`border-b border-gray-50 ${hasError ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
      <td className="px-3 py-1 text-xs text-gray-400 w-8">{index + 1}</td>
      <td className="px-1 py-1">{cell('cluster', 'text', 'A')}</td>
      <td className="px-1 py-1">{cell('blok', 'text', 'B')}</td>
      <td className="px-1 py-1 font-medium">
        {cell('nomor', 'text', '01')}
        {!row.nomor && <span className="text-[10px] text-red-500 pl-2">wajib</span>}
      </td>
      <td className="px-1 py-1">{cell('tipe', 'text', 'Type 36/72')}</td>
      <td className="px-1 py-1">{cell('luas_tanah', 'number', '72')}</td>
      <td className="px-1 py-1">{cell('luas_bangunan', 'number', '36')}</td>
      <td className="px-1 py-1">
        {cell('harga', 'number', '500000000')}
        {!row.harga && <span className="text-[10px] text-red-500 pl-2">wajib</span>}
      </td>
      <td className="px-1 py-1">{cell('notes', 'text', '')}</td>
      <td className="px-2 py-1 w-8">
        <button onClick={() => onRemove(index)} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

export default function UnitImportModal({ isOpen, onClose, onImport, projectId, projects }) {
  const [step, setStep] = useState('upload') // 'upload' | 'preview'
  const [rows, setRows] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [imageUrl, setImageUrl] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  const reset = () => {
    setStep('upload')
    setRows([])
    setImageUrl(null)
    setImportResult(null)
    setSelectedProjectId(projectId || '')
  }

  const handleClose = () => { reset(); onClose() }

  const processFile = (file) => {
    if (!file) return

    // Image
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setRows([{ ...EMPTY_ROW }])
      setStep('preview')
      return
    }

    // PDF — tampilkan sebagai embed reference + manual rows
    if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setRows([{ ...EMPTY_ROW }])
      setStep('preview')
      return
    }

    // Excel / CSV
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const parsed = parseSheet(wb)
        setRows(parsed.length ? parsed : [{ ...EMPTY_ROW }])
        setStep('preview')
      } catch {
        alert('Gagal membaca file. Pastikan format sesuai template.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleChange = (index, key, value) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [key]: value } : r))
  }

  const handleRemove = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, { ...EMPTY_ROW }])
  }

  const validRows = rows.filter((r) => r.nomor && r.harga)

  const handleImport = async () => {
    if (!selectedProjectId) { alert('Pilih project terlebih dahulu'); return }
    if (!validRows.length) { alert('Tidak ada data valid untuk diimpor'); return }

    setImporting(true)
    try {
      const units = validRows.map((r) => ({
        project_id: selectedProjectId,
        cluster: r.cluster || null,
        blok: r.blok || null,
        nomor: r.nomor,
        tipe: r.tipe || null,
        luas_tanah: r.luas_tanah ? parseFloat(r.luas_tanah) : null,
        luas_bangunan: r.luas_bangunan ? parseFloat(r.luas_bangunan) : null,
        harga: parseFloat(r.harga),
        notes: r.notes || null,
        status: 'available',
      }))
      const result = await onImport(units)
      setImportResult({ success: result.success ?? units.length, failed: result.failed ?? 0 })
    } catch (err) {
      setImportResult({ error: err.message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'upload' ? 'Import Daftar Unit' : `Preview Data (${rows.length} baris)`}
      size="xl"
      footer={
        step === 'upload' ? (
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
        ) : importResult ? (
          <Button onClick={handleClose}>Selesai</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={reset}>Kembali</Button>
            <Button onClick={handleImport} loading={importing} disabled={!validRows.length || !selectedProjectId}>
              Import {validRows.length} Unit
            </Button>
          </>
        )
      }
    >
      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Format yang didukung</p>
              <p className="text-xs mt-0.5 text-blue-600">Excel (.xlsx, .xls), CSV, Gambar (.jpg, .png), atau PDF sebagai referensi visual.</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <Upload size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-700">Drag & drop file di sini</p>
            <p className="text-xs text-gray-400 mt-1">atau klik untuk pilih file</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,image/*,application/pdf"
              className="hidden"
              onChange={(e) => processFile(e.target.files[0])}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">atau</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Quick actions */}
          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Download size={15} className="text-green-600" />
              <span>Download Template Excel</span>
            </button>
            <button
              onClick={() => { setRows([{ ...EMPTY_ROW }]); setStep('preview') }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Plus size={15} className="text-primary-600" />
              <span>Input Manual</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Import result */}
          {importResult && (
            <div className={`flex items-center gap-3 p-4 rounded-xl text-sm ${
              importResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {importResult.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {importResult.error
                ? `Gagal import: ${importResult.error}`
                : `Berhasil import ${importResult.success} unit${importResult.failed > 0 ? `, ${importResult.failed} gagal` : ''}.`
              }
            </div>
          )}

          {/* Project selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Project tujuan:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Pilih project...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Image/PDF reference */}
          {imageUrl && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 font-medium border-b border-gray-200 flex items-center gap-2">
                <Image size={13} /> Referensi file — isi data di tabel di bawah
              </div>
              {imageUrl.includes('blob:') && (
                <div className="max-h-48 overflow-auto">
                  <img
                    src={imageUrl}
                    alt="referensi"
                    className="w-full object-contain"
                    onError={(e) => {
                      // PDF fallback
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <iframe
                    src={imageUrl}
                    title="PDF preview"
                    className="w-full h-48"
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Editable table */}
          {!importResult && (
            <div className="overflow-auto rounded-xl border border-gray-200 max-h-72">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-gray-400 font-medium w-8">#</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">Cluster</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">Blok</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">Nomor *</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">Tipe</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">LT (m²)</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">LB (m²)</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">Harga (Rp) *</th>
                    <th className="px-2 py-2 text-left text-gray-600 font-medium">Catatan</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <EditableRow key={i} row={row} index={i} onChange={handleChange} onRemove={handleRemove} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!importResult && (
            <div className="flex items-center justify-between">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus size={14} /> Tambah baris
              </button>
              <p className="text-xs text-gray-400">
                {validRows.length} dari {rows.length} baris valid
                {rows.length - validRows.length > 0 && (
                  <span className="text-red-400 ml-1">({rows.length - validRows.length} belum lengkap)</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
