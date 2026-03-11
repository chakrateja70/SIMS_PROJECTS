import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Home, Database, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/home', label: 'Home', icon: Home, desc: 'Chat & Summarize' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: Database, desc: 'Manage documents' },
]

export default function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 inset-x-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(124,58,237,0.12)',
        boxShadow: '0 2px 24px rgba(99,102,241,0.08)',
      }}
    >
      {/* Gradient top bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#4f46e5,#2563eb,#06b6d4)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15 py-2.5">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              whileHover={{ scale: 1.1, rotate: 6 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <FileText size={15} className="text-white" />
            </motion.div>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="font-extrabold text-sm gradient-text">PDF Q&A</span>
              <span className="text-gray-400 text-[10px] -mt-0.5 font-medium">AI Assistant</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-250
                    ${active
                      ? 'text-violet-700'
                      : 'text-gray-500 hover:text-violet-700'
                    }`}
                >
                  <Icon size={15} />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-0 rounded-xl -z-10"
                      style={{
                        background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(79,70,229,0.08))',
                        border: '1.5px solid rgba(124,58,237,0.2)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-gray-500 hover:text-violet-700 p-2 rounded-xl hover:bg-violet-50 transition-all"
            aria-label="Toggle menu"
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: '1px solid rgba(124,58,237,0.1)', background: 'rgba(255,255,255,0.97)' }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV.map(({ to, label, icon: Icon, desc }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                      ${active
                        ? 'text-violet-700 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200'
                        : 'text-gray-500 hover:text-violet-700 hover:bg-violet-50'
                      }`}
                  >
                    <Icon size={16} className={active ? 'text-violet-600' : ''} />
                    <div>
                      <div>{label}</div>
                      <div className="text-xs text-gray-400 font-normal">{desc}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

