// // File: app/api/batches/generate-pdf/route.ts
// // Fixed version with proper Chrome detection and fallbacks

// import { NextRequest, NextResponse } from 'next/server'
// import puppeteer from 'puppeteer'

// interface PdfGenerationRequest {
//   html: string
//   options?: any
//   filename?: string
// }

// // Function to get Chrome executable path
// function getChromeExecutablePath(): string | undefined {
//   // Common Chrome paths on different systems
//   const chromePaths = [
//     '/usr/bin/google-chrome-stable',
//     '/usr/bin/google-chrome',
//     '/usr/bin/chromium-browser',
//     '/usr/bin/chromium',
//     '/opt/google/chrome/chrome',
//     '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
//     'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
//     'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Windows 32-bit
//   ]

//   // Check if any of these paths exist
//   const fs = require('fs')
//   for (const path of chromePaths) {
//     try {
//       if (fs.existsSync(path)) {
//         return path
//       }
//     } catch (error) {
//       continue
//     }
//   }

//   return undefined
// }

// export async function POST(request: NextRequest) {
//   console.log('PDF Generation request received')
  
//   try {
//     const body: PdfGenerationRequest = await request.json()
    
//     if (!body.html) {
//       return NextResponse.json(
//         { error: 'HTML content is required' },
//         { status: 400 }
//       )
//     }

//     console.log('HTML content length:', body.html.length)

//     // Try to find Chrome executable
//     const chromeExecutablePath = getChromeExecutablePath()
    
//     // Enhanced Puppeteer configuration with fallback options
//     const browserOptions = {
//       headless: true,
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-accelerated-2d-canvas',
//         '--no-first-run',
//         '--no-zygote',
//         '--single-process', // This can help with resource-constrained environments
//         '--disable-gpu'
//       ],
//       timeout: 30000,
//       ...(chromeExecutablePath && { executablePath: chromeExecutablePath })
//     }

//     console.log('Launching browser with options:', {
//       executablePath: chromeExecutablePath || 'bundled',
//       args: browserOptions.args
//     })

//     const browser = await puppeteer.launch(browserOptions)

//     console.log('Browser launched successfully')

//     const page = await browser.newPage()
    
//     console.log('New page created')

//     // Set viewport to ensure consistent rendering
//     await page.setViewport({ width: 1200, height: 800 })

//     // Set content with extended timeout
//     await page.setContent(body.html, { 
//       waitUntil: 'networkidle0',
//       timeout: 30000 
//     })

//     console.log('Content set and loaded')

//     // PDF options with better defaults
//     const pdfOptions = {
//       format: 'A4' as const,
//       printBackground: true,
//       margin: { 
//         top: '10mm', 
//         right: '10mm', 
//         bottom: '10mm', 
//         left: '10mm' 
//       },
//       timeout: 30000,
//       preferCSSPageSize: true
//     }

//     console.log('Generating PDF...')

//     // Generate PDF
//     const pdf:any = await page.pdf(pdfOptions)

//     console.log('PDF generated successfully, size:', pdf.length)

//     // Close browser
//     await browser.close()
//     console.log('Browser closed')

//     // Return the PDF
//     return new Response(pdf, {
//       headers: {
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': `attachment; filename="${body.filename || 'stickers.pdf'}"`,
//         'Content-Length': pdf.length.toString(),
//       }
//     })

//   } catch (error) {
//     console.error('PDF Generation failed:', error)
    
//     // Enhanced error reporting
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error'
//     const isChromeMissing = errorMessage.includes('Could not find Chrome') || 
//                            errorMessage.includes('Could not find browser')
    
//     return NextResponse.json(
//       {
//         error: 'PDF generation failed',
//         message: errorMessage,
//         suggestion: isChromeMissing ? 
//           'Chrome browser not found. Please install Chrome or configure Puppeteer properly.' :
//           'Check server logs for detailed error information.',
//         stack: process.env.NODE_ENV === 'development' ? 
//           (error instanceof Error ? error.stack : '') : undefined
//       },
//       { status: 500 }
//     )
//   }
// }

// // Enhanced health check endpoint
// export async function GET() {
//   try {
//     console.log('Health check: Testing Puppeteer configuration')
    
//     const chromeExecutablePath = getChromeExecutablePath()
//     console.log('Chrome path found:', chromeExecutablePath || 'Using bundled Chromium')
    
//     // Test browser launch
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         '--no-sandbox', 
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage'
//       ],
//       timeout: 15000,
//       ...(chromeExecutablePath && { executablePath: chromeExecutablePath })
//     })
    
//     console.log('Browser launched successfully for health check')
    
//     // Quick test
//     const page = await browser.newPage()
//     await page.setContent('<html><body><h1>Test</h1></body></html>')
//     const pdf = await page.pdf({ format: 'A4' })
    
//     await browser.close()
//     console.log('Health check completed successfully')
    
//     return NextResponse.json({ 
//       status: 'ok', 
//       message: 'Puppeteer is working correctly',
//       chromeExecutablePath: chromeExecutablePath || 'bundled',
//       testPdfSize: pdf.length,
//       timestamp: new Date().toISOString()
//     })
//   } catch (error) {
//     console.error('Health check failed:', error)
    
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
//     return NextResponse.json({ 
//       status: 'error', 
//       message: 'Puppeteer health check failed',
//       error: errorMessage,
//       suggestion: errorMessage.includes('Could not find Chrome') ?
//         'Install Chrome: sudo apt-get update && sudo apt-get install -y google-chrome-stable' :
//         'Check server configuration and logs'
//     }, { status: 500 })
//   }
// }



// File: app/api/batches/generate-pdf/route.ts
// FINAL WORKING Vercel solution for your specific setup

import { NextRequest, NextResponse } from 'next/server'

interface PdfGenerationRequest {
  html: string
  options?: any
  filename?: string
}

export async function POST(request: NextRequest) {
  console.log('PDF Generation request received')
  
  try {
    const body: PdfGenerationRequest = await request.json()
    
    if (!body.html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    console.log('HTML content length:', body.html.length)
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })

    // Dynamic imports based on environment (CRITICAL for Vercel)
    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV || process.env.NODE_ENV === 'production'
    let puppeteer: any
    let launchOptions: any = {
      headless: true,
    }

    if (isVercel) {
      console.log('Running on Vercel - using @sparticuz/chromium')
      
      try {
        // Import Vercel-specific packages
        const chromium:any = (await import('@sparticuz/chromium')).default
        puppeteer = await import('puppeteer-core')
        
        launchOptions = {
          ...launchOptions,
          args: [
            ...chromium.args,
            '--hide-scrollbars',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
        }
        
        console.log('Chromium path:', await chromium.executablePath())
      } catch (importError) {
        console.error('Failed to import Vercel packages:', importError)
        throw new Error('Failed to load Puppeteer for Vercel environment')
      }
    } else {
      console.log('Running locally - using regular puppeteer')
      puppeteer = await import('puppeteer')
      launchOptions = {
        ...launchOptions,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    }

    console.log('Launching browser with options:', JSON.stringify(launchOptions, null, 2))
    const browser = await puppeteer.launch(launchOptions)

    const page = await browser.newPage()
    
    // Set content
    await page.setContent(body.html, { 
      waitUntil: 'networkidle2',
      timeout: 25000 
    })

    console.log('Content loaded, generating PDF...')

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '10mm', 
        right: '10mm', 
        bottom: '10mm', 
        left: '10mm' 
      },
      timeout: 25000
    })

    await browser.close()
    console.log('PDF generated successfully, size:', pdf.length)

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${body.filename || 'document.pdf'}"`,
        'Content-Length': pdf.length.toString(),
      }
    })

  } catch (error) {
    console.error('PDF Generation failed:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        isVercel: !!process.env.VERCEL || !!process.env.VERCEL_ENV,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        debug: {
          hasChromiumPackage: !!process.env.VERCEL,
          packages: 'puppeteer-core + @sparticuz/chromium'
        }
      },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  try {
    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV
    let puppeteer: any
    let launchOptions: any = { headless: true }

    if (isVercel) {
      const chromium:any = (await import('@sparticuz/chromium')).default
      puppeteer = await import('puppeteer-core')
      
      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
      }
    } else {
      puppeteer = await import('puppeteer')
    }

    const browser = await puppeteer.launch(launchOptions)
    await browser.close()
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'PDF generation is working',
      environment: isVercel ? 'vercel' : 'local',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      environment: !!process.env.VERCEL ? 'vercel' : 'local'
    }, { status: 500 })
  }
}

// Vercel configuration
export const maxDuration = 30