"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Package,
  Heart,
  Users,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Plus,
  BarChart2,
  ListTodo,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Stat {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease"
  icon: string
  color: string
  bgColor: string
  link: string
}

interface Campaign {
  id: number
  title: string
  category: string
  raised: string
  goal: string
  progress: number
  status: string
  link: string
}

interface Donation {
  id: number
  donor: string
  campaign: string
  amount: string
  date: string
  status: string
}

interface Activity {
  id: number
  user: string
  action: string
  time: string
  icon: string
  color: string
}

interface DashboardData {
  stats: Stat[]
  recentCampaigns: Campaign[]
  recentDonations: Donation[]
  recentActivities: Activity[]
}

const iconMap: any = {
  Heart,
  Package,
  Users,
  Plus,
  Edit,
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()
        setDashboardData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { stats, recentCampaigns, recentDonations, recentActivities } = dashboardData

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-0">Dashboard</h1>
          <Button asChild>
            <Link href="/admin/campaigns" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Campaign
            </Link>
          </Button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = iconMap[stat.icon] || Package
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <Link href={stat.link}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          <div className="flex items-center mt-2">
                            {stat.changeType === "increase" ? (
                              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-red-600 mr-1" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                stat.changeType === "increase" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {stat.change}
                            </span>
                            <span className="text-sm text-gray-500 ml-1 hidden md:block">from last month</span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Campaigns</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/campaigns">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCampaigns.length > 0 ? (
                  recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 mb-2 sm:mb-0">
                        <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                        <p className="text-sm text-gray-600">{campaign.category}</p>
                        <div className="flex items-center mt-2">
                          <Progress value={campaign.progress} className="w-32 h-2 mr-3" />
                          <span className="text-sm text-gray-600">{campaign.progress}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {campaign.raised} of {campaign.goal}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {campaign.status}
                        </span>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={campaign.link}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No campaigns found</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Donations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Donations</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/donations">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentDonations.length > 0 ? (
                  recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <h4 className="font-semibold text-gray-900">{donation.donor}</h4>
                        <p className="text-sm text-gray-600">{donation.campaign}</p>
                        <p className="text-xs text-gray-500">{donation.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{donation.amount}</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            donation.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {donation.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No donations found</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Activity Feed & Pending Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <BarChart2 className="w-5 h-5 text-gray-400" />
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const ActivityIcon = iconMap[activity.icon] || Plus
                    
                    return (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color} bg-opacity-10`}>
                          <ActivityIcon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            <span className="font-bold">{activity.user}</span> {activity.action}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-gray-500 py-8">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending Tasks</CardTitle>
                <ListTodo className="w-5 h-5 text-gray-400" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-semibold text-gray-900">Review new user applications</h4>
                  <p className="text-sm text-gray-600 mt-1">Check pending user verifications.</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Link href="/admin/users">Review Now</Link>
                  </Button>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-semibold text-gray-900">Monitor active campaigns</h4>
                  <p className="text-sm text-gray-600 mt-1">Track campaign performance and goals.</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Link href="/admin/campaigns">View Campaigns</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}