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

    const faculties = await prisma.faculty.findMany({
      include: {
        institution: { select: { name: true } },
        _count: { select: { majors: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: faculties })
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

    const { name, institutionId } = await request.json()

    if (!name || !institutionId) {
      return NextResponse.json({ error: 'Name and institutionId required' }, { status: 400 })
    }

    const faculty = await prisma.faculty.create({
      data: { name, institutionId },
      include: { institution: { select: { name: true } } },
    })

    return NextResponse.json({ success: true, data: faculty })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
