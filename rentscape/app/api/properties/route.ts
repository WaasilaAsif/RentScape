//NextRequest and NextResponse are used to handle incoming requests and send responses in Next.js API routes. Prisma is an ORM for database interactions. getSession is a custom function to retrieve the current user's session. createSupabaseServerClient is a function to create a Supabase client for server-side operations. propertySchema is a Zod schema for validating the input data for creating a property.
import { NextRequest, NextResponse } from 'next/server'
//We use prisma to interact with our database. It provides a type-safe API for querying and manipulating data, making it easier to work with databases in a Node.js environment. In this code, we will use prisma to insert a new property into the database after validating the input and checking the user's session and authorization.
//Type safe means that it provides compile-time checks for the types of data being used, which helps catch errors early in the development process and improves code reliability.
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/get-session'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { propertySchema } from '@/lib/validations/property'
//zod is not needed as propertySchema is already defined in a separate file and imported here. We use propertySchema to validate the input data for creating a property, ensuring that the data conforms to the expected structure and types before we attempt to insert it into the database.
//import {z} from 'zod'
import {pool} from '@/lib/db'
//What is an ORM for furure reference cuz mujhe bhi bhool jana
//T^T
// ORM. What is ORM? | by Divya Kanak | Divya's club | MediumObject-Relational Mapping (ORM) is a programming technique that acts as a bridge between object-oriented code and relational databases, allowing developers to manipulate database data using code objects instead of writing raw SQL queries. It improves productivity by automating CRUD (Create, Read, Update, Delete) operations and abstracting database interactions. 
//Documentation toi read for next for this
//https://nextjs.org/docs/app/api-reference/file-conventions/route#reference
export async function POST(request: NextRequest) {
  // STEP 1: Parse and validate
  console.log('Received request to create property')
  const body = await request.json( )
  //We use safe parse to basically get zod error and try to be safe from long errors ig?
  //From docs:
  /*To avoid a try/catch block, you can use the .safeParse() method to get back a plain result object containing either the successfully parsed data or a ZodError. The result type is a discriminated union, so you can handle both cases conveniently.
  */
 const parsed = propertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data

  // STEP 2: Session
  
  const user = await getSession() 

  if (!user) {
    //if you only add the sub path to url it will not know where to redirect you
    //return NextResponse.redirect(new URL('/login', request.url))
    //but claud says handl this use case in the frontend not here
    //so we just send a status code of 401 and handle the redirection in the frontend
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
 
  // STEP 3: Authorize — must be a landlord
  // YOUR CODE: fetch the user's role from profiles
  const supabase = await createSupabaseServerClient()
  //gives error "TypeError: Cannot read properties of null (reading 'from')" because supabase is null. This is because createSupabaseServerClient is trying to access cookies to get the session, but in this context, there are no cookies available. To fix this, we need to pass the request object to createSupabaseServerClient so it can access the cookies from the request. 
  //required awat
  if (!supabase) {
    console.error('Supabase client is not initialized')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
const { data : profile, error } =  await supabase 
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    if (error || !profile) {
        console.error('Error fetching user profile:', error)
        console.error('User ID:', user.id)
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }
  // If role !== 'landlord', return 403
    if (profile.role !== 'landlord') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  
  //We use prisma.$queryRaw to execute a raw SQL query that inserts a new property into the database. The query uses PostGIS functions to handle the geographic location data, allowing us to store the property's location as a geography type in the database. After executing the query, we return the newly created property in the response.
  // Use prisma.$queryRaw to get the returned row back
    // const result = await prisma.$queryRaw<Array<{
    //     id: string,
    //     title: string,
    //     city: string,
    //     area: string | null,
    //     property_type: string,
    //     total_units: number,
    //     status: string,
    //     lat: number,
    //     lng: number
    //  }>>`
    
    
    // INSERT INTO properties (
    //   landlord_id, title, city, area, property_type,
    //   total_units, max_occupants_per_unit, location
    //     )
    // VALUES (
    //     ${user.id}::uuid, ${data.title}, ${data.city}, ${data.area}, ${data.property_type}::property_type, ${data.total_units}, ${data.max_occupants_per_unit}, ST_MakePoint(${data.lng}, ${data.lat})::geography
    // )
    // RETURNING id, title, city, area, property_type, total_units, status,
    //   ST_Y(location::geometry) as lat,
    //   ST_X(location::geometry) as lng
    //   `

    //   return NextResponse.json({ property: result[0] }, { status: 201 })

    

// ...

const result = await prisma.$queryRaw<
  {
    id: string
    title: string
    city: string
    area: string | null
    property_type: string
    total_units: number
    status: string
    lat: number
    lng: number
  }[]
>`
INSERT INTO properties (
  landlord_id, title, city, area, property_type,
  total_units, max_occupants_per_unit, location
)
VALUES (
  ${user.id}::uuid,
  ${data.title},
  ${data.city},
  ${data.area},
  ${data.property_type}::property_type,
  ${data.total_units},
  ${data.max_occupants_per_unit},
  ST_MakePoint(${data.lng}, ${data.lat})::geography
)
RETURNING
  id, title, city, area, property_type, total_units, status,
  ST_Y(location::geometry) as lat,
  ST_X(location::geometry) as lng
`
return NextResponse.json({ property: result[0] }, { status: 201 })  //   VALUES (
  //     ${user.id}::uuid, ${data.title}, ${data.city}, ${data.area},
  //     ${data.property_type}::property_type, ${data.total_units},
  //     ${data.max_occupants_per_unit},
  //     ST_MakePoint(${data.lng}, ${data.lat})::geography
  //   )
  //   RETURNING id, title, city, area, property_type, total_units, status,
  //     ST_Y(location::geometry) as lat,
  //     ST_X(location::geometry) as lng

  // STEP 5: Return
  // return NextResponse.json({ property: result[0] }, { status: 201 })
}

//Notes for future reference:
//Cookies
/*You can read or set cookies with cookies from next/headers.

route.ts
TypeScript

TypeScript
import { cookies } from 'next/headers'
 
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
 
  const a = cookieStore.get('a')
  const b = cookieStore.set('b', '1')
  const c = cookieStore.delete('c')
}*/
//CORS:
/*
What is CORS and how to bypass it?Cross-Origin Resource Sharing (CORS) is an HTTP-header-based browser security mechanism that allows a server to authorize resources (like APIs or images) to be accessed by a different origin (domain, scheme, or port) than its own. By default, browsers block these cross-origin requests, but CORS enables safe, controlled sharing of data. 
Reddit
Reddit
 +3
Key Aspects of CORS:
Security Mechanism: It is a feature built into browsers to prevent malicious websites from making unauthorized requests to other domains on your behalf.
Same-Origin Policy (SOP): CORS is an extension of the SOP, which normally prevents a frontend (e.g., app.com) from talking to a different backend API (e.g., api.net).
How it Works: The browser sends a "preflight" request (an HTTP OPTIONS request) to the server to check if the cross-origin request is allowed.
*/