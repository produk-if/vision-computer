import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update user (toggle active status)
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
    const { isActive } = body

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent modifying admin accounts
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot modify admin accounts' },
        { status: 403 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (error: any) {
    console.error('[ADMIN_USER_UPDATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete user and all related data
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        role: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting admin accounts
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts' },
        { status: 403 }
      )
    }

    // Delete user (cascade will handle related records)
    // The Prisma schema should have cascade delete configured
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `User ${user.name} (${user.email}) deleted successfully`,
    })
  } catch (error: any) {
    console.error('[ADMIN_USER_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    )
  }
}
