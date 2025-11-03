import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import fs from 'fs/promises'

/**
 * Duplicate Document Detection System
 * Detects and handles duplicate documents based on file hash
 */

/**
 * Calculate SHA-256 hash of a file
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)
    return hashSum.digest('hex')
  } catch (error) {
    console.error('[HASH] Error calculating file hash:', error)
    throw error
  }
}

/**
 * Calculate hash from buffer (for uploaded files)
 */
export function calculateBufferHash(buffer: Buffer): string {
  const hashSum = crypto.createHash('sha256')
  hashSum.update(buffer)
  return hashSum.digest('hex')
}

/**
 * Check if document with same hash already exists for this user
 */
export async function findDuplicateDocument(
  fileHash: string,
  userId: string
): Promise<{
  isDuplicate: boolean
  originalDocument?: any
  canReuse: boolean
}> {
  try {
    // Find existing document with same hash from this user
    const existingDocument = await prisma.document.findFirst({
      where: {
        fileHash,
        userId,
        isDuplicate: false, // Only find original documents
      },
      include: {
        analysis: true,
        bypasses: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    if (!existingDocument) {
      return {
        isDuplicate: false,
        canReuse: false,
      }
    }

    // Check if the document has been successfully processed
    const canReuse =
      existingDocument.status === 'COMPLETED' &&
      existingDocument.approvalStatus === 'APPROVED' &&
      (existingDocument.analysis !== null || existingDocument.bypasses.length > 0)

    return {
      isDuplicate: true,
      originalDocument: existingDocument,
      canReuse,
    }
  } catch (error) {
    console.error('[DUPLICATE] Error checking duplicate:', error)
    return {
      isDuplicate: false,
      canReuse: false,
    }
  }
}

/**
 * Create a duplicate document entry that references the original
 */
export async function createDuplicateDocument(
  originalDocumentId: string,
  userId: string,
  title: string
): Promise<any> {
  try {
    const originalDoc = await prisma.document.findUnique({
      where: { id: originalDocumentId },
      include: {
        analysis: true,
        bypasses: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!originalDoc) {
      throw new Error('Original document not found')
    }

    // Create duplicate entry
    const duplicateDoc = await prisma.document.create({
      data: {
        title,
        originalFilename: originalDoc.originalFilename,
        fileSize: originalDoc.fileSize,
        fileType: originalDoc.fileType,
        uploadPath: originalDoc.uploadPath,
        pdfPath: originalDoc.pdfPath,
        pdfFilename: originalDoc.pdfFilename,
        userId,
        status: 'COMPLETED', // Already processed
        pageCount: originalDoc.pageCount,
        wordCount: originalDoc.wordCount,
        characterCount: originalDoc.characterCount,
        fileHash: originalDoc.fileHash,
        isDuplicate: true,
        originalDocumentId: originalDoc.id,
        packageCode: originalDoc.packageCode,
        subscriptionId: originalDoc.subscriptionId,
        requiresApproval: false, // No approval needed for duplicates
        approvalStatus: 'NOT_REQUIRED',
      },
    })

    // Copy analysis if exists
    if (originalDoc.analysis) {
      await prisma.documentAnalysis.create({
        data: {
          documentId: duplicateDoc.id,
          flagCount: originalDoc.analysis.flagCount,
          flagTypes: originalDoc.analysis.flagTypes as any,
          ocrText: originalDoc.analysis.ocrText,
          metadata: originalDoc.analysis.metadata as any,
          similarityScore: originalDoc.analysis.similarityScore,
          plagiarismReport: originalDoc.analysis.plagiarismReport as any,
          analyzedAt: new Date(),
        },
      })
    }

    // Copy latest bypass result if exists
    if (originalDoc.bypasses.length > 0) {
      const latestBypass = originalDoc.bypasses[0]
      await prisma.bypassHistory.create({
        data: {
          documentId: duplicateDoc.id,
          userId,
          strategy: latestBypass.strategy,
          status: latestBypass.status,
          progress: latestBypass.progress,
          outputPath: latestBypass.outputPath,
          outputFilename: latestBypass.outputFilename,
          outputFileSize: latestBypass.outputFileSize,
          flagsRemoved: latestBypass.flagsRemoved,
          processingTime: latestBypass.processingTime,
          successRate: latestBypass.successRate,
          pythonApiResponse: latestBypass.pythonApiResponse as any,
          configuration: latestBypass.configuration as any,
          completedAt: latestBypass.completedAt,
        },
      })
    }

    console.log(`[DUPLICATE] ✓ Created duplicate document ${duplicateDoc.id} from original ${originalDoc.id}`)

    return duplicateDoc
  } catch (error) {
    console.error('[DUPLICATE] Error creating duplicate document:', error)
    throw error
  }
}

/**
 * Get duplicate statistics for a user
 */
export async function getDuplicateStats(userId: string) {
  try {
    const [totalDocuments, duplicateDocuments, originalDocuments] = await Promise.all([
      prisma.document.count({
        where: { userId },
      }),
      prisma.document.count({
        where: {
          userId,
          isDuplicate: true,
        },
      }),
      prisma.document.count({
        where: {
          userId,
          isDuplicate: false,
        },
      }),
    ])

    return {
      totalDocuments,
      duplicateDocuments,
      originalDocuments,
      duplicateRate: totalDocuments > 0 ? (duplicateDocuments / totalDocuments) * 100 : 0,
    }
  } catch (error) {
    console.error('[DUPLICATE] Error getting stats:', error)
    return {
      totalDocuments: 0,
      duplicateDocuments: 0,
      originalDocuments: 0,
      duplicateRate: 0,
    }
  }
}
