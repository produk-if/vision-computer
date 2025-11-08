'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [identifier, setIdentifier] = useState('') // username or email
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Redirect jika sudah login
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('[Login] 🔐 User sudah login, redirect ke dashboard')
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Auto-fill identifier from registration redirect
  useEffect(() => {
    const registered = searchParams.get('registered')
    const identifierParam = searchParams.get('identifier')

    if (registered === 'true') {
      setShowSuccessMessage(true)
      // Auto-hide success message after 10 seconds
      setTimeout(() => setShowSuccessMessage(false), 10000)
    }

    if (identifierParam) {
      setIdentifier(decodeURIComponent(identifierParam))
      // Auto-focus password field if identifier is pre-filled
      setTimeout(() => {
        const passwordInput = document.getElementById('password')
        if (passwordInput) {
          passwordInput.focus()
        }
      }, 100)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier, // Send as identifier (can be username or email)
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check if error is about account being disabled
        if (result.error.includes('dinonaktifkan') || result.error.includes('ditangguhkan')) {
          setError('🚫 Akun Anda telah ditangguhkan oleh administrator. Silakan hubungi admin untuk informasi lebih lanjut.')
        } else {
          setError('Username/email atau password salah')
        }
      } else {
        // Fetch user account status to determine redirect
        const statusResponse = await fetch('/api/user/account-status')
        const statusData = await statusResponse.json()

        if (statusData.success) {
          // Redirect based on account status
          router.push(statusData.data.redirectUrl)
          router.refresh()
        } else {
          // Fallback to dashboard
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-brand-blue-light/30">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-300 opacity-20 mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium mt-4">Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-brand-blue-light/30">
      <div className="flex w-full max-w-7xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        {/* Left Side - Visual/Branding */}
        <div className="hidden lg:flex lg:w-[30%] bg-gradient-to-br from-brand-blue-dark to-brand-blue relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center w-full px-8 text-white">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 shadow-2xl mx-auto">
                <span className="text-4xl">🏠</span>
              </div>
              <h1 className="text-3xl font-bold mb-3 text-center text-white">Rumah Plagiasi</h1>
              <p className="text-white/90 text-sm text-center">
                Platform terpercaya untuk membantu Anda melewati sistem deteksi plagiarism dengan aman dan mudah.
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-3 mt-8 w-full">
              <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1 text-white">1000+</div>
                <div className="text-white/80 text-xs">Dokumen Diproses</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1 text-white">98%</div>
                <div className="text-white/80 text-xs">Sukses Rate</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold mb-1 text-white">24/7</div>
                <div className="text-white/80 text-xs">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-[70%] flex items-center justify-center p-8 bg-white overflow-y-auto">
          <div className="w-full max-w-lg">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-brand-blue-dark rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold">🏠</span>
                </div>
                <span className="text-2xl font-bold text-brand-navy-dark">Rumah Plagiasi</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-brand-navy-dark mb-2">Selamat Datang Kembali</h2>
              <p className="text-brand-navy">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {showSuccessMessage && (
                <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Registrasi berhasil!</strong> Silakan login dengan akun yang baru Anda buat.
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSuccessMessage(false)}
                    className="ml-auto text-green-700 hover:text-green-900"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}

              {error && (
                <div className={`p-4 rounded-lg border ${error.includes('ditangguhkan')
                    ? 'bg-orange-50 border-orange-300 text-orange-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                  <div className="flex items-start">
                    {error.includes('ditangguhkan') ? (
                      <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1">
                        {error.includes('ditangguhkan') ? '⚠️ Akun Ditangguhkan' : 'Error'}
                      </p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-brand-navy-dark font-medium">Username atau Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="username atau nama@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 text-base border-brand-blue/20 focus:border-brand-blue focus:ring-brand-blue/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-brand-navy-dark font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 text-base pr-12 border-brand-blue/20 focus:border-brand-blue focus:ring-brand-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy hover:text-brand-blue focus:outline-none z-10 cursor-pointer"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-brand-blue-dark hover:bg-brand-blue text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </div>
                ) : (
                  'Masuk'
                )}
              </Button>

              <div className="text-center space-y-4">
                <p className="text-sm text-brand-navy">
                  Belum punya akun?{' '}
                  <Link href="/auth/register" className="text-brand-blue-dark hover:text-brand-blue font-semibold hover:underline">
                    Daftar Sekarang
                  </Link>
                </p>
                <Link href="/" className="text-sm text-brand-navy hover:text-brand-blue transition block">
                  ← Kembali ke Beranda
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
