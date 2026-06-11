import { syntaxHighlight } from '../utils/jsonUtils.js'

export default function JsonViewer({ data }) {
  const highlighted = syntaxHighlight(JSON.stringify(data, null, 2))

  return (
    <div className="json-viewer">
      <pre
        className="json-content"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  )
}
