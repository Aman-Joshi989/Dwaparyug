
// File: components/batches/batch-progress-dialog.tsx
"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Package2, User, Calendar, TrendingUp } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface BatchItem {
  id: number
  donation_item_id: number
  quantity_allocated: number
  status: 'allocated' | 'prepared' | 'distributed'
  donor_name: string
  donor_email: string
  campaign_product_name: string
  price_per_unit: number
  total_price: number
  donation_date: string
}

interface Batch {
  id: number
  batch_name: string
  status: string
  total_items: number
  allocated_items: number
  prepared_items: number
  distributed_items: number
  progress_percentage: number
}

interface BatchProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batch: Batch | null
  onProgressUpdated?: () => void
}

export function BatchProgressDialog({ open, onOpenChange, batch, onProgressUpdated }: BatchProgressDialogProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)

  // Fetch batch items when dialog opens
  const fetchBatchItems = async () => {
    if (!batch) return

    try {
      setLoading(true)
      const response = await fetch(`/api/batches/${batch.id}/items`)
      if (response.ok) {
        const data = await response.json()
        setBatchItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching batch items:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && batch) {
      fetchBatchItems()
    }
  }, [open, batch])

  // Update item status
  const updateItemStatus = async (donationItemId: number, newStatus: string) => {
    if (!batch) return

    try {
      setUpdating(donationItemId)
      const response = await fetch('/api/batches/update-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_id: batch.id,
          donation_item_id: donationItemId,
          status: newStatus
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      const result = await response.json()
      
      // Update local state
      setBatchItems(prev => prev.map(item => 
        item.donation_item_id === donationItemId 
          ? { ...item, status: newStatus as any }
          : item
      ))

      toast({
        title: "Success",
        description: `Item status updated to ${newStatus}`,
      })

      onProgressUpdated?.()

    } catch (error) {
      console.error('Error updating item status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'distributed': return 'default'
      case 'prepared': return 'secondary'
      case 'allocated': return 'outline'
      default: return 'outline'
    }
  }

  const formatCurrency = (amount: number) => `₹${amount?.toLocaleString() || '0'}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  if (!batch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Progress: {batch.batch_name}</DialogTitle>
          <DialogDescription>
            Track and update the distribution progress of items in this batch
          </DialogDescription>
        </DialogHeader>

        {/* Batch Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package2 className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{batch.total_items}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{batch.distributed_items}</div>
                  <div className="text-sm text-muted-foreground">Distributed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{batch.prepared_items}</div>
                  <div className="text-sm text-muted-foreground">Prepared</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{batch.progress_percentage}%</div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span>{batch.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(batch.progress_percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Batch Items</h3>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading batch items...</span>
            </div>
          ) : batchItems.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No items found in this batch
            </div>
          ) : (
            <div className="space-y-3">
              {batchItems.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{item.campaign_product_name}</h4>
                            <div className="text-sm text-muted-foreground">
                              Donor: {item.donor_name} • {item.donor_email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Donated: {formatDate(item.donation_date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(item.total_price)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity_allocated}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>

                        <Select
                          value={item.status}
                          onValueChange={(newStatus) => updateItemStatus(item.donation_item_id, newStatus)}
                          disabled={updating === item.donation_item_id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="allocated">Allocated</SelectItem>
                            <SelectItem value="prepared">Prepared</SelectItem>
                            <SelectItem value="distributed">Distributed</SelectItem>
                          </SelectContent>
                        </Select>

                        {updating === item.donation_item_id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}