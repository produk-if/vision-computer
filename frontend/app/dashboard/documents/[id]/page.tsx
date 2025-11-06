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
  requiresApproval?: boolean
  approvalStatus?: string
  rejectionReason?: string
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
  const [jobResult, setJobResult] = useState<any>(null)
  const [downloading, setDownloading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const documentId = params.id as string

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  // ❌ REMOVED: Auto-refresh - User will manually refresh using button

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      const data = await response.json()

      if (data.success) {
        setDocumentData(data.data)
        console.log('[Document] Status:', data.data.status)
        console.log('[Document] Full data:', data.data)

        // Try to load jobId from localStorage or database
        const savedJobId = localStorage.getItem(`doc-job-${documentId}`)
        const dbJobId = data.data.jobId

        const activeJobId = dbJobId || savedJobId

        if (activeJobId) {
          console.log('[Document] Found jobId:', activeJobId, 'source:', dbJobId ? 'database' : 'localStorage')
          setJobId(activeJobId)

          // ✅ ALWAYS fetch result if we have jobId (regardless of status)
          // Result is persisted in backend and can be fetched anytime
          console.log('[Document] Fetching result for jobId:', activeJobId)
          setTimeout(() => {
            fetchJobResultSilent(activeJobId)
          }, 100)
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

  const fetchJobResultSilent = async (jobIdToFetch: string) => {
    try {
      console.log('[Result] 📡 Fetching result silently for jobId:', jobIdToFetch)

      const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'
      const apiKey = process.env.NEXT_PUBLIC_PYTHON_API_KEY || ''

      const response = await fetch(`${pythonApiUrl}/jobs/${jobIdToFetch}/result`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[Result] ✅ Got result:', result)
        setJobResult(result)
      } else {
        console.log('[Result] ⚠️ Result not ready yet or failed:', response.status)
      }
    } catch (error) {
      console.log('[Result] ⚠️ Error fetching result (might not be ready yet):', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Fetch document data
      await fetchDocument()

      toast({
        title: '✅ Berhasil',
        description: 'Status dokumen berhasil diperbarui',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal memperbarui status',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const fetchJobResult = async () => {
    if (!jobId) {
      console.log('[Result] No jobId available')
      return
    }

    try {
      console.log('[Result] 📡 Fetching result from Python backend...')
      console.log('[Result] Job ID:', jobId)

      const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'
      const apiKey = process.env.NEXT_PUBLIC_PYTHON_API_KEY || ''

      console.log('[Result] URL:', `${pythonApiUrl}/jobs/${jobId}/result`)

      const response = await fetch(`${pythonApiUrl}/jobs/${jobId}/result`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      })

      console.log('[Result] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Result] ❌ Failed to fetch result:', errorText)
        throw new Error(`Failed to fetch result: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[Result] ✅ Got result:', result)
      console.log('[Result] Statistics:')
      console.log('   - Total Flags:', result.total_flags)
      console.log('   - Total Matched:', result.total_matched)
      console.log('   - Match Percentage:', result.match_percentage)
      console.log('   - Total Replacements:', result.total_replacements)
      console.log('   - Output File:', result.output_file)

      setJobResult(result)

      toast({
        title: '✅ Proses Selesai!',
        description: `${result.total_matched} dari ${result.total_flags} flags berhasil di-bypass (${result.match_percentage?.toFixed(1)}%)`,
      })
    } catch (error) {
      console.error('[Result] Error fetching result:', error)
    }
  }

  const handleDownload = async (filename: string, isBypassResult: boolean = false) => {
    setDownloading(true)
    try {
      let response

      if (isBypassResult) {
        // Download dari Python backend untuk hasil bypass
        const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'
        const apiKey = process.env.NEXT_PUBLIC_PYTHON_API_KEY || ''

        console.log('[Download] 📥 Downloading bypass result from Python backend')
        console.log('[Download] URL:', `${pythonApiUrl}/bypass/download/${filename}`)

        toast({
          title: '⏳ Mengunduh...',
          description: 'Sedang mengunduh file hasil bypass',
        })

        response = await fetch(
          `${pythonApiUrl}/bypass/download/${encodeURIComponent(filename)}`,
          {
            method: 'GET',
            headers: {
              'X-API-Key': apiKey,
            },
          }
        )
      } else {
        // Download dari NextJS API untuk file original
        console.log('[Download] 📄 Downloading original file from Next.js API')
        console.log('[Download] URL:', `/api/files/download?filename=${filename}`)

        response = await fetch(
          `/api/files/download?filename=${encodeURIComponent(filename)}`
        )
      }

      console.log('[Download] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Download] ❌ Download failed:', errorText)
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      console.log('[Download] ✅ Blob received, size:', blob.size, 'bytes')

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log('[Download] ✅ Download completed:', filename)

      toast({
        title: '✅ Berhasil',
        description: 'File berhasil didownload',
      })
    } catch (error: any) {
      console.error('[Download] ❌ Error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error.message || 'Gagal mengunduh file',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadResult = async () => {
    if (!jobResult?.output_file) {
      console.error('[DownloadResult] ❌ No output_file in jobResult')
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'File output tidak ditemukan',
      })
      return
    }

    console.log('[DownloadResult] 📦 Starting download...')
    console.log('[DownloadResult] Output file path:', jobResult.output_file)

    // Extract filename from path (outputs/unified_bypass_xxx.docx -> unified_bypass_xxx.docx)
    const filename = jobResult.output_file.split('/').pop()

    console.log('[DownloadResult] Extracted filename:', filename)
    console.log('[DownloadResult] Calling handleDownload with bypass flag = true')

    await handleDownload(filename, true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Selesai</span>
          </div>
        )
      case 'PROCESSING':
      case 'ANALYZING':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md animate-pulse">
            <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '2s' }} />
            <span>Proses</span>
          </div>
        )
      case 'FAILED':
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl text-xs font-bold shadow-md">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Gagal</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-xl text-xs font-bold shadow-md">
            <Clock className="h-3.5 w-3.5" />
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
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-300 opacity-20 mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium mt-4">Memuat detail dokumen...</p>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/documents')}
            className="mb-6 rounded-xl border-2 hover:border-blue-400 hover:bg-blue-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Card className="shadow-xl border-0 rounded-2xl bg-white/80 backdrop-blur">
            <CardContent className="pt-16 pb-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg">Dokumen tidak ditemukan</p>
              <p className="text-gray-500 text-sm mt-2">Dokumen yang Anda cari tidak tersedia</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/documents')}
          className="mb-6 rounded-xl border-2 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dokumen
        </Button>

        {/* Header - Modern Design */}
        <Card className="mb-6 shadow-xl border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <File className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white truncate drop-shadow-sm">
                  {documentData.title}
                </h1>
                <p className="text-blue-100 text-sm truncate mt-1 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  {documentData.originalFilename}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(documentData.status)}
                {documentData.pdfPath && (
                  <span className="text-xs bg-white/90 text-blue-700 px-3 py-1.5 rounded-lg font-semibold shadow-md">
                    PDF ✓
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Status Banner */}
        {documentData.requiresApproval && documentData.approvalStatus === 'PENDING' && (
          <Card className="mb-6 shadow-lg border-0 rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-yellow-900 mb-1.5 flex items-center gap-2">
                    ⏳ Menunggu Persetujuan Admin
                  </h3>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    Dokumen Anda sedang dalam antrian persetujuan admin. Proses dokumen akan dimulai secara otomatis setelah admin menyetujui dokumen ini. Anda akan menerima notifikasi setelah dokumen disetujui.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rejected Status Banner */}
        {documentData.approvalStatus === 'REJECTED' && (
          <Card className="mb-6 shadow-lg border-0 rounded-2xl overflow-hidden bg-gradient-to-r from-red-50 to-pink-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-900 mb-1.5">
                    ❌ Dokumen Ditolak
                  </h3>
                  <p className="text-sm text-red-800 leading-relaxed mb-3">
                    Dokumen Anda telah ditolak oleh admin. Silakan perbaiki dan upload ulang dokumen Anda.
                  </p>
                  {documentData.rejectionReason && (
                    <div className="mt-3 p-3 bg-white/70 backdrop-blur rounded-xl border border-red-200 shadow-sm">
                      <p className="text-xs font-semibold text-red-900 mb-1">Alasan Penolakan:</p>
                      <p className="text-sm text-red-800">{documentData.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved Status Banner */}
        {documentData.approvalStatus === 'APPROVED' && documentData.status === 'PENDING' && (
          <Card className="mb-6 shadow-lg border-0 rounded-2xl overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-green-900 mb-1.5">
                    ✅ Dokumen Disetujui
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    Dokumen Anda telah disetujui oleh admin. Anda dapat memulai proses bypass sekarang.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Status - Modern */}
        {(documentData.status === 'PROCESSING' || documentData.status === 'ANALYZING') && (
          <Card className="mb-6 shadow-xl border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center justify-center space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse opacity-20 blur-xl"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Clock className="h-10 w-10 text-white animate-spin" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    🔄 Sedang Memproses Dokumen
                  </p>
                  <p className="text-sm text-gray-600">
                    Dokumen Anda sedang dianalisis dan diproses
                  </p>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {refreshing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Status
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Info - Modern Stats Grid */}
        <Card className="mb-6 shadow-lg border-0 rounded-2xl bg-white/80 backdrop-blur">
          <CardContent className="pt-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-blue-700">Ukuran File</p>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {formatFileSize(documentData.fileSize)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-purple-700">Tanggal Upload</p>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {new Date(documentData.createdAt).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {documentData.analysis && (
                <>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-orange-700">Bendera</p>
                    </div>
                    <p className="text-lg font-bold text-orange-900">
                      {documentData.analysis.flagCount}
                    </p>
                  </div>
                  {documentData.analysis.similarityScore !== undefined && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <p className="text-xs font-medium text-green-700">Similaritas</p>
                      </div>
                      <p className="text-lg font-bold text-green-900">
                        {documentData.analysis.similarityScore.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files Section - Modern */}
        <Card className="mb-6 shadow-lg border-0 rounded-2xl bg-white/80 backdrop-blur">
          <CardContent className="pt-5 pb-5">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              File Dokumen
            </h3>
            <div className="space-y-3">
              {/* DOCX File */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    <File className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {documentData.originalFilename}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {formatFileSize(documentData.fileSize)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownload(documentData.originalFilename)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-9 px-4 shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs font-semibold">Download</span>
                </Button>
              </div>

              {/* PDF File */}
              {documentData.pdfPath && documentData.pdfFilename && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <File className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {documentData.pdfFilename}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        File Turnitin
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(documentData.pdfFilename!)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-9 px-4 shadow-md hover:shadow-lg transition-all"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-semibold">Download</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>



        {/* Processing Result - Modern Success Card */}
        {jobResult && documentData?.status === 'COMPLETED' && (
          <Card className="mb-6 shadow-2xl border-0 rounded-3xl overflow-hidden bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center justify-center space-y-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                  <div className="relative w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shadow-2xl">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                    🎉 Proses Selesai!
                  </h3>
                  <p className="text-base text-white/90 font-medium">
                    Dokumen berhasil diproses dengan sempurna
                  </p>
                </div>
                <Button
                  onClick={handleDownloadResult}
                  disabled={downloading}
                  size="lg"
                  className="bg-white text-green-700 hover:bg-green-50 font-bold px-8 py-6 text-base rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  {downloading ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Download Hasil
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bypass History - Modern Timeline */}
        {documentData.bypasses && documentData.bypasses.length > 0 && (
          <Card className="shadow-lg border-0 rounded-2xl bg-white/80 backdrop-blur">
            <CardContent className="pt-5 pb-5">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                Riwayat Bypass
              </h3>
              <div className="space-y-3">
                {documentData.bypasses.map((bypass, index) => (
                  <div
                    key={bypass.id}
                    className="relative flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 mr-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {bypass.strategy}
                          </p>
                          {bypass.status === 'COMPLETED' ? (
                            <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-lg font-semibold shadow-sm">
                              ✓ Selesai
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-300 text-gray-700 px-2.5 py-1 rounded-lg font-semibold">
                              {bypass.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 truncate flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(bypass.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 truncate mb-2">
                          📄 {bypass.outputFilename}
                        </p>
                        <div className="flex gap-3">
                          {bypass.successRate !== undefined && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                              📈 {bypass.successRate.toFixed(1)}% Success
                            </span>
                          )}
                          {bypass.flagsRemoved !== undefined && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">
                              🚩 {bypass.flagsRemoved} Removed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {bypass.status === 'COMPLETED' && bypass.outputFilename && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(bypass.outputFilename, true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl h-9 px-4 flex-shrink-0 shadow-md hover:shadow-lg transition-all"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        <span className="text-xs font-semibold">Download</span>
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
