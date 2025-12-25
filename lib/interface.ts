// Campaign related interfaces
export interface Campaign {
  id: number;
  title: string;
  category_id: number;
  category_name?: string;
  festival_type?: string;
  overview: string;
  details: string;
  about_campaign?: string;
  donation_goal: number;
  sequence: number;
  total_raised?: any;
  total_progress_percentage?: number;
  image: string;
  images_array?: string[];
  status: 'Draft' | 'Active' | 'Completed' | 'Inactive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  location?: string;
  organizer?: string;
  verified?: boolean;
  is_featured?: boolean;
  total_beneficiary?: number;
  beneficiaries?: number;
  total_donors_till_now?: number;
  start_date?: string;
  end_date: string;
  description?: string;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
  mobile_banner_image?: string;
  // Related data
  assignedProducts?: Product[];
  faq_questions?: FAQ[];
  videoLinks?: string[];
}

export interface Product {
  id?: number;
  campaign_id?: number;
  name: string;
  description?: string;
  price: number;
  unit_id?: number;
  unit_name?: string;
  image?: string;
  min_qty?: number;
  max_qty?: number;
  stock?: number;
  increment_count?: number;
  is_flexible_increment_count?: boolean;
  allows_personalization?: boolean;
  status?: 'Active' | 'Inactive';
  sequence?: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FAQ {
  id?: number;
  campaign_id?: number;
  question: string;
  answer: string;
  sequence?: number;
  is_active?: boolean;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUnit {
  id: number;
  name: string;
  abbreviation?: string;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignVideo {
  id?: number;
  campaign_id: number;
  video_url: string;
  video_title?: string;
  video_description?: string;
  sequence?: number;
  is_active?: boolean;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Donation related interfaces
export interface Donation {
  id: number;
  user_id?: number;
  campaign_id: number;
  donation_payment_request_id: number;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  donation_amount: number;
  tip_amount: number;
  total_amount: number;
  donation_type: 'direct' | 'product_based';
  is_public: boolean;
  donation_date: string;
  donated_on_behalf_of?: string;
  donor_message?: string;
  impact_generated: boolean;
  beneficiaries_reached: number;
  created_at?: string;
  updated_at?: string;

  // Related data
  donor_name?: string;
  donor_email?: string;
  campaign_title?: string;
  items?: DonationItem[];
  personalization?: PersonalizationOption;
}

export interface DonationItem {
  id: number;
  donation_id: number;
  campaign_product_id: number;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  fulfillment_status: 'pending' | 'in_batch' | 'distributed' | 'delivered';
  created_at?: string;
  updated_at?: string;

  // Related data
  product_name?: string;
  product_description?: string;
  personalization?: PersonalizationOption;
}

export interface PersonalizationOption {
  id?: number;
  donation_id?: number;
  donation_item_id?: number;
  donor_name?: string;
  donor_country?: string;
  custom_image?: string;
  is_image_available?: boolean;
  custom_message?: string;
  donation_purpose?: string;
  special_instructions?: string;
  created_at?: string;
}

export interface DonationPaymentRequest {
  id: number;
  campaign_id: number;
  user_id?: number;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  donation_type: 'direct' | 'product_based';
  status: 'created' | 'attempted' | 'paid' | 'failed' | 'cancelled';
  payment_response?: any;
  created_at?: string;
  updated_at?: string;
}

// Distribution and Impact interfaces
export interface DistributionBatch {
  id: number;
  campaign_id: number;
  batch_name: string;
  batch_description?: string;
  planned_distribution_date?: string;
  planned_location?: string;
  planned_beneficiaries: number;
  actual_distribution_date?: string;
  actual_location?: string;
  actual_beneficiaries: number;
  status: 'planning' | 'prepared' | 'in_progress' | 'completed' | 'cancelled';
  total_value: number;
  total_items: number;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;

  // Related data
  items?: BatchItem[];
}

export interface BatchItem {
  id: number;
  batch_id: number;
  donation_item_id: number;
  quantity_allocated: number;
  status: 'allocated' | 'prepared' | 'distributed';
  created_at?: string;
  updated_at?: string;
}

export interface ImpactStory {
  id: number;
  campaign_id: number;
  batch_id?: number;
  title: string;
  story_content: string;
  impact_summary?: string;
  image_urls?: string[];
  video_urls?: string[];
  people_helped: number;
  families_helped: number;
  communities_helped: number;
  location?: string;
  impact_date?: string;
  is_published: boolean;
  featured: boolean;
  posted_by: number;
  created_at?: string;
  updated_at?: string;
}

// User interfaces
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  mobile_no: string;
  dob?: string;
  email: string;
  password: string;
  is_verified: boolean;
  role_id?: number;
  role_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// Analytics interfaces
export interface CampaignAnalytics {
  id: number;
  title: string;
  donation_goal: number;
  total_raised: number;
  total_progress_percentage: number;
  total_beneficiary: number;
  total_donors_till_now: number;
  actual_donations_count: number;
  direct_donations_count: number;
  product_donations_count: number;
  actual_amount_raised: number;
  distribution_batches_count: number;
  impact_stories_count: number;
}

export interface DonorImpactSummary {
  donation_id: number;
  user_id?: number;
  donor_name?: string;
  campaign_id: number;
  campaign_title: string;
  donation_amount: number;
  donation_type: 'direct' | 'product_based';
  donation_date: string;
  impact_stories_count: number;
  total_people_helped: number;
  impact_story_titles?: string;
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form interfaces
export interface CampaignFormData {
  title: string;
  category_id: number;
  festival_type?: string;
  overview: string;
  details: string;
  about_campaign: string;
  donation_goal: number;
  image: string;
  images_array: string[];
  end_date: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  location?: string;
  organizer?: string;
  verified: boolean;
  assignedProducts: Product[];
  faq_questions: FAQ[];
  videoLinks: { url: string }[];
}


export interface ProductUnit {
  id: number;
  name: string;
  abbreviation?: string;
}

export interface IndependentProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  unit_id?: number;
  unit?: ProductUnit;
  image?: string;
  min_qty: number;
  max_qty?: number;
  stock: number;
  increment_count: number;
  is_flexible_increment_count: boolean;
  allows_personalization: boolean;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}


export interface CampaignCategory {
  id: number
  name: string
}


export interface CampaignCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}



export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CampaignFilters {
  selectedCategory?: number | null;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  status?: string
  sortBy?: string
  sortOrder?: string
  is_featured?: number;
}

export interface CampaignListProps {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showCategoryFilter?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  showViewToggle?: boolean;
  defaultViewMode?: 'grid' | 'list';
  pageSize?: number;
  categoryFilter?: number | null;
  maxItems?: number;
  showCreateButton?: boolean;
  className?: string;
}
