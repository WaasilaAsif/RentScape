import { NextResponse } from 'next/server'
import { getFullProfile, UserSession } from './getFullProfile'

/**
 * Require landlord role
 * Usage: const user = await requireLandlord(); if (user instanceof NextResponse) return user;
 */
export async function requireLandlord(): Promise<UserSession | NextResponse> {
  const user = await getFullProfile()
  
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
export async function requireTenant(): Promise<UserSession | NextResponse> {
  const user = await getFullProfile()
  
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
export async function requireAdmin(): Promise<UserSession | NextResponse> {
  const user = await getFullProfile()
  
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
export async function requireAuth(): Promise<UserSession | NextResponse> {
  const user = await getFullProfile()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return user
}