import { SelectQuery } from '@/lib/database'
import { generatePDF } from '@/lib/pdf-generator'
import { sendEmail } from '@/lib/email-service'

interface DonationData {
  id: number
  user_id: number
  donation_amount: number
  donation_date: string
  razorpay_payment_id: string
  campaign_title?: string
  donor_name?: string
}

interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
}

interface Generate80GResponse {
  success: boolean
  message: string
  certificate_id?: number
  pdf_url?: string
  error?: string
}

export async function generateAndSend80G(
  userId: number,
  sendEmailFlag: boolean = true
): Promise<Generate80GResponse> {
  try {
    // Get user details
    const userQuery = `
      SELECT id, email, first_name, last_name, mobile_no as phone
      FROM users
      WHERE id = $1
    `
    const userResult: any = await SelectQuery(userQuery, [userId])

    if (userResult?.length === 0) {
      return {
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      }
    }

    const userData: UserData = userResult[0]

    // Build donation query based on parameters
    let donationQuery: string
    let queryParams: any[]


    // Get all donations for user from current financial year
    const currentDate = new Date()
    const financialYearStart = currentDate.getMonth() >= 3
      ? new Date(currentDate.getFullYear(), 3, 1)
      : new Date(currentDate.getFullYear() - 1, 3, 1)

    donationQuery = `
        SELECT
          d.id,
          d.user_id,
          d.donation_amount,
          d.donation_date,
          d.razorpay_payment_id,
          c.title as campaign_title,
          COALESCE(po.donor_name, CONCAT(u.first_name, ' ', u.last_name)) as donor_name
        FROM donations d
        LEFT JOIN campaigns c ON c.id = d.campaign_id
        LEFT JOIN users u ON u.id = d.user_id
        LEFT JOIN personalization_options po ON (
          po.donation_id = d.id OR
          po.donation_item_id IN (SELECT di.id FROM donation_items di WHERE di.donation_id = d.id LIMIT 1)
        )
        WHERE d.user_id = $1 AND d.donation_date >= $2
        ORDER BY d.donation_date DESC
      `
    console.log("🚀 ~ generateAndSend80G ~ donationQuery:", donationQuery)
    console.log("🚀 ~ generateAndSend80G ~ financialYearStart.toISOString:", financialYearStart.toISOString())
    queryParams = [userId, financialYearStart.toISOString()]

    const donationResult: any = await SelectQuery(donationQuery, queryParams)
    console.log("🚀 ~ generateAndSend80G ~ donationResult:", donationResult)

    if (donationResult?.length === 0) {
      return {
        success: false,
        message: 'No donations found for current financial year',
        error: 'NO_DONATIONS_FOUND'
      }
    }

    const donations: DonationData[] = donationResult

    // Calculate total donation amount
    const totalAmount = donations.reduce((sum, donation) => sum + parseFloat(donation.donation_amount.toString()), 0)

    // Generate certificate number
    const certificateNumber = `80G/${new Date().getFullYear()}/${userId}/${Date.now()}`

    // Get organization details from environment
    const organizationDetails = {
      name: process.env.ORGANIZATION_NAME || 'Your Organization Name',
      address: process.env.ORGANIZATION_ADDRESS || 'Organization Address',
      registration_number: process.env.ORGANIZATION_REG_NUMBER || 'REG123456',
      pan: process.env.ORGANIZATION_PAN || 'PANXXXXXX',
      '80g_number': process.env.ORGANIZATION_80G_NUMBER || '80GXXXXXX',
      phone: process.env.ORGANIZATION_PHONE || '+91-XXXXXXXXXX',
      email: process.env.ORGANIZATION_EMAIL || 'info@organization.com',
      website: process.env.ORGANIZATION_WEBSITE || 'www.organization.com'
    }

    // Prepare certificate data
    const certificateData = {
      certificate_number: certificateNumber,
      issue_date: new Date().toISOString(),
      financial_year: getCurrentFinancialYear(),
      donor: {
        name: donations[0].donor_name || `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        phone: userData.phone
      },
      organization: organizationDetails,
      donations: donations.map(d => ({
        id: d.id,
        amount: parseFloat(d.donation_amount.toString()),
        date: d.donation_date,
        payment_id: d.razorpay_payment_id,
        campaign: d.campaign_title || 'General Donation'
      })),
      total_amount: totalAmount,
      amount_in_words: convertNumberToWords(totalAmount)
    }

    // Generate PDF
    const pdfBuffer = await generatePDF('80g-certificate', certificateData)

    // Send email if required
    if (sendEmailFlag) {
      try {
        const emailSubject = `80G Tax Exemption Certificate - ${certificateNumber}`
        const emailBody = generateCertificateEmailBody(certificateData)

        await sendEmail({
          to: userData.email,
          subject: emailSubject,
          html: emailBody,
          attachments: [{
            filename: `80G_Certificate_${certificateNumber.replace(/\//g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        })

      } catch (emailError) {
        console.error('Failed to send 80G certificate email:', emailError)
        return {
          success: true,
          message: '80G certificate generated successfully but email sending failed',
          error: 'EMAIL_SEND_FAILED'
        }
      }
    }

    return {
      success: true,
      message: sendEmailFlag ? '80G certificate generated and sent successfully' : '80G certificate generated successfully'
    }

  } catch (error) {
    console.error('Error generating 80G certificate:', error)
    return {
      success: false,
      message: 'Failed to generate 80G certificate',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    }
  }
}

function getCurrentFinancialYear(): string {
  const now = new Date()
  const year = now.getFullYear()

  if (now.getMonth() >= 3) { // April onwards
    return `${year}-${year + 1}`
  } else { // January to March
    return `${year - 1}-${year}`
  }
}

function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertLessThanThousand(n: number): string {
    if (n === 0) return ''

    let result = ''

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)]
      if (n % 10 > 0) {
        result += ' ' + ones[n % 10]
      }
    } else if (n > 0) {
      result += ones[n]
    }

    return result.trim()
  }

  if (num === 0) return 'Zero'

  let result = ''
  const crores = Math.floor(num / 10000000)
  const lakhs = Math.floor((num % 10000000) / 100000)
  const thousands = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000

  if (crores > 0) {
    result += convertLessThanThousand(crores) + ' Crore '
  }

  if (lakhs > 0) {
    result += convertLessThanThousand(lakhs) + ' Lakh '
  }

  if (thousands > 0) {
    result += convertLessThanThousand(thousands) + ' Thousand '
  }

  if (remainder > 0) {
    result += convertLessThanThousand(remainder)
  }

  return result.trim() + ' Rupees Only'
}

function generateCertificateEmailBody(certificateData: any): string {
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
        <p>Dear ${certificateData.donor.name},</p>
      </div>
     
      <div class="content">
        <p>Thank you for your generous donation(s). We are pleased to provide you with your 80G tax exemption certificate.</p>
       
        <h3>Certificate Details:</h3>
        <ul>
          <li><strong>Certificate Number:</strong> <span class="certificate-number">${certificateData.certificate_number}</span></li>
          <li><strong>Financial Year:</strong> ${certificateData.financial_year}</li>
          <li><strong>Total Donation Amount:</strong> <span class="amount">₹${certificateData.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></li>
          <li><strong>Amount in Words:</strong> ${certificateData.amount_in_words}</li>
          <li><strong>Issue Date:</strong> ${new Date(certificateData.issue_date).toLocaleDateString('en-IN')}</li>
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
        <p><strong>${certificateData.organization.name}</strong><br>
        ${certificateData.organization.address}<br>
        Email: ${certificateData.organization.email}<br>
        Phone: ${certificateData.organization.phone}<br>
        Website: ${certificateData.organization.website}</p>
       
        <p style="margin-top: 15px; font-size: 12px; color: #666;">
          This is an automatically generated email. Please do not reply to this email.
        </p>
      </div>
    </body>
    </html>
  `
}
