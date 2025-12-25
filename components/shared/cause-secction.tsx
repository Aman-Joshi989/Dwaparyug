import { motion } from 'framer-motion'
import { HandHeart, Users, Gift, Heart, ArrowRight, Target } from 'lucide-react'
import React from 'react'
import { scaleOnHover, } from '@/lib/utils'
import { Button } from '../ui/button'
import Link from "next/link"
import CampaignList from '@/app/(public)/causes/page'

const impactStats = [
  {
    icon: <Gift className="w-8 h-8" />,
    value: "₹47 Lakh+",
    label: "Worth Donations"
  },
  {
    icon: <Heart className="w-8 h-8" />,
    value: "26K +",
    label: "Lives Impacted"
  },
  {
    icon: <Users className="w-8 h-8" />,
    value: "30,000+",
    label: "Unique Donors"
  },
  {
    icon: <Target className="w-8 h-8" />,
    value: "30+",
    label: "Successful Campaigns"
  }
]

const CauseSection = () => {

  return (
    <section className="py-12 sm:py-16 lg:py-20 pb-0 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {impactStats.map((stat, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-2xl bg-white border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center text-blue-600 mb-3">
                {stat.icon}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mb-6 sm:mb-16 w-full"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-green-100 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 mb-4 sm:mb-6">
            <HandHeart className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 text-blue-600" />
            Active Campaigns • Make a Direct Impact
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900">
              Causes you can support
            </span>{" "}
          </h2>
        </motion.div>

        <CampaignList
          title=""
          showHeader={false}
          showCategoryFilter={true}
          showSearch={false}
          showPagination={false}
          showViewToggle={false}
          defaultViewMode="grid"
          maxItems={8}
          className=" "
          cate
        />

        <motion.div
          className="text-center mt-8 sm:mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
        >
          <Button
            variant="outline"
            className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-all duration-300 cursor-pointer bg-transparent text-sm sm:text-base"
            {...scaleOnHover}
            asChild
          >
            <Link href="/causes">
              <Target className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
              View All Active Campaigns
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-1 sm:ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default CauseSection