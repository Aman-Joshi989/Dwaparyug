"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Linkedin, Twitter, Mail, Award, Users, Heart, HandHeart, Calendar, MapPin, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { teamMembers } from "@/lib/utils"

export function TeamSection() {
  return (
    <>
      {/* Team Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 right-20 text-green-400 opacity-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Users className="w-32 h-32" />
        </motion.div>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-green-100 px-6 py-3 rounded-full text-sm font-medium text-gray-700 mb-6">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Meet Our Team • Dedicated Change-Makers
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              The{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                Heart & Soul
              </span>{" "}
              Behind Our Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our passionate team of social workers, doctors, and community leaders work tirelessly to create lasting
              positive change in the lives of those who need it most.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card className="h-full overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white">
                  <div className="relative overflow-hidden">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={300}
                      height={300}
                      className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <div className="flex space-x-3">
                        <Link
                          href={member.social.linkedin}
                          className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                        >
                          <Linkedin className="w-5 h-5 text-blue-700" />
                        </Link>
                        <Link
                          href={member.social.twitter}
                          className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                        >
                          <Twitter className="w-5 h-5 text-blue-400" />
                        </Link>
                        <Link
                          href={`mailto:${member.social.email}`}
                          className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                        >
                          <Mail className="w-5 h-5 text-gray-700" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                    <div className="text-green-600 font-semibold mb-3">{member.role}</div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{member.bio}</p>
                    <div className="space-y-2 mb-4">
                      {member.achievements.map((achievement, idx) => (
                        <div key={idx} className="flex items-center text-xs text-gray-500">
                          <Award className="w-3 h-3 mr-2 text-yellow-500" />
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                    {/* <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white cursor-pointer bg-transparent"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button> */}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </>
  )
}