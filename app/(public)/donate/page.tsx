"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Heart,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Package,
  Camera,
  Loader2,
  Edit2,
  LogIn,
  ShieldAlert
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useDonationCart, usePayment } from "@/hooks/useDonationHooks"
import toast from "react-hot-toast"
import { fileToBase64, createPreviewUrl, uploadImages } from '@/lib/helper-function'
import ProductPersonalizationModal from '@/components/ProductPersonalizationModal'
import { useSession } from 'next-auth/react'

const countries = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
]

export default function DonatePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
    getItemsByCampaign
  } = useDonationCart()

  const {
    createPaymentOrder,
    processPaymentSuccess,
    isProcessing,
    paymentError,
    isAuthenticated,
    isLoading: authLoading
  } = usePayment()

  // State management
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    donorName: '',
    donorCountry: 'IN',
    mobileNumber: '',
    donatedOnBehalfOf: '',
    customMessage: '',
    donationPurpose: '',
    specialInstructions: '',
    isAnonymous: false,
    customAmount: 0,
    instaId: '',
    videoWishes: ''
  })

  // Payment state
  const [selectedTip, setSelectedTip] = useState<number | 'custom' | null>(5)
  const [customTipValue, setCustomTipValue] = useState("")
  const [customDonationAmount, setCustomDonationAmount] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)

  const totalSteps = 3
  const { subtotal, totalItems, uniqueCampaigns, totalDonationAmount } = getCartTotals()
  const customAmount = useMemo(() => parseFloat(customDonationAmount) || 0, [customDonationAmount])
  const itemsByCampaign = useMemo(() => getItemsByCampaign(), [getItemsByCampaign])
  const hasProducts = totalItems > 0

  // Populate form with user data when session loads
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        donorName: session.user.name || prev.donorName,
        mobileNumber: (session.user as any).mobile_no || prev.mobileNumber
      }))
    }
  }, [session])

  // Calculate tip
  const calculateTipAmount = useCallback(() => {
    let tipValue = 0
    if (selectedTip === 'custom' && customTipValue) {
      const value = parseFloat(customTipValue)
      if (!isNaN(value) && value > 0) {
        tipValue = Math.min(value, totalDonationAmount)
      }
    } else if (typeof selectedTip === 'number') {
      tipValue = totalDonationAmount * (selectedTip / 100)
    }
    return Math.floor(tipValue)
  }, [selectedTip, customTipValue, totalDonationAmount])

  const tipAmount = useMemo(() => calculateTipAmount(), [calculateTipAmount])
  const grandTotal = totalDonationAmount + tipAmount

  // Load Razorpay
  useEffect(() => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      setIsRazorpayLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setIsRazorpayLoaded(true)
    script.onerror = () => setIsRazorpayLoaded(false)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const previewUrl = createPreviewUrl(file)
      setImageFile(file)
      setImagePreview(previewUrl)
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Error processing image. Please try again.')
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleQuantityChange = (productId: number, campaignId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, campaignId)
    } else {
      updateQuantity(productId, campaignId, newQuantity)
    }
  }

  const handleEditProduct = (item: any, campaignId: number) => {
    setEditingProduct({
      ...item,
      campaignId,
      campaignTitle: Object.entries(itemsByCampaign).find(
        ([cId]) => cId === campaignId.toString()
      )?.[1]?.campaignTitle || ""
    })
    setIsEditModalOpen(true)
  }

  const handleSaveProductEdit = (updatedProduct: any) => {
    if (updatedProduct.quantity !== editingProduct.quantity) {
      updateQuantity(editingProduct.productId, editingProduct.campaignId, updatedProduct.quantity)
    }
    setIsEditModalOpen(false)
    setEditingProduct(null)
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1 && !hasProducts) {
      if (!formData.donorName || formData.donorName.trim() === '') {
        newErrors.donorName = 'Full name is required'
      }
      if (!formData.mobileNumber) {
        newErrors.mobileNumber = 'Mobile number is required'
      } else if (!/^[\d+\-\s()]*$/.test(formData.mobileNumber)) {
        newErrors.mobileNumber = 'Please enter a valid mobile number'
      }
    }

    if (step === 2) {
      if (!hasProducts && totalDonationAmount <= 0) {
        newErrors.customAmount = 'Please enter a donation amount greater than ₹0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }


  const handlePayment = async () => {
    // Check authentication first
    if (!isAuthenticated || !session?.user?.id) {
      toast.error('Please login to make a donation')
      router.push(`/auth/login?callbackUrl=${encodeURIComponent('/donate')}`)
      return
    }

    if (!validateStep(2)) return

    setIsSubmitting(true)
    try {
      let uploadedImageUrl = undefined

      if (imageFile) {
        const uploadedUrls = await uploadImages([imageFile])
        uploadedImageUrl = uploadedUrls[0]
      }

      if (!isRazorpayLoaded || typeof (window as any).Razorpay === 'undefined') {
        toast.error('Payment system is loading. Please wait and try again.')
        return
      }

      // IMPORTANT: Pass user_id explicitly in the request
      const orderData = await createPaymentOrder({
        userId: parseInt(session.user.id), // Explicitly pass user ID
        cartItems: cartItems,
        customDonationId: 0,
        formData: {
          ...formData,
          customAmount: customAmount,
          customImage: uploadedImageUrl,
          tipAmount: tipAmount,
        },
        totalAmount: grandTotal,
        donationAmount: totalDonationAmount,
        tipAmount: tipAmount
      })

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dwaparyug Foundation",
        description: "Donation Payment",
        order_id: orderData.orderId,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },
        handler: async function (response: any) {
          try {
            await processPaymentSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })

            clearCart()
            setCurrentStep(3)
            toast.success('Payment successful! Thank you for your donation.')
          } catch (error) {
            console.error('Payment processing failed:', error)
            toast.error('Payment verification failed. Please contact support.')
            setIsSubmitting(false)
          }
        },
        prefill: {
          name: formData.donorName || session?.user?.name || '',
          contact: formData.mobileNumber || '',
          email: session?.user?.email || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
          }
        }
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment initiation failed:', error)
      toast.error('Failed to initiate payment. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-12 h-12 text-yellow-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">Authentication Required</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Please login to your account to make a donation. This helps us provide you with donation receipts and track your contribution history.
            </p>

            <div className="flex gap-3 justify-center">
              <Link href={`/auth/login?callbackUrl=${encodeURIComponent('/donate')}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login to Continue
                </Button>
              </Link>

              <Link href="/auth/signup">
                <Button variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>

            <div className="mt-8">
              <Link href="/causes">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Campaigns
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Empty cart message
  if (!hasProducts && customAmount === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
            <p className="text-gray-600">Items you've selected for donation</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started.</p>

            <Link href="/causes">
              <Button className='bg-yellow-400 hover:bg-yellow-500 text-black font-bold'>Browse Campaigns</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }
  // CONTINUED IN PART 2...
  // MAIN DONATION FLOW (CONTINUED FROM PART 1)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Donation</h1>
            <Badge variant="outline">Step {currentStep} of {totalSteps}</Badge>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{hasProducts ? 'Review' : 'Personal Info'}</span>
            <span>Payment</span>
            <span>Complete</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Personal Info or Review Products */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 mb-8"
            >
              {!hasProducts ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Your Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Full Name *</label>
                        <Input
                          placeholder="Enter your full name"
                          value={formData.donorName}
                          onChange={(e) => updateFormData({ donorName: e.target.value })}
                        />
                        {errors.donorName && <p className="text-red-500 text-sm mt-1">{errors.donorName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Country *</label>
                        <select
                          value={formData.donorCountry}
                          onChange={(e) => updateFormData({ donorCountry: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {countries.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Mobile Number *</label>
                      <Input
                        placeholder="Enter your mobile number"
                        value={formData.mobileNumber}
                        maxLength={15}
                        onChange={(e) => {
                          const input = e.target.value
                          if (/^[\d+\-\s()]*$/.test(input)) {
                            updateFormData({ mobileNumber: input })
                          }
                        }}
                      />
                      {errors.mobileNumber && <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Donating on behalf of someone?</label>
                      <Input
                        placeholder="Enter name if applicable"
                        value={formData.donatedOnBehalfOf}
                        onChange={(e) => updateFormData({ donatedOnBehalfOf: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-900">Get a photograph printed</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {imagePreview ? (
                          <div className="relative">
                            <Image
                              src={imagePreview}
                              alt="Custom upload"
                              width={200}
                              height={150}
                              className="mx-auto rounded-lg object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">Upload a custom image</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id="image-upload"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose Image
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={(e) => updateFormData({ isAnonymous: e.target.checked })}
                      />
                      <label htmlFor="isAnonymous" className="text-sm text-gray-900">Donate anonymously</label>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      Review Your Donation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(itemsByCampaign).map(([campaignId, campaign]: [string, any]) => (
                      <div key={campaignId}>
                        <h3 className="font-semibold text-gray-900 mb-3">{campaign.campaignTitle}</h3>
                        <div className="space-y-3">
                          {campaign.items.map((item: any) => (
                            <motion.div
                              key={`${item.productId}-${item.campaignId}`}
                              className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={50}
                                    height={50}
                                    className="rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-500">
                                    ₹{item.price.toLocaleString()} × {item.quantity}
                                  </p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleEditProduct(item, parseInt(campaignId))}
                                    className="h-auto p-0 text-xs text-blue-600 mt-1"
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Edit details
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.productId, item.campaignId)}
                                className="h-8 w-8 p-0 text-red-500 ml-2"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 mb-8"
            >
              {!hasProducts && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle>Enter Donation Amount</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Donation Amount *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                        <Input
                          type="number"
                          placeholder="Enter donation amount"
                          value={customDonationAmount}
                          onChange={(e) => {
                            setCustomDonationAmount(e.target.value)
                            updateFormData({ customAmount: parseFloat(e.target.value) || 0 })
                          }}
                          className="pl-8"
                          min="1"
                        />
                      </div>
                      {errors.customAmount && <p className="text-red-500 text-sm mt-1">{errors.customAmount}</p>}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 block mb-2">Quick Select:</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[500, 1000, 2500, 5000].map((amount) => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomDonationAmount(amount.toString())
                              updateFormData({ customAmount: amount })
                            }}
                            className={customDonationAmount === amount.toString() ? 'border-blue-500 bg-blue-100' : ''}
                          >
                            ₹{amount.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Donation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subtotal > 0 && (
                    <div className="flex justify-between">
                      <span>Products Total</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                  )}

                  {customAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Direct Donation</span>
                      <span>₹{customAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {(subtotal > 0 || customAmount > 0) && <Separator />}

                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>₹{totalDonationAmount.toLocaleString()}</span>
                  </div>

                  {tipAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Platform Tip</span>
                      <span>₹{tipAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {tipAmount > 0 && <Separator />}

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Tip Section */}
              {totalDonationAmount > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Add a tip?</span>
                      <Badge variant="secondary">Optional</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">Support our platform to help more people in need</p>

                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15].map((percentage) => (
                        <Button
                          key={percentage}
                          variant={selectedTip === percentage ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedTip(percentage)
                            setCustomTipValue("")
                          }}
                        >
                          {percentage}%
                        </Button>
                      ))}
                      <Button
                        variant={selectedTip === 'custom' ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedTip('custom')
                          setCustomTipValue("")
                        }}
                      >
                        Custom
                      </Button>
                    </div>

                    {selectedTip === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative">
                        <span className="absolute left-3 top-3 text-gray-500 text-sm">₹</span>
                        <Input
                          type="number"
                          placeholder="Enter tip amount"
                          value={customTipValue}
                          onChange={(e) => setCustomTipValue(e.target.value)}
                          className="pl-8"
                          min="0"
                        />
                      </motion.div>
                    )}

                    {tipAmount > 0 && (
                      <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
                        <span>Tip Amount</span>
                        <span className="font-medium text-green-600">₹{tipAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700">{paymentError}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="space-y-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>

                <h2 className="text-3xl font-bold text-gray-900">Thank You!</h2>
                <p className="text-gray-600">Your donation has been successfully processed.</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700">
                    <span className="font-medium">Total Amount:</span> ₹{grandTotal.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3 justify-center pt-4">
                  <Button onClick={() => router.push('/causes')}>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate Again
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/')}>
                    Back Home
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 3 && (
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? () => router.push('/cart') : handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Back to Cart' : 'Previous'}
            </Button>

            <div className="flex gap-4">
              {currentStep < 2 && (
                <Button onClick={handleNext} className='bg-yellow-400 hover:bg-yellow-500 text-black font-semibold' disabled={isSubmitting}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  className='bg-yellow-400 hover:bg-yellow-500 text-black font-semibold'
                  onClick={handlePayment}
                  disabled={isSubmitting || isProcessing || !isRazorpayLoaded || grandTotal <= 0}
                >
                  {!isRazorpayLoaded ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading Payment...
                    </>
                  ) : isSubmitting || isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ₹{grandTotal.toLocaleString()}
                      <CreditCard className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductPersonalizationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingProduct(null)
          }}
          product={editingProduct}
          onAddToCart={handleSaveProductEdit}
          isEdit={true}
        />
      )}
    </div>
  )
}