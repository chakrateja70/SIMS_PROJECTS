import { motion } from 'framer-motion'

// Dual-ring animated spinner gradient colours
export function Spinner({ size = 'md', className = '', white = false }) {
  const dim = { sm: 16, md: 32, lg: 48, xl: 64 }[size] || 32
  const c1 = white ? 'rgba(255,255,255,0.95)' : '#7c3aed'
  const c2 = white ? 'rgba(255,255,255,0.7)'  : '#2563eb'
  const c3 = white ? 'rgba(255,255,255,0.85)' : '#4f46e5'
  const c4 = white ? 'rgba(255,255,255,0.55)' : '#06b6d4'
  return (
    <span
      className={`inline-block relative ${className}`}
      style={{ width: dim, height: dim }}
      aria-label="Loading"
    >
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{ borderTopColor: c1, borderRightColor: c2 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
      />
      <motion.span
        className="absolute rounded-full border-2 border-transparent"
        style={{ inset: 4, borderBottomColor: c3, borderLeftColor: c4 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
      />
    </span>
  )
}

// Bouncing three-dot typing indicator
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: i === 0 ? '#7c3aed' : i === 1 ? '#4f46e5' : '#2563eb' }}
          animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// Full-page loader overlay
export function PageLoader({ text = 'Loading' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[999] gap-4"
      style={{ background: 'rgba(245,243,255,0.85)', backdropFilter: 'blur(8px)' }}>
      <Spinner size="xl" />
      <p className="text-violet-500 text-sm font-medium animate-pulse">{text}</p>
    </div>
  )
}

// Compact inline loader
export function InlineLoader({ text = 'Loading', className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 text-violet-500 ${className}`}>
      <Spinner size="sm" />
      <span className="text-sm animate-pulse font-medium">{text}</span>
    </div>
  )
}

// Skeleton shimmer line — light version
export function SkeletonLine({ width = '100%', height = 14 }) {
  return (
    <div
      className="shimmer-bg rounded-lg"
      style={{ width, height, marginBottom: 8 }}
    />
  )
}


export default Spinner
