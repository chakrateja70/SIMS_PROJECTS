import axios from 'axios'

// In dev: empty string → Vite proxy forwards to http://localhost:8000
// In production: set VITE_API_URL to the deployed backend origin
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 180000, // 3 min — model inference can be slow
})

// Global response error interceptor
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      throw new Error('Cannot reach the server. Make sure the backend is running on port 8000.')
    }
    const detail = err.response?.data?.detail
    const message =
      typeof detail === 'object'
        ? detail?.errorMessage || JSON.stringify(detail)
        : detail || err.response?.data?.message || err.message || 'Unexpected error.'
    throw new Error(message)
  },
)

// Upload one or more PDF files into knowledge base
export const uploadFiles = async (files) => {
  if (!files || files.length === 0) throw new Error('No files provided.')
  const form = new FormData()
  files.forEach((f) => form.append('uploaded_files', f))
  const res = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// RAG query
export const queryRAG = async (query, topK = 5, minScore = 0.4) => {
  if (!query || !query.trim()) throw new Error('Query cannot be empty.')
  const res = await api.post('/query', { query: query.trim(), top_k: topK, min_score: minScore })
  return res.data
}

// Summarize a file or text
export const summarizeContent = async ({ file, text, style = 'detailed', llm = 'groq' }) => {
  if (!file && (!text || !text.trim())) throw new Error('Provide a file or some text to summarize.')
  const form = new FormData()
  if (file) form.append('file', file)
  if (text) form.append('text', text.trim())
  form.append('style', style)
  form.append('llm', llm)
  const res = await api.post('/summarize', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// List all files in knowledge base
export const listKnowledgeBase = async () => {
  const res = await api.get('/knowledge-base')
  return res.data
}

// Delete a file from knowledge base
export const deleteKnowledgeBaseFile = async (filename) => {
  if (!filename || !filename.trim()) throw new Error('Filename is required.')
  const res = await api.delete(`/knowledge-base/${encodeURIComponent(filename.trim())}`)
  return res.data
}

export default api
