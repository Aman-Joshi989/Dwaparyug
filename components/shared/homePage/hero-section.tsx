'use client';

import { useScroll, useTransform, motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { CampaignFilters } from '@/lib/interface';
import { titleToSlug } from '@/lib/slug-helper';

// Types
interface Campaign {
  id: number;
  title: string;
  category_id: number;
  category_name?: string;
  festival_type?: string;
  overview: string;
  details: string;
  about_campaign?: string;
  donation_goal: number;
  total_raised?: any;
  total_progress_percentage?: number;
  image: string;
  mobile_banner_image?: string;
  images_array?: string[];
  status: 'Draft' | 'Active' | 'Completed' | 'Inactive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  urgency?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  location?: string;
  organizer?: string;
  verified?: boolean;
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
}


interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SliderData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  mobileImage?: string;
  ctaText: string;
  ctaLink: string;
}

// API Service
const apiService = {
  fetchCampaigns: async (filters: CampaignFilters = {}): Promise<{ campaigns: Campaign[], pagination: PaginationState }> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.selectedCategory) params.append('category_id', filters.selectedCategory.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy.toString());
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder.toString());
      params.append('is_featured', '1');
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      const response = await fetch(`/api/campaigns?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return { campaigns: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  }
};


const transformCampaignsToSlides = (campaigns: Campaign[]): SliderData[] => {
  const obj = campaigns.map((campaign) => {
    const slug = titleToSlug(campaign.title);
    return {
      id: campaign.id,
      title: campaign.title,
      subtitle: campaign.category_name || 'Making a Difference',
      description: campaign.overview || campaign.about_campaign || campaign.details || 'Join us in making a positive impact in the community.',
      image: campaign.image || (campaign.images_array && campaign.images_array[0]) || '/images/placeholder-campaign.jpg',
      mobileImage: campaign.mobile_banner_image || campaign.image || (campaign.images_array && campaign.images_array[0]) || '/images/placeholder-campaign.jpg',
      ctaText: 'Donate Now',
      ctaLink: `/causes/${slug}`,
    }
  })
  return obj;
};

const instantFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15, ease: "easeInOut" },
};

const HeroSlider = ({ slides, loading }: { slides: SliderData[], loading: boolean }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const minSwipeDistance = 50;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (slides.length > 1 && !loading) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [currentSlide, slides.length, loading]);

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrev();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrev();
    else if (e.key === 'ArrowRight') goToNext();
  };

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full bg-gray-900 overflow-hidden"
      style={{
        aspectRatio: isMobile ? '79 / 122' : '2.39 / 1',
        height: isMobile ? '80vh' : 'auto',
        maxHeight: isMobile ? '80vh' : '620px',
        minHeight: isMobile ? '80vh' : '620px'
      }}

      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Hero banner carousel"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          {...instantFade}
          className="absolute inset-0"
        >
          <Link
            href={slides[currentSlide].ctaLink}
            className="block w-full h-full relative"
            aria-label={slides[currentSlide].title}
          >
            <picture className="w-full h-full">
              <source
                media="(max-width: 767px)"
                srcSet={
                  slides[currentSlide].mobileImage || slides[currentSlide].image
                }
              />
              <img
                alt={slides[currentSlide].title}
                src={slides[currentSlide].image}
                loading={currentSlide === 0 ? "eager" : "lazy"}
                style={{
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            </picture>

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </Link>

          {slides.length > 1 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10">
              <motion.div
                className="h-full bg-yellow-400"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 bg-white/90 hover:bg-white z-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 bg-white/90 hover:bg-white z-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 ${index === currentSlide
                ? 'w-6 md:w-8 h-2 bg-yellow-400 rounded-full shadow-md'
                : 'w-2 h-2 bg-white/50 hover:bg-white/70 rounded-full'
                }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentSlide ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -25]);
  const y2 = useTransform(scrollY, [0, 300], [0, 25]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slides = React.useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'Active');
    const sortedCampaigns = activeCampaigns.length > 0 ? activeCampaigns : campaigns;
    return transformCampaignsToSlides(sortedCampaigns.slice(0, 6));
  }, [campaigns]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const { campaigns: fetchedCampaigns } = await apiService.fetchCampaigns({
          page: 1,
          pageSize: 20,
          status: 'Active',
          sortBy: 'c.sequence',
          sortOrder: 'ASC',
        });

        setCampaigns(fetchedCampaigns);
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  if (error && campaigns.length === 0) {
    return null;
  }

  return (
    <div>
      <HeroSlider slides={slides} loading={loading} />
    </div>
  )
}

export default HeroSection;