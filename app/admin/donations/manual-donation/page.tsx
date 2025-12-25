'use client';

import React, { useState, ChangeEvent, useEffect } from 'react';
import { Plus, Trash2, Upload, AlertCircle, CheckCircle2, Loader2, Search, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Donation {
  mobileNumber: string;
  amount: string;
  message: string;
}

interface DonationPayload {
  mobileNumber: string;
  amount: number;
  message?: string;
}

interface DonationResult {
  success: boolean;
  index: number;
  donationId?: number;
  paymentRequestId?: number;
  userId?: number;
  campaignId?: number;
  amount?: number;
  mobileNumber?: string;
}

interface DonationError {
  success: boolean;
  index: number;
  mobileNumber: string;
  error: string;
}

interface ApiResponse {
  success: boolean;
  totalProcessed: number;
  totalFailed: number;
  totalAmount: number;
  results: DonationResult[];
  errors?: DonationError[];
  error?: string;
}

interface ResponseState {
  data: ApiResponse;
  status: number;
}

interface Campaign {
  id: number;
  code: string;
  title: string;
  status: string;
}

export default function ManualDonationPage() {
  const [campaignCode, setCampaignCode] = useState<string>('');
  const [campaignSearch, setCampaignSearch] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(false);
  
  const [donations, setDonations] = useState<Donation[]>([
    { mobileNumber: '', amount: '', message: '' }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ResponseState | null>(null);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Filter campaigns based on search
  useEffect(() => {
    if (campaignSearch.trim() === '') {
      setFilteredCampaigns(campaigns);
    } else {
      const filtered = campaigns.filter(
        (campaign) =>
          campaign.code.toLowerCase().includes(campaignSearch.toLowerCase()) ||
          campaign.title.toLowerCase().includes(campaignSearch.toLowerCase())
      );
      setFilteredCampaigns(filtered);
    }
  }, [campaignSearch, campaigns]);

  const fetchCampaigns = async (): Promise<void> => {
    setLoadingCampaigns(true);
    try {
      const response = await fetch('/api/campaigns/search?status=Active&pageSize=100');
      const data = await response.json();
      if (response.ok && data.campaigns) {
        setCampaigns(data.campaigns);
        setFilteredCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const selectCampaign = (campaign: Campaign): void => {
    setCampaignCode(campaign.code);
    setCampaignSearch(`${campaign.code} - ${campaign.title}`);
    setShowDropdown(false);
  };

  const addDonation = (): void => {
    setDonations([...donations, { mobileNumber: '', amount: '', message: '' }]);
  };

  const removeDonation = (index: number): void => {
    if (donations.length > 1) {
      setDonations(donations.filter((_, i) => i !== index));
    }
  };

  const updateDonation = (index: number, field: keyof Donation, value: string): void => {
    const updated = [...donations];
    
    if (field === 'mobileNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      updated[index][field] = digitsOnly.slice(0, 14);
    } else if (field === 'message') {
      updated[index][field] = value.slice(0, 100);
    } else if (field === 'amount') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        updated[index][field] = value;
      }
    } else {
      //@ts-ignore
      updated[index][field] = value;
    }
    
    setDonations(updated);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!campaignCode.trim()) {
      alert('Please select a campaign');
      return;
    }

    const invalidDonations = donations.filter(d => 
      !d.mobileNumber || 
      !d.amount || 
      d.mobileNumber.length < 10 ||
      parseFloat(d.amount) <= 0
    );

    if (invalidDonations.length > 0) {
      alert('Please ensure all donations have valid mobile numbers (10-14 digits) and amounts greater than 0');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const payload: { campaignCode: string; donations: DonationPayload[] } = {
        campaignCode,
        donations: donations.map((d) => ({
          mobileNumber: d.mobileNumber,
          amount: parseFloat(d.amount),
          message: d.message || undefined
        }))
      };

      const res = await fetch('/api/donations/manual-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data: ApiResponse = await res.json();
      setResponse({ data, status: res.status });

      if (res.ok && data.success) {
        setDonations([{ mobileNumber: '', amount: '', message: '' }]);
      }
    } catch (error) {
      setResponse({
        data: {
          success: false,
          totalProcessed: 0,
          totalFailed: 0,
          totalAmount: 0,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        status: 500
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>): void => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        
        const startIndex = lines[0].toLowerCase().includes('mobile') ? 1 : 0;
        
        const parsed: Donation[] = lines.slice(startIndex).map((line) => {
          const [mobile, amount, message] = line.split(',').map((s) => s.trim());
          return {
            mobileNumber: mobile || '',
            amount: amount || '',
            message: message || ''
          };
        }).filter((d) => d.mobileNumber && d.amount);

        if (parsed.length > 0) {
          setDonations(parsed);
        }
      } catch (error) {
        alert('Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Manual Donation Manager</h1>
        <p className="text-sm text-gray-600">Process single or bulk donations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Campaign Settings</CardTitle>
                  <CardDescription className="text-xs">Select campaign and import CSV</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('csvImport')?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import CSV
                </Button>
                <Input
                  id="csvImport"
                  type="file"
                  accept=".csv"
                  onChange={handleBulkImport}
                  className="hidden"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {/* Campaign Search Combobox */}
              <div className="relative">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Campaign <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                  <Input
                    value={campaignSearch}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setCampaignSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by code or title..."
                    className="h-8 pl-8 pr-8"
                  />
                  <ChevronDown className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
                </div>
                
                {/* Dropdown */}
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {loadingCampaigns ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                          Loading campaigns...
                        </div>
                      ) : filteredCampaigns.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">
                          No campaigns found
                        </div>
                      ) : (
                        filteredCampaigns.map((campaign) => (
                          <button
                            key={campaign.id}
                            type="button"
                            onClick={() => selectCampaign(campaign)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm text-gray-900">
                              {campaign.code}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {campaign.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Status: <span className={campaign.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                                {campaign.status}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

             
              <p className="text-xs text-gray-500 mt-2">
                CSV format: mobileNumber,amount,message | 
                <button 
                  onClick={() => {
                    const csv = 'mobileNumber,amount,message\n9876543210,500,Thank you for your support\n9123456789,1000,Keep up the great work\n9988776655,250,';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'sample_donations.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="text-indigo-600 hover:underline ml-1"
                >
                  Download Sample
                </button>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base">Donations ({donations.length})</CardTitle>
                  <CardDescription className="text-xs">Add donation details</CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addDonation}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {donations.map((donation, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded border"
                  >
                    <div className="col-span-4">
                      <Input
                        value={donation.mobileNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => 
                          updateDonation(index, 'mobileNumber', e.target.value)
                        }
                        placeholder="Mobile (10-14 digits)"
                        className={`h-8 text-sm ${donation.mobileNumber && (donation.mobileNumber.length < 10 || donation.mobileNumber.length > 14) ? 'border-red-500' : ''}`}
                        maxLength={14}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="text"
                        value={donation.amount}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => 
                          updateDonation(index, 'amount', e.target.value)
                        }
                        placeholder="Amount"
                        className={`h-8 text-sm ${donation.amount && parseFloat(donation.amount) <= 0 ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        value={donation.message}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => 
                          updateDonation(index, 'message', e.target.value)
                        }
                        placeholder="Message (max 100 chars)"
                        className="h-8 text-sm"
                        maxLength={100}
                      />
                      {donation.message && (
                        <span className="text-xs text-gray-400">{donation.message.length}/100</span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDonation(index)}
                        disabled={donations.length === 1}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !campaignCode}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Donations'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {response && (
            <Card className="shadow-sm sticky top-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {response.data.success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Success
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Partial
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {response.data.error ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{response.data.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-xs text-green-600 font-medium">Processed</div>
                        <div className="text-xl font-bold text-green-700">
                          {response.data.totalProcessed}
                        </div>
                      </div>
                      {response.data.totalFailed > 0 && (
                        <div className="bg-red-50 p-2 rounded">
                          <div className="text-xs text-red-600 font-medium">Failed</div>
                          <div className="text-xl font-bold text-red-700">
                            {response.data.totalFailed}
                          </div>
                        </div>
                      )}
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-xs text-blue-600 font-medium">Total Amount</div>
                        <div className="text-xl font-bold text-blue-700">
                          ₹{response.data.totalAmount?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {response.data.errors && response.data.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 text-xs mb-1">Errors:</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {response.data.errors.map((error, idx) => (
                            <Alert key={idx} variant="destructive" className="py-1">
                              <AlertDescription className="text-xs">
                                <span className="font-medium">#{error.index + 1}</span>
                                {error.mobileNumber && ` (${error.mobileNumber})`}: {error.error}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}

                    {response.data.results && response.data.results.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 text-xs mb-1">Success:</h4>
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                <th className="p-1 text-left">Mobile</th>
                                <th className="p-1 text-left">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {response.data.results.map((result, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="p-1">{result.mobileNumber}</td>
                                  <td className="p-1">₹{result.amount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}