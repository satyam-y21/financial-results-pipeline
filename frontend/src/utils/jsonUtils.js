// utils/jsonUtils.js

/**
 * Colorize a JSON string with span tags for syntax highlighting.
 * Intentionally simple — no external library.
 */
export function syntaxHighlight(json) {
  if (typeof json !== 'string') {
    json = JSON.stringify(json, null, 2)
  }

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-num'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-str'
      } else if (/true|false/.test(match)) {
        cls = 'json-bool'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    }
  )
}

/**
 * Extract company name and quarter label from the result JSON.
 * Falls back gracefully if keys are missing.
 */
export function extractMeta(result) {
  const company = result?.company_name || 'Unknown Company'

  // row1 holds the header: ["Particulars", "Q4 FY26", ...]
  const headers = result?.row1 || []
  const quarter = headers[1] || ''

  return { company, quarter }
}

/**
 * Convert the flat rowN structure into a 2D array for table rendering.
 * Returns: { headers: string[], rows: string[][] }
 */
export function flattenToTable(result) {
  const keys = Object.keys(result)
    .filter((k) => /^row\d+$/.test(k))
    .sort((a, b) => {
      const na = parseInt(a.replace('row', ''), 10)
      const nb = parseInt(b.replace('row', ''), 10)
      return na - nb
    })

  if (keys.length === 0) return { headers: [], rows: [] }

  const [headerKey, ...bodyKeys] = keys
  const headers = result[headerKey] || []
  const rows = bodyKeys.map((k) => result[k] || [])

  return { headers, rows }
}

/**
 * Detect if a row label represents a heading-only row (Expenses section).
 * Used to apply special styling in the table view.
 */
export function isHeadingRow(row) {
  if (!row || row.length === 0) return false
  return row.slice(1).every((v) => !v || v === '' || v === '0' || v === '0.00')
}

/**
 * Detect if a row is a margin row (%) for styling.
 */
export function isMarginRow(label) {
  if (!label) return false
  return label.toLowerCase().includes('margin')
}
