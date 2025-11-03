'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  File,
  Download,
  Trash2,
  Eye,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  X,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface Document {
  id: string
  title: string
  originalFilename: string
  fileSize: number
  status: string
  createdAt?: string
  uploadedAt?: string
  uploadPath: string
  pdfPath?: string
  analysis?: {
    flagCount: number
    similarityScore?: number
  }
  bypasses: Array<{
    id: string
    strategy: string
    status: string
  }>
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Detail Dialog State
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchDocuments()
    }
  }, [session])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents/user/${session?.user?.id}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal mengambil daftar dokumen',
      })
    } finally {
      setLoading(false)
    }
  }

  const openDetailDialog = (doc: Document) => {
    setSelectedDocument(doc)
    setDetailDialogOpen(true)
  }

  const openDeleteDialog = (documentId: string) => {
    setDocumentToDelete(documentId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!documentToDelete) return

    try {
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus dokumen')
      }

      setDocuments(documents.filter((d) => d.id !== documentToDelete))

      toast({
        variant: 'success',
        title: 'Berhasil',
        description: 'Dokumen berhasil dihapus',
      })

      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Gagal menghapus dokumen',
      })
    }
  }

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(
        `/api/files/download?filename=${encodeURIComponent(filename)}`
      )

      if (!response.ok) {
        throw new Error('Download failed')
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
      console.error('Download error:', error)
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

  const getDocumentDate = (doc: Document) => {
    return doc.uploadedAt || doc.createdAt || null
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return '-'
    }
  }

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      })
    } catch (error) {
      return '-'
    }
  }

  const formatDateMedium = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return '-'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'ALL' || doc.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dokumen...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dokumen Saya</h2>
            <p className="text-gray-500 text-xs">Kelola dan pantau dokumen yang sudah diunggah</p>
          </div>
          <Link href="/dashboard/documents/upload">
            <Button className="bg-[#3674B5] hover:bg-[#578FCA] text-white font-medium h-9 rounded-lg transition-colors">
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="text-sm">Upload Dokumen</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Cari dokumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg border-gray-200 focus:border-gray-300 focus:ring-gray-300"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white h-9"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="ANALYZING">Dianalisis</option>
                <option value="PROCESSING">Diproses</option>
                <option value="COMPLETED">Selesai</option>
                <option value="FAILED">Gagal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium mb-3">
              {documents.length === 0
                ? 'Belum ada dokumen yang diunggah'
                : 'Tidak ada dokumen yang sesuai dengan pencarian'}
            </p>
            {documents.length === 0 && (
              <Link href="/dashboard/documents/upload">
                <Button className="bg-[#3674B5] hover:bg-[#578FCA] text-white font-medium rounded-lg h-9 transition-colors">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="text-sm">Upload Dokumen Pertama</span>
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-[#D1F8EF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="h-5 w-5 text-[#3674B5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.originalFilename}
                      </p>
                    </div>
                  </div>

                  {/* Center: Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Ukuran</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Upload</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {formatDateShort(getDocumentDate(doc))}
                      </p>
                    </div>
                    {doc.analysis && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Bendera</p>
                          <p className="text-xs font-semibold text-gray-900">
                            {doc.analysis.flagCount}
                          </p>
                        </div>
                        {doc.analysis.similarityScore !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500">Similaritas</p>
                            <p className="text-xs font-semibold text-gray-900">
                              {doc.analysis.similarityScore.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                      {doc.pdfPath && (
                        <span className="text-xs bg-[#A1E3F9] text-[#3674B5] px-2 py-1 rounded font-medium">
                          PDF ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailDialog(doc)}
                        className="h-8 px-3 rounded-lg border-gray-200 hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="text-xs">Detail</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.originalFilename)}
                        className="h-8 px-3 rounded-lg border-gray-200 hover:bg-gray-50"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(doc.id)}
                        className="h-8 px-3 text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-300 rounded-lg"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <File className="h-5 w-5 text-[#3674B5]" />
                  {selectedDocument.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Document Info */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Ukuran File</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatFileSize(selectedDocument.fileSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tanggal Upload</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateMedium(getDocumentDate(selectedDocument))}
                        </p>
                      </div>
                      {selectedDocument.analysis && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Bendera</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedDocument.analysis.flagCount}
                            </p>
                          </div>
                          {selectedDocument.analysis.similarityScore !== undefined && (
                            <div>
                              <p className="text-xs text-gray-500">Similaritas</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {selectedDocument.analysis.similarityScore.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Files */}
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="pt-4 pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-1.5" />
                      File Dokumen
                    </h3>
                    <div className="space-y-2">
                      {/* DOCX */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedDocument.originalFilename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(selectedDocument.fileSize)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(selectedDocument.originalFilename)}
                          className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          <span className="text-xs">Download</span>
                        </Button>
                      </div>

                      {/* PDF */}
                      {selectedDocument.pdfPath && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <File className="h-5 w-5 text-[#3674B5] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                PDF Turnitin
                              </p>
                              <p className="text-xs text-gray-500">File Turnitin</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(selectedDocument.originalFilename.replace('.docx', '.pdf'))}
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
                {selectedDocument.bypasses && selectedDocument.bypasses.length > 0 && (
                  <Card className="shadow-sm border border-gray-200">
                    <CardContent className="pt-4 pb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Zap className="h-4 w-4 mr-1.5" />
                        Riwayat Bypass ({selectedDocument.bypasses.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedDocument.bypasses.map((bypass) => (
                          <div
                            key={bypass.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
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
                              </div>
                              {bypass.status === 'COMPLETED' && (
                                <Button
                                  size="sm"
                                  className="bg-[#3674B5] hover:bg-[#578FCA] text-white rounded-lg h-8 px-3 ml-2"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Download</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
