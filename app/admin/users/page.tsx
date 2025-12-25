"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Mail, Phone, Calendar, IndianRupee, Loader2 } from "lucide-react"
import { PaginationInfo, Column, DataTable } from "@/components/common/data-table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Types
interface User {
  id: number
  first_name: string
  last_name: string
  full_name: string
  mobile_no: string
  dob: string | null
  email: string
  is_verified: boolean
  role_id: number | null
  role_name: string | null
  total_donations: number
  total_donated_amount: number
  last_donation_date: string | null
  created_at: string
  updated_at: string
}

interface CustomAction {
  label: string
  icon: any
  onClick: (user: User) => void
  loading?: (user: User) => boolean
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
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
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [certificateLoading, setCertificateLoading] = useState<number | null>(null)

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  // Fetch users function
  const fetchUsers = useCallback(async () => {
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

      const response = await fetch(`/api/user?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(data.pagination || {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection])

  // Fetch users on mount and when dependencies change
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const getVerificationBadgeVariant = useCallback((isVerified: boolean): "default" | "secondary" | "outline" | "destructive" => {
    return isVerified ? "default" : "destructive"
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

  const handleDelete = useCallback((user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirmed = useCallback(async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')

      fetchUsers() // refresh the list
      closeDeleteDialog() // close dialog and reset
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }, [userToDelete, fetchUsers])

  const handleEdit = useCallback((user: User) => {
    window.location.href = `/api/user/update/${user.id}`
  }, [])

  const handleAdd = useCallback(() => {
    window.location.href = '/api/user/create'
  }, [])

  // Handle 80G certificate send via email
  const handle80GSend = useCallback(async (user: User) => {
    try {
      setCertificateLoading(user.id);

      const response = await fetch('/api/generate-and-send-80g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          donation_id: null // Get all donations for the user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send certificate');
      }

      alert('80G certificate sent to user email successfully');
    } catch (error) {
      console.error('Error sending 80G certificate:', error);
      alert(error instanceof Error ? error.message : 'Failed to send certificate');
    } finally {
      setCertificateLoading(null);
    }
  }, [])

  // Define table columns with useMemo to prevent recreation
  const columns: Column<User>[] = useMemo(() => [
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      searchable: true,
      width: '200px',
      render: (value, row) => (
        <div className="max-w-[180px]">
          <div className="font-semibold truncate">{row.full_name}</div>
          <div className="text-sm text-muted-foreground truncate flex items-center">
            <Mail className="h-3 w-3 mr-1" />
            {row.email}
          </div>
        </div>
      )
    },
    {
      key: 'mobile_no',
      header: 'Mobile',
      sortable: true,
      width: '120px',
      render: (value) => (
        <div className="flex items-center text-sm">
          <Phone className="h-3 w-3 mr-1" />
          {value}
        </div>
      )
    },
    {
      key: 'role_name',
      header: 'Role',
      sortable: true,
      filterable: true,
      width: '100px',
      filterOptions: [
        { label: 'Admin', value: 'Admin' },
        { label: 'User', value: 'User' },
        { label: 'Donor', value: 'Donor' }
      ],
      render: (value) => value || 'No Role'
    },
    {
      key: 'is_verified',
      header: 'Status',
      sortable: true,
      filterable: true,
      width: '100px',
      filterOptions: [
        { label: 'Verified', value: 'true' },
        { label: 'Unverified', value: 'false' }
      ],
      render: (value) => (
        <Badge variant={getVerificationBadgeVariant(value)}>
          {value ? 'Verified' : 'Unverified'}
        </Badge>
      )
    },
    {
      key: 'total_donations',
      header: 'Donations',
      sortable: true,
      width: '80px',
      render: (value) => value || 0
    },
    {
      key: 'total_donated_amount',
      header: 'Amount',
      sortable: true,
      width: '100px',
      render: (value) => value ? `₹${value.toLocaleString()}` : '₹0'
    },
    {
      key: 'created_at',
      header: 'Joined',
      sortable: true,
      width: '120px',
      render: (value) => formatDate(value)
    },
    {
      key: 'send_80g',
      header: '80G',
      width: '80px',
      render: (value, row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2"
          onClick={() => handle80GSend(row)}
          disabled={certificateLoading === row.id}
        >
          {certificateLoading === row.id ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Mail className="h-3 w-3" />
          )}
        </Button>
      )
    }
  ], [getVerificationBadgeVariant, handle80GSend, certificateLoading])
  // Mobile card component with useCallback
  const renderMobileCard = useCallback((user: User, index: number) => (
    <Card key={user.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{user.full_name}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Phone className="h-3 w-3 mr-1" />
              <span>{user.mobile_no}</span>
            </div>
          </div>
          <Badge variant={getVerificationBadgeVariant(user.is_verified)} className="ml-2 shrink-0">
            {user.is_verified ? 'Verified' : 'Unverified'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Role:</span>
            <p className="font-medium">{user.role_name || 'No Role'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Joined:</span>
            <p className="font-medium">{formatDate(user.created_at)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Donations:</span>
            <p className="font-medium">{user.total_donations || 0}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Amount:</span>
            <p className="font-medium flex items-center">
              <IndianRupee className="h-3 w-3 mr-1" />
              {user.total_donated_amount?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {user.dob && (
          <div className="text-sm mb-3">
            <span className="text-muted-foreground">DOB: </span>
            <span className="font-medium flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(user.dob)}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(user)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handle80GSend(user)}
            disabled={certificateLoading === user.id}
            className="flex-1"
          >
            {certificateLoading === user.id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Send 80G
          </Button>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(user)}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [handleEdit, handleDelete, getVerificationBadgeVariant, handle80GSend, certificateLoading])


  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-6">
        <DataTable<User>
          // Data
          data={users}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}

          // Header
          title="Users"
          description="Manage platform users and their accounts"

          // Add functionality
          onAdd={handleAdd}
          addButtonLabel="Add User"
          showAddButton={true}

          // Search (API-driven)
          showSearch={true}
          searchPlaceholder="Search users by name, email, or mobile..."
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

          // Actions - Use custom action renderer
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No users found"

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
              This will permanently delete the user &quot;{userToDelete?.full_name}&quot; and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}