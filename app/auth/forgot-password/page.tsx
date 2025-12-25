'use client';

import React, { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Shield, Timer, Heart } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

// Schemas for each step
const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
})

const resetSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6, { message: "OTP must be 6 digits." }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP & Reset
  const [email, setEmail] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Form for step 1 (email)
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  })

  // Form for step 2 (otp and password reset)
  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    mode: "onBlur",
    defaultValues: { otp: "", newPassword: "", confirmPassword: "" },
  })

  // Step 1: Send OTP
  const onSendOTP = async (data: any) => {
    setIsPending(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (response.ok) {
        setEmail(data.email)
        setStep(2)
        setCountdown(600) // 10 minutes countdown
        startCountdown()
        toast.success("Password reset OTP sent to your email!")
      } else {
        toast.error(result.error || "Failed to send OTP")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  // Step 2: Reset password
  const onResetPassword = async (data: any) => {
    setIsPending(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp: data.otp,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Password reset successfully! Please login with your new password.")
        router.push('/auth/login')
      } else {
        toast.error(result.error || "Failed to reset password")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  // Countdown timer
  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Format countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setIsPending(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })

      const result = await response.json()

      if (response.ok) {
        setCountdown(600)
        startCountdown()
        toast.success("New OTP sent to your email!")
      } else {
        toast.error(result.error || "Failed to resend OTP")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      {/* Background Decorations */}
      <motion.div
        className="absolute top-20 left-20 text-red-400 opacity-20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Shield className="w-32 h-32 fill-current" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-20 text-orange-400 opacity-20"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Heart className="w-24 h-24 fill-current" />
      </motion.div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Information */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-6 py-4 text-lg font-bold rounded-lg shadow-lg inline-block">
              dwaparyug
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Reset Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
              Password
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-lg">
            Don't worry, it happens to everyone! We'll send you a secure OTP to reset your password 
            and get you back to making a difference.
          </p>

          <div className="space-y-4 max-w-md">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-gray-700">Enter your email address</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-gray-700">Receive secure OTP via email</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-gray-700">Set your new password</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Reset Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600">Enter your email to receive a reset OTP</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...emailForm.register("email")}
                        className="mt-2"
                      />
                      {emailForm.formState.errors.email && (
                        <p className="text-red-600 text-sm mt-1">
                          {emailForm.formState.errors.email.message as string}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      onClick={emailForm.handleSubmit(onSendOTP)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 text-lg font-semibold"
                      disabled={isPending}
                    >
                      {isPending ? "Sending..." : "Send Reset OTP"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-600">
                      Enter the OTP sent to <strong>{email}</strong> and your new password
                    </p>
                    {countdown > 0 && (
                      <div className="flex items-center justify-center mt-2 text-sm text-orange-600">
                        <Timer className="w-4 h-4 mr-1" />
                        OTP expires in {formatTime(countdown)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="otp" className="text-sm font-medium text-gray-700">
                        6-Digit OTP
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        {...resetForm.register("otp")}
                        className="mt-2 text-center text-lg font-mono tracking-widest"
                      />
                      {resetForm.formState.errors.otp && (
                        <p className="text-red-600 text-sm mt-1">
                          {resetForm.formState.errors.otp.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        New Password
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...resetForm.register("newPassword")}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {resetForm.formState.errors.newPassword && (
                        <p className="text-red-600 text-sm mt-1">
                          {resetForm.formState.errors.newPassword.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        Confirm New Password
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...resetForm.register("confirmPassword")}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {resetForm.formState.errors.confirmPassword && (
                        <p className="text-red-600 text-sm mt-1">
                          {resetForm.formState.errors.confirmPassword.message as string}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1"
                        disabled={isPending}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        onClick={resetForm.handleSubmit(onResetPassword)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        disabled={isPending}
                      >
                        {isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </div>

                    {countdown === 0 && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                          disabled={isPending}
                        >
                          Didn't receive OTP? Resend
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-red-600 hover:text-red-700 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}