import { NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

export async function GET() {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Total properties
    const propertiesResult = await pool.query(
      'SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1',
      [user.id]
    )
    const totalProperties = parseInt(propertiesResult.rows[0].count, 10)

    // Active leases and tenants
    const leasesResult = await pool.query(
      `SELECT COUNT(DISTINCT l.tenant_id) as tenants, COUNT(*) as leases
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 AND l.status = 'active'`,
      [user.id]
    )
    const activeLeases = parseInt(leasesResult.rows[0].leases, 10)
    const totalTenants = parseInt(leasesResult.rows[0].tenants, 10)

    // Average rating
    const ratingResult = await pool.query(
      `SELECT AVG(r.score) as avg_rating
       FROM ratings r
       JOIN leases l ON r.lease_id = l.id
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE p.landlord_id = $1 AND r.target_type = 'landlord'`,
      [user.id]
    )
    const averageRating = parseFloat(ratingResult.rows[0].avg_rating || 0)

    // Total revenue (paid)
    const revenueResult = await pool.query(
      `SELECT SUM(p.amount) as total
       FROM payments p
       JOIN leases l ON p.lease_id = l.id
       JOIN units u ON l.unit_id = u.id
       JOIN properties prop ON u.property_id = prop.id
       WHERE prop.landlord_id = $1 AND p.status = 'paid'`,
      [user.id]
    )
    const totalRevenue = parseFloat(revenueResult.rows[0].total || 0)

    // Pending payments
    const pendingResult = await pool.query(
      `SELECT SUM(p.amount) as total
       FROM payments p
       JOIN leases l ON p.lease_id = l.id
       JOIN units u ON l.unit_id = u.id
       JOIN properties prop ON u.property_id = prop.id
       WHERE prop.landlord_id = $1 AND p.status = 'pending'`,
      [user.id]
    )
    const pendingPayments = parseFloat(pendingResult.rows[0].total || 0)

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
      [user.id]
    )
    const monthlyRevenue = monthlyRevenueResult.rows.map((row: { month: string; revenue: string }) => ({
      month: row.month,
      revenue: parseFloat(row.revenue)
    }))

    // Property types distribution
    const propertyTypesResult = await pool.query(
      'SELECT property_type, COUNT(*) as count FROM properties WHERE landlord_id = $1 GROUP BY property_type',
      [user.id]
    )
    // const propertyTypes = propertyTypesResult.rows.map((row: any) => ({
    const propertyTypes = propertyTypesResult.rows.map((row: { property_type: string; count: string }) => ({
      type: row.property_type,
      count: parseInt(row.count, 10)
    }))

    return NextResponse.json({
      totalProperties,
      activeLeases,
      totalTenants,
      averageRating,
      totalRevenue,
      pendingPayments,
      monthlyRevenue,
      propertyTypes,
    })

  } catch (error) {
    const err = error as Error
    console.error('GET /api/dashboard/landlord error:', err.message)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: err.message },
      { status: 500 }
    )
  }
}