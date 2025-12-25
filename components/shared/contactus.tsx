"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageSquare,
  User,
  Building,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { contactReasons, officeLocations } from "@/lib/utils"

type ContactUsProps = {
  isHomePage?: boolean;
};

const ContactComponent: React.FC<ContactUsProps> = ({ isHomePage = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    reason: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Message sent successfully! We will get back to you soon.'
        })
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          organization: "",
          reason: "",
          message: "",
        })
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Failed to send message. Please try again.'
        })
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      })
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
      // Clear status message after 5 seconds
      setTimeout(() => {
        setSubmitStatus({ type: null, message: '' })
      }, 5000)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {!isHomePage &&
        <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
          <motion.div
            className="absolute top-10 sm:top-16 md:top-20 right-4 sm:right-12 md:right-20 text-blue-400 opacity-20"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <MessageSquare className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32" />
          </motion.div>
          <div className="max-w-7xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-green-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-600" />
                Get In Touch • We're Here to Help
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
                Contact{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                  Our Team
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
                Have questions about our work, want to volunteer, or need support with donations? We'd love to hear from
                you. Our dedicated team is ready to assist you in making a positive impact.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Call Us</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">24/7 Support Available</p>
                  <p className="text-sm sm:text-base text-blue-600 font-semibold">+91 99993 03166</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Email Us</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">Quick Response Guaranteed</p>
                  <p className="text-sm sm:text-base text-green-600 font-semibold">dwaparyugfoundation@gmail.com</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center sm:col-span-2 md:col-span-1"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">Location</p>
                  <p className="text-sm sm:text-base text-purple-600 font-semibold">Delhi </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      }

      {/* Contact Form & Info Section */}
      <section className="py-12 !pt-10 sm:py-16 md:py-20 px-3 sm:px-4">
        <h2 className="max-w-7xl mx-auto flex text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900">
            Reach out to us. We are here to help you!
          </span>
        </h2>
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 mt-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="order-1 lg:order-1"
          >
            <Card className="p-4 sm:p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Send Us a Message</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                Fill out the form below and we'll get back to you within 24 hours. All fields marked with * are
                required.
              </p>

              {/* Status Message */}
              {submitStatus.type && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 p-4 rounded-lg flex items-start ${
                    submitStatus.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{submitStatus.message}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      className="mt-1 sm:mt-2 text-sm sm:text-base"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className="mt-1 sm:mt-2 text-sm sm:text-base"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      className="mt-1 sm:mt-2 text-sm sm:text-base"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization" className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                      <Building className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Organization (Optional)
                    </Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => updateFormData("organization", e.target.value)}
                      className="mt-1 sm:mt-2 text-sm sm:text-base"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Reason for Contact *
                  </Label>
                  <Select 
                    value={formData.reason} 
                    onValueChange={(value) => updateFormData("reason", value)} 
                    disabled={isSubmitting}
                    required
                  >
                    <SelectTrigger className="mt-1 sm:mt-2 text-sm sm:text-base">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactReasons.map((reason) => (
                        <SelectItem key={reason} value={reason} className="text-sm sm:text-base">
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-xs sm:text-sm font-medium text-gray-700">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => updateFormData("message", e.target.value)}
                    className="mt-1 sm:mt-2 text-sm sm:text-base"
                    rows={4}
                    placeholder="Tell us how we can help you..."
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-2 sm:py-3 text-sm sm:text-lg font-semibold cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Office Locations */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="order-2 lg:order-2 space-y-6 sm:space-y-8"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Our Offices</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
                Visit us at any of our office locations. Our team is always ready to welcome you and discuss how we can
                work together to create positive change.
              </p>
            </div>

            {officeLocations.map((office, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">{office.city}</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-600">{office.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-600">{office.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-600">{office.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-600">{office.hours}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 sm:mt-4 w-full cursor-pointer bg-transparent text-sm sm:text-base"
                    onClick={() => window.open(office.mapUrl, "_blank")}
                  >
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    View on Map
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default ContactComponent;