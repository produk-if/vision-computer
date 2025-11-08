import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const majors = await prisma.major.findMany({
      include: {
        faculty: {
          select: {
            name: true,
            institution: { select: { name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: majors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { name, facultyId, degree } = await request.json()

    if (!name || !facultyId) {
      return NextResponse.json({ error: 'Name and facultyId required' }, { status: 400 })
    }

    const major = await prisma.major.create({
      data: { name, facultyId, degree: degree || 'S1' },
      include: {
        faculty: {
          select: {
            name: true,
            institution: { select: { name: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: major })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
