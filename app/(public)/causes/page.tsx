'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Grid,
  List,
  Users,
  MapPin,
  Gift,
  Heart,
  Target,
  Calendar,
  ArrowRight,
  Shield,
  Star,
  Clock,
  Zap
} from 'lucide-react';
import { Category, CampaignFilters, Campaign, CampaignListProps, PaginationState } from '@/lib/interface';
import { titleToSlug } from '@/lib/slug-helper';

// API Service
const apiService = {
  fetchCategories: async (): Promise<Category[]> => {
    try {
      const response = await fetch('/api/campaign-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  fetchCampaigns: async (filters: CampaignFilters = {}): Promise<{ campaigns: Campaign[], pagination: PaginationState }> => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.selectedCategory) params.append('category_id', filters.selectedCategory.toString());
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/campaigns?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return { campaigns: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  }
};

// Minimal Category Filter Component
const CategoryFilter: React.FC<{
  categories: Category[];
  selectedCategory: number | null;
  onCategoryChange: (id: number | null) => void;
  loading: boolean;
}> = ({ categories, selectedCategory, onCategoryChange, loading }) => {
  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 md:px-0">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap ${!selectedCategory
            ? 'bg-red-600 text-white'
            : 'bg-yellow-400 text-black border border-gray-200'
            }`}
        >
          ALL
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap ${selectedCategory === category.id
              ? 'bg-red-600 text-white'
              : 'bg-yellow-400 text-black border border-gray-200'
              }`}
          >
            {category.name.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

// Minimal Search Component
const SearchBar: React.FC<{
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showViewToggle: boolean;
}> = ({ searchTerm, onSearchChange, viewMode, onViewModeChange, showViewToggle }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6 px-4 md:px-0">
      <div className="relative flex-1 max-w-xl w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search Campaigns"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-900 placeholder-gray-500 text-sm transition-all bg-white"
        />
      </div>

      {showViewToggle && (
        <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid'
              ? 'bg-white text-gray-900'
              : 'text-gray-500'
              }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list'
              ? 'bg-white text-gray-900'
              : 'text-gray-500'
              }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// Minimal Campaign Card Component
const CampaignCard: React.FC<{
  campaign: Campaign;
  viewMode: 'grid' | 'list';
  onDonate?: (campaignId: number) => void;
  onFavorite?: (campaignId: number) => void;
  onViewDetails?: (campaignId: number) => void;
}> = ({ campaign, viewMode, onDonate, onFavorite, onViewDetails }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const router = useRouter();

  const percentage = campaign.donation_goal > 0
    ? Math.round((campaign.total_raised / campaign.donation_goal) * 100)
    : 0;

  const endDate = new Date(campaign.end_date);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  // UPDATED: Use slug instead of ID

  const handleCardClick = () => {
    const slug = titleToSlug(campaign.title);
    localStorage.setItem('selectedCampaignId', campaign.id.toString());
    router.push(`/causes/${slug}`);
    onViewDetails?.(campaign.id);
  };

  const handleDonate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = titleToSlug(campaign.title);
    localStorage.setItem('selectedCampaignId', campaign.id.toString());
    router.push(`/causes/${slug}`);
    onDonate?.(campaign.id);
  };
  if (viewMode === 'list') {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 mb-3 cursor-pointer transition-all hover:border-gray-300"
        onClick={handleCardClick}
      >
        <div className="flex gap-4">
          <div className="w-24 h-24 flex-shrink-0 relative overflow-hidden rounded-lg">
            <img
              src={campaign.image || '/api/placeholder/128/128'}
              alt={campaign.title}
              className="w-full h-full  "
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <span className="inline-block bg-yellow-400 text-black text-xs px-2 py-1 rounded font-medium mb-2">
                  {campaign.category_name}
                </span>
                <h3 className="font-semibold text-base text-gray-900 mb-1 line-clamp-2">
                  {campaign.title}
                </h3>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">₹{campaign.total_raised?.toLocaleString() || '0'}</span>
                <span className="font-semibold text-gray-900">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Goal: ₹{campaign.donation_goal?.toLocaleString() || '0'}</span>
              {daysLeft > 0 && <span>{daysLeft} days left</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid View - Mobile First
  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer h-full flex flex-col transition-all hover:border-gray-300"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={campaign.image || '/api/placeholder/400/300'}
          alt={campaign.title}
          className="w-full h-48  "
        />

        <div className="absolute top-3 left-3">
          <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-semibold">
            {campaign.category_name}
          </span>
        </div>

        {!isExpired && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Tax Benefit
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {campaign.title}
        </h3>
        <p className="text-gray-600 mb-3 line-clamp-2 text-sm flex-1">
          {campaign.overview}
        </p>

        <div className="space-y-3 mt-auto">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-600 transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>₹{campaign.total_raised?.toLocaleString() || '0'}</span>
            <span>₹{campaign.donation_goal?.toLocaleString() || '0'}</span>
          </div>

          {daysLeft > 0 && (
            <div className="text-center text-sm text-gray-600">
              <strong>{daysLeft}</strong> day{daysLeft !== 1 ? 's' : ''} left
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{campaign.beneficiaries || 0}</span>
            </div>
            {campaign.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-24">{campaign.location}</span>
              </div>
            )}
          </div>

          {isExpired ? (
            <button
              disabled
              className="w-full bg-gray-400 text-white font-semibold py-2.5 rounded-lg cursor-not-allowed text-sm"
            >
              Campaign Ended
            </button>
          ) : (
            <button
              onClick={handleDonate}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Gift className="w-4 h-4" />
              Donate Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Minimal Loading Component
const LoadingSkeleton: React.FC<{ viewMode: 'grid' | 'list'; count?: number }> = ({ viewMode, count = 8 }) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3 px-4 md:px-0">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:px-0">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-2 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Minimal Pagination Component
const IPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex justify-center items-center flex-wrap gap-2 mt-8 px-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
      >
        Previous
      </button>

      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-2 py-2 text-gray-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === page
                ? 'bg-yellow-400 text-black'
                : 'bg-white border border-gray-200 text-gray-700'
                }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
      >
        Next
      </button>
    </div>
  );
};

// Main Campaign List Component
const CampaignList: React.FC<any> = ({
  title = "Causes you can support",
  subtitle = "Discover meaningful causes and make an impact",
  showHeader = true,
  showCategoryFilter = true,
  showSearch = true,
  showPagination = true,
  showViewToggle = true,
  defaultViewMode = 'grid',
  pageSize = 12,
  categoryFilter = null,
  maxItems,
  showCreateButton = false,
  className = "",
  onCampaignClick,
  onDonate,
  onFavorite,
  customFilters = {}
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);

  const [filters, setFilters] = useState({
    selectedCategory: categoryFilter,
    searchTerm: '',
    page: 1,
    status: 'Active',
    sortBy: 'c.sequence',
    sortOrder: 'ASC',
    pageSize: maxItems || pageSize,
    ...customFilters
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: maxItems || pageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    if (showCategoryFilter) {
      const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
          const categoriesData = await apiService.fetchCategories();
          setCategories(categoriesData);
        } catch (error) {
          console.error('Failed to load categories:', error);
          setCategories([]);
        } finally {
          setCategoriesLoading(false);
        }
      };
      loadCategories();
    }
  }, [showCategoryFilter]);

  useEffect(() => {
    const loadCampaigns = async () => {
      setLoading(true);
      try {
        const data: any = await apiService.fetchCampaigns(filters);
        const filterDat = data.campaigns?.filter((x: any) => x?.status === 'Active');
        const campaignsToShow = maxItems ? filterDat.slice(0, maxItems) : filterDat;
        setCampaigns(campaignsToShow);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to load campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [filters, maxItems]);

  const handleCategoryChange = (categoryId: number | null) => {
    setFilters((prev: any) => ({ ...prev, selectedCategory: categoryId, page: 1 }));
  };

  const handleSearchChange = (searchTerm: string) => {
    setFilters((prev: any) => ({ ...prev, searchTerm, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: any) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (campaignId: number) => {
    onCampaignClick?.(campaignId);
  };

  const handleDonate = (campaignId: number) => {
    onDonate?.(campaignId);
  };

  const handleFavorite = (campaignId: number) => {
    onFavorite?.(campaignId);
  };

  return (
    <div className={`${className} w-full mb-12`}>
      {showHeader && (
        <div className="text-center mb-8 px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {showCategoryFilter && (
          <CategoryFilter
            categories={categories}
            selectedCategory={filters.selectedCategory}
            onCategoryChange={handleCategoryChange}
            loading={categoriesLoading}
          />
        )}

        {showSearch && (
          <SearchBar
            searchTerm={filters.searchTerm}
            onSearchChange={handleSearchChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showViewToggle={showViewToggle}
          />
        )}

        {loading ? (
          <LoadingSkeleton viewMode={viewMode} count={maxItems || 8} />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600">
                {filters.searchTerm || filters.selectedCategory
                  ? "Try adjusting your search or filters."
                  : "No campaigns are currently available."}
              </p>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 md:px-0'
              : 'space-y-3 px-4 md:px-0'
          }>
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                viewMode={viewMode}
                onDonate={handleDonate}
                onFavorite={handleFavorite}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {showPagination && !maxItems && campaigns.length > 0 && (
          <IPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default CampaignList;