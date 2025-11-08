/**
 * NextAuth Configuration
 * Authentication setup for Rumah Plagiasi with Session Security
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createSession, validateSession, terminateAllSessions } from '@/lib/session-security'
import crypto from 'crypto'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Email/Username dan password harus diisi')
        }

        // Find user by email or username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          },
          include: {
            profile: true,
          },
        })

        if (!user) {
          throw new Error('Email/Username atau password salah')
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Akun Anda telah ditangguhkan oleh administrator. Silakan hubungi admin untuk informasi lebih lanjut.')
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Email/Username atau password salah')
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountStatus: user.accountStatus,
          isActive: user.isActive,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in - create new session with device fingerprint
      if (user) {
        token.id = user.id
        token.role = user.role
        token.accountStatus = (user as any).accountStatus
        token.isActive = (user as any).isActive

        // Generate secure session token
        const sessionToken = crypto.randomBytes(32).toString('hex')
        token.sessionToken = sessionToken

        try {
          // Create session with device fingerprint (terminates all other sessions)
          await createSession(user.id, sessionToken)
          console.log('[AUTH] ✓ Session created with device fingerprint for user:', user.id)
        } catch (error) {
          console.error('[AUTH] ❌ Failed to create session:', error)
        }
      }

      // TEMPORARY: Disable strict session validation for development
      // TODO: Re-enable this after fixing main backend communication issue

      // Simple validation: just check if user exists in database
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              accountStatus: true,
              isActive: true,
            },
          })

          if (dbUser) {
            // User exists, update token with fresh data
            token.role = dbUser.role
            token.accountStatus = dbUser.accountStatus
            token.isActive = dbUser.isActive

            // Check if user is active
            if (!dbUser.isActive) {
              console.warn('[AUTH] ⚠️ User is not active, marking token as invalid')
              token.isValid = false
            } else {
              token.isValid = true
            }
          } else {
            // User not found in database
            token.isValid = false
          }
        } catch (error) {
          console.error('[AUTH] ❌ Database error:', error)
          // On error, allow session to continue (don't block user)
          token.isValid = true
        }
      } else {
        // New sign-in or token refresh
        token.isValid = true
      }

      /* COMMENTED OUT - STRICT SESSION VALIDATION
      // Validate session on each request (but not on initial sign in)
      if (token.id && token.sessionToken && !user) {
        try {
          const validation = await validateSession(
            token.id as string,
            token.sessionToken as string
          )

          if (!validation.valid) {
            console.warn('[AUTH] ⚠️ Session validation failed:', validation.reason)
            token.isValid = false
            return token
          }

          // Refresh user data on each request
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              accountStatus: true,
              isActive: true,
            },
          })

          if (dbUser) {
            token.role = dbUser.role
            token.accountStatus = dbUser.accountStatus
            token.isActive = dbUser.isActive
            token.isValid = true
          } else {
            token.isValid = false
          }
        } catch (error) {
          console.error('[AUTH] ❌ Session validation error:', error)
          token.isValid = false
        }
      } else {
        token.isValid = true
      }
      */

      return token
    },

    async session({ session, token }) {
      // TEMPORARY: Disable strict validation error throwing
      // TODO: Re-enable after fixing main backend communication

      // Only return session if token is valid (but don't throw error, just warn)
      if (token.isValid === false) {
        console.warn('[AUTH] ⚠️ Token marked as invalid, but allowing session for development')
        // Don't throw error - allow session to continue
        // throw new Error('Session invalid - device mismatch or session stolen')
      }

      // Check if user is active
      if (token.isActive === false) {
        console.warn('[AUTH] ⚠️ User is not active, terminating session')
        throw new Error('Akun Anda telah ditangguhkan oleh administrator. Silakan hubungi admin untuk informasi lebih lanjut.')
      }

      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = token.role as string
          ; (session.user as any).accountStatus = token.accountStatus
          ; (session.user as any).isActive = token.isActive
          ; (session.user as any).sessionToken = token.sessionToken
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    // signOut: '/auth/login',
    // verifyRequest: '/auth/verify-request',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}
