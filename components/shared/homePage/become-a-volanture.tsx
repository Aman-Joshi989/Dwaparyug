import { motion } from 'framer-motion'
import { Heart, HandHeart,   ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Beomecolanture = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-10 left-10 text-pink-400 opacity-10"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 0.9, 1]
        }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <Heart className="w-24 h-24" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-10 text-blue-400 opacity-10"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <HandHeart className="w-28 h-28" />
      </motion.div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Link
            href="/volunteer"
            className="inline-flex items-center bg-gradient-to-r from-pink-100 to-purple-100 px-6 py-3 rounded-full text-sm font-medium text-gray-700 mb-6 hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <HandHeart className="w-4 h-4 mr-2 text-pink-600" />
            Join Our Cause • Make a Difference
            <ArrowRight className="w-4 h-4 ml-2 text-pink-600 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Become a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              Volunteer
            </span>{" "}
            Today
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our community of dedicated volunteers and help us create meaningful change.
            Every hour you contribute makes a lasting impact on someone's life.
          </p>
        </motion.div>
      </div>
    </section>)
}

export default Beomecolanture