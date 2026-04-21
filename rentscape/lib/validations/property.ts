import { z } from 'zod';

// Property validation schema
//Syntax breakdown for fututee reference:
// z.object() - This creates a new Zod schema for an object. The argument is an object that defines the shape of the expected data.
// title: z.string().min(1, 'Title is required') - This defines a property called "title" that must be a string. The .min(1, 'Title is required') part specifies that the string must have at least 1 character, and if it doesn't, it will return the error message "Title is required".
// breakdown of the other properties follows a similar pattern, with specific validations for each field:
// city: Must be a non-empty string.
// area: Optional string (can be undefined).
// property_type: Must be one of the specified string literals ('apartment', 'house', 'room', 'commercial', 'other').
// total_units: Must be an integer greater than or equal to 1.
// max_occupants_per_unit: Must be an integer greater than or equal to 1.
// lat: Must be a number between -90 and 90 (inclusive).
// lng: Must be a number between -180 and 180 (inclusive).
export const propertySchema = z.object({
  title: z.string().min(3),
  city: z.string().min(1),
  area: z.string().optional(),
  property_type: z.enum(['apartment', 'house', 'room', 'commercial', 'other']),
  total_units: z.number().int().min(1),
  max_occupants_per_unit: z.number().int().min(1),
  monthly_rent: z.number().min(0).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

// This line defines a new TypeScript type called PropertyInput. It uses the z.infer utility from Zod to automatically generate a TypeScript type based on the structure of the propertySchema. This means that PropertyInput will have the same properties and types as defined in propertySchema, allowing for type-safe usage of property data throughout the codebase.
export type PropertyInput = z.infer<typeof propertySchema>