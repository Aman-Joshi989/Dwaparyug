"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Campaign } from "@/lib/interface";
import CampaignForm from "../../_componante/CampaignForm";

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchCampaign(id);
  }, [id]);

  const fetchCampaign = async (campaignId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const numericId = parseInt(campaignId, 10);
      if (isNaN(numericId)) throw new Error("Invalid campaign ID");

      const response = await fetch(`/api/campaigns/${numericId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Campaign not found");
        throw new Error("Failed to fetch campaign");
      }

      const campaignData = await response.json();
      setCampaign({
        ...campaignData,
        id: Number(campaignData.id),
        total_raised: Number(campaignData.total_raised),
        donation_goal: Number(campaignData.donation_goal),
        category_id: Number(campaignData.category_id),
        total_progress_percentage: Number(campaignData.total_progress_percentage),
      });
    } catch (error) {
      console.error("Error fetching campaign:", error);
      setError(error instanceof Error ? error.message : "Failed to load campaign");

      // Redirect if campaign not found
      if (error instanceof Error && error.message === "Campaign not found") {
        setTimeout(() => router.push("/admin/campaigns"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (updatedCampaign: Campaign) => {
    console.log("Saving updated campaign:", updatedCampaign);
    // TODO: Add API call to update campaign
    router.push("/admin/campaigns");
  };

  const handleCancel = () => {
    router.push("/admin/campaigns");
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading campaign details...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        {error !== "Campaign not found" && (
          <button
            onClick={() => id && fetchCampaign(id)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        )}
        {error === "Campaign not found" && (
          <div className="text-gray-500">Redirecting to campaigns list...</div>
        )}
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center text-red-500">
        Campaign not found. Redirecting...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Campaign</h1>
      <CampaignForm
        campaign={campaign}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
