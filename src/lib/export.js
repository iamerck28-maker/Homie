import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatRupiah, formatDate } from './utils'

// ── Helper ──────────────────────────────────────────────────────────────────

function pdfHeader(doc, title, subtitle = '') {
  doc.setFillColor(22, 163, 74) // primary-600
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('HOMIE', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Properti Indonesia', 40, 12)

  doc.setTextColor(33, 33, 33)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 30)
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 14, 37)
  }
  return subtitle ? 44 : 38
}

// ── Export Bookings ──────────────────────────────────────────────────────────

export function exportBookingsPDF(bookings, projectName = 'Semua Project') {
  const doc = new jsPDF()
  const y = pdfHeader(doc, 'Laporan Booking', `${projectName} · ${formatDate(new Date())}`)

  autoTable(doc, {
    startY: y,
    head: [['Pembeli', 'Unit', 'Harga Unit', 'Booking Fee', 'Metode', 'Tanggal', 'SPR']],
    body: bookings.map((b) => [
      b.buyer_name || '-',
      b.unit ? `Unit ${b.unit.nomor} · ${b.unit.tipe || ''}` : '-',
      formatRupiah(b.unit?.harga),
      formatRupiah(b.booking_fee),
      b.payment_method?.toUpperCase() || '-',
      formatDate(b.booking_date),
      b.spr_generated_at ? 'Ya' : 'Belum',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 245] },
  })

  doc.save(`laporan-booking-${Date.now()}.pdf`)
}

export function exportBookingsExcel(bookings, projectName = 'Semua Project') {
  const rows = bookings.map((b) => ({
    'Nama Pembeli': b.buyer_name || '-',
    'No. HP': b.buyer_phone || '-',
    'Email': b.buyer_email || '-',
    'NIK': b.buyer_nik || '-',
    'Unit': b.unit ? `Unit ${b.unit.nomor}` : '-',
    'Tipe': b.unit?.tipe || '-',
    'Harga Unit': b.unit?.harga || 0,
    'Booking Fee': b.booking_fee || 0,
    'Metode Bayar': b.payment_method || '-',
    'Tanggal Booking': b.booking_date || '-',
    'SPR': b.spr_generated_at ? 'Ya' : 'Belum',
    'Project': b.project?.name || '-',
  }))
  downloadExcel(rows, `laporan-booking-${Date.now()}`, 'Booking')
}

// ── Export Prospects ─────────────────────────────────────────────────────────

export function exportProspectsPDF(prospects, projectName = 'Semua Project') {
  const doc = new jsPDF()
  const y = pdfHeader(doc, 'Laporan Prospek', `${projectName} · ${formatDate(new Date())}`)

  autoTable(doc, {
    startY: y,
    head: [['Nama', 'No. HP', 'Status', 'Sales', 'Unit Diminati', 'Tgl. Masuk']],
    body: prospects.map((p) => [
      p.full_name || '-',
      p.phone || '-',
      p.status?.toUpperCase() || '-',
      p.assigned_to_profile?.full_name || '-',
      p.unit ? `Unit ${p.unit.nomor}` : '-',
      formatDate(p.created_at),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 245] },
  })

  doc.save(`laporan-prospek-${Date.now()}.pdf`)
}

export function exportProspectsExcel(prospects, projectName = 'Semua Project') {
  const rows = prospects.map((p) => ({
    'Nama': p.full_name || '-',
    'No. HP': p.phone || '-',
    'Email': p.email || '-',
    'Status': p.status || '-',
    'Sales': p.assigned_to_profile?.full_name || '-',
    'Unit Diminati': p.unit ? `Unit ${p.unit.nomor}` : '-',
    'Project': p.project?.name || '-',
    'Sumber': p.source || '-',
    'Tanggal Masuk': p.created_at ? formatDate(p.created_at) : '-',
    'Follow Up Berikutnya': p.next_follow_up ? formatDate(p.next_follow_up) : '-',
  }))
  downloadExcel(rows, `laporan-prospek-${Date.now()}`, 'Prospek')
}

// ── Export Komisi ────────────────────────────────────────────────────────────

export function exportCommissionsPDF(commissions, label = 'Tim') {
  const doc = new jsPDF()
  const y = pdfHeader(doc, `Laporan Komisi ${label}`, formatDate(new Date()))

  const total = commissions.reduce((s, c) => s + (c.amount || 0), 0)
  const paid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0)

  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Total Komisi: ${formatRupiah(total)}   |   Dibayar: ${formatRupiah(paid)}   |   Belum: ${formatRupiah(total - paid)}`, 14, y - 4)

  autoTable(doc, {
    startY: y,
    head: [['Sales', 'Pembeli', 'Unit', 'Harga Unit', '% Komisi', 'Nominal', 'Status', 'Tanggal']],
    body: commissions.map((c) => [
      c.marketing?.full_name || '-',
      c.booking?.buyer_name || '-',
      c.booking?.unit ? `Unit ${c.booking.unit.nomor}` : '-',
      formatRupiah(c.booking?.unit?.harga),
      c.percentage ? `${c.percentage}%` : '-',
      formatRupiah(c.amount),
      c.status?.toUpperCase() || '-',
      formatDate(c.paid_at || c.approved_at || c.created_at),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 245] },
  })

  doc.save(`laporan-komisi-${Date.now()}.pdf`)
}

export function exportCommissionsExcel(commissions) {
  const rows = commissions.map((c) => ({
    'Sales': c.marketing?.full_name || '-',
    'Pembeli': c.booking?.buyer_name || '-',
    'Unit': c.booking?.unit ? `Unit ${c.booking.unit.nomor}` : '-',
    'Harga Unit': c.booking?.unit?.harga || 0,
    '% Komisi': c.percentage || '',
    'Nominal Komisi': c.amount || 0,
    'Status': c.status || '-',
    'Catatan': c.notes || '-',
    'Disetujui': c.approved_at ? formatDate(c.approved_at) : '-',
    'Dibayar': c.paid_at ? formatDate(c.paid_at) : '-',
  }))
  downloadExcel(rows, `laporan-komisi-${Date.now()}`, 'Komisi')
}

// ── Helper Excel ─────────────────────────────────────────────────────────────

function downloadExcel(rows, filename, sheetName = 'Data') {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Auto column width
  const cols = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] || '').length)) + 2,
  }))
  ws['!cols'] = cols

  XLSX.writeFile(wb, `${filename}.xlsx`)
}
