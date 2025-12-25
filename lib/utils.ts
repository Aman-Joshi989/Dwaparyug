import { clsx, type ClassValue } from "clsx"
import { Search, Target, CreditCard, TrendingUp, Eye, Shield, FileText, Smartphone, Bell, Users, Gift, Heart, Award, Globe, Star, Zap, DollarSign, ListChecks, Package } from "lucide-react"
import { twMerge } from "tailwind-merge"
import { Product, Campaign } from "./interface";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number, locale = "en-IN", currency = "INR") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);

export const cause = {
  id: 1,
  title: "Winter Emergency Relief for Delhi Slum Families",
  category: "Emergency Relief",
  type: "product", // "product" or "direct" (for campaigns like surgery that don't have products)
  description:
    "As winter approaches, thousands of families in Delhi's slums face life-threatening conditions without adequate shelter, warm clothing, or nutritious food. This emergency campaign provides immediate relief through food distribution, warm clothing, medical aid, and temporary shelter arrangements.",
  longDescription: `The harsh Delhi winter claims lives every year, particularly among the most vulnerable populations living in slums and on the streets. With temperatures dropping below 5°C, families struggle to keep warm while battling hunger and illness.

Our comprehensive winter relief program addresses multiple critical needs:

**Immediate Food Relief**: Nutritious meal packets, dry rations, and hot food distribution through mobile kitchens reaching 50+ slum areas daily.

**Warm Clothing Distribution**: New and gently used winter clothes including blankets, sweaters, jackets, and shoes for children and adults.

**Medical Emergency Response**: Mobile medical units providing free health check-ups, medicines, and emergency treatment for cold-related illnesses.

**Temporary Shelter**: Setting up night shelters with proper heating, clean water, and sanitation facilities.

**Child Protection**: Special focus on protecting children from harsh weather through school meal programs and warm clothing drives.`,
  images: [
    "/placeholder.svg?height=600&width=800&text=Winter+Relief+Campaign",
    "/placeholder.svg?height=600&width=800&text=Food+Distribution",
    "/placeholder.svg?height=600&width=800&text=Clothing+Drive",
    "/placeholder.svg?height=600&width=800&text=Medical+Camp",
    "/placeholder.svg?height=600&width=800&text=Shelter+Setup",
  ],
  raised: 2850000,
  goal: 5000000,
  percentage: 57,
  urgency: "Critical",
  beneficiaries: 10000,
  location: "Delhi, India",
  endDate: "2024-12-31",
  startDate: "2024-10-01",
  organizer: "Dwaparyug Foundation",
  verified: true,
  donors: 2847,
  updates: 15,
  hasProducts: true,
}

export const campaignProducts = [
  {
    id: 1,
    title: "Feed 100 Kids",
    price: 3500,
    image: "/placeholder.svg?height=200&width=300&text=Feed+100+Kids",
    description: "Sponsor food for 100 underprivileged kids with a banner in memory of your loved one.",
    impact: "Provides nutritious meals for 100 children for 1 week",
    category: "Food Relief",
  },
  {
    id: 2,
    title: "Feed 20 Kids",
    price: 1000,
    image: "/placeholder.svg?height=200&width=300&text=Feed+20+Kids",
    description: "Sponsor food for 20 underprivileged kids and we will grow 2 plants in memory of your loved one.",
    impact: "Provides nutritious meals for 20 children for 1 week",
    category: "Food Relief",
  },
  {
    id: 3,
    title: "Warm Clothing Kit",
    price: 2000,
    image: "/placeholder.svg?height=200&width=300&text=Warm+Clothing",
    description: "Provide warm winter clothing including blankets, sweaters, and jackets for families in need.",
    impact: "Keeps 5 families warm during harsh winter months",
    category: "Winter Relief",
  },
  {
    id: 4,
    title: "Medical Care Package",
    price: 1500,
    image: "/placeholder.svg?height=200&width=300&text=Medical+Care",
    description: "Essential medicines and health check-ups for families affected by the crisis.",
    impact: "Provides medical care for 10 families for 1 month",
    category: "Healthcare",
  },
  {
    id: 5,
    title: "Emergency Shelter Kit",
    price: 5000,
    image: "/placeholder.svg?height=200&width=300&text=Emergency+Shelter",
    description: "Temporary shelter materials including tarpaulins, ropes, and basic amenities.",
    impact: "Provides emergency shelter for 2 families",
    category: "Emergency Relief",
  },
  {
    id: 6,
    title: "Education Support Kit",
    price: 800,
    image: "/placeholder.svg?height=200&width=300&text=Education+Kit",
    description: "School supplies, books, and stationery for children to continue their education.",
    impact: "Supports education for 15 children for 3 months",
    category: "Education",
  },
]

export const cartItems = [
  {
    id: 1,
    packageId: 2,
    title: "Family Care Package",
    price: 1500,
    quantity: 2,
    description: "Comprehensive support including food, clothing, and medical aid",
    impact: "Supports 2 families for 3 weeks each",
    image: "/placeholder.svg?height=100&width=100&text=Family+Care",
  },
  {
    id: 2,
    packageId: 1,
    title: "Basic Relief Package",
    price: 500,
    quantity: 1,
    description: "Provides essential food supplies for 1 family for 1 week",
    impact: "Feeds 1 family for 7 days",
    image: "/placeholder.svg?height=100&width=100&text=Basic+Relief",
  },
]

export const steps = [
  {
    step: 1,
    title: "Discover Causes",
    description: "Browse through our verified campaigns and find causes that resonate with your values",
    icon: Search,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    details: [
      "Explore campaigns by category (Education, Healthcare, Emergency Relief, etc.)",
      "View detailed information about each cause and its impact",
      "See real-time progress and transparency reports",
      "Read stories from beneficiaries and communities",
    ],
  },
  {
    step: 2,
    title: "Choose Your Impact",
    description: "Select donation amounts or specific products that align with your giving preferences",
    icon: Target,
    color: "text-green-600",
    bgColor: "bg-green-100",
    details: [
      "Choose from pre-defined impact packages or custom amounts",
      "Select specific products like meals, clothing, or medical supplies",
      "Add personal messages and dedication images",
      "Set up one-time or recurring donations",
    ],
  },
  {
    step: 3,
    title: "Secure Donation",
    description: "Complete your donation through our secure, encrypted payment system",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    details: [
      "Multiple payment options: Cards, UPI, Net Banking, Wallets",
      "SSL-encrypted transactions for complete security",
      "Instant payment confirmation and receipt",
      "Automatic 80G tax certificate generation",
    ],
  },
  {
    step: 4,
    title: "Track Impact",
    description: "Receive regular updates and see exactly how your donation is making a difference",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    details: [
      "Real-time tracking of fund utilization",
      "Photo and video updates from the field",
      "Impact reports showing measurable outcomes",
      "Direct communication from beneficiaries",
    ],
  },
]

export const features = [
  {
    title: "100% Transparency",
    description: "Track every rupee from donation to impact with our transparent reporting system",
    icon: Eye,
    stats: "Real-time tracking",
  },
  {
    title: "Verified Campaigns",
    description: "All campaigns are thoroughly vetted and verified by our field teams",
    icon: Shield,
    stats: "100% verified",
  },
  {
    title: "Tax Benefits",
    description: "Get instant 80G tax certificates for all your donations",
    icon: FileText,
    stats: "Instant certificates",
  },
  {
    title: "Mobile Optimized",
    description: "Donate seamlessly from any device with our mobile-first platform",
    icon: Smartphone,
    stats: "Cross-platform",
  },
  {
    title: "Impact Updates",
    description: "Receive regular updates about the impact of your contributions",
    icon: Bell,
    stats: "Weekly updates",
  },
  {
    title: "Community Support",
    description: "Join a community of like-minded donors working towards positive change",
    icon: Users,
    stats: "50,000+ donors",
  },
]

export const donationTypes = [
  {
    type: "One-Time Donation",
    description: "Make a single donation to support immediate needs",
    icon: Gift,
    benefits: ["Immediate impact", "Flexible amounts", "Instant receipt", "Tax benefits"],
    popular: false,
  },
  {
    type: "Monthly Giving",
    description: "Set up recurring donations for sustained impact",
    icon: Heart,
    benefits: ["Sustained support", "Greater impact", "Automatic receipts", "Priority updates"],
    popular: true,
  },
  {
    type: "Campaign Sponsorship",
    description: "Sponsor entire campaigns or specific initiatives",
    icon: Award,
    benefits: ["Maximum impact", "Recognition", "Detailed reports", "Site visits"],
    popular: false,
  },
]

export const teamMembers = [
  {
    id: 1,
    name: "Abhishek Nirman",
    role: "Founder & CEO",
    image: "/images/teams/abhishek-nirman.webp",
    bio: "With over 10 years of experience in social work, Mr. Abhishek has dedicated his life to serving underprivileged communities across India.",
    achievements: ["Rescued Lifes", "Served 50,000+ families", "Community leader"],
    social: {
      linkedin: "https://www.linkedin.com/in/abhishek-nirman/",
      twitter: "https://x.com/Dwapar_yug_",
      email: "abhisheknirman9642@gmail.com",
    },
  },
  {
    id: 2,
    name: "Niharika Nirman",
    role: "Director",
    image: "/images/teams/niharika.webp",
    bio: "Niharika leads our field operations and ensures every donation reaches those who need it most. Her background in logistics makes her invaluable.",
    achievements: ["1 years experience", "Led 200+ campaigns", "Operations expert"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "nirmanniharika@gmail.com",
    },
  },
  {
    id: 3,
    name: "Meenu Nirman",
    role: "Operation Head",
    image: "/images/teams/meenu.webp",
    bio: "Meenu, our Head of Operations, oversees day-to-day functions and ensures the smooth execution of initiatives, driving efficiency and impact across the organization.",
    achievements: ["Streamlined Operations", "Team Leadership", "Resource Optimization"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "meenux321@gmail.com",
    },
  },
  {
    id: 4,
    name: "Rakesh Kumar",
    role: "Field Manager",
    image: "/images/teams/rakesh-kumar.webp",
    bio: "Rakesh builds relationships with local communities and ensures our programs are culturally sensitive and effective.",
    achievements: ["Community leader", "Multilingual", "Cultural bridge-builder"],
    social: {
      linkedin: "#",
      twitter: "#",
      email: "rakeshkumar@dwaparyug.org",
    },
  },
]

export const scaleOnHover = {
  whileHover: { scale: 1.05, transition: { duration: 0.2 } },
  whileTap: { scale: 0.95 },
}


export const causes = [
  {
    id: 1,
    category: "Emergency Relief",
    title: "Flood Relief for Assam Families",
    description:
      "Providing immediate shelter, food, and medical aid to 500+ families affected by devastating floods in rural Assam. Your donation helps rebuild lives and restore hope.",
    image: "/placeholder.svg?height=300&width=400&text=Flood+Relief+Assam",
    raised: 285000,
    goal: 500000,
    percentage: 57,
    urgency: "Critical",
    beneficiaries: 500,
    location: "Assam, India",
    endDate: "2024-12-31",
  },
  {
    id: 2,
    category: "Child Nutrition",
    title: "Malnutrition-Free Childhood Initiative",
    description:
      "Combating severe malnutrition among children under 5 in tribal areas. Providing nutritious meals, supplements, and health monitoring for 1000+ children.",
    image: "/placeholder.svg?height=300&width=400&text=Child+Nutrition+Program",
    raised: 420000,
    goal: 750000,
    percentage: 56,
    urgency: "High",
    beneficiaries: 1000,
    location: "Jharkhand, India",
    endDate: "2024-11-30",
  },
  {
    id: 3,
    category: "Healthcare",
    title: "Mobile Medical Units for Remote Villages",
    description:
      "Bringing essential healthcare to doorsteps of remote villages. Equipped with medicines, diagnostic tools, and trained medical professionals serving 50+ villages.",
    image: "/placeholder.svg?height=300&width=400&text=Mobile+Medical+Units",
    raised: 680000,
    goal: 800000,
    percentage: 85,
    urgency: "Medium",
    beneficiaries: 2500,
    location: "Rajasthan, India",
    endDate: "2024-10-15",
  },
  {
    id: 4,
    category: "Education",
    title: "Digital Learning Centers for Rural Schools",
    description:
      "Establishing computer labs and internet connectivity in 25 rural schools. Empowering 2000+ students with digital literacy and modern education tools.",
    image: "/placeholder.svg?height=300&width=400&text=Digital+Learning+Centers",
    raised: 920000,
    goal: 1000000,
    percentage: 92,
    urgency: "Low",
    beneficiaries: 2000,
    location: "Uttar Pradesh, India",
    endDate: "2024-09-30",
  },
]


export const impactStats = [
  { number: 350000, label: "Worth Donations", icon: Users, color: "text-blue-600" },
  { number: 1200, label: "Unique Donors", icon: Globe, color: "text-green-600" },
  { number: 10000, label: "Lives Impacted", icon: Target, color: "text-purple-600" },
  { number: 500, label: "Healthcare Camps", icon: Award, color: "text-red-600" },
]

export const urgencyColors = {
  Critical: "bg-red-500 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-green-500 text-white",
}

export const orderItems = [
  {
    id: 1,
    title: "Family Care Package",
    price: 1500,
    quantity: 2,
    impact: "Supports 2 families for 3 weeks each",
  },
  {
    id: 2,
    title: "Basic Relief Package",
    price: 500,
    quantity: 1,
    impact: "Feeds 1 family for 7 days",
  },
]

export const testimonials = [
  {
    name: "Priyanjan",
    role: "Volunteer",
    image: "/images/testimonials/priyanjan.webp",
    quote:
      "Volunteering has given me the chance to create meaningful change and connect with communities in ways I never imagined.",
    rating: 5,
    location: "Delhi",
  },
  {
    name: "Aryan Gupta",
    role: "Volunteer",
    image: "/images/testimonials/aryan.webp",
    quote:
      "Every hour I spend helping others reminds me how small actions can create big waves of change.",
    rating: 5,
    location: "Delhi",
  },
  {
    name: "Kunal Tanwar",
    role: "Volunteer",
    image: "/images/testimonials/Kunal_Tanwar.webp",
    quote:
      "Being a volunteer isn’t just about giving time — it’s about sharing hope and building a better future together.",
    rating: 5,
    location: "Delhi",
  },
  {
    name: "Aman Yadav",
    role: "Donor",
    image: "/images/testimonials/no-profile.png",
    quote:
      "When I saw how transparently my donation was used, I knew I wanted to continue supporting every month.",
    rating: 5,
    location: "Lucknow",
  },
  {
    name: "Jatin Sharma",
    role: "Donor",
    image: "/images/testimonials/no-profile.png",
    quote:
      "It feels amazing to know that my small contribution can help educate a child or feed a family. That’s real impact.",
    rating: 5,
    location: "Jaipur",
  },
  {
    name: "Sneha Patel",
    role: "Beneficiary",
    image: "/images/testimonials/no-profile.png",
    quote:
      "Thanks to the campaign’s support, I was able to restart my small business after the floods. I’ll always be grateful.",
    rating: 5,
    location: "Gujarat",
  },
  {
    name: "Rahul Verma",
    role: "Volunteer",
    image: "/images/testimonials/no-profile.png",
    quote:
      "Working with this organization taught me how collective effort can truly uplift lives. It’s been a life-changing experience.",
    rating: 5,
    location: "Mumbai",
  },
];


export const values = [
  {
    title: "Transparency",
    description: "Complete openness in our operations, finances, and impact reporting",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Compassion",
    description: "Treating every beneficiary with dignity, respect, and genuine care",
    icon: Heart,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    title: "Excellence",
    description: "Striving for the highest standards in everything we do",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    title: "Collaboration",
    description: "Working together with communities, partners, and stakeholders",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Innovation",
    description: "Embracing new ideas and technologies to maximize our impact",
    icon: Zap,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Sustainability",
    description: "Creating lasting change that continues beyond our direct involvement",
    icon: TrendingUp,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
]

export const impactAreas = [
  {
    title: "Food Security",
    description: "Providing nutritious meals and combating hunger in underserved communities",
    impact: "50k+ meals served",
    image: "/images/area_of_impact/food_delhi.webp",
  },
  {
    title: "Education",
    description: "Ensuring quality education access for children from disadvantaged backgrounds",
    impact: "10,000+ children educated",
    image: "/images/area_of_impact/edu_delhi.webp",
  },
  {
    title: "Skill Development",
    description: "Offering vocational training in areas with high employment potential particularly for youth ",
    impact: "50+ skill camps",
    image: "/images/area_of_impact/skill_delhi.webp",
  },
  {
    title: "Women Empowerment",
    description: "Supporting women through skill development and economic opportunities",
    impact: "1,000+ women empowered",
    image: "/images/area_of_impact/women_delhi.webp",
  },
]


export const contactReasons = [
  "General Inquiry",
  "Volunteer Opportunity",
  "Partnership Proposal",
  "Media & Press",
  "Donation Support",
  "Technical Issue",
  "Feedback & Suggestions",
  "Other",
]

export const officeLocations = [
  {
    city: "Delhi (Head Office)",
    address: "719 Mehalla Mohalla, Madanpur Khadar, Delhi - 110076",
    phone: "+91 99993 03166",
    email: "dwaparyugfoundation@gmail.com",
    hours: "Mon-Fri: 9:30 AM - 6:30 PM",
    mapUrl: "#",
  },
  // {
  //   city: "Mumbai",
  //   address: "Plot No. 45, Sector 12, Vashi, Navi Mumbai - 400703",
  //   phone: "+91 98765 43210",
  //   email: "mumbai@dwaparyug.org",
  //   hours: "Mon-Fri: 10:00 AM - 7:00 PM",
  //   mapUrl: "#",
  // },
  // {
  //   city: "Bangalore",
  //   address: "123 MG Road, Brigade Road, Bangalore - 560001",
  //   phone: "+91 87654 32109",
  //   email: "bangalore@dwaparyug.org",
  //   hours: "Mon-Fri: 9:00 AM - 6:00 PM",
  //   mapUrl: "#",
  // },
]

export const stats = [
  {
    title: "Total Campaigns",
    value: "24",
    change: "+12%",
    changeType: "increase",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Active Products",
    value: "156",
    change: "+8%",
    changeType: "increase",
    icon: Package,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Total Donations",
    value: "₹45,231,890",
    change: "+20.1%",
    changeType: "increase",
    icon: DollarSign,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    title: "Registered Users",
    value: "5,731",
    change: "+15%",
    changeType: "increase",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Active Campaigns",
    value: "23",
    change: "+5 new",
    changeType: "increase",
    icon: ListChecks,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Products in Stock",
    value: "1,234",
    change: "-10%",
    changeType: "decrease",
    icon: Package,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
]

export const recentCampaigns = [
  {
    id: 1,
    title: "Winter Emergency Relief",
    category: "Emergency Relief",
    status: "Active",
    raised: "₹2,85,000",
    goal: "₹5,00,000",
    progress: 57,
  },
  {
    id: 2,
    title: "Diwali Joy Distribution",
    category: "Festival",
    status: "Active",
    raised: "₹1,25,000",
    goal: "₹3,00,000",
    progress: 42,
  },
  {
    id: 3,
    title: "Child Education Support",
    category: "Education",
    status: "Completed",
    raised: "₹9,20,000",
    goal: "₹10,00,000",
    progress: 92,
  },
]

export const recentDonations = [
  {
    id: 1,
    donor: "Rajesh Kumar",
    amount: "₹5,000",
    campaign: "Winter Relief",
    date: "2024-01-15",
    status: "Completed",
  },
  {
    id: 2,
    donor: "Priya Sharma",
    amount: "₹2,500",
    campaign: "Diwali Distribution",
    date: "2024-01-15",
    status: "Completed",
  },
  {
    id: 3,
    donor: "Anonymous",
    amount: "₹10,000",
    campaign: "Education Support",
    date: "2024-01-14",
    status: "Pending",
  },
]




export const initialProducts: Product[] = [
  {
    id: 1,
    name: "Diwali Sweet Box",
    price: 500,
    stock: 100,
    unit: "boxes", // Corrected key from 'units' to 'unit'
    image: "/placeholder.svg?height=50&width=50&text=Sweet+Box",
  },
  {
    id: 2,
    name: "Winter Blanket",
    price: 800,
    stock: 200,
    unit: "units", // Corrected key from 'units' to 'unit'
    image: "/placeholder.svg?height=50&width=50&text=Blanket",
  },
  {
    id: 3,
    name: "School Kit",
    price: 1200,
    stock: 50,
    unit: "kits", // Corrected key from 'units' to 'unit'
    image: "/placeholder.svg?height=50&width=50&text=School+Kit",
  },
  {
    id: 4,
    name: "Medical Aid Pack",
    price: 700,
    stock: 150,
    unit: "packs", // Corrected key from 'units' to 'unit'
    image: "/placeholder.svg?height=50&width=50&text=Medical+Aid",
  },
];

export const initialCampaigns: Campaign[] = [
  {
    id: 1,
    title: "Winter Relief Drive 2024",
    category: "Emergency Relief",
    overview: "Providing warmth and food to homeless families during harsh winter.",
    details:
      "This campaign aims to distribute blankets, warm clothing, and hot meals to over 1000 families in urban slums. We are collaborating with local volunteers and community centers to identify the most vulnerable individuals.",
    goal: 500000,
    raised: 350000,
    status: "Active",
    bannerImage: "/placeholder.svg?height=300&width=600&text=Winter+Relief+Banner",
    additionalImages: [
      "/placeholder.svg?height=150&width=250&text=Winter+1",
      "/placeholder.svg?height=150&width=250&text=Winter+2",
    ],
    assignedProducts: [initialProducts[0], initialProducts[1]],
    endDate: new Date("2024-12-31"),
    priority: "high",
    aboutCampaign: "<p>This is a detailed description of the **Winter Relief Drive** using `react-quill`.</p><p>We focus on providing essential supplies to those in need during the cold months.</p>",
    faq_questions: [
      { question: "How can I volunteer?", answer: "You can sign up on our website's volunteer section." },
      { question: "How are donations used?", answer: "All donations go directly towards purchasing supplies like blankets and food." },
    ],
    total_beneficiary: 850,
    total_donors_till_now: 420,
    videoLinks: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
    total_progress_percentage: 70,
  },
  {
    id: 2,
    title: "Educate a Child Program",
    category: "Education",
    overview: "Sponsoring education for underprivileged children in rural areas.",
    details:
      "Our goal is to provide school supplies, uniforms, and tuition fees for 500 children who lack access to quality education. This program also includes mentorship and after-school support.",
    goal: 750000,
    raised: 600000,
    status: "Active",
    bannerImage: "/placeholder.svg?height=300&width=600&text=Educate+Child+Banner",
    additionalImages: [
      "/placeholder.svg?height=150&width=250&text=Edu+1",
      "/placeholder.svg?height=150&width=250&text=Edu+2",
      "/placeholder.svg?height=150&width=250&text=Edu+3",
    ],
    assignedProducts: [initialProducts[2]],
    endDate: new Date("2025-06-30"),
    priority: "medium",
    aboutCampaign: "<p>This is a campaign to support the **education of children**.</p><p>Every donation makes a difference in a child's future.</p>",
    faq_questions: [
      { question: "What materials are provided?", answer: "We provide school bags, notebooks, textbooks, and stationery." },
      { question: "How do you select beneficiaries?", answer: "We work with local community leaders to identify the most deserving families." },
    ],
    total_beneficiary: 400,
    total_donors_till_now: 550,
    videoLinks: [{ url: "https://www.youtube.com/watch?v=F_S5M1aE64k" }],
    total_progress_percentage: 80,
  },
  {
    id: 3,
    title: "Diwali Joy Distribution 2024",
    festivalType: "Diwali",
    overview: "Spreading happiness during Diwali by distributing festive kits.",
    details:
      "We aim to reach 1500 families with Diwali sweet boxes, diyas, and new clothes. This initiative brings light and joy to those who might otherwise miss out on festive celebrations.",
    goal: 300000,
    raised: 300000,
    status: "Completed",
    bannerImage: "/placeholder.svg?height=300&width=600&text=Diwali+Banner",
    additionalImages: ["/placeholder.svg?height=150&width=250&text=Diwali+1"],
    assignedProducts: [initialProducts[0]],
    endDate: new Date("2024-11-15"),
    priority: "low",
    aboutCampaign: "<p>The Diwali Joy Distribution campaign was a huge **success**!</p><p>We thank all our donors for their generous contributions.</p>",
    faq_questions: [],
    total_beneficiary: 1500,
    total_donors_till_now: 980,
    videoLinks: [],
    total_progress_percentage: 100,
  },
  {
    id: 4,
    title: "Rural Healthcare Access",
    overview: "Establishing mobile clinics for remote villages.",
    details:
      "Our mobile medical units provide essential healthcare services, free check-ups, and medicines to villagers who have limited access to medical facilities. We focus on preventive care and health education.",
    goal: 1000000,
    raised: 100000,
    status: "Draft",
    bannerImage: "/placeholder.svg?height=300&width=600&text=Healthcare+Banner",
    additionalImages: [],
    assignedProducts: [initialProducts[3]],
    endDate: new Date("2025-03-31"),
    priority: "critical",
    aboutCampaign: "<p>We are currently in the **planning phase** for our rural healthcare campaign.</p><p>Your support is crucial to help us launch this initiative.</p>",
    faq_questions: [],
    total_beneficiary: 0,
    total_donors_till_now: 10,
    videoLinks: [],
    location: '',
    organizer: '',
    verified: true,
    urgency: 'high',
    total_progress_percentage: 10,
  },
];

export const campaignCategories = ["Emergency Relief", "Education", "Healthcare", "Festival Celebration", "Women Empowerment"]
export const festivalTypes = ["Diwali", "Christmas", "Holi", "Eid", "Other"]


export const countries = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "UAE",
  "Other",
]



