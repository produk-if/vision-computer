'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Upload, File, X, CheckCircle, ArrowLeft } from 'lucide-react'

export default function UploadDocumentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedDocxFile, setSelectedDocxFile] = useState<File | null>(null)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActiveDocx, setDragActiveDocx] = useState(false)
  const [dragActivePdf, setDragActivePdf] = useState(false)

  const handleDragDocx = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveDocx(true)
    } else if (e.type === 'dragleave') {
      setDragActiveDocx(false)
    }
  }

  const handleDragPdf = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActivePdf(true)
    } else if (e.type === 'dragleave') {
      setDragActivePdf(false)
    }
  }

  const handleDropDocx = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveDocx(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelectDocx(e.dataTransfer.files[0])
    }
  }

  const handleDropPdf = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActivePdf(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelectPdf(e.dataTransfer.files[0])
    }
  }

  const handleFileSelectDocx = (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.docx')) {
      toast({
        variant: 'destructive',
        title: 'Format File Tidak Valid',
        description: 'File DOCX harus berformat .docx',
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Ukuran File Terlalu Besar',
        description: 'Ukuran file DOCX maksimal 10MB',
      })
      return
    }

    setSelectedDocxFile(file)

    // Auto-generate title from filename + timestamp
    const fileNameWithoutExt = file.name.replace(/\.docx$/i, '')
    const timestamp = new Date().toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/[/,]/g, '-').replace(/\s/g, '_')
    setTitle(`${fileNameWithoutExt}_${timestamp}`)
  }

  const handleFileSelectPdf = (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      toast({
        variant: 'destructive',
        title: 'Format File Tidak Valid',
        description: 'File Turnitin harus berformat .pdf',
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Ukuran File Terlalu Besar',
        description: 'Ukuran file PDF maksimal 10MB',
      })
      return
    }

    setSelectedPdfFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.name.endsWith('.docx')) {
        handleFileSelectDocx(file)
      } else if (file.name.endsWith('.pdf')) {
        handleFileSelectPdf(file)
      }
    }
  }

  const handleRemoveDocxFile = () => {
    setSelectedDocxFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemovePdfFile = () => {
    setSelectedPdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    console.log('\n' + '🎬'.repeat(35))
    console.log('🎬 [CLIENT - UPLOAD PAGE] USER CLICKED UPLOAD BUTTON')
    console.log('🎬'.repeat(35))
    console.log('   Title:', title)
    console.log('   DOCX File:', selectedDocxFile?.name || 'NOT SELECTED')
    console.log('   PDF File:', selectedPdfFile?.name || 'NOT SELECTED')
    console.log('   DOCX Size:', selectedDocxFile?.size || 0, 'bytes')
    console.log('   PDF Size:', selectedPdfFile?.size || 0, 'bytes')
    console.log('🎬'.repeat(35) + '\n')

    if (!selectedDocxFile) {
      console.error('❌ [ERROR] No DOCX file selected!')
      toast({
        variant: 'warning',
        title: 'Peringatan',
        description: 'Harap pilih file DOCX',
      })
      return
    }

    if (!selectedPdfFile) {
      console.error('❌ [ERROR] No PDF file selected!')
      toast({
        variant: 'warning',
        title: 'Peringatan',
        description: 'Harap pilih file PDF Turnitin',
      })
      return
    }

    setUploading(true)
    console.log('⏳ Setting uploading state to TRUE...')

    try {
      console.log('\n📤 [STEP 1] Creating FormData...')
      const formData = new FormData()
      formData.append('docxFile', selectedDocxFile)

      if (selectedPdfFile) {
        formData.append('pdfFile', selectedPdfFile)
        console.log('   ✅ Added DOCX + PDF to FormData')
      } else {
        console.log('   ⚠️ Added DOCX only (NO PDF)')
      }

      console.log('\n📤 [STEP 2] Uploading files to /api/files/upload...')
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()
      console.log('   Response status:', uploadResponse.status)
      console.log('   Upload success?', uploadData.success ? '✅ YES' : '❌ NO')

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Gagal mengupload file')
      }

      console.log('\n📝 [STEP 3] Creating document record in /api/documents/create...')
      const documentResponse = await fetch('/api/documents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          originalFilename: uploadData.data.docxFile.originalName,
          fileSize: uploadData.data.docxFile.size,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          uploadPath: uploadData.data.docxFile.path,
          userId: session?.user?.id,
          pdfPath: uploadData.data.pdfFile?.path || null,
          pdfFilename: uploadData.data.pdfFile?.originalName || null,
          fileHash: uploadData.data.docxFile.hash || null, // File hash untuk duplicate detection
        }),
      })

      const documentData = await documentResponse.json()
      console.log('   Response status:', documentResponse.status)
      console.log('   Create success?', documentData.success ? '✅ YES' : '❌ NO')

      if (!documentData.success) {
        throw new Error(documentData.error || 'Gagal membuat record dokumen')
      }

      // Check if this is a duplicate document
      if (documentData.isDuplicate) {
        toast({
          title: 'Dokumen Duplikat Terdeteksi',
          description: documentData.message || 'Dokumen yang sama sudah pernah diproses. Hasil sebelumnya akan digunakan.',
          duration: 5000,
        })

        // Redirect to document detail
        router.push('/dashboard')
        return
      }

      const documentId = documentData.data.id
      const hasPdfFile = selectedPdfFile || documentData.data.pdfPath

      console.log('\n' + '='.repeat(70))
      console.log('📋 [CLIENT - UPLOAD PAGE] Document created successfully')
      console.log('='.repeat(70))
      console.log('   Document ID:', documentId)
      console.log('   Title:', title)
      console.log('   Selected DOCX File:', selectedDocxFile?.name || 'NO')
      console.log('   Selected PDF File:', selectedPdfFile?.name || 'NO')
      console.log('   PDF Path in DB:', documentData.data.pdfPath || 'NO')
      console.log('   Has PDF?', hasPdfFile ? '✅ YES' : '❌ NO')
      console.log('   Will process?', hasPdfFile ? '✅ YES - Will call backend' : '❌ NO - Skipping backend')
      console.log('='.repeat(70) + '\n')

      if (!hasPdfFile) {
        console.warn('⚠️ [WARNING] No PDF Turnitin uploaded - skipping backend processing')
        toast({
          title: '📄 Dokumen Berhasil Diupload',
          description: 'Dokumen DOCX berhasil diupload. Upload PDF Turnitin untuk memulai proses bypass.',
        })

        router.push('/dashboard')
        return
      }

      // Trigger background processing (PDF is now required)
      if (hasPdfFile && documentId) {
        try {
          console.log('\n' + '🚀'.repeat(35))
          console.log('🚀 [CLIENT - UPLOAD PAGE] CALLING NEXT.JS API TO PROCESS DOCUMENT')
          console.log('🚀'.repeat(35))
          console.log('   Document ID:', documentId)
          console.log('   Target Endpoint:', `/api/documents/${documentId}/process`)
          console.log('   Method: POST')
          console.log('   Timestamp:', new Date().toISOString())
          console.log('🚀'.repeat(35) + '\n')

          console.log('>>> Calling fetch() to Next.js API endpoint...')

          const fetchStartTime = Date.now()
          const processResponse = await fetch(`/api/documents/${documentId}/process`, {
            method: 'POST',
          })
          const fetchDuration = Date.now() - fetchStartTime

          console.log('\n' + '📡'.repeat(35))
          console.log(`📡 [CLIENT - UPLOAD PAGE] RESPONSE RECEIVED in ${fetchDuration}ms`)
          console.log('📡'.repeat(35))
          console.log('   Status:', processResponse.status, processResponse.statusText)
          console.log('   OK?', processResponse.ok ? '✅ YES' : '❌ NO')
          console.log('   Headers:', Object.fromEntries(processResponse.headers.entries()))
          console.log('📡'.repeat(35) + '\n')

          if (processResponse.ok) {
            const processData = await processResponse.json()

            // Save jobId to localStorage for progress tracking
            if (processData.data?.jobId) {
              localStorage.setItem(`doc-job-${documentId}`, processData.data.jobId)
            }

            toast({
              variant: 'success',
              title: 'Proses Dimulai',
              description: 'Redirecting ke halaman progress monitoring...',
            })

            // Redirect to document detail page to show progress
            setTimeout(() => {
              router.push(`/dashboard/documents/${documentId}`)
            }, 800)
          } else {
            // Process failed - check if it's approval required
            const errorData = await processResponse.json()

            if (errorData.requiresApproval) {
              toast({
                title: '⏳ Menunggu Persetujuan',
                description: errorData.message || 'Dokumen berhasil diupload dan sedang menunggu persetujuan admin.',
              })
            } else {
              toast({
                variant: 'destructive',
                title: 'Gagal Memproses',
                description: errorData.message || 'Dokumen berhasil diupload tapi gagal diproses otomatis.',
              })
            }

            // Still redirect to documents list
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
          }
        } catch (processError) {
          console.error('Error triggering process:', processError)
          toast({
            variant: 'warning',
            title: 'Upload Berhasil',
            description: 'Dokumen berhasil diupload, tapi gagal memulai proses otomatis. Silakan coba proses manual dari halaman dokumen.',
          })

          // Still redirect to document page
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal Upload',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupload',
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-6 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Dashboard
          </Button>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Dokumen</h1>
                <p className="text-gray-600 text-lg">Unggah dokumen DOCX original dan PDF hasil Turnitin untuk dianalisis.</p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1.5">
                  ℹ️ Informasi Penting
                </h3>
                <ul className="text-xs text-yellow-800 space-y-1 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Dokumen yang diupload akan <strong>menunggu persetujuan admin</strong> sebelum dapat diproses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Proses bypass akan dimulai <strong>secara otomatis</strong> setelah admin menyetujui dokumen Anda</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Anda akan mendapat notifikasi ketika dokumen telah disetujui atau ditolak</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>Pastikan dokumen yang diupload <strong>sesuai dengan ketentuan</strong> yang berlaku</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: DOCX File Upload Area */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <Label className="text-lg font-semibold text-gray-900">
                File DOCX Original <span className="text-red-500">*</span>
              </Label>
            </div>

            {!selectedDocxFile ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${dragActiveDocx
                  ? 'border-blue-400 bg-blue-50 scale-105'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                onDragEnter={handleDragDocx}
                onDragLeave={handleDragDocx}
                onDragOver={handleDragDocx}
                onDrop={handleDropDocx}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  Drag & drop file DOCX
                </p>
                <p className="text-gray-500 mb-6">Atau pilih dari komputer Anda</p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all h-11"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih File DOCX
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Format: .docx | Maksimal: 10MB
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-6 animate-in fade-in duration-300 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <File className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">
                        {selectedDocxFile.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatFileSize(selectedDocxFile.size)}
                      </p>
                      <div className="flex items-center mt-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-700 font-medium">
                          File siap diupload
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDocxFile}
                    disabled={uploading}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: PDF File Upload Area (Required) */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <Label className="text-lg font-semibold text-gray-900">
                File PDF Turnitin <span className="text-red-500">*</span>
              </Label>
            </div>

            {!selectedPdfFile ? (
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${dragActivePdf
                  ? 'border-purple-400 bg-purple-50 scale-105'
                  : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                  }`}
                onDragEnter={handleDragPdf}
                onDragLeave={handleDragPdf}
                onDragOver={handleDragPdf}
                onDrop={handleDropPdf}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelectPdf(e.target.files[0])
                    }
                  }}
                  className="hidden"
                  disabled={uploading}
                  id="pdf-input"
                />
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  Drag & drop file PDF
                </p>
                <p className="text-gray-500 mb-6">File hasil Turnitin diperlukan untuk analisis</p>
                <Button
                  type="button"
                  onClick={() => document.getElementById('pdf-input')?.click()}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all h-11"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih File PDF
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Format: .pdf | Maksimal: 10MB
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-6 animate-in fade-in duration-300 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <File className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">
                        {selectedPdfFile.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatFileSize(selectedPdfFile.size)}
                      </p>
                      <div className="flex items-center mt-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-green-700 font-medium">
                          File siap diupload
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePdfFile}
                    disabled={uploading}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedDocxFile || !selectedPdfFile || uploading}
              className="flex-1 h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengupload DOCX + PDF...
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  {selectedDocxFile && selectedPdfFile ? 'Upload DOCX + PDF' : 'Upload Dokumen'}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={uploading}
              className="px-8 h-14 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-6 h-6 bg-amber-500 rounded-full mr-3 flex items-center justify-center text-xs text-white font-bold">i</div>
              Informasi Penting
            </h4>
            <ul className="text-sm text-gray-700 space-y-3">
              <li className="flex items-start">
                <span className="text-amber-600 mr-3 font-bold text-lg">✓</span>
                <span>File DOCX original <strong>wajib</strong> diunggah</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-3 font-bold text-lg">✓</span>
                <span>File PDF dari Turnitin <strong>wajib</strong> diunggah untuk analisis</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-3 font-bold text-lg">✓</span>
                <span>Ukuran file maksimal <strong>10MB</strong> per file</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-3 font-bold text-lg">✓</span>
                <span>Pastikan dokumen tidak terpassword</span>
              </li>
              <li className="flex items-start">
                <span className="text-amber-600 mr-3 font-bold text-lg">✓</span>
                <span>Setelah upload, kedua dokumen akan dianalisis secara otomatis</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
