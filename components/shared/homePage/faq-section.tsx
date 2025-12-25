import { Card } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'

const Faqsection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
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
        "As you complete your donation successfully, Please fill in your PAN number, complete address, and name as per PAN and submit. Your 80G certificate will be generated and sent via email within one month.",
    },
    {
      question: "How often will I receive updates about my donation?",
      answer:
        "You'll receive immediate confirmation, weekly progress updates, and detailed impact reports. For larger donations, we also provide personalized updates and site visit opportunities.",
    },
    {
      question: "Can I change or take back my donation?",
      answer:
        "Your money is a donation to a good cause, not a purchase. Once you've donated, the money can't be refunded. The only exception is if we accidentally charge you more than once; if that happens, we'll refund the extra amount.",
    },
  ]

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
            Get answers to common questions about our donation process and platform.
          </p>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-2 sm:p-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900  ">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Faqsection