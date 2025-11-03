import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { calculateBufferHash } from '@/lib/duplicate-detection'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Tidak diizinkan. Silakan login terlebih dahulu.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const docxFile = formData.get('docxFile') as File
    const pdfFile = formData.get('pdfFile') as File

    // Validate at least docxFile exists
    if (!docxFile) {
      return NextResponse.json(
        { error: 'File DOCX harus diunggah' },
        { status: 400 }
      )
    }

    // Validate docx file type
    if (!docxFile.name.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'File DOCX harus berformat .docx' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (docxFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file DOCX maksimal 10MB' },
        { status: 400 }
      )
    }

    // Validate PDF if provided
    if (pdfFile && pdfFile.size > 0) {
      if (!pdfFile.name.endsWith('.pdf')) {
        return NextResponse.json(
          { error: 'File Turnitin harus berformat .pdf' },
          { status: 400 }
        )
      }

      if (pdfFile.size > maxSize) {
        return NextResponse.json(
          { error: 'Ukuran file PDF maksimal 10MB' },
          { status: 400 }
        )
      }
    }

    const uploadDir = join(process.cwd(), 'uploads', 'documents')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Helper function to save file and calculate hash
    const saveFile = async (file: File) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Calculate file hash for duplicate detection
      const fileHash = calculateBufferHash(buffer)

      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const filename = `${timestamp}-${randomString}-${file.name}`
      const filepath = join(uploadDir, filename)

      await writeFile(filepath, buffer)

      return {
        filename,
        originalName: file.name,
        size: file.size,
        path: `/uploads/documents/${filename}`,
        hash: fileHash,
      }
    }

    // Save both files
    const docxData = await saveFile(docxFile)
    let pdfData = null

    if (pdfFile && pdfFile.size > 0) {
      pdfData = await saveFile(pdfFile)
    }

    return NextResponse.json({
      success: true,
      data: {
        docxFile: docxData,
        pdfFile: pdfData,
      },
    })
  } catch (error: any) {
    console.error('[FILE_UPLOAD_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file', details: error.message },
      { status: 500 }
    )
  }
}
