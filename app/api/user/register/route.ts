// app/api/auth/register/route.ts

import { NextResponse, NextRequest } from "next/server";
import { InsertQuery, SelectQuery } from "@/lib/database";
import { z } from "zod";
import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Define the validation schema for the API body
const registerSchema = z.object({
  first_name: z.string().min(2, "First name is required."),
  last_name: z.string().min(2, "Last name is required."),
  mobile_no: z.string().min(10, "Mobile number is required and must be at least 10 digits."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();

    // Validate the request body
    const validationResult = registerSchema.safeParse(reqBody);
    if (!validationResult.success) {
      return NextResponse.json({
        status: "fail",
        message: validationResult.error.issues[0].message,
      }, { status: 400 });
    }

    const { first_name, last_name, mobile_no, email, password } = validationResult.data;

    // Check if the user already exists by email or user_name
    const existingUser = await SelectQuery(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email ]
    );

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({
        status: "fail",
        message: "User with this email or username already exists.",
      }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const defaultRoleId = 3; // Donor
    console.log("🚀 ~ POST ~ :",)

    const result = await InsertQuery(
      `INSERT INTO users (first_name, last_name, mobile_no, dob, email,  password, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7 )
       RETURNING id, first_name, last_name, email,   mobile_no, dob, role_id`,
      [first_name, last_name, mobile_no, null, email,   hashedPassword, defaultRoleId]
    );
    console.log("🚀 ~ POST ~ result:", result)

    if (result && result) {
      const newUser = result?.rows[0];
      return NextResponse.json({
        status: "success",
        message: "User created successfully.",
        data: newUser,
      }, { status: 201 });
    }

    return NextResponse.json({
      status: "fail",
      message: "Failed to create user.",
    }, { status: 500 });

  } catch (e: any) {
    console.error("An error occurred during user registration:", e);
    return NextResponse.json({
      status: "fail",
      message: "Something went wrong.",
      error: e.message,
    }, { status: 500 });
  }
}
