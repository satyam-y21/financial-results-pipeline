import { flattenToTable, isHeadingRow, isMarginRow } from '../utils/jsonUtils.js'

export default function TableView({ data }) {
  const { headers, rows } = flattenToTable(data)

  if (headers.length === 0) {
    return (
      <div className="table-view" style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
        No table data to display.
      </div>
    )
  }

  return (
    <div className="table-view">
      <table className="pnl-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const label = row[0] || ''
            const heading = isHeadingRow(row)
            const margin = isMarginRow(label)

            return (
              <tr
                key={ri}
                className={
                  heading ? 'row-heading' : margin ? 'row-margin' : ''
                }
              >
                {row.map((cell, ci) => (
                  <td key={ci}>{cell}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
