"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Printer, Download, Eye, Loader2, Image as ImageIcon, FileText } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
// Removed import - using base64 approach instead

interface StickerData {
  id: string
  donor_name: string
  custom_message: string
  donation_purpose: string
  product_name: string
  quantity: number
  batch_name: string
  campaign_title: string
  custom_image: string | null
  is_image_available: boolean
  sticker_number?: number
}

interface Batch {
  id: number
  batch_name: string
  campaign_title: string
  total_items: number
}

interface StickerPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: Batch | null
}

const TEMPLATE_OPTIONS = [
  { value: 'template1', label: 'Classic Donation Label', description: 'Professional with donor info and custom message' }
]

const FORMAT_OPTIONS = [
  { value: '4', label: '4 per page', description: '2x2 grid - Large stickers (10.5 x 7.4 cm)' },
  { value: '8', label: '8 per page', description: '4x2 grid - Medium stickers (5.25 x 7.4 cm)' },
  { value: '12', label: '12 per page', description: '3x4 grid - Small stickers (7 x 5.55 cm)' }
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Stickers' },
  { value: 'with', label: 'Only with Custom Images' },
  { value: 'without', label: 'Only without Images' }
]

export function StickerPrintDialog({ open, onOpenChange, batch }: StickerPrintDialogProps) {
  const [loading, setLoading] = useState(false)
  const [stickerData, setStickerData] = useState<StickerData[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  // Configuration state
  const [template, setTemplate] = useState('template1')
  const [format, setFormat] = useState('4')
  const [includeImages, setIncludeImages] = useState(true)
  const [filterByImages, setFilterByImages] = useState('all')
  const [customBatchName, setCustomBatchName] = useState('')
  const [pageRange, setPageRange] = useState<{ start: number; end: number } | 'all'>('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalStickers, setTotalStickers] = useState(0)
  const [logoBase64, setLogoBase64] = useState<string>('')

  const printRef = useRef<HTMLDivElement>(null)

  // Convert image to base64
  const getImageAsBase64 = async (imagePath: string) => {
    try {
      const response = await fetch(imagePath)
      const blob = await response.blob()
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      return ''
    }
  }

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open && batch) {
      setCustomBatchName(batch.batch_name)
      // Load logo as base64
      getImageAsBase64('/images/logo/logo-for-sticker.png').then(base64 => {
        setLogoBase64(base64)
      })
      fetchStickerData()
    } else {
      setStickerData([])
      setCurrentPage(1)
      setLogoBase64('')
    }
  }, [open, batch])

  const fetchStickerData = async (page = 1) => {
    if (!batch) return

    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '50',
        template,
        format,
        includeImages: includeImages.toString(),
        filterByImages
      })

      const response = await fetch(`/api/batches/${batch.id}/stickers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sticker data')

      const data = await response.json()

      // Add sticker numbering
      const stickersWithNumbers = (data.data.stickers || []).map((sticker: StickerData, index: number) => ({
        ...sticker,
        sticker_number: index + 1
      }))

      setStickerData(stickersWithNumbers)
      setTotalCount(data.data.pagination.total_count)
      setTotalStickers(data.data.pagination.total_stickers)
      setCurrentPage(data.data.pagination.current_page)

    } catch (error) {
      console.error('Error fetching sticker data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch sticker data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePDFWithPuppeteer = async () => {
    if (!batch) return

    try {
      setPdfGenerating(true)

      // First, get all sticker data for PDF generation
      const params = new URLSearchParams({
        template,
        format,
        includeImages: includeImages.toString(),
        filterByImages,
        getAllData: 'true' // Flag to get all data, not paginated
      })

      const stickerResponse = await fetch(`/api/batches/${batch.id}/stickers?${params}`)
      if (!stickerResponse.ok) throw new Error('Failed to fetch sticker data')

      const stickerDataResponse = await stickerResponse.json()
      const allStickers = (stickerDataResponse.data.stickers || []).map((sticker: StickerData, index: number) => ({
        ...sticker,
        sticker_number: index + 1
      }))

      // Generate HTML content for PDF
      const htmlContent = generatePrintHTML(allStickers)

      // Call Puppeteer API endpoint for PDF generation
      const pdfResponse = await fetch('/api/batches/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          options: {
            format: 'A4',
            printBackground: true,
            margin: {
              top: '0mm',
              right: '0mm',
              bottom: '0mm',
              left: '0mm'
            },
            preferCSSPageSize: true,
            displayHeaderFooter: false
          },
          filename: `stickers-${customBatchName || batch.batch_name}-${Date.now()}.pdf`
        })
      })

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get the PDF as blob and download it
      const pdfBlob = await pdfResponse.blob()
      const pdfUrl = window.URL.createObjectURL(pdfBlob)

      // Create download link
      const downloadLink = document.createElement('a')
      downloadLink.href = pdfUrl
      downloadLink.download = `stickers-${customBatchName || batch.batch_name}-${Date.now()}.pdf`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      // Clean up the URL
      window.URL.revokeObjectURL(pdfUrl)

      toast({
        title: "PDF Generated Successfully",
        description: `Sticker PDF has been downloaded. Total stickers: ${allStickers.length}`,
      })

      // Close dialog after successful PDF generation
      onOpenChange(false)

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPdfGenerating(false)
    }
  }

  const generatePrintPreview = () => {
    if (!printRef.current) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generatePrintHTML(stickerData)

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
  }

  const generatePrintHTML = (stickers: StickerData[]) => {
    const formatClass = `format-${format}`
    const templateClass = `sticker-${template}`

    let pages = []
    const stickersPerPage = parseInt(format)

    // Group stickers into pages
    for (let i = 0; i < stickers.length; i += stickersPerPage) {
      const pageStickers = stickers.slice(i, i + stickersPerPage)
      pages.push(pageStickers)
    }

    const pagesHTML = pages.map((pageStickers, pageIndex) => {
      const stickersHTML = pageStickers.map(sticker =>
        generateStickerHTML(sticker, templateClass)
      ).join('')

      return `
        <div class="${formatClass}" ${pageIndex < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
          ${stickersHTML}
        </div>
      `
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stickers - ${customBatchName || batch?.batch_name}</title>
        <meta charset="UTF-8">
        <style>
          ${generatePrintCSS()}
        </style>
      </head>
      <body>
        ${pagesHTML}
      </body>
      </html>
    `
  }

  const generateStickerHTML = (sticker: StickerData, templateClass: string) => {
    const displayBatchName = customBatchName || sticker.batch_name
    const maxMessageLength = format === '12' ? 40 : format === '8' ? 60 : 80
    const truncatedMessage = sticker.custom_message && sticker.custom_message.length > maxMessageLength
      ? sticker.custom_message.substring(0, maxMessageLength) + '...'
      : sticker.custom_message

    // Use base64 logo or fallback
    const logoSrc = logoBase64 || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZjU5ZTBiIi8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjMwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+NvzwvdGV4dD4KPC9zdmc+'

    return `
        <div class="${templateClass}">
        <div class="sticker-header">
          <div class="sticker-number">${sticker.sticker_number || ''}</div>
          <div class="logo-container">
            <img src="${logoSrc}" alt="Foundation Logo" class="foundation-logo" onerror="this.innerHTML='🍽️'; this.className='foundation-logo-fallback';">
          </div>
        </div>
        <div class="center-content">
          ${sticker.custom_image && includeImages ?
        `<img src="${sticker.custom_image}" alt="Custom" class="custom-image" onerror="this.style.display='none'">
             ${truncatedMessage ? `<div class="message-below-image">${truncatedMessage}</div>` : ''}` :
        `<div class="message-content">${sticker.custom_message || 'Thank you for your donation'}</div>`
      }
        </div>
        <div class="donor-name">${sticker.donor_name}</div>
        <div class="foundation-info">
          <div class="foundation-name">${displayBatchName}</div>
          <div class="website">www.dwaparyug.org</div>
          <div class="transparency">Donate With 100% Transparency</div>
        </div>
      </div>
    `
  }

  const generatePrintCSS = () => {
    const stickersPerPage = parseInt(format)
    const rowsPerPage = Math.ceil(stickersPerPage / 2)

    return `
      @page { 
        margin: 0; 
        size: A4 portrait; 
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body { 
        font-family: 'Arial', sans-serif; 
        margin: 0; 
        padding: 0; 
        background: white;
        width: 210mm;
        height: 297mm;
        overflow: hidden;
      }
      
      .format-4, .format-8, .format-12 { 
        display: grid; 
        grid-template-columns: 50% 50%; 
        grid-template-rows: repeat(${rowsPerPage}, ${100 / rowsPerPage}%);
        gap: 0; 
        width: 100%; 
        height: 100vh;
        padding: 0;
        margin: 0;
      }
      
      .sticker-template1, .sticker-template2, .sticker-template3, .sticker-template4 { 
        background: white;
        border: 0.5px solid #ddd;
        padding: ${format === '12' ? '6px' : format === '8' ? '8px' : '12px'}; 
        display: flex; 
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        box-sizing: border-box;
      }
      
      .sticker-header {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: ${format === '12' ? '6px' : format === '8' ? '8px' : '10px'};
        position: relative;
      }
      
      .sticker-number { 
        background: #000; 
        color: white; 
        width: ${format === '12' ? '22px' : format === '8' ? '26px' : '32px'}; 
        height: ${format === '12' ? '22px' : format === '8' ? '26px' : '32px'}; 
        border-radius: 2px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: ${format === '12' ? '12px' : format === '8' ? '14px' : '18px'}; 
        font-weight: bold;
        position: absolute;
        left: 0;
        top: 0;
      }
      
      .logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
      }
      
      .foundation-logo {
        max-width: ${format === '12' ? '45px' : format === '8' ? '55px' : '65px'};
        max-height: ${format === '12' ? '45px' : format === '8' ? '55px' : '65px'};
        width: auto;
        height: auto;
        object-fit: contain;
        display: block;
      }
      
      .foundation-logo-fallback {
        font-size: ${format === '12' ? '36px' : format === '8' ? '44px' : '52px'};
        color: #f59e0b;
        display: block;
        text-align: center;
      }
      
      .center-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: ${format === '12' ? '6px 0' : format === '8' ? '8px 0' : '10px 0'};
        min-height: ${format === '12' ? '40px' : format === '8' ? '50px' : '70px'};
        max-height: ${format === '12' ? '50px' : format === '8' ? '60px' : '80px'};
        overflow: hidden;
      }
      
      .custom-image {
        max-width: ${format === '12' ? '75px' : format === '8' ? '75px' : '95px'};
        max-height: ${format === '12' ? '75px' : format === '8' ? '75px' : '95px'};
        border-radius: 3px;
        object-fit: cover;
        margin-bottom: ${format === '12' ? '3px' : format === '8' ? '4px' : '6px'};
      }
      
      .message-below-image {
        font-size: ${format === '12' ? '10px' : format === '8' ? '12px' : '14px'};
        color: #333;
        font-weight: 600;
        font-style: italic;
        text-align: center;
        line-height: 1.2;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .message-content {
        font-size: ${format === '12' ? '12px' : format === '8' ? '14px' : '18px'};
        color: #111;
        font-weight: bold;
        font-style: italic;
        text-align: center;
        line-height: 1.3;
        padding: ${format === '12' ? '3px' : format === '8' ? '4px' : '6px'};
        max-width: 100%;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: ${format === '12' ? '2' : format === '8' ? '3' : '4'};
        -webkit-box-orient: vertical;
      }
      
      .donor-name { 
        font-size: ${format === '12' ? '16px' : format === '8' ? '18px' : '22px'}; 
        font-weight: 900; 
        color: #000; 
        margin: ${format === '12' ? '6px 0' : format === '8' ? '8px 0' : '10px 0'};
        line-height: 1.2;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .foundation-info { 
        text-align: center;
        border-top: 0.5px solid #ddd;
        padding-top: ${format === '12' ? '6px' : format === '8' ? '8px' : '10px'};
        width: 100%;
        flex-shrink: 0;
      }
      
      .foundation-name { 
        font-size: ${format === '12' ? '11px' : format === '8' ? '13px' : '16px'}; 
        font-weight: 700; 
        color: #111; 
        margin-bottom: ${format === '12' ? '2px' : format === '8' ? '3px' : '4px'}; 
        line-height: 1.2;
      }
      
      .website { 
        font-size: ${format === '12' ? '10px' : format === '8' ? '12px' : '14px'}; 
        color: #333; 
        font-weight: 600;
        margin-bottom: ${format === '12' ? '2px' : format === '8' ? '3px' : '4px'}; 
        line-height: 1.2;
      }
      
      .transparency { 
        font-size: ${format === '12' ? '9px' : format === '8' ? '11px' : '13px'}; 
        color: #333; 
        font-weight: 600;
        font-style: italic; 
        line-height: 1.2;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        * { -webkit-print-color-adjust: exact; color-adjust: exact; }
        .format-4, .format-8, .format-12 { page-break-inside: avoid !important; }
      }
    `
  }

  const handlePreviewStickers = () => {
    fetchStickerData(1)
  }

  if (!batch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Stickers - {batch.batch_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Print Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Template Style</Label>
                  <Select value={template} onValueChange={setTemplate} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label>Stickers per Page</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeImages"
                      checked={includeImages}
                      onChange={() => setIncludeImages(!includeImages)}
                    />
                    <Label htmlFor="includeImages" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Include Custom Images
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Filter Stickers</Label>
                    <Select value={filterByImages} onValueChange={setFilterByImages}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FILTER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Batch Name */}
                <div className="space-y-2">
                  <Label>Batch Name on Stickers</Label>
                  <Input
                    value={customBatchName}
                    onChange={(e) => setCustomBatchName(e.target.value)}
                    placeholder="Enter custom batch name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handlePreviewStickers}
                variant="outline"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Eye className="h-4 w-4 mr-2" />
                Preview Stickers
              </Button>

              <Button
                onClick={generatePrintPreview}
                variant="outline"
                disabled={stickerData.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                Browser Print Preview
              </Button>

              <Button
                onClick={generatePDFWithPuppeteer}
                disabled={pdfGenerating || stickerData.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {pdfGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <FileText className="h-4 w-4 mr-2" />
                Generate PDF (Puppeteer)
              </Button>
            </div>
          </div>

          {/* Statistics Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Print Information
                  {totalStickers > 0 && (
                    <Badge variant="secondary">
                      {totalStickers} stickers total
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>PDF will be generated using Puppeteer for high-quality printing</p>
                  <p className="text-sm mt-2">Improved font sizes and layout for better readability</p>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {totalStickers > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">{totalStickers}</div>
                      <div className="text-muted-foreground">Total Stickers</div>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {Math.ceil(totalStickers / parseInt(format))}
                      </div>
                      <div className="text-muted-foreground">Pages Required</div>
                    </div>
                    <div>
                      <div className="font-semibold">
                        {stickerData.filter(s => s.is_image_available).length}
                      </div>
                      <div className="text-muted-foreground">With Images</div>
                    </div>
                    <div>
                      <div className="font-semibold">{TEMPLATE_OPTIONS.find(t => t.value === template)?.label}</div>
                      <div className="text-muted-foreground">Template</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div ref={printRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  )
}