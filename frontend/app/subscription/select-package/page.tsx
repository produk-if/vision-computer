'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface Package {
  id: string
  code: string
  name: string
  description: string
  price: number
  currency: string
  features: string[]
  maxDocuments: number
  maxFileSize: number
  validityDays: number
  order: number
}

export default function SelectPackagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      checkProfileCompletion()
    }
  }, [status, router])

  const checkProfileCompletion = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()

      if (data.success) {
        const profile = data.data.profile

        // Check if required profile fields are completed
        if (!profile || !profile.fullName || !profile.phone || !profile.institution || !profile.faculty || !profile.major) {
          // Profile incomplete, redirect to complete-profile
          router.push('/subscription/complete-profile')
          return
        }

        // Profile complete, fetch packages
        fetchPackages()
      } else {
        // Error fetching profile, redirect to complete-profile
        router.push('/subscription/complete-profile')
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      router.push('/subscription/complete-profile')
    }
  }

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      const data = await response.json()

      if (data.success) {
        setPackages(data.data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId)
  }

  const handleContinue = () => {
    if (selectedPackage) {
      router.push(`/subscription/payment?packageId=${selectedPackage}`)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat paket...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">🏠</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Rumah Plagiasi
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pilih Paket Berlangganan
          </h1>
          <p className="text-lg text-gray-600">
            Pilih paket yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative p-8 cursor-pointer transition-all duration-200 border-2 ${selectedPackage === pkg.id
                  ? 'ring-2 ring-blue-600 shadow-xl transform scale-105'
                  : 'hover:shadow-lg'
                }`}
              onClick={() => handleSelectPackage(pkg.id)}
            >
              {/* Popular Badge for middle package */}
              {pkg.code === 'HASIL' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Populer
                  </span>
                </div>
              )}

              {/* Selected Indicator */}
              {selectedPackage === pkg.id && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="h-8 w-8 text-blue-600" />
                </div>
              )}

              {/* Package Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {pkg.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(pkg.price)}
                  </span>
                  <span className="text-gray-500 ml-2">
                    / {pkg.validityDays} hari
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                {pkg.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Select Button */}
              <Button
                className={`w-full h-11 font-semibold shadow-lg transition-all ${selectedPackage === pkg.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl'
                    : 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 border-2 border-blue-600 hover:border-purple-600'
                  }`}
                onClick={() => handleSelectPackage(pkg.id)}
              >
                {selectedPackage === pkg.id ? 'Dipilih' : 'Pilih Paket'}
              </Button>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        {selectedPackage && (
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 h-12 font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleContinue}
            >
              Lanjut ke Pembayaran
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Butuh bantuan? Hubungi customer service kami
          </p>
        </div>
      </div>
    </div>
  )
}
