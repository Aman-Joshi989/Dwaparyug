'use client';
import { Button } from '@/components/ui/button'
import { scaleOnHover } from '@/lib/utils'
import { motion, useInView } from 'framer-motion'
import { TrendingUp, Users, ArrowRight } from 'lucide-react'
import React from 'react'
import { CountUpAnimation } from './counter-up';
import Link from 'next/link';


const ImpactSection = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        style={{
          backgroundImage:
            'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="%23000"/></svg>\')',
          backgroundSize: "50px 50px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-yellow-100 to-green-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
            <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-green-600" />
            Our Impact Across India • Real Numbers, Real Change
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Transforming Lives Through{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-yellow-500">
              Collective Action
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Every number represents a life changed, a family empowered, and a community strengthened.
            Join Lakhs of compassionate donors in creating lasting positive impact.
          </p>
        </motion.div>


        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-gray-900 mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
          >
            <CountUpAnimation end={50000} />+
          </motion.div>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 font-medium px-4">
            Compassionate Donors Supporting Our Mission Worldwide
          </p>

          <Button
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-8 sm:px-10 lg:px-12 py-3 sm:py-4 rounded-full text-base sm:text-lg lg:text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
            {...scaleOnHover}
            asChild
          >
            <Link href="/community">
              <Users className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
              Join Our Community of Change-Makers
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 ml-2 sm:ml-3" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>)
}

export default ImpactSection