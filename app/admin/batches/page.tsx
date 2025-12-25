// File: app/admin/batches/page.tsx
"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Edit, Plus, Printer } from "lucide-react"
import { PaginationInfo, Column, DataTable } from "@/components/common/data-table"
import { toast } from "@/components/ui/use-toast"
import { BatchProgressDialog } from "./batch-progress-dialog"
import { StickerPrintDialog } from "./sticker-print-dialog"
import { CreateBatchDialog } from "./create-batch-dialog"

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return `₹${amount?.toLocaleString() || '0'}`
}

// Types
interface Batch {
  id: number
  campaign_id: number
  campaign_title: string
  campaign_image: string
  batch_name: string
  batch_description?: string
  planned_distribution_date: string
  actual_distribution_date?: string
  status: 'planning' | 'prepared' | 'in_progress' | 'completed' | 'cancelled'
  total_value: number
  total_items: number
  planned_beneficiaries: number
  actual_beneficiaries: number
  allocated_items: number
  prepared_items: number
  distributed_items: number
  progress_percentage: number
  created_at: string
  updated_at: string
}

interface BatchStatistics {
  totalBatches: number
  planningBatches: number
  preparedBatches: number
  inProgressBatches: number
  completedBatches: number
  totalValue: number
  totalItems: number
  totalBeneficiariesServed: number
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [statistics, setStatistics] = useState<BatchStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)

  // API-driven states
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value)
        }
      })

      if (sortField) {
        params.append('sortBy', sortField)
        params.append('sortOrder', sortDirection)
      }

      const response = await fetch(`/api/batches?${params}`)
      if (!response.ok) throw new Error('Failed to fetch batches')

      const data = await response.json()
      setBatches(data.batches || [])
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
      console.error('Error fetching batches:', error)
      setError('Failed to load batches')
      toast({
        title: "Error",
        description: "Failed to fetch batches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection])

  useEffect(() => {
    fetchBatches()
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection])

  // Badge variant helpers
  const getBatchStatusBadgeVariant = useCallback((status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "prepared":
        return "outline"
      case "planning":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }, [])

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 100) return "text-green-600"
    if (percentage >= 50) return "text-blue-600"
    if (percentage >= 25) return "text-orange-600"
    return "text-gray-600"
  }, [])

  // Event handlers
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

  const handleViewProgress = useCallback((batch: Batch) => {
    setSelectedBatch(batch)
    setProgressDialogOpen(true)
  }, [])

  const handlePrintStickers = useCallback((batch: Batch) => {
    setSelectedBatch(batch)
    setPrintDialogOpen(true)
  }, [])

  const handleCreateBatch = useCallback(() => {
    setCreateDialogOpen(true)
  }, [])

  const handleBatchCreated = useCallback((newBatch: any) => {
    toast({
      title: "Success",
      description: `Batch "${newBatch.batch_name}" created with ${newBatch.assignment_summary.items_assigned} items assigned`,
    })
    setCreateDialogOpen(false)
    fetchBatches()
  }, [fetchBatches])

  const handleProgressUpdated = useCallback(() => {
    fetchBatches()
  }, [fetchBatches])

  // Check if batch can have stickers printed
  const canPrintStickers = useCallback((batch: Batch) => {
    return batch.status === 'prepared' || batch.status === 'in_progress' || batch.status === 'completed'
  }, [])

  // Table columns
  const columns: Column<Batch>[] = useMemo(() => [
    {
      key: 'id',
      header: 'Batch Id',
      sortable: true,
      searchable: true,
      width: '200px',
      render: (value, row) => (
        <div className="max-w-[180px]">
          <div className="font-semibold truncate cursor-pointer hover:text-blue-600" 
               onClick={() => handleViewProgress(row)}>
            {value}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {row.batch_name}
          </div>
        </div>
      )
    },
     {
      key: 'batch_name',
      header: 'Batch Name',
      sortable: true,
      searchable: true,
      width: '200px',
      render: (value, row) => (
        <div className="max-w-[180px]">
          <div className="font-semibold truncate cursor-pointer hover:text-blue-600" 
               onClick={() => handleViewProgress(row)}>
            {value}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {row.campaign_title}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      width: '120px',
      filterOptions: [
        { label: 'Planning', value: 'planning' },
        { label: 'Prepared', value: 'prepared' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ],
      render: (value) => (
        <Badge variant={getBatchStatusBadgeVariant(value)}>
          {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'total_items',
      header: 'Items',
      sortable: true,
      width: '100px',
      render: (value, row) => (
        <div className="text-center">
          <div className="font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">
            {row.distributed_items}/{value} done
          </div>
        </div>
      )
    },
    {
      key: 'progress_percentage',
      header: 'Progress',
      sortable: true,
      width: '120px',
      render: (value) => (
        <div className="space-y-1">
          <div className={`font-semibold ${getProgressColor(value)}`}>
            {value}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'total_value',
      header: 'Value',
      sortable: true,
      width: '120px',
      render: (value) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'planned_distribution_date',
      header: 'Planned Date',
      sortable: true,
      width: '120px',
      render: (value) => formatDate(value)
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '120px',
      render: (value) => formatDate(value)
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePrintStickers(row)}
            disabled={!canPrintStickers(row)}
            title={canPrintStickers(row) ? "Print Stickers" : "Batch must be prepared to print stickers"}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewProgress(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [getBatchStatusBadgeVariant, getProgressColor, handleViewProgress, handlePrintStickers, canPrintStickers])

  // Mobile card component
  const renderMobileCard = useCallback((batch: Batch, index: number) => (
    <Card key={batch.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate cursor-pointer hover:text-blue-600"
                onClick={() => handleViewProgress(batch)}>
              {batch.batch_name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {batch.campaign_title}
            </p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <Badge variant={getBatchStatusBadgeVariant(batch.status)} className="mb-2">
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1).replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Items:</span>
            <p className="font-medium">{batch.total_items}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Value:</span>
            <p className="font-medium text-green-600">{formatCurrency(batch.total_value)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Progress:</span>
            <div className="flex items-center space-x-2">
              <p className="font-medium">{batch.progress_percentage}%</p>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(batch.progress_percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Planned:</span>
            <p className="font-medium">{formatDate(batch.planned_distribution_date)}</p>
          </div>
        </div>

        {batch.batch_description && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-sm">{batch.batch_description}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintStickers(batch)}
            disabled={!canPrintStickers(batch)}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Stickers
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewProgress(batch)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Progress
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [getBatchStatusBadgeVariant, handleViewProgress, handlePrintStickers, canPrintStickers])

  // Statistics summary
  const StatisticsSummary = useCallback(() => {
    if (!statistics) return null

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.totalBatches}
            </div>
            <div className="text-sm text-muted-foreground">Total Batches</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statistics.completedBatches}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.inProgressBatches}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(statistics.totalValue)}
            </div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
      </div>
    )
  }, [statistics])

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-6">
        <StatisticsSummary />

        <DataTable<Batch>
          // Data
          data={batches}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}

          // Header
          title="Distribution Batches"
          description="Manage and track batch distribution progress with sticker printing"

          // Add functionality
          onAdd={handleCreateBatch}
          addButtonLabel="Create Batch"
          showAddButton={true}

          // Search (API-driven)
          showSearch={true}
          searchPlaceholder="Search by batch name or campaign..."
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
          onEdit={handleViewProgress}
          emptyMessage="No batches found"

          // Configuration
          striped={true}
          stickyHeader={true}

          // Mobile
          showMobileCards={true}
          mobileCardComponent={renderMobileCard}

          // Column visibility
          showColumnVisibility={true}
        />

        {/* Dialogs */}
        <CreateBatchDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleBatchCreated}
        />

        <BatchProgressDialog
          open={progressDialogOpen}
          onOpenChange={setProgressDialogOpen}
          batch={selectedBatch}
          onProgressUpdated={handleProgressUpdated}
        />

        <StickerPrintDialog
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
          batch={selectedBatch}
        />
      </div>
    </div>
  )
}