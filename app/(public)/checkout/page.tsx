"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowRight,
  Heart,
  CreditCard,
  Shield,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Lock,
  Star,
  Download,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { orderItems } from "@/lib/utils"



export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    panNumber: "",
    anonymous: false,
    newsletter: true,
    terms: false,
  })

  // Calculate subtotal and a dummy tip for demonstration
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tipAmount = 100; // This should come from a state or context in a real application
  const total = subtotal + tipAmount;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Processing donation...", formData)
  }

  return (
    <div className="min-h-screen bg-gray-50">
        

      {/* Mobile Order Summary Toggle */}
      <div className="bg-white border-b border-gray-200 px-3 py-3 lg:hidden">
        <button
          onClick={() => setShowOrderSummary(!showOrderSummary)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {showOrderSummary ? 'Hide' : 'Show'} order summary
            </span>
            <span className="text-sm text-gray-500">
              ({orderItems.reduce((sum, item) => sum + item.quantity, 0)} items)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">₹{total.toLocaleString()}</span>
            {showOrderSummary ? (
              <X className="w-4 h-4 text-gray-600" />
            ) : (
              <Menu className="w-4 h-4 text-gray-600" />
            )}
          </div>
        </button>

        {/* Mobile Order Summary Dropdown */}
        {showOrderSummary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="space-y-3 mb-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1 pr-3">
                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-xs text-green-600">{item.impact}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Tip</span>
                <span className="font-medium">+₹{tipAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl mx-auto py-6 px-3 sm:py-8 sm:px-4 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:text-3xl lg:text-4xl sm:mb-4">
            Complete Your Donation
          </h1>
          <p className="text-base text-gray-600 sm:text-lg lg:text-xl">
            You're just one step away from making a real difference in someone's life.
          </p>
        </motion.div>

        {/* Mobile-First Layout */}
        <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0 xl:gap-12">
          {/* Checkout Form - Mobile First */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Personal Information - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="p-4 shadow-lg sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center sm:text-xl lg:text-2xl sm:mb-6">
                    <User className="w-5 h-5 mr-2 text-green-600 sm:w-6 sm:h-6 sm:mr-3" />
                    Personal Information
                  </h3>

                  <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 md:gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="mt-1"
                        inputMode="email"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="mt-1"
                        inputMode="tel"
                        required
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Address Information - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-4 shadow-lg sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center sm:text-xl lg:text-2xl sm:mb-6">
                    <MapPin className="w-5 h-5 mr-2 text-green-600 sm:w-6 sm:h-6 sm:mr-3" />
                    Address Information
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Address *
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="mt-1"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 md:grid-cols-3 md:gap-6">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                          State *
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">
                          PIN Code *
                        </Label>
                        <Input
                          id="pincode"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange("pincode", e.target.value)}
                          className="mt-1"
                          inputMode="numeric"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="panNumber" className="text-sm font-medium text-gray-700">
                        PAN Number (for 80G Tax Certificate)
                      </Label>
                      <Input
                        id="panNumber"
                        value={formData.panNumber}
                        onChange={(e) => handleInputChange("panNumber", e.target.value)}
                        className="mt-1"
                        placeholder="ABCDE1234F"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Required for tax deduction certificate under Section 80G
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Payment Method - Mobile First */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="p-4 shadow-lg sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center sm:text-xl lg:text-2xl sm:mb-6">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600 sm:w-6 sm:h-6 sm:mr-3" />
                    Payment Method
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Mobile Payment Options - Stacked */}
                    <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 md:grid-cols-3 md:gap-4">
                      {[
                        { id: "card", label: "Credit/Debit Card", icon: CreditCard },
                        { id: "upi", label: "UPI Payment", icon: Phone },
                        { id: "netbanking", label: "Net Banking", icon: Shield },
                      ].map(({ id, label, icon: Icon }) => (
                        <div
                          key={id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all touch-manipulation sm:p-4 ${
                            paymentMethod === id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                          onClick={() => setPaymentMethod(id)}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <Icon className="w-4 h-4 text-gray-600 sm:w-5 sm:h-5" />
                            <span className="font-medium text-sm sm:text-base">{label}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card Details - Mobile Responsive */}
                    {paymentMethod === "card" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 pt-4 border-t"
                      >
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Card Number *</Label>
                          <Input 
                            placeholder="1234 5678 9012 3456" 
                            className="mt-1" 
                            inputMode="numeric"
                            required 
                          />
                        </div>
                        <div className="space-y-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
                          <div className="sm:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Expiry Date *</Label>
                            <Input 
                              placeholder="MM/YY" 
                              className="mt-1" 
                              inputMode="numeric"
                              required 
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">CVV *</Label>
                            <Input 
                              placeholder="123" 
                              className="mt-1" 
                              inputMode="numeric"
                              required 
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Preferences - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="p-4 shadow-lg sm:p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 sm:text-xl lg:text-2xl sm:mb-6">
                    Preferences
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="anonymous"
                        checked={formData.anonymous}
                        onCheckedChange={(checked) => handleInputChange("anonymous", checked as boolean)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="anonymous" className="text-sm text-gray-700 leading-relaxed">
                        Make this donation anonymous
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="newsletter"
                        checked={formData.newsletter}
                        onCheckedChange={(checked) => handleInputChange("newsletter", checked as boolean)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="newsletter" className="text-sm text-gray-700 leading-relaxed">
                        Subscribe to our newsletter for impact updates
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.terms}
                        onCheckedChange={(checked) => handleInputChange("terms", checked as boolean)}
                        required
                        className="mt-0.5"
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                        I agree to the{" "}
                        <Link href="/terms" className="text-green-600 hover:underline cursor-pointer">
                          Terms & Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-green-600 hover:underline cursor-pointer">
                          Privacy Policy
                        </Link>{" "}
                        *
                      </Label>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Mobile Submit Button - Visible only on mobile */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  disabled={!formData.terms}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg"
                  onClick={handleSubmit}
                >
                  <Lock className="w-4 h-4 mr-2 sm:w-5 sm:h-5 sm:mr-3" />
                  Complete Donation ₹{total.toLocaleString()}
                  <ArrowRight className="w-4 h-4 ml-2 sm:w-5 sm:h-5 sm:ml-3" />
                </Button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  By completing this donation, you agree to our terms and conditions. Your payment is processed securely
                  and you'll receive an instant receipt.
                </p>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar - Desktop Only */}
          <div className="order-1 lg:order-2 lg:col-span-1 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sticky top-24 space-y-6"
            >
              {/* Order Items */}
              <Card className="p-6 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Donation</h3>

                <div className="space-y-4 mb-6">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-xs text-green-600">{item.impact}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Tip</span>
                    <span className="font-semibold">+₹{tipAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              {/* Impact Summary */}
              <Card className="p-6 shadow-xl bg-gradient-to-br from-green-50 to-yellow-50">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500 fill-current" />
                  Your Impact
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Supports 3 families for multiple weeks</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Provides 21+ days of nutritious meals</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Includes medical aid and warm clothing</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>Creates lasting positive change</span>
                  </div>
                </div>
              </Card>

              {/* Security & Benefits */}
              <Card className="p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Why Donate With Us?</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-600 mr-2" />
                    <span>100% Secure Payment</span>
                  </div>
                  <div className="flex items-center">
                    <Download className="w-4 h-4 text-green-600 mr-2" />
                    <span>Instant 80G Tax Receipt</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-green-600 mr-2" />
                    <span>Regular Impact Updates</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span>100% Fund Utilization</span>
                  </div>
                </div>
              </Card>

              {/* Complete Donation Button - Desktop */}
              <Button
                type="submit"
                disabled={!formData.terms}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
              >
                <Lock className="w-5 h-5 mr-3" />
                Complete Donation ₹{total.toLocaleString()}
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By completing this donation, you agree to our terms and conditions. Your payment is processed securely
                and you'll receive an instant receipt.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}