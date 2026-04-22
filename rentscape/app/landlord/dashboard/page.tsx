import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Topbar } from "@/components/dashboard/Topbar";
import { MonthlyRevenueChart, PropertyTypesChart } from "@/components/charts/Charts";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/get-session";

interface Analytics {
  totalProperties: number;
  activeLeases: number;
  totalTenants: number;
  averageRating: number;
  totalRevenue: number;
  pendingPayments: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  propertyTypes: Array<{ type: string; count: number }>;
}

async function getAnalytics(userId: string): Promise<Analytics> {
  const propertiesResult = await pool.query(
    'SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1',
    [userId]
  );
  const totalProperties = parseInt(propertiesResult.rows[0].count, 10);

  const leasesResult = await pool.query(
    `SELECT COUNT(DISTINCT l.tenant_id) as tenants, COUNT(*) as leases
     FROM leases l
     JOIN units u ON l.unit_id = u.id
     JOIN properties p ON u.property_id = p.id
     WHERE p.landlord_id = $1 AND l.status = 'active'`,
    [userId]
  );
  const activeLeases = parseInt(leasesResult.rows[0].leases, 10);
  const totalTenants = parseInt(leasesResult.rows[0].tenants, 10);

  const ratingResult = await pool.query(
    `SELECT AVG(r.score) as avg_rating
     FROM ratings r
     JOIN leases l ON r.lease_id = l.id
     JOIN units u ON l.unit_id = u.id
     JOIN properties p ON u.property_id = p.id
     WHERE p.landlord_id = $1 AND r.target_type = 'landlord'`,
    [userId]
  );
  const averageRating = parseFloat(ratingResult.rows[0].avg_rating || 0);

  const revenueResult = await pool.query(
    `SELECT SUM(p.amount) as total
     FROM payments p
     JOIN leases l ON p.lease_id = l.id
     JOIN units u ON l.unit_id = u.id
     JOIN properties prop ON u.property_id = prop.id
     WHERE prop.landlord_id = $1 AND p.status = 'paid'`,
    [userId]
  );
  const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);

  const pendingResult = await pool.query(
    `SELECT SUM(p.amount) as total
     FROM payments p
     JOIN leases l ON p.lease_id = l.id
     JOIN units u ON l.unit_id = u.id
     JOIN properties prop ON u.property_id = prop.id
     WHERE prop.landlord_id = $1 AND p.status = 'pending'`,
    [userId]
  );
  const pendingPayments = parseFloat(pendingResult.rows[0].total || 0);

  const monthlyRevenueResult = await pool.query(
    `SELECT TO_CHAR(p.paid_date, 'Mon YYYY') as month, SUM(p.amount) as revenue
     FROM payments p
     JOIN leases l ON p.lease_id = l.id
     JOIN units u ON l.unit_id = u.id
     JOIN properties prop ON u.property_id = prop.id
     WHERE prop.landlord_id = $1 AND p.status = 'paid' AND p.paid_date >= NOW() - INTERVAL '6 months'
     GROUP BY TO_CHAR(p.paid_date, 'Mon YYYY')
     ORDER BY MIN(p.paid_date)`,
    [userId]
  );
  const monthlyRevenue = monthlyRevenueResult.rows.map((row: any) => ({
    month: row.month,
    revenue: parseFloat(row.revenue)
  }));

  const propertyTypesResult = await pool.query(
    'SELECT property_type, COUNT(*) as count FROM properties WHERE landlord_id = $1 GROUP BY property_type',
    [userId]
  );
  const propertyTypes = propertyTypesResult.rows.map((row: any) => ({
    type: row.property_type,
    count: parseInt(row.count, 10)
  }));

  return {
    totalProperties,
    activeLeases,
    totalTenants,
    averageRating,
    totalRevenue,
    pendingPayments,
    monthlyRevenue,
    propertyTypes,
  };
}

export default async function LandlordDashboard() {
  const user = await getSession();
  if (!user) {
    return <div className="p-8">Please log in</div>;
  }

  const analytics = await getAnalytics(user.id);

  return (
    <DashboardShell role="landlord">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Topbar title="Landlord overview" subtitle="Portfolio status and payments at a glance" />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card title="Total Properties" description={`${analytics.totalProperties}`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-blue-600">{analytics.totalProperties}</p>
                <p className="text-sm text-blue-500">properties</p>
              </div>
            </Card>
            <Card title="Active Leases" description={`${analytics.activeLeases} leases`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-indigo-600">{analytics.activeLeases}</p>
                <p className="text-sm text-indigo-500">active</p>
              </div>
            </Card>
            <Card title="Total Tenants" description={`${analytics.totalTenants} tenants`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-cyan-600">{analytics.totalTenants}</p>
                <p className="text-sm text-cyan-500">tenants</p>
              </div>
            </Card>
            <Card title="Average Rating" description={`${analytics.averageRating.toFixed(1)} / 5`}>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-bold text-blue-600">{analytics.averageRating.toFixed(1)}</p>
                <div className="flex gap-0.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.round(analytics.averageRating) ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Revenue Overview">
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <p className="text-sm font-medium text-blue-100">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border border-amber-200/50">
                  <p className="text-sm font-medium text-amber-900">Pending Payments</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">${analytics.pendingPayments.toFixed(2)}</p>
                </div>
              </div>
            </Card>
            <Card title="Property Types Distribution">
              <PropertyTypesChart data={analytics.propertyTypes} />
            </Card>
          </div>

          <Card title="Monthly Revenue Trend">
            <MonthlyRevenueChart data={analytics.monthlyRevenue} />
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
