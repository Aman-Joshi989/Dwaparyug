// lib/auth.ts

import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { SelectQuery } from "@/lib/database";
import { errorResponse } from "@/lib/api-response";

const JWT_SECRET = process.env.JWT_SECRET as string;
const AUTH_TOKEN_COOKIE_EXPIRY = parseInt(
  process.env.AUTH_TOKEN_COOKIE_EXPIRY || "1296000"
);

function generateToken(payload: {
  userId: number;
  email: string;
  name: string;
  role: string;
  provider?: string;
}): string {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  const options: SignOptions = {
    expiresIn: AUTH_TOKEN_COOKIE_EXPIRY,
  };

  return jwt.sign(payload, JWT_SECRET as jwt.Secret, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        try {
          const { email } = credentials as { email: string };

          console.log('🔐 [NextAuth] Authorizing user:', email);

          // Get user with OTP-verified status
          const foundUser: any = await SelectQuery(
            `SELECT u.*, ur.name as role_name FROM users u
       JOIN user_roles ur ON u.role_id = ur.id
       WHERE u.email = $1 AND u.is_verified = true LIMIT 1` ,
            [email]
          );

          console.log('🔍 [NextAuth] Query result:', {
            found: foundUser?.length > 0,
            count: foundUser?.length,
            isVerified: foundUser?.[0]?.is_verified
          });

          if (!foundUser || foundUser.length === 0) {
            console.error('❌ [NextAuth] User not found or not verified for:', email);
            throw new Error("User not found or not verified");
          }

          const user = foundUser[0];

          console.log('👤 [NextAuth] User details:', {
            id: user.id,
            email: user.email,
            role: user.role_name,
            is_verified: user.is_verified
          });

          const userName =
            user.full_name ||
            `${user.first_name} ${user.last_name}`.trim() ||
            user.first_name ||
            "Anonymous";

          const token = generateToken({
            userId: user.id,
            email: user.email,
            name: userName,
            role: user.role_name,
          });

          console.log('✅ [NextAuth] Authorization successful for:', email);

          return {
            id: user.id,
            role_id: user?.role_id || 3,
            email: user.email,
            name: userName,
            role_name: user.role_name,
            full_name: user.full_name,
            first_name: user.first_name,
            last_name: user.last_name,
            accessToken: token,
          };
        } catch (err: any) {
          console.error('❌ [NextAuth] Authorization error:', err.message);
          throw new Error(err?.message || "Authentication failed");
        }
      }
    }),
  ],

  secret: JWT_SECRET,

  session: {
    strategy: "jwt",
    maxAge: AUTH_TOKEN_COOKIE_EXPIRY,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const userName =
          (user as any).full_name ||
          (user as any).name ||
          (user as any).first_name ||
          "Anonymous";

        token.accessToken = (user as any).accessToken;
        token.userId = (user as any).id;
        token.email = (user as any).email;
        token.name = userName;
        token.role = (user as any).role_name;
      }

      if (account && (account.provider === "google" || account.provider === "github")) {
        const userName = (user as any)?.name || "Anonymous";
        const role = "Donor";

        const customToken = generateToken({
          // @ts-ignore
          userId: user.id,
          // @ts-ignore
          email: user.email,
          name: userName,
          role,
          provider: account.provider,
        });

        token.accessToken = customToken;
        token.userId = (user as any).id;
        token.email = (user as any).email;
        token.name = userName;
        token.role = role;
      }

      return token;
    },

    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.user.id = token.userId;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.role = token.role;

      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  debug: process.env.NEXT_PUBLIC_APP_ENV !== "production",
};