import { useState } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
  
      {/* Sidebar — desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Sidebar — mobile (slide in) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 md:hidden transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
