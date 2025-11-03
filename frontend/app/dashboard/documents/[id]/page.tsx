'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Download,
  File,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
} from 'lucide-react'

interface Document {
  id: string
  title: string
  originalFilename: string
  fileSize: number
  status: string
  createdAt: string
  uploadPath: string
  pdfPath?: string
  pdfFilename?: string
  analysis?: {
    flagCount: number
    similarityScore?: number
  }
  bypasses: Array<{
    id: string
    strategy: string
    status: string
    outputFilename: string
    successRate?: number
    flagsRemoved?: number
    createdAt: string
  }>
}

export default function DocumentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [documentData, setDocumentData] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobId, setJobId] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState<any>(null)

  const documentId = params.id as string

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  // Auto-refresh for processing documents
  useEffect(() => {
    if (!documentData || documentData.status !== 'PROCESSING' || !jobId) {
      return
    }

    const interval = setInterval(() => {
      checkProcessingStatus()
    }, 1000) // Check every 1 second for faster updates

    return () => clearInterval(interval)
  }, [documentData?.status, jobId])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      const data = await response.json()

      if (data.success) {
        setDocumentData(data.data)
        console.log('[Document] Status:', data.data.status)

        // Try to load jobId from localStorage or database
        const savedJobId = localStorage.getItem(`doc-job-${documentId}`)
        const dbJobId = data.data.jobId

        const activeJobId = dbJobId || savedJobId

        if (activeJobId) {
          console.log('[Document] Found jobId:', activeJobId, 'source:', dbJobId ? 'database' : 'localStorage')
          setJobId(activeJobId)
        } else {
          console.log('[Document] No jobId found')
        }
      } else {
        throw new Error('Dokumen tidak ditemukan')
      }
    } catch (error) {
      console.error('[Document] Error fetching document:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengambil detail dokumen',
      })
      router.push('/dashboard/documents')
    } finally {
      setLoading(false)
    }
  }

  const checkProcessingStatus = async () => {
    if (!jobId) {
      console.warn('[Progress] No jobId available')
      return
    }

    try {
      console.log('[Progress] Checking status for jobId:', jobId)

      const response = await fetch(
        `/api/documents/${documentId}/process-status?jobId=${jobId}`
      )
      const data = await response.json()

      console.log('[Progress] Response:', data)

      if (data.success) {
        const { state, progress, result } = data.data

        // Update progress with state info
        const progressData = {
          ...progress,
          state: state,
          percent: progress?.percent || 0,
          current: progress?.current || 0,
          total: progress?.total || 13,
          message: progress?.message || 'Memproses dokumen...',
        }

        console.log('[Progress] Setting progress:', progressData)
        setProcessingProgress(progressData)

        // Refresh document to get updated status
        if (
          state === 'SUCCESS' ||
          state === 'COMPLETED' ||
          state === 'FAILURE' ||
          state === 'FAILED'
        ) {
          console.log('[Progress] Process complete:', state)
          setTimeout(() => {
            fetchDocument()
            localStorage.removeItem(`doc-job-${documentId}`)
            setJobId(null)
          }, 500)
        }
      } else {
        console.error('[Progress] Request failed:', data)
      }
    } catch (error) {
      console.error('[Progress] Error checking status:', error)
    }
  }

  const handleDownload = async (filename: string, isBypassResult: boolean = false) => {
    try {
      let response

      if (isBypassResult) {
        // Download dari Python backend untuk hasil bypass
        const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'
        console.log('[Download] Bypass result from:', `${pythonApiUrl}/bypass/download/${filename}`)
        response = await fetch(
          `${pythonApiUrl}/bypass/download/${encodeURIComponent(filename)}`
        )
      } else {
        // Download dari NextJS API untuk file original
        console.log('[Download] Original file from:', `/api/files/download?filename=${filename}`)
        response = await fetch(
          `/api/files/download?filename=${encodeURIComponent(filename)}`
        )
      }

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        variant: 'success',
        title: 'Berhasil',
        description: 'File berhasil diunduh',
      })
    } catch (error) {
      console.error('[Download] Error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengunduh file',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Selesai</span>
          </div>
        )
      case 'PROCESSING':
      case 'ANALYZING':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>Proses</span>
          </div>
        )
      case 'FAILED':
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>Gagal</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail dokumen...</p>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/documents')}
            className="mb-6 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Card className="shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Dokumen tidak ditemukan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/documents')}
          className="mb-6 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dokumen
        </Button>

        {/* Header */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D1F8EF] rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="h-6 w-6 text-[#3674B5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900 truncate">
                  {documentData.title}
                </h1>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {documentData.originalFilename}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(documentData.status)}
                {documentData.pdfPath && (
                  <span className="text-xs bg-[#A1E3F9] text-[#3674B5] px-2 py-1 rounded font-medium">
                    PDF ✓
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Monitoring Card - Compact */}
        {(documentData.status === 'PROCESSING' || documentData.status === 'ANALYZING') && (
          <Card className="mb-6 shadow-sm border border-blue-200 bg-blue-50 rounded-xl">
            <CardContent className="pt-4 pb-4">
              {processingProgress ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          {processingProgress.message || 'Memproses dokumen...'}
                        </p>
                        <p className="text-xs text-blue-600">Halaman akan diperbarui otomatis</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-900">
                      {processingProgress.percent || 0}%
                    </span>
                  </div>

                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${processingProgress.percent || 0}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-sm text-blue-700">Menghubungkan ke server...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Info */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Ukuran File</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatFileSize(documentData.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tanggal Upload</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(documentData.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {documentData.analysis && (
                <>
                  <div>
                    <p className="text-xs text-gray-500">Bendera</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {documentData.analysis.flagCount}
                    </p>
                  </div>
                  {documentData.analysis.similarityScore !== undefined && (
                    <div>
                      <p className="text-xs text-gray-500">Similaritas</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {documentData.analysis.similarityScore.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files Section */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-1.5" />
              File Dokumen
            </h3>
            <div className="space-y-2">
              {/* DOCX File */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {documentData.originalFilename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(documentData.fileSize)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload(documentData.originalFilename)}
                  className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3"
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span className="text-xs">Download</span>
                </Button>
              </div>

              {/* PDF File */}
              {documentData.pdfPath && documentData.pdfFilename && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {documentData.pdfFilename}
                      </p>
                      <p className="text-xs text-gray-500">File Turnitin</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(documentData.pdfFilename!)}
                    className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    <span className="text-xs">Download</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bypass History */}
        {documentData.bypasses && documentData.bypasses.length > 0 && (
          <Card className="shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="pt-4 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-1.5" />
                Riwayat Bypass
              </h3>
              <div className="space-y-2">
                {documentData.bypasses.map((bypass) => (
                  <div
                    key={bypass.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {bypass.strategy}
                        </p>
                        {bypass.status === 'COMPLETED' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                            Selesai
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                            {bypass.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {new Date(bypass.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} • {bypass.outputFilename}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {bypass.successRate !== undefined && (
                          <span className="text-xs text-gray-600">
                            Success: {bypass.successRate.toFixed(1)}%
                          </span>
                        )}
                        {bypass.flagsRemoved !== undefined && (
                          <span className="text-xs text-gray-600">
                            Removed: {bypass.flagsRemoved}
                          </span>
                        )}
                      </div>
                    </div>
                    {bypass.status === 'COMPLETED' && bypass.outputFilename && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(bypass.outputFilename, true)}
                        className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3 flex-shrink-0"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        <span className="text-xs">Download</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
