import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Trash2 } from 'lucide-react'
import { Spinner } from './Loader'

const CONFIRM_WORD = 'DELETE'

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, filename, isDeleting }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)
  const isReady = inputValue === CONFIRM_WORD

  useEffect(() => {
    if (!isOpen) {
      setInputValue('')
    } else {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !isDeleting) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDeleting, onClose])

  const handleConfirm = () => {
    if (isReady && !isDeleting) onConfirm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop - light overlay */}
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(30,27,75,0.35)' }}
            onClick={() => !isDeleting && onClose()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal card */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              border: '1px solid rgba(239,68,68,0.25)',
              boxShadow: '0 20px 60px rgba(99,102,241,0.12), 0 8px 24px rgba(239,68,68,0.08)',
            }}
            initial={{ scale: 0.88, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          >
            {/* Top gradient strip */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #ef4444, #dc2626, #b91c1c)' }} />

            <div className="p-6">
              {/* Close button */}
              {!isDeleting && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X size={17} />
                </button>
              )}

              {/* Warning icon */}
              <div className="flex justify-center mb-5">
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(254,242,242,1), rgba(255,237,213,0.5))',
                    border: '1.5px solid rgba(239,68,68,0.25)',
                  }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <AlertTriangle size={30} className="text-red-500" />
                </motion.div>
              </div>

              {/* Heading */}
              <h3 className="text-base font-bold text-center mb-1" style={{ color: '#1e1b4b' }}>
                Delete File
              </h3>
              <p className="text-xs text-center mb-3" style={{ color: '#6b7280' }}>
                You are about to permanently delete:
              </p>

              {/* Filename chip */}
              <div
                className="rounded-xl px-3 py-2 mb-3 text-center break-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(254,242,242,1), rgba(255,237,213,0.3))',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <span className="text-red-600 font-semibold text-xs">"{filename}"</span>
              </div>

              {/* Warning text */}
              {/* <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: '#9ca3af' }}>
                All vector embeddings for this file will be{' '}
                <span className="text-red-500 font-semibold">permanently removed</span>{' '}
                from the knowledge base. This action{' '}
                <span className="text-red-500 font-semibold">cannot be undone</span>.
              </p> */}

              {/* Confirmation input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                  Type{' '}
                  <code
                    className="font-bold px-1.5 py-0.5 rounded text-red-600"
                    style={{ background: 'rgba(254,242,242,1)', fontSize: '0.72rem' }}
                  >
                    DELETE
                  </code>{' '}
                  to confirm:
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="Type DELETE here…"
                  disabled={isDeleting}
                  className="w-full rounded-xl px-3 py-2.5 font-mono text-xs outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isReady ? 'rgba(254,242,242,0.8)' : 'white',
                    border: isReady
                      ? '1.5px solid rgba(239,68,68,0.5)'
                      : '1.5px solid #e5e7eb',
                    color: '#1e1b4b',
                    boxShadow: isReady ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
                  }}
                />
                {inputValue.length > 0 && !isReady && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1">
                    Must type "DELETE" exactly (case-sensitive)
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: 'white',
                    border: '1.5px solid #e5e7eb',
                    color: '#374151',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!isReady || isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 px-5 rounded-xl transition-all duration-200"
                  style={isReady && !isDeleting
                    ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', boxShadow: '0 4px 14px rgba(239,68,68,0.3)', border: 'none' }
                    : { background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'not-allowed' }
                  }
                >
                  {isDeleting ? (
                    <>
                      <Spinner size="sm" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
