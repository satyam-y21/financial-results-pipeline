// services/api.js
// All communication with the n8n webhook lives here.

// Config
// Default points to local n8n instance on standard port.
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/process-pdf'
const TIMEOUT_MS = 120_000 // 2 min — Gemini can be slow on large PDFs

// Error types
export class ProcessingError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ProcessingError'
    this.code = code
  }
}

// URL validation
export function validatePdfUrl(url) {
  if (!url || !url.trim()) {
    return 'URL is required.'
  }

  let parsed
  try {
    parsed = new URL(url.trim())
  } catch {
    return 'Enter a valid URL (e.g. https://www.bseindia.com/…)'
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'URL must use http or https.'
  }

  // Warn if it doesn't look like a PDF link — not a hard block
  const lowerPath = parsed.pathname.toLowerCase()
  if (!lowerPath.endsWith('.pdf') && !lowerPath.includes('pdf')) {
    return 'URL does not appear to point to a PDF. Proceed anyway or double-check the link.'
  }

  return null // valid
}

// Main call
/**
 * Send a BSE/NSE PDF URL to the n8n webhook and return parsed JSON.
 *
 * @param {string} pdfUrl  - The PDF link pasted by the user
 * @returns {Promise<object>} - Parsed P&L JSON from Gemini
 * @throws {ProcessingError}  - With a human-readable message and code
 */
export async function processPdf(pdfUrl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_url: pdfUrl.trim() }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ProcessingError(
        'Request timed out after 2 minutes. The PDF may be too large or Gemini is slow.',
        'TIMEOUT'
      )
    }
    throw new ProcessingError(
      'Could not reach the processing server. Make sure n8n is running.',
      'NETWORK_ERROR'
    )
  } finally {
    clearTimeout(timer)
  }

  // n8n returns non-200 on workflow errors
  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      
      // Handle n8n-specific node error responses
      if (body?.errorDetails?.httpCode === '404' || body?.errorMessage?.toLowerCase().includes('not be found')) {
        detail = 'The PDF link you provided could not be found (404). Please verify the link is correct and accessible.'
      } else {
        detail = body?.errorMessage || body?.message || body?.error || ''
      }
    } catch {
      // ignore parse error
    }
    throw new ProcessingError(
      detail || `Server error (HTTP ${response.status}). Check n8n execution logs.`,
      `HTTP_${response.status}`
    )
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new ProcessingError(
      'Server returned an invalid response. Check n8n execution logs.',
      'INVALID_RESPONSE'
    )
  }

  // n8n workflow returns { success, result } or { success: false, error }
  if (data.success === false) {
    const msg = data.error || 'Processing failed.'

    // PDF download failed (404, 403, etc.)
    if (data.errorCode === 'PDF_DOWNLOAD_FAILED') {
      throw new ProcessingError(msg, 'PDF_DOWNLOAD_FAILED')
    }

    // Gemini returned "no pnl found"
    if (typeof msg === 'string' && msg.toLowerCase().includes('no pnl found')) {
      throw new ProcessingError(
        'No P&L statement found in this document. The PDF may not contain financial results.',
        'NO_PNL'
      )
    }

    throw new ProcessingError(msg, 'WORKFLOW_ERROR')
  }

  const result = data.result ?? data
  if (!result || typeof result !== 'object') {
    throw new ProcessingError(
      'Unexpected response shape from server.',
      'PARSE_ERROR'
    )
  }

  return result
}
