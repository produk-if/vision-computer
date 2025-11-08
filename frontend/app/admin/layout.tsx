'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  LogOut,
  Package,
  Activity,
  FileCheck,
  Settings,
  Database,
} from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat Dashboard Admin...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const menuItems = [
    { key: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { key: '/admin/jobs', label: 'Job Monitor', icon: Activity },
    { key: '/admin/approvals', label: 'Approval Dokumen', icon: FileCheck },
    { key: '/admin/documents', label: 'Dokumen', icon: FileText },
    { key: '/admin/users', label: 'Pengguna', icon: Users },
    { key: '/admin/packages', label: 'Paket & Harga', icon: Package },
    { key: '/admin/payments', label: 'Verifikasi Pembayaran', icon: CreditCard },
    { key: '/admin/master-data', label: 'Master Data', icon: Database },
    { key: '/admin/settings', label: 'Pengaturan', icon: Settings },
  ]

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard'
    if (pathname === '/admin/jobs') return 'Job Monitor'
    if (pathname === '/admin/approvals') return 'Approval Dokumen'
    if (pathname === '/admin/payments') return 'Verifikasi Pembayaran'
    if (pathname === '/admin/documents') return 'Dokumen'
    if (pathname === '/admin/users') return 'Pengguna'
    if (pathname === '/admin/packages') return 'Paket & Harga'
    if (pathname === '/admin/master-data') return 'Master Data'
    if (pathname === '/admin/settings') return 'Pengaturan Sistem'
    return 'Admin Panel'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Sidebar - Fixed with Border Radius */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white transition-all duration-300 flex flex-col fixed left-4 top-4 bottom-4 z-40 rounded-2xl shadow-lg border border-gray-200`}>
        {/* Logo Section - Clickable to Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-20 flex items-center justify-center px-4 border-b border-gray-200 bg-white rounded-t-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          {sidebarOpen ? (
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">📄</span>
              </div>
              <div className="flex-1 text-left">
                <span className="text-lg font-bold text-brand-navy-dark">Admin Panel</span>
                <p className="text-xs text-brand-navy">Rumah Plagiasi</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">📄</span>
            </div>
          )}
        </button>

        {/* Navigation Menu - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Main Menu Section */}
          {sidebarOpen && (
            <div className="mb-2">
              <p className="px-4 text-xs font-semibold text-brand-teal uppercase tracking-wider mb-2">Menu Utama</p>
            </div>
          )}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.key)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`${isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-navy hover:bg-brand-secondary'
                    } w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 rounded-lg transition-all`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User Info & Logout - Separated at Bottom */}
        <div className="p-4 border-t border-gray-200 bg-brand-secondary/30 rounded-b-2xl">
          {sidebarOpen && (
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-brand-navy-dark truncate">{session.user.name}</p>
              <p className="text-xs text-brand-navy truncate">{session.user.email}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title={!sidebarOpen ? 'Keluar' : undefined}
            className={`w-full flex items-center ${sidebarOpen ? 'space-x-3 px-4' : 'justify-center px-2'} py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area - Completely Separated */}
      <div className={`${sidebarOpen ? 'ml-72' : 'ml-28'} transition-all duration-300 min-h-screen flex flex-col`}>
        {/* Header - Fixed with Border Radius */}
        <header className="h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-between px-6 sticky top-4 z-30 shadow-lg mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-brand-navy-dark">{getPageTitle()}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification Icon */}
            <button className="p-2 hover:bg-brand-secondary rounded-lg transition-colors relative">
              <svg className="w-5 h-5 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* User Info */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-brand-navy-dark">{session.user.name}</p>
                <p className="text-xs text-brand-navy">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center ring-2 ring-brand-primary/20">
                <span className="text-brand-primary font-bold text-sm">{session.user.name?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg min-h-[calc(100vh-6rem)] p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
