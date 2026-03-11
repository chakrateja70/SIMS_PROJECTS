import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send, MessageSquare, BookOpen, Upload, Trash2,
  FileText, ChevronDown, ChevronUp, Cpu, Info,
  Database, Sparkles, ArrowRight, Zap, Plus, History, Clock,
} from 'lucide-react'
import { queryRAG, summarizeContent } from '../services/api'
import FileDropzone from '../components/FileDropzone'
import { Spinner, TypingIndicator } from '../components/Loader'

// ── Validation helpers ──────────────────────────────────────────

function validateQuery(q) {
  if (!q || !q.trim()) return 'Query cannot be empty.'
  if (q.trim().length < 3) return 'Query is too short. Please be more descriptive.'
  if (q.trim().length > 2000) return 'Query is too long (max 2000 characters).'
  return null
}

// ── Message bubble ──────────────────────────────────────────────

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  const [showSources, setShowSources] = useState(false)
  // Hide sources if answer is 'not enough information' or similar
  const answer = msg.content?.toLowerCase() || '';
  const hideSources = answer.includes('not enough information') || answer.includes('could not find') || answer.includes('no relevant') || answer.includes('insufficient') || answer.includes('not found');
  const hasSources = !isUser && msg.sources && msg.sources.length > 0 && !hideSources;

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-2xl shrink-0 mr-3 mt-0.5 flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}
        >
          <Cpu size={13} className="text-white" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'ml-4' : 'mr-4'}`}>
        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={isUser
            ? {
                background: 'linear-gradient(135deg, #1d4ed8, #0284c7)',
                color: 'white',
                borderBottomRightRadius: '6px',
                boxShadow: '0 4px 14px rgba(29,78,216,0.25)',
              }
            : {
                background: 'rgba(248,250,252,0.95)',
                color: '#374151',
                borderBottomLeftRadius: '6px',
                border: '1px solid rgba(29,78,216,0.1)',
                boxShadow: '0 2px 8px rgba(29,78,216,0.06)',
              }
          }
        >
          {isUser ? (
            <p>{msg.content}</p>
          ) : msg.isTyping ? (
            <TypingIndicator />
          ) : (
            <div className="md-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources accordion */}
        {hasSources && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: showSources ? '#7c3aed' : '#9ca3af' }}
            >
              <FileText size={11} />
              {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            <AnimatePresence>
              {showSources && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1.5 flex flex-wrap gap-1.5 overflow-hidden"
                >
                  {msg.sources.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full border"
                      style={{
                        background: 'rgba(124,58,237,0.08)',
                        borderColor: 'rgba(124,58,237,0.2)',
                        color: '#7c3aed',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[9px] mt-1 ${isUser ? 'text-right' : ''}`} style={{ color: '#a1a1aa', opacity: 0.85 }}>
          {msg.time}
        </p>
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="w-8 h-8 rounded-2xl shrink-0 ml-3 mt-0.5 flex items-center justify-center text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(29,78,216,0.12), rgba(2,132,199,0.08))',
            border: '1.5px solid rgba(29,78,216,0.2)',
            color: '#1d4ed8',
          }}
        >
          U
        </div>
      )}
    </motion.div>
  )
}

// ── Summarize panel ─────────────────────────────────────────────

function SummarizePanel() {
  const [summaryFile, setSummaryFile] = useState([])
  const [summaryText, setSummaryText] = useState('')
  const [style, setStyle] = useState('detailed')
  const [inputMode, setInputMode] = useState(null) // null | 'file' | 'text'
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summaryHistory, setSummaryHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const historyRef = useRef(null)

  useEffect(() => {
    if (!showHistory) return;
    function handleClick(e) {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showHistory]);

  const newSummary = () => {
    if (result) {
      setSummaryHistory(prev => [{
        id: Date.now(),
        ...result,
        summaryStyle: style,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }, ...prev])
    }
    setResult(null)
    setSummaryFile([])
    setSummaryText('')
    setInputMode(null)
    setError('')
  }

  const STYLES = [
    { value: 'short', label: 'Short', desc: '3-5 sentences' },
    { value: 'detailed', label: 'Detailed', desc: 'All main points' },
    { value: 'bullets', label: 'Bullets', desc: 'Bullet list' },
  ]

  const handleSummarize = async () => {
    setError('')
    const file = summaryFile[0] || null
    const text = summaryText.trim()
    if (!file && !text) { setError('Provide a file OR paste some text to summarize.'); return }
    if (text && text.length < 20) { setError('Text is too short (min 20 characters).'); return }

    setLoading(true)
    setResult(null)
    const toastId = toast.loading('Generating summary')
    try {
      const res = await summarizeContent({ file, text: text || undefined, style })
      if (res.error) { toast.error(res.error, { id: toastId }); setError(res.error); return }
      setResult(res)
      toast.success('Summary ready!', { id: toastId })
    } catch (err) {
      toast.error(err.message, { id: toastId })
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── left-pane controls (always visible) ── */
  const controls = (
    <div className="flex flex-col gap-4">
      {/* New + History actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={newSummary}
          title="New Summary"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(124,58,237,0.08)', color: '#6d28d9', border: '1px solid rgba(124,58,237,0.2)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
        >
          <Plus size={12} /> New
        </button>
        <div className="relative" ref={historyRef}>
          <button
            onClick={() => setShowHistory(v => !v)}
            title="Summary History"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={showHistory
              ? { background: 'rgba(124,58,237,0.12)', color: '#6d28d9', border: '1px solid rgba(124,58,237,0.3)' }
              : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }
            }
            onMouseEnter={e => { if (!showHistory) { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#6d28d9' } }}
            onMouseLeave={e => { if (!showHistory) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' } }}
          >
            <History size={12} /> History
          </button>
          {summaryHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold pointer-events-none"
              style={{ background: '#7c3aed', color: 'white' }}>
              {summaryHistory.length > 9 ? '9+' : summaryHistory.length}
            </span>
          )}
          {showHistory && (
            <div className="absolute left-0 top-9 z-50 w-64 rounded-xl shadow-xl"
              style={{ background: 'white', border: '1px solid rgba(124,58,237,0.15)', maxHeight: '240px', overflowY: 'auto' }}>
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest sticky top-0"
                style={{ color: '#9ca3af', background: 'white', borderBottom: '1px solid #f3f4f6' }}>
                Previous Summaries
              </div>
              {summaryHistory.length === 0 ? (
                <div className="px-4 py-5 text-center text-xs" style={{ color: '#9ca3af' }}>No history yet</div>
              ) : (
                summaryHistory.map(item => (
                  <button key={item.id}
                    onClick={() => { setResult(item); setShowHistory(false) }}
                    className="w-full px-3 py-2.5 text-left border-b last:border-b-0"
                    style={{ borderColor: '#f3f4f6' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div className="text-xs font-medium truncate" style={{ color: '#1e1b4b' }}>
                      {item.filename || 'Text summary'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={9} style={{ color: '#d1d5db' }} />
                      <span className="text-[10px]" style={{ color: '#9ca3af' }}>{item.time}</span>
                      <span className="text-[10px] capitalize px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>{item.summaryStyle}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {/* Input mode selector */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: '#9ca3af' }}>
          Input Source
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'file', icon: Upload, label: 'Upload File' }, { id: 'text', icon: FileText, label: 'Paste Text' }].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setInputMode(inputMode === id ? null : id)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-200"
              style={inputMode === id
                ? { background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.35)', color: '#6d28d9' }
                : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area - animated */}
      <AnimatePresence mode="wait">
        {inputMode === 'file' && (
          <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <FileDropzone onFiles={setSummaryFile} maxFiles={1} label="Drop a file to summarize" sublabel="PDF, TXT or DOCX" disabled={loading} />
          </motion.div>
        )}
        {inputMode === 'text' && (
          <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              disabled={loading}
              rows={5}
              className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none transition-all duration-200 disabled:opacity-50"
              style={{ background: 'white', border: '1.5px solid #e5e7eb', color: '#374151' }}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              placeholder="Paste document text here to summarize"
            />
            <p className="text-xs mt-1 text-right" style={{ color: '#d1d5db' }}>{summaryText.length} chars</p>
          </motion.div>
        )}
        {inputMode === null && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl"
            style={{ background: 'rgba(245,243,255,0.5)', border: '1.5px dashed rgba(124,58,237,0.2)' }}
          >
            <BookOpen size={22} style={{ color: '#c4b5fd' }} />
            <p className="text-sm text-center" style={{ color: '#9ca3af' }}>Select an input source above<br/>to get started</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary style */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: '#9ca3af' }}>
          Summary Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className="py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all duration-200"
              style={style === s.value
                ? { background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.35)', color: '#6d28d9' }
                : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
              }
            >
              <div>{s.label}</div>
              <div className="font-normal text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(254,242,242,1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Info size={13} className="shrink-0 mt-0.5 text-red-500" />
          {error}
        </div>
      )}

      <button onClick={handleSummarize} disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <Spinner size="sm" white /> : <BookOpen size={15} />}
        {loading ? 'Summarizing…' : 'Generate Summary'}
      </button>
    </div>
  )

  /* ── two-column layout when result is ready, single column otherwise ── */
  return (
    <div className={`flex gap-6 h-full ${ result ? 'flex-row' : 'flex-col' }`}>

      {/* Left / single: controls */}
      <div className={`${ result ? 'w-80 shrink-0 overflow-y-auto pr-1' : 'w-full' } flex flex-col`}>
        {controls}
      </div>

      {/* Right: result panel (only when result exists) */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex-1 min-w-0 overflow-y-auto rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245,243,255,0.8), rgba(239,246,255,0.8))',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 z-10 rounded-t-2xl"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(124,58,237,0.1)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  <BookOpen size={13} className="text-white" />
                </div>
                <span className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Summary</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}>
                  {style}
                </span>
                {result.word_count && (
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{result.word_count.toLocaleString()} words</span>
                )}
                <button
                  onClick={() => setResult(null)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                  title="Clear result"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5">
              {result.filename && (
                <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#9ca3af' }}>
                  <FileText size={11} />{result.filename}
                </p>
              )}
              <div className="md-content text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ── Feature landing ─────────────────────────────────────────────

const FEATURES = [
  {
    id: 'chat',
    icon: MessageSquare,
    accentFrom: '#7c3aed',
    accentTo: '#0891b2',
    title: 'Q&A Chat',
    subtitle: 'Ask anything, get instant answers',
    description: 'Chat with your documents using AI-powered retrieval. Get accurate answers with cited sources from your knowledge base.',
    tags: ['Semantic Search', 'Source Citations', 'Multi-Document'],
    sparkle: '#a78bfa',
  },
  {
    id: 'summarize',
    icon: BookOpen,
    accentFrom: '#0891b2',
    accentTo: '#059669',
    title: 'Summarize',
    subtitle: 'Distill documents in seconds',
    description: 'Upload a file or paste text to generate concise, structured summaries. Choose your preferred style.',
    tags: ['File Upload', 'Paste Text', 'Custom Style'],
    sparkle: '#34d399',
  },
]

function FeatureLanding({ onSelect }) {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center h-full px-6 py-12"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Zap size={18} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold mb-3" style={{ color: '#1e1b4b' }}>
          What would you like to do?
        </h1>
        <p className="text-base max-w-md mx-auto" style={{ color: '#6b7280' }}>
          Choose a feature below to get started with your documents
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {FEATURES.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.button
              key={f.id}
              onClick={() => onSelect(f.id)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group relative text-left rounded-3xl p-6 overflow-hidden outline-none cursor-pointer"
              style={{
                background: 'white',
                border: '1.5px solid rgba(124,58,237,0.12)',
                boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
              }}
            >
              {/* Hover gradient overlay */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${f.accentFrom}08, ${f.accentTo}06)` }}
              />

              {/* Sparkle dot */}
              <motion.div
                className="absolute top-4 right-4 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ background: f.sparkle }}
              />

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-md transition-transform duration-300 group-hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${f.accentFrom}, ${f.accentTo})` }}>
                <Icon size={20} className="text-white" />
              </div>

              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-extrabold mb-0.5 transition-colors duration-200"
                    style={{ color: '#1e1b4b' }}>
                    {f.title}
                  </h3>
                  <p className="text-xs font-semibold" style={{ color: f.accentFrom }}>{f.subtitle}</p>
                </div>
                <motion.div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ background: `${f.accentFrom}15`, color: f.accentFrom }}
                >
                  <ArrowRight size={13} />
                </motion.div>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b7280' }}>
                {f.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {f.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ background: `${f.accentFrom}08`, borderColor: `${f.accentFrom}25`, color: f.accentFrom }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* KB hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10"
      >
        <Link to="/knowledge-base"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: '#9ca3af' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
        >
          <Database size={14} />
          Manage your Knowledge Base
          <ArrowRight size={13} />
        </Link>
      </motion.div>
    </motion.div>
  )
}

// ── App sidebar ──────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'chat', label: 'Q&A Chat', icon: MessageSquare, type: 'feature' },
  { id: 'summarize', label: 'Summarize', icon: BookOpen, type: 'feature' },
]

function Sidebar({ active, onSelect }) {
  return (
    <motion.div
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -280, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col shrink-0 h-full"
      style={{
        width: '240px',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(124,58,237,0.1)',
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(124,58,237,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold" style={{ color: '#1e1b4b' }}>PDF Assistant</div>
            <div className="text-[10px]" style={{ color: '#9ca3af' }}>AI-powered Q&A</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-1 p-3 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 mt-1" style={{ color: '#c4b5fd' }}>
          Features
        </p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <motion.button
              key={id}
              onClick={() => onSelect(id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left w-full"
              style={isActive
                ? { background: 'rgba(124,58,237,0.1)', color: '#6d28d9', border: '1px solid rgba(124,58,237,0.2)' }
                : { color: '#6b7280', border: '1px solid transparent' }
              }
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={isActive
                  ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
                  : { background: 'rgba(156,163,175,0.12)' }
                }>
                <Icon size={12} style={{ color: isActive ? 'white' : '#9ca3af' }} />
              </div>
              {label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: '#7c3aed' }}
                />
              )}
            </motion.button>
          )
        })}

        <div className="my-2" style={{ height: '1px', background: 'rgba(124,58,237,0.07)' }} />

        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: '#c4b5fd' }}>
          Data
        </p>
        <Link to="/knowledge-base"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ color: '#6b7280', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6d28d9'; e.currentTarget.style.background = 'rgba(124,58,237,0.06)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(156,163,175,0.12)' }}>
            <Database size={12} style={{ color: '#9ca3af' }} />
          </div>
          Knowledge Base
          <ArrowRight size={11} className="ml-auto" style={{ color: '#c4b5fd' }} />
        </Link>
      </div>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(124,58,237,0.07)' }}>
        <button
          onClick={() => onSelect(null)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ color: '#9ca3af', border: '1px solid #e5e7eb' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#6d28d9' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af' }}
        >
          <ArrowRight size={11} style={{ transform: 'rotate(180deg)' }} />
          Back to home
        </button>
      </div>
    </motion.div>
  )
}

// ── Main page ────────────────────────────────────────────────────

function nowStr() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(null) // null | 'chat' | 'summarize'
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: 'assistant',
      content: "Hello! I'm your PDF Q&A Assistant. Upload documents to the knowledge base and ask me anything about them.",
      time: nowStr(),
      sources: [],
    },
  ])
  const [query, setQuery] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [showChatHistory, setShowChatHistory] = useState(false)
  const chatHistoryRef = useRef(null)

  useEffect(() => {
    if (!showChatHistory) return;
    function handleClick(e) {
      if (chatHistoryRef.current && !chatHistoryRef.current.contains(e.target)) {
        setShowChatHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showChatHistory]);
  const topK = 5
  const minScore = 0.4
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendQuery = useCallback(async () => {
    const err = validateQuery(query)
    if (err) { toast.error(err); return }
    if (chatLoading) return

    const userMsg = { id: Date.now(), role: 'user', content: query.trim(), time: nowStr() }
    const thinkingMsg = { id: Date.now() + 1, role: 'assistant', content: '', isTyping: true, time: nowStr() }
    setMessages((prev) => [...prev, userMsg, thinkingMsg])
    setQuery('')
    setChatLoading(true)

    try {
      const res = await queryRAG(query, topK, minScore)
      const answer = res.answer || 'I could not find an answer in the knowledge base.'
      const sources = res.sources || []
      setMessages((prev) =>
        prev.map((m) => m.id === thinkingMsg.id ? { ...m, content: answer, isTyping: false, sources } : m)
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => m.id === thinkingMsg.id ? { ...m, content: `⚠ Error: ${err.message}`, isTyping: false, sources: [] } : m)
      )
      toast.error(err.message)
    } finally {
      setChatLoading(false)
    }
  }, [query, chatLoading, topK, minScore])

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: "Hello! I'm your PDF Q&A Assistant. Ask me anything about your uploaded documents.",
      time: nowStr(),
      sources: [],
    }])
    toast.success('Chat cleared.')
  }

  const newChat = useCallback(() => {
    const userMsgs = messages.filter(m => m.role === 'user')
    if (userMsgs.length > 0) {
      setChatHistory(prev => [{
        id: Date.now(),
        messages: [...messages],
        title: userMsgs[0].content.length > 45
          ? userMsgs[0].content.slice(0, 45) + '\u2026'
          : userMsgs[0].content,
        time: nowStr(),
      }, ...prev])
    }
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: "Hello! I'm your PDF Q&A Assistant. Ask me anything about your uploaded documents.",
      time: nowStr(),
      sources: [],
    }])
    setQuery('')
    setShowChatHistory(false)
    toast.success('New chat started.')
  }, [messages])

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── Landing ── */}
        {activeFeature === null && (
          <motion.div key="landing" className="flex-1 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FeatureLanding onSelect={(id) => setActiveFeature(id)} />
          </motion.div>
        )}

        {/* ── App mode: Sidebar + Content ── */}
        {activeFeature !== null && (
          <motion.div
            key="app"
            className="flex flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Sidebar */}
            <Sidebar active={activeFeature} onSelect={(id) => setActiveFeature(id)} />

            {/* Main content */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col items-center">
              <AnimatePresence mode="wait">

                {/* ── Q&A Chat panel ── */}
                {activeFeature === 'chat' && (
                  <motion.div
                    key="chat"
                    className="flex flex-col h-full w-full max-w-4xl"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                  >
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-5 py-3.5 shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(124,58,237,0.08)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
                          <MessageSquare size={14} className="text-white" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Q&A Chat</h2>
                          <p className="text-xs" style={{ color: '#9ca3af' }}>Ask questions about your documents</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={newChat}
                          title="New Chat"
                          className="p-2 rounded-xl transition-all"
                          style={{ color: '#9ca3af' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.06)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent' }}
                        >
                          <Plus size={15} />
                        </button>
                        <div className="relative" ref={chatHistoryRef}>
                          <button
                            onClick={() => setShowChatHistory(v => !v)}
                            title="Chat History"
                            className="p-2 rounded-xl transition-all"
                            style={showChatHistory ? { color: '#7c3aed', background: 'rgba(124,58,237,0.08)' } : { color: '#9ca3af' }}
                            onMouseEnter={e => { if (!showChatHistory) { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.06)' } }}
                            onMouseLeave={e => { if (!showChatHistory) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent' } }}
                          >
                            <History size={15} />
                          </button>
                          {chatHistory.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold pointer-events-none"
                              style={{ background: '#7c3aed', color: 'white' }}>
                              {chatHistory.length > 9 ? '9+' : chatHistory.length}
                            </span>
                          )}
                          {showChatHistory && (
                            <div className="absolute right-0 top-10 z-50 w-72 rounded-xl shadow-xl"
                              style={{ background: 'white', border: '1px solid rgba(124,58,237,0.15)', maxHeight: '280px', overflowY: 'auto' }}>
                              <div className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest sticky top-0"
                                style={{ color: '#9ca3af', background: 'white', borderBottom: '1px solid #f3f4f6' }}>
                                Previous Chats
                              </div>
                              {chatHistory.length === 0 ? (
                                <div className="px-4 py-6 text-center text-xs" style={{ color: '#9ca3af' }}>No history yet</div>
                              ) : (
                                chatHistory.map(session => (
                                  <button key={session.id}
                                    onClick={() => { setMessages(session.messages); setShowChatHistory(false) }}
                                    className="w-full px-4 py-3 text-left border-b last:border-b-0"
                                    style={{ borderColor: '#f3f4f6' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.04)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                  >
                                    <div className="text-xs font-medium truncate" style={{ color: '#1e1b4b' }}>{session.title}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Clock size={9} style={{ color: '#d1d5db' }} />
                                      <span className="text-[10px]" style={{ color: '#9ca3af' }}>{session.time}</span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={clearChat}
                          title="Clear Chat"
                          className="p-2 rounded-xl transition-all"
                          style={{ color: '#9ca3af' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4"
                      style={{ background: 'linear-gradient(180deg, rgba(245,243,255,0.3) 0%, rgba(255,255,255,0.5) 100%)' }}>
                      <div className="max-w-2xl mx-auto">
                        {messages.map((msg) => <ChatMessage key={msg.id} msg={msg} />)}
                        <div ref={chatEndRef} />
                      </div>
                    </div>

                    {/* Input bar */}
                    <div className="px-4 py-3.5 shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(12px)',
                        borderTop: '1px solid rgba(124,58,237,0.08)',
                      }}
                    >
                      <div className="flex items-center gap-2.5 max-w-2xl mx-auto">
                        <div className="flex-1 relative">
                          <textarea
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuery() } }}
                            rows={1}
                            disabled={chatLoading}
                            placeholder="Ask something about your documents (Enter to send)"
                            className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none transition-all duration-200 disabled:opacity-60"
                            style={{
                              background: 'white',
                              border: '1.5px solid #e5e7eb',
                              color: '#1e1b4b',
                              minHeight: '44px',
                              maxHeight: '140px',
                              paddingRight: '56px',
                            }}
                            onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)' }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                            onInput={(e) => {
                              e.target.style.height = 'auto'
                              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
                            }}
                          />
                          <div className="absolute right-3 bottom-3 text-xs font-mono" style={{ color: '#d1d5db' }}>
                            {query.length}/2000
                          </div>
                        </div>
                        <motion.button
                          onClick={sendQuery}
                          disabled={chatLoading || !query.trim()}
                          className="btn-primary h-11 w-11 !p-0 !gap-0 rounded-xl justify-center shrink-0 disabled:opacity-50"
                          style={{ position: 'relative', top: '-4px' }}
                          whileHover={{ scale: 1.07 }}
                          whileTap={{ scale: 0.93 }}
                        >
                          {chatLoading ? <Spinner size="sm" white /> : <Send size={15} />}
                        </motion.button>
                      </div>
                      <p className="text-[10px] text-center mt-1.5" style={{ color: '#d1d5db' }}>
                        <p className="text-[10px] text-center mt-1.5 font-medium" style={{ color: '#6b7280', opacity: 0.85 }}>
                          Answers are based solely on uploaded documents
                        </p>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Summarize panel ── */}
                {activeFeature === 'summarize' && (
                  <motion.div
                    key="summarize"
                    className="flex-1 overflow-hidden flex flex-col w-full max-w-5xl"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                  >
                    {/* Summarize header */}
                    <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                        style={{ background: 'linear-gradient(135deg,#0891b2,#059669)' }}>
                        <BookOpen size={15} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold" style={{ color: '#1e1b4b' }}>Summarize</h2>
                        <p className="text-xs" style={{ color: '#9ca3af' }}>Upload a file or paste text to generate a summary</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden px-6 pb-6">
                      <SummarizePanel />
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
