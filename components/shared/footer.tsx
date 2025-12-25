"use client"

import Image from "next/image";
import logo from "@/public/images/logo/logo.png";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, MapPin, Phone, Mail, Send, Facebook, Instagram, Twitter, Linkedin, ArrowRight, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link";

export function Footer() {
  const [email, setEmail] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handleSubmit = async () => {
    if (!email || !agreed) {
      setStatus({ type: 'error', message: 'Please enter email and agree to terms' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({ type: 'success', message: data.message })
        setEmail("")
        setAgreed(false)
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to subscribe' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-6 mb-16 lg:mb-0">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-black fill-current" />
                </div>
              </div>
              <div>
                <Image
                  src={logo}
                  alt="Dwaparyug Foundation Logo"
                  height={50}
                  width={199}
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">On His Path Of Dharma</p>

            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer w-full sm:w-auto"
              asChild
            >
              <Link href="/donate">
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Donate Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-gray-700 font-medium">Address</div>
                  <div className="text-gray-600">719 Mehalla Mohalla, Madanpur Khadar</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-gray-700 font-medium">Phone</div>
                  <div className="text-gray-600">+91 99993 03166</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-gray-700 font-medium">Email</div>
                  <div className="text-gray-600">dwaparyugfoundation@gmail.com</div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Newsletter</h4>
            <p className="text-gray-600 text-sm leading-relaxed">Stay updated with our latest initiatives and community events</p>

            <div className="space-y-3">
              <div className="flex">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  disabled={loading}
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-r-none text-sm h-10"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !email || !agreed}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-l-none h-10 px-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center text-xs">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={loading}
                  className="mr-2 accent-yellow-400"
                />
                <label htmlFor="agree" className="text-gray-600 cursor-pointer">I agree to Terms & Privacy Policy</label>
              </div>

              {status && (
                <div className={`text-xs p-2 rounded flex items-center gap-2 ${
                  status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {status.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {status.message}
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Connect</h4>
            <div className="flex space-x-2">
              {[
                { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61575709810420", color: "hover:bg-blue-500 hover:text-white" },
                { icon: Instagram, href: "https://www.instagram.com/dwaparyugfoundation/", color: "hover:bg-pink-500 hover:text-white" },
                { icon: Twitter, href: "https://x.com/Dwapar_yug_", color: "hover:bg-blue-400 hover:text-white" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/dwaparyug-foundation/", color: "hover:bg-blue-600 hover:text-white" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 ${social.color} transition-all duration-300 border border-gray-200`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors block">Support</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors block">Terms & Conditions</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors block">Privacy Policy</a>
            </div>
            <div className="text-xs text-gray-500">
              <div>Hours: Mon-Fri</div>
              <div>9:30am - 6:30pm</div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
          <p>© 2025 Dwaparyug Foundation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}