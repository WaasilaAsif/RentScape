import { NextResponse } from 'next/server'
import { getUserWithRole, UserwithRole } from './get-user-with-role'

/**
 * Require landlord role
 * Usage: const user = await requireLandlord(); if (user instanceof NextResponse) return user;
 */
export async function requireLandlord(): Promise<UserwithRole | NextResponse> {
  const user = await getUserWithRole()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'landlord') {
    return NextResponse.json(
      { error: 'Only landlords can perform this action' },
      { status: 403 }
    )
  }

  return user
}

/**
 * Require tenant role
 */
export async function requireTenant(): Promise<UserwithRole | NextResponse> {
  const user = await getUserWithRole()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'tenant') {
    return NextResponse.json(
      { error: 'Only tenants can perform this action' },
      { status: 403 }
    )
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<UserwithRole | NextResponse> {
  const user = await getUserWithRole()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return user
}

/**
 * Require any authenticated user
 */
export async function requireAuth(): Promise<UserwithRole | NextResponse> {
  const user = await getUserWithRole()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user
}