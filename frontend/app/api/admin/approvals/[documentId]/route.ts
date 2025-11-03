import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/approvals/[documentId]/approve
 * Approve document for processing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const { documentId } = params

    // Update document approval status
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        status: 'PENDING', // Ready to be processed
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    console.log(`[ADMIN] ✅ Document ${documentId} approved by ${session.user.name}`)

    return NextResponse.json({
      success: true,
      message: 'Document approved successfully',
      document,
    })
  } catch (error) {
    console.error('[ADMIN] Error approving document:', error)
    return NextResponse.json(
      { error: 'Failed to approve document' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/approvals/[documentId]/reject
 * Reject document with reason
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin only' },
        { status: 403 }
      )
    }

    const { documentId } = params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update document approval status
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason: reason,
        status: 'FAILED',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    console.log(`[ADMIN] ❌ Document ${documentId} rejected by ${session.user.name}: ${reason}`)

    return NextResponse.json({
      success: true,
      message: 'Document rejected successfully',
      document,
    })
  } catch (error) {
    console.error('[ADMIN] Error rejecting document:', error)
    return NextResponse.json(
      { error: 'Failed to reject document' },
      { status: 500 }
    )
  }
}
