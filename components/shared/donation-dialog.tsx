"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, Heart, Gift, User, Phone, Globe, MessageSquare, ImageIcon } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { motion } from "framer-motion"

interface DonationDialogProps {
  trigger: React.ReactNode
  productTitle: string
  productPrice: number
  onConfirm: (data: DonationFormData) => void
}

interface DonationFormData {
  specialMessage: string
  donorName: string
  mobileNumber: string
  country: string
  donationDate: Date | undefined
  dedicationImage?: File
  isAnonymous: boolean
}

const countries = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "UAE",
  "Other",
]

export function DonationDialog({ trigger, productTitle, productPrice, onConfirm }: DonationDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<DonationFormData>({
    specialMessage: "",
    donorName: "",
    mobileNumber: "",
    country: "",
    donationDate: undefined,
    isAnonymous: false,
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.donationDate || !formData.mobileNumber || !formData.country) {
      alert("Please fill all required fields")
      return
    }

    const finalData = {
      ...formData,
      dedicationImage: selectedImage || undefined,
    }

    onConfirm(finalData)
    setOpen(false)
  }

  const updateFormData = (field: keyof DonationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Gift className="w-6 h-6 mr-3 text-purple-600" />
            Complete Your Donation
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Product Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{productTitle}</h3>
            <div className="text-2xl font-bold text-purple-600">₹{productPrice.toLocaleString()}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Special Message */}
            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Special Message (Optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Add a personal message or dedication..."
                value={formData.specialMessage}
                onChange={(e) => updateFormData("specialMessage", e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Dedication Image */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center mb-2">
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Dedication Image (Optional)
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="max-w-full h-32 object-cover mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                      }}
                      className="cursor-pointer"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload a photo to dedicate this donation</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                        Choose Image
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Donor Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="donorName" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Your Name (Optional)
                </Label>
                <Input
                  id="donorName"
                  placeholder="Enter your name"
                  value={formData.donorName}
                  onChange={(e) => updateFormData("donorName", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="mobile" className="text-sm font-medium text-gray-700 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Mobile Number *
                </Label>
                <Input
                  id="mobile"
                  placeholder="+91 9999999999"
                  value={formData.mobileNumber}
                  onChange={(e) => updateFormData("mobileNumber", e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
            </div>

            {/* Country and Date */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Country *
                </Label>
                <Select value={formData.country} onValueChange={(value) => updateFormData("country", value)} required>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Donation Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-2 justify-start text-left font-normal cursor-pointer bg-transparent"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.donationDate ? format(formData.donationDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.donationDate}
                      onSelect={(date) => updateFormData("donationDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) => updateFormData("isAnonymous", e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="anonymous" className="text-sm text-gray-700">
                Make this donation anonymous
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 cursor-pointer">
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold cursor-pointer"
              >
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Proceed to Payment
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
