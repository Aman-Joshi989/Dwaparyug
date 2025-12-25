import { NextRequest, NextResponse } from 'next/server'
import { SelectQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get date range for comparison (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 1. Total Donations Stats
    const donationsStatsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN d.created_at >= $1 THEN d.donation_amount ELSE 0 END), 0) as current_total,
        COALESCE(SUM(CASE WHEN d.created_at >= $2 AND d.created_at < $1 THEN d.donation_amount ELSE 0 END), 0) as previous_total,
        COALESCE(SUM(d.donation_amount), 0) as all_time_total
      FROM donations d
      INNER JOIN donation_payment_requests dpr ON d.donation_payment_request_id = dpr.id
      WHERE dpr.status = 'paid'
    `;
    const donationsStats = await SelectQuery(donationsStatsQuery, [thirtyDaysAgo.toISOString(), sixtyDaysAgo.toISOString()]);
    
    const currentDonations = parseFloat(donationsStats[0]?.current_total || '0');
    const previousDonations = parseFloat(donationsStats[0]?.previous_total || '0');
    const donationsChange = previousDonations > 0 
      ? (((currentDonations - previousDonations) / previousDonations) * 100).toFixed(1)
      : currentDonations > 0 ? '100.0' : '0.0';

    // 2. Active Campaigns Stats
    const campaignsStatsQuery = `
      SELECT 
        COUNT(CASE WHEN c.status = 'Active' AND c.created_at >= $1 THEN 1 END) as current_active,
        COUNT(CASE WHEN c.status = 'Active' AND c.created_at >= $2 AND c.created_at < $1 THEN 1 END) as previous_active,
        COUNT(CASE WHEN c.status = 'Active' THEN 1 END) as total_active
      FROM campaigns c
    `;
    const campaignsStats = await SelectQuery(campaignsStatsQuery, [thirtyDaysAgo.toISOString(), sixtyDaysAgo.toISOString()]);
    
    const currentCampaigns = parseInt(campaignsStats[0]?.current_active || '0');
    const previousCampaigns = parseInt(campaignsStats[0]?.previous_active || '0');
    const totalActiveCampaigns = parseInt(campaignsStats[0]?.total_active || '0');
    const campaignsChange = previousCampaigns > 0 
      ? (((currentCampaigns - previousCampaigns) / previousCampaigns) * 100).toFixed(1)
      : currentCampaigns > 0 ? '100.0' : '0.0';

    // 3. New Users Stats
    const usersStatsQuery = `
      SELECT 
        COUNT(CASE WHEN u.created_at >= $1 THEN 1 END) as current_users,
        COUNT(CASE WHEN u.created_at >= $2 AND u.created_at < $1 THEN 1 END) as previous_users
      FROM users u
    `;
    const usersStats = await SelectQuery(usersStatsQuery, [thirtyDaysAgo.toISOString(), sixtyDaysAgo.toISOString()]);
    
    const currentUsers = parseInt(usersStats[0]?.current_users || '0');
    const previousUsers = parseInt(usersStats[0]?.previous_users || '0');
    const usersChange = previousUsers > 0 
      ? (((currentUsers - previousUsers) / previousUsers) * 100).toFixed(1)
      : currentUsers > 0 ? '100.0' : '0.0';

    // 4. Products in Stock Stats
    const productsStatsQuery = `
      SELECT 
        COALESCE(SUM(cp.stock), 0) as total_stock,
        COUNT(CASE WHEN ip.created_at >= $1 THEN 1 END) as current_products,
        COUNT(CASE WHEN ip.created_at >= $2 AND ip.created_at < $1 THEN 1 END) as previous_products
      FROM indipendent_products ip
      LEFT JOIN campaign_products cp ON ip.id = cp.indipendent_product_id
      WHERE ip.status = 'Active'
    `;
    const productsStats = await SelectQuery(productsStatsQuery, [thirtyDaysAgo.toISOString(), sixtyDaysAgo.toISOString()]);
    
    const totalStock = parseInt(productsStats[0]?.total_stock || '0');
    const currentProducts = parseInt(productsStats[0]?.current_products || '0');
    const previousProducts = parseInt(productsStats[0]?.previous_products || '0');
    const productsChange = previousProducts > 0 
      ? (((currentProducts - previousProducts) / previousProducts) * 100).toFixed(1)
      : currentProducts > 0 ? '100.0' : '0.0';

    // 5. Recent Campaigns with Donation Progress
    const recentCampaignsQuery = `
      SELECT 
        c.id,
        c.title,
        cc.name as category,
        c.donation_goal,
        c.status,
        c.total_raised,
        CASE 
          WHEN c.donation_goal > 0 THEN (c.total_raised / c.donation_goal * 100)
          ELSE 0 
        END as progress_percentage
      FROM campaigns c
      LEFT JOIN campaign_categories cc ON c.category_id = cc.id
      WHERE c.status IN ('Active', 'Completed')
      ORDER BY c.created_at DESC
      LIMIT 5
    `;
    const recentCampaigns = await SelectQuery(recentCampaignsQuery, []);

    // 6. Recent Donations
    const recentDonationsQuery = `
      SELECT 
        d.id,
        COALESCE(u.full_name, 'Anonymous') as donor_name,
        c.title as campaign_name,
        d.donation_amount as amount,
        d.created_at,
        dpr.status
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN campaigns c ON d.campaign_id = c.id
      LEFT JOIN donation_payment_requests dpr ON d.donation_payment_request_id = dpr.id
      WHERE dpr.status = 'paid'
      ORDER BY d.created_at DESC
      LIMIT 5
    `;
    const recentDonations = await SelectQuery(recentDonationsQuery, []);

    // 7. Recent Activities
    const recentActivitiesQuery = `
      SELECT * FROM (
        SELECT 
          c.id,
          'campaign_created' as activity_type,
          COALESCE(u.full_name, 'Admin') as user_name,
          c.title as entity_name,
          c.created_at,
          'created new campaign' as action_text
        FROM campaigns c
        LEFT JOIN users u ON c.created_by = u.id
        ORDER BY c.created_at DESC
        LIMIT 3
      ) AS campaigns_activity
      
      UNION ALL
      
      SELECT * FROM (
        SELECT 
          d.id,
          'donation_made' as activity_type,
          COALESCE(u.full_name, 'Anonymous') as user_name,
          c.title as entity_name,
          d.created_at,
          'made a donation to' as action_text
        FROM donations d
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN campaigns c ON d.campaign_id = c.id
        INNER JOIN donation_payment_requests dpr ON d.donation_payment_request_id = dpr.id
        WHERE dpr.status = 'paid'
        ORDER BY d.created_at DESC
        LIMIT 3
      ) AS donations_activity
      
      UNION ALL
      
      SELECT * FROM (
        SELECT 
          ip.id,
          'product_updated' as activity_type,
          COALESCE(u.full_name, 'Admin') as user_name,
          ip.name as entity_name,
          ip.updated_at as created_at,
          'updated product' as action_text
        FROM indipendent_products ip
        LEFT JOIN users u ON ip.updated_by = u.id
        WHERE ip.updated_at > ip.created_at
        ORDER BY ip.updated_at DESC
        LIMIT 3
      ) AS products_activity
      
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const recentActivities = await SelectQuery(recentActivitiesQuery, []);

    // Format the response
    const stats = [
      {
        title: "Total Donations",
        value: `₹${currentDonations.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${parseFloat(donationsChange) >= 0 ? '+' : ''}${donationsChange}%`,
        changeType: parseFloat(donationsChange) >= 0 ? "increase" : "decrease",
        icon: "Heart",
        color: "text-red-500",
        bgColor: "bg-red-100",
        link: "/admin/donations",
      },
      {
        title: "Active Campaigns",
        value: totalActiveCampaigns.toString(),
        change: `${parseFloat(campaignsChange) >= 0 ? '+' : ''}${campaignsChange}%`,
        changeType: parseFloat(campaignsChange) >= 0 ? "increase" : "decrease",
        icon: "Package",
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        link: "/admin/campaigns",
      },
      {
        title: "New Users",
        value: currentUsers.toString(),
        change: `${parseFloat(usersChange) >= 0 ? '+' : ''}${usersChange}%`,
        changeType: parseFloat(usersChange) >= 0 ? "increase" : "decrease",
        icon: "Users",
        color: "text-green-500",
        bgColor: "bg-green-100",
        link: "/admin/users",
      },
      {
        title: "Products in Stock",
        value: totalStock.toLocaleString('en-IN'),
        change: `${parseFloat(productsChange) >= 0 ? '+' : ''}${productsChange}%`,
        changeType: parseFloat(productsChange) >= 0 ? "increase" : "decrease",
        icon: "Package",
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        link: "/admin/products",
      },
    ];

    const formattedCampaigns = recentCampaigns.map((campaign: any) => ({
      id: campaign.id,
      title: campaign.title,
      category: campaign.category || 'Uncategorized',
      raised: `₹${parseFloat(campaign.total_raised || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      goal: `₹${parseFloat(campaign.donation_goal || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      progress: Math.min(Math.round(parseFloat(campaign.progress_percentage || '0')), 100),
      status: campaign.status === 'Active' ? 'Active' : 'Completed',
      link: `/admin/campaigns/update/${campaign.id}`,
    }));

    const formattedDonations = recentDonations.map((donation: any) => {
      const date = new Date(donation.created_at);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      return {
        id: donation.id,
        donor: donation.donor_name || 'Anonymous',
        campaign: donation.campaign_name || 'Unknown Campaign',
        amount: `₹${parseFloat(donation.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        date: formattedDate,
        status: donation.status === 'paid' ? 'Completed' : 'Pending',
      };
    });

    const formattedActivities = recentActivities.map((activity: any, index: number) => {
      const now = new Date();
      const activityDate = new Date(activity.created_at);
      const diffMs = now.getTime() - activityDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = '';
      if (diffMins < 1) {
        timeAgo = 'just now';
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        timeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }

      const iconMap: any = {
        campaign_created: 'Plus',
        donation_made: 'Heart',
        product_updated: 'Edit',
      };

      const colorMap: any = {
        campaign_created: 'text-green-500',
        donation_made: 'text-red-500',
        product_updated: 'text-blue-500',
      };

      return {
        id: activity.id || index,
        user: activity.user_name || 'Unknown User',
        action: `${activity.action_text} '${activity.entity_name}'`,
        time: timeAgo,
        icon: iconMap[activity.activity_type] || 'Plus',
        color: colorMap[activity.activity_type] || 'text-gray-500',
      };
    });

    return NextResponse.json({
      stats,
      recentCampaigns: formattedCampaigns,
      recentDonations: formattedDonations,
      recentActivities: formattedActivities,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}