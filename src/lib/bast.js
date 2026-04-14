import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatRupiah } from './utils'

export const DEFAULT_CHECKLIST = [
  { id: 'kunci', label: 'Kunci rumah & pagar', checked: false, notes: '' },
  { id: 'listrik', label: 'Instalasi listrik berfungsi', checked: false, notes: '' },
  { id: 'air', label: 'Instalasi air berfungsi', checked: false, notes: '' },
  { id: 'cat', label: 'Kondisi cat dinding baik', checked: false, notes: '' },
  { id: 'lantai', label: 'Kondisi lantai baik', checked: false, notes: '' },
  { id: 'atap', label: 'Kondisi atap & plafon baik', checked: false, notes: '' },
  { id: 'pintu', label: 'Pintu & jendela berfungsi', checked: false, notes: '' },
  { id: 'sanitasi', label: 'Sanitasi & closet berfungsi', checked: false, notes: '' },
  { id: 'kamar_mandi', label: 'Kondisi kamar mandi baik', checked: false, notes: '' },
  { id: 'dapur', label: 'Area dapur baik', checked: false, notes: '' },
]

export function generateBAST(handover) {
  const doc = new jsPDF()
  const { booking, unit } = handover

  // Header
  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, 210, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('HOMIE — Properti Indonesia', 14, 13)

  // Judul
  doc.setTextColor(33, 33, 33)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('BERITA ACARA SERAH TERIMA', 105, 34, { align: 'center' })
  doc.text('(BAST)', 105, 42, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Tanggal: ${formatDate(handover.actual_date || handover.scheduled_date)}`, 105, 49, { align: 'center' })

  // Garis
  doc.setDrawColor(22, 163, 74)
  doc.setLineWidth(0.5)
  doc.line(14, 53, 196, 53)

  // Data Unit
  doc.setTextColor(33, 33, 33)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('A. DATA UNIT', 14, 62)

  autoTable(doc, {
    startY: 66,
    body: [
      ['Nomor Unit', unit?.nomor || '-', 'Tipe', unit?.tipe || '-'],
      ['Cluster/Blok', [unit?.cluster, unit?.blok].filter(Boolean).join(' / ') || '-', 'Luas', unit?.luas_bangunan ? `${unit.luas_bangunan} m²` : '-'],
      ['Harga', formatRupiah(unit?.harga), 'Project', handover.booking?.project?.name || '-'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 253, 244] }, 2: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
  })

  // Data Pembeli
  const y1 = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('B. DATA PEMBELI', 14, y1)

  autoTable(doc, {
    startY: y1 + 4,
    body: [
      ['Nama Pembeli', booking?.buyer_name || '-', 'NIK', booking?.buyer_nik || '-'],
      ['No. HP', booking?.buyer_phone || '-', 'Email', booking?.buyer_email || '-'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 253, 244] }, 2: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
  })

  // Checklist Kondisi
  const y2 = doc.lastAutoTable.finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('C. CHECKLIST KONDISI UNIT', 14, y2)

  const checklist = handover.checklist || DEFAULT_CHECKLIST
  autoTable(doc, {
    startY: y2 + 4,
    head: [['No', 'Item Pemeriksaan', 'Kondisi', 'Catatan']],
    body: checklist.map((item, i) => [
      i + 1,
      item.label,
      item.checked ? '✓ Baik' : '✗ Perlu Perbaikan',
      item.notes || '-',
    ]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 35 },
    },
    didDrawCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const text = data.cell.text[0]
        if (text?.startsWith('✓')) {
          doc.setTextColor(22, 163, 74)
        } else {
          doc.setTextColor(220, 38, 38)
        }
      }
    },
  })

  // Defect notes
  if (handover.defect_notes) {
    const y3 = doc.lastAutoTable.finalY + 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(33, 33, 33)
    doc.text('D. CATATAN DEFECT / KELUHAN', 14, y3)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(doc.splitTextToSize(handover.defect_notes, 180), 14, y3 + 6)
  }

  // Tanda tangan
  const ySign = Math.min(doc.lastAutoTable?.finalY + 20 || 220, 240)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(33, 33, 33)

  const cols = [
    { label: 'Pihak Developer', name: 'Project Manager', x: 30 },
    { label: 'Pihak Pembeli', name: booking?.buyer_name || '___________', x: 110 },
  ]

  cols.forEach(({ label, name, x }) => {
    doc.text(label, x, ySign, { align: 'center' })
    doc.rect(x - 25, ySign + 3, 50, 18)
    doc.text(name, x, ySign + 26, { align: 'center' })
    doc.line(x - 25, ySign + 24, x + 25, ySign + 24)
  })

  doc.save(`BAST-Unit${unit?.nomor || ''}-${Date.now()}.pdf`)
}
