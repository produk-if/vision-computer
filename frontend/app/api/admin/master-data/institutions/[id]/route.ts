import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update institution
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { name, shortName, type, city, province } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Institution name is required' },
        { status: 400 }
      )
    }

    // Check if institution exists
    const existing = await prisma.institution.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      )
    }

    // Check if name already taken by another institution
    if (name !== existing.name) {
      const duplicate = await prisma.institution.findUnique({
        where: { name },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Institution name already exists' },
          { status: 400 }
        )
      }
    }

    const institution = await prisma.institution.update({
      where: { id },
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
      message: 'Institution updated successfully',
    })
  } catch (error: any) {
    console.error('[UPDATE_INSTITUTION_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update institution', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete institution
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if institution exists
    const existing = await prisma.institution.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            faculties: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      )
    }

    // Delete institution (cascade will delete faculties and majors)
    await prisma.institution.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Institution deleted successfully (${existing._count.faculties} faculties also deleted)`,
    })
  } catch (error: any) {
    console.error('[DELETE_INSTITUTION_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to delete institution', details: error.message },
      { status: 500 }
    )
  }
}
