"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Heart,
  ArrowRight,
  Gift,
  Target,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
  X,
  Package,
  Zap,
  Edit2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDonationCart, useDonationForm } from "@/hooks/useDonationHooks"
import ProductPersonalizationModal from "@/components/ProductPersonalizationModal"

export default function CartPage() {
  const router = useRouter()
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
    getItemsByCampaign
  } = useDonationCart()

  const { updateFormData } = useDonationForm()

  const [selectedTip, setSelectedTip] = useState<number | 'custom' | null>(5)
  const [customTipValue, setCustomTipValue] = useState("")
  const [isClearing, setIsClearing] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { subtotal, totalItems, uniqueCampaigns, totalDonationAmount } = getCartTotals()

  // Calculate tip amount
  const getTipAmount = () => {
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
  }

  const tipAmount = getTipAmount()
  const grandTotal = totalDonationAmount + tipAmount

  const handleQuantityChange = (productId: number, campaignId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId, campaignId)
    } else {
      updateQuantity(productId, campaignId, newQuantity)
    }
  }

  const handleRemoveItem = (productId: number, campaignId: number) => {
    removeFromCart(productId, campaignId)
  }

  const handleClearCart = async () => {
    setIsClearing(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    clearCart()
    setSelectedTip(5)
    setCustomTipValue("")
    setIsClearing(false)
  }

  const handleEditProduct = (item: any, campaignId: number) => {
    setEditingProduct({
      ...item,
      id: item.productId,
      productId: item.productId,
      campaignId,
      campaignTitle: Object.entries(getItemsByCampaign()).find(
        ([cId]) => cId === campaignId.toString()
      )?.[1]?.campaignTitle || ""
    })
    setIsEditModalOpen(true)
  }
  const handleSaveProductEdit = (updatedProduct: any) => {
    // Update quantity if changed
    if (updatedProduct.quantity !== editingProduct.quantity) {
      updateQuantity(editingProduct.productId, editingProduct.campaignId, updatedProduct.quantity)
    }
    setIsEditModalOpen(false)
    setEditingProduct(null)
  }

  const handleProceedToDonate = () => {
    updateFormData({
      tipAmount: tipAmount,
      tipPercentage: typeof selectedTip === 'number' ? selectedTip : undefined
    })

    router.push('/donate')
  }

  const itemsByCampaign = getItemsByCampaign()

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4">

          {/* Empty Cart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 sm:py-12"
          >
            <div className="mb-6">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">Add some products to get started.</p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center px-4">
              <Link href="/causes" className="w-full sm:w-auto">
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold w-full sm:w-auto">
                  Browse Campaigns
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 md:py-8 px-2 sm:px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Your Donation Cart</h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Review your items and proceed to make a difference
          </p>

          {/* Cart Summary Pills */}
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 md:gap-4 mt-3 sm:mt-4 px-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs px-2 py-1 whitespace-nowrap">
              {totalItems} Product{totalItems !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs px-2 py-1 whitespace-nowrap">
              {uniqueCampaigns} Campaign{uniqueCampaigns !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs px-2 py-1 whitespace-nowrap">
              ₹{grandTotal.toLocaleString()} Total
            </Badge>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-6">

            {/* Product Items by Campaign */}
            <AnimatePresence>
              {Object.entries(itemsByCampaign).map(([campaignId, campaign], index) => (
                <motion.div
                  key={campaignId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center min-w-0 flex-1">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="max-w-[200px] sm:max-w-[300px]">
                              <h3 className="font-semibold text-sm sm:text-base leading-tight truncate">
                                {campaign.campaignTitle}
                              </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 font-normal">
                              {campaign.items.length} item{campaign.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs sm:text-sm self-start sm:self-auto">
                          ₹{campaign.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      {campaign.items.map((item) => (
                        <motion.div
                          key={`${item.productId}-${item.campaignId}`}
                          layout
                          className="bg-gray-50 rounded-lg"
                        >
                          {/* Mobile Layout */}
                          <div className="sm:hidden">
                            <div className="flex items-start space-x-3 mb-3">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={50}
                                    height={50}
                                    className="rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 text-sm leading-tight truncate">
                                      {item.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                      ₹{item.price.toLocaleString()}{item.unit && ` per ${item.unit}`}
                                    </p>
                                    {item.description && (
                                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                        {item.description}
                                      </p>
                                    )}
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => handleEditProduct(item, parseInt(campaignId))}
                                      className="h-auto p-0 text-xs text-blue-600 mt-2"
                                    >
                                      <Edit2 className="w-3 h-3 mr-1" />
                                      Edit details
                                    </Button>
                                  </div>
                                  {/* Remove button - top right */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.productId, item.campaignId)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>

                                {/* Stock Warning */}
                                {item.stock && item.quantity >= item.stock * 0.8 && (
                                  <div className="flex items-center mt-2">
                                    <AlertTriangle className="w-3 h-3 text-orange-500 mr-1 flex-shrink-0" />
                                    <span className="text-xs text-orange-600">
                                      Only {item.stock - item.quantity} left
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls and Total - Bottom row */}
                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.productId, item.campaignId, item.quantity - 1)}
                                  className="h-7 w-7 p-0"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>

                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1
                                    handleQuantityChange(item.productId, item.campaignId, newQuantity)
                                  }}
                                  className="w-12 h-7 text-center text-xs"
                                  min="1"
                                  max={item.maxQty || item.stock || 999}
                                />

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.productId, item.campaignId, item.quantity + 1)}
                                  className="h-7 w-7 p-0"
                                  //@ts-ignore
                                  disabled={
                                    (item.maxQty && item.quantity >= item.maxQty) ||
                                    (item.stock && item.quantity >= item.stock)
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Item Total */}
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-900 text-sm">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:block">
                            <div className="flex items-center space-x-4">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={60}
                                    height={60}
                                    className="rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-grow min-w-0">
                                <h4 className="font-medium text-gray-900 text-base truncate">{item.name}</h4>
                                <p className="text-sm text-gray-500">
                                  ₹{item.price.toLocaleString()}{item.unit && ` per ${item.unit}`}
                                </p>
                                {item.description && (
                                  <p className="text-xs text-gray-400 truncate mt-1">
                                    {item.description}
                                  </p>
                                )}
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleEditProduct(item, parseInt(campaignId))}
                                  className="h-auto p-0 text-xs text-blue-600 mt-1"
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  Edit donation details
                                </Button>

                                {/* Stock Warning */}
                                {item.stock && item.quantity >= item.stock * 0.8 && (
                                  <div className="flex items-center mt-1">
                                    <AlertTriangle className="w-3 h-3 text-orange-500 mr-1 flex-shrink-0" />
                                    <span className="text-xs text-orange-600">
                                      Only {item.stock - item.quantity} left
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.productId, item.campaignId, item.quantity - 1)}
                                  className="h-8 w-8 p-0"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>

                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 1
                                    handleQuantityChange(item.productId, item.campaignId, newQuantity)
                                  }}
                                  className="w-16 h-8 text-center text-sm"
                                  min="1"
                                  max={item.maxQty || item.stock || 999}
                                />

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.productId, item.campaignId, item.quantity + 1)}
                                  className="h-8 w-8 p-0"
                                  //@ts-ignore
                                  disabled={
                                    (item.maxQty && item.quantity >= item.maxQty) ||
                                    (item.stock && item.quantity >= item.stock)
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              {/* Item Total */}
                              <div className="text-right min-w-0">
                                <p className="font-semibold text-gray-900">
                                  ₹{(item.price * item.quantity).toLocaleString()}
                                </p>
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.productId, item.campaignId)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear Cart Button */}
            {totalItems > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  disabled={isClearing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isClearing ? 'Clearing...' : 'Clear Cart'}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-6"
            >
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
                    Donation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-0">
                  {/* Donation Breakdown */}
                  <div className="space-y-2 sm:space-y-3">
                    {subtotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Products Total</span>
                        <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                      </div>
                    )}

                    {totalDonationAmount > 0 && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Subtotal</span>
                          <span className="font-medium">₹{totalDonationAmount.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tip Section */}
                  {totalDonationAmount > 0 && (
                    <div className="space-y-3 pt-3 sm:pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">Add a tip?</span>
                        <Badge variant="secondary" className="text-xs">
                          Optional
                        </Badge>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600">
                        Support our platform to help more people in need
                      </p>

                      {/* Tip Options */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {[5, 10, 15].map((percentage) => (
                          <Button
                            key={percentage}
                            variant={selectedTip === percentage ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedTip(percentage)
                              setCustomTipValue("")
                            }}
                            className="text-xs h-8"
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
                          className="text-xs h-8"
                        >
                          Custom
                        </Button>
                      </div>

                      {/* Custom Tip Input */}
                      {selectedTip === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="relative"
                        >
                          <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
                          <Input
                            type="number"
                            placeholder="Enter tip amount"
                            value={customTipValue}
                            onChange={(e) => setCustomTipValue(e.target.value)}
                            className="pl-8 text-sm h-10"
                            min="0"
                            max={totalDonationAmount}
                          />
                        </motion.div>
                      )}

                      {/* Clear Tip Button */}
                      {(selectedTip !== null || customTipValue) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTip(null)
                            setCustomTipValue("")
                          }}
                          className="w-full text-xs text-gray-500 h-8"
                        >
                          No tip
                        </Button>
                      )}

                      {/* Tip Amount Display */}
                      {tipAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tip Amount</span>
                          <span className="font-medium text-green-600">₹{tipAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Final Total */}
                  {grandTotal > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-bold">Total</span>
                        <span className="text-lg sm:text-xl font-bold text-green-600">
                          ₹{grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Impact Preview */}
                  {totalDonationAmount > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-2">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-blue-700">
                          Estimated Impact
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-blue-600">
                        Your donation could help approximately{' '}
                        <span className="font-semibold">
                          {Math.floor(totalDonationAmount / 100)} people
                        </span>{' '}
                        in need
                      </p>
                    </div>
                  )}

                  {/* Proceed Button */}
                  <Button
                    onClick={handleProceedToDonate}
                    disabled={grandTotal <= 0}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold w-full h-11 sm:h-12 text-sm sm:text-base  "
                    size="lg"
                  >
                    <span className=" flex-1 text-start ">
                      Proceed to Donate
                    </span>
                    {grandTotal > 0 && (
                      <span className="block sm:inline sm:ml-2 text-xs sm:text-sm">
                        ₹{grandTotal.toLocaleString()}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />

                  </Button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-gray-600">
                    <span>Secured by</span>
                    <img
                      src="/images/razorpay.avif"
                      alt="Razorpay"
                      style={{ width: '75px', height: '20px' }}
                      className="inline"
                    />

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
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