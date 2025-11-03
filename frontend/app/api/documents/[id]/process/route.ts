import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

const BACKEND_URL = process.env.PYTHON_API_URL || 'http://localhost:8000'
const isDev = process.env.NODE_ENV === 'development'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      if (isDev) console.log('[PROCESS] ❌ Unauthorized - No session')
      return NextResponse.json(
        { error: 'Tidak diizinkan' },
        { status: 401 }
      )
    }

    const documentId = params.id
    if (isDev) console.log(`[PROCESS] 🚀 Starting process for document: ${documentId}`)

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      if (isDev) console.log('[PROCESS] ❌ Document not found')
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    if (isDev) console.log(`[PROCESS] ✓ Document found: ${document.title}`)

    // Verify ownership
    if (document.userId !== session.user.id && session.user.role !== 'ADMIN') {
      if (isDev) console.log('[PROCESS] ❌ Access denied - Not owner')
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke dokumen ini' },
        { status: 403 }
      )
    }

    // ===== CHECK APPROVAL STATUS =====
    if (document.requiresApproval && document.approvalStatus !== 'APPROVED') {
      if (isDev) console.log(`[PROCESS] ⏳ Document requires approval - Status: ${document.approvalStatus}`)

      let message = 'Dokumen ini memerlukan persetujuan admin sebelum dapat diproses.'

      if (document.approvalStatus === 'REJECTED') {
        message = `Dokumen ditolak oleh admin. Alasan: ${document.rejectionReason || 'Tidak ada alasan'}`
      } else if (document.approvalStatus === 'PENDING') {
        message = 'Dokumen sedang menunggu persetujuan admin. Mohon tunggu hingga admin menyetujui dokumen Anda.'
      }

      return NextResponse.json(
        {
          error: 'Approval required',
          message,
          requiresApproval: true,
          approvalStatus: document.approvalStatus,
        },
        { status: 403 }
      )
    }
    // ===== END CHECK APPROVAL STATUS =====

    // Check if document has both DOCX and PDF
    if (!document.uploadPath || (!document.pdfPath && !document.uploadPath)) {
      if (isDev) console.log('[PROCESS] ❌ Missing files - DOCX or PDF not found')
      return NextResponse.json(
        { error: 'Dokumen harus memiliki file DOCX dan PDF Turnitin untuk diproses' },
        { status: 400 }
      )
    }

    if (isDev) console.log(`[PROCESS] ✓ Files check passed - DOCX: ${document.uploadPath}, PDF: ${document.pdfPath}`)

    // Update document status to ANALYZING
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'ANALYZING',
        jobStartedAt: new Date(),
      },
    })

    if (isDev) console.log('[PROCESS] ✓ Status updated to ANALYZING')

    // Prepare file paths
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents')
    const docxFileName = path.basename(document.uploadPath)
    const pdfFileName = document.pdfPath ? path.basename(document.pdfPath) : null

    const docxPath = path.join(uploadsDir, docxFileName)
    const pdfPath = pdfFileName ? path.join(uploadsDir, pdfFileName) : null

    // Check if files exist
    try {
      await fs.access(docxPath)
      if (isDev) console.log(`[PROCESS] ✓ DOCX file exists: ${docxPath}`)

      if (pdfPath) {
        await fs.access(pdfPath)
        if (isDev) console.log(`[PROCESS] ✓ PDF file exists: ${pdfPath}`)
      }
    } catch (error) {
      if (isDev) console.log(`[PROCESS] ❌ File not found on disk: ${error}`)
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      })
      return NextResponse.json(
        { error: 'File dokumen tidak ditemukan di server' },
        { status: 400 }
      )
    }

    // Read files as binary
    const docxBuffer = await fs.readFile(docxPath)
    const pdfBuffer = pdfPath ? await fs.readFile(pdfPath) : null

    // Create FormData for backend
    const formData = new FormData()

    // Add files
    const docxBlob = new Blob([docxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const pdfBlob = pdfBuffer
      ? new Blob([pdfBuffer], { type: 'application/pdf' })
      : null

    formData.append('original_doc', docxBlob, docxFileName)
    if (pdfBlob) {
      formData.append('turnitin_pdf', pdfBlob, pdfFileName!)
    }

    formData.append('original_filename', docxFileName)
    if (pdfFileName) {
      formData.append('turnitin_filename', pdfFileName)
    }

    // Call backend API
    if (isDev) console.log(`[PROCESS] 📡 Calling backend: ${BACKEND_URL}/jobs/process-document`)

    const backendResponse = await fetch(`${BACKEND_URL}/jobs/process-document`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-API-Key': process.env.PYTHON_API_KEY || '',
      },
    })

    if (isDev) console.log(`[PROCESS] 📡 Backend response status: ${backendResponse.status}`)

    if (!backendResponse.ok) {
      const error = await backendResponse.text()
      console.error('[PROCESS] ❌ Backend error:', error)

      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      })

      return NextResponse.json(
        { error: 'Gagal mengirim dokumen ke backend', details: error },
        { status: 500 }
      )
    }

    const backendData = await backendResponse.json()
    const jobId = backendData.job_id || backendData.task_id

    if (isDev) console.log(`[PROCESS] ✓ Backend response received - Job ID: ${jobId}`)

    // Save jobId to database for admin monitoring
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'PROCESSING',
        jobId: jobId,
      },
    })

    if (isDev) console.log(`[PROCESS] ✅ Process completed successfully - Document status: PROCESSING`)

    return NextResponse.json({
      success: true,
      data: {
        documentId,
        jobId: jobId,
        status: 'PROCESSING',
        statusUrl: backendData.status_url,
      },
    })
  } catch (error: any) {
    if (isDev) {
      console.error('[PROCESS] ❌ Fatal error:', error)
      console.error('[PROCESS] Error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      })
    }

    // Try to update status to FAILED
    try {
      await prisma.document.update({
        where: { id: params.id },
        data: { status: 'FAILED' },
      })
    } catch { }

    return NextResponse.json(
      { error: 'Gagal memproses dokumen', details: error.message },
      { status: 500 }
    )
  }
}
