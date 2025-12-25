"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Target, Award, Globe, TrendingUp, Shield, ArrowRight, Star, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { TeamSection } from "@/components/shared/team-section"
import { ContactSection } from "@/components/shared/contact-section"
import { Footer } from "@/components/shared/footer"
import { impactAreas, values } from "@/lib/utils"
import aboutbanner1 from "@/public/images/about-us/aboutbanner1.webp";

const CountUpAnimation = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isVisible) {
      let startTime: number
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
        setCount(Math.floor(progress * end))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [isVisible, end, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50 relative overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 text-green-400 opacity-20"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Heart className="w-40 h-40 fill-current" />
        </motion.div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-blue-100 px-6 py-3 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Users className="w-4 h-4 mr-2 text-green-600" />
              Our Story • Transforming Lives Since 2025
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-500">
                Dwaparyug Foundation
              </span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              We are India's leading humanitarian nonprofit organization, dedicated to creating lasting positive change
              in the lives of underprivileged communities. Through innovative programs and transparent operations, we've
              transformed over 50,000 lives across 200+ villages.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  <CountUpAnimation end={350000} />+
                </div>
                <div className="text-sm text-gray-600">Worth Donations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  <CountUpAnimation end={1200} />+
                </div>
                <div className="text-sm text-gray-600">Unique Donors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  <CountUpAnimation end={10000} />
                </div>
                <div className="text-sm text-gray-600">Lives Impacted</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-full font-semibold cursor-pointer"
                asChild
              >
                <Link href="/causes">
                  <Target className="w-5 h-5 mr-2" />
                  View Our Work
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-full font-semibold cursor-pointer bg-transparent"
                asChild
              >
                <Link href="/contact-us">
                  <Users className="w-5 h-5 mr-2" />
                  Join Our Mission
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <Image
                src={aboutbanner1}
                alt="Dwaparyug Foundation team working with communities"
                width={500}
                height={600}
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Certified NGO</div>
                    <div className="text-sm text-gray-600">80G & 10BE Approved</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-500">
                Mission & Vision
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Guided by our core values and driven by compassion, we work tirelessly to create a world where everyone
              has access to basic necessities and opportunities for growth.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full shadow-xl bg-gradient-to-br from-green-50 to-green-100">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To empower underprivileged communities across India by providing access to quality education,
                  healthcare, nutrition, and sustainable livelihood opportunities. We believe in creating lasting change
                  through community-driven initiatives and transparent, accountable operations.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 h-full shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  A world where every individual, regardless of their background or circumstances, has equal access to
                  opportunities for growth, dignity, and prosperity. We envision thriving communities where poverty,
                  hunger, and inequality are things of the past.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These fundamental principles guide every decision we make and every action we take in our mission to
              create positive change.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card className="p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`w-12 h-12 ${value.bgColor} rounded-full flex items-center justify-center mb-4`}>
                    <value.icon className={`w-6 h-6 ${value.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      {/* <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From humble beginnings to transforming thousands of lives, here's how we've grown and evolved over the
              years.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-400 to-blue-400 rounded-full"></div>

            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`relative flex items-center mb-16 ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? "pr-8" : "pl-8"}`}>
                  <Card className="p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                        <milestone.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{milestone.year}</div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </Card>
                </div>

                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-4 border-white shadow-lg"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Areas of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-500">Impact</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We focus on four key areas where we can make the most significant and lasting impact on communities across
              India.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {impactAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="relative">
                    <Image
                      src={area.image || "/placeholder.svg"}
                      alt={area.title}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
                      {area.impact}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{area.title}</h3>
                    <p className="text-gray-600 mb-4">{area.description}</p>
                    {/* <Button
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer bg-transparent"
                    >
                      Learn More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button> */}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Join Our Mission</h2>
            <p className="text-xl mb-8 opacity-90">
              Together, we can create lasting change and build a better future for communities across India. Every
              contribution, big or small, makes a difference.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold cursor-pointer"
                asChild
              >
                <Link href="/causes">
                  <Heart className="w-5 h-5 mr-2" />
                  Donate Now
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-3 rounded-full text-lg font-semibold cursor-pointer bg-transparent"
                asChild
              >
                <Link href="/contact-us">
                  <Users className="w-5 h-5 mr-2" />
                  Volunteer With Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
