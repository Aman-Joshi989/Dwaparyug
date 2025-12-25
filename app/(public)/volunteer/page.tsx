"use client"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Heart,
  HandHeart,
  Search,
  Filter,
  Users,
  Award,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  Star
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { VolunteerCard } from "@/components/shared/volanture-card"

// Expanded volunteer opportunities data
const allVolunteerOpportunities = [
  {
    id: 1,
    title: "Community Kitchen Helper",
    description: "Help serve meals and assist in food preparation for our community kitchen program. Join us in providing nutritious meals to families in need while building meaningful connections with the community.",
    image: "/volunteer-kitchen.jpg",
    location: "Downtown Community Center",
    timeCommitment: "4 hours/week",
    category: "Food Security",
    participants: 45,
    link: "/volunteer/kitchen-helper",
    tags: ["Cooking", "Community Service", "Weekly"],
    urgency: "high" as const,
    skillsRequired: ["Basic cooking", "Teamwork", "Patience"]
  },
  {
    id: 2,
    title: "Children's Education Support",
    description: "Tutor underprivileged children and help with homework and learning activities. Make a lasting impact on young minds by providing educational support and mentorship.",
    image: "/volunteer-education.jpg",
    location: "Various Schools",
    timeCommitment: "2-3 hours/week",
    category: "Education",
    participants: 62,
    link: "/volunteer/education-support",
    tags: ["Teaching", "Children", "Academic Support"],
    urgency: "medium" as const,
    skillsRequired: ["Patience with children", "Basic academics", "Communication"]
  },
  {
    id: 3,
    title: "Healthcare Outreach",
    description: "Assist medical professionals in health camps and awareness programs. Support healthcare initiatives in underserved communities and help improve access to medical care.",
    image: "/volunteer-healthcare.jpg",
    location: "Rural Areas",
    timeCommitment: "1 day/month",
    category: "Healthcare",
    participants: 38,
    link: "/volunteer/healthcare-outreach",
    tags: ["Healthcare", "Rural", "Medical Assistance"],
    urgency: "high" as const,
    skillsRequired: ["Medical knowledge (preferred)", "Compassion", "Physical stamina"]
  },
  {
    id: 4,
    title: "Environmental Clean-up",
    description: "Join our environmental initiatives and community clean-up drives. Help protect our planet by participating in tree planting, waste management, and conservation projects.",
    image: "/volunteer-environment.jpg",
    location: "City Parks & Rivers",
    timeCommitment: "Half day/month",
    category: "Environment",
    participants: 89,
    link: "/volunteer/environment",
    tags: ["Environment", "Outdoors", "Conservation"],
    urgency: "medium" as const,
    skillsRequired: ["Physical activity", "Environmental awareness", "Teamwork"]
  },
  {
    id: 5,
    title: "Elderly Care Companion",
    description: "Spend quality time with elderly residents, provide companionship, and assist with daily activities. Bring joy and comfort to seniors in our community.",
    image: "/volunteer-elderly.jpg",
    location: "Senior Care Centers",
    timeCommitment: "3 hours/week",
    category: "Elderly Care",
    participants: 34,
    link: "/volunteer/elderly-care",
    tags: ["Elderly", "Companionship", "Care"],
    urgency: "medium" as const,
    skillsRequired: ["Patience", "Empathy", "Good communication"]
  },
  {
    id: 6,
    title: "Digital Literacy Trainer",
    description: "Teach basic computer skills and digital literacy to adults who want to learn technology. Help bridge the digital divide in our community.",
    image: "/volunteer-digital.jpg",
    location: "Community Libraries",
    timeCommitment: "2 hours/week",
    category: "Education",
    participants: 28,
    link: "/volunteer/digital-literacy",
    tags: ["Technology", "Adult Education", "Digital Skills"],
    urgency: "low" as const,
    skillsRequired: ["Computer skills", "Teaching ability", "Patience"]
  },
  {
    id: 7,
    title: "Animal Shelter Volunteer",
    description: "Care for rescued animals, help with feeding, cleaning, and providing love to pets waiting for adoption. Make a difference in the lives of our furry friends.",
    image: "/volunteer-animals.jpg",
    location: "City Animal Shelter",
    timeCommitment: "4 hours/week",
    category: "Animal Welfare",
    participants: 56,
    link: "/volunteer/animal-shelter",
    tags: ["Animals", "Pet Care", "Rescue"],
    urgency: "high" as const,
    skillsRequired: ["Animal handling", "Physical work", "Compassion"]
  },
  {
    id: 8,
    title: "Emergency Response Team",
    description: "Join our disaster response team to provide immediate aid during emergencies and natural disasters. Be trained to help when your community needs it most.",
    image: "/volunteer-emergency.jpg",
    location: "Various Emergency Sites",
    timeCommitment: "On-call basis",
    category: "Emergency Response",
    participants: 23,
    link: "/volunteer/emergency-response",
    tags: ["Emergency", "First Aid", "Crisis Response"],
    urgency: "high" as const,
    skillsRequired: ["First aid certification", "Quick thinking", "Physical fitness"]
  }
]

const categories = ["All", "Food Security", "Education", "Healthcare", "Environment", "Elderly Care", "Animal Welfare", "Emergency Response"]
const urgencyLevels = ["All", "High", "Medium", "Low"]

export default function VolunteerPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedUrgency, setSelectedUrgency] = useState("All")

  const filteredOpportunities = useMemo(() => {
    return allVolunteerOpportunities.filter(opportunity => {
      const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === "All" || opportunity.category === selectedCategory

      const matchesUrgency = selectedUrgency === "All" ||
        (selectedUrgency.toLowerCase() === opportunity.urgency)

      return matchesSearch && matchesCategory && matchesUrgency
    })
  }, [searchQuery, selectedCategory, selectedUrgency])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Decorative Elements */}
        <motion.div
          className="absolute top-20 right-20 text-pink-400 opacity-10"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Heart className="w-32 h-32" />
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-10 text-blue-400 opacity-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <HandHeart className="w-28 h-28" />
        </motion.div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-purple-100 px-6 py-3 rounded-full text-sm font-medium text-gray-700 mb-6">
              <HandHeart className="w-4 h-4 mr-2 text-pink-600" />
              Join Our Cause • Make a Difference
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
              Become a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
                Volunteer
              </span>{" "}
              Hero
            </h1>

            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12">
              Join our community of dedicated volunteers and help us create meaningful change.
              Every hour you contribute makes a lasting impact on someone's life. Find the perfect
              opportunity that matches your skills, schedule, and passion.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Users className="w-8 h-8 text-blue-600 mb-2 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Active Volunteers</div>
              </motion.div>

              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Heart className="w-8 h-8 text-pink-600 mb-2 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Lives Impacted</div>
              </motion.div>

              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Award className="w-8 h-8 text-green-600 mb-2 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-600">Programs</div>
              </motion.div>

              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Star className="w-8 h-8 text-yellow-600 mb-2 mx-auto" />
                <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search volunteer opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Priority Level" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level} Priority
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                  setSelectedUrgency("All")
                }}
                variant="outline"
                className="w-full md:w-auto h-12 px-6"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredOpportunities.length} of {allVolunteerOpportunities.length} opportunities
            </div>
          </motion.div>

          {/* Volunteer Opportunities Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
            {filteredOpportunities.map((opportunity, index) => (
              <VolunteerCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                showFullDescription={false}
                size="medium"
              />
            ))}
          </div>

          {/* No Results */}
          {filteredOpportunities.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No opportunities found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse all available opportunities.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                  setSelectedUrgency("All")
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                View All Opportunities
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Why Volunteer Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                Volunteer
              </span>{" "}
              With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the incredible benefits of volunteering and join a community
              that's making a real difference in the world.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Make a Real Impact",
                description: "See the direct results of your efforts in the lives of those you help.",
                color: "text-pink-600"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Build Connections",
                description: "Meet like-minded people and build lasting friendships in your community.",
                color: "text-blue-600"
              },
              {
                icon: <Award className="w-8 h-8" />,
                title: "Develop Skills",
                description: "Gain valuable experience and develop new skills that enhance your career.",
                color: "text-green-600"
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: "Personal Growth",
                description: "Challenge yourself, gain confidence, and discover your potential.",
                color: "text-yellow-600"
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: "Flexible Schedule",
                description: "Choose opportunities that fit your availability and lifestyle.",
                color: "text-purple-600"
              },
              {
                icon: <HandHeart className="w-8 h-8" />,
                title: "Feel Fulfilled",
                description: "Experience the joy and satisfaction that comes from helping others.",
                color: "text-indigo-600"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className={`${benefit.color} mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact and Support Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center shadow-2xl"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Have questions or need help finding the right volunteer opportunity?
              Our volunteer coordinators are here to help you get started on your journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Link href="/volunteer/kitchen-helper">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Volunteer Coordinator
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call: +91 99993 03166
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <div className="font-semibold">Volunteer Orientation</div>
                <div className="text-sm opacity-80">Every Saturday 10 AM</div>
              </div>
              <div>
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <div className="font-semibold">Quick Response</div>
                <div className="text-sm opacity-80">24-48 hour reply time</div>
              </div>
              <div>
                <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <div className="font-semibold">Community Support</div>
                <div className="text-sm opacity-80">Join our volunteer network</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}