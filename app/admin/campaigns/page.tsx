"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import { PaginationInfo, Column, FilterOption, DataTable } from "@/components/common/data-table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Campaign, CampaignCategory } from "@/lib/interface"
// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Types


export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [categories, setCategories] = useState<CampaignCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // API-driven filter and search states
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  
  // API-driven pagination state - updated to match new API response
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  
  // API-driven sort states
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

 

const closeDeleteDialog = () => {
  setDeleteDialogOpen(false);
  setCampaignToDelete(null);
};
  // Use refs to track the current values to avoid infinite loops
  const currentParams = useRef({
    page: 1,
    pageSize: 10,
    searchTerm: "",
    filters: {},
    sortField: "",
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

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch campaigns when dependencies change
    // Fetch campaigns when dependencies change
  useEffect(() => {
    fetchCampaigns()
  }, [ pagination.page, pagination.pageSize, searchTerm, filters,sortField, sortDirection])
 
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/campaign-categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  const fetchCampaigns = useCallback(async () => {
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

      const response = await fetch(`/api/campaigns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      
      const data = await response.json()
      setCampaigns(data.campaigns || [])
      setPagination(data.pagination || {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection])

  const getStatusBadgeVariant = useCallback((status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status.toLowerCase()) {
      case "active":
        return "default"
      case "completed":
        return "secondary"
      case "draft":
        return "outline"
      case "inactive":
        return "destructive"
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

  const handleDelete = useCallback((campaign: Campaign) => {
  setCampaignToDelete(campaign);
  setDeleteDialogOpen(true);
}, []);
  const handleDeleteConfirmed = useCallback(async () => {
  if (!campaignToDelete) return;

  try {
    const response = await fetch(`/api/campaigns/${campaignToDelete.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete campaign');

    fetchCampaigns(); // refresh the list
    closeDeleteDialog(); // close dialog and reset
  } catch (error) {
    console.error('Error deleting campaign:', error);
    alert('Failed to delete campaign');
  }
}, [campaignToDelete, fetchCampaigns]);

  const handleEdit = useCallback((campaign: Campaign) => {
    window.location.href = `/admin/campaigns/update/${campaign.id}`
  }, [])

  const handleAdd = useCallback(() => {
    window.location.href = '/admin/campaigns/create'
  }, [])

  // Define table columns with useMemo to prevent recreation
  const columns: Column<Campaign>[] = useMemo(() => [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      searchable: true,
      width: '250px',
      render: (value, row) => (
        <div className="max-w-[220px]">
          <div className="font-semibold truncate">{row.title}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.overview}
          </div>
        </div>
      )
    },
    {
      key: 'category_name',
      header: 'Category',
      sortable: true,
      filterable: true,
      width: '120px',
      filterOptions: categories.map(cat => ({
        label: cat.name,
        value: cat.id.toString()
      })) as FilterOption[]
    },
    {
      key: 'donation_goal',
      header: 'Goal',
      sortable: true,
      width: '100px',
      render: (value) => `₹${value?.toLocaleString() || '0'}`
    },
    {
      key: 'total_raised',
      header: 'Raised',
      sortable: true,
      width: '100px',
      render: (value) => `₹${value?.toLocaleString() || '0'}`
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      width: '80px',
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Completed', value: 'completed' },
        { label: 'Draft', value: 'draft' }
      ],
      render: (value) => (
        <Badge variant={getStatusBadgeVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'end_date',
      header: 'End Date',
      sortable: true,
      width: '120px',
      render: (value) => value ? formatDate(value) : 'N/A'
    }
  ], [categories])

  // Mobile card component with useCallback
  const renderMobileCard = useCallback((campaign: Campaign, index: number) => (
    <Card key={campaign.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{campaign.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {campaign.overview}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(campaign.status)} className="ml-2 shrink-0">
            {campaign.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Category:</span>
            <p className="font-medium">{campaign.category_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">End Date:</span>
            <p className="font-medium">
              {campaign.end_date ? formatDate(campaign.end_date) : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Goal:</span>
            <p className="font-medium">₹{campaign.donation_goal.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Raised:</span>
            <p className="font-medium">₹{campaign.total_raised?.toLocaleString() || '0'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleEdit(campaign)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(campaign)}
            className="flex-1 text-red-600 hover:text-red-700  "
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [handleEdit, handleDelete])

 
  return (
    <div className="min-h-screen ">
      <div className="mx-auto space-y-6">
        <DataTable<Campaign>
          // Data
          data={campaigns}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}

          // Header
          title="Campaigns"
          description="Manage your fundraising campaigns"

          // Add functionality
          onAdd={handleAdd}
          addButtonLabel="Create Campaign"
          showAddButton={true}

          // Search (API-driven)
          showSearch={true}
          searchPlaceholder="Search campaigns..."
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
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No campaigns found"

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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign &quot;{campaignToDelete?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}


// ========================================
// File: app/admin/causes/page.tsx

// "use client"

// import React, { useState, useMemo, useCallback } from "react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Calendar } from "@/components/ui/calendar"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { 
//   Plus, 
//   Edit, 
//   Trash2, 
//   Search, 
//   Filter, 
//   ChevronLeft, 
//   ChevronRight, 
//   ChevronsLeft, 
//   ChevronsRight,
//   ArrowUpDown,
//   ArrowUp,
//   ArrowDown,
//   CalendarIcon,
//   X,
//   Eye,
//   Download
// } from "lucide-react"
// import { format } from "date-fns"
// import type { Campaign } from "@/lib/interface"
// import { campaignCategories, initialCampaigns } from "@/lib/utils"

// // Types for table functionality
// type SortDirection = 'asc' | 'desc' | null
// type SortField = keyof Campaign | null

// interface TableState {
//   currentPage: number
//   pageSize: number
//   sortField: SortField
//   sortDirection: SortDirection
//   searchTerm: string
//   filters: {
//     category: string
//     status: string
//     dateRange: {
//       from: Date | null
//       to: Date | null
//     }
//     goalRange: {
//       min: string
//       max: string
//     }
//   }
// }

// interface PaginationInfo {
//   totalItems: number
//   totalPages: number
//   currentPage: number
//   pageSize: number
//   startItem: number
//   endItem: number
// }

// export default function CampaignsPage() {
//   const [campaigns] = useState<Campaign[]>(initialCampaigns)
//   const [showMobileFilters, setShowMobileFilters] = useState(false)
  
//   const [tableState, setTableState] = useState<TableState>({
//     currentPage: 1,
//     pageSize: 10,
//     sortField: null,
//     sortDirection: null,
//     searchTerm: "",
//     filters: {
//       category: "All",
//       status: "All",
//       dateRange: {
//         from: null,
//         to: null
//       },
//       goalRange: {
//         min: "",
//         max: ""
//       }
//     }
//   })

//   // Update table state helper
//   const updateTableState = useCallback((updates: Partial<TableState>) => {
//     setTableState(prev => ({
//       ...prev,
//       ...updates,
//       // Reset to page 1 when filters change
//       currentPage: updates.searchTerm !== undefined || updates.filters !== undefined ? 1 : prev.currentPage
//     }))
//   }, [])

//   // Filtered and sorted data
//   const processedData = useMemo(() => {
//     let filtered = campaigns.filter((campaign) => {
//       // Search filter
//       const matchesSearch = tableState.searchTerm === "" || 
//         campaign.title.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
//         campaign.overview.toLowerCase().includes(tableState.searchTerm.toLowerCase())

//       // Category filter
//       const matchesCategory = tableState.filters.category === "All" || 
//         campaign.category === tableState.filters.category

//       // Status filter
//       const matchesStatus = tableState.filters.status === "All" || 
//         campaign.status === tableState.filters.status

//       // Date range filter
//       const matchesDateRange = (!tableState.filters.dateRange.from || campaign.endDate >= tableState.filters.dateRange.from) &&
//         (!tableState.filters.dateRange.to || campaign.endDate <= tableState.filters.dateRange.to)

//       // Goal range filter
//       const matchesGoalRange = 
//         (tableState.filters.goalRange.min === "" || campaign.goal >= parseInt(tableState.filters.goalRange.min)) &&
//         (tableState.filters.goalRange.max === "" || campaign.goal <= parseInt(tableState.filters.goalRange.max))

//       return matchesSearch && matchesCategory && matchesStatus && matchesDateRange && matchesGoalRange
//     })

//     // Sort data
//     if (tableState.sortField && tableState.sortDirection) {
//       filtered.sort((a, b) => {
//         const aValue = a[tableState.sortField!]
//         const bValue = b[tableState.sortField!]
        
//         let comparison = 0
//         if (aValue < bValue) comparison = -1
//         if (aValue > bValue) comparison = 1
        
//         return tableState.sortDirection === 'desc' ? -comparison : comparison
//       })
//     }

//     return filtered
//   }, [campaigns, tableState])

//   // Pagination info
//   const paginationInfo: PaginationInfo = useMemo(() => {
//     const totalItems = processedData.length
//     const totalPages = Math.ceil(totalItems / tableState.pageSize)
//     const startItem = (tableState.currentPage - 1) * tableState.pageSize + 1
//     const endItem = Math.min(tableState.currentPage * tableState.pageSize, totalItems)

//     return {
//       totalItems,
//       totalPages,
//       currentPage: tableState.currentPage,
//       pageSize: tableState.pageSize,
//       startItem: totalItems > 0 ? startItem : 0,
//       endItem
//     }
//   }, [processedData.length, tableState.currentPage, tableState.pageSize])

//   // Paginated data
//   const paginatedData = useMemo(() => {
//     const startIndex = (tableState.currentPage - 1) * tableState.pageSize
//     return processedData.slice(startIndex, startIndex + tableState.pageSize)
//   }, [processedData, tableState.currentPage, tableState.pageSize])

//   // Handlers
//   const handleSort = (field: SortField) => {
//     const newDirection: SortDirection = 
//       tableState.sortField === field && tableState.sortDirection === 'asc' ? 'desc' : 'asc'
    
//     updateTableState({
//       sortField: field,
//       sortDirection: newDirection
//     })
//   }

//   const handleDelete = (id: number) => {
//     if (window.confirm("Are you sure you want to delete this campaign?")) {
//       // In real app, this would be an API call
//       console.log(`Delete campaign ${id}`)
//     }
//   }

//   const clearFilters = () => {
//     updateTableState({
//       searchTerm: "",
//       filters: {
//         category: "All",
//         status: "All",
//         dateRange: { from: null, to: null },
//         goalRange: { min: "", max: "" }
//       }
//     })
//   }

//   const hasActiveFilters = useMemo(() => {
//     return tableState.searchTerm !== "" ||
//       tableState.filters.category !== "All" ||
//       tableState.filters.status !== "All" ||
//       tableState.filters.dateRange.from !== null ||
//       tableState.filters.dateRange.to !== null ||
//       tableState.filters.goalRange.min !== "" ||
//       tableState.filters.goalRange.max !== ""
//   }, [tableState])

//   // Render sort icon
//   const renderSortIcon = (field: SortField) => {
//     if (tableState.sortField !== field) {
//       return <ArrowUpDown className="ml-2 h-4 w-4" />
//     }
//     return tableState.sortDirection === 'asc' ? 
//       <ArrowUp className="ml-2 h-4 w-4" /> : 
//       <ArrowDown className="ml-2 h-4 w-4" />
//   }

//   return (
//     <div className="space-y-6 p-4 lg:p-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold">Campaigns</h1>
//           <p className="text-muted-foreground">Manage your fundraising campaigns</p>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" size="sm">
//             <Download className="mr-2 h-4 w-4" />
//             Export
//           </Button>
//           <Button asChild>
//             <Link href="/admin/causes/create">
//               <Plus className="mr-2 h-4 w-4" /> Create Campaign
//             </Link>
//           </Button>
//         </div>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex flex-col lg:flex-row gap-4">
//             {/* Search */}
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search campaigns..."
//                 value={tableState.searchTerm}
//                 onChange={(e) => updateTableState({ searchTerm: e.target.value })}
//                 className="pl-9"
//               />
//             </div>

//             {/* Mobile Filter Toggle */}
//             <Button 
//               variant="outline" 
//               className="lg:hidden"
//               onClick={() => setShowMobileFilters(!showMobileFilters)}
//             >
//               <Filter className="mr-2 h-4 w-4" />
//               Filters
//               {hasActiveFilters && <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full" />}
//             </Button>
//           </div>

//           {/* Desktop Filters */}
//           <div className="hidden lg:flex flex-wrap gap-4">
//             <Select 
//               value={tableState.filters.category} 
//               onValueChange={(value) => updateTableState({ 
//                 filters: { ...tableState.filters, category: value }
//               })}
//             >
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Category" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="All">All Categories</SelectItem>
//                 {campaignCategories.map((cat) => (
//                   <SelectItem key={cat} value={cat}>{cat}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             <Select 
//               value={tableState.filters.status} 
//               onValueChange={(value) => updateTableState({ 
//                 filters: { ...tableState.filters, status: value }
//               })}
//             >
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="All">All Statuses</SelectItem>
//                 <SelectItem value="Active">Active</SelectItem>
//                 <SelectItem value="Inactive">Inactive</SelectItem>
//                 <SelectItem value="Completed">Completed</SelectItem>
//                 <SelectItem value="Draft">Draft</SelectItem>
//               </SelectContent>
//             </Select>

//             {/* Date Range Filter */}
//             <Popover>
//               <PopoverTrigger asChild>
//                 <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
//                   <CalendarIcon className="mr-2 h-4 w-4" />
//                   {tableState.filters.dateRange.from ? (
//                     tableState.filters.dateRange.to ? (
//                       `${format(tableState.filters.dateRange.from, "MMM dd")} - ${format(tableState.filters.dateRange.to, "MMM dd")}`
//                     ) : (
//                       format(tableState.filters.dateRange.from, "MMM dd, yyyy")
//                     )
//                   ) : (
//                     "End date range"
//                   )}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-auto p-0" align="start">
//                 <div className="p-4">
//                   <div className="space-y-4">
//                     <div>
//                       <label className="text-sm font-medium">From Date</label>
//                       <Calendar
//                         mode="single"
//                         selected={tableState.filters.dateRange.from || undefined}
//                         onSelect={(date) => updateTableState({
//                           filters: {
//                             ...tableState.filters,
//                             dateRange: { ...tableState.filters.dateRange, from: date || null }
//                           }
//                         })}
//                         className="rounded-md border"
//                       />
//                     </div>
//                     <div>
//                       <label className="text-sm font-medium">To Date</label>
//                       <Calendar
//                         mode="single"
//                         selected={tableState.filters.dateRange.to || undefined}
//                         onSelect={(date) => updateTableState({
//                           filters: {
//                             ...tableState.filters,
//                             dateRange: { ...tableState.filters.dateRange, to: date || null }
//                           }
//                         })}
//                         className="rounded-md border"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </PopoverContent>
//             </Popover>

//             {/* Goal Range Filter */}
//             <div className="flex gap-2">
//               <Input
//                 placeholder="Min goal"
//                 type="number"
//                 value={tableState.filters.goalRange.min}
//                 onChange={(e) => updateTableState({
//                   filters: {
//                     ...tableState.filters,
//                     goalRange: { ...tableState.filters.goalRange, min: e.target.value }
//                   }
//                 })}
//                 className="w-[120px]"
//               />
//               <Input
//                 placeholder="Max goal"
//                 type="number"
//                 value={tableState.filters.goalRange.max}
//                 onChange={(e) => updateTableState({
//                   filters: {
//                     ...tableState.filters,
//                     goalRange: { ...tableState.filters.goalRange, max: e.target.value }
//                   }
//                 })}
//                 className="w-[120px]"
//               />
//             </div>

//             {hasActiveFilters && (
//               <Button variant="ghost" onClick={clearFilters}>
//                 <X className="mr-2 h-4 w-4" />
//                 Clear
//               </Button>
//             )}
//           </div>

//           {/* Mobile Filters */}
//           {showMobileFilters && (
//             <div className="lg:hidden space-y-4 pt-4 border-t">
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <Select 
//                   value={tableState.filters.category} 
//                   onValueChange={(value) => updateTableState({ 
//                     filters: { ...tableState.filters, category: value }
//                   })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Category" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="All">All Categories</SelectItem>
//                     {campaignCategories.map((cat) => (
//                       <SelectItem key={cat} value={cat}>{cat}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 <Select 
//                   value={tableState.filters.status} 
//                   onValueChange={(value) => updateTableState({ 
//                     filters: { ...tableState.filters, status: value }
//                   })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="All">All Statuses</SelectItem>
//                     <SelectItem value="Active">Active</SelectItem>
//                     <SelectItem value="Inactive">Inactive</SelectItem>
//                     <SelectItem value="Completed">Completed</SelectItem>
//                     <SelectItem value="Draft">Draft</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="grid grid-cols-2 gap-2">
//                 <Input
//                   placeholder="Min goal"
//                   type="number"
//                   value={tableState.filters.goalRange.min}
//                   onChange={(e) => updateTableState({
//                     filters: {
//                       ...tableState.filters,
//                       goalRange: { ...tableState.filters.goalRange, min: e.target.value }
//                     }
//                   })}
//                 />
//                 <Input
//                   placeholder="Max goal"
//                   type="number"
//                   value={tableState.filters.goalRange.max}
//                   onChange={(e) => updateTableState({
//                     filters: {
//                       ...tableState.filters,
//                       goalRange: { ...tableState.filters.goalRange, max: e.target.value }
//                     }
//                   })}
//                 />
//               </div>

//               {hasActiveFilters && (
//                 <Button variant="ghost" onClick={clearFilters} className="w-full">
//                   <X className="mr-2 h-4 w-4" />
//                   Clear All Filters
//                 </Button>
//               )}
//             </div>
//           )}
//         </CardHeader>

//         <CardContent>
//           {/* Results Summary */}
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
//             <div className="text-sm text-muted-foreground">
//               Showing {paginationInfo.startItem}-{paginationInfo.endItem} of {paginationInfo.totalItems} campaigns
//             </div>
//             <Select 
//               value={tableState.pageSize.toString()} 
//               onValueChange={(value) => updateTableState({ pageSize: parseInt(value), currentPage: 1 })}
//             >
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="10">10 per page</SelectItem>
//                 <SelectItem value="25">25 per page</SelectItem>
//                 <SelectItem value="50">50 per page</SelectItem>
//                 <SelectItem value="100">100 per page</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Desktop Table */}
//           <div className="hidden lg:block overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead 
//                     className="cursor-pointer select-none"
//                     onClick={() => handleSort('title')}
//                   >
//                     <div className="flex items-center">
//                       Title
//                       {renderSortIcon('title')}
//                     </div>
//                   </TableHead>
//                   <TableHead 
//                     className="cursor-pointer select-none"
//                     onClick={() => handleSort('category')}
//                   >
//                     <div className="flex items-center">
//                       Category
//                       {renderSortIcon('category')}
//                     </div>
//                   </TableHead>
//                   <TableHead 
//                     className="cursor-pointer select-none text-right"
//                     onClick={() => handleSort('goal')}
//                   >
//                     <div className="flex items-center justify-end">
//                       Goal
//                       {renderSortIcon('goal')}
//                     </div>
//                   </TableHead>
//                   <TableHead 
//                     className="cursor-pointer select-none text-right"
//                     onClick={() => handleSort('raised')}
//                   >
//                     <div className="flex items-center justify-end">
//                       Raised
//                       {renderSortIcon('raised')}
//                     </div>
//                   </TableHead>
//                   <TableHead 
//                     className="cursor-pointer select-none"
//                     onClick={() => handleSort('status')}
//                   >
//                     <div className="flex items-center">
//                       Status
//                       {renderSortIcon('status')}
//                     </div>
//                   </TableHead>
//                   <TableHead 
//                     className="cursor-pointer select-none"
//                     onClick={() => handleSort('endDate')}
//                   >
//                     <div className="flex items-center">
//                       End Date
//                       {renderSortIcon('endDate')}
//                     </div>
//                   </TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {paginatedData.map((campaign) => (
//                   <TableRow key={campaign.id}>
//                     <TableCell className="font-medium">{campaign.title}</TableCell>
//                     <TableCell>{campaign.category}</TableCell>
//                     <TableCell className="text-right">₹{campaign.goal.toLocaleString()}</TableCell>
//                     <TableCell className="text-right">₹{campaign.raised.toLocaleString()}</TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={
//                           campaign.status === "Active" ? "default" :
//                           campaign.status === "Completed" ? "secondary" : "outline"
//                         }
//                       >
//                         {campaign.status}
//                       </Badge>
//                     </TableCell>
//                     <TableCell>{format(campaign.endDate, "MMM dd, yyyy")}</TableCell>
//                     <TableCell className="text-right">
//                       <div className="flex justify-end gap-1">
//                         <Button variant="ghost" size="icon" asChild>
//                           <Link href={`/admin/causes/${campaign.id}`}>
//                             <Eye className="h-4 w-4" />
//                           </Link>
//                         </Button>
//                         <Button variant="ghost" size="icon" asChild>
//                           <Link href={`/admin/causes/update/${campaign.id}`}>
//                             <Edit className="h-4 w-4" />
//                           </Link>
//                         </Button>
//                         <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
//                           <Trash2 className="h-4 w-4 text-red-500" />
//                         </Button>
//                       </div>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//           {/* Mobile Card Layout */}
//           <div className="lg:hidden space-y-4">
//             {paginatedData.map((campaign) => (
//               <Card key={campaign.id}>
//                 <CardContent className="p-4">
//                   <div className="space-y-3">
//                     <div className="flex items-start justify-between">
//                       <h3 className="font-semibold text-sm">{campaign.title}</h3>
//                       <Badge
//                         variant={
//                           campaign.status === "Active" ? "default" :
//                           campaign.status === "Completed" ? "secondary" : "outline"
//                         }
//                         className="text-xs"
//                       >
//                         {campaign.status}
//                       </Badge>
//                     </div>
                    
//                     <div className="grid grid-cols-2 gap-4 text-sm">
//                       <div>
//                         <span className="text-muted-foreground">Category:</span>
//                         <p className="font-medium">{campaign.category}</p>
//                       </div>
//                       <div>
//                         <span className="text-muted-foreground">End Date:</span>
//                         <p className="font-medium">{format(campaign.endDate, "MMM dd, yyyy")}</p>
//                       </div>
//                       <div>
//                         <span className="text-muted-foreground">Goal:</span>
//                         <p className="font-medium">₹{campaign.goal.toLocaleString()}</p>
//                       </div>
//                       <div>
//                         <span className="text-muted-foreground">Raised:</span>
//                         <p className="font-medium">₹{campaign.raised.toLocaleString()}</p>
//                       </div>
//                     </div>

//                     <div className="flex justify-end gap-2">
//                       <Button variant="outline" size="sm" asChild>
//                         <Link href={`/admin/causes/${campaign.id}`}>
//                           <Eye className="h-4 w-4 mr-1" />
//                           View
//                         </Link>
//                       </Button>
//                       <Button variant="outline" size="sm" asChild>
//                         <Link href={`/admin/causes/update/${campaign.id}`}>
//                           <Edit className="h-4 w-4 mr-1" />
//                           Edit
//                         </Link>
//                       </Button>
//                       <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
//                         <Trash2 className="h-4 w-4 mr-1 text-red-500" />
//                         Delete
//                       </Button>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Pagination */}
//           {paginationInfo.totalPages > 1 && (
//             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
//               <div className="text-sm text-muted-foreground">
//                 Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
//               </div>
              
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => updateTableState({ currentPage: 1 })}
//                   disabled={paginationInfo.currentPage === 1}
//                 >
//                   <ChevronsLeft className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => updateTableState({ currentPage: paginationInfo.currentPage - 1 })}
//                   disabled={paginationInfo.currentPage === 1}
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </Button>
                
//                 {/* Page Numbers */}
//                 <div className="flex gap-1">
//                   {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
//                     const pageNumber = i + 1
//                     return (
//                       <Button
//                         key={pageNumber}
//                         variant={pageNumber === paginationInfo.currentPage ? "default" : "outline"}
//                         size="sm"
//                         onClick={() => updateTableState({ currentPage: pageNumber })}
//                         className="w-10"
//                       >
//                         {pageNumber}
//                       </Button>
//                     )
//                   })}
//                 </div>

//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => updateTableState({ currentPage: paginationInfo.currentPage + 1 })}
//                   disabled={paginationInfo.currentPage === paginationInfo.totalPages}
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => updateTableState({ currentPage: paginationInfo.totalPages })}
//                   disabled={paginationInfo.currentPage === paginationInfo.totalPages}
//                 >
//                   <ChevronsRight className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//           )}

//           {/* No Results */}
//           {paginatedData.length === 0 && (
//             <div className="text-center py-12">
//               <div className="text-muted-foreground">
//                 {hasActiveFilters ? "No campaigns match your filters." : "No campaigns found."}
//               </div>
//               {hasActiveFilters && (
//                 <Button variant="outline" onClick={clearFilters} className="mt-4">
//                   Clear Filters
//                 </Button>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }