"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, HandHeart, ArrowRight, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

interface VolunteerOpportunity {
  id: number
  title: string
  description: string
  image: string
  location: string
  timeCommitment: string
  category: string
  participants: number
  link: string
  tags?: string[]
  urgency?: 'high' | 'medium' | 'low'
  skillsRequired?: string[]
}

interface VolunteerCardProps {
  opportunity: VolunteerOpportunity
  index?: number
  showFullDescription?: boolean
  size?: 'small' | 'medium' | 'large'
}

export function VolunteerCard({ 
  opportunity, 
  index = 0, 
  showFullDescription = false,
  size = 'medium' 
}: VolunteerCardProps) {
  const sizeClasses = {
    small: {
      card: 'h-auto',
      image: 'h-32',
      title: 'text-lg',
      content: 'p-4'
    },
    medium: {
      card: 'h-full',
      image: 'h-48',
      title: 'text-xl',
      content: 'p-6'
    },
    large: {
      card: 'h-full',
      image: 'h-64',
      title: 'text-2xl',
      content: 'p-8'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="cursor-pointer"
    >
      <Card className={`${currentSize.card} overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border-0`}>
        <div className="relative overflow-hidden">
          <Image
            src={opportunity.image || "/placeholder.svg"}
            alt={opportunity.title}
            width={300}
            height={200}
            className={`w-full ${currentSize.image} object-cover transition-transform duration-500 hover:scale-110`}
          />
          
          {/* Category Badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
            {opportunity.category}
          </div>
          
          {/* Participants Badge */}
          <div className="absolute bottom-4 left-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {opportunity.participants} volunteers
          </div>

          {/* Urgency Badge */}
          {opportunity.urgency && (
            <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium ${
              opportunity.urgency === 'high' ? 'bg-red-500 text-white' :
              opportunity.urgency === 'medium' ? 'bg-yellow-500 text-white' :
              'bg-green-500 text-white'
            }`}>
              {opportunity.urgency === 'high' ? 'Urgent' : 
               opportunity.urgency === 'medium' ? 'Medium' : 'Low'} Priority
            </div>
          )}
        </div>
        
        <CardContent className={currentSize.content}>
          <h3 className={`${currentSize.title} font-bold text-gray-900 mb-3`}>
            {opportunity.title}
          </h3>
          
          <p className={`text-gray-600 text-sm mb-4 ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {opportunity.description}
          </p>
          
          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {opportunity.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Skills Required */}
          {opportunity.skillsRequired && opportunity.skillsRequired.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-1">Skills Needed:</p>
              <div className="flex flex-wrap gap-1">
                {opportunity.skillsRequired.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Location and Time */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span>{opportunity.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2 text-green-500" />
              <span>{opportunity.timeCommitment}</span>
            </div>
          </div>

          {/* Action Button */}
          <Link href={opportunity.link}>
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 group transition-all duration-300">
              <HandHeart className="w-4 h-4 mr-2" />
              Volunteer Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}