// Export Utilities for PDF/Excel reports

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num || 0)
}

// Generate PDF Report
export const exportToPDF = (report, reportType, dateInfo) => {
  const { year, month, day } = dateInfo
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  const primaryColor = [34, 197, 94]
  const darkColor = [31, 41, 55]
  const lightGray = [107, 114, 128]

  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 45, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('BANK SAMPAH INDUK NUSA', pageWidth / 2, 18, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Platform Digital Pengelolaan Sampah Terintegrasi', pageWidth / 2, 28, { align: 'center' })

  doc.setFontSize(10)
  const reportTitle = reportType === 'daily' 
    ? `Laporan Harian: ${day}/${month}/${year}`
    : `Laporan Bulanan: ${month}/${year}`
  doc.text(reportTitle, pageWidth / 2, 38, { align: 'center' })

  yPos = 55

  // Info box
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 20, 3, 3, 'F')
  
  doc.setTextColor(...darkColor)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, margin + 5, yPos + 8)
  doc.text(`Periode: ${reportType === 'daily' ? 'Harian' : 'Bulanan'}`, margin + 5, yPos + 15)
  doc.text(`Dicetak oleh: Administrator`, pageWidth - margin - 50, yPos + 8)

  yPos = 85

  // Section: Summary Statistics
  doc.setFillColor(...primaryColor)
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('RINGKASAN STATISTIK', margin + 5, yPos + 5.5)

  yPos += 12

  // Summary Cards
  const summaryData = [
    { label: 'Total Sampah', value: `${formatNumber(report?.waste?.total_kg || 0)} kg`, icon: '🗑️' },
    { label: 'Jumlah Setoran', value: formatNumber(report?.waste?.total_count || 0), icon: '📦' },
    { label: 'Total Poin', value: formatNumber(report?.points?.total || 0), icon: '⭐' },
    { label: 'Pengguna Aktif', value: formatNumber(report?.users_active || 0), icon: '👥' }
  ]

  const cardWidth = (pageWidth - (margin * 2) - 15) / 4
  summaryData.forEach((item, index) => {
    const x = margin + (index * (cardWidth + 5))
    
    // Card background
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(x, yPos, cardWidth, 22, 2, 2, 'F')
    
    // Card border
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(x, yPos, cardWidth, 22, 2, 2, 'S')
    
    // Card content
    doc.setTextColor(...lightGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(item.label, x + cardWidth / 2, yPos + 8, { align: 'center' })
    
    doc.setTextColor(...primaryColor)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(item.value, x + cardWidth / 2, yPos + 17, { align: 'center' })
  })

  yPos += 32

  // === SECTION 2: Waste by Type ===
  if (report?.waste?.by_type) {
    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('RINCIAN JENIS SAMPAH', margin + 5, yPos + 5.5)

    yPos += 12

    // Table data
    const wasteTableData = Object.entries(report.waste.by_type).map(([type, data]) => [
      type,
      `${formatNumber(data.total_kg)} kg`,
      formatNumber(data.count),
      `${((data.total_kg / report.waste.total_kg) * 100).toFixed(1)}%`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Jenis Sampah', 'Berat (kg)', 'Jumlah Setoran', 'Persentase']],
      body: wasteTableData,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' }
      }
    })

    yPos = doc.lastAutoTable.finalY + 10
  }

  // === SECTION 3: Points Distribution ===
  if (report?.points?.by_source) {
    // Check if need new page
    if (yPos > pageHeight - 80) {
      doc.addPage()
      yPos = margin
    }

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('DISTRIBUSI POIN', margin + 5, yPos + 5.5)

    yPos += 12

    const pointsTableData = Object.entries(report.points.by_source).map(([source, data]) => [
      source,
      formatNumber(data.total_poin ?? data.poin ?? 0),
      formatNumber(data.count ?? 0)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Sumber Poin', 'Total Poin', 'Jumlah Transaksi']],
      body: pointsTableData,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    })

    yPos = doc.lastAutoTable.finalY + 10
  }

  // === SECTION 4: Daily Breakdown (Monthly Report Only) ===
  if (reportType === 'monthly' && report?.daily_breakdown) {
    // Check if need new page
    if (yPos > pageHeight - 80) {
      doc.addPage()
      yPos = margin
    }

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('RINCIAN HARIAN', margin + 5, yPos + 5.5)

    yPos += 12

    const dailyTableData = Object.entries(report.daily_breakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => [
        formatDate(date),
        `${formatNumber(data.waste_kg)} kg`,
        formatNumber(data.waste_count),
        formatNumber(data.points || 0)
      ])

    autoTable(doc, {
      startY: yPos,
      head: [['Tanggal', 'Berat Sampah', 'Jumlah Setoran', 'Poin']],
      body: dailyTableData,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: darkColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    })

    yPos = doc.lastAutoTable.finalY + 10
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Footer line
    doc.setDrawColor(...lightGray)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)
    
    // Footer text
    doc.setTextColor(...lightGray)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Bank Sampah Induk Nusa - Laporan digenerate secara otomatis', margin, pageHeight - 10)
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  // Save the PDF
  const filename = reportType === 'daily' 
    ? `Laporan_Harian_${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}.pdf`
    : `Laporan_Bulanan_${year}-${String(month).padStart(2, '0')}.pdf`
  
  doc.save(filename)
  
  return { success: true, filename }
}

/**
 * Generate Excel Report
 * @param {Object} report - Report data object
 * @param {string} reportType - 'daily' or 'monthly'
 * @param {Object} dateInfo - { year, month, day }
 */
export const exportToExcel = (report, reportType, dateInfo) => {
  const { year, month, day } = dateInfo
  
  // Create workbook
  const wb = XLSX.utils.book_new()

  // === Sheet 1: Summary ===
  const summaryData = [
    ['BANK SAMPAH INDUK NUSA'],
    ['Platform Digital Pengelolaan Sampah Terintegrasi'],
    [''],
    ['LAPORAN ' + (reportType === 'daily' ? 'HARIAN' : 'BULANAN')],
    ['Periode', reportType === 'daily' ? `${day}/${month}/${year}` : `${month}/${year}`],
    ['Tanggal Cetak', formatDate(new Date())],
    [''],
    ['RINGKASAN STATISTIK'],
    ['Metrik', 'Nilai'],
    ['Total Sampah (kg)', report?.waste?.total_kg || 0],
    ['Jumlah Setoran', report?.waste?.total_count || 0],
    ['Total Poin', report?.points?.total || 0],
    ['Pengguna Aktif', report?.users_active || 0]
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Set column widths
  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 25 }
  ]

  // Merge cells for title
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Subtitle row
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }  // Report title
  ]

  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan')

  // === Sheet 2: Waste by Type ===
  if (report?.waste?.by_type) {
    const wasteData = [
      ['RINCIAN JENIS SAMPAH'],
      [''],
      ['Jenis Sampah', 'Berat (kg)', 'Jumlah Setoran', 'Persentase']
    ]

    Object.entries(report.waste.by_type).forEach(([type, data]) => {
      const percentage = ((data.total_kg / report.waste.total_kg) * 100).toFixed(1)
      wasteData.push([type, data.total_kg, data.count, `${percentage}%`])
    })

    // Add totals
    wasteData.push([''])
    wasteData.push(['TOTAL', report.waste.total_kg, report.waste.total_count, '100%'])

    const wasteSheet = XLSX.utils.aoa_to_sheet(wasteData)
    wasteSheet['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 }
    ]
    
    XLSX.utils.book_append_sheet(wb, wasteSheet, 'Jenis Sampah')
  }

  // === Sheet 3: Points Distribution ===
  if (report?.points?.by_source) {
    const pointsData = [
      ['DISTRIBUSI POIN'],
      [''],
      ['Sumber Poin', 'Total Poin', 'Jumlah Transaksi']
    ]

    Object.entries(report.points.by_source).forEach(([source, data]) => {
      pointsData.push([source, data.total_poin ?? data.poin ?? 0, data.count ?? 0])
    })

    // Add totals
    pointsData.push([''])
    pointsData.push(['TOTAL', report.points.total, '-'])

    const pointsSheet = XLSX.utils.aoa_to_sheet(pointsData)
    pointsSheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 }
    ]
    
    XLSX.utils.book_append_sheet(wb, pointsSheet, 'Distribusi Poin')
  }

  // === Sheet 4: Daily Breakdown (Monthly Only) ===
  if (reportType === 'monthly' && report?.daily_breakdown) {
    const dailyData = [
      ['RINCIAN HARIAN'],
      [''],
      ['Tanggal', 'Berat Sampah (kg)', 'Jumlah Setoran', 'Poin']
    ]

    Object.entries(report.daily_breakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, data]) => {
        dailyData.push([
          formatDate(date),
          data.waste_kg,
          data.waste_count,
          data.points || 0
        ])
      })

    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
    dailySheet['!cols'] = [
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 }
    ]
    
    XLSX.utils.book_append_sheet(wb, dailySheet, 'Rincian Harian')
  }

  // Generate filename
  const filename = reportType === 'daily' 
    ? `Laporan_Harian_${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}.xlsx`
    : `Laporan_Bulanan_${year}-${String(month).padStart(2, '0')}.xlsx`

  // Write and save
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)

  return { success: true, filename }
}

/**
 * Export Users Data to Excel
 * @param {Array} users - Array of user objects
 */
export const exportUsersToExcel = (users) => {
  const wb = XLSX.utils.book_new()

  const userData = [
    ['DAFTAR PENGGUNA BANK SAMPAH INDUK NUSA'],
    ['Diekspor pada: ' + formatDate(new Date())],
    [''],
    ['No', 'Nama', 'Email', 'No. HP', 'Role', 'Status', 'Total Sampah (kg)', 'Saldo Poin', 'Tanggal Daftar']
  ]

  users.forEach((user, index) => {
    userData.push([
      index + 1,
      user.nama || user.name || '-',
      user.email || '-',
      user.no_hp || user.phone || '-',
      user.role?.nama_role || user.role || '-',
      user.status || 'active',
      user.total_sampah ?? user.total_setor_sampah ?? 0,
      user.actual_poin ?? user.display_poin ?? 0,
      user.created_at ? formatDate(user.created_at) : '-'
    ])
  })

  const sheet = XLSX.utils.aoa_to_sheet(userData)
  sheet['!cols'] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 }
  ]

  XLSX.utils.book_append_sheet(wb, sheet, 'Pengguna')

  const filename = `Daftar_Pengguna_${formatDate(new Date()).replace(/ /g, '_')}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)

  return { success: true, filename }
}

/**
 * Export Waste Deposits to Excel
 * @param {Array} deposits - Array of waste deposit objects
 */
export const exportWasteDepositsToExcel = (deposits) => {
  const wb = XLSX.utils.book_new()

  const data = [
    ['DAFTAR PENYETORAN SAMPAH BANK SAMPAH INDUK NUSA'],
    ['Diekspor pada: ' + formatDate(new Date())],
    [''],
    ['No', 'ID Setoran', 'Nama Nasabah', 'Jenis Sampah', 'Berat (kg)', 'Poin', 'Status', 'Tanggal Setoran', 'Catatan']
  ]

  deposits.forEach((deposit, index) => {
    data.push([
      index + 1,
      deposit.id || deposit.penyetoran_id || '-',
      deposit.nasabah?.nama || deposit.user?.name || '-',
      deposit.jenis_sampah?.nama || deposit.waste_type || '-',
      deposit.berat || deposit.weight || 0,
      deposit.poin || deposit.points || 0,
      deposit.status || '-',
      deposit.created_at ? formatDate(deposit.created_at) : '-',
      deposit.catatan || deposit.notes || '-'
    ])
  })

  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 30 }
  ]

  XLSX.utils.book_append_sheet(wb, sheet, 'Penyetoran')

  const filename = `Daftar_Penyetoran_${formatDate(new Date()).replace(/ /g, '_')}.xlsx`
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)

  return { success: true, filename }
}

export default {
  exportToPDF,
  exportToExcel,
  exportUsersToExcel,
  exportWasteDepositsToExcel
}
