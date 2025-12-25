"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, X, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import Image from "next/image";
import type { Campaign, CampaignCategory, IndependentProduct, Product } from "@/lib/interface";
import { festivalTypes } from "@/lib/utils";
import { uploadImages, fileToBase64, createPreviewUrl, RichTextEditor, LocalImage } from "@/lib/helper-function";

const campaignFormSchema = z.object({
  id: z.number().optional(),
  code: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters long."),
  category_id: z.coerce.number().min(1, "Category is required."),
  festival_type: z.string().optional(),
  overview: z.string().min(10, "Overview must be at least 10 characters long."),
  details: z.string().min(20, "Details must be at least 20 characters long."),
  donation_goal: z.coerce.number().min(1, "Donation goal must be at least ₹1."),
  beneficiaries: z.coerce.number().min(1, "Beneficiaries must be at least 1."),
  sequence: z.coerce.number().min(1, "sequence must be at least 1."),
  total_raised: z.number().optional(),
  status: z.enum(["Active", "Inactive",]),
  is_featured: z.boolean().optional(),
  image: z.string().min(1, "Banner image is required."),
  mobile_banner_image: z.string().min(1, "Mobile banner image is required."),
  images_array: z.array(z.string()).optional(),
  assignedProducts: z
    .array(
      z.object({
        id: z.number().optional(),
        indipendent_product_id: z.coerce.number().min(1, "Product is required"),
        description: z.string().optional(),
        price: z.coerce.number().min(0, "Price must be 0 or greater"),
        stock: z.coerce.number().optional(),
        sequence: z.coerce.number().optional(),
      }),
    )
    .optional(),
  end_date: z.date({
    required_error: "End date is required.",
  }),
  priority: z.enum(["low", "medium", "high", "critical"]),
  about_campaign: z.string().min(20, "About the campaign must be at least 20 characters long."),
  location: z.string().optional(),
  organizer: z.string().optional(),
  verified: z.boolean().optional(),
  urgency: z.enum(["low", "medium", "high", "urgent", "critical"]).optional(),
  faq_questions: z
    .array(
      z.object({
        question: z.string().min(1, "Question cannot be empty."),
        answer: z.string().min(1, "Answer cannot be empty."),
      }),
    )
    .optional(),
  total_donors_till_now: z.number().optional(),
  total_progress_percentage: z.number().optional(),
  videoLinks: z
    .array(z.object({ url: z.string().url("Must be a valid URL").min(1, "URL cannot be empty.") }))
    .optional(),
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

interface CampaignFormProps {
  campaign?: Campaign | null;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
}

export default function CampaignForm({ campaign, onSave, onCancel }: CampaignFormProps) {
  const [categories, setCategories] = useState<CampaignCategory[]>([]);
  const [independentProducts, setIndependentProducts] = useState<IndependentProduct[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [bannerImage, setBannerImage] = useState<LocalImage | null>(null);
  const [mobileBannerImage, setMobileBannerImage] = useState<LocalImage | null>(null);
  const [additionalImages, setAdditionalImages] = useState<LocalImage[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      code: "",
      title: "",
      category_id: 0,
      festival_type: "",
      overview: "",
      details: "",
      donation_goal: 0,
      end_date: (() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 3);
        return date;
      })(),
      image: "",
      mobile_banner_image: "",
      images_array: [],
      assignedProducts: [],
      priority: "medium",
      status: "Active",
      is_featured: false,
      about_campaign: "",
      location: "",
      organizer: "Dwaparyug Foundation",
      verified: false,
      urgency: "medium",
      faq_questions: [],
      videoLinks: [],
    },
  });

  const {
    fields: videoLinkFields,
    append: appendVideoLink,
    remove: removeVideoLink,
  } = useFieldArray({
    control,
    name: "videoLinks",
  });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: "faq_questions",
  });

  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({
    control,
    name: "assignedProducts",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          fetch('/api/campaign-categories'),
          fetch('/api/independent-products')
        ]);

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setIndependentProducts(productsData?.products);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingUnits(false);
        setIsLoadingProducts(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (campaign && !isLoadingCategories && !isLoadingProducts) {
      const formData = {
        ...campaign,
        category_id: Number(campaign.category_id) || 0,
        donation_goal: Number(campaign.donation_goal) || 0,
        beneficiaries: Number(campaign.beneficiaries) || 0,
        sequence: Number(campaign.sequence) || 0,
        end_date: campaign.end_date
          ? new Date(campaign.end_date)
          : (() => {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 3);
            return date;
          })(),
        priority: (campaign.priority as any) || "medium",
        status: (campaign.status as any) || "Active",
        is_featured: Boolean(campaign.is_featured),
        about_campaign: campaign.about_campaign || "",
        location: campaign.location || "",
        organizer: campaign.organizer || "Dwaparyug Foundation",
        verified: Boolean(campaign.verified),
        urgency: (campaign.urgency as any) || "medium",
        faq_questions: campaign.faq_questions || [],
        videoLinks: (campaign.videoLinks || []).map((url: string) => ({ url })),
        image: campaign.image || "",
        mobile_banner_image: campaign?.mobile_banner_image || "",
        images_array: campaign.images_array || [],
        assignedProducts: (campaign.assignedProducts || []).map((product: any) => ({
          id: product.id,
          indipendent_product_id: Number(product.indipendent_product_id) || Number(product.independent_product_id) || 0,
          description: product.description || "",
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
          sequence: Number(product.sequence) || 1,
        })),
      };

      reset(formData);

      if (campaign.image) {
        setBannerImage({
          url: campaign.image,
          isExisting: true
        });
      }

      if (campaign.mobile_banner_image) {
        setMobileBannerImage({
          url: campaign.mobile_banner_image,
          isExisting: true
        });
      }

      if (campaign.images_array && campaign.images_array.length > 0) {
        setAdditionalImages(
          campaign.images_array.map(url => ({
            url,
            isExisting: true
          }))
        );
      }
    }
  }, [campaign, reset, isLoadingCategories, isLoadingProducts]);

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      let bannerImageUrl = data.image;
      let mobileBannerImageUrl = data.mobile_banner_image;
      let allImageUrls: string[] = [];

      if (bannerImage) {
        if (bannerImage.file) {
          const uploadedUrls = await uploadImages([bannerImage.file]);
          bannerImageUrl = uploadedUrls[0];
        } else if (bannerImage.base64) {
          const uploadedUrls = await uploadImages([bannerImage.base64]);
          bannerImageUrl = uploadedUrls[0];
        } else if (bannerImage.isExisting) {
          bannerImageUrl = bannerImage.url;
        }
      }

      if (mobileBannerImage) {
        if (mobileBannerImage.file) {
          const uploadedUrls = await uploadImages([mobileBannerImage.file]);
          mobileBannerImageUrl = uploadedUrls[0];
        } else if (mobileBannerImage.base64) {
          const uploadedUrls = await uploadImages([mobileBannerImage.base64]);
          mobileBannerImageUrl = uploadedUrls[0];
        } else if (mobileBannerImage.isExisting) {
          mobileBannerImageUrl = mobileBannerImage.url;
        }
      }

      const imagesToUpload: (File | string)[] = [];
      const existingImageUrls: string[] = [];

      additionalImages.forEach(img => {
        if (img.file) {
          imagesToUpload.push(img.file);
        } else if (img.base64) {
          imagesToUpload.push(img.base64);
        } else if (img.isExisting) {
          existingImageUrls.push(img.url);
        }
      });

      if (imagesToUpload.length > 0) {
        const uploadedUrls = await uploadImages(imagesToUpload);
        allImageUrls = [...existingImageUrls, ...uploadedUrls];
      } else {
        allImageUrls = existingImageUrls;
      }

      const payload = {
        ...data,
        image: bannerImageUrl,
        mobile_banner_image: mobileBannerImageUrl,
        images_array: allImageUrls,
        end_date: data.end_date.toISOString(),
        videoLinks: data.videoLinks?.map(v => v.url) || [],
        category_id: Number(data.category_id),
        donation_goal: Number(data.donation_goal),
        beneficiaries: Number(data.beneficiaries),
        sequence: Number(data.sequence),
        is_featured: data.is_featured ? 1 : 0,
        assignedProducts: (data.assignedProducts || []).map(product => ({
          ...product,
          indipendent_product_id: Number(product.indipendent_product_id),
          price: Number(product.price),
          stock: Number(product.stock) || 0,
          sequence: Number(product.sequence) || 1,
        })),
        created_by: 1,
        updated_by: 1,
      };

      const url = campaign ? `/api/campaigns/${campaign.id}` : '/api/campaigns';
      const method = campaign ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save campaign');
      }

      const savedCampaign = await response.json();
      onSave(savedCampaign);
    } catch (error) {
      console.error("Error saving campaign:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save campaign'}`);
    }
  };

  const category_id = useWatch({ control, name: "category_id" });

  const handleBannerImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      const previewUrl = createPreviewUrl(file);

      setBannerImage({
        file,
        base64,
        url: previewUrl,
        isExisting: false
      });
      setValue("image", "temp_banner_image", { shouldValidate: true });
    } catch (error) {
      console.error('Error processing banner image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const handleMobileBannerImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      const previewUrl = createPreviewUrl(file);

      setMobileBannerImage({
        file,
        base64,
        url: previewUrl,
        isExisting: false
      });
      setValue("mobile_banner_image", "temp_mobile_banner_image", { shouldValidate: true });
    } catch (error) {
      console.error('Error processing mobile banner image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const handleMultipleImagesSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newImages: LocalImage[] = await Promise.all(
        Array.from(files).map(async (file) => {
          const base64 = await fileToBase64(file);
          const previewUrl = createPreviewUrl(file);

          return {
            file,
            base64,
            url: previewUrl,
            isExisting: false
          };
        })
      );

      setAdditionalImages(prev => [...prev, ...newImages]);
      setValue("images_array", [...(additionalImages.map(img => img.url)), ...(newImages.map(img => img.url))], { shouldValidate: true });
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Error processing some images. Please try again.');
    }
  };

  const removeBannerImage = () => {
    if (bannerImage?.url && !bannerImage.isExisting) {
      URL.revokeObjectURL(bannerImage.url);
    }
    setBannerImage(null);
    setValue("image", "");
  };

  const removeMobileBannerImage = () => {
    if (mobileBannerImage?.url && !mobileBannerImage.isExisting) {
      URL.revokeObjectURL(mobileBannerImage.url);
    }
    setMobileBannerImage(null);
    setValue("mobile_banner_image", "");
  };

  const removeAdditionalImage = (index: number) => {
    const imageToRemove = additionalImages[index];
    if (imageToRemove?.url && !imageToRemove.isExisting) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const updatedImages = additionalImages.filter((_, i) => i !== index);
    setAdditionalImages(updatedImages);
    setValue("images_array", updatedImages.map(img => img.url));
  };

  useEffect(() => {
    return () => {
      if (bannerImage?.url && !bannerImage.isExisting) {
        URL.revokeObjectURL(bannerImage.url);
      }

      if (mobileBannerImage?.url && !mobileBannerImage.isExisting) {
        URL.revokeObjectURL(mobileBannerImage.url);
      }

      additionalImages.forEach(img => {
        if (img.url && !img.isExisting) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  const selectedCategory = categories.find(cat => cat.id === category_id);

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <div className="grid gap-3">
          {campaign && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Total Raised (₹)</Label>
                <Input disabled value={campaign?.total_raised?.toLocaleString() || 0} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Beneficiaries</Label>
                <Input disabled value={campaign?.beneficiaries?.toLocaleString() || 0} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Donors</Label>
                <Input disabled value={campaign?.total_donors_till_now?.toLocaleString() || 0} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Progress</Label>
                <Input disabled value={`${campaign?.total_progress_percentage || 0}%`} className="h-8 text-sm" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-2">
            <div className="space-y-1">
              <Label htmlFor="code" className="text-sm">Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="e.g., C001"
                className="h-8"
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm">Title</Label>
              <Input id="title" {...register("title")} className="h-8" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label htmlFor="category_id" className="text-sm">Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value && field.value > 0 ? field.value.toString() : ""}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger id="category_id" className="h-8">
                      <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
            </div>

            {selectedCategory?.name === "Festival Celebration" && (
              <div className="space-y-1">
                <Label htmlFor="festival_type" className="text-sm">Festival Type</Label>
                <Controller
                  control={control}
                  name="festival_type"
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger id="festival_type" className="h-8">
                        <SelectValue placeholder="Select festival type" />
                      </SelectTrigger>
                      <SelectContent>
                        {festivalTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="status" className="text-sm">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="h-8">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="priority" className="text-sm">Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="priority" className="h-8">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="location" className="text-sm">Location</Label>
              <Input id="location" {...register("location")} placeholder="Campaign location" className="h-8" />
              {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="organizer" className="text-sm">Organizer</Label>
              <Input id="organizer" {...register("organizer")} placeholder="Campaign organizer name" className="h-8" />
              {errors.organizer && <p className="text-xs text-red-500">{errors.organizer.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="urgency" className="text-sm">Urgency Level</Label>
              <Controller
                control={control}
                name="urgency"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger id="urgency" className="h-8">
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.urgency && <p className="text-xs text-red-500">{errors.urgency.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="verified" className="text-sm">Verified Campaign</Label>
              <div className="flex items-center space-x-2 pt-1">
                <Controller
                  control={control}
                  name="verified"
                  render={({ field }) => (
                    <Checkbox
                      id="verified"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="verified" className="text-xs font-normal">
                  Mark this campaign as verified
                </Label>
              </div>
              {errors.verified && <p className="text-xs text-red-500">{errors.verified.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="is_featured" className="text-sm">Featured Campaign</Label>
              <div className="flex items-center space-x-2 pt-1">
                <Controller
                  control={control}
                  name="is_featured"
                  render={({ field }) => (
                    <Checkbox
                      id="is_featured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="is_featured" className="text-xs font-normal">
                  Mark this campaign as featured
                </Label>
              </div>
              {errors.is_featured && <p className="text-xs text-red-500">{errors.is_featured.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sequence" className="text-sm">Sequence</Label>
              <Input id="sequence" type="number" {...register("sequence")} className="h-8" />
              {errors.sequence && <p className="text-xs text-red-500">{errors.sequence.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="overview" className="text-sm">Overview Title</Label>
            <Input id="overview" {...register("overview")} placeholder="Short summary for cards" className="h-8" />
            {errors.overview && <p className="text-xs text-red-500">{errors.overview.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="details" className="text-sm">Detail Title</Label>
            <Textarea id="details" {...register("details")} placeholder="Detailed description for campaign page" rows={2} className="text-sm" />
            {errors.details && <p className="text-xs text-red-500">{errors.details.message}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor="donation_goal" className="text-sm">Donation Goal (₹)</Label>
              <Input id="donation_goal" type="number" {...register("donation_goal")} className="h-8" />
              {errors.donation_goal && <p className="text-xs text-red-500">{errors.donation_goal.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="beneficiaries" className="text-sm">Total Beneficiaries</Label>
              <Input id="beneficiaries" type="number" {...register("beneficiaries")} className="h-8" />
              {errors.beneficiaries && <p className="text-xs text-red-500">{errors.beneficiaries.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="end_date" className="text-sm">End Date</Label>
              <Controller
                control={control}
                name="end_date"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal h-8 text-sm">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="about_campaign" className="text-sm">About this Campaign</Label>
            <Controller
              name="about_campaign"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Tell us more about the campaign?..."
                />
              )}
            />
            {errors.about_campaign && <p className="text-xs text-red-500">{errors.about_campaign?.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Video Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendVideoLink({ url: "" })}
                className="h-6 px-2 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Video
              </Button>
            </div>
            {videoLinkFields.map((field, index) => (
              <div key={field.id} className="relative">
                <Input
                  {...register(`videoLinks.${index}.url`)}
                  placeholder="e.g., https://www.youtube.com/watch?v=..."
                  className="h-8 text-sm pr-8"
                />
                {errors.videoLinks?.[index]?.url && (
                  <p className="text-xs text-red-500 mt-1">{errors.videoLinks[index]?.url?.message}</p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-8 w-8 text-red-500"
                  onClick={() => removeVideoLink(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">FAQ Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendFaq({ question: "", answer: "" })}
                className="h-6 px-2 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Question
              </Button>
            </div>
            {faqFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border rounded-md relative">
                <div className="space-y-1">
                  <Label htmlFor={`faq_questions.${index}.question`} className="text-xs">Question</Label>
                  <Input
                    id={`faq_questions.${index}.question`}
                    {...register(`faq_questions.${index}.question`)}
                    className="h-8 text-sm"
                  />
                  {errors.faq_questions?.[index]?.question && (
                    <p className="text-xs text-red-500">{errors.faq_questions[index]?.question?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`faq_questions.${index}.answer`} className="text-xs">Answer</Label>
                  <div className="relative">
                    <Textarea
                      id={`faq_questions.${index}.answer`}
                      {...register(`faq_questions.${index}.answer`)}
                      rows={2}
                      className="text-sm pr-8"
                    />
                    {errors.faq_questions?.[index]?.answer && (
                      <p className="text-xs text-red-500">{errors.faq_questions[index]?.answer?.message}</p>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-6 w-6 text-red-500"
                      onClick={() => removeFaq(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner Image Upload Section */}
          <div className="space-y-1">
            <Label htmlFor="bannerImage" className="text-sm">Banner Image (Mandatory)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="bannerImage"
                type="file"
                onChange={handleBannerImageSelection}
                accept="image/*"
                className="h-8 text-sm"
              />
              <span className="text-xs text-gray-500">Upload on save</span>
            </div>
            {bannerImage && (
              <div className="relative w-32 h-20 mt-1">
                <Image
                  src={bannerImage.url}
                  alt="Banner Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full"
                  onClick={removeBannerImage}
                >
                  <X className="h-2 w-2" />
                </Button>
                {!bannerImage.isExisting && (
                  <div className="absolute bottom-0 left-0 px-1 py-0.5 bg-blue-500 text-white text-xs rounded">
                    New
                  </div>
                )}
              </div>
            )}
            {errors.image && <p className="text-xs text-red-500">{errors.image.message}</p>}
          </div>

          {/* Mobile Banner Image Upload Section */}
          <div className="space-y-1">
            <Label htmlFor="mobileBannerImage" className="text-sm">Mobile Banner Image (Mandatory)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="mobileBannerImage"
                type="file"
                onChange={handleMobileBannerImageSelection}
                accept="image/*"
                className="h-8 text-sm"
              />
              <span className="text-xs text-gray-500">Upload on save</span>
            </div>
            {mobileBannerImage && (
              <div className="relative w-32 h-20 mt-1">
                <Image
                  src={mobileBannerImage.url}
                  alt="Mobile Banner Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full"
                  onClick={removeMobileBannerImage}
                >
                  <X className="h-2 w-2" />
                </Button>
                {!mobileBannerImage.isExisting && (
                  <div className="absolute bottom-0 left-0 px-1 py-0.5 bg-blue-500 text-white text-xs rounded">
                    New
                  </div>
                )}
              </div>
            )}
            {errors.mobile_banner_image && <p className="text-xs text-red-500">{errors.mobile_banner_image.message}</p>}
          </div>

          {/* Multiple Images Upload Section */}
          <div className="space-y-1">
            <Label htmlFor="additionalImages" className="text-sm">Additional Images</Label>
            <div className="flex items-center gap-2">
              <Input
                id="additionalImages"
                type="file"
                multiple
                onChange={handleMultipleImagesSelection}
                accept="image/*"
                className="h-8 text-sm"
              />
              <span className="text-xs text-gray-500">Upload on save</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {additionalImages.map((image, index) => (
                <div key={index} className="relative w-20 h-14">
                  <Image
                    src={image.url}
                    alt={`Additional ${index}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full"
                    onClick={() => removeAdditionalImage(index)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                  {!image.isExisting && (
                    <div className="absolute bottom-0 left-0 px-1 py-0.5 bg-blue-500 text-white text-xs rounded">
                      New
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.images_array && <p className="text-xs text-red-500">{errors.images_array.message as string}</p>}
          </div>

          {/* Campaign Products Section - Table Format */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Campaign Products</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendProduct({
                  indipendent_product_id: 0,
                  description: "",
                  price: 0,
                  stock: 0,
                  sequence: productFields.length + 1
                })}
                className="h-6 px-2 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Product
              </Button>
            </div>
            {productFields.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left font-medium">Product</th>
                        <th className="px-2 py-1 text-left font-medium">Description</th>
                        <th className="px-2 py-1 text-left font-medium">Price (₹)</th>
                        <th className="px-2 py-1 text-left font-medium">Stock</th>
                        <th className="px-2 py-1 text-left font-medium">Sequence</th>
                        <th className="px-2 py-1 text-center font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productFields.map((field, index) => (
                        <tr key={field.id} className="border-t">
                          <td className="px-2 py-1">
                            <Controller
                              control={control}
                              name={`assignedProducts.${index}.indipendent_product_id`}
                              render={({ field: productField }) => (
                                <Select
                                  value={productField.value && productField.value > 0 ? productField.value.toString() : ""}
                                  onValueChange={(value) => productField.onChange(parseInt(value, 10))}
                                  disabled={isLoadingProducts}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select product"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {independentProducts.map((product) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {errors.assignedProducts?.[index]?.indipendent_product_id && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.assignedProducts[index]?.indipendent_product_id?.message}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <Textarea
                              {...register(`assignedProducts.${index}.description`)}
                              placeholder="Product description"
                              rows={1}
                              className="h-7 text-xs resize-none"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`assignedProducts.${index}.price`)}
                              placeholder="0"
                              className="h-7 text-xs w-20"
                            />
                            {errors.assignedProducts?.[index]?.price && (
                              <p className="text-xs text-red-500 mt-1">
                                {errors.assignedProducts[index]?.price?.message}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              {...register(`assignedProducts.${index}.stock`)}
                              placeholder="0"
                              className="h-7 text-xs w-20"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              {...register(`assignedProducts.${index}.sequence`)}
                              placeholder="1"
                              className="h-7 text-xs w-16"
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => removeProduct(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-8 px-3 text-sm">
            Cancel
          </Button>
          <Button type="submit" className="h-8 px-3 text-sm">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                {campaign ? "Updating..." : "Creating..."}
              </>
            ) : (
              campaign ? "Update Campaign" : "Create Campaign"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}