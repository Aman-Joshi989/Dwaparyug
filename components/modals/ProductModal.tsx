"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from "@/app/admin/products/_components/ProductForm";

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string | null;
  mode: 'create' | 'edit' | 'view';
  onSuccess?: (product: any) => void;
}

export default function ProductModal({
  open,
  onOpenChange,
  productId,
  mode,
  onSuccess,
}: ProductModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSuccess = (product: any) => {
    onSuccess?.(product);
    handleClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create New Product';
      case 'edit':
        return 'Edit Product';
      case 'view':
        return 'View Product Details';
      default:
        return 'Product';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-hidden p-0 flex flex-col max-w-3xl">
        {/* Sticky Header */}
        <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
          <DialogTitle className="text-lg font-semibold">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto ">
          <ProductForm
            productId={productId}
            mode={mode}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
