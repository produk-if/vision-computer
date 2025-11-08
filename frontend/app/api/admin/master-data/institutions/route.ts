import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get all institutions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: {
            faculties: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: institutions,
    })
  } catch (error: any) {
    console.error('[GET_INSTITUTIONS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to get institutions', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new institution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, shortName, type, city, province } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Institution name is required' },
        { status: 400 }
      )
    }

    // Check if institution already exists
    const existing = await prisma.institution.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Institution with this name already exists' },
        { status: 400 }
      )
    }

    const institution = await prisma.institution.create({
      data: {
        name,
        shortName: shortName || null,
        type: type || null,
        city: city || null,
        province: province || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: institution,
      message: 'Institution created successfully',
    })
  } catch (error: any) {
    console.error('[CREATE_INSTITUTION_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to create institution', details: error.message },
      { status: 500 }
    )
  }
}
