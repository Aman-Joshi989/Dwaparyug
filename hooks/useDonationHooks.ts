// hooks/useDonationHooks.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface CartItem {
  productId: number
  campaignId: number
  campaignTitle: string
  name: string
  price: number
  quantity: number
  unit?: string
  image?: string
  maxQty?: number
  stock?: number
  description?: string
  personalization?: {
    donationDate: string
    donorName: string
    donorCountry: string
    mobileNumber: string
    donatedOnBehalfOf?: string
    customImage?: string
    customMessage?: string
    donationPurpose?: string
    specialInstructions?: string
    isAnonymous: boolean
    instaId?: string
    videoWishes?: string
  }
}

export interface DonationFormData {
  donorName?: string
  donorCountry: string
  mobileNumber: string
  customMessage?: string
  donationPurpose?: string
  specialInstructions?: string
  donatedOnBehalfOf?: string
  donorMessage?: string
  videoWishes?: string
  instaId?: string
  isPublic: boolean
  isAnonymous: boolean
  customAmount?: number
  tipAmount: number
  tipPercentage?: number
  customImage?: File | string
}

const CART_STORAGE_KEY = 'donationCart'
const FORM_DATA_STORAGE_KEY = 'donationFormData'
const CUSTOM_DONATION_STORAGE_KEY = 'customDonationAmount'

const getCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY)
    return cart ? JSON.parse(cart) : []
  } catch (error) {
    console.error('Error reading cart from localStorage:', error)
    return []
  }
}

const saveCartToStorage = (cart: CartItem[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }))
  } catch (error) {
    console.error('Error saving cart to localStorage:', error)
  }
}

const getFormDataFromStorage = (): Partial<DonationFormData> => {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(FORM_DATA_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Error reading form data from localStorage:', error)
    return {}
  }
}

const saveFormDataToStorage = (formData: Partial<DonationFormData>) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formData))
  } catch (error) {
    console.error('Error saving form data to localStorage:', error)
  }
}

const getCustomDonationFromStorage = (): number => {
  if (typeof window === 'undefined') return 0
  try {
    const amount = localStorage.getItem(CUSTOM_DONATION_STORAGE_KEY)
    return amount ? parseFloat(amount) : 0
  } catch (error) {
    console.error('Error reading custom donation from localStorage:', error)
    return 0
  }
}

const saveCustomDonationToStorage = (amount: number) => {
  if (typeof window === 'undefined') return
  try {
    if (amount > 0) {
      localStorage.setItem(CUSTOM_DONATION_STORAGE_KEY, amount.toString())
    } else {
      localStorage.removeItem(CUSTOM_DONATION_STORAGE_KEY)
    }
  } catch (error) {
    console.error('Error saving custom donation to localStorage:', error)
  }
}

export const useDonationCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customDonationAmount, setCustomDonationAmountState] = useState<number>(0)

  useEffect(() => {
    setCartItems(getCartFromStorage())
    setCustomDonationAmountState(getCustomDonationFromStorage())

    const handleCartUpdate = (event: CustomEvent) => {
      setCartItems(event.detail)
    }

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener)
    }
  }, [])

  const setCustomDonationAmount = useCallback((amount: number) => {
    setCustomDonationAmountState(amount)
    saveCustomDonationToStorage(amount)
  }, [])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    const cart = getCartFromStorage()
    const existingIndex = cart.findIndex(
      cartItem => cartItem.productId === item.productId && cartItem.campaignId === item.campaignId
    )

    if (existingIndex > -1) {
      const maxQty = item.maxQty || item.stock || 999
      if (cart[existingIndex].quantity < maxQty) {
        cart[existingIndex].quantity += 1
      }
    } else {
      cart.push({ ...item, quantity: 1 })
    }

    saveCartToStorage(cart)
    setCartItems(cart)
    return cart
  }, [])

  const removeFromCart = useCallback((productId: number, campaignId: number) => {
    const cart = getCartFromStorage()
    const existingIndex = cart.findIndex(
      cartItem => cartItem.productId === Number(productId) && cartItem.campaignId === Number(campaignId)
    )

    if (existingIndex > -1) {
      if (cart[existingIndex].quantity > 1) {
        cart[existingIndex].quantity -= 1
      } else {
        cart.splice(existingIndex, 1)
      }
    }

    saveCartToStorage(cart)
    setCartItems(cart)
    return cart
  }, [])

  const updateQuantity = useCallback((productId: number, campaignId: number, newQuantity: number) => {
    const cart = getCartFromStorage()
    const existingIndex = cart.findIndex(
      cartItem => cartItem.productId === Number(productId) && cartItem.campaignId === Number(campaignId)
    )

    if (existingIndex > -1) {
      if (newQuantity <= 0) {
        cart.splice(existingIndex, 1)
      } else {
        const maxQty = cart[existingIndex].maxQty || cart[existingIndex].stock || 999
        cart[existingIndex].quantity = Math.min(newQuantity, maxQty)
      }

      saveCartToStorage(cart)
      setCartItems(cart)
    }

    return cart
  }, [])

  const clearCart = useCallback(() => {
    saveCartToStorage([])
    setCartItems([])
    setCustomDonationAmount(0)
  }, [setCustomDonationAmount])

  const clearCampaignCart = useCallback((campaignId: number) => {
    const cart = getCartFromStorage()
    const filteredCart = cart.filter(item => item.campaignId !== campaignId)
    saveCartToStorage(filteredCart)
    setCartItems(filteredCart)
    return filteredCart
  }, [])

  const getItemQuantity = useCallback((productId: number, campaignId: number): number => {
    const item = cartItems.find(
      cartItem => cartItem.productId === Number(productId) && cartItem.campaignId === Number(campaignId)
    )
    return item ? item.quantity : 0
  }, [cartItems])

  const getCartTotals = useCallback(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueCampaigns = new Set(cartItems.map(item => item.campaignId)).size

    return {
      subtotal,
      totalItems,
      uniqueCampaigns,
      itemCount: cartItems.length,
      customDonationAmount,
      totalDonationAmount: subtotal + customDonationAmount
    }
  }, [cartItems, customDonationAmount])

  const getItemsByCampaign = useCallback(() => {
    return cartItems.reduce((acc, item) => {
      if (!acc[item.campaignId]) {
        acc[item.campaignId] = {
          campaignTitle: item.campaignTitle,
          items: []
        }
      }
      acc[item.campaignId].items.push(item)
      return acc
    }, {} as Record<number, { campaignTitle: string; items: CartItem[] }>)
  }, [cartItems])

  return {
    cartItems,
    customDonationAmount,
    setCustomDonationAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearCampaignCart,
    getItemQuantity,
    getCartTotals,
    getItemsByCampaign
  }
}

export const useDonationForm = () => {
  const [formData, setFormData] = useState<Partial<DonationFormData>>({})

  useEffect(() => {
    setFormData(getFormDataFromStorage())
  }, [])

  const updateFormData = useCallback((newData: Partial<DonationFormData>) => {
    const updatedData = { ...formData, ...newData }
    setFormData(updatedData)
    saveFormDataToStorage(updatedData)
  }, [formData])

  const clearFormData = useCallback(() => {
    setFormData({})
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FORM_DATA_STORAGE_KEY)
      localStorage.removeItem(CUSTOM_DONATION_STORAGE_KEY)
    }
  }, [])

  const getTipAmount = useCallback((subtotal: number) => {
    if (formData.tipAmount) return formData.tipAmount
    if (formData.tipPercentage) return Math.floor(subtotal * (formData.tipPercentage / 100))
    return 0
  }, [formData.tipAmount, formData.tipPercentage])

  return {
    formData,
    updateFormData,
    clearFormData,
    getTipAmount
  }
}

export const usePayment = () => {
  const { data: session, status } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const createPaymentOrder = useCallback(async (donationData: {
    cartItems: CartItem[]
    customDonationId?: number
    formData: DonationFormData
    totalAmount: number
    donationAmount: number
    tipAmount: number
  }) => {
    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Check authentication
      if (status === 'unauthenticated') {
        throw new Error('Please login to make a donation')
      }

      if (!session?.user) {
        throw new Error('User session not found')
      }

      // Add user ID to donation data
      const dataWithUser = {
        ...donationData,
        userId: session.user.id
      }

      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment order')
      }

      const result = await response.json()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment creation failed'
      setPaymentError(errorMessage)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [session, status])

  const processPaymentSuccess = useCallback(async (paymentData: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => {
    setIsProcessing(true)
    setPaymentError(null)

    try {
      if (status === 'unauthenticated') {
        throw new Error('Please login to complete the donation')
      }

      const response = await fetch('/api/donations/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process payment')
      }

      const result = await response.json()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed'
      setPaymentError(errorMessage)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [status])

  return {
    isProcessing,
    paymentError,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user: session?.user,
    createPaymentOrder,
    processPaymentSuccess
  }
}

export const useDonation = () => {
  const cart = useDonationCart()
  const form = useDonationForm()
  const payment = usePayment()

  return {
    ...cart,
    ...form,
    ...payment
  }
}