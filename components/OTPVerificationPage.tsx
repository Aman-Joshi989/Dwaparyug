"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Shield, ArrowRight, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { api } from "@/lib/axios.config"
import { signIn } from "next-auth/react"

interface OTPVerificationPageProps {
  email: string;
}

export default function OTPVerificationPage({ email }: OTPVerificationPageProps) {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  // Handle OTP input change (only numbers)
  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(numericValue)
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP")
      return
    }

    setIsVerifying(true)

    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        otp
      })

      if (response.status === 200) {
        toast.success("Email verified successfully!")

        // Auto sign-in after successful verification
        const signInResponse = await signIn('credentials', {
          email,
          password: '', // You might need to handle this differently
          redirect: false
        })
        window.location.reload()
        window.location.replace('/')

      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid OTP. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setIsResending(true)

    try {
      const response = await api.post("/auth/send-otp", { email })

      if (response.status === 200) {
        toast.success("New OTP sent to your email")
        setCountdown(60)
        setCanResend(false)
        setOtp("")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend OTP")
    } finally {
      setIsResending(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleVerifyOTP()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <motion.div
        className="absolute top-20 right-20 text-blue-400 opacity-20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Shield className="w-28 h-28 fill-current" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-20 text-purple-400 opacity-20"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      >
        <div className="w-20 h-20 bg-purple-400 transform rotate-45 rounded-lg"></div>
      </motion.div>

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 py-2 text-lg font-bold rounded-lg shadow-lg inline-block">
                  dwaparyug
                </div>
              </div>

              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verify Your Email
              </h1>

              <p className="text-gray-600 mb-2">
                We've sent a 6-digit verification code to
              </p>
              <p className="text-blue-600 font-semibold">{email}</p>
            </div>

            {/* OTP Input */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                  Enter Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => handleOtpChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="mt-2 text-center text-xl font-mono tracking-wider"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerifyOTP}
                disabled={isVerifying || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Resend Section */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>

                {canResend ? (
                  <Button
                    onClick={handleResendOTP}
                    disabled={isResending}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {isResending ? "Sending..." : "Resend Code"}
                    <RotateCcw className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Resend code in {countdown} seconds
                  </p>
                )}
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Security Note
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      The verification code expires in 10 minutes. If you don't see the email,
                      check your spam folder.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}