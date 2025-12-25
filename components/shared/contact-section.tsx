"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, MessageSquare, ArrowRight, User } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function ContactSection() {
  return (
    <section className="pb-16 px-4 bg-white border-t-2">

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 mt-16">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center text-green-600 mb-4">
            <MessageSquare className="w-5 h-5 mr-2" />
            <span className="font-medium italic">Get In Touch</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h2>
          <p className="text-gray-600 mb-8">
            Dwaparyug Foundation Is One Of India's Leading Humanitarian NGOs — We Support Underprivileged Communities By
            Providing Food, Education, And Compassionate Care To Create Lasting Change And Restore Dignity.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-yellow-500 mr-3 mt-1" />
              <div>
                <div className="font-semibold">Location</div>
                <div className="text-gray-600">719 mehalla mohalla madanpur khadar, delhi</div>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 text-yellow-500 mr-3 mt-1" />
              <div>
                <div className="font-semibold">Phone</div>
                <div className="text-gray-600">+91 99993 03166</div>
              </div>
            </div>

            <div className="flex items-start">
              <Mail className="w-5 h-5 text-yellow-500 mr-3 mt-1" />
              <div>
                <div className="font-semibold">Email</div>
                <div className="text-gray-600">dwaparyugfoundation@gmail.com</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-5 h-5 text-yellow-500 mr-3 mt-1">🌐</div>
              <div>
                <div className="font-semibold">Social</div>
                <div className="flex space-x-2 mt-2">
                  <Link
                    href="#"
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                  >
                    <span className="text-blue-600">f</span>
                  </Link>
                  <Link
                    href="#"
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                  >
                    <span className="text-pink-600">📷</span>
                  </Link>
                  <Link
                    href="#"
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                  >
                    <span className="text-blue-400">🐦</span>
                  </Link>
                  <Link
                    href="#"
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 cursor-pointer"
                  >
                    <span className="text-blue-700">in</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Fill Up The Form</h3>
            <p className="text-gray-600 mb-6">Your Email Address Will Not Be Published. Required Fields Are Marked *</p>

            <form className="space-y-4">
              <div className="relative">
                <Input placeholder="Enter Name" className="pl-10" />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              <div className="relative">
                <Input type="email" placeholder="Enter Email" className="pl-10" />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              <div className="relative">
                <Input placeholder="Phone Number" className="pl-10" />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              <div className="relative">
                <Textarea placeholder="Your Message..." rows={4} className="pl-10" />
                <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-full cursor-pointer">
                Get A Quote
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
