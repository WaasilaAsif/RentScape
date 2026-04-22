// __tests__/api/properties/[id].test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
/**
 * Integration tests for PUT /api/properties/[id]
 * 
 * Tests cover:
 * - Authentication and authorization
 * - Ownership verification
 * - Field validation
 * - Forbidden field blocking
 * - Successful updates
 * - Error handling
 */

describe('PUT /api/properties/[id]', () => {
  let landlordSessionCookie: string
  let tenantSessionCookie: string
  let propertyId: string
  let otherLandlordPropertyId: string
//expect error
//@ts-expect-error may give an error just ignore it for now
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Setup: Create test users and properties
  beforeAll(async () => {
    // 1. Sign up landlord and get session cookie
    const landlordSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-landlord@example.com',
        password: 'password123',
        full_name: 'Test Landlord',
        role: 'landlord'
      })
    })
    const landlordCookies = landlordSignup.headers.get('set-cookie')
    landlordSessionCookie = landlordCookies?.split(';')[0] || ''

    // 2. Sign up tenant
    const tenantSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-tenant@example.com',
        password: 'password123',
        full_name: 'Test Tenant',
        role: 'tenant'
      })
    })
    const tenantCookies = tenantSignup.headers.get('set-cookie')
    tenantSessionCookie = tenantCookies?.split(';')[0] || ''

    // 3. Create property as landlord
    const createProperty = await fetch(`${BASE_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': landlordSessionCookie
      },
      body: JSON.stringify({
        title: 'Test Property for Updates',
        city: 'Islamabad',
        area: 'F-7',
        property_type: 'apartment',
        total_units: 4,
        max_occupants_per_unit: 4,
        lat: 33.7295,
        lng: 73.0551
      })
    })
    const propertyData = await createProperty.json()
    propertyId = propertyData.property.id

    // 4. Sign up another landlord and create their property
    const otherLandlordSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'other-landlord@example.com',
        password: 'password123',
        full_name: 'Other Landlord',
        role: 'landlord'
      })
    })
    const otherLandlordCookies = otherLandlordSignup.headers.get('set-cookie')
    const otherLandlordCookie = otherLandlordCookies?.split(';')[0] || ''

    const otherProperty = await fetch(`${BASE_URL}/api/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': otherLandlordCookie
      },
      body: JSON.stringify({
        title: 'Other Landlord Property',
        city: 'Lahore',
        area: 'DHA',
        property_type: 'house',
        total_units: 1,
        max_occupants_per_unit: 6,
        lat: 31.5204,
        lng: 74.3587
      })
    })
    const otherPropertyData = await otherProperty.json()
    otherLandlordPropertyId = otherPropertyData.property.id
  })

  // Cleanup: Delete test data
  afterAll(async () => {
    // Clean up test properties and users
    // Note: In production, you'd use a test database that gets wiped
  })

  describe('Authentication Tests', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 if user is not a landlord', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': tenantSessionCookie
        },
        body: JSON.stringify({ title: 'Tenant Trying to Update' })
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Only landlords can edit properties')
    })
  })

  describe('Ownership Verification Tests', () => {
    it('should return 404 for non-existent property', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`${BASE_URL}/api/properties/${fakeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: 'Updated Title' })
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Property not found')
    })

    it('should return 403 if landlord does not own the property', async () => {
      // Try to update another landlord's property
      const response = await fetch(`${BASE_URL}/api/properties/${otherLandlordPropertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: 'Trying to Steal Property' })
      })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('You do not own this property')
    })
  })

  describe('Validation Tests', () => {
    it('should return 400 for invalid title (too short)', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: 'AB' }) // Only 2 characters
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
      expect(data.details).toBeDefined()
    })

    it('should return 400 for invalid status enum', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ status: 'invalid_status' })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 for negative total_units', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ total_units: -5 })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 when no fields provided', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({}) // Empty update
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No valid fields to update')
    })
  })

  describe('Forbidden Fields Tests', () => {
    it('should reject updating property_type', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ property_type: 'house' })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain("Cannot update 'property_type'")
    })

    it('should reject updating location', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ location: 'POINT(73.0551 33.7295)' })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain("Cannot update 'location'")
    })

    it('should reject updating lat/lng', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ lat: 40.7128, lng: -74.0060 })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toMatch(/Cannot update '(lat|lng)'/)
    })

    it('should reject updating landlord_id', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ landlord_id: '00000000-0000-0000-0000-000000000000' })
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain("Cannot update 'landlord_id'")
    })
  })

  describe('Successful Update Tests', () => {
    it('should successfully update title', async () => {
      const newTitle = 'Updated Luxury Apartment Complex'
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: newTitle })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.property.title).toBe(newTitle)
      expect(data.property.id).toBe(propertyId)
    })

    it('should successfully update status', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ status: 'inactive' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.property.status).toBe('inactive')
    })

    it('should successfully update multiple fields', async () => {
      const updates = {
        title: 'Premium F-7 Residence',
        area: 'F-7/3',
        description: 'Newly renovated with modern amenities',
        total_units: 6,
        max_occupants_per_unit: 5
      }

      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify(updates)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.property.title).toBe(updates.title)
      expect(data.property.area).toBe(updates.area)
      expect(data.property.description).toBe(updates.description)
      expect(data.property.total_units).toBe(updates.total_units)
      expect(data.property.max_occupants_per_unit).toBe(updates.max_occupants_per_unit)
    })

    it('should preserve unchanged fields', async () => {
      // First, get current property state
      const getResponse = await fetch(`${BASE_URL}/api/properties/${propertyId}`)
      const beforeUpdate = await getResponse.json()
      const originalCity = beforeUpdate.property.city
      const originalPropertyType = beforeUpdate.property.property_type

      // Update only title
      await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: 'New Title Only' })
      })

      // Verify unchanged fields remain the same
      const afterResponse = await fetch(`${BASE_URL}/api/properties/${propertyId}`)
      const afterUpdate = await afterResponse.json()

      expect(afterUpdate.property.city).toBe(originalCity)
      expect(afterUpdate.property.property_type).toBe(originalPropertyType)
      expect(afterUpdate.property.title).toBe('New Title Only')
    })

    it('should return lat/lng in response', async () => {
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: 'Coordinates Test' })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.property.lat).toBeDefined()
      expect(data.property.lng).toBeDefined()
      expect(typeof data.property.lat).toBe('number')
      expect(typeof data.property.lng).toBe('number')
    })

    it('should update updated_at timestamp', async () => {
      // Get original timestamp
      const getResponse = await fetch(`${BASE_URL}/api/properties/${propertyId}`)
      const before = await getResponse.json()
      const originalTimestamp = new Date(before.property.updated_at)

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update property
      await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: 'Timestamp Test' })
      })

      // Verify timestamp changed
      const afterResponse = await fetch(`${BASE_URL}/api/properties/${propertyId}`)
      const after = await afterResponse.json()
      const newTimestamp = new Date(after.property.updated_at)

      expect(newTimestamp.getTime()).toBeGreaterThan(originalTimestamp.getTime())
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long title (within limits)', async () => {
      const longTitle = 'A'.repeat(200) // Assuming max length is reasonable
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: longTitle })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.property.title).toBe(longTitle)
    })

    it('should handle special characters in text fields', async () => {
      const specialTitle = "Test Property with Special Chars: @#$%^&*()"
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ title: specialTitle })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.property.title).toBe(specialTitle)
    })

    it('should handle zero as valid total_units', async () => {
      // Note: This might fail depending on your min(1) validation
      // Adjust test based on business logic
      const response = await fetch(`${BASE_URL}/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': landlordSessionCookie
        },
        body: JSON.stringify({ total_units: 0 })
      })

      // Should fail with current validation (min: 1)
      expect(response.status).toBe(400)
    })
  })
})