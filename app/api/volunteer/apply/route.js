// app/api/volunteer/apply/route.js
import { NextResponse } from 'next/server';
import { InsertQuery, SelectQuery } from '@/lib/database'; // Adjust import path as needed
import { z } from 'zod';

// Validation schema matching the frontend
const volunteerApplicationSchema = z.object({
  // Personal Information
  firstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string()
    .email("Please enter a valid email address"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^[\d\s\-\+\(\)]+$/, "Please enter a valid phone number"),
  age: z.string()
    .refine((val) => {
      const num = parseInt(val)
      return num >= 16 && num <= 100
    }, "Age must be between 16 and 100"),
  
  // Address
  address: z.string()
    .min(10, "Please provide a complete address"),
  city: z.string()
    .min(2, "City is required"),
  zipCode: z.string()
    .min(5, "Please enter a valid zip code"),
  
  // Volunteer Preferences
  preferredProgram: z.string()
    .min(1, "Please select a volunteer program"),
  availability: z.array(z.string())
    .min(1, "Please select at least one availability option"),
  timeCommitment: z.enum(["1-2 hours/week", "3-4 hours/week", "5+ hours/week", "Flexible"], {
    required_error: "Please select your time commitment"
  }),
  
  // Experience and Skills
  previousVolunteerExperience: z.enum(["yes", "no"], {
    required_error: "Please indicate your volunteer experience"
  }),
  volunteerExperienceDetails: z.string().optional(),
  skills: z.array(z.string()),
  languages: z.string().optional(),
  
  // Motivation and Goals
  motivation: z.string()
    .min(30, "Please provide at least 30 characters about your motivation")
    .max(500, "Motivation must be less than 500 characters"),
  goals: z.string()
    .min(30, "Please provide at least 30 characters about your goals")
    .max(300, "Goals must be less than 300 characters"),
  
  // Emergency Contact
  emergencyContactName: z.string()
    .min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string()
    .min(10, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string()
    .min(2, "Emergency contact relationship is required"),
  
  // Agreements
  backgroundCheck: z.boolean()
    .refine(val => val === true, "Background check consent is required"),
  termsAndConditions: z.boolean()
    .refine(val => val === true, "You must accept terms and conditions"),
  newsletter: z.boolean().optional(),
}).refine((data) => {
  if (data.previousVolunteerExperience === "yes" && !data.volunteerExperienceDetails) {
    return false
  }
  return true
}, {
  message: "Please provide details about your volunteer experience",
  path: ["volunteerExperienceDetails"]
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = volunteerApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if user already has an active application
    const existingApplication = await SelectQuery(
      'SELECT id FROM volunteer_applications WHERE email = $1 AND is_active = true',
      [data.email]
    );

    if (existingApplication && existingApplication.length > 0) {
      return NextResponse.json(
        { error: 'An active application already exists for this email address' },
        { status: 409 }
      );
    }

    // Insert the volunteer application
    const insertQuery = `
      INSERT INTO volunteer_applications (
        first_name, last_name, email, phone, age,
        address, city, zip_code,
        preferred_program, availability, time_commitment,
        previous_volunteer_experience, volunteer_experience_details, skills, languages,
        motivation, goals,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        background_check_consent, terms_and_conditions_accepted, newsletter_subscription
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17,
        $18, $19, $20,
        $21, $22, $23
      ) RETURNING id, created_at
    `;

    const values = [
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      parseInt(data.age),
      data.address,
      data.city,
      data.zipCode,
      data.preferredProgram,
      data.availability, // PostgreSQL array
      data.timeCommitment,
      data.previousVolunteerExperience === 'yes',
      data.volunteerExperienceDetails || null,
      data.skills, // PostgreSQL array
      data.languages || null,
      data.motivation,
      data.goals,
      data.emergencyContactName,
      data.emergencyContactPhone,
      data.emergencyContactRelationship,
      data.backgroundCheck,
      data.termsAndConditions,
      data.newsletter || false
    ];

    const result = await InsertQuery(insertQuery, values);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create volunteer application');
    }

    const applicationId = result?.rows[0].id;
    const createdAt = result?.rows[0].created_at;

    // Log the successful application for monitoring
    console.log(`New volunteer application created: ID ${applicationId}, Email: ${data.email}, Program: ${data.preferredProgram}`);

    // TODO: Send confirmation email to applicant
    // TODO: Send notification email to volunteer coordinator
    // TODO: Add to mailing list if newsletter subscription is true

    return NextResponse.json({
      success: true,
      message: 'Volunteer application submitted successfully',
      applicationId: applicationId,
      submittedAt: createdAt,
      data: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        program: data.preferredProgram,
        status: 'pending'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating volunteer application:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 409 }
      );
    }
    
    if (error.code === '23514') { // Check constraint violation
      return NextResponse.json(
        { error: 'Invalid data provided. Please check all fields and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit volunteer application' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve volunteer applications (for admin use)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const program = searchParams.get('program');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = 'SELECT * FROM active_volunteer_applications WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND application_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (program) {
      query += ` AND preferred_program = $${paramIndex}`;
      params.push(program);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await SelectQuery(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM volunteer_applications WHERE is_active = true';
    let countParams = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND application_status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (program) {
      countQuery += ` AND preferred_program = $${countParamIndex}`;
      countParams.push(program);
    }

    const countResult = await SelectQuery(countQuery, countParams);
    const totalCount = parseInt(countResult?.rows[0].count);

    return NextResponse.json({
      applications: result,
      pagination: {
        total: totalCount,
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching volunteer applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volunteer applications' },
      { status: 500 }
    );
  }
}