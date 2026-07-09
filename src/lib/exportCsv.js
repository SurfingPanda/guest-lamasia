import { formatDate, formatTimestamp } from './utils'

function escapeCsvField(value) {
  const str = value == null ? '' : String(value)
  return /[",\r\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str
}

// Exports the given requests (already filtered/searched by the caller) as a CSV
// download. Signature images are intentionally omitted - they're huge base64
// blobs with no value in a spreadsheet.
export function exportRequestsCsv(rows, tab) {
  const headers = ['Reference', 'Supplier', 'Day', 'Appointment Date', 'Contact Person', 'Status', 'Submitted At', 'Reviewed At', 'Approved By']

  const lines = [headers.map(escapeCsvField).join(',')]
  for (const r of rows) {
    lines.push([
      r.id.split('-')[0].toUpperCase(),
      r.supplier_name,
      r.day,
      formatDate(r.appointment_date),
      r.contact_person,
      r.status,
      formatTimestamp(r.created_at),
      r.reviewed_at ? formatTimestamp(r.reviewed_at) : '',
      r.approved_by || '',
    ].map(escapeCsvField).join(','))
  }

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `requests_${tab}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
