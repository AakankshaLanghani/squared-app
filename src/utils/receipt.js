import { formatPKR } from '../store'

function nameFor(group, id, myId) {
  if (id === myId) return 'You'
  return group.members.find((m) => m.id === id)?.name || 'Unknown'
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Draws a receipt-style card for one expense and returns a PNG Blob.
export async function drawExpenseReceipt(group, expense, myId) {
  const W = 600
  const H = 720
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f2f3f5'
  ctx.fillRect(0, 0, W, H)

  // card
  const pad = 32
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 28)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  let y = pad + 56

  let logoWidth = 0
  try {
    const logo = await loadImage('/logo.png')
    const logoSize = 34
    ctx.save()
    roundRect(ctx, pad + 32, y - logoSize + 6, logoSize, logoSize, 10)
    ctx.clip()
    ctx.drawImage(logo, pad + 32, y - logoSize + 6, logoSize, logoSize)
    ctx.restore()
    logoWidth = logoSize + 12
  } catch {
    // logo failed to load, fall back to text-only header
  }

  ctx.fillStyle = '#202020'
  ctx.font = '700 26px "Space Grotesk", sans-serif'
  ctx.fillText('Squared receipt', pad + 32 + logoWidth, y)

  y += 44
  ctx.strokeStyle = '#eaeaea'
  ctx.beginPath()
  ctx.moveTo(pad + 32, y)
  ctx.lineTo(W - pad - 32, y)
  ctx.stroke()

  y += 56
  ctx.fillStyle = '#202020'
  ctx.font = '700 40px "Space Grotesk", sans-serif'
  ctx.fillText(formatPKR(expense.amount), pad + 32, y)

  y += 34
  ctx.fillStyle = '#8a8a8a'
  ctx.font = '500 18px "Space Grotesk", sans-serif'
  ctx.fillText(expense.description + ' · ' + group.name, pad + 32, y)

  y += 50
  ctx.fillStyle = '#202020'
  ctx.font = '600 18px "Space Grotesk", sans-serif'
  ctx.fillText('Paid by ' + nameFor(group, expense.paidBy, myId), pad + 32, y)

  y += 40
  ctx.fillStyle = '#8a8a8a'
  ctx.font = '500 16px "Space Grotesk", sans-serif'
  ctx.fillText(
    expense.items ? 'Split by item:' : expense.shares ? 'Split among:' : 'Split equally among:',
    pad + 32,
    y
  )

  const equalShare = expense.amount / expense.splitAmong.length
  expense.splitAmong.forEach((id) => {
    const share = expense.shares ? expense.shares[id] : equalShare
    y += 38
    ctx.fillStyle = '#c9f158'
    roundRect(ctx, pad + 32, y - 22, W - pad * 2 - 64, 34, 10)
    ctx.fill()
    ctx.fillStyle = '#202020'
    ctx.font = '600 16px "Space Grotesk", sans-serif'
    ctx.fillText(nameFor(group, id, myId), pad + 44, y + 2)
    ctx.textAlign = 'right'
    ctx.fillText(formatPKR(share), W - pad - 44, y + 2)
    ctx.textAlign = 'left'
  })

  ctx.fillStyle = '#c3c3c3'
  ctx.font = '500 14px "Space Grotesk", sans-serif'
  ctx.fillText(
    new Date(expense.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    pad + 32,
    H - pad - 32
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function summaryText(group, debts, myId) {
  const lines = [`${group.name} — balances (via Squared)`, '']
  debts.forEach((d) => {
    lines.push(
      `${nameFor(group, d.from, myId)} owes ${nameFor(group, d.to, myId)}: ${formatPKR(d.amount)}`
    )
  })
  if (debts.length === 0) lines.push('Everyone is settled up.')
  return lines.join('\n')
}

export async function shareBlob(blob, filename, fallbackText) {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: fallbackText })
      return 'shared'
    } catch {
      // user cancelled or share failed, fall through to download
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}

export async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      // fall through to clipboard
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }
  return 'unsupported'
}

export function expenseShareUrl(groupId, expenseId) {
  return `${window.location.origin}/?share=expense:${groupId}:${expenseId}`
}

export function groupShareUrl(groupId) {
  return `${window.location.origin}/?share=group:${groupId}`
}

export async function shareLink(url, title) {
  if (navigator.share) {
    try {
      await navigator.share({ url, title })
      return 'shared'
    } catch {
      // fall through to clipboard
    }
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url)
    return 'copied'
  }
  return 'unsupported'
}
