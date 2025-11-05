import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documentId = params.id

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    // Delete the document (this will cascade delete related records based on schema)
    await prisma.document.delete({
      where: { id: documentId }
    })

    // Log the deletion activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: document.userId,
          action: 'DOCUMENT_DELETED',
          resource: 'Document',
          resourceId: document.id,
          details: {
            documentTitle: document.title,
            originalFilename: document.originalFilename,
            deletedBy: session.user.name,
            deletedByEmail: session.user.email,
            deletedAt: new Date().toISOString(),
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log document deletion:', logError)
      // Continue even if logging fails
    }

    console.log(`[ADMIN] Document deleted by ${session.user.name}:`, {
      documentId: document.id,
      title: document.title,
      user: document.user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil dihapus'
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus dokumen' },
      { status: 500 }
    )
  }
}
