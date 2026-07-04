import { formatDate, roundRect } from './utils'
import LOGO from './logo'

function drawLabel(g, key, val, x, y) {
  g.fillStyle = '#6b7787'
  g.font = '700 12px "Segoe UI", sans-serif'
  g.fillText(key, x, y)
  g.fillStyle = '#1c2733'
  g.font = '600 22px "Segoe UI", sans-serif'
  g.fillText(val || '—', x, y + 22)
}

export function downloadPng(data) {
  if (!data) return
  const hasApprover = !!data.approved_by
  const scale = 2

  // Match the card's min-height & proportions
  const W = 960
  const detailsBlockH = 180    // supplier/appointment + contact/signature rows
  const approverBlockH = 130   // approved-by + approver-sig row
  const headerH = 200          // logo + title + subtitle
  const sepGap = 40            // gap between subtitle and separator line
  const bottomPad = 50

  const H = hasApprover
    ? headerH + sepGap + detailsBlockH + approverBlockH + bottomPad
    : headerH + sepGap + detailsBlockH + bottomPad

  const c = document.createElement('canvas')
  c.width = W * scale
  c.height = H * scale
  const g = c.getContext('2d')
  g.scale(scale, scale)

  // Background
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, W, H)

  // Top accent bar
  const grad = g.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, '#125f9f')
  grad.addColorStop(1, '#22b0e0')
  g.fillStyle = grad
  g.fillRect(0, 0, W, 14)

  const PAD = 60
  const col1 = PAD, col2 = W / 2 + 20
  g.textBaseline = 'top'

  function finishCard(logoEl) {
    // --- Logo ---
    const logoY = 40
    if (logoEl) {
      const logoH = 50, logoW = logoH * (logoEl.naturalWidth / logoEl.naturalHeight)
      g.drawImage(logoEl, PAD, logoY, logoW, logoH)
    }

    // --- Badge ---
    g.strokeStyle = '#1499cf'
    g.fillStyle = '#1499cf'
    g.font = '700 14px "Segoe UI", sans-serif'
    const badge = 'VISITOR INVITATION'
    const bw = g.measureText(badge).width + 28
    g.lineWidth = 1.5
    roundRect(g, W - PAD - bw, logoY + 5, bw, 30, 15)
    g.stroke()
    g.fillText(badge, W - PAD - bw + 14, logoY + 13)

    // --- Title ---
    const titleY = logoY + 70
    g.fillStyle = '#1c2733'
    g.font = '700 34px "Segoe UI", sans-serif'
    g.fillText("You're Invited", PAD, titleY)

    // --- Subtitle ---
    const subY = titleY + 44
    g.fillStyle = '#6b7787'
    g.font = '400 16px "Segoe UI", sans-serif'
    g.fillText('Please present this card on arrival at reception.', PAD, subY)

    // --- Separator line (pushed down, matching mt-auto feel) ---
    const sepY = subY + sepGap
    g.strokeStyle = '#e5e7eb'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(PAD, sepY)
    g.lineTo(W - PAD, sepY)
    g.stroke()

    // --- Details grid ---
    const row1 = sepY + 24
    const row2 = row1 + 75
    drawLabel(g, 'SUPPLIER', data.supplier_name || '—', col1, row1)
    drawLabel(g, 'APPOINTMENT', data.day + ', ' + formatDate(data.appointment_date), col2, row1)
    drawLabel(g, 'CONTACT PERSON', data.contact_person || '—', col1, row2)

    // Signature label
    g.fillStyle = '#6b7787'
    g.font = '700 12px "Segoe UI", sans-serif'
    g.fillText('SIGNATURE', col2, row2)
    const sigLineY = row2 + 80
    g.strokeStyle = '#d5dce4'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(col2, sigLineY)
    g.lineTo(col2 + 330, sigLineY)
    g.stroke()
    g.fillStyle = '#6b7787'
    g.font = '400 12px "Segoe UI", sans-serif'
    g.fillText('Authorised signature', col2, sigLineY + 6)

    // --- Approver section ---
    function drawApproverAndDownload() {
      if (hasApprover) {
        const appY = sigLineY + 30

        // Dashed separator
        g.setLineDash([5, 5])
        g.strokeStyle = '#d1d5db'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(PAD, appY)
        g.lineTo(W - PAD, appY)
        g.stroke()
        g.setLineDash([])

        const appRow = appY + 24
        drawLabel(g, 'APPROVED BY', data.approved_by || '—', col1, appRow)

        // Approver signature
        g.fillStyle = '#6b7787'
        g.font = '700 12px "Segoe UI", sans-serif'
        g.fillText('APPROVER SIGNATURE', col2, appRow)
        const appSigLineY = appRow + 80
        g.strokeStyle = '#d5dce4'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(col2, appSigLineY)
        g.lineTo(col2 + 330, appSigLineY)
        g.stroke()
        g.fillStyle = '#6b7787'
        g.font = '400 12px "Segoe UI", sans-serif'
        g.fillText('Approver signature', col2, appSigLineY + 6)

        if (data.approver_signature) {
          const asImg = new Image()
          asImg.onload = function () {
            const maxW = 320, maxH = 70
            const s = Math.min(maxW / asImg.width, maxH / asImg.height)
            const sw = asImg.width * s, sh = asImg.height * s
            g.save()
            g.translate(col2 - 4, appSigLineY)
            g.rotate(-3 * Math.PI / 180)
            g.drawImage(asImg, 0, -sh, sw, sh)
            g.restore()
            doDownload(c, data.supplier_name)
          }
          asImg.src = data.approver_signature
        } else {
          doDownload(c, data.supplier_name)
        }
      } else {
        doDownload(c, data.supplier_name)
      }
    }

    if (data.signature_data) {
      const sigImg = new Image()
      sigImg.onload = function () {
        const maxW = 320, maxH = 65
        const s = Math.min(maxW / sigImg.width, maxH / sigImg.height)
        const sw = sigImg.width * s, sh = sigImg.height * s
        g.save()
        g.translate(col2 - 4, sigLineY)
        g.rotate(-3 * Math.PI / 180)
        g.drawImage(sigImg, 0, -sh, sw, sh)
        g.restore()
        drawApproverAndDownload()
      }
      sigImg.src = data.signature_data
    } else {
      drawApproverAndDownload()
    }
  }

  const li = new Image()
  li.onload = function () { finishCard(li) }
  li.onerror = function () { finishCard(null) }
  li.src = LOGO
}

function doDownload(canvas, name) {
  const fname = (name || 'invitation').replace(/[^\w]+/g, '_')
  const a = document.createElement('a')
  a.download = 'invitation_' + fname + '.png'
  a.href = canvas.toDataURL('image/png')
  a.click()
}
