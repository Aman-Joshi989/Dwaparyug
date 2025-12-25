"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, User, Calendar, Package, Heart, ImageIcon, MapPin, FileText, CheckCircle, XCircle, AlertCircle, Globe, MessageSquare, Gift, Edit } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import EditDonationItemModal from "@/components/modals/UpdateEditDonationModal"

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number | string, currency = 'INR') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return numAmount.toLocaleString('en-IN', {
    style: 'currency',
    currency: currency
  })
}

interface DonationUser {
  id: number
  name: string
  email: string
  mobile: string
}

interface CampaignCategory {
  name: string
}

interface Campaign {
  id: number
  title: string
  overview: string
  image: string
  donation_goal: number
  total_raised: number
  progress_percentage: number
  organizer: string
  status: string
  category: CampaignCategory
  location: string
}

interface ProductUnit {
  name: string
  abbreviation: string
}

interface Product {
  independent_product_id: number
  name: string
  description: string
  image: string
  current_campaign_price: number
  unit: ProductUnit
}

interface PersonalizationOption {
  id: number
  donor_name: string
  donor_country: string
  custom_image: string
  is_image_available: boolean
  custom_message: string
  donation_purpose: string
  special_instructions: string
}

interface DonationItem {
  id: number
  campaign_product_id: number
  quantity: number
  price_per_unit: number
  total_price: number
  fulfillment_status: string
  donation_date: string
  product: Product
  personalization: PersonalizationOption | any
  created_at: string
}

interface DonationDetails {
  id: number
  donation_amount: number
  tip_amount: number
  total_amount: number
  donation_type: 'direct' | 'product_based'
  is_public: boolean
  donation_date: string
  insta_id?: string
  video_wishes: string
  donated_on_behalf_of: string
  donor_message: string
  impact_generated: boolean
  beneficiaries_reached: number
  created_at: string
  razorpay_payment_id: string
  razorpay_order_id: string
  payment_status: string
  payment_created_at: string
  payment_currency: string
  total_amount_formatted: string
  donation_amount_formatted: string
  tip_amount_formatted: string
  user: DonationUser | null
  campaign: Campaign
  items: DonationItem[]
}

export default function DonationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const donationId = params?.id as string

  const [donation, setDonation] = useState<DonationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)

  const handleEditItem = (itemId: number) => {
    setSelectedItemId(itemId)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    // Refresh donation details after successful update
    fetchDonationDetails()
  }

  useEffect(() => {
    if (donationId) {
      fetchDonationDetails()
    }
  }, [donationId])

  const fetchDonationDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/donations/${donationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch donation details')
      }

      const data = await response.json()
      if (data.success) {
        setDonation(data.donation)
      } else {
        throw new Error(data.error || 'Failed to load donation')
      }
    } catch (error) {
      console.error('Error fetching donation details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load donation details')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'captured':
      case 'success':
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'pending':
      case 'attempted':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>
      case 'failed':
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />{status || 'Unknown'}</Badge>
    }
  }

  const getFulfillmentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fulfilled':
      case 'completed':
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Fulfilled</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'processing':
      case 'in_batch':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'distributed':
        return <Badge className="bg-purple-100 text-purple-800">Distributed</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading donation details...</p>
        </div>
      </div>
    )
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{error ? 'Error Loading Donation' : 'Donation Not Found'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{error || "The donation you're looking for doesn't exist"}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("🚀 ~ DonationDetailsPage ~ donation:", donation)

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Donation #{donation.id}</h1>
              <p className="text-sm text-muted-foreground">{formatDate(donation.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-bold text-green-600">{donation.total_amount_formatted}</div>
              <div className="text-sm text-muted-foreground">Total Amount</div>
            </div>
            <div>
              {getPaymentStatusBadge(donation.payment_status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Campaign & Donor Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Donor Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Donor Information
              </h3>
              {donation.user ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <div className="font-medium">{donation.user.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <div className="font-medium break-all">{donation.user.email}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Insta Id:</span>
                    <div className="font-medium break-all">{donation.items[0] && donation.items[0]?.personalization && donation.items[0]?.personalization?.insta_id || ''}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Wishing Videos:</span>
                    <div className="font-medium break-all">{donation.items[0] && donation.items[0]?.personalization && donation.items[0]?.personalization?.insta_id || ''}</div>
                  </div>
                  {donation.user.mobile && (
                    <div>
                      <span className="text-muted-foreground">Mobile:</span>
                      <div className="font-medium">{donation.user.mobile}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Anonymous Donor</p>
              )}
            </Card>

            {/* Campaign Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Campaign</h3>
              {donation.campaign.image && (
                <img
                  src={donation.campaign.image}
                  alt={donation.campaign.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <div className="space-y-2 text-sm">
                <h4 className="font-medium">{donation.campaign.title}</h4>
                <p className="text-muted-foreground line-clamp-2">{donation.campaign.overview}</p>
                <div className="pt-2 space-y-1">
                  <div><span className="text-muted-foreground">Category:</span> {donation.campaign.category.name}</div>
                  <div><span className="text-muted-foreground">Organizer:</span> {donation.campaign.organizer}</div>
                  <div><span className="text-muted-foreground">Location:</span> {donation.campaign.location}</div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-4">
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button className="w-full" variant="outline" onClick={() => router.push(`/campaigns/${donation.campaign.id}`)}>
                  <Heart className="w-4 h-4 mr-2" />
                  View Campaign
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Overview Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Donation Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">Amount Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Donation:</span>
                      <span className="font-semibold">{donation.donation_amount_formatted}</span>
                    </div>
                    {donation.tip_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Platform Tip:</span>
                        <span className="font-semibold">{donation.tip_amount_formatted}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-green-600 font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>{donation.total_amount_formatted}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Type:</span>
                      <Badge variant={donation.donation_type === 'direct' ? 'default' : 'secondary'}>
                        {donation.donation_type === 'direct' ? 'Direct' : 'Product Based'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Visibility:</span>
                      <Badge variant={donation.is_public ? 'default' : 'outline'}>
                        {donation.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    {donation.items.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span>Products:</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {donation.items.length} Items
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">Payment</h4>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <div className="mb-1">Payment ID:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded break-all">{donation.razorpay_payment_id || 'N/A'}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>Date: {formatDate(donation.payment_created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {(donation.donor_message || donation.donated_on_behalf_of) && (
                <div className="mt-6 pt-6 border-t space-y-3">
                  {donation.donor_message && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">Donor Message</span>
                      </div>
                      <p className="text-sm italic">"{donation.donor_message}"</p>
                    </div>
                  )}
                  {donation.donated_on_behalf_of && (
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-600" />
                        <span className="font-medium text-sm">Donated On Behalf Of</span>
                      </div>
                      <p className="text-sm font-medium">{donation.donated_on_behalf_of}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Products with Personalization and Donation Date */}
            {donation.items.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Products & Personalization ({donation.items.length})
                </h3>
                <div className="space-y-6">
                  {donation.items.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      {/* Product Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {item.product.image && (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold text-lg">{item.product.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.product.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditItem(item.id)}
                              className="shrink-0"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            {getFulfillmentStatusBadge(item.fulfillment_status)}
                          </div>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                            <div className="font-bold text-lg">{item.quantity} {item.product.unit.abbreviation}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Price per Unit</div>
                            <div className="font-bold text-lg">{formatCurrency(item.price_per_unit)}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Total Price</div>
                            <div className="font-bold text-lg text-green-600">{formatCurrency(item.total_price)}</div>
                          </div>
                          {item.donation_date && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Donation Date
                              </div>
                              <div className="font-semibold text-sm">{formatDate(item.donation_date)}</div>
                            </div>
                          )}
                        </div>

                        {/* Personalization Section */}
                        {item.personalization && (
                          <div className="mt-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-5 rounded-lg border border-purple-200">
                            <h5 className="font-semibold mb-4 flex items-center text-purple-900">
                              <Gift className="w-5 h-5 mr-2 text-purple-600" />
                              Personalization Details
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Column - Personal Info */}
                              {(item.personalization.donor_name || item.personalization.donor_country) && (
                                <div className="space-y-3">
                                  {item.personalization.donor_name && (
                                    <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                      <div className="flex items-start gap-2">
                                        <User className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="text-xs text-muted-foreground mb-1">Donor Name</div>
                                          <div className="font-medium">{item.personalization.donor_name}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {item.personalization.donor_country && (
                                    <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                      <div className="flex items-start gap-2">
                                        <Globe className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="text-xs text-muted-foreground mb-1">Country</div>
                                          <div className="font-medium">{item.personalization.donor_country}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Right Column - Purpose */}
                              {item.personalization.donation_purpose && (
                                <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                                  <div className="flex items-start gap-2">
                                    <Heart className="w-4 h-4 mt-0.5 text-pink-600 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="text-xs text-muted-foreground mb-1">Donation Purpose</div>
                                      <div className="font-medium text-sm">{item.personalization.donation_purpose}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Messages Section */}
                            {(item.personalization.custom_message || item.personalization.special_instructions) && (
                              <div className="mt-4 space-y-3">
                                {item.personalization.custom_message && (
                                  <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <MessageSquare className="w-4 h-4 text-blue-600" />
                                      <div className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Message to be printed</div>
                                    </div>
                                    <p className="text-sm italic text-gray-700 leading-relaxed">"{item.personalization.custom_message}"</p>
                                  </div>
                                )}

                                {item.personalization.special_instructions && (
                                  <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <FileText className="w-4 h-4 text-orange-600" />
                                      <div className="text-xs font-semibold text-orange-900 uppercase tracking-wide">Special Instructions</div>
                                    </div>
                                    <p className="text-sm text-gray-700">{item.personalization.special_instructions}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Custom Image */}
                            {item.personalization.is_image_available && item.personalization.custom_image && (
                              <div className="mt-4 bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                                <div className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4 text-purple-600" />
                                  Custom Image
                                </div>
                                <div className="relative group">
                                  <img
                                    src={item.personalization.custom_image}
                                    alt="Custom personalization"
                                    className="w-full max-h-80 object-contain rounded-lg border-2 border-purple-100 bg-gray-50 transition-transform group-hover:scale-[1.02]"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <EditDonationItemModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        donationItemId={selectedItemId}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}