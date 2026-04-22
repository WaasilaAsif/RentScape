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
  // Total properties
  const propertiesResult = await pool.query(
    'SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1',
    [userId]
  );
  const totalProperties = parseInt(propertiesResult.rows[0].count);

  // Active leases
  const leasesResult = await pool.query(
    `SELECT COUNT(DISTINCT l.tenant_id) as tenants, COUNT(*) as leases
     FROM leases l
     JOIN units u ON l.unit_id = u.id
     JOIN properties p ON u.property_id = p.id
     WHERE p.landlord_id = $1 AND l.status = 'active'`,
    [userId]
  );
  const activeLeases = parseInt(leasesResult.rows[0].leases);
  const totalTenants = parseInt(leasesResult.rows[0].tenants);

  // Average rating
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

  // Revenue
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

  // Pending payments
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

  // Monthly revenue (last 6 months)
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
  const monthlyRevenue = monthlyRevenueResult.rows.map(row => ({
    month: row.month,
    revenue: parseFloat(row.revenue)
  }));

  // Property types
  const propertyTypesResult = await pool.query(
    'SELECT property_type, COUNT(*) as count FROM properties WHERE landlord_id = $1 GROUP BY property_type',
    [userId]
  );
  const propertyTypes = propertyTypesResult.rows.map(row => ({
    type: row.property_type,
    count: parseInt(row.count)
  }));

  return {
    totalProperties,
    activeLeases,
    totalTenants,
    averageRating,
    totalRevenue,
    pendingPayments,
    monthlyRevenue,
    propertyTypes
  };
}

export default async function LandlordDashboardPage() {
  const user = await getSession();
  if (!user) {
    return <div>Please log in</div>;
  }

  const analytics = await getAnalytics(user.id);

  return (
    <DashboardShell role="landlord">
      <Topbar title="Landlord overview" subtitle="Portfolio status and payments at a glance" />

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Properties" description={`${analytics.totalProperties}`}>
          <p className="text-2xl font-bold">{analytics.totalProperties}</p>
        </Card>
        <Card title="Active Leases" description={`${analytics.activeLeases} leases`}>
          <p className="text-2xl font-bold">{analytics.activeLeases}</p>
        </Card>
        <Card title="Total Tenants" description={`${analytics.totalTenants} tenants`}>
          <p className="text-2xl font-bold">{analytics.totalTenants}</p>
        </Card>
        <Card title="Average Rating" description={`${analytics.averageRating.toFixed(1)} / 5`}>
          <p className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Revenue Overview">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Payments</p>
              <p className="text-2xl font-bold">${analytics.pendingPayments.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card title="Property Types">
          <PropertyTypesChart data={analytics.propertyTypes} />
        </Card>
      </div>

      <div className="mt-8">
        <Card title="Monthly Revenue">
          <MonthlyRevenueChart data={analytics.monthlyRevenue} />
        </Card>
      </div>
    </DashboardShell>
  );
}
