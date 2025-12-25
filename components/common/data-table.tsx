"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit,
  Eye,
  Trash2,
  Plus,
  Filter,
  X,
  AlertCircle,
  Columns
} from "lucide-react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

// Types
export interface FilterOption {
  label: string;
  value: string;
}

export interface Column<T = any> {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  filterOptions?: FilterOption[];
}

export interface CollapsibleData {
  render: (row: any) => React.ReactNode;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | Error | null;
  pagination: PaginationInfo;

  // Header content
  title?: string;
  description?: string;

  // Add functionality
  onAdd?: () => void;
  addButtonLabel?: string;
  showAddButton?: boolean;

  // Search - ALL API DRIVEN
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchChange: (search: string) => void;

  // Filters - ALL API DRIVEN
  showFilters?: boolean;
  filters?: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;

  // Sorting - ALL API DRIVEN
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (column: string, order: 'asc' | 'desc') => void;

  // Pagination - ALL API DRIVEN
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  // Selection
  allowCheckbox?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowIdKey?: string;

  // Collapsible
  isCollapsible?: boolean;
  collapsibleData?: CollapsibleData;

  // Actions
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  noDataComponent?: React.ReactNode;

  // Action callbacks
  onEdit?: (row: T) => void;
  onView?: (row: T) => void;
  onDelete?: (row: T) => void;

  // Additional configurations
  stickyHeader?: boolean;
  maxHeight?: string;
  striped?: boolean;
  dense?: boolean;

  // Column Visibility
  showColumnVisibility?: boolean;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;

  // Mobile/Responsive
  mobileCardComponent?: (row: T, index: number) => React.ReactNode;
  showMobileCards?: boolean;
}

const ErrorBoundary = ({ error, onRetry }: { error: string | Error; onRetry?: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>{typeof error === 'string' ? error : error.message}</span>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

const LoadingSpinner = ({ className = "" }) => (
  <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-primary ${className}`}></div>
);

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns = [],
  loading = false,
  error = null,
  pagination,

  // Header content
  title,
  description,

  // Add functionality
  onAdd,
  addButtonLabel = "Add New",
  showAddButton = true,

  // Search - API DRIVEN
  showSearch = true,
  searchPlaceholder = "Search...",
  searchTerm = "",
  onSearchChange,

  // Filters - API DRIVEN
  showFilters = false,
  filters = {},
  onFiltersChange,

  // Sorting - API DRIVEN
  sortBy,
  sortOrder = 'asc',
  onSort,

  // Pagination - API DRIVEN
  onPageChange,
  onPageSizeChange,

  // Selection
  allowCheckbox = false,
  selectedRows = [],
  onSelectionChange,
  rowIdKey = "id",

  // Collapsible
  isCollapsible = false,
  collapsibleData,

  // Actions
  onRowClick,
  emptyMessage = "No data available",
  noDataComponent,
  onEdit,
  onView,
  onDelete,

  // Additional configurations
  stickyHeader = false,
  maxHeight,
  striped = false,
  dense = false,

  // Column Visibility
  showColumnVisibility = false,
  columnVisibility = {},
  onColumnVisibilityChange,

  // Mobile/Responsive
  mobileCardComponent,
  showMobileCards = true,
}: DataTableProps<T>) {
  // Local state for UI only (not for data filtering)
  const [localSearch, setLocalSearch] = useState(searchTerm || "");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Column visibility state - use useMemo for default and update only when needed
  const defaultColumnVisibility = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }, [columns]);

  const [localColumnVisibility, setLocalColumnVisibility] = useState<Record<string, boolean>>(() => {
    return columnVisibility && Object.keys(columnVisibility).length > 0 
      ? columnVisibility 
      : defaultColumnVisibility;
  });

  // Update local search when prop changes - but prevent infinite loops
  useEffect(() => {
    if (searchTerm !== localSearch) {
      setLocalSearch(searchTerm || "");
    }
  }, [searchTerm]); // Only depend on searchTerm

  // Update column visibility when prop changes - prevent infinite loops
  useEffect(() => {
    if (columnVisibility && Object.keys(columnVisibility).length > 0) {
      setLocalColumnVisibility(prev => {
        // Only update if actually different
        const isDifferent = Object.keys(columnVisibility).some(
          key => columnVisibility[key] !== prev[key]
        );
        return isDifferent ? columnVisibility : prev;
      });
    }
  }, [columnVisibility]);

  // Debounced search - calls API - fix dependencies
  useEffect(() => {
    if (localSearch === searchTerm) return; // Prevent unnecessary calls
    
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]); // Stable dependencies

  // Safe data operations
  const safeData = useMemo(() => {
    return Array.isArray(data) ? data.filter(row => row != null) : [];
  }, [data]);

  // Handle sorting - calls API
  const handleSort = useCallback((columnKey: string) => {
    if (!onSort || !columnKey) return;
    const newOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newOrder);
  }, [onSort, sortBy, sortOrder]);

  // Handle filter changes - calls API
  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    if (!onFiltersChange) return;
    
    const newFilters = { ...filters };
    if (!value || value === 'all' || value === '') {
      delete newFilters[columnKey];
    } else {
      newFilters[columnKey] = value;
    }
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Clear all filters - calls API
  const clearAllFilters = useCallback(() => {
    if (!onFiltersChange) return;
    onFiltersChange({});
  }, [onFiltersChange]);

  // Handle column visibility
  const handleColumnVisibilityChange = useCallback((columnKey: string, checked: boolean) => {
    const newVisibility = { ...localColumnVisibility, [columnKey]: checked };
    setLocalColumnVisibility(newVisibility);
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibility);
    }
  }, [localColumnVisibility, onColumnVisibilityChange]);

  // Handle page size change - calls API
  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = Math.max(1, Number(newSize) || 10);
    onPageSizeChange(size);
    onPageChange(1); // Reset to first page
  }, [onPageSizeChange, onPageChange]);

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      const allIds = safeData.map(row => String(row[rowIdKey] || ''));
      onSelectionChange(allIds.filter(id => id));
    } else {
      onSelectionChange([]);
    }
  }, [onSelectionChange, safeData, rowIdKey]);

  const handleSelectRow = useCallback((rowId: string, checked: boolean) => {
    if (!onSelectionChange || !rowId) return;
    
    if (checked) {
      onSelectionChange([...selectedRows, rowId]);
    } else {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    }
  }, [onSelectionChange, selectedRows]);

  // Handle row expansion (client-side only)
  const toggleRowExpansion = useCallback((rowId: string) => {
    if (!rowId) return;
    
    setExpandedRows(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  }, []);

  // Get filterable columns
  const filterableColumns = useMemo(() => {
    //@ts-ignore
    return columns.filter(col => col?.filterable && col?.filterOptions?.length > 0);
  }, [columns]);

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.keys(filters).filter(key => filters[key] && filters[key] !== 'all').length;
  }, [filters]);

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(col => localColumnVisibility[col.key] !== false);
  }, [columns, localColumnVisibility]);

  // Selection state
  const selectionState = useMemo(() => {
    const validRows = safeData.filter(row => row[rowIdKey]);
    const allSelected = validRows.length > 0 && validRows.every(row => selectedRows.includes(String(row[rowIdKey])));
    const someSelected = selectedRows.length > 0 && !allSelected;
    
    return { isAllSelected: allSelected, isSomeSelected: someSelected };
  }, [safeData, selectedRows, rowIdKey]);

  // Generate page numbers
  const getPageNumbers = useCallback(() => {
    const { totalPages, page: currentPage } = pagination;
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = Math.max(1, totalPages - maxVisiblePages + 1); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= Math.min(currentPage + 2, totalPages); i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }, [pagination]);

  // Handle action clicks
  const handleActionClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  }, []);

  // Error display
  if (error) {
    return (
      <div className="space-y-4">
        {(title || description) && (
          <div>
            {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        )}
        <ErrorBoundary error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold tracking-tight">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Desktop Controls */}
      <div className="hidden lg:flex flex-col sm:flex-row gap-3">
        {/* Left side - Search and Filters */}
        <div className="flex gap-2 flex-1">
          {showSearch && (
            <div className="w-80">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value || "")}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          )}

          {showFilters && filterableColumns.length > 0 && (
            <div className="flex gap-2">
              {filterableColumns.map((column) => (
                <Select
                  key={column.key}
                  value={filters[column.key] || 'all'}
                  onValueChange={(value) => handleFilterChange(column.key, value)}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder={`All ${column.header}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {column.header}</SelectItem>
                    {column.filterOptions?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="h-9">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          )}

          {showColumnVisibility && columns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Columns className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    className="capitalize"
                    checked={localColumnVisibility[column.key] !== false}
                    onCheckedChange={(checked) => handleColumnVisibilityChange(column.key, !!checked)}
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right side - Add Button */}
        {showAddButton && onAdd && (
          <Button onClick={onAdd} className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex lg:hidden items-center justify-between gap-2">
        {showSearch && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value || "")}
                className="pl-8 h-9"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {showFilters && filterableColumns.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 relative"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          )}

          {showAddButton && onAdd && (
            <Button onClick={onAdd} size="sm" className="h-9">
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showFiltersPanel && (
        <Card className="lg:hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Filters</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFiltersPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {filterableColumns.map((column) => (
                <div key={column.key}>
                  <label className="text-sm font-medium mb-1 block">
                    {column.header}
                  </label>
                  <Select
                    value={filters[column.key] || 'all'}
                    onValueChange={(value) => handleFilterChange(column.key, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`All ${column.header}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {column.header}</SelectItem>
                      {column.filterOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearAllFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
        </span>
        <Select value={String(pagination.pageSize)} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selection Actions */}
      {allowCheckbox && selectedRows.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium">{selectedRows.length} item(s) selected</span>
            <Button variant="outline" size="sm" onClick={() => onSelectionChange?.([])}>
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && safeData.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            {noDataComponent || (
              <div>
                <p className="text-muted-foreground text-lg mb-4">{emptyMessage}</p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards */}
      {!loading && safeData.length > 0 && showMobileCards && mobileCardComponent && (
        <div className="block lg:hidden space-y-4">
          {safeData.map((row, index) => mobileCardComponent(row, index))}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && safeData.length > 0 && (
        <Card className={showMobileCards ? "hidden lg:block" : ""}>
          <div className={maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : ''}>
            <Table>
              <TableHeader className={stickyHeader ? "sticky top-0 z-10 bg-background" : ""}>
                <TableRow className="hover:bg-transparent">
                  {allowCheckbox && (
                    <TableHead className="w-10 p-2">
                      <Checkbox
                        checked={selectionState.isAllSelected}
                        onCheckedChange={handleSelectAll}
                        className={selectionState.isSomeSelected ? "data-[state=indeterminate]:bg-primary" : ""}
                      />
                    </TableHead>
                  )}
                  {isCollapsible && (
                    <TableHead className="w-10 p-2"></TableHead>
                  )}
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`p-2 ${dense ? 'h-8' : 'h-10'} ${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.header}
                        {column.sortable && (
                          <div className="flex flex-col">
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${
                                sortBy === column.key && sortOrder === 'asc' ? 'rotate-180' : ''
                              } ${sortBy === column.key ? 'opacity-100' : 'opacity-30'}`}
                            />
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  {(onEdit || onView || onDelete) && (
                    <TableHead className="w-20 p-2 h-10">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeData.map((row, index) => {
                  const rowId = String(row[rowIdKey] || index);
                  const isExpanded = isCollapsible && expandedRows.includes(rowId);
                  return (
                    <React.Fragment key={rowId}>
                      <TableRow
                        className={`
                          ${onRowClick && !allowCheckbox ? 'cursor-pointer' : ''}
                          ${striped && index % 2 === 1 ? 'bg-muted/50' : ''}
                        `}
                        onClick={() => !allowCheckbox && onRowClick?.(row, index)}
                      >
                        {allowCheckbox && (
                          <TableCell className="p-2">
                            <Checkbox
                              checked={selectedRows.includes(rowId)}
                              onCheckedChange={(checked) => handleSelectRow(rowId, !!checked)}
                            />
                          </TableCell>
                        )}
                        {isCollapsible && (
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(rowId);
                              }}
                            >
                              <ChevronDown
                                className={`h-3 w-3 transition-transform ${
                                  isExpanded ? 'transform rotate-180' : ''
                                }`}
                              />
                            </Button>
                          </TableCell>
                        )}
                        {visibleColumns.map((column) => (
                          <TableCell key={column.key} className={`p-2 ${dense ? 'h-10' : 'h-12'}`}>
                            {column.render
                              ? column.render(row[column.key], row, index)
                              : (row[column.key] !== null && row[column.key] !== undefined 
                                  ? String(row[column.key]) 
                                  : '-')
                            }
                          </TableCell>
                        ))}
                        {(onEdit || onView || onDelete) && (
                          <TableCell className={`p-2 ${dense ? 'h-10' : 'h-12'}`}>
                            <div className="flex items-center gap-1">
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => handleActionClick(e, () => onEdit(row))}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => handleActionClick(e, () => onView(row))}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => handleActionClick(e, () => onDelete(row))}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                      {isCollapsible && isExpanded && collapsibleData && (
                        <TableRow className="border-t-0 hover:bg-transparent">
                          <TableCell colSpan={visibleColumns.length + (allowCheckbox ? 1 : 0) + (isCollapsible ? 1 : 0) + 1} className="p-0">
                            <div className="p-4 bg-muted/20">
                              {collapsibleData.render(row)}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="space-x-2 flex items-center">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={pagination.page === page ? "default" : "outline"}
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}