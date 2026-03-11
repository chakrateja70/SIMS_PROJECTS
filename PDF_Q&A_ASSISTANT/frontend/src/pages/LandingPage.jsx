import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Zap, Database, MessageSquare, BookOpen, Search,
  Upload, Cpu, ArrowRight, GitBranch, Shield, Layers,
} from 'lucide-react'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Intelligent Q&A',
    desc: 'Ask natural language questions and get precise answers extracted from your uploaded documents using RAG technology.',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
  },
  {
    icon: BookOpen,
    title: 'Smart Summarization',
    desc: 'Generate concise, detailed, or bullet-point summaries of any PDF, TXT, or DOCX document in seconds.',
    gradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
    bg: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.2)',
  },
  {
    icon: Database,
    title: 'Knowledge Base',
    desc: 'Build a persistent vector database of your documents. View, manage, and delete files stored in Pinecone.',
    gradient: 'linear-gradient(135deg, #059669, #047857)',
    bg: 'rgba(5,150,105,0.08)',
    border: 'rgba(5,150,105,0.2)',
  },
  {
    icon: Upload,
    title: 'Multi-File Upload',
    desc: 'Upload multiple PDFs at once. The pipeline automatically extracts text, splits into chunks, and indexes embeddings.',
    gradient: 'linear-gradient(135deg, #ea580c, #dc2626)',
    bg: 'rgba(234,88,12,0.08)',
    border: 'rgba(234,88,12,0.2)',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    desc: 'Powered by intfloat/e5-base-v2 embeddings, documents are retrieved by semantic relevance—not just keyword match.',
    gradient: 'linear-gradient(135deg, #db2777, #9d174d)',
    bg: 'rgba(219,39,119,0.08)',
    border: 'rgba(219,39,119,0.2)',
  },
  {
    icon: Zap,
    title: 'Groq LLaMA 3.1',
    desc: 'Ultra-fast inference via Groq cloud using Meta LLaMA 3.1 8B Instant. Near real-time responses at scale.',
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.2)',
  },
]

const HOW_IT_WORKS = [
  { step: '01', icon: Upload, title: 'Upload Documents', desc: 'Drop your PDFs, docs, or text files into the uploader.' },
  { step: '02', icon: GitBranch, title: 'Vectorize & Index', desc: 'Text is chunked, embedded, and stored in Pinecone vector DB.' },
  { step: '03', icon: Search, title: 'Semantic Retrieval', desc: 'Your question is embedded and the most relevant chunks are found.' },
  { step: '04', icon: Cpu, title: 'LLM Generation', desc: 'Groq LLaMA synthesizes a precise answer from retrieved context.' },
]

const TECH = [
  { name: 'FastAPI', color: '#059669' },
  { name: 'Pinecone', color: '#6366f1' },
  { name: 'Groq LLaMA 3.1', color: '#7c3aed' },
  { name: 'e5-base-v2', color: '#0891b2' },
  { name: 'React + Vite', color: '#0284c7' },
  { name: 'Tailwind CSS', color: '#0d9488' },
]

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.09 } } }

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #eff6ff 45%, #f0fdf4 100%)' }}>

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden">

        {/* Decorative blobs — light/pastel */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none blob-1"
          style={{ background: 'rgba(167,139,250,0.25)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none blob-2"
          style={{ background: 'rgba(103,232,249,0.2)' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none blob-3"
          style={{ background: 'rgba(165,180,252,0.2)' }} />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div className="relative z-10 max-w-4xl" variants={stagger} initial="hidden" animate="show">
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-8 flex justify-center">
            
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6"
            style={{ color: '#1e1b4b' }}
          >
            Ask Anything About<br />
            <span className="gradient-text">Your Documents</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: '#4b5563' }}
          >
            Upload PDFs, ask questions, get accurate AI-generated answers in seconds.
            Built on{' '}
            <span className="font-semibold" style={{ color: '#7c3aed' }}>RAG + LLaMA 3.1</span>{' '}
            with a{' '}
            <span className="font-semibold" style={{ color: '#0891b2' }}>Pinecone</span>{' '}
            vector store — no hallucinations, only your data.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
            <motion.button
              onClick={() => navigate('/home')}
              className="btn-primary px-8 py-3.5 text-base rounded-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              onClick={() => navigate('/knowledge-base')}
              className="btn-secondary px-8 py-3.5 text-base rounded-2xl"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <Database size={16} />
              View Knowledge Base
            </motion.button>
          </motion.div>

          {/* Tech pills */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mt-10">
            {TECH.map((t) => (
              <span
                key={t.name}
                className="text-xs px-3 py-1.5 rounded-full border font-medium"
                style={{ color: t.color, borderColor: t.color + '40', background: t.color + '12' }}
              >
                {t.name}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs tracking-widest uppercase" style={{ color: '#9ca3af' }}>Scroll</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #9ca3af, transparent)' }} />
        </motion.div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-5"
              style={{ color: '#0891b2', background: 'rgba(8,145,178,0.08)', borderColor: 'rgba(8,145,178,0.2)' }}
            >
              <Layers size={11} />
              Core Capabilities
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1e1b4b' }}>
              Everything You Need to{' '}
              <span className="gradient-text">Understand Your PDFs</span>
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: '#6b7280' }}>
              From instant Q&amp;A to deep summarization — all powered by state-of-the-art AI.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl p-6 cursor-default group transition-all duration-300"
                style={{
                  background: 'white',
                  border: `1px solid ${f.border}`,
                  boxShadow: '0 2px 12px rgba(99,102,241,0.06)',
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 12px 32px ${f.border.replace('0.2', '0.18')}`,
                  y: -3,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div
                  className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
                  style={{ background: f.gradient, boxShadow: `0 6px 16px ${f.border}` }}
                >
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#1e1b4b' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(135deg, rgba(245,243,255,0.8), rgba(239,246,255,0.8))' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border mb-5"
              style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}
            >
              <GitBranch size={11} />
              How It Works
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#1e1b4b' }}>
              From Upload to{' '}
              <span className="gradient-text">Insight in 4 Steps</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center rounded-2xl p-6 group transition-all duration-300"
                style={{
                  background: 'white',
                  border: '1px solid rgba(124,58,237,0.12)',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.05)',
                }}
                whileHover={{
                  boxShadow: '0 12px 32px rgba(124,58,237,0.12)',
                  y: -3,
                }}
              >
                <div className="text-4xl font-black gradient-text mb-4">{step.step}</div>
                <div
                  className="w-11 h-11 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-all group-hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.08))',
                    border: '1.5px solid rgba(124,58,237,0.2)',
                  }}
                >
                  <step.icon size={18} style={{ color: '#7c3aed' }} />
                </div>
                <h4 className="font-semibold mb-2 text-sm" style={{ color: '#1e1b4b' }}>{step.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      {/* <section className="py-24 px-4" style={{ background: 'rgba(255,255,255,0.7)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-5"
          >
            {[
              { label: 'Supported Formats', value: '3+', color: '#7c3aed', bg: 'rgba(124,58,237,0.06)' },
              { label: 'Vector Dimensions', value: '768', color: '#0891b2', bg: 'rgba(8,145,178,0.06)' },
              { label: 'LLM Max Tokens', value: '2048', color: '#059669', bg: 'rgba(5,150,105,0.06)' },
              { label: 'API Uptime', value: '99.9%', color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="rounded-2xl p-6 text-center transition-all duration-300 group"
                style={{
                  background: stat.bg,
                  border: `1px solid ${stat.color}25`,
                }}
                whileHover={{ scale: 1.04, boxShadow: `0 8px 24px ${stat.color}20` }}
              >
                <div className="text-3xl font-black mb-2 font-mono" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <p className="text-xs font-medium" style={{ color: '#6b7280' }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section> */}

      {/* ─── SECURITY NOTE ────────────────────────────────── */}
      {/* <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(245,243,255,0.9), rgba(239,246,255,0.9))',
              border: '1px solid rgba(124,58,237,0.2)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
            >
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#1e1b4b' }}>Secure by Design</p>
              <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                All data is processed on your local machine and indexed in your private Pinecone namespace.
                No document content is stored by third parties beyond your vector database.
              </p>
            </div>
          </motion.div>
        </div>
      </section> */}

      {/* ─── FINAL CTA ────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-12 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
              boxShadow: '0 20px 60px rgba(99,102,241,0.35)',
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.12)' }} />

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 relative z-10">
              Ready to unlock your<br />
              <span style={{ color: 'rgba(216,180,254,1)' }}>documents' potential?</span>
            </h2>
            <p className="mb-8 relative z-10" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Start by uploading your first PDF and see the magic happen.
            </p>
            <motion.button
              onClick={() => navigate('/home')}
              className="relative z-10 inline-flex items-center gap-2 px-10 py-4 text-base font-bold rounded-2xl transition-all duration-200"
              style={{
                background: 'white',
                color: '#6d28d9',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
              whileHover={{ scale: 1.06, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.97 }}
            >
              Start for Free
              <ArrowRight size={17} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer
        className="py-8 px-4 text-center"
        style={{ borderTop: '1px solid rgba(124,58,237,0.1)', background: 'rgba(255,255,255,0.6)' }}
      >
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}
          >
            <FileText size={11} className="text-white" />
          </div>
          <span className="text-sm font-medium" style={{ color: '#6b7280' }}>PDF Q&amp;A Assistant</span>
        </div>
        <p className="text-xs" style={{ color: '#9ca3af' }}>
          Built with FastAPI · Pinecone · Groq · React · Tailwind CSS
        </p>
      </footer>
    </div>
  )
}
