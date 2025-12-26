"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Share2,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  TrendingUp,
  Shield,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  Target,
  Clock,
  AlertCircle,
  ShoppingCart,
  Copy,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Head from "next/head"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useDonationCart } from "@/hooks/useDonationHooks"
import { renderMarkdownContent } from "@/lib/helper-function"
import ProductPersonalizationModal from "@/components/ProductPersonalizationModal"

// Updated interfaces to match your requirements
interface Campaign {
  id: number
  title: string
  category_id: number
  category_name: string
  festival_type?: string
  overview: string
  details: string
  about_campaign?: string
  donation_goal: number
  total_raised: number
  total_progress_percentage: number
  image: string
  images_array?: string[]
  status: string
  priority: string
  urgency?: string
  location: string
  organizer: string
  verified: boolean
  beneficiaries: number
  total_donors_till_now: number
  start_date: string
  end_date: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  created_by_name?: string
  updated_by_name?: string
  assignedProducts?: CampaignProduct[]
  faq_questions?: FAQ[]
  videoLinks?: string[]
}

interface CampaignProduct {
  id: number
  campaign_id: number
  indipendent_product_id: number
  description?: string
  price: number
  stock: number
  sequence: number
  name?: string
  unit?: string
  image?: string
  min_qty?: number
  max_qty?: number
  max_tat?: number
  min_tat?: number
  increment_count?: number
  campaignId?: any,
  campaignTitle?: any,
}

interface FAQ {
  question: string
  answer: string
}

export default function CauseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { cartItems, addToCart, removeFromCart, getItemQuantity, getCartTotals, updateQuantity } = useDonationCart()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CampaignProduct | null>(null)

  // Fetch campaign data from API
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)

        console.log('Fetching campaign with slug:', params.slug)

        const response = await fetch(`/api/frontstore/campaigns/${params.slug}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const campaignData = await response.json()
        console.log('Campaign data received:', campaignData)
        setCampaign(campaignData)
      } catch (error) {
        console.error('Error fetching campaign:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchCampaign()
    }
  }, [params.slug])



  // Function to generate rich, professional share content
  const generateRichShareContent = (campaign: Campaign) => {
    const progressPercentage = campaign.total_progress_percentage;
    const remainingAmount = campaign.donation_goal - (campaign.total_raised || 0);
    const daysLeft = Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return `🌟 *${campaign.title}* 🌟

👥 *Organized by:* ${campaign.organizer}
${campaign.verified ? '✅ *Verified Campaign*' : ''}

📖 *Campaign Overview:*
${campaign.overview}

${campaign.details}

💰 *Financial Progress:*
🎯 Goal: ₹${campaign.donation_goal.toLocaleString()}
💚 Raised: ₹${campaign.total_raised?.toLocaleString()} (${progressPercentage}%)
🔴 Still needed: ₹${remainingAmount.toLocaleString()}

👥 *Community Impact:*
🤝 ${campaign.total_donors_till_now} generous donors have joined
❤️ ${campaign.beneficiaries?.toLocaleString()} people will benefit
⏰ ${daysLeft > 0 ? `${daysLeft} days left` : 'Campaign ending soon'}

🚨 *Priority Level:* ${campaign.priority.toUpperCase()}
📊 *Status:* ${campaign.status}

💡 *How You Can Help:*
• Donate any amount - every rupee counts
• Share this campaign with your network  
• Spread awareness about this cause

🙏 *Together, we can make a real difference!*

👆 Click the link to donate now and be part of this meaningful change.`;
  }

  // Enhanced Share functionality with rich content
  const shareData = campaign ? {
    title: `🙏 Help Support: ${campaign.title}`,
    text: generateRichShareContent(campaign),
    url: typeof window !== 'undefined' ? window.location.href : '',
  } : null

  const handleShare = async () => {
    if (!shareData) return

    // Try native Web Share API first (mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 3000)
        return
      } catch (error) {
        console.log('Native share failed, falling back to custom options')
      }
    }

    // Fall back to custom share options
    setShowShareOptions(!showShareOptions)
  }

  // Enhanced shareToSocial function with platform-specific formatting
  const shareToSocial = (platform: string) => {
    if (!shareData || !campaign) return

    const encodedUrl = encodeURIComponent(shareData.url)
    const baseTitle = encodeURIComponent(`🙏 Help Support: ${campaign.title}`)

    // Create platform-specific content
    switch (platform) {
      case 'whatsapp':
        const whatsappContent = encodeURIComponent(`${shareData.text}

🔗 *Donate Here:* ${shareData.url}

#CharityDonation #${campaign.category_name.replace(/\s+/g, '')} #HelpingHands #MakeADifference #${campaign.location.replace(/\s+/g, '')}`)
        window.open(`https://wa.me/?text=${whatsappContent}`, '_blank')
        break

      case 'facebook':
        const fbText = encodeURIComponent(`${campaign.overview}

🎯 Goal: ₹${campaign.donation_goal.toLocaleString()}
💚 Raised: ₹${campaign.total_raised?.toLocaleString()}
👥 ${campaign.total_donors_till_now} donors joined • ${campaign.beneficiaries?.toLocaleString()} beneficiaries

Join us in making a difference! Every donation counts.

#CharityDonation #${campaign.category_name.replace(/\s+/g, '')} #CommunitySupport`)
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${fbText}`, '_blank', 'width=600,height=400')
        break

      case 'twitter':
        const twitterText = encodeURIComponent(`🌟 ${campaign.title}

${campaign.overview}

🎯 ₹${campaign.total_raised?.toLocaleString()} of ₹${campaign.donation_goal.toLocaleString()} raised
👥 ${campaign.total_donors_till_now} donors • ${campaign.beneficiaries?.toLocaleString()} beneficiaries

Help us reach our goal! 🙏

#CharityDonation #${campaign.category_name.replace(/\s+/g, '')} #HelpingHands`)
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${twitterText}`, '_blank', 'width=600,height=400')
        break

      case 'linkedin':
        const linkedinTitle = encodeURIComponent(`Supporting ${campaign.title} - Join Our Mission`)
        const linkedinSummary = encodeURIComponent(`🌟 Campaign: ${campaign.title}
📍 Location: ${campaign.location}
👥 Organized by: ${campaign.organizer}

${campaign.overview}

Current Progress:
• Goal: ₹${campaign.donation_goal.toLocaleString()}
• Raised: ₹${campaign.total_raised?.toLocaleString()} (${campaign.total_progress_percentage}%)
• Supporters: ${campaign.total_donors_till_now} donors
• Impact: ${campaign.beneficiaries?.toLocaleString()} beneficiaries

Every contribution makes a meaningful difference. Join us in this noble cause.

#SocialImpact #CharityDonation #CommunitySupport #${campaign.category_name.replace(/\s+/g, '')}`)
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${linkedinTitle}&summary=${linkedinSummary}`, '_blank', 'width=600,height=400')
        break

      default:
        return
    }

    setShowShareOptions(false)
  }

  // Enhanced clipboard copy with rich formatting
  const copyToClipboard = async () => {
    if (!shareData) return

    const richClipboardContent = `${shareData.title}

${shareData.text}

🔗 Donate Now: ${shareData.url}

📱 Share this campaign to help us reach more people!

---
Powered by Your Platform Name - Making giving meaningful and transparent.`

    try {
      await navigator.clipboard.writeText(richClipboardContent)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 3000)
      setShowShareOptions(false)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // SEO Meta Data
  const metaData = campaign ? {
    title: `${campaign.title} | Donate Now - Make a Difference`,
    description: `${campaign.overview} ${campaign.details} Help us reach our goal of ₹${campaign.donation_goal.toLocaleString()}. ${campaign.total_donors_till_now} people have already donated ₹${campaign.total_raised?.toLocaleString()}.`,
    keywords: `donation, charity, ${campaign.category_name}, ${campaign.location}, help, support, fundraising, ${campaign.organizer}, relief, humanitarian aid`,
    ogTitle: `Help Support: ${campaign.title}`,
    ogDescription: `${campaign.overview} Goal: ₹${campaign.donation_goal.toLocaleString()} | Raised: ₹${campaign.total_raised?.toLocaleString()} | ${campaign.total_donors_till_now} donors`,
    ogImage: campaign.image,
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "DonateAction",
      "name": campaign.title,
      "description": campaign.overview + " " + campaign.details,
      "image": campaign.image,
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "recipient": {
        "@type": "Organization",
        "name": campaign.organizer,
        "location": {
          "@type": "Place",
          "name": campaign.location
        }
      },
      "potentialAction": {
        "@type": "DonateAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": typeof window !== 'undefined' ? window.location.origin + "/donate" : '',
          "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
        }
      },
      "startDate": campaign.start_date,
      "endDate": campaign.end_date,
      "goal": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": campaign.donation_goal
      },
      "amount": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": campaign.total_raised
      }
    }
  } : null

  // Helper function to extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
  }

  // Create combined media array with videos first, then images
  const createMediaArray = () => {
    const mediaItems = []

    // Add videos first (they will be at index 0, 1, 2, etc.)
    if (campaign?.videoLinks) {
      campaign.videoLinks.forEach((videoUrl, index) => {
        mediaItems.push({
          type: 'video',
          url: videoUrl,
          id: `video-${index}`,
          thumbnail: getYouTubeVideoId(videoUrl) ?
            `https://img.youtube.com/vi/${getYouTubeVideoId(videoUrl)}/maxresdefault.jpg` :
            null
        })
      })
    }

    // Then add images
    if (campaign?.image) {
      mediaItems.push({
        type: 'image',
        url: campaign.image,
        id: 'main-image'
      })
    }

    if (campaign?.images_array) {
      campaign.images_array.forEach((imageUrl, index) => {
        if (imageUrl) {
          mediaItems.push({
            type: 'image',
            url: imageUrl,
            id: `image-${index}`
          })
        }
      })
    }

    return mediaItems
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <Link href="/causes">
            <Button>Browse All Campaigns</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = (product: CampaignProduct) => {
    setSelectedProduct({
      ...product,
      id: product.id,
      campaignId: campaign.id,
      campaignTitle: campaign.title
    })
    setIsModalOpen(true)
  }

  // Add this new function to handle actual cart addition:
  const handleAddToCartWithPersonalization = (productData: any) => {
    addToCart(productData)
  }

  const handleIncreaseQty = (product: CampaignProduct) => {
    const currentQty = getItemQuantity(product.id, campaign.id)
    const maxQty = product.max_qty || product.stock

    if (currentQty < maxQty) {
      updateQuantity(product.id, campaign.id, currentQty + 1)
    }
  }

  const handleDecreaseQty = (productId: number) => {
    const currentQty = getItemQuantity(productId, campaign.id)

    if (currentQty > 1) {
      updateQuantity(productId, campaign.id, currentQty - 1)
    } else {
      handleRemoveFromCart(productId,)
    }
  }

  const handleRemoveFromCart = (productId: number) => {
    removeFromCart(productId, campaign.id)
  }
  const scrollToProducts = () => {
    const productsSection = document.querySelector('[data-products-section]');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update the redirectToDonate function (around line 240)
  const redirectToDonate = () => {
    if (totalItems <= 0 && campaign.assignedProducts && campaign.assignedProducts.length > 0) {
      scrollToProducts();
      return;
    }
    localStorage.setItem('customDonationId', JSON.stringify(params.id));
    router.push('/donate');
  };


  const redirectToCart = () => {
    router.push('/cart')
  }

  const mediaItems = createMediaArray()

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  const daysLeft = Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))



  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-3 h-3" />
      case 'high': return <TrendingUp className="w-3 h-3" />
      case 'medium': return <Clock className="w-3 h-3" />
      case 'low': return <CheckCircle className="w-3 h-3" />
      default: return <Target className="w-3 h-3" />
    }
  }

  const currentMedia = mediaItems[currentImageIndex]
  const { totalItems, subtotal } = getCartTotals()

  return (
    <>
      {/* SEO Head */}
      {metaData && (
        <Head>
          <title>{metaData.title}</title>
          <meta name="description" content={metaData.description} />
          <meta name="keywords" content={metaData.keywords} />
          <meta name="author" content={campaign.organizer} />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <link rel="canonical" href={metaData.canonicalUrl} />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={metaData.canonicalUrl} />
          <meta property="og:title" content={metaData.ogTitle} />
          <meta property="og:description" content={metaData.ogDescription} />
          <meta property="og:image" content={metaData.ogImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={campaign.title} />
          <meta property="og:site_name" content="Your Charity Platform" />
          <meta property="og:locale" content="en_US" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={metaData.canonicalUrl} />
          <meta property="twitter:title" content={metaData.ogTitle} />
          <meta property="twitter:description" content={metaData.ogDescription} />
          <meta property="twitter:image" content={metaData.ogImage} />
          <meta property="twitter:image:alt" content={campaign.title} />

          {/* Additional SEO */}
          <meta name="geo.region" content="IN" />
          <meta name="geo.placename" content={campaign.location} />
          <meta name="theme-color" content="#3B82F6" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="format-detection" content="telephone=no" />

          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(metaData.jsonLd) }}
          />
        </Head>
      )}

      <div className="min-h-screen bg-white">
        {/* Hero Section - Mobile First */}
        <section className="py-4 px-3 bg-gradient-to-br from-gray-50 to-white sm:py-6 sm:px-4 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 sm:mb-6 lg:mb-8"
            >
              <nav className="flex items-center space-x-1 text-xs text-gray-600 mb-3 sm:space-x-2 sm:text-sm sm:mb-4 lg:mb-6">
                <Link href="/" className="hover:text-blue-600 cursor-pointer truncate transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/causes" className="hover:text-blue-600 cursor-pointer truncate transition-colors">
                  Campaigns
                </Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{campaign.category_name}</span>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{campaign.title.slice(0, 30)}...</span>
              </nav>
            </motion.div>

            {/* Mobile-First Layout */}
            <div className="space-y-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0 xl:gap-12">
              {/* Main Content - Mobile First, Desktop Second Column */}
              <div className="order-1 lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Enhanced Media Gallery - Mobile Optimized */}
                  <div className="relative">
                    <div className="relative h-48 rounded-lg overflow-hidden shadow-lg sm:h-64 md:h-80 lg:h-96 lg:rounded-2xl lg:shadow-xl">
                      {currentMedia?.type === 'video' ? (
                        // Embedded YouTube Video with Autoplay
                        <div className="w-full h-full">
                          {getYouTubeVideoId(currentMedia.url) ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${getYouTubeVideoId(currentMedia.url)}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                              title={`Campaign Video`}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            // Fallback for non-YouTube videos
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="text-center">
                                <Play className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600">Video not supported for embedding</p>
                                <Button
                                  className="mt-2 cursor-pointer"
                                  onClick={() => window.open(currentMedia.url, '_blank')}
                                >
                                  Watch on External Site
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={currentMedia.url || '/images/testimonials/no-profile.png'}
                          alt={campaign.title}
                          className="w-full h-full  "
                        />

                      )}

                      {/* Navigation Arrows */}
                      {mediaItems.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors touch-manipulation sm:left-4"
                            aria-label="Previous media"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors touch-manipulation sm:right-4"
                            aria-label="Next media"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </>
                      )}

                      {/* Media Type Indicator */}
                      {currentMedia?.type === 'video' && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold sm:top-4 sm:right-4">
                          <Play className="w-3 h-3 inline mr-1" />
                          VIDEO
                        </div>
                      )}

                      {/* Media Indicators */}
                      {mediaItems.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:bottom-4 sm:space-x-2">
                          {mediaItems.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${index === currentImageIndex ? "bg-white" : "bg-white/50"
                                }`}
                              aria-label={`Go to ${mediaItems[index]?.type} ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1 sm:top-4 sm:left-4 sm:gap-2 lg:top-6 lg:left-6 lg:gap-3">
                      <Badge className="bg-blue-500 text-white font-semibold text-xs sm:text-sm">
                        {campaign.category_name}
                      </Badge>
                      <Badge className={`font-semibold text-xs sm:text-sm flex items-center gap-1 ${getPriorityColor(campaign.priority)}`}>
                        {getPriorityIcon(campaign.priority)}
                        {campaign.priority.toUpperCase()}
                      </Badge>
                      {campaign.verified && (
                        <Badge className="bg-green-500 text-white font-semibold text-xs sm:text-sm">
                          <CheckCircle className="w-2 h-2 mr-1 sm:w-3 sm:h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Enhanced Thumbnail Gallery */}
                    {mediaItems.length > 1 && (
                      <div className="flex space-x-2 mt-3 overflow-x-auto pb-2 sm:mt-4 scrollbar-hide">
                        {mediaItems.map((media, index) => (
                          <button
                            key={media.id}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors touch-manipulation sm:w-20 sm:h-16 sm:rounded-lg ${index === currentImageIndex ? "border-blue-400 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <Image
                              //@ts-ignore
                              src={media.type === 'video' && media.thumbnail ? media.thumbnail : media.url}
                              alt={`${media.type === 'video' ? 'Video' : 'Image'} ${index + 1}`}
                              width={80}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                            {media.type === 'video' && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Play className="w-3 h-3 text-white fill-current" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight sm:text-3xl md:text-4xl lg:text-5xl sm:mb-4">
                        {campaign.title}
                      </h1>
                      <p className="text-base text-gray-600 leading-relaxed mb-2 sm:text-lg lg:text-xl">
                        {campaign.overview}
                      </p>
                      <p className="text-sm text-gray-500 sm:text-base">
                        {campaign.details}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-200 sm:grid-cols-4 sm:gap-4 sm:py-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 sm:text-xl lg:text-2xl">
                          ₹{campaign.total_raised?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 sm:text-sm">Raised</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 sm:text-xl lg:text-2xl">
                          {campaign.total_donors_till_now?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 sm:text-sm">Donors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 sm:text-xl lg:text-2xl">
                          {campaign.beneficiaries?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 sm:text-sm">Beneficiaries</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold sm:text-xl lg:text-2xl ${daysLeft > 30 ? 'text-gray-900' : daysLeft > 7 ? 'text-orange-600' : 'text-red-600'}`}>
                          {daysLeft > 0 ? daysLeft : 0}
                        </div>
                        <div className="text-xs text-gray-600 sm:text-sm">Days Left</div>
                      </div>
                    </div>

                    {/* Products Section */}
                    {campaign.assignedProducts && campaign.assignedProducts.length > 0 && (
                      <section data-products-section className="py-8 px-3 bg-gray-50 sm:py-12 sm:px-4 lg:py-16">
                        <div className="max-w-7xl mx-auto">
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center mb-8 sm:mb-12"
                          >
                            <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:text-3xl lg:text-4xl sm:mb-4">
                              Campaign{" "}
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                                Products
                              </span>
                            </h2>
                            <p className="text-base text-gray-600 max-w-3xl mx-auto sm:text-lg lg:text-xl">
                              Choose from our campaign-specific products. Each product directly contributes to this relief campaign
                              and shows exactly how your donation will be used to help families in need.
                            </p>
                          </motion.div>

                          {/* Products Grid */}
                          <div className="grid gap-4 mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 sm:mb-12">
                            {campaign.assignedProducts?.map((product, index) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5, scale: 1.01 }}
                                className="cursor-pointer"
                              >
                                <Card className=" h-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                                  <div className="relative">
                                    <Image
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.description || `Product ${product.id}`}
                                      width={300}
                                      height={200}
                                      className="w-full h-40 object-cover sm:h-48"
                                    />

                                    {/* <img
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.description || `Product ${product.id}`}
                                      className="w-full h-48  "
                                    /> */}

                                    {product.stock !== undefined && product.stock < 10 && (
                                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                                        <Badge className="bg-red-500 text-white font-semibold text-xs sm:text-sm">
                                          Only {product.stock} left
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                                  <CardContent className="p-2 sm:p-2">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2  sm:mb-3 border-b-2">
                                      {product.name || `Product ${product.id}`}
                                    </h3>
                                    <span className="text-xs font-bold text-gray-900 mb-2  sm:mb-3">
                                      {product.description || `Product ${product.id}`}
                                    </span>
                                    <div className="text-xl font-bold text-blue-600 mb-2 sm:text-2xl sm:mb-3">
                                      ₹{product.price.toLocaleString()}/{product.unit || 'unit'}
                                    </div>

                                    {/* Product Impact Description */}
                                    {/* <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg mb-3 sm:mb-4">
                                      <div className="text-xs font-semibold text-gray-700 flex items-center sm:text-sm">
                                        <TrendingUp className="w-3 h-3 mr-2 text-blue-600 sm:w-4 sm:h-4" />
                                        Impact: {
                                          product.name?.includes('Food') ? 'Feeds a family for 2 weeks' :
                                            product.name?.includes('Shelter') ? 'Provides temporary housing for a family' :
                                              product.name?.includes('Medical') ? 'Covers medical treatment for 10 people' :
                                                product.name?.includes('Water') ? 'Clean water for 1 month' :
                                                  product.name?.includes('Education') ? 'School supplies for 5 children' :
                                                    'Essential supplies for families in need'
                                        }
                                      </div>
                                    </div> */}

                                    {getItemQuantity(product.id, campaign.id) > 0 ? (
                                      <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg mb-3 sm:p-3 sm:mb-4">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDecreaseQty(product.id)}
                                          className="cursor-pointer p-1 sm:p-2"
                                        >
                                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                        <span className="font-semibold text-sm sm:text-base">
                                          {getItemQuantity(product.id, campaign.id)}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleIncreaseQty(product)}
                                          className="cursor-pointer p-1 sm:p-2"
                                          disabled={product.stock === 0}
                                        >
                                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                      </div>
                                    )
                                      : <Button
                                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold cursor-pointer text-xs p-2.5 sm:text-sm sm:p-3"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock === 0}
                                      >
                                        Donate Now | ₹{product.price.toLocaleString()}
                                      </Button>
                                    }

                                    {/* <div className="space-y-2 sm:space-y-3">
                                      {getItemQuantity(product.id, campaign.id) > 0 ? (
                                        <>
                                          <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg mb-2 sm:p-3">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleRemoveFromCart(product.id)}
                                              className="cursor-pointer p-1 sm:p-2"
                                            >
                                              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </Button>
                                            <span className="font-semibold text-sm sm:text-base">
                                              Qty: {getItemQuantity(product.id, campaign.id)}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleAddToCart(product)}
                                              className="cursor-pointer p-1 sm:p-2"
                                              disabled={product.stock === 0}
                                            >
                                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </Button>
                                          </div>
                                          <Button
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold cursor-pointer text-xs p-2.5 sm:text-sm sm:p-3"
                                            onClick={() => handleAddToCart(product)}
                                            disabled={product.stock === 0}
                                          >
                                            ADD MORE | ₹{product.price.toLocaleString()}
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold cursor-pointer text-xs p-2.5 sm:text-sm sm:p-3"
                                          onClick={() => handleAddToCart(product)}
                                          disabled={product.stock === 0}
                                        >
                                          Donate Now | ₹{product.price.toLocaleString()}
                                        </Button>
                                      )}
                                    </div> */}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* About Campaign */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 sm:text-2xl sm:mb-4">
                        About This Campaign
                      </h2>
                      <div className="prose prose-sm max-w-none sm:prose-base lg:prose-lg">
                        {campaign && campaign?.about_campaign ? (renderMarkdownContent(campaign?.about_campaign)) : null}
                      </div>
                    </div>

                    {/* FAQ Section */}
                    {campaign.faq_questions && campaign.faq_questions.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 sm:text-2xl sm:mb-4">
                          Frequently Asked Questions
                        </h2>
                        <div className="space-y-3">
                          {campaign.faq_questions.map((faq, index) => (
                            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                              <button
                                onClick={() => toggleFaq(index)}
                                className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-gray-900 pr-4 text-sm sm:text-base">{faq.question}</h3>
                                  {expandedFaq === index ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                              {expandedFaq === index && (
                                <div className="px-4 pb-4">
                                  <Separator className="mb-3" />
                                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="order-2 lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="space-y-4 lg:sticky lg:top-24 sm:space-y-6"
                >
                  {/* Progress Card */}
                  <Card className="p-4 shadow-lg sm:p-6 sm:shadow-xl">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold sm:text-lg">Progress</span>
                        <span className="text-xl font-bold text-green-600 sm:text-2xl">{campaign.total_progress_percentage}%</span>
                      </div>
                      <Progress value={campaign.total_progress_percentage} className="h-3 sm:h-4" />
                      <div className="flex justify-between text-xs text-gray-600 sm:text-sm">
                        <span>₹{campaign.total_raised?.toLocaleString()} raised</span>
                        <span>₹{campaign.donation_goal.toLocaleString()} goal</span>
                      </div>
                      <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                          ₹{(campaign.donation_goal - (campaign.total_raised || 0)).toLocaleString()} still needed
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Campaign Info */}
                  <Card className="p-4 shadow-lg sm:p-6 sm:shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 sm:text-xl sm:mb-4">Campaign Details</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-start text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{campaign.location}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <span>{campaign.beneficiaries?.toLocaleString()} people will benefit</span>
                      </div>
                      <div className="flex items-start text-sm">
                        <Shield className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="break-words">Organized by {campaign.organizer}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Target className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <span>Priority: <span className="font-medium capitalize">{campaign.priority}</span></span>
                      </div>
                      <div className="flex items-center text-sm">
                        <AlertCircle className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <span>Status: <span className={`font-medium ${campaign.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>{campaign.status}</span></span>
                      </div>
                    </div>
                  </Card>

                  {/* Enhanced Share Card */}
                  <Card className="p-4 shadow-lg sm:p-6 sm:shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 sm:text-xl sm:mb-4">Share This Campaign</h3>

                    {/* Success Message */}
                    {shareSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        <span className="font-medium">Successfully copied to clipboard!</span>
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      {/* Main Share Button */}
                      <Button
                        variant="outline"
                        className="w-full cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 text-blue-700 text-sm p-3 sm:text-base transition-all duration-300 shadow-sm"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        {showShareOptions ? 'Hide Share Options' : 'Share Campaign'}
                      </Button>

                      {/* Enhanced Share Options */}
                      {showShareOptions && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm space-y-3"
                        >
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Choose Platform</h4>

                          {/* Social Media Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer bg-white hover:bg-blue-600 hover:text-white border-blue-200 text-blue-600 transition-all duration-300 flex items-center justify-center p-3 rounded-lg shadow-sm hover:shadow-md group"
                              onClick={() => shareToSocial('facebook')}
                            >
                              <div className="w-5 h-5 mr-2 rounded bg-blue-600 flex items-center justify-center group-hover:bg-white">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white group-hover:fill-blue-600">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium">Facebook</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer bg-white hover:bg-sky-500 hover:text-white border-sky-200 text-sky-500 transition-all duration-300 flex items-center justify-center p-3 rounded-lg shadow-sm hover:shadow-md group"
                              onClick={() => shareToSocial('twitter')}
                            >
                              <div className="w-5 h-5 mr-2 rounded bg-sky-500 flex items-center justify-center group-hover:bg-white">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white group-hover:fill-sky-500">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium">Twitter</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer bg-white hover:bg-blue-700 hover:text-white border-blue-300 text-blue-700 transition-all duration-300 flex items-center justify-center p-3 rounded-lg shadow-sm hover:shadow-md group"
                              onClick={() => shareToSocial('linkedin')}
                            >
                              <div className="w-5 h-5 mr-2 rounded bg-blue-700 flex items-center justify-center group-hover:bg-white">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white group-hover:fill-blue-700">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium">LinkedIn</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer bg-white hover:bg-green-500 hover:text-white border-green-200 text-green-600 transition-all duration-300 flex items-center justify-center p-3 rounded-lg shadow-sm hover:shadow-md group"
                              onClick={() => shareToSocial('whatsapp')}
                            >
                              <div className="w-5 h-5 mr-2 rounded bg-green-500 flex items-center justify-center group-hover:bg-white">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white group-hover:fill-green-500">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium">WhatsApp</span>
                            </Button>
                          </div>

                          {/* Copy Link Section */}
                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full cursor-pointer bg-gray-50 hover:bg-gray-600 hover:text-white border-gray-200 text-gray-700 transition-all duration-300 flex items-center justify-center p-3 rounded-lg shadow-sm hover:shadow-md"
                              onClick={copyToClipboard}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">Copy Campaign Link</span>
                            </Button>
                          </div>

                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>


        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 safe-area-bottom">
          <div className="px-3 py-2">
            <button
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
              onClick={totalItems > 0 ? redirectToCart : redirectToDonate}
            >
              <div className="flex flex-col items-start">
                <div className="text-xs">
                  {totalItems > 0 ? `${totalItems} ITEM${totalItems > 1 ? 'S' : ''}` : 'Support This Campaign'}
                </div>
                {totalItems > 0 &&
                  <div className="text-sm font-bold">
                    ₹ {totalItems > 0 && subtotal.toLocaleString()}
                  </div>
                }
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                {totalItems > 0 ? 'VIEW CART' : 'DONATE NOW'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 py-1.5 bg-gray-50 text-xs text-gray-600">
            <span>Secured by</span>
            <img
              src="/images/razorpay.avif"
              alt="Razorpay"
              style={{ width: '75px', height: '20px' }}
              className="inline"
            />

          </div>
        </div>

        {/* Desktop Floating Cart Button - Shows only when cart has items */}
        {totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden lg:block fixed bottom-6 right-6 z-50"
          >
            <Card className="p-4 shadow-2xl bg-white border-2 border-blue-400">
              <div className="flex items-center justify-between space-x-4">
                <div>
                  <div className="font-semibold text-gray-900 text-base">
                    {totalItems} items in cart
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    Total: ₹{subtotal.toLocaleString()}
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold cursor-pointer text-base p-3"
                  onClick={redirectToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Contribute Now
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
      {selectedProduct && (
        <ProductPersonalizationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProduct(null)
          }}
          product={{
            id: selectedProduct.id,
            campaignId: campaign.id,
            campaignTitle: campaign.title,
            name: selectedProduct.name || `Product ${selectedProduct.id}`,
            price: selectedProduct.price,
            unit: selectedProduct.unit,
            image: selectedProduct.image,
            maxQty: selectedProduct.max_qty || selectedProduct.stock,
            max_tat: selectedProduct?.max_tat || 1,
            min_tat: selectedProduct?.min_tat || 1,
            stock: selectedProduct.stock,
            description: selectedProduct.description
          }}
          onAddToCart={handleAddToCartWithPersonalization}
        />
      )}
    </>
  )
}