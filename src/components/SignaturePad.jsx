import { useRef, useEffect, useCallback, useState } from 'react'
import { getTrimmedSignature } from '../lib/utils'

export default function SignaturePad({ onSignatureChange, label = 'Signature' }) {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawingRef = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const hasInkRef = useRef(false)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const prev = hasInkRef.current ? canvas.toDataURL() : null
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1c2733'
    ctxRef.current = ctx
    if (prev && hasInkRef.current) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = prev
    }
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const t = e.touches ? e.touches[0] : e
    return { x: t.clientX - rect.left, y: t.clientY - rect.top }
  }

  const handleStart = (e) => {
    drawingRef.current = true
    hasInkRef.current = true
    setHasInk(true)
    const { x, y } = getPos(e)
    ctxRef.current.beginPath()
    ctxRef.current.moveTo(x, y)
    e.preventDefault()
  }

  const handleMove = (e) => {
    if (!drawingRef.current) return
    const { x, y } = getPos(e)
    ctxRef.current.lineTo(x, y)
    ctxRef.current.stroke()
    e.preventDefault()
  }

  const handleEnd = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    emitSignature()
  }

  const emitSignature = () => {
    if (!hasInkRef.current || !canvasRef.current || !ctxRef.current) {
      onSignatureChange?.(null)
      return
    }
    const trimmed = getTrimmedSignature(canvasRef.current, ctxRef.current)
    const dataUrl = trimmed
      ? trimmed.toDataURL('image/png')
      : canvasRef.current.toDataURL('image/png')
    onSignatureChange?.(dataUrl)
  }

  const clear = () => {
    const canvas = canvasRef.current
    ctxRef.current?.clearRect(0, 0, canvas.width, canvas.height)
    hasInkRef.current = false
    setHasInk(false)
    onSignatureChange?.(null)
  }

  useEffect(() => {
    const handleMouseUp = () => {
      if (drawingRef.current) {
        drawingRef.current = false
        emitSignature()
      }
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-[170px] border border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-crosshair block touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {!hasInk && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
            Sign here with mouse or finger
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clear}
        className="text-brand-light text-xs cursor-pointer mt-1 bg-transparent border-none"
      >
        Clear signature
      </button>
    </div>
  )
}
