import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

export default function FileDropzone({
  onFiles,
  accept = ACCEPTED,
  label = 'Drop PDF / TXT / DOCX files here',
  sublabel = 'or click to browse',
  disabled = false,
}) {
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState([])

  const onDrop = useCallback(
    (accepted, rejected) => {
      const rejErrs = rejected.flatMap((r) =>
        r.errors.map((e) => `${r.file.name}: ${e.message}`)
      )
      setErrors(rejErrs)

      const merged = [...files]
      accepted.forEach((f) => {
        if (!merged.find((x) => x.name === f.name && x.size === f.size)) {
          merged.push(f)
        }
      })
      setFiles(merged)
      onFiles?.(merged)
    },
    [files, onFiles],
  )

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx)
    setFiles(updated)
    onFiles?.(updated)
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    disabled,
  })

  const zoneBg = isDragReject
    ? 'rgba(254,242,242,1)'
    : isDragActive
    ? 'rgba(245,243,255,1)'
    : 'rgba(249,250,251,0.8)'

  const zoneBorder = isDragReject
    ? '#ef4444'
    : isDragActive
    ? '#7c3aed'
    : 'rgba(124,58,237,0.2)'

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition-all duration-300 group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          background: isDragActive
            ? 'linear-gradient(135deg, rgba(245,243,255,0.9), rgba(239,246,255,0.9))'
            : 'rgba(249,250,251,0.8)',
          borderColor: zoneBorder,
          transform: isDragActive ? 'scale(1.01)' : 'scale(1)',
          boxShadow: isDragActive ? '0 8px 30px rgba(124,58,237,0.12)' : 'none',
        }}
      >
        <input {...getInputProps()} />

        {/* Pulsing ring when dragging */}
        {isDragActive && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: '2px solid rgba(124,58,237,0.4)' }}
            animate={{ scale: [1, 1.02, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {/* Icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-105"
          style={{
            background: isDragActive
              ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
              : 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))',
            border: `1.5px solid ${isDragActive ? 'transparent' : 'rgba(124,58,237,0.2)'}`,
            boxShadow: isDragActive ? '0 8px 24px rgba(124,58,237,0.25)' : 'none',
          }}
          animate={isDragActive ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <Upload
            size={22}
            className="transition-colors"
            style={{ color: isDragActive ? 'white' : '#7c3aed' }}
          />
        </motion.div>

        <p className="font-semibold mb-1 text-sm transition-colors"
          style={{ color: isDragActive ? '#6d28d9' : '#374151' }}>
          {isDragActive ? 'Release to upload!' : label}
        </p>
        <p className="text-gray-400 text-xs">{sublabel}</p>
        
      </div>

      {/* Validation errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1"
          >
            {errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-red-600 rounded-xl px-3 py-2"
                style={{ background: 'rgba(254,242,242,1)', border: '1px solid rgba(220,38,38,0.2)' }}
              >
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                {err}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
            {files.map((f, i) => (
              <motion.li
                key={`${f.name}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 group"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,243,255,0.8), rgba(239,246,255,0.8))',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <FileText size={14} className="text-violet-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-xs font-semibold truncate">{f.name}</p>
                  <p className="text-gray-400 text-xs">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
                <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                {!disabled && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
