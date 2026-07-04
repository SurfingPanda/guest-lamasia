export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
}

export function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

export function getTrimmedSignature(canvas, ctx) {
  const w = canvas.width, h = canvas.height
  if (!w || !h) return null
  const data = ctx.getImageData(0, 0, w, h).data
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 10) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (!found) return null
  const m = 10
  minX = Math.max(0, minX - m)
  minY = Math.max(0, minY - m)
  maxX = Math.min(w - 1, maxX + m)
  maxY = Math.min(h - 1, maxY + m)
  const cw = maxX - minX + 1, ch = maxY - minY + 1
  const t = document.createElement('canvas')
  t.width = cw
  t.height = ch
  t.getContext('2d').drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch)
  return t
}
