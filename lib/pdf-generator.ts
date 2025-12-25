import PDFDocument from 'pdfkit'

interface Generate80GCertificateData {
  certificate_number: string
  issue_date: string
  financial_year: string
  donor: {
    name: string
    email: string
    phone?: string
  }
  organization: {
    name: string
    address: string
    registration_number: string
    pan: string
    '80g_number': string
    phone: string
    email: string
    website: string
  }
  donations: Array<{
    id: number
    amount: number
    date: string
    payment_id: string
    campaign: string
  }>
  total_amount: number
  amount_in_words: string
}

export async function generatePDF(
  templateType: '80g-certificate',
  data: Generate80GCertificateData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 20, // Reduced margin for more space
        info: {
          Title: '80G Tax Exemption Certificate',
          Author: data.organization.name,
          Subject: `Certificate ${data.certificate_number}`,
          Keywords: '80G, Tax Exemption, Donation Certificate'
        }
      })

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', reject)

      // Page dimensions
      const pageWidth = 595.28 - 40 // A4 width minus margins
      const pageHeight = 841.89 - 40 // A4 height minus margins
      let currentY = 30

      // Helper functions
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        doc.text(text, x, y, { width: options.width || pageWidth - x + 20, ...options })
      }

      const drawLine = (x1: number, y1: number, x2: number, y2: number, color = '#e0e0e0') => {
        doc.strokeColor(color).moveTo(x1, y1).lineTo(x2, y2).stroke()
      }

      // Header Section - Compact
      doc.rect(20, 20, pageWidth, 60).fill('#f8f9fa').stroke('#ddd')
      
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#2c3e50')
      addText('TAX EXEMPTION CERTIFICATE - 80G', 30, 35, { align: 'center' })
      
      doc.fontSize(10).fillColor('#666')
      addText(`Certificate: ${data.certificate_number} | FY: ${data.financial_year} | Date: ${new Date(data.issue_date).toLocaleDateString('en-IN')}`, 30, 55, { align: 'center' })

      currentY = 95

      // Organization Section - Compact 2-column layout
      doc.rect(20, currentY, pageWidth, 55).fill('#fff').stroke('#ddd')
      
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#2c3e50')
      addText(data.organization.name, 30, currentY + 8, { width: pageWidth - 20 })
      
      doc.font('Helvetica').fontSize(8).fillColor('#333')
      addText(data.organization.address, 30, currentY + 25, { width: 300 })
      addText(`PAN: ${data.organization.pan}`, 350, currentY + 25)
      addText(`80G: ${data.organization['80g_number']}`, 30, currentY + 35)
      addText(`Reg: ${data.organization.registration_number}`, 350, currentY + 35)
      addText(`${data.organization.email} | ${data.organization.phone}`, 30, currentY + 45, { width: pageWidth - 20 })

      currentY += 65

      // Donor Section - Minimal
      doc.rect(20, currentY, pageWidth, 30).fill('#f8f9fa').stroke('#ddd')
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#2c3e50')
      addText('DONOR DETAILS', 30, currentY + 5)
      
      doc.font('Helvetica').fontSize(9).fillColor('#333')
      const donorInfo = `${data.donor.name} | ${data.donor.email}${data.donor.phone ? ' | ' + data.donor.phone : ''}`
      addText(donorInfo, 30, currentY + 18, { width: pageWidth - 20 })

      currentY += 40

      // Donations Table - Optimized
      const tableStartY = currentY
      const colWidths = [40, 70, 180, 120, 90] // S.No, Date, Campaign, Payment ID, Amount
      const colX = [30, 70, 140, 320, 440]

      // Table header
      doc.rect(20, currentY, pageWidth, 18).fill('#34495e')
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff')
      
      const headers = ['#', 'Date', 'Campaign', 'Payment ID', 'Amount (Rs.)']
      headers.forEach((header, i) => {
        addText(header, colX[i], currentY + 6, { width: colWidths[i] })
      })

      currentY += 20

      // Table rows - More compact
      doc.font('Helvetica').fontSize(7).fillColor('#333')
      const maxRowsPerPage = 25 // Increased capacity
      
      data.donations.forEach((donation, index) => {
        // Check for page break
        if (currentY > 720) {
          doc.addPage()
          currentY = 50
          
          // Redraw header on new page
          doc.rect(20, currentY - 20, pageWidth, 18).fill('#34495e')
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff')
          headers.forEach((header, i) => {
            addText(header, colX[i], currentY - 14, { width: colWidths[i] })
          })
          doc.font('Helvetica').fontSize(7).fillColor('#333')
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(20, currentY - 2, pageWidth, 14).fill('#f8f9fa')
        }

        // Row data - Truncated for space
        const rowData = [
          (index + 1).toString(),
          new Date(donation.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }),
          donation.campaign.length > 28 ? donation.campaign.substring(0, 25) + '...' : donation.campaign,
          donation.payment_id.length > 18 ? donation.payment_id.substring(0, 15) + '...' : donation.payment_id,
          'Rs. ' + donation.amount.toLocaleString('en-IN')
        ]

        doc.fillColor('#333')
        rowData.forEach((data, i) => {
          addText(data, colX[i], currentY, { width: colWidths[i] })
        })

        currentY += 12
      })

      // Total Section - Compact
      currentY += 5
      doc.rect(20, currentY, pageWidth, 25).fill('#e3f2fd').stroke('#2196f3')
      
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1565c0')
      addText('TOTAL AMOUNT:', 30, currentY + 8)
      addText(`Rs. ${data.total_amount.toLocaleString('en-IN')}`, 440, currentY + 8, { align: 'right', width: 100 })

      doc.font('Helvetica').fontSize(8).fillColor('#333')
      addText(`In Words: ${data.amount_in_words}`, 150, currentY + 8, { width: 280 })

      currentY += 35

      // Certification - Minimal
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#2c3e50')
      addText('CERTIFICATION', 30, currentY)
      
      currentY += 15
      doc.font('Helvetica').fontSize(8).fillColor('#333')
      const certText = `This certifies that ${data.donor.name} donated Rs. ${data.total_amount.toLocaleString('en-IN')} to ${data.organization.name} in FY ${data.financial_year}. Eligible for 80G deduction under Income Tax Act, 1961.`
      addText(certText, 30, currentY, { width: pageWidth - 20, align: 'justify' })

      currentY += 35

      // Important Notes - Ultra compact
      doc.rect(20, currentY, pageWidth, 35).fill('#fff3e0').stroke('#ff9800')
      
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#f57c00')
      addText('IMPORTANT:', 30, currentY + 5)
      
      doc.font('Helvetica').fontSize(7).fillColor('#333')
      const notes = [
        '• Valid for IT purposes only • Retain for tax filing • Computer generated, no signature required',
        `• Queries: ${data.organization.email} • Generated: ${new Date().toLocaleString('en-IN')}`
      ]
      
      notes.forEach((note, i) => {
        addText(note, 30, currentY + 15 + (i * 10), { width: pageWidth - 20 })
      })

      // Footer - Minimal
      currentY = 800
      drawLine(20, currentY, 20 + pageWidth, currentY)
      doc.fontSize(7).fillColor('#999')
      addText(`Certificate ID: ${data.certificate_number}`, 30, currentY + 5)
      addText('This is a computer generated certificate', 30 + pageWidth - 200, currentY + 5, { align: 'right', width: 200 })

      doc.end()

    } catch (error) {
      reject(error)
    }
  })
}