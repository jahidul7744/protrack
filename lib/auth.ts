import { type NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

  adapter: PrismaAdapter(prisma),

  session: { strategy: 'jwt' },

  providers: [
    // ✅ GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user',
        };
      },
    }),

    // ✅ CREDENTIALS LOGIN
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        try {
          console.log("🔐 LOGIN ATTEMPT:", credentials);

          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password;

          // ❌ Missing input
          if (!email || !password) {
            console.log("❌ Missing email or password");
            throw new Error("Missing email or password");
          }

          // 🔍 Find user
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: 'insensitive',
              },
            },
          });

          console.log("👤 USER FOUND:", user?.email);

          // ❌ User not found
          if (!user) {
            throw new Error("User not found");
          }

          // ❌ Google account trying credentials login
          if (!user.password) {
            throw new Error("Please login using Google");
          }

          // ⚠️ Detect non-hashed password (VERY IMPORTANT FIX)
          if (!user.password.startsWith('$2')) {
            console.log("⚠️ Password is NOT hashed in DB");
            throw new Error("Password is not hashed. Fix your database.");
          }

          // 🔑 Compare password
          const isValid = await bcrypt.compare(password, user.password);

          console.log("🔑 PASSWORD MATCH:", isValid);

          if (!isValid) {
            throw new Error("Invalid password");
          }

          // ✅ SUCCESS
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };

        } catch (error: any) {
          console.log("🚨 AUTH ERROR:", error.message);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],

  callbacks: {
    // ✅ JWT CALLBACK
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
      }

      // Sync role for Google users
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    // ✅ SESSION CALLBACK
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }

      return session;
    },
  },

  pages: {
    signIn: '/',
    error: '/', // you can customize error UI later
  },

  debug: process.env.NODE_ENV === 'development',
};
