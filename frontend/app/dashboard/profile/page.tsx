'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Phone, Building, Save } from 'lucide-react'
// import { SessionManager } from '@/components/session-manager' // Hidden - silent monitoring

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [formData, setFormData] = useState({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    institution: '',
  })

  // Load user profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/profile/update', {
          method: 'GET',
        })

        const data = await response.json()

        if (data.success && data.data) {
          setFormData((prev) => ({
            ...prev,
            fullName: data.data.fullName || prev.fullName,
            phone: data.data.phone || '',
            institution: data.data.institution || '',
          }))
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [session?.user?.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      toast({
        variant: 'warning',
        title: 'Peringatan',
        description: 'Nama lengkap harus diisi',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          institution: formData.institution,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          variant: 'success',
          title: 'Berhasil',
          description: 'Profil berhasil diperbarui',
        })
      } else {
        throw new Error(data.error || 'Gagal memperbarui profil')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal memperbarui profil',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profil Saya</h2>
          <p className="text-gray-500 text-xs">Kelola informasi profil Anda</p>
        </div>

        {/* Profile Header */}
        <Card className="mb-4 shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#3674B5] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {session?.user?.name || 'User'}
                </h1>
                <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                  {session?.user?.role === 'ADMIN' ? 'Admin' : 'User'}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                  Terverifikasi
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="shadow-sm border border-gray-200 rounded-xl">
          <CardContent className="pt-4 pb-4">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Memuat profil...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-1.5" />
                  Informasi Profil
                </h3>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-medium text-gray-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap"
                    className="h-9 text-sm"
                    disabled={loading}
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700 flex items-center">
                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                    Email
                  </Label>
                  <div className="h-9 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center text-sm text-gray-600">
                    {formData.email}
                  </div>
                  <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-gray-700 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Masukkan nomor telepon"
                    className="h-9 text-sm"
                    disabled={loading}
                  />
                </div>

                {/* Institution */}
                <div className="space-y-1.5">
                  <Label htmlFor="institution" className="text-xs font-medium text-gray-700 flex items-center">
                    <Building className="h-3 w-3 mr-1 text-gray-400" />
                    Institusi / Organisasi
                  </Label>
                  <Input
                    id="institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    placeholder="Masukkan institusi atau organisasi"
                    className="h-9 text-sm"
                    disabled={loading}
                  />
                </div>

                {/* Save Button */}
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="w-full h-9 text-sm bg-[#3674B5] hover:bg-[#578FCA] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Management - Hidden from users */}
        {/* <div className="mt-4">
          <SessionManager />
        </div> */}
      </div>
    </div>
  )
}
