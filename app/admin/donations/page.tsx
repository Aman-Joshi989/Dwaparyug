"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Download, Filter } from "lucide-react"
import { PaginationInfo, Column, FilterOption, DataTable } from "@/components/common/data-table"

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return `₹${amount?.toLocaleString() || '0'}`
}

// Types for donation data structure based on your API
interface Donation {
  id: number
  user_id: number
  donor_name: string
  donor_email: string
  campaign_id: number
  campaign_title: string
  campaign_image: string
  campaign_category: string
  donation_amount: number
  tip_amount: number
  total_amount: number
  donation_type: 'direct' | 'product_based'
  is_public: boolean
  donation_date: string
  donated_on_behalf_of?: string
  donor_message?: string
  impact_generated: boolean
  beneficiaries_reached: number
  razorpay_payment_id: string
  product_items_count: number
  total_product_quantity: number
  impact_stories_count: number
  created_at: string
  updated_at: string
}

interface DonationStatistics {
  totalDonations: number
  totalDonationAmount: number
  totalTipAmount: number
  totalAmount: number
  directDonations: number
  productBasedDonations: number
  publicDonations: number
  donationsWithImpact: number
  totalBeneficiariesReached: number
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [statistics, setStatistics] = useState<DonationStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API-driven filter and search states
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})

  // API-driven pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // API-driven sort states
  const [sortField, setSortField] = useState<string>("donation_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Use refs to track the current values to avoid infinite loops
  const currentParams = useRef({
    page: 1,
    pageSize: 10,
    searchTerm: "",
    filters: {},
    sortField: "donation_date",
    sortDirection: "desc" as "asc" | "desc"
  })

  // Update ref when params change
  useEffect(() => {
    currentParams.current = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      searchTerm,
      filters,
      sortField,
      sortDirection
    }
  })

  // Fetch donations when dependencies change
  useEffect(() => {
    fetchDonations()
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection])

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      // Add search
      if (searchTerm) params.append('search', searchTerm)

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value)
        }
      })

      // Add sorting
      if (sortField) {
        params.append('sortBy', sortField)
        params.append('sortOrder', sortDirection)
      }

      const response = await fetch(`/api/donations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch donations')

      const data = await response.json()
      setDonations(data.donations || [])
      setPagination(data.pagination || {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
      setStatistics(data.statistics || null)
    } catch (error) {
      console.error('Error fetching donations:', error)
      setError('Failed to load donations')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection])

  const getDonationTypeBadgeVariant = useCallback((type: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (type.toLowerCase()) {
      case "direct":
        return "default"
      case "product_based":
        return "secondary"
      default:
        return "outline"
    }
  }, [])

  // API-driven handlers
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSort = useCallback((column: string, order: 'asc' | 'desc') => {
    setSortField(column)
    setSortDirection(order)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: pageSize, page: 1 }))
  }, [])

  const handleViewDetails = useCallback((donation: Donation) => {
    window.location.href = `/admin/donations/${donation.id}`
  }, [])
 

  // Define table columns with useMemo to prevent recreation
  const columns: Column<Donation>[] = useMemo(() => [
 
     {
      key: 'donor_name',
      header: 'Donor',
      sortable: true,
      searchable: true,
      width: '200px',
      render: (value, row) => (
        <div className="max-w-[180px]">
          <div className="font-semibold truncate">{row.donor_name || 'Anonymous'}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.razorpay_payment_id}
          </div>
        </div>
      )
    },
    {
      key: 'campaign_title',
      header: 'Campaign',
      sortable: true,
      searchable: true,
      width: '200px',
      render: (value, row) => (
        <div className="max-w-[180px]">
          <div className="font-semibold truncate">{row.campaign_title}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.campaign_category}
          </div>
        </div>
      )
    },
    {
      key: 'donation_amount',
      header: 'Amount',
      sortable: true,
      width: '120px',
      render: (value, row) => (
        <div>
          <div className="font-semibold">{formatCurrency(row.donation_amount)}</div>
          {row.tip_amount > 0 && (
            <div className="text-sm text-muted-foreground">
              +{formatCurrency(row.tip_amount)} tip
            </div>
          )}
        </div>
      )
    },
    {
      key: 'donation_type',
      header: 'Type',
      sortable: true,
      filterable: true,
      width: '120px',
      filterOptions: [
        { label: 'Direct', value: 'direct' },
        { label: 'Product Based', value: 'product_based' }
      ],
      render: (value, row) => (
        <div>
          <Badge variant={getDonationTypeBadgeVariant(value)} className="mb-1">
            {value === 'direct' ? 'Direct' : 'Product Based'}
          </Badge>
          {row.donation_type === 'product_based' && row.product_items_count > 0 && (
            <div className="text-xs text-muted-foreground">
              {row.product_items_count} items
            </div>
          )}
        </div>
      )
    },
    
    {
      key: 'impact_generated',
      header: 'Impact',
      sortable: true,
      filterable: true,
      width: '100px',
      filterOptions: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' }
      ],
      render: (value, row) => (
        <div>
          <Badge variant={value ? "default" : "outline"}>
            {value ? 'Yes' : 'No'}
          </Badge>
          {value && row.beneficiaries_reached > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {row.beneficiaries_reached} reached
            </div>
          )}
        </div>
      )
    },
    {
      key: 'donation_date',
      header: 'Date',
      sortable: true,
      width: '150px',
      render: (value) => formatDate(value)
    }
  ], [])

  // Mobile card component with useCallback
  const renderMobileCard = useCallback((donation: Donation, index: number) => (
    <Card key={donation.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">
              {donation.donor_name || 'Anonymous Donor'}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {donation.campaign_title}
            </p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <div className="font-semibold text-green-600">
              {formatCurrency(donation.total_amount)}
            </div>
            <Badge variant={getDonationTypeBadgeVariant(donation.donation_type)}  >
              {donation.donation_type === 'direct' ? 'Direct' : 'Product'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Category:</span>
            <p className="font-medium truncate">{donation.campaign_category}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-medium">{formatDate(donation.donation_date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Visibility:</span>
            <div>
              <Badge variant={donation.is_public ? "default" : "outline"}   >
                {donation.is_public ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Impact:</span>
            <div>
              <Badge variant={donation.impact_generated ? "default" : "outline"}  >
                {donation.impact_generated ? 'Generated' : 'None'}
              </Badge>
            </div>
          </div>
        </div>

        {donation.donor_message && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm italic">"{donation.donor_message}"</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(donation)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [handleViewDetails])

  // Statistics summary component
  const StatisticsSummary = useCallback(() => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statistics.totalDonations}
            </div>
            <div className="text-sm text-muted-foreground">Total Donations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(statistics.totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Total Raised</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.directDonations}
            </div>
            <div className="text-sm text-muted-foreground">Direct Donations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.donationsWithImpact}
            </div>
            <div className="text-sm text-muted-foreground">With Impact</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {statistics.totalBeneficiariesReached}
            </div>
            <div className="text-sm text-muted-foreground">Beneficiaries</div>
          </CardContent>
        </Card>
      </div>
    )
  }, [statistics])

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-6">
        <StatisticsSummary />

        <DataTable<Donation>
          // Data
          data={donations}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}

          // Header
          title="Donations"
          description="View and manage all donation transactions"

          // Search (API-driven)
          showSearch={true}
          searchPlaceholder="Search by donor name or campaign..."
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}

          // Filters (API-driven)
          showFilters={true}
          filters={filters}
          onFiltersChange={handleFiltersChange}

          // Sorting (API-driven)
          sortBy={sortField}
          sortOrder={sortDirection}
          onSort={handleSort}

          // Pagination (API-driven)
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}

          // Actions
          onEdit={handleViewDetails}
          emptyMessage="No donations found"

          // Configuration
          striped={true}
          stickyHeader={true}

          // Mobile
          showMobileCards={true}
          mobileCardComponent={renderMobileCard}

          // Column visibility
          showColumnVisibility={true}
        />
      </div>
    </div>
  )
}