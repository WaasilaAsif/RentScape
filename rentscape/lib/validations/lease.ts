import { z } from 'zod'

export const leaseSchema = z.object({
  // Foreign keys — client tells us WHICH unit and WHICH tenant
  unit_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  
  // Money
  monthly_rent: z.number().min(0),
  advance_amount: z.number().min(0).default(0),
  
  // Dates as YYYY-MM-DD strings (JSON has no Date type)
  start_date: z.string().date(),
  end_date: z.string().date(),
  
  // Occupancy
  is_family: z.boolean().default(false),
  occupant_count: z.number().int().min(1),
  
  // Optional
  notes: z.string().optional(),
  
  // Family members — optional array of objects
  family_members: z.array(
    z.object({
      full_name: z.string().min(1),
      cnic: z.string().regex(/^\d{5}-\d{7}-\d$/).optional(),
      // Regex is used to validate CNIC format (e.g., 12345-1234567-1)
      relation: z.enum(['spouse', 'child', 'parent', 'other']),
    })
  ).optional(),
})
.refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
})

export type LeaseInput = z.infer<typeof leaseSchema>