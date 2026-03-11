import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: '#1e1b4b',
            border: '1.5px solid rgba(124,58,237,0.2)',
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.15)',
          },
          success: {
            iconTheme: { primary: '#7c3aed', secondary: '#fff' },
            style: { borderColor: 'rgba(124,58,237,0.3)', background: 'linear-gradient(135deg,#faf5ff,#eff6ff)' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
            style: { borderColor: 'rgba(220,38,38,0.3)', background: 'linear-gradient(135deg,#fff5f5,#fff1f2)' },
          },
          loading: {
            iconTheme: { primary: '#4f46e5', secondary: 'rgba(99,102,241,0.2)' },
            style: { borderColor: 'rgba(79,70,229,0.3)', background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
