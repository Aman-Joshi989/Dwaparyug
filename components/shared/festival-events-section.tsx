"use client"
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import CampaignList from '@/app/(public)/causes/page';

export function FestivalEventsSection() {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-10 right-10 text-purple-400 opacity-20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Gift className="w-24 h-24" />
      </motion.div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full text-sm font-medium text-gray-700 mb-4">
            <Calendar className="w-4 h-4 mr-2 text-purple-600" />
            Festival Campaigns • Celebrate with Purpose
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Upcoming{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Festival Events
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join us in spreading joy during festivals by supporting families in need. Every festival becomes more
            meaningful when we share happiness with those who need it most.
          </p>
        </motion.div>

        {/* Use the reusable CampaignList component */}
        <CampaignList
          title="" // Don't show title since we have our custom header
          showHeader={false}
          showCategoryFilter={false}
          showSearch={false}
          showPagination={false} // Don't show pagination for festival section
          showViewToggle={false} // Don't show view toggle, keep it as grid
          defaultViewMode="grid"
          maxItems={8} // Show only 8 campaigns in festival section
          className=" "
          categoryFilter={7}
          cate
        />

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
            <p className="text-gray-600 mb-4 max-w-xl mx-auto text-sm">
              Want to organize a festival celebration for your community? We can help you create a custom campaign for
              any festival or special occasion.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-full font-semibold cursor-pointer text-sm"
                asChild
              >
                <Link href="/campaigns">
                  <Star className="w-4 h-4 mr-2" />
                  View All Causes
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-6 py-2 rounded-full font-semibold cursor-pointer bg-transparent text-sm"
                asChild
              >
                <Link href="/festivals">
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Events
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}