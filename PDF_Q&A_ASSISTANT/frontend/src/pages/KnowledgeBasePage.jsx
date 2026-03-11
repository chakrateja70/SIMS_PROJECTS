import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Database, FileText, Trash2, RefreshCw, Search, AlertCircle,
  FileArchive, Clock, BarChart2, Upload, Info, X, CheckCircle2,
} from 'lucide-react'
import { listKnowledgeBase, deleteKnowledgeBaseFile, uploadFiles } from '../services/api'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { Spinner } from '../components/Loader'
import FileDropzone from '../components/FileDropzone'

const EXT_COLORS = {
  pdf: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
  txt: { color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.2)' },
  docx: { color: '#2563eb', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.2)' },
}

function extStyle(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase()
  return EXT_COLORS[ext] || { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' }
}

function validateFiles(files) {
  if (!files || files.length === 0) return 'Please select at least one file to upload.'
  const MAX_SIZE = 50 * 1024 * 1024
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pdf', 'txt', 'docx'].includes(ext))
      return `Unsupported file type: .${ext}. Allowed: PDF, TXT, DOCX.`
    if (f.size > MAX_SIZE)
      return `File "${f.name}" exceeds 50 MB size limit.`
  }
  return null
}

const SESSION_KEY = 'kb_cache'

// ── Upload Modal ────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const overlayRef = useRef(null)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleUpload = async () => {
    const err = validateFiles(files)
    if (err) { toast.error(err); return }
    setUploading(true)
    const toastId = toast.loading(`Uploading ${files.length} file(s)…`)
    try {
      const res = await uploadFiles(files)
      setResult(res)
      toast.success(`${res.vectors_stored} vectors stored!`, { id: toastId })
      setFiles([])
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Upload failed.', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      ref={overlayRef}
      onClick={handleOverlayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,10,40,0.45)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'white', border: '1px solid rgba(124,58,237,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Upload size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#1e1b4b' }}>Upload Documents</h2>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Add PDF, TXT, or DOCX to your knowledge base</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ color: '#9ca3af' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.1))', border: '2px solid rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle2 size={30} style={{ color: '#059669' }} />
                </motion.div>
                <div className="text-center">
                  <p className="font-bold text-base mb-1" style={{ color: '#059669' }}>Upload Successful!</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Documents have been indexed and are ready for Q&A</p>
                </div>
                <div className="w-full grid grid-cols-2 gap-3">
                  {[
                    { label: 'Pages Processed', value: result.documents_processed },
                    { label: 'Vectors Stored', value: result.vectors_stored },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl p-4 text-center"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div className="text-3xl font-black" style={{ color: '#059669' }}>{s.value}</div>
                      <div className="text-xs mt-1" style={{ color: '#6b7280' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 w-full mt-1">
                  <button onClick={() => setResult(null)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#6d28d9' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
                  >
                    Upload More
                  </button>
                  <button onClick={onClose} className="flex-1 btn-primary py-2.5 justify-center text-sm">
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                <FileDropzone onFiles={setFiles} maxFiles={10} disabled={uploading} />
                {files.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs flex items-center gap-1.5" style={{ color: '#9ca3af' }}
                  >
                    <Info size={11} />
                    {files.length} file{files.length > 1 ? 's' : ''} selected — processing may take 30–90 seconds.
                  </motion.p>
                )}
                <div className="flex gap-3">
                  <button onClick={onClose}
                    className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all"
                    style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#6d28d9' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0}
                    className="flex-1 btn-primary justify-center py-3 disabled:opacity-50"
                  >
                    {uploading ? <Spinner size="sm" white /> : <Upload size={15} />}
                    {uploading ? 'Processing…' : `Upload ${files.length > 0 ? files.length + ' file(s)' : ''}`}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function KnowledgeBasePage() {
  const [files, setFiles] = useState([])
  const [totalVectors, setTotalVectors] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const applyData = (data) => {
    if (Array.isArray(data)) {
      setFiles(data)
    } else {
      setFiles(data.files || [])
      if (data.total_vectors !== undefined) setTotalVectors(data.total_vectors)
    }
  }

  const fetchFiles = useCallback(async (force = false) => {
    // Use session cache unless forced refresh
    if (!force) {
      const cached = sessionStorage.getItem(SESSION_KEY)
      if (cached) {
        try {
          applyData(JSON.parse(cached))
          setLoading(false)
          return
        } catch (_) {}
      }
    }
    setLoading(true)
    setError('')
    try {
      const data = await listKnowledgeBase()
      applyData(data)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    } catch (err) {
      setError(err.message || 'Failed to load knowledge base.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const toastId = toast.loading(`Deleting "${deleteTarget}"…`)
    try {
      await deleteKnowledgeBaseFile(deleteTarget)
      toast.success(`"${deleteTarget}" removed.`, { id: toastId })
      setDeleteTarget(null)
      sessionStorage.removeItem(SESSION_KEY)
      fetchFiles(true)
    } catch (err) {
      toast.error(err.message || 'Delete failed.', { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUploadSuccess = () => {
    sessionStorage.removeItem(SESSION_KEY)
    fetchFiles(true)
  }

  const filtered = files.filter((f) =>
    (typeof f === 'string' ? f : f.filename || '').toLowerCase().includes(search.toLowerCase())
  )

  const getName = (f) => (typeof f === 'string' ? f : f.filename || String(f))

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
          >
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: '#1e1b4b' }}>Knowledge Base</h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>Manage the documents indexed in your vector store</p>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
      >
        {[
          { icon: FileArchive, label: 'Documents', value: loading ? '—' : files.length, color: '#7c3aed' },
          { icon: BarChart2, label: 'Vectors Stored', value: loading ? '—' : (totalVectors !== null ? totalVectors.toLocaleString() : '—'), color: '#0891b2' },
          { icon: Clock, label: 'Last Refreshed', value: 'Just now', color: '#059669' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'white',
              border: '1px solid rgba(124,58,237,0.1)',
              boxShadow: '0 2px 10px rgba(99,102,241,0.05)',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: color + '15', border: `1px solid ${color}25` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="text-lg font-black font-mono leading-tight" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color: '#9ca3af' }}>{label}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="flex items-center gap-3 mb-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by filename…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'white',
              border: '1.5px solid #e5e7eb',
              color: '#374151',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchFiles(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            color: '#6b7280',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#6d28d9' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
        >
          {loading ? <Spinner size="sm" /> : <RefreshCw size={14} />}
          Refresh
        </button>

        {/* Open upload modal */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary px-4 py-2.5 text-sm"
        >
          <Upload size={14} />
          Upload
        </button>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid rgba(124,58,237,0.1)',
          boxShadow: '0 2px 16px rgba(99,102,241,0.06)',
        }}
      >
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Loading knowledge base…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={22} className="text-red-500" />
            </div>
            <p className="font-semibold text-sm" style={{ color: '#dc2626' }}>{error}</p>
            <button onClick={() => fetchFiles()} className="btn-primary text-sm">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.06))',
                border: '1.5px solid rgba(124,58,237,0.15)',
              }}
            >
              <Database size={28} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <p className="font-bold text-base mb-1" style={{ color: '#1e1b4b' }}>No documents indexed yet</p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>Upload PDF, TXT, or DOCX files to build your knowledge base.</p>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="btn-primary text-sm">
              <Upload size={13} /> Upload Documents
            </button>
          </div>
        )}

        {/* No search match */}
        {!loading && !error && files.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Search size={22} style={{ color: '#d1d5db' }} />
            <p className="text-sm" style={{ color: '#9ca3af' }}>No files match "{search}"</p>
          </div>
        )}

        {/* File list */}
        {!loading && !error && filtered.length > 0 && (
          <ul>
            <AnimatePresence initial={false}>
              {filtered.map((file, i) => {
                const name = getName(file)
                const style = extStyle(name)
                const ext = name.split('.').pop().toUpperCase()
                const vectorCount = typeof file === 'object' && file.vector_count != null
                  ? file.vector_count
                  : null

                return (
                  <motion.li
                    key={name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-4 group transition-colors duration-150"
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(124,58,237,0.06)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,243,255,0.5)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: style.bg, border: `1px solid ${style.border}` }}
                    >
                      <FileText size={16} style={{ color: style.color }} />
                    </div>

                    {/* Name + badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1e1b4b' }}>{name}</p>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                        >
                          {ext}
                        </span>
                      </div>
                      {vectorCount !== null && (
                        <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                          {vectorCount.toLocaleString()} vectors
                        </p>
                      )}
                    </div>

                    {/* Delete */}
                    <motion.button
                      onClick={() => setDeleteTarget(name)}
                      className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0"
                      style={{ color: '#d1d5db' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'transparent' }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`Delete ${name}`}
                    >
                      <Trash2 size={15} />
                    </motion.button>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>

      {/* Footer count */}
      {!loading && !error && files.length > 0 && (
        <p className="text-xs text-center mt-4" style={{ color: '#d1d5db' }}>
          {filtered.length} of {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Upload modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => { if (!isDeleting) setDeleteTarget(null) }}
        onConfirm={handleDelete}
        filename={deleteTarget || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}
