import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Calendar, Package } from "lucide-react"

interface EditDonationItemModalProps {
  isOpen: boolean
  onClose: () => void
  donationItemId: number | null
  onSuccess?: () => void
}

interface DonationItemData {
  id: number
  quantity: number
  donation_date: string
  product: {
    name: string
    description: string
    unit: {
      name: string
      abbreviation: string
    }
  }
  personalization: {
    donor_name: string
    donor_country: string
    custom_message: string
    donation_purpose: string
    special_instructions: string
  } | null
}

export default function EditDonationItemModal({
  isOpen,
  onClose,
  donationItemId,
  onSuccess
}: EditDonationItemModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemData, setItemData] = useState<DonationItemData | null>(null)

  // Form state
  const [quantity, setQuantity] = useState<number>(0)
  const [donationDate, setDonationDate] = useState<string>("")
  const [donorName, setDonorName] = useState<string>("")
  const [donorCountry, setDonorCountry] = useState<string>("")
  const [customMessage, setCustomMessage] = useState<string>("")
  const [donationPurpose, setDonationPurpose] = useState<string>("")
  const [specialInstructions, setSpecialInstructions] = useState<string>("")

  // Fetch donation item data when modal opens
  useEffect(() => {
    if (isOpen && donationItemId) {
      fetchDonationItem()
    }
  }, [isOpen, donationItemId])

  const fetchDonationItem = async () => {
    if (!donationItemId) return

    try {
      setFetchLoading(true)
      setError(null)

      const response = await fetch(`/api/donations/donation-items/${donationItemId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch donation item')
      }

      const data = await response.json()
      if (data.success && data.item) {
        setItemData(data.item)
        
        // Populate form fields
        setQuantity(data.item.quantity || 0)
        setDonationDate(data.item.donation_date ? formatDateForInput(data.item.donation_date) : "")
        setDonorName(data.item.personalization?.donor_name || "")
        setDonorCountry(data.item.personalization?.donor_country || "")
        setCustomMessage(data.item.personalization?.custom_message || "")
        setDonationPurpose(data.item.personalization?.donation_purpose || "")
        setSpecialInstructions(data.item.personalization?.special_instructions || "")
      } else {
        throw new Error(data.error || 'Failed to load item data')
      }
    } catch (error) {
      console.error('Error fetching donation item:', error)
      setError(error instanceof Error ? error.message : 'Failed to load item')
    } finally {
      setFetchLoading(false)
    }
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!donationItemId) return

    // Validation
    if (quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const updateData = {
        quantity: parseInt(quantity.toString()),
        donation_date: donationDate || null,
        personalization: {
          donor_name: donorName || null,
          donor_country: donorCountry || null,
          custom_message: customMessage || null,
          donation_purpose: donationPurpose || null,
          special_instructions: specialInstructions || null
        }
      }

      const response = await fetch(`/api/donations/donation-items/${donationItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update donation item')
      }

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.()
        handleClose()
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (error) {
      console.error('Error updating donation item:', error)
      setError(error instanceof Error ? error.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form
    setQuantity(0)
    setDonationDate("")
    setDonorName("")
    setDonorCountry("")
    setCustomMessage("")
    setDonationPurpose("")
    setSpecialInstructions("")
    setError(null)
    setItemData(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Donation Item</DialogTitle>
          <DialogDescription>
            Update donation date, and personalization details
          </DialogDescription>
        </DialogHeader>

        {fetchLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {itemData && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{itemData.product.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{itemData.product.description}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Quantity */}
              {/* <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    required
                    className="flex-1"
                  />
                  {itemData && (
                    <span className="text-sm text-muted-foreground">
                      {itemData.product.unit.abbreviation}
                    </span>
                  )}
                </div>
              </div> */}

              {/* Donation Date */}
              <div className="space-y-2">
                <Label htmlFor="donationDate">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Donation Date
                </Label>
                <Input
                  id="donationDate"
                  type="datetime-local"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                />
              </div>

              {/* Personalization Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Personalization Details</h4>
                
                <div className="space-y-4">
                  {/* Donor Name */}
                  <div className="space-y-2">
                    <Label htmlFor="donorName">Donor Name</Label>
                    <Input
                      id="donorName"
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Enter donor name"
                      maxLength={100}
                    />
                  </div>

                  {/* Donation Purpose */}
                  <div className="space-y-2">
                    <Label htmlFor="donationPurpose">Donation Purpose</Label>
                    <Input
                      id="donationPurpose"
                      type="text"
                      value={donationPurpose}
                      onChange={(e) => setDonationPurpose(e.target.value)}
                      placeholder="Enter donation purpose"
                      maxLength={200}
                    />
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Textarea
                      id="customMessage"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter a personalized message"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {customMessage.length}/500 characters
                    </p>
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="specialInstructions">Special Instructions</Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Enter any special instructions"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {specialInstructions.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}