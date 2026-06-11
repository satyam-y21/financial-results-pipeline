// App.jsx
import { useState } from 'react'
import { processPdf, validatePdfUrl, ProcessingError } from './services/api.js'
import ResultPanel from './components/ResultPanel.jsx'

// Pipeline steps shown during loading
const STEPS = ['Fetching PDF', 'Extracting Text', 'Analysing with Gemini', 'Parsing JSON']

const STATE = { IDLE: 'idle', LOADING: 'loading', RESULT: 'result', ERROR: 'error' }

export default function App() {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')       // inline field validation
  const [state, setState] = useState(STATE.IDLE)
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState(null)           // { title, detail, isWarn }
  const [result, setResult] = useState(null)

  // Simulate step progression while waiting for the real response.
  // n8n doesn't stream progress, so we advance through steps on a timer.
  function startStepAnimation() {
    let step = 0
    setActiveStep(0)
    const interval = setInterval(() => {
      step += 1
      if (step < STEPS.length) {
        setActiveStep(step)
      } else {
        clearInterval(interval)
      }
    }, 2500) // ~2.5s per step, totals ~10s before timeout
    return interval
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Client-side validation
    const validationMsg = validatePdfUrl(url)
    if (validationMsg) {
      setUrlError(validationMsg)
      return
    }
    setUrlError('')

    setState(STATE.LOADING)
    setError(null)
    setResult(null)

    const stepInterval = startStepAnimation()

    try {
      const data = await processPdf(url)
      clearInterval(stepInterval)
      setResult(data)
      setState(STATE.RESULT)
    } catch (err) {
      clearInterval(stepInterval)

      if (err instanceof ProcessingError) {
        const isNoPnl = err.code === 'NO_PNL'
        setError({
          title: isNoPnl ? 'No P&L Statement Found' : 'Processing Failed',
          detail: err.message,
          isWarn: isNoPnl,
        })
      } else {
        setError({
          title: 'Unexpected Error',
          detail: err.message || 'Something went wrong. Check the console.',
          isWarn: false,
        })
      }
      setState(STATE.ERROR)
    }
  }

  function handleReset() {
    setState(STATE.IDLE)
    setResult(null)
    setError(null)
    setUrl('')
    setUrlError('')
  }

  function handleUrlChange(e) {
    setUrl(e.target.value)
    if (urlError) setUrlError('')
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="logo-mark">N</div>
        <span className="brand-name">NIVESHAAY</span>
        {/* <span className="brand-sep">·</span> */}
        <span className="brand-sub">Financial Results Processor</span>
      </header>

      <main className="app-main">
        {/* Input Form (always visible unless result is showing) */}
        {state !== STATE.RESULT && (
          <div className="form-card">
            <h1>Process Corporate Results</h1>
            <p className="subtitle">
              Paste a BSE or NSE PDF link. The pipeline fetches the document,
              extracts P&amp;L data via Gemini, and returns structured JSON.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="pdf-url">
                PDF Link
              </label>
              <div className="url-row">
                <input
                  id="pdf-url"
                  className="url-input"
                  type="url"
                  placeholder="https://www.bseindia.com/xml-data/corpfiling/AttachLive/…"
                  value={url}
                  onChange={handleUrlChange}
                  disabled={state === STATE.LOADING}
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  className="btn-submit"
                  type="submit"
                  disabled={state === STATE.LOADING || !url.trim()}
                >
                  {state === STATE.LOADING ? (
                    <>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      Processing…
                    </>
                  ) : (
                    'Process PDF →'
                  )}
                </button>
              </div>

              {/* Inline field error */}
              {urlError && (
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--error-text)' }}>
                  ⚠ {urlError}
                </p>
              )}

              <p className="field-hint">
                Supports BSE/NSE corporate result PDFs.
                Processing takes 20–60 seconds depending on PDF size.
              </p>
            </form>
          </div>
        )}

        {/* Loading State */}
        {state === STATE.LOADING && (
          <div className="loading-card">
            <div className="spinner" />
            <p className="loading-title">Analysing financial results…</p>
            <p className="loading-sub">
              This usually takes 20–60 seconds. Do not close the tab.
            </p>
            <div className="loading-steps">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`step-pill ${i <= activeStep ? 'active' : ''}`}
                >
                  {i < activeStep ? '✓ ' : ''}{s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error / Warning */}
        {state === STATE.ERROR && error && (
          <div className={`alert ${error.isWarn ? 'warning' : 'error'}`}>
            <span className="alert-icon">{error.isWarn ? '⚠️' : '✕'}</span>
            <div className="alert-body">
              <div className="alert-title">{error.title}</div>
              <div className="alert-detail">{error.detail}</div>
            </div>
          </div>
        )}

        {/* Result */}
        {state === STATE.RESULT && result && (
          <ResultPanel data={result} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}
