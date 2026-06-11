import { useState } from 'react'
import JsonViewer from './JsonViewer.jsx'
import TableView from './TableView.jsx'
import { extractMeta } from '../utils/jsonUtils.js'

export default function ResultPanel({ data, onReset }) {
  const [tab, setTab] = useState('table')
  const [copied, setCopied] = useState(false)

  const { company, quarter } = extractMeta(data)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — silent fail
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${company.replace(/\s+/g, '_')}_${quarter || 'result'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="result-card">
      {/* Header */}
      <div className="result-header">
        <div className="result-meta">
          <div className="result-badge">
            <span className="dot" />
            Processed
          </div>
          <span className="result-company">{company}</span>
          {quarter && <span className="result-quarter">{quarter}</span>}
        </div>

        <div className="result-actions">
          <button
            className={`btn-action ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied' : '⎘ Copy JSON'}
          </button>
          <button className="btn-action" onClick={handleDownload}>
            ↓ Download
          </button>
          <button className="btn-action" onClick={onReset}>
            ↺ New
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'table' ? 'active' : ''}`}
          onClick={() => setTab('table')}
        >
          Table View
        </button>
        <button
          className={`tab-btn ${tab === 'json' ? 'active' : ''}`}
          onClick={() => setTab('json')}
        >
          Raw JSON
        </button>
      </div>

      {/* Content */}
      {tab === 'table' ? (
        <TableView data={data} />
      ) : (
        <JsonViewer data={data} />
      )}
    </div>
  )
}
