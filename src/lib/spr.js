import jsPDF from 'jspdf'
import { formatRupiah, formatDate } from './utils'

export function generateSPR(booking) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Helper
  const center = (text, y, size = 12) => {
    doc.setFontSize(size)
    doc.text(text, pageWidth / 2, y, { align: 'center' })
  }
  const line = (y) => doc.line(20, y, pageWidth - 20, y)

  // Header
  doc.setFont('helvetica', 'bold')
  center('SURAT PEMESANAN RUMAH', 30, 16)
  center('(SPR)', 38, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Tanggal: ${formatDate(booking.booking_date)}`, 20, 50)
  line(55)

  // Data pembeli
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DATA PEMESAN', 20, 65)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const buyerData = [
    ['Nama Lengkap', booking.buyer_name],
    ['No. KTP / NIK', booking.buyer_nik || '-'],
    ['No. HP', booking.buyer_phone || '-'],
    ['Email', booking.buyer_email || '-'],
  ]
  buyerData.forEach(([label, value], i) => {
    doc.text(`${label}`, 20, 78 + i * 10)
    doc.text(`: ${value}`, 80, 78 + i * 10)
  })

  line(125)

  // Data unit
  doc.setFont('helvetica', 'bold')
  doc.text('DATA UNIT', 20, 135)

  doc.setFont('helvetica', 'normal')
  const unit = booking.unit || {}
  const unitData = [
    ['Project', booking.project?.name || '-'],
    ['Nomor Unit', unit.nomor || '-'],
    ['Tipe', unit.tipe || '-'],
    ['Luas Tanah', unit.luas_tanah ? `${unit.luas_tanah} m²` : '-'],
    ['Luas Bangunan', unit.luas_bangunan ? `${unit.luas_bangunan} m²` : '-'],
    ['Harga Jual', formatRupiah(unit.harga)],
    ['Metode Pembayaran', booking.payment_method === 'kpr' ? 'KPR' : booking.payment_method === 'cash' ? 'Cash' : 'Cash Bertahap'],
    ['Booking Fee', formatRupiah(booking.booking_fee)],
  ]
  unitData.forEach(([label, value], i) => {
    doc.text(`${label}`, 20, 148 + i * 10)
    doc.text(`: ${value}`, 80, 148 + i * 10)
  })

  line(240)

  // Catatan
  if (booking.notes) {
    doc.setFont('helvetica', 'bold')
    doc.text('Catatan:', 20, 250)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(booking.notes, pageWidth - 40)
    doc.text(splitNotes, 20, 260)
  }

  // Tanda tangan
  const sigY = 265
  doc.text('Pembeli,', 40, sigY)
  doc.text('Developer,', pageWidth - 60, sigY)

  doc.line(25, sigY + 30, 85, sigY + 30)
  doc.line(pageWidth - 75, sigY + 30, pageWidth - 25, sigY + 30)

  doc.text(booking.buyer_name || '......................', 40, sigY + 37)
  doc.text('......................', pageWidth - 60, sigY + 37)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150)
  center('Dokumen ini dibuat oleh sistem Homie - Platform Manajemen Properti', 290)

  doc.save(`SPR_${booking.buyer_name}_Unit${booking.unit?.nomor || ''}.pdf`)
}
