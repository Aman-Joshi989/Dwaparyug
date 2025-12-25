"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";

// Form validation schema
const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name too long"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  unit_id: z.coerce.number().optional(),
  min_qty: z.coerce.number().min(1, "Minimum quantity must be at least 1").default(1),
  max_qty: z.coerce.number().optional(),
  increment_count: z.coerce.number().min(1, "Increment count must be at least 1").default(1),
  is_flexible_increment_count: z.boolean().default(true),
  allows_personalization: z.boolean().default(true),
  min_tat: z.coerce.number().min(0, "Minimum TAT must be at least 0").optional(),
  max_tat: z.coerce.number().min(0, "Maximum TAT must be at least 0").optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  created_by: z.coerce.number().optional(),
  updated_by: z.coerce.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Unit {
  id: number;
  name: string;
  abbreviation?: string;
}

interface ProductFormProps {
  productId?: string | null;
  mode: 'create' | 'edit' | 'view';
  onSuccess?: (product: any) => void;
  onCancel?: () => void;
}

export default function ProductForm({ productId, mode, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!productId);
  const [units, setUnits] = useState<Unit[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      min_qty: 1,
      increment_count: 1,
      is_flexible_increment_count: true,
      allows_personalization: true,
      status: "Active",
    },
  });

  // Fetch units for dropdown
  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/campaign-product-units');
      if (response.ok) {
        const data = await response.json();
        setUnits(data || []);
      }
    } catch (error) {
      console.warn('Could not fetch units:', error);
    }
  };

  // Fetch single product data using existing API
  const fetchProduct = async (id: string) => {
    try {
      setInitialLoading(true);
      // Using your existing API with query parameter
      const response = await fetch(`/api/independent-products/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      // Assuming your API returns single product data when id is provided
      const product = data.product || data.products?.[0];

      if (!product) {
        throw new Error('Product not found');
      }

      // Reset form with fetched data
      form.reset({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        unit_id: product.unit_id || undefined,
        min_qty: product.min_qty || 1,
        max_qty: product.max_qty || undefined,
        increment_count: product.increment_count || 1,
        is_flexible_increment_count: product.is_flexible_increment_count ?? true,
        allows_personalization: product.allows_personalization ?? true,
        min_tat: product.min_tat || 1,
        max_tat: product.max_tat || 1,
        status: product.status || "Active",
        created_by: product.created_by || undefined,
        updated_by: product.updated_by || undefined,
      });

      // Set current image
      if (product.image) {
        setCurrentImageUrl(product.image);
        setImagePreview(product.image);
      }

    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    if (productId && mode !== 'create') {
      fetchProduct(productId);
    }
  }, [productId, mode]);

  // Handle image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImageUrl(null);
  };

  // Submit form using existing API
  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);

      const formData = new FormData();

      // Append form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value.toString());
        }
      });

      // Append image if selected
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (mode === 'edit' && !imagePreview) {
        // User removed the image
        formData.append('image', '');
      }

      // Use existing API endpoints
      const url = mode === 'create'
        ? '/api/independent-products'
        : `/api/independent-products?id=${productId}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} product`);
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Product ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      onSuccess?.(result.product);

    } catch (error) {
      console.error(`Error ${mode}ing product:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${mode} product`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="p-4 pt-0 ">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Image Upload */}
          <div className="space-y-4">
            <FormLabel>Product Image</FormLabel>

            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Product preview"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : !isReadOnly ? (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="text-xs text-gray-500">Upload Image</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isReadOnly} placeholder="Enter product name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isReadOnly}
                      placeholder="0.00"
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isReadOnly}
                    placeholder="Enter product description"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit and Quantity Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    disabled={isReadOnly}
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">No unit</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name} {unit.abbreviation && `(${unit.abbreviation})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="min_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Quantity</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      disabled={isReadOnly}
                      placeholder="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Quantity</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      disabled={isReadOnly}
                      placeholder="No limit"
                    />
                  </FormControl>
                  <FormDescription>Leave empty for no limit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="increment_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Increment Count</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      disabled={isReadOnly}
                      placeholder="1"
                    />
                  </FormControl>
                  <FormDescription>Quantity increment steps</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select disabled={isReadOnly} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Turn Around Time (TAT) - Domestic */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Turn Around Time  </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="min_tat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum TAT (days)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormDescription>Minimum turnaround time in days</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_tat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum TAT (days)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        placeholder="No limit"
                      />
                    </FormControl>
                    <FormDescription>Maximum turnaround time in days</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          
          {/* Feature Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="is_flexible_increment_count"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Flexible Increment</FormLabel>
                    <FormDescription>
                      Allow customers to choose any quantity within limits
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={isReadOnly}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allows_personalization"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Personalization</FormLabel>
                    <FormDescription>
                      Enable custom personalization options for this product
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={isReadOnly}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Product' : 'Update Product'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}