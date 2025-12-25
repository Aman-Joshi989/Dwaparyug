// File: app/admin/causes/create/page.tsx

"use client"

import { useRouter } from "next/navigation"
import type { Campaign } from "@/lib/interface"
import CampaignForm from "../_componante/CampaignForm"

export default function CreateCampaignPage() {
  const router = useRouter()

  const handleSave = (newCampaign: Campaign) => {
    console.log("Saving new campaign:", newCampaign)
    // Add your API call here to save the new campaign
    // After a successful save, redirect to the campaigns list
    router.push("/admin/campaigns")
  }

  const handleCancel = () => {
    router.push("/admin/campaigns")
  }

  return (
    <div className=" ">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      <CampaignForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  )
}