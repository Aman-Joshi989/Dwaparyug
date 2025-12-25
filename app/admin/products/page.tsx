"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { PaginationInfo, Column, FilterOption, DataTable } from "@/components/common/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { IndependentProduct } from "@/lib/interface";
import ProductModal from "@/components/modals/ProductModal";
import { toast } from "@/components/ui/use-toast";

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Types for API response
interface ApiResponse {
  products: IndependentProduct[];
  pagination: PaginationInfo;
}

export default function IndependentProductsPage() {
  const [products, setProducts] = useState<IndependentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API-driven filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // API-driven pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // API-driven sort states
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<IndependentProduct | null>(null);

  // Product modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Use refs to track the current values to avoid infinite loops
  const currentParams = useRef({
    page: 1,
    pageSize: 10,
    searchTerm: "",
    filters: {},
    sortField: "",
    sortDirection: "desc" as "asc" | "desc"
  });

  // Update ref when params change
  useEffect(() => {
    currentParams.current = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      searchTerm,
      filters,
      sortField,
      sortDirection
    };
  });

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      // Add search
      if (searchTerm) params.append('search', searchTerm);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      
      // Add sorting
      if (sortField) {
        params.append('sortBy', sortField);
        params.append('sortOrder', sortDirection);
      }

      const response = await fetch(`/api/independent-products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data: ApiResponse = await response.json();
      setProducts(data.products || []);
      setPagination(data.pagination || {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sortField, sortDirection]);

  // API-driven handlers
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = useCallback((column: string, order: 'asc' | 'desc') => {
    setSortField(column);
    setSortDirection(order);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: pageSize, page: 1 }));
  }, []);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setSelectedProductId(null);
    setFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((product: IndependentProduct) => {
    setModalMode('edit');
    setSelectedProductId(product.id.toString());
    setFormModalOpen(true);
  }, []);

  const openViewModal = useCallback((product: IndependentProduct) => {
    setModalMode('view');
    setSelectedProductId(product.id.toString());
    setFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    setSelectedProductId(null);
  }, []);

  const handleFormSuccess = useCallback(async () => {
    closeFormModal();
    await fetchProducts();
    toast({
      title: "Success",
      description: "Product saved successfully.",
    });
  }, [fetchProducts]);

  // Delete handlers
  const handleDelete = useCallback((product: IndependentProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/independent-products?id=${productToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });

      fetchProducts(); // refresh the list
      closeDeleteDialog(); // close dialog and reset
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  }, [productToDelete, fetchProducts]);

  // Define table columns with useMemo to prevent recreation
  const columns: Column<IndependentProduct>[] = useMemo(() => [
    {
      key: "image",
      header: "Image",
      width: "80px",
      render: (value) => (
        <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100">
          {value ? (
            <Image
              src={value}
              alt="Product"
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      searchable: true,
      width: '250px',
      render: (value, row) => (
        <div className="max-w-[220px]">
          <div className="font-medium cursor-pointer hover:text-blue-600 truncate" onClick={() => openViewModal(row)}>
            {value}
          </div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      width: '100px',
      render: (value) => `₹${Number(value).toLocaleString()}`,
    },
    {
      key: "unit",
      header: "Unit",
      width: '120px',
      render: (value, row) => {
        if ((row as any).unit) {
          const unit = (row as any).unit;
          return `${unit.name}${unit.abbreviation ? ` (${unit.abbreviation})` : ''}`;
        }
        return "-";
      },
    },
    {
      key: "min_qty",
      header: "Min/Max Qty",
      width: '100px',
      render: (value, row) => (
        <div className="text-xs">
          <div>Min: {value}</div>
          <div>Max: {row.max_qty || '∞'}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      width: '80px',
      filterOptions: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ] as FilterOption[],
      render: (value) => (
        <Badge variant={value === "Active" ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
    },
    {
      key: "allows_personalization",
      header: "Features",
      filterable: true,
      width: '120px',
      filterOptions: [
        { label: "Personalizable", value: "personalizable" },
        { label: "Flexible Quantity", value: "flexible_qty" },
        { label: "Both", value: "both" },
        { label: "None", value: "none" },
      ] as FilterOption[],
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          {row.allows_personalization && (
            <Badge variant="outline" className="text-xs">
              Personalizable
            </Badge>
          )}
          {row.is_flexible_increment_count && (
            <Badge variant="outline" className="text-xs">
              Flexible Qty
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      width: '120px',
      render: (value) => formatDate(value),
    },
  ], [openViewModal]);

  // Mobile card component with useCallback
  const renderMobileCard = useCallback((product: IndependentProduct, index: number) => (
    <Card key={product.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100 shrink-0">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate cursor-pointer hover:text-blue-600" 
                  onClick={() => openViewModal(product)}>
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>
          <Badge variant={product.status === "Active" ? "default" : "secondary"} className="ml-2 shrink-0">
            {product.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-muted-foreground">Price:</span>
            <p className="font-medium">₹{Number(product.price).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Unit:</span>
            <p className="font-medium">
              {(product as any).unit ? 
                `${(product as any).unit.name}${(product as any).unit.abbreviation ? ` (${(product as any).unit.abbreviation})` : ''}` : 
                '-'
              }
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Min Qty:</span>
            <p className="font-medium">{product.min_qty}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Max Qty:</span>
            <p className="font-medium">{product.max_qty || '∞'}</p>
          </div>
        </div>

        {(product.allows_personalization || product.is_flexible_increment_count) && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.allows_personalization && (
              <Badge variant="outline" className="text-xs">
                Personalizable
              </Badge>
            )}
            {product.is_flexible_increment_count && (
              <Badge variant="outline" className="text-xs">
                Flexible Qty
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openViewModal(product)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openEditModal(product)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(product)}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [openViewModal, openEditModal, handleDelete]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto space-y-6">
        <DataTable<IndependentProduct>
          // Data
          data={products}
          columns={columns}
          loading={loading}
          error={error}
          pagination={pagination}

          // Header
          title="Independent Products"
          description="Manage and view all your independent products"

          // Add functionality
          onAdd={openCreateModal}
          addButtonLabel="Add Product"
          showAddButton={true}

          // Search (API-driven)
          showSearch={true}
          searchPlaceholder="Search products by name, description..."
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
          onEdit={openEditModal}
          onDelete={handleDelete}
          emptyMessage="No products found"

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

      {/* Product Modal */}
      <ProductModal
        open={formModalOpen}
        onOpenChange={closeFormModal}
        productId={selectedProductId}
        mode={modalMode}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product &quot;{productToDelete?.name}&quot;.
              This action cannot be undone and may affect existing campaigns that use this product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirmed} 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}