"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, AlertCircle, Truck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

// Form schema
const createBatchSchema = z.object({
  campaign_id: z.coerce.number().min(1, "Campaign is required"),
  batch_name: z.string().min(1, "Batch name is required").max(255, "Name too long"),
  description: z.string().optional(),
  planned_distribution_date: z.string().min(1, "Distribution date is required"),
  product_id: z.coerce.number().min(1, "Product is required"),
  items_to_assign: z.coerce.number().min(1, "Must assign at least 1 item").optional()
})

type CreateBatchFormData = z.infer<typeof createBatchSchema>

interface Campaign {
  id: number
  title: string
  image?: string
  status?: string
}

interface Product {
  id: number
  name: string
  price: number
  stock: number
  product_description?: string
  product_image?: string
  unit_name?: string
  unit_abbreviation?: string
  allows_personalization?: boolean
}

interface CreateBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (batch: any) => void
}

export function CreateBatchDialog({ open, onOpenChange, onSuccess }: CreateBatchDialogProps) {
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [unassignedCount, setUnassignedCount] = useState<number>(0)
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingCounts, setLoadingCounts] = useState(false)

  const form = useForm<CreateBatchFormData>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      batch_name: "",
      description: "",
      planned_distribution_date: "",
      items_to_assign: undefined,
    },
  })

  const watchedCampaignId = form.watch("campaign_id")
  const watchedProductId = form.watch("product_id")

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true)
      const response = await fetch('/api/campaigns?status=Active&pageSize=100')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } else {
        toast.error("Failed to fetch campaigns")
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error("Error loading campaigns")
    } finally {
      setLoadingCampaigns(false)
    }
  }

  // Fetch products for selected campaign
  const fetchProducts = async (campaignId: number) => {
    try {
      setLoadingProducts(true)
      const response = await fetch(`/api/campaigns/campaign-products?campaign_id=${campaignId}&status=Active&pageSize=100`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to fetch products")
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error("Error loading products")
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  // Fetch unassigned count for selected product
  const fetchUnassignedCount = async (productId: number) => {
    try {
      setLoadingCounts(true)
      const response = await fetch(`/api/batches/unassigned-count?campaign_product_id=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setUnassignedCount(data.remaining_donation_items || 0)
      } else {
        setUnassignedCount(0)
      }
    } catch (error) {
      console.error('Error fetching unassigned count:', error)
      setUnassignedCount(0)
    } finally {
      setLoadingCounts(false)
    }
  }

  // Effects
  useEffect(() => {
    if (open) {
      fetchCampaigns()
    }
  }, [open])

  useEffect(() => {
    if (watchedCampaignId) {
      const campaign = campaigns.find(c => c.id === Number(watchedCampaignId))
      setSelectedCampaign(campaign || null)
      fetchProducts(Number(watchedCampaignId))
      form.setValue("product_id", 0) // Reset product selection
      setUnassignedCount(0)
    }
  }, [watchedCampaignId, campaigns])

  useEffect(() => {
    if (watchedProductId && watchedProductId > 0) {
      fetchUnassignedCount(Number(watchedProductId))
    } else {
      setUnassignedCount(0)
    }
  }, [watchedProductId])

  // Form submit
  const onSubmit = async (data: CreateBatchFormData) => {
    try {
      setLoading(true)

      // Validate distribution date is not in the past
      const selectedDate = new Date(data.planned_distribution_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        toast.error("Distribution date cannot be in the past")
        return
      }

      // Validate items_to_assign if provided
      if (data.items_to_assign && data.items_to_assign > unassignedCount) {
        toast.error(`Cannot assign more than ${unassignedCount} available items`)
        return
      }

      const response = await fetch('/api/batches/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create batch')
      }

      const result = await response.json()
      
      const itemsAssigned = data.items_to_assign || result.assignment_summary.items_assigned
      toast.success(`Batch created successfully! ${itemsAssigned} items assigned.`)
      onSuccess?.(result)
      form.reset()
      onOpenChange(false)

    } catch (error) {
      console.error('Error creating batch:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setSelectedCampaign(null)
    setProducts([])
    setUnassignedCount(0)
    onOpenChange(false)
  }

  // Get minimum date (today) for date input
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Create Distribution Batch
          </DialogTitle>
          <DialogDescription>
            Create a new batch and automatically assign eligible donation items for distribution
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campaign Selection */}
            <FormField
              control={form.control}
              name="campaign_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign *</FormLabel>
                  <Select 
                    value={field.value?.toString()} 
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={loadingCampaigns}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCampaigns ? "Loading campaigns..." : "Select campaign"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{campaign.title}</span>
                            {campaign.status && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {campaign.status}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Selection */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <Select 
                    value={field.value?.toString()} 
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={!watchedCampaignId || loadingProducts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !watchedCampaignId 
                              ? "Select campaign first" 
                              : loadingProducts 
                                ? "Loading products..." 
                                : "Select product"
                          } 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.length === 0 && !loadingProducts ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No active products found for this campaign
                        </div>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            <div className="flex justify-between items-center w-full min-w-0 max-w-full">
                              <div className="flex flex-col items-start min-w-0 flex-1 mr-2 overflow-hidden">
                                <span className="font-medium truncate w-full">{product.name}</span>
                                {/* {product.product_description && (
                                  <span className="text-xs text-muted-foreground truncate w-full block">
                                    {product.product_description}
                                  </span>
                                )} */}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  ₹{product.price}
                                  {product.unit_abbreviation && `/${product.unit_abbreviation}`}
                                </Badge>
                                {product.allows_personalization && (
                                  <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unassigned Items Count */}
            {watchedProductId && watchedProductId > 0 && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-semibold">Available Items</div>
                        <div className="text-sm text-muted-foreground">
                          Donation items ready to be assigned to this batch
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {loadingCounts ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Badge variant={unassignedCount > 0 ? "default" : "secondary"}>
                            {unassignedCount} items
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUnassignedCount(Number(watchedProductId))}
                        disabled={loadingCounts}
                      >
                        {loadingCounts ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Refresh Count"
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {unassignedCount === 0 && !loadingCounts && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No unassigned items available for this product. All donation items may already be assigned to other batches.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {unassignedCount > 0 && !loadingCounts && (
                    <div className="mt-3 space-y-3">
                      <div className="p-3 bg-green-50 rounded-md border border-green-200">
                        <div className="text-sm text-green-700">
                          ✓ {unassignedCount} donation items available for assignment
                        </div>
                      </div>
                      
                      {/* Items to Assign Input */}
                      <FormField
                        control={form.control}
                        name="items_to_assign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Items to Assign (Optional)
                            </FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  max={unassignedCount}
                                  placeholder={`Max ${unassignedCount}`}
                                  className="max-w-32"
                                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                    const target = e.currentTarget
                                    let value = target.value
                                    
                                    // Remove any non-numeric characters
                                    value = value.replace(/[^\d]/g, '')
                                    
                                    // Convert to number and validate range
                                    if (value) {
                                      let numValue = parseInt(value, 10)
                                      if (numValue > unassignedCount) {
                                        numValue = unassignedCount
                                      }
                                      if (numValue < 1) {
                                        numValue = 1
                                      }
                                      value = numValue.toString()
                                    }
                                    
                                    // Update the input value
                                    target.value = value
                                    // Update form field
                                    field.onChange(value ? parseInt(value, 10) : undefined)
                                  }}
                                  onKeyDown={(e) => {
                                    // Prevent typing of non-numeric characters
                                    if (
                                      !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
                                      !/[0-9]/.test(e.key)
                                    ) {
                                      e.preventDefault()
                                    }
                                  }}
                                  onPaste={(e) => {
                                    // Handle paste events
                                    e.preventDefault()
                                    const paste = (e.clipboardData || (window as any).clipboardData).getData('text')
                                    const numericValue = paste.replace(/[^\d]/g, '')
                                    if (numericValue) {
                                      let value = parseInt(numericValue, 10)
                                      if (value > unassignedCount) value = unassignedCount
                                      if (value < 1) value = 1
                                      field.onChange(value)
                                      e.currentTarget.value = value.toString()
                                    }
                                  }}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => form.setValue("items_to_assign", unassignedCount)}
                                className="text-xs whitespace-nowrap"
                              >
                                Assign All
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Leave empty to assign all available items ({unassignedCount})
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Batch Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batch_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., Weekend Distribution - Area 1" 
                        maxLength={255}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planned_distribution_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Distribution Date *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date" 
                        min={today}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter additional details about this batch, location specifics, or special instructions..."
                      rows={3}
                      maxLength={1000}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || unassignedCount === 0 || loadingCounts}
                className="min-w-[120px]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Create Batch"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}