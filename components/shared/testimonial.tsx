"use client";
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  MapPin,
  Heart,
  Users
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { testimonials } from "@/lib/utils";

const scaleOnHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 }
}
 
export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 3

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + itemsPerPage) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + itemsPerPage) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - itemsPerPage + testimonials.length) % testimonials.length)
  }

  const visibleTestimonials = [
    testimonials[currentIndex % testimonials.length],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length]
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <motion.div
        className="absolute top-20 right-20 text-blue-400 opacity-10"
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Heart className="w-24 sm:w-32 lg:w-40 h-24 sm:h-32 lg:h-40 fill-current" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-20 text-green-400 opacity-10"
        animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
      >
        <Users className="w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32" />
      </motion.div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-green-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
            <Quote className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-blue-600" />
            Real Stories • Real Impact • Real Change
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Voices of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
              Hope & Change
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from the volunteers, beneficiaries, and supporters whose lives have been transformed through our collective efforts.
            Every story represents countless more waiting to be written.
          </p>
        </motion.div>

        {/* Testimonials Slider */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visibleTestimonials.map((testimonial, index) => (
                <motion.div
                  key={`${currentIndex}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:shadow-xl transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{testimonial.name}</h5>
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3 italic mb-4">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <div className="flex items-center text-gray-500 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {testimonial.location}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-blue-600 text-white border-blue-600 hover:bg-blue-700 w-12 h-12 cursor-pointer shadow-lg"
              onClick={prevSlide}
              {...scaleOnHover}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(testimonials.length / itemsPerPage) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * itemsPerPage)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    Math.floor(currentIndex / itemsPerPage) === index
                      ? "bg-gradient-to-r from-blue-600 to-green-500 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-green-600 text-white border-green-600 hover:bg-green-700 w-12 h-12 cursor-pointer shadow-lg"
              onClick={nextSlide}
              {...scaleOnHover}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-12 sm:mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-base sm:text-lg text-gray-600 mb-6">
            Ready to create your own story of impact? Join thousands of compassionate individuals making a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              {...scaleOnHover}
            >
              <Heart className="w-5 h-5 mr-2 fill-current" />
              Start Your Journey Today
            </Button>
            <Button
              variant="outline"
              className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 cursor-pointer bg-transparent"
              {...scaleOnHover}
            >
              Share Your Story
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}