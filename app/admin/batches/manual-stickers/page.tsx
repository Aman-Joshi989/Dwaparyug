'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Eye, FileText, Loader2, X } from 'lucide-react';

interface StickerData {
  name: string;
  count: number;
  imageUrl: string;
}

export default function CSVStickerGenerator() {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };
  const getProxiedImageUrl = (url: string): string => {
    if (!url) return '';

    // Convert Google Drive URLs to direct format
    const driveMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (driveMatch) {
      url = `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }

    // Use wsrv.nl proxy for all URLs to handle CORS and authentication
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const data: StickerData[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic cases)
      const values = line.split(',').map(v => v.trim());

      if (values.length >= 3) {
        const name = values[0];
        const count = parseInt(values[1]) || 1;
        const imageUrl = getProxiedImageUrl(values[2]);

        // Create multiple stickers based on count - numbering restarts for each person
        for (let j = 0; j < count; j++) {
          data.push({
            name,
            count: j + 1, // This will be the display number (1, 2, 3... then restarts)
            imageUrl
          });
        }
      }
    }

    setStickers(data);
    setShowPreview(true);
  };

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const html = generateStickerHTML();

      // Create a temporary iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Wait for images to load
        await new Promise(resolve => {
          if (iframe.contentWindow) {
            iframe.contentWindow.onload = resolve;
          }
          setTimeout(resolve, 1000);
        });

        // Trigger print
        iframe.contentWindow?.print();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateStickerHTML = () => {
    const stickersPerPage = 8;
    const pages: StickerData[][] = [];

    // Group stickers into pages
    for (let i = 0; i < stickers.length; i += stickersPerPage) {
      pages.push(stickers.slice(i, i + stickersPerPage));
    }

    const pagesHTML = pages.map((pageStickers, pageIndex) => {
      const stickersHTML = pageStickers.map((sticker, index) => `
        <div class="sticker">
          <!-- Top Right: Sticker Number -->
          <div class="sticker-number">#${sticker.count}</div>
          
          <!-- Top Center: Logo -->
          <div class="logo-section">
            <img src="/images/logo/logo-for-sticker.png" alt="Foundation Logo" class="foundation-logo" onerror="this.parentElement.innerHTML='<div class=logo-fallback>🌾</div>'">
          </div>
          
          <!-- Middle Center: Name -->
          <div class="name-section">
            <div class="donor-name">${sticker.name}</div>
          </div>
          
          <!-- Bottom Section -->
          <div class="bottom-section">
            <!-- Bottom Left: Foundation Info -->
            <div class="foundation-info">
              <div class="foundation-name">Dwaparyug Foundation</div>
              <div class="website">https://www.dwaparyug.org</div>
              <div class="transparency">Donate With 100% Transparency</div>
            </div>
            
            <!-- Bottom Right: Custom Image -->
            ${sticker.imageUrl ?
          `<div class="image-container">
                <img src="${sticker.imageUrl}" alt="Custom" class="custom-image" onerror="this.parentElement.style.display='none'">
              </div>` : ''
        }
          </div>
        </div>
      `).join('');

      return `
        <div class="page" ${pageIndex < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
          ${stickersHTML}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Donation Stickers</title>
        <meta charset="UTF-8">
        <style>
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
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white;
          }
          
          .page { 
            display: grid; 
            grid-template-columns: 50% 50%; 
            grid-template-rows: repeat(4, 25%);
            gap: 0; 
            width: 210mm; 
            height: 297mm;
            padding: 0;
            margin: 0;
            background: white;
          }
          
          .sticker { 
            background: white;
            border: 2px solid #000;
            padding: 10px; 
            margin-left: 10px; 
            margin-top: 5px; 
            display: flex; 
            flex-direction: column;
            position: relative;
            width: 95%;
            height: 95%;
            box-sizing: border-box;
          }
          
          .sticker-number { 
            position: absolute;
            top: 6px;
            right: 6px;
            color: #000; 
            padding: 3px 8px;
            font-size: 24px; 
            font-weight: bold;
            z-index: 10;
          }
          
          .logo-section {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 4px 0;
            margin-bottom: 6px;
          }
          
          .foundation-logo {
            max-width: 90px;
            max-height: 80px;
            width: auto;
            height: auto;
            object-fit: contain;
          }
          
          .logo-fallback {
            font-size: 32px;
            color: #f59e0b;
          }
          
          .name-section {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 6px;
            min-height: 45px;
          }
          
          .donor-name { 
            font-size: 20px; 
            font-weight: 700; 
            color: #000; 
            line-height: 1.25;
            text-align: center;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            max-width: 100%;
          }
          
          .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 6px;
            margin-top: auto;
            padding-top: 6px;
          }
          
          .foundation-info { 
            flex: 1;
            text-align: left;
            min-width: 0;
          }
          
          .foundation-name { 
            font-size: 16px; 
            font-weight: 700; 
            color: #111; 
            margin-bottom: 2px; 
            line-height: 1.2;
          }
          
          .website { 
            font-size: 14px; 
            color: #333; 
            font-weight: 700; 
            margin-bottom: 2px; 
            line-height: 1.2;
          }
          
          .transparency { 
            font-size: 16px; 
            color: #333; 
            font-weight: 600;
            line-height: 1.2;
          }
          
          .image-container {
            flex-shrink: 0;
          }
          
          .custom-image {
            max-width: 120px;
            max-height: 100px;
            border-radius: 4px;
            object-fit: fit;
            display: block;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            * { -webkit-print-color-adjust: exact; color-adjust: exact; }
            .page { page-break-inside: avoid !important; }
          }
        </style>
      </head>
      <body>
        ${pagesHTML}
      </body>
      </html>
    `;
  };

  const handleReset = () => {
    setStickers([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">CSV Sticker Generator</h1>
            <p className="text-gray-600 mt-2">Upload CSV to generate donation stickers (8 per page)</p>
          </div>
        </header>

        {/* Upload Section */}
        {!showPreview && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to upload CSV file
                  </p>
                  <p className="text-sm text-gray-500">
                    CSV format: name, count, imageUrl
                  </p>
                </label>
              </div>


            </CardContent>
          </Card>
        )}

        {/* Preview & Download Section */}
        {showPreview && (
          <div className="space-y-6">
            {/* Stats & Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{stickers.length}</div>
                      <div className="text-sm text-gray-600">Total Stickers</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {Math.ceil(stickers.length / 8)}
                      </div>
                      <div className="text-sm text-gray-600">Pages (8 per page)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={generatePDF}
                      disabled={generating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {generating ? 'Generating...' : 'Print/Download PDF'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Sticker Preview (First 8)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg">
                  {stickers.slice(0, 8).map((sticker, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-300 rounded-lg p-3 flex flex-col relative"
                      style={{ minHeight: '220px' }}
                    >
                      {/* Top Right - Sticker Number */}
                      <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded text-xs font-bold">
                        #{sticker.count}
                      </div>

                      {/* Top Center - Logo */}
                      <div className="flex justify-center mb-2">
                        <img
                          src="/images/logo/logo-for-sticker.png"
                          alt="Foundation Logo"
                          className="h-10 w-auto object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.textContent = '🌾';
                            fallback.className = 'text-3xl';
                            e.currentTarget.parentElement?.appendChild(fallback);
                          }}
                        />
                      </div>

                      {/* Middle Center - Name (Multiline Support) */}
                      <div className="flex-1 flex items-center justify-center px-2 mb-2">
                        <div className="font-bold text-sm leading-snug text-gray-900 text-center break-words w-full">
                          {sticker.name}
                        </div>
                      </div>

                      {/* Bottom Section */}
                      <div className="flex items-end justify-between gap-2">
                        {/* Bottom Left - Foundation Info */}
                        <div className="flex-1 text-left space-y-0.5">
                          <div className="text-[10px] font-bold text-gray-900 leading-tight">
                            Dwaparyug Foundation
                          </div>
                          <div className="text-[9px] text-gray-700 leading-tight">
                            https://www.dwaparyug.org
                          </div>
                          <div className="text-[9px] text-gray-700 font-medium leading-tight">
                            Donate With 100% Transparency
                          </div>
                        </div>

                        {/* Bottom Right - Custom Image */}
                        {sticker.imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={sticker.imageUrl}
                              alt="Custom"
                              className="w-20 h-20 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {stickers.length > 8 && (
                  <p className="text-center text-sm text-gray-600 mt-4">
                    Showing first 8 of {stickers.length} stickers
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
