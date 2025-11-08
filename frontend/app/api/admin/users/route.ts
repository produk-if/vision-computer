import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: {
            not: 'ADMIN', // Exclude admin users
          },
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
              phone: true,
              institution: true,
            },
          },
          subscriptions: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              package: {
                select: {
                  code: true,
                  name: true,
                  validityDays: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          _count: {
            select: {
              documents: true,
              bypasses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: {
          role: {
            not: 'ADMIN', // Exclude admin users from count
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error: any) {
    console.error('[ADMIN_USERS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get users', details: error.message },
      { status: 500 }
    )
  }
}
