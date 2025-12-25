'use client';
import { scaleOnHover } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Heart, Gift, Shield, CheckCircle, Zap, Clock } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '../../ui/button';
import Link from 'next/link';
import { useDonationCart } from '@/hooks/useDonationHooks';

const CustomHomeSectionDonation = () => {
  const [selectedAmount, setSelectedAmount] = useState(100)
  const {
    setCustomDonationAmount,
  } = useDonationCart()

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-white relative overflow-hidden">
      <motion.div
        className="absolute top-10 sm:top-20 left-10 sm:left-20 text-red-400 opacity-20"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
      >
        <Heart className="w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20 fill-current" />
      </motion.div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-red-100 to-yellow-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
            <Heart className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-red-500 fill-current" />
            Emergency Appeal • Every Rupee Counts
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Support Emergency Food Relief for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
              Hungry Families
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            With winter approaching, thousands of families in Delhi's slums face severe food insecurity. Your donation
            provides immediate relief - nutritious meals, warm clothing, and hope for a better tomorrow.
          </p>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl mb-8 sm:mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <div className="text-sm sm:text-lg font-semibold text-gray-700">Amount Raised</div>
              <motion.div
                className="text-2xl sm:text-3xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                ₹47,23,700
              </motion.div>
            </div>
            <motion.div
              className="text-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-500">
                47.24%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Completed</div>
            </motion.div>
            <div className="text-center sm:text-right">
              <div className="text-sm sm:text-lg font-semibold text-gray-700">Target Goal</div>
              <motion.div
                className="text-2xl sm:text-3xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                ₹1,00,00,000
              </motion.div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 sm:h-6 mb-6 sm:mb-8 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-red-400 h-4 sm:h-6 rounded-full relative shadow-lg"
              initial={{ width: 0 }}
              whileInView={{ width: "47.24%" }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <motion.div
                className="absolute right-0 top-0 w-6 sm:w-8 h-6 sm:h-8 bg-white rounded-full shadow-lg -mt-1 -mr-1 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Heart className="w-3 sm:w-4 h-3 sm:h-4 text-red-500 fill-current" />
              </motion.div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { amount: 500, impact: "Feeds 1 family for 1 week" },
              { amount: 1000, impact: "Provides warm clothes for 2 children" },
              { amount: 2500, impact: "Supplies medicines for 5 families" },
              { amount: 5000, impact: "Feeds 10 families for 1 week" },
              { amount: 10000, impact: "Sponsors 1 month food for 20 families" },
              { amount: 0, impact: "Custom amount" },
            ].map((option, index) => (
              <motion.button
                key={index}
                onClick={() => setSelectedAmount(option.amount)}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 font-semibold transition-all duration-300 cursor-pointer group ${selectedAmount === option.amount
                  ? "bg-gradient-to-r from-yellow-400 to-red-400 border-transparent text-white shadow-lg"
                  : "border-gray-300 text-gray-700 hover:border-yellow-400 hover:shadow-md"
                  }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <div className="text-sm sm:text-lg font-bold">{option.amount === 0 ? "Custom" : `₹${option.amount}`}</div>
                <div className="text-xs mt-1 opacity-80 hidden sm:block">{option.impact}</div>
              </motion.button>
            ))}
          </div>

          <div className="text-center space-y-4">
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-red-400 hover:from-yellow-500 hover:to-red-500 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-lg sm:text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
              {...scaleOnHover}
              onClick={() => setCustomDonationAmount(selectedAmount)}
              asChild
            >
              <Link href="/donate">
                <Gift className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
                Donate ₹{selectedAmount || "Custom Amount"} Now
                <Heart className="w-5 sm:w-6 h-5 sm:h-6 ml-2 sm:ml-3 fill-current" />
              </Link>
            </Button>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-green-600" />
                100% Secure Payment
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-green-600" />
                Tax Deductible (80G)
              </div>
              <div className="flex items-center">
                <Zap className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-yellow-600" />
                Instant Receipt
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
        >
          <Button
            variant="outline"
            className="border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 cursor-pointer bg-transparent text-sm sm:text-base"
            {...scaleOnHover}
            asChild
          >
            <Link href="/donate">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
              Set Up Monthly Donation (24/7 Support)
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default CustomHomeSectionDonation