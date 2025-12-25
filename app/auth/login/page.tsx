"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowRight, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/axios.config"

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
})

type AuthStep = "email" | "otp"

export default function UnifiedAuthPage() {
  const [isPending, startTransition] = React.useTransition()
  const [authStep, setAuthStep] = useState<AuthStep>("email")
  const [userEmail, setUserEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  })

  React.useEffect(() => {
    if (authStep === "otp" && countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend, authStep])

  const onSubmit = (data: any) => {
    startTransition(async () => {
      try {
        const response = await api.post("/auth/send-otp", {
          email: data.email
        })

        if (response.status === 200) {
          setUserEmail(data.email)
          setAuthStep("otp")
          toast.success("Verification code sent to your email!")
        }
      } catch (error: any) {
        console.error("Error sending OTP:", error)
        toast.error(error.response?.data?.error || "Failed to send verification code")
      }
    })
  }

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(numericValue)
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP")
      return
    }

    setIsVerifying(true)

    try {
      const response = await api.post("/auth/verify-otp", {
        email: userEmail,
        otp
      })

      if (response.status === 200) {
        toast.success("Verification successful!")
        
        const signInResponse = await signIn('credentials', {
          email: userEmail,
          redirect: false
        })

        if (signInResponse?.ok) {
          // Check if user is a Donor and redirect accordingly
          const userResponse = await api.get("/auth/me")
          if (userResponse.data?.role !== 'admin') {
            window.location.href = "/donate"
          } else {
            window.location.href = "/"
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid OTP. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)

    try {
      const response = await api.post("/auth/send-otp", { email: userEmail })

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6) {
      handleVerifyOTP()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {authStep === "email" ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-6 py-3 text-xl font-bold rounded-lg shadow-lg inline-block mb-6">
                  dwaparyug
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
                <p className="text-gray-600">Enter your email to continue</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                    className="text-center text-lg h-14"
                    autoFocus
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-2">{errors.email.message as string}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-14 text-lg font-semibold"
                  disabled={isPending}
                >
                  {isPending ? "Sending..." : "Send OTP"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  We'll send a verification code to your email. No password required!
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-6 py-3 text-xl font-bold rounded-lg shadow-lg inline-block mb-6">
                  dwaparyug
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h1>
                <p className="text-gray-600 mb-1">
                  We sent a 6-digit code to
                </p>
                <p className="text-green-600 font-semibold text-lg">{userEmail}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-center text-2xl font-mono tracking-widest h-16"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-14 text-lg font-semibold disabled:opacity-50"
                >
                  {isVerifying ? "Verifying..." : "Verify & Sign In"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <div className="text-center space-y-3 pt-2">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?
                  </p>

                  {canResend ? (
                    <Button
                      onClick={handleResendOTP}
                      disabled={isResending}
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                    >
                      {isResending ? "Sending..." : "Resend Code"}
                      <RotateCcw className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Resend in {countdown}s
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setAuthStep("email")
                    setOtp("")
                    setCountdown(60)
                    setCanResend(false)
                  }}
                  variant="ghost"
                  className="w-full text-gray-600 mt-4"
                >
                  ← Change Email
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}