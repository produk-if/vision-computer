import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getUserActiveSubscription,
  validateDocumentAgainstPackage,
  incrementDocumentUsage,
  requiresAdminApproval
} from '@/lib/package-access'
import { isAutoApprovalEnabled } from '@/lib/system-settings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      originalFilename,
      fileSize,
      fileType,
      uploadPath,
      userId,
      pageCount,
      wordCount,
      characterCount,
      pdfPath,
      pdfFilename,
    } = body

    // Validate required fields
    if (!title || !originalFilename || !fileSize || !fileType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ===== PACKAGE ACCESS CONTROL =====
    // Check if user has active subscription
    const subscription = await getUserActiveSubscription(userId)

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'Tidak ada paket aktif',
          message: 'Anda harus berlangganan paket terlebih dahulu untuk menggunakan fitur ini.'
        },
        { status: 403 }
      )
    }

    // Validate document against package limits
    const validation = await validateDocumentAgainstPackage(
      userId,
      fileSize,
      pageCount
    )

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Dokumen melebihi batasan paket',
          message: validation.reason
        },
        { status: 403 }
      )
    }

    console.log(`[PACKAGE_CHECK] ✓ User ${userId} validated for package ${subscription.package.code}`)
    // ===== END PACKAGE ACCESS CONTROL =====

    // Check if auto-approval is enabled
    const autoApprovalEnabled = await isAutoApprovalEnabled()

    // Determine if requires admin approval
    const needsApproval = !autoApprovalEnabled && requiresAdminApproval(subscription.package.code)

    console.log(`[AUTO_APPROVAL] Setting: ${autoApprovalEnabled ? 'ENABLED' : 'DISABLED'}, Requires approval: ${needsApproval}`)

    // Create document record
    const documentData: any = {
      title,
      originalFilename,
      fileSize,
      fileType,
      uploadPath,
      userId,
      pageCount,
      wordCount,
      characterCount,
      status: 'PENDING',
      packageCode: subscription.package.code,
      subscriptionId: subscription.id,
      requiresApproval: needsApproval,
      approvalStatus: needsApproval ? 'PENDING' : (autoApprovalEnabled ? 'APPROVED' : 'NOT_REQUIRED'),
      // If auto-approval enabled, mark as approved immediately
      approvedAt: autoApprovalEnabled ? new Date() : null,
      approvedBy: autoApprovalEnabled ? 'SYSTEM_AUTO' : null,
    }

    // Add optional PDF fields if provided
    if (pdfPath) {
      documentData.pdfPath = pdfPath
    }
    if (pdfFilename) {
      documentData.pdfFilename = pdfFilename
    }

    const document = await prisma.document.create({
      data: documentData,
    })

    // Increment usage counter
    await incrementDocumentUsage(subscription.id)

    console.log(`[DOCUMENT_CREATE] ✓ Document created with package ${subscription.package.code}`, {
      documentId: document.id,
      requiresApproval: needsApproval,
      packageCode: subscription.package.code,
    })

    return NextResponse.json({
      success: true,
      data: document,
      requiresApproval: needsApproval,
      message: needsApproval
        ? 'Dokumen berhasil diunggah. Menunggu persetujuan admin sebelum diproses.'
        : 'Dokumen berhasil diunggah dan siap diproses.',
    })
  } catch (error: any) {
    console.error('[DOCUMENT_CREATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to create document', details: error.message },
      { status: 500 }
    )
  }
}
