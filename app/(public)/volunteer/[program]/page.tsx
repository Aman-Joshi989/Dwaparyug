"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  HandHeart,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Heart,
  Users,
  BookOpen,
  Stethoscope,
  Leaf,
  UserCheck,
  Shield,
  Utensils,
  AlertTriangle,
  Laptop,
  PawPrint
} from "lucide-react"

// Volunteer programs data
const volunteerPrograms = {
  "kitchen-helper": {
    id: 1,
    title: "Community Kitchen Helper",
    description:
      "Help serve meals and assist in food preparation for our community kitchen program",
    image: "/volunteer-kitchen.jpg",
    location: "Downtown Community Center",
    timeCommitment: "4 hours/week",
    category: "Food Security",
    participants: 45,
    link: "/volunteer/kitchen-helper",
    icon: <Utensils className="w-6 h-6" />,
    color: "bg-orange-500",
    requirements: [
      "Physical ability to stand for extended periods",
      "Food safety awareness",
      "Team collaboration",
    ],
    benefits: ["Learn cooking skills", "Community impact", "Weekly meals provided"],
    schedule: ["Monday-Friday: 11 AM - 3 PM", "Weekend shifts available"],
  },
  "education-support": {
    id: 2,
    title: "Children's Education Support",
    description:
      "Tutor underprivileged children and help with homework and learning activities",
    image: "/volunteer-education.jpg",
    location: "Various Schools",
    timeCommitment: "2-3 hours/week",
    category: "Education",
    participants: 62,
    link: "/volunteer/education-support",
    icon: <BookOpen className="w-6 h-6" />,
    color: "bg-blue-500",
    requirements: [
      "High school education minimum",
      "Patience with children",
      "Basic subject knowledge",
    ],
    benefits: [
      "Teaching experience",
      "Skill development",
      "Certificate of appreciation",
    ],
    schedule: ["Weekdays: 3 PM - 6 PM", "Saturday: 10 AM - 2 PM"],
  },
  "healthcare-outreach": {
    id: 3,
    title: "Healthcare Outreach",
    description:
      "Assist medical professionals in health camps and awareness programs",
    image: "/volunteer-healthcare.jpg",
    location: "Rural Areas",
    timeCommitment: "1 day/month",
    category: "Healthcare",
    participants: 38,
    link: "/volunteer/healthcare-outreach",
    icon: <Stethoscope className="w-6 h-6" />,
    color: "bg-red-500",
    requirements: [
      "Medical background preferred",
      "Physical stamina",
      "Empathy and compassion",
    ],
    benefits: [
      "Medical experience",
      "Rural exposure",
      "Transportation provided",
    ],
    schedule: ["First Saturday of each month", "8 AM - 6 PM"],
  },
  environment: {
    id: 4,
    title: "Environmental Clean-up",
    description:
      "Join our environmental initiatives and community clean-up drives",
    image: "/volunteer-environment.jpg",
    location: "City Parks & Rivers",
    timeCommitment: "Half day/month",
    category: "Environment",
    participants: 89,
    link: "/volunteer/environment",
    icon: <Leaf className="w-6 h-6" />,
    color: "bg-green-500",
    requirements: [
      "Physical fitness",
      "Environmental awareness",
      "Own transportation preferred",
    ],
    benefits: [
      "Environmental impact",
      "Outdoor activity",
      "Community recognition",
    ],
    schedule: ["Second Sunday of each month", "7 AM - 12 PM"],
  },
  "elderly-care": {
    id: 5,
    title: "Elderly Care Companion",
    description:
      "Spend time with senior citizens, assist in daily activities, and provide companionship",
    image: "/volunteer-elderly.jpg",
    location: "Senior Living Homes",
    timeCommitment: "2 hours/week",
    category: "Social Care",
    participants: 30,
    link: "/volunteer/elderly-care",
    icon: <Heart className="w-6 h-6" />,
    color: "bg-pink-500",
    requirements: [
      "Patience and empathy",
      "Good communication skills",
      "Basic first-aid knowledge preferred",
    ],
    benefits: [
      "Meaningful relationships",
      "Emotional fulfillment",
      "Community recognition",
    ],
    schedule: ["Weekdays: 4 PM - 6 PM", "Weekend visits available"],
  },
  "digital-literacy": {
    id: 6,
    title: "Digital Literacy Trainer",
    description:
      "Teach basic computer and smartphone skills to community members",
    image: "/volunteer-digital.jpg",
    location: "Community Technology Centers",
    timeCommitment: "3 hours/week",
    category: "Education & Technology",
    participants: 25,
    link: "/volunteer/digital-literacy",
    icon: <Laptop className="w-6 h-6" />,
    color: "bg-purple-500",
    requirements: [
      "Basic computer skills",
      "Patience with learners",
      "Ability to explain technical concepts simply",
    ],
    benefits: [
      "Teaching experience",
      "Digital empowerment impact",
      "Skill enhancement",
    ],
    schedule: ["Weekdays: 5 PM - 8 PM", "Saturday mornings"],
  },
  "animal-shelter": {
    id: 7,
    title: "Animal Shelter Volunteer",
    description:
      "Help care for rescued animals, assist with feeding, cleaning, and adoption events",
    image: "/volunteer-animals.jpg",
    location: "Local Animal Shelter",
    timeCommitment: "4 hours/week",
    category: "Animal Welfare",
    participants: 40,
    link: "/volunteer/animal-shelter",
    icon: <PawPrint className="w-6 h-6" />,
    color: "bg-yellow-600",
    requirements: [
      "Love for animals",
      "Physical ability for handling pets",
      "Comfortable with cleaning duties",
    ],
    benefits: [
      "Animal care experience",
      "Emotional satisfaction",
      "Volunteer recognition",
    ],
    schedule: ["Daily shifts available", "Morning and evening options"],
  },
  "emergency-response": {
    id: 8,
    title: "Emergency Response Volunteer",
    description:
      "Assist in disaster relief operations, provide first aid, and help with logistics",
    image: "/volunteer-emergency.jpg",
    location: "Disaster-prone areas",
    timeCommitment: "As needed during emergencies",
    category: "Disaster Relief",
    participants: 20,
    link: "/volunteer/emergency-response",
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "bg-red-700",
    requirements: [
      "First-aid certification preferred",
      "Physical stamina",
      "Ability to work in stressful situations",
    ],
    benefits: [
      "Life-saving skills",
      "High-impact contribution",
      "Recognition for bravery",
    ],
    schedule: ["On-call during emergencies"],
  },
};


// Zod validation schema
const volunteerFormSchema = z.object({
  // Personal Information
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number"),
  age: z.string()
    .refine((val) => {
      const num = parseInt(val)
      return num >= 16 && num <= 100
    }, "Age must be between 16 and 100"),

  // Address
  address: z.string()
    .min(10, "Please provide a complete address"),
  city: z.string()
    .min(2, "City is required"),
  zipCode: z.string()
    .min(5, "Please enter a valid zip code"),

  // Volunteer Preferences
  preferredProgram: z.string()
    .min(1, "Please select a volunteer program"),
  availability: z.array(z.string())
    .min(1, "Please select at least one availability option"),
  timeCommitment: z.enum(["1-2 hours/week", "3-4 hours/week", "5+ hours/week", "Flexible"], {
    required_error: "Please select your time commitment"
  }),

  // Experience and Skills
  previousVolunteerExperience: z.enum(["yes", "no"], {
    required_error: "Please indicate your volunteer experience"
  }),
  volunteerExperienceDetails: z.string().optional(),
  skills: z.array(z.string()),
  languages: z.string().optional(),

  // Motivation and Goals
  motivation: z.string()
    .min(30, "Please provide at least 30 characters about your motivation")
    .max(500, "Motivation must be less than 500 characters"),
  goals: z.string()
    .min(30, "Please provide at least 30 characters about your goals")
    .max(300, "Goals must be less than 300 characters"),

  // Emergency Contact
  emergencyContactName: z.string()
    .min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string()
    .min(10, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string()
    .min(2, "Emergency contact relationship is required"),

  // Agreements
  backgroundCheck: z.boolean()
    .refine(val => val === true, "Background check consent is required"),
  termsAndConditions: z.boolean()
    .refine(val => val === true, "You must accept terms and conditions"),
  newsletter: z.boolean().optional(),
}).refine((data) => {
  if (data.previousVolunteerExperience === "yes" && !data.volunteerExperienceDetails) {
    return false
  }
  return true
}, {
  message: "Please provide details about your volunteer experience",
  path: ["volunteerExperienceDetails"]
})

type VolunteerFormData = z.infer<typeof volunteerFormSchema>

const availabilityOptions = [
  "Weekday mornings",
  "Weekday afternoons",
  "Weekday evenings",
  "Weekend mornings",
  "Weekend afternoons",
  "Weekend evenings"
]

const skillsOptions = [
  "Teaching/Tutoring",
  "Cooking",
  "Medical/Healthcare",
  "Communication",
  "Leadership",
  "Computer Skills",
  "Language Skills",
  "Manual Labor",
  "Event Planning",
  "Photography",
  "Social Media",
  "Writing"
]

export default function VolunteerContactPage() {
  const params = useParams()
  console.log("🚀 ~ VolunteerContactPage ~ params:", params)
  const programSlug = params?.program as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
console.log('✌️selectedProgram --->', selectedProgram);

  const form = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      age: "",
      address: "",
      city: "",
      zipCode: "",
      preferredProgram: programSlug || "",
      availability: [],
      timeCommitment: undefined,
      previousVolunteerExperience: undefined,
      volunteerExperienceDetails: "",
      skills: [],
      languages: "",
      motivation: "",
      goals: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      backgroundCheck: false,
      termsAndConditions: false,
      newsletter: false,
    }
  })

  // Set selected program based on URL parameter
  useEffect(() => {
    if (programSlug && volunteerPrograms[programSlug as keyof typeof volunteerPrograms]) {
      const program = volunteerPrograms[programSlug as keyof typeof volunteerPrograms]
      setSelectedProgram(program)
      form.setValue("preferredProgram", programSlug)
    }
  }, [programSlug, form])

  const onSubmit = async (data: VolunteerFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/volunteer/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.details) {
          // Set form errors from server validation
          result.details.forEach((error: any) => {
            const fieldName = error.path[0]
            if (fieldName) {
              form.setError(fieldName, {
                type: 'server',
                message: error.message
              })
            }
          })
          return
        }

        // Handle duplicate application
        if (response.status === 409) {
          form.setError('email', {
            type: 'server',
            message: result.error || 'An application already exists for this email'
          })
          return
        }

        // Handle other errors
        throw new Error(result.error || 'Failed to submit application')
      }

      // Success - log the response data
      console.log("Application submitted successfully:", {
        applicationId: result.applicationId,
        submittedAt: result.submittedAt,
        applicant: result.data
      })

      setSubmitSuccess(true)

    } catch (error) {
      console.error("Error submitting volunteer application:", error)

      // Show generic error message
      form.setError('root', {
        type: 'server',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      })

    } finally {
      setIsSubmitting(false)
    }
  }
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <Card className="text-center shadow-2xl border-0">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Application Submitted Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Thank you for your interest in volunteering with us. We've received your application
                and our volunteer coordinator will contact you within 2-3 business days.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-blue-800 space-y-1 text-left">
                  <li>• Background check processing (if required)</li>
                  <li>• Volunteer orientation scheduling</li>
                  <li>• Program-specific training</li>
                  <li>• Welcome package and resources</li>
                </ul>
              </div>
              <Button
                onClick={() => window.location.href = '/volunteer'}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Heart className="w-4 h-4 mr-2" />
                Explore More Programs
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-purple-100 px-6 py-3 rounded-full text-sm font-medium text-gray-700 mb-6">
            <HandHeart className="w-4 h-4 mr-2 text-pink-600" />
            Volunteer Application • Join Our Mission
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Start Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              Volunteer Journey
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Take the first step towards making a meaningful impact in your community.
            Fill out our application form and join our family of dedicated volunteers.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Selected Program Card */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {selectedProgram && (
              <div className="sticky top-8">
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className={`${selectedProgram.color} text-white p-6`}>
                    <div className="flex items-center mb-4">
                      {selectedProgram.icon}
                      <h3 className="text-xl font-bold ml-3">{selectedProgram.title}</h3>
                    </div>
                    <p className="text-white/90 text-sm">{selectedProgram.description}</p>
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                        {selectedProgram.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-green-500" />
                        {selectedProgram.timeCommitment}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-purple-500" />
                        {selectedProgram.participants} active volunteers
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {selectedProgram.requirements.map((req: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="w-3 h-3 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {selectedProgram.benefits.map((benefit: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <Heart className="w-3 h-3 mr-2 text-pink-500 mt-0.5 flex-shrink-0" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {selectedProgram.schedule.map((schedule: string, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <Calendar className="w-3 h-3 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                              {schedule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>

          {/* Application Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="shadow-xl border-0">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl text-gray-900">Volunteer Application Form</CardTitle>
                <CardDescription>
                  Please fill out all required fields. This information helps us match you with the best volunteer opportunities.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Personal Information */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem className="max-w-xs">
                            <FormLabel>Age *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="25" {...field} />
                            </FormControl>
                            <FormDescription>
                              Volunteers must be at least 16 years old
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address Information */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street, Apt 4B" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Your city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code *</FormLabel>
                              <FormControl>
                                <Input placeholder="12345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Volunteer Preferences */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <HandHeart className="w-5 h-5 text-pink-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Volunteer Preferences</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="preferredProgram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Program *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a volunteer program" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(volunteerPrograms).map(([key, program]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center">
                                      {program.icon}
                                      <span className="ml-2">{program.title}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="availability"
                        render={() => (
                          <FormItem>
                            <FormLabel>Availability *</FormLabel>
                            <FormDescription>
                              Select all time slots when you're available to volunteer
                            </FormDescription>
                            <div className="grid md:grid-cols-2 gap-2">
                              {availabilityOptions.map((option) => (
                                <FormField
                                  key={option}
                                  control={form.control}
                                  name="availability"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(option)}
                                          onCheckedChange={(checked) => {
                                            const updatedValue = checked
                                              ? [...(field.value || []), option]
                                              : (field.value || []).filter((value) => value !== option)
                                            field.onChange(updatedValue)
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal text-sm">
                                        {option}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeCommitment"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Time Commitment *</FormLabel>
                            <FormDescription>
                              How much time can you dedicate per week?
                            </FormDescription>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                {["1-2 hours/week", "3-4 hours/week", "5+ hours/week", "Flexible"].map((option) => (
                                  <div key={option} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={option} />
                                    <Label htmlFor={option} className="text-sm">{option}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Experience and Skills */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Experience & Skills</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="previousVolunteerExperience"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Previous Volunteer Experience *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex gap-6"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="yes" id="exp-yes" />
                                  <Label htmlFor="exp-yes">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no" id="exp-no" />
                                  <Label htmlFor="exp-no">No</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("previousVolunteerExperience") === "yes" && (
                        <FormField
                          control={form.control}
                          name="volunteerExperienceDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Volunteer Experience Details</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Please describe your previous volunteer experience..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="languages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Languages Spoken</FormLabel>
                            <FormControl>
                              <Input placeholder="English, Spanish, French..." {...field} />
                            </FormControl>
                            <FormDescription>
                              List any additional languages you speak fluently
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Motivation and Goals */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <Heart className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Motivation & Goals</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="motivation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Why do you want to volunteer? *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Share what motivates you to volunteer and make a difference..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 30 characters required
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="goals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What do you hope to achieve through volunteering? *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your personal goals and what you hope to gain from this experience..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum 30 characters required
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <Phone className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 987-6543" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="emergencyContactRelationship"
                        render={({ field }) => (
                          <FormItem className="max-w-md">
                            <FormLabel>Relationship *</FormLabel>
                            <FormControl>
                              <Input placeholder="Parent, Spouse, Sibling, Friend..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Agreements */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Agreements & Consent</h3>
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="backgroundCheck"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Background Check Consent *
                                </FormLabel>
                                <FormDescription>
                                  I consent to a background check if required for my volunteer position.
                                  This helps ensure the safety of all participants in our programs.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="termsAndConditions"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Terms and Conditions *
                                </FormLabel>
                                <FormDescription>
                                  I agree to the volunteer terms and conditions, including commitment to the
                                  organization's mission and adherence to all policies and procedures.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="newsletter"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-blue-50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Newsletter Subscription (Optional)
                                </FormLabel>
                                <FormDescription>
                                  I would like to receive updates about volunteer opportunities,
                                  events, and organizational news via email.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.formState.errors.backgroundCheck && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Required Consent</AlertTitle>
                          <AlertDescription>
                            Background check consent is required to proceed with your application.
                          </AlertDescription>
                        </Alert>
                      )}

                      {form.formState.errors.termsAndConditions && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Terms Required</AlertTitle>
                          <AlertDescription>
                            You must accept the terms and conditions to submit your application.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-3 text-lg font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <HandHeart className="w-5 h-5 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional Information */}
        <motion.div
          className="mt-12 grid md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="text-center p-6 border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Safe & Secure</h3>
            <p className="text-sm text-gray-600">
              Your information is protected with enterprise-grade security and used only for volunteer coordination.
            </p>
          </Card>

          <Card className="text-center p-6 border-0 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Community Focused</h3>
            <p className="text-sm text-gray-600">
              Join hundreds of volunteers making a real difference in our local community every day.
            </p>
          </Card>

          <Card className="text-center p-6 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Personal Growth</h3>
            <p className="text-sm text-gray-600">
              Develop new skills, build meaningful relationships, and create lasting positive impact.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}