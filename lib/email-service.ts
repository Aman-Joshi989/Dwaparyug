// lib/email-service.ts
import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'
import { SelectQuery } from '@/lib/database'

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
  from?: string
}

interface DonationEmailData {
  donationId: number
  userEmail: string
  userName: string
  campaignTitle: string
  donationAmount: number
  tipAmount: number
  totalAmount: number
  donationType: string
  donationDate: string
  razorpayPaymentId: string
  items?: any[]
  personalization?: any
}

// Create reusable transporter object using the SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Verify connection configuration
    await transporter.verify()

    const mailOptions = {
      from: options.from || `"${process.env.ORGANIZATION_NAME || 'Organization'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }))
    }

    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Generate PDF receipt for donation - FIXED VERSION

async function generateDonationPDFReceipt(data: DonationEmailData): Promise<Buffer> {
  let browser = null;

  try {
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            color: #667eea;
            margin-bottom: 15px;
            font-weight: bold;
          }
          .org-details {
            font-size: 11px;
            color: #666;
            line-height: 1.8;
          }
          .receipt-box {
            border: 2px solid #333;
            padding: 20px;
            margin: 25px 0;
            background-color: #f9f9f9;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
          }
          .receipt-row:last-child {
            border-bottom: none;
          }
          .receipt-label {
            font-weight: bold;
            color: #555;
            width: 40%;
          }
          .receipt-value {
            color: #333;
            width: 60%;
            text-align: right;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #667eea;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
          }
          .info-row {
            display: flex;
            padding: 8px 0;
          }
          .info-label {
            font-weight: bold;
            width: 30%;
            color: #555;
          }
          .info-value {
            width: 70%;
            color: #333;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table thead {
            background-color: #667eea;
            color: white;
          }
          .items-table th,
          .items-table td {
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          .items-table th {
            font-weight: bold;
          }
          .items-table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .items-table .text-right {
            text-align: right;
          }
          .items-table .text-center {
            text-align: center;
          }
          .amount-box {
            float: right;
            width: 350px;
            border: 2px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .amount-row.total {
            border-top: 2px solid rgba(255,255,255,0.5);
            margin-top: 10px;
            padding-top: 15px;
            font-size: 16px;
            font-weight: bold;
          }
          .amount-label {
            font-size: 14px;
          }
          .amount-value {
            font-size: 14px;
            text-align: right;
          }
          .amount-row.total .amount-value {
            font-size: 20px;
          }
          .clearfix::after {
            content: "";
            display: table;
            clear: both;
          }
          .additional-details {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-left: 4px solid #667eea;
          }
          .detail-item {
            margin-bottom: 15px;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
          }
          .detail-value {
            color: #333;
            margin-left: 20px;
          }
          .tax-info {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 25px 0;
          }
          .tax-info strong {
            color: #856404;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <h1>DONATION RECEIPT</h1>
          <div class="org-details">
            <strong>${process.env.ORGANIZATION_NAME || 'DWAPARYUG FOUNDATION'}</strong><br>
            ${process.env.ORGANIZATION_ADDRESS || 'Organization Address'}<br>
            Email: ${process.env.ORGANIZATION_EMAIL || 'info@organization.com'} | 
            Phone: ${process.env.ORGANIZATION_PHONE || '+91-XXXXXXXXXX'}<br>
            Website: ${process.env.ORGANIZATION_WEBSITE || 'www.organization.com'}
          </div>
        </div>

        <!-- Receipt Details -->
        <div class="receipt-box">
          <div class="receipt-row">
            <div class="receipt-label">Receipt Number:</div>
            <div class="receipt-value">DON-${data.donationId}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Date:</div>
            <div class="receipt-value">${new Date(data.donationDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Payment ID:</div>
            <div class="receipt-value" style="word-break: break-all; font-size: 10px;">${data.razorpayPaymentId}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">Donation Type:</div>
            <div class="receipt-value">${data.donationType === 'direct' ? 'Direct Donation' : 'Product Based'}</div>
          </div>
          <div class="receipt-row">
            <div class="receipt-label">PAN:</div>
            <div class="receipt-value">${process.env.ORGANIZATION_PAN || 'N/A'}</div>
          </div>
        </div>

        <!-- Donor Information -->
        <div class="section-title">Donor Information</div>
        <div class="info-row">
          <div class="info-label">Name:</div>
          <div class="info-value">${data.userName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${data.userEmail}</div>
        </div>

        <!-- Campaign Details -->
        <div class="section-title">Campaign Details</div>
        <div class="info-row">
          <div class="info-label">Campaign:</div>
          <div class="info-value">${data.campaignTitle}</div>
        </div>

        ${data.items && data.items.length > 0 ? `
        <!-- Donated Items -->
        <div class="section-title">Donated Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-center">Quantity</th>
              <th class="text-right">Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.name || 'Product'}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">₹${item.price}</td>
                <td class="text-right">₹${(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <!-- Amount Details -->
        <div class="clearfix">
          <div class="amount-box">
            <div class="amount-row">
              <div class="amount-label">Donation Amount:</div>
              <div class="amount-value">₹${data.donationAmount}</div>
            </div>
            <div class="amount-row">
              <div class="amount-label">Platform Tip:</div>
              <div class="amount-value">₹${data.tipAmount}</div>
            </div>
            <div class="amount-row total">
              <div class="amount-label">Total Amount:</div>
              <div class="amount-value">₹${data.totalAmount}</div>
            </div>
          </div>
        </div>

        ${data.personalization && Object.keys(data.personalization).some(key => data.personalization[key]) ? `
        <!-- Additional Details -->
        <div class="section-title" style="clear: both; padding-top: 20px;">Additional Details</div>
        <div class="additional-details">
          ${data.personalization.donatedOnBehalfOf ? `
            <div class="detail-item">
              <div class="detail-label">Donated on behalf of:</div>
              <div class="detail-value">${data.personalization.donatedOnBehalfOf}</div>
            </div>
          ` : ''}
          ${data.personalization.customMessage ? `
            <div class="detail-item">
              <div class="detail-label">Message:</div>
              <div class="detail-value">${data.personalization.customMessage}</div>
            </div>
          ` : ''}
          ${data.personalization.donationPurpose ? `
            <div class="detail-item">
              <div class="detail-label">Purpose:</div>
              <div class="detail-value">${data.personalization.donationPurpose}</div>
            </div>
          ` : ''}
          ${data.personalization.specialInstructions ? `
            <div class="detail-item">
              <div class="detail-label">Special Instructions:</div>
              <div class="detail-value">${data.personalization.specialInstructions}</div>
            </div>
          ` : ''}
        </div>
        ` : ''}

        ${process.env.ORGANIZATION_80G_NUMBER ? `
        <!-- Tax Exemption Details -->
        <div class="tax-info">
          <strong>📋 Tax Exemption Details (Section 80G)</strong><br><br>
          This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.<br>
          <strong>80G Registration Number:</strong> ${process.env.ORGANIZATION_80G_NUMBER}
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your generous donation!</strong></p>
          <p>This receipt is for your records and tax filing purposes.</p>
          <p style="margin-top: 15px;">This is a computer-generated receipt and does not require a signature.</p>
          <p style="margin-top: 10px; font-size: 9px;">Generated on ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
        </div>
      </body>
      </html>
    `

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    })

    await browser.close()

    return Buffer.from(pdfBuffer)

  } catch (error) {
    if (browser) {
      await browser.close()
    }
    console.error('Error in generateDonationPDFReceipt:', error)
    throw error
  }
}

// Generate HTML email template for donation confirmation
function generateDonationEmailHTML(data: DonationEmailData): string {
  const itemsHTML = data.items && data.items.length > 0
    ? `
      <div style="margin: 20px 0;">
        <h3 style="color: #333; margin-bottom: 10px;">Donated Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Item</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.name || 'Product'}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₹${item.price}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">₹${(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Donation Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Donation! 🙏</h1>
      </div><div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${data.userName},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Thank you for your generous donation to <strong>${process.env.ORGANIZATION_NAME || 'our organization'}</strong>! 
          Your contribution makes a real difference and helps us continue our mission to serve the community.
        </p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #667eea; margin-top: 0; font-size: 20px;">Donation Summary</h2>
          
          <table style="width: 100%; margin: 10px 0;">
            <tr>
              <td style="padding: 8px 0;"><strong>Receipt Number:</strong></td>
              <td style="padding: 8px 0; text-align: right;">DON-${data.donationId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${new Date(data.donationDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Campaign:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${data.campaignTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment ID:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 11px;">${data.razorpayPaymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Donation Type:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${data.donationType === 'direct' ? 'Direct Donation' : 'Product Based'}</td>
            </tr>
          </table>
        </div>
        
        ${itemsHTML}
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; color: white;">
            <tr>
              <td style="padding: 5px 0;">Donation Amount:</td>
              <td style="padding: 5px 0; text-align: right; font-size: 16px;">₹${data.donationAmount}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Platform Tip:</td>
              <td style="padding: 5px 0; text-align: right; font-size: 16px;">₹${data.tipAmount}</td>
            </tr>
            <tr style="border-top: 2px solid rgba(255,255,255,0.3);">
              <td style="padding: 10px 0 0 0;"><strong>Total Amount:</strong></td>
              <td style="padding: 10px 0 0 0; text-align: right; font-size: 22px;"><strong>₹${data.totalAmount}</strong></td>
            </tr>
          </table>
        </div>
        
            <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32;">
            <strong>📄 PDF Receipt Attached</strong><br>
            A detailed receipt has been attached to this email for your records. Please save it for tax filing purposes.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
          <ul style="padding-left: 20px; color: #555;">
            <li>Your donation will be processed within 24-48 hours</li>
            <li>You will receive updates on how your contribution is making an impact</li>
            <li>Keep this receipt for your tax filing records</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          If you have any questions about your donation or need additional documentation, 
          please don't hesitate to contact us at <a href="mailto:${process.env.ORGANIZATION_EMAIL}" style="color: #667eea;">${process.env.ORGANIZATION_EMAIL}</a> 
          or call us at ${process.env.ORGANIZATION_PHONE}.
        </p>
        
        <p style="font-size: 16px; margin-top: 30px;">
          With heartfelt gratitude,<br>
          <strong>${process.env.ORGANIZATION_NAME || 'DWAPARYUG FOUNDATION'}</strong>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 5px 0;">${process.env.ORGANIZATION_NAME || 'DWAPARYUG FOUNDATION'}</p>
        <p style="margin: 5px 0;">${process.env.ORGANIZATION_ADDRESS || ''}</p>
        <p style="margin: 5px 0;">Email: ${process.env.ORGANIZATION_EMAIL || ''} | Phone: ${process.env.ORGANIZATION_PHONE || ''}</p>
        <p style="margin: 15px 0 5px 0;">This is an automated email. Please do not reply to this message.</p>
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} ${process.env.ORGANIZATION_NAME || 'Organization'}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

// Send donation confirmation email with PDF receipt
export async function sendDonationConfirmationEmail(donationId: number): Promise<boolean> {
  try {
    // Fetch complete donation details
    const donationQuery = `
      SELECT 
        d.id,
        d.user_id,
        d.donation_amount,
        d.tip_amount,
        (d.donation_amount + d.tip_amount) as total_amount,
        d.donation_type,
        d.donation_date,
        d.razorpay_payment_id,
        d.donated_on_behalf_of,
        d.donor_message,
        u.full_name,
        u.email,
        c.title as campaign_title,
        po.custom_message,
        po.donor_name as personalization_behalf_of,
        po.donation_purpose,
        po.special_instructions,
        po.donor_name as personalization_donor_name,
        po.donor_country
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      LEFT JOIN personalization_options po ON po.donation_id = d.id
      WHERE d.id = $1
    `

    const donationResult = await SelectQuery(donationQuery, [donationId])
    console.log("🚀 ~ sendDonationConfirmationEmail ~ donationResult:", donationResult)

    if (!donationResult || donationResult.length === 0) {
      throw new Error('Donation not found')
    }

    const donation = donationResult[0]
    console.log("🚀 ~ sendDonationConfirmationEmail ~ donation:", donation)

    if (!donation.email) {
      console.error('User email not found for donation:', donationId)
      throw new Error('User email not found')
    }

    // Fetch donation items if product-based
    let items: any = []
    if (donation.donation_type === 'product_based') {
      const itemsQuery = `
        SELECT 
          di.quantity,
          di.price_per_unit as price,
          ip.name
        FROM donation_items di
        LEFT JOIN campaign_products cp ON di.campaign_product_id = cp.id
        LEFT JOIN indipendent_products ip ON cp.indipendent_product_id  = ip.id
        WHERE di.donation_id = $1
      `
      items = await SelectQuery(itemsQuery, [donationId])
    }

    const emailData: DonationEmailData = {
      donationId: donation.id,
      userEmail: donation.email,
      userName: donation.full_name || donation.personalization_donor_name || 'Donor',
      campaignTitle: donation.campaign_title || 'General Campaign',
      donationAmount: parseFloat(donation.donation_amount || 0),
      tipAmount: parseFloat(donation.tip_amount || 0),
      totalAmount: parseFloat(donation.total_amount || 0),
      donationType: donation.donation_type,
      donationDate: donation.donation_date,
      razorpayPaymentId: donation.razorpay_payment_id,
      items: items,
      personalization: {
        donatedOnBehalfOf: donation.donated_on_behalf_of || donation.personalization_behalf_of,
        customMessage: donation.donor_message || donation.custom_message,
        donationPurpose: donation.donation_purpose,
        specialInstructions: donation.special_instructions,
        donorCountry: donation.donor_country
      }
    }

    // Generate PDF receipt
    console.log('Generating PDF receipt for donation:', donationId)
    const pdfBuffer = await generateDonationPDFReceipt(emailData)

    // Send email
    console.log('Sending donation confirmation email to:', emailData.userEmail)

    await sendEmail({
      to: emailData.userEmail,
      subject: `Thank You for Your Donation - Receipt #DON-${donationId}`,
      html: generateDonationEmailHTML(emailData),
      attachments: [
        {
          filename: `Donation_Receipt_DON-${donationId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    })

    console.log(`✅ Donation confirmation email sent successfully to ${emailData.userEmail} for donation ID: ${donationId}`)
    return true
  } catch (error) {
    console.error('Error sending donation confirmation email:', error)
    throw error
  }
}

// Helper function for sending OTP emails
export async function sendOTPEmail(
  recipientEmail: string,
  otp: string,
  recipientName?: string
): Promise<boolean> {
  const emailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; }
        .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { background: #343a40; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
          <p>Please verify your email address</p>
        </div>
        
        <div class="content">
          <p>Hello ${recipientName || 'User'},</p>
          <p>Thank you for registering with us. To complete your registration, please use the following One-Time Password (OTP):</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p>This OTP is valid for <strong>10 minutes</strong> only. Please do not share this code with anyone.</p>
          
          <div class="warning">
            <strong>Security Notice:</strong> If you did not request this verification, please ignore this email or contact our support team.
          </div>
        </div>
        
        <div class="footer">
          <p>${process.env.ORGANIZATION_NAME || 'Your Organization'}</p>
          <p style="font-size: 12px; margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: recipientEmail,
    subject: 'Email Verification - OTP',
    html: emailBody
  })
}

// Helper function to send 80G certificate email
export async function send80GCertificateEmail(
  recipientEmail: string,
  certificateData: any,
  pdfBuffer: Buffer
): Promise<boolean> {
  try {
    const emailBody = generate80GCertificateEmailBody(certificateData)

    const emailOptions: SendEmailOptions = {
      to: recipientEmail,
      subject: `80G Tax Exemption Certificate - ${certificateData?.certificate_number}`,
      html: emailBody,
      attachments: [{
        filename: `80G_Certificate_${certificateData?.certificate_number.replace(/\//g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    }

    return await sendEmail(emailOptions)
  } catch (error) {
    console.error('Error sending 80G certificate email:', error)
    throw error
  }
}

// Helper function to generate the 80G certificate email body
function generate80GCertificateEmailBody(certificateData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .content { padding: 20px; }
        .footer { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
        .amount { font-weight: bold; color: #28a745; font-size: 18px; }
        .certificate-number { font-weight: bold; color: #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>80G Tax Exemption Certificate</h2>
        <p>Dear ${certificateData?.donor?.name || 'Donor'},</p>
      </div>
      
      <div class="content">
        <p>Thank you for your generous donation(s). We are pleased to provide you with your 80G tax exemption certificate.</p>
      
        <h3>Certificate Details:</h3>
        <ul>
          <li><strong>Certificate Number:</strong> <span class="certificate-number">${certificateData?.certificate_number}</span></li>
          <li><strong>Financial Year:</strong> ${certificateData?.financial_year}</li>
          <li><strong>Total Donation Amount:</strong> <span class="amount">₹${certificateData?.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></li>
<li><strong>Amount in Words:</strong> ${certificateData?.amount_in_words}</li>
<li><strong>Issue Date:</strong> ${new Date(certificateData?.issue_date).toLocaleDateString('en-IN')}</li>
</ul>
    <p>This certificate is valid for claiming tax deduction under Section 80G of the Income Tax Act, 1961.</p>
  
    <p><strong>Important Notes:</strong></p>
    <ul>
      <li>Please retain this certificate for your tax filing records</li>
      <li>This certificate covers all your donations for the specified financial year</li>
      <li>For any queries regarding this certificate, please contact us</li>
    </ul>
  </div>

  <div class="footer">
    <p><strong>${certificateData?.organization?.name || process.env.ORGANIZATION_NAME}</strong><br>
    ${certificateData?.organization?.address || process.env.ORGANIZATION_ADDRESS}<br>
    Email: ${certificateData?.organization?.email || process.env.ORGANIZATION_EMAIL}<br>
    Phone: ${certificateData?.organization?.phone || process.env.ORGANIZATION_PHONE}<br>
    Website: ${certificateData?.organization?.website || process.env.ORGANIZATION_WEBSITE}</p>
  
    <p style="margin-top: 15px; font-size: 12px; color: #666;">
      This is an automatically generated email. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
`
}