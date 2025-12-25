"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Heart,
  Shield,
  CheckCircle,
  ArrowRight,
  Users,
  Target,
  Award,
  Star,
  Gift,
  Eye,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ContactSection } from "@/components/shared/contact-section"
import { Footer } from "@/components/shared/footer"
import { donationTypes, features, steps } from "@/lib/utils"




export default function HowItWorksPage() {
  const images = ["cause", "impact", "secure", "track"];
  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-br from-purple-50 to-blue-50 relative overflow-hidden">
        <motion.div
          className="absolute top-10 sm:top-20 right-4 sm:right-20 text-purple-400 opacity-20"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Target className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40" />
        </motion.div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center bg-gradient-to-r from-purple-100 to-blue-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-purple-600" />
              Simple Process • Maximum Impact
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              How{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                Donation
              </span>{" "}
              Works
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              Our transparent, secure, and efficient donation process ensures that your contribution creates maximum
              impact. From discovery to tracking, we make giving simple and meaningful.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold cursor-pointer w-full sm:w-auto"
                asChild
              >
                <Link href="/causes">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Start Donating
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold cursor-pointer bg-transparent w-full sm:w-auto"
                asChild
              >
                <Link href="#process">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  See Process
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Steps Section */}
      <section id="process" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              Simple{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                4-Step Process
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Our streamlined donation process makes it easy for you to support causes you care about while ensuring
              complete transparency and maximum impact.
            </p>
          </motion.div>

          <div className="space-y-12 sm:space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:grid lg:grid-cols-2 gap-8 sm:gap-12 items-center ${index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
                  }`}
              >
                {/* Content Section */}
                <div className={`order-1 ${index % 2 === 1 ? "lg:col-start-2 lg:order-2" : "lg:order-1"}`}>
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 ${step.bgColor} rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0`}>
                      <step.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${step.color}`} />
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-300">0{step.step}</div>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{step.title}</h3>
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6">{step.description}</p>
                  <ul className="space-y-2 sm:space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Image Section */}

                <div
                  className={`order-2 w-full ${index % 2 === 1 ? "lg:col-start-1 lg:order-1" : "lg:order-2"
                    }`}
                >
                  <Card className="p-4 sm:p-6 md:p-8 shadow-2xl bg-gradient-to-br from-gray-50 to-white">
                    <Image
                      src={`/images/how-it-works/${images[step.step - 1]}.webp`}
                      alt={step.title}
                      width={500}
                      height={400}
                      className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg"
                    />
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              Why Choose{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-500">
                Our Platform
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              We've built our platform with donors in mind, ensuring security, transparency, and ease of use at every
              step of your giving journey.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card className="p-4 sm:p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{feature.description}</p>
                  <div className="text-xs sm:text-sm font-semibold text-purple-600">{feature.stats}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Types Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
              Choose Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-500">
                Giving Style
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Whether you prefer one-time contributions or ongoing support, we have options that fit your giving
              preferences and maximize your impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {donationTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card
                  className={`p-6 sm:p-8 h-full shadow-xl hover:shadow-2xl transition-all duration-300 relative ${type.popular ? "border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50" : "bg-white"
                    }`}
                >
                  {type.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <div className="text-center mb-4 sm:mb-6">
                    <div
                      className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center mb-3 sm:mb-4 ${type.popular
                        ? "bg-gradient-to-r from-purple-500 to-blue-500"
                        : "bg-gradient-to-r from-green-100 to-blue-100"
                        }`}
                    >
                      <type.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${type.popular ? "text-white" : "text-purple-600"}`} />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{type.type}</h3>
                    <p className="text-sm sm:text-base text-gray-600">{type.description}</p>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {type.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                        <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-2 sm:py-3 rounded-full font-semibold cursor-pointer text-sm sm:text-base ${type.popular
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                      }`}
                    asChild
                  >
                    <Link href="/causes">
                      Get Started
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </Link>
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-500">
                  Security
                </span>{" "}
                is Our Priority
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
                We use industry-leading security measures to protect your personal information and ensure your donations
                reach their intended recipients safely and efficiently.
              </p>

              <div className="space-y-4 sm:space-y-6">
                {[
                  {
                    icon: Shield,
                    title: "SSL Encryption",
                    description: "All transactions are protected with 256-bit SSL encryption",
                  },
                  {
                    icon: CheckCircle,
                    title: "Verified Campaigns",
                    description: "Every campaign is verified by our field teams before going live",
                  },
                  {
                    icon: Eye,
                    title: "Complete Transparency",
                    description: "Track your donation from payment to impact with real-time updates",
                  },
                  {
                    icon: Award,
                    title: "Certified Organization",
                    description: "80G and 10BE certified with regular audits and compliance",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 w-full"
            >
              <Card className="p-4 sm:p-6 md:p-8 shadow-2xl bg-white">
                <Image
                  src="/images/how-it-works/trusted.webp"
                  alt="Security and trust features"
                  width={500}
                  height={400}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg mb-4 sm:mb-6"
                />
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Trusted by 50,000+ Donors</h3>
                  <div className="flex justify-center space-x-1 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    "The transparency and ease of use make this the best platform for charitable giving. I can see
                    exactly how my donations are being used."
                  </p>
                  <div className="text-xs sm:text-sm text-gray-500">- Verified Donor Review</div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {/* <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Frequently Asked Questions</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
              Get answers to common questions about our donation process and platform.
            </p>
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            {[
              {
                question: "How do I know my donation is being used properly?",
                answer:
                  "We provide complete transparency through real-time tracking, regular photo/video updates, impact reports, and direct communication from beneficiaries. You can see exactly how your donation is being utilized.",
              },
              {
                question: "Is my payment information secure?",
                answer:
                  "Yes, we use industry-standard 256-bit SSL encryption for all transactions. We never store your payment information on our servers and work with certified payment gateways.",
              },
              {
                question: "Can I get a tax deduction for my donation?",
                answer:
                  "Yes, all donations are eligible for tax deduction under Section 80G. You'll receive an instant digital certificate that you can use for tax filing.",
              },
              {
                question: "How often will I receive updates about my donation?",
                answer:
                  "You'll receive immediate confirmation, weekly progress updates, and detailed impact reports. For larger donations, we also provide personalized updates and site visit opportunities.",
              },
              {
                question: "Can I cancel or modify my recurring donation?",
                answer:
                  "Yes, you can modify or cancel recurring donations at any time through your donor dashboard or by contacting our support team.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">{faq.question}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Call to Action Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">Ready to Make a Difference?</h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 px-4">
              Join thousands of compassionate donors who are creating positive change across India. Your contribution,
              no matter the size, can transform lives.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                className="bg-white text-purple-600 hover:bg-gray-100 px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold cursor-pointer w-full sm:w-auto"
                asChild
              >
                <Link href="/causes">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Start Donating Now
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold cursor-pointer bg-transparent w-full sm:w-auto"
                asChild
              >
                <Link href="/contact-us">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>


    </div>
  )
}