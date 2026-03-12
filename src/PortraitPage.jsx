import { useEffect, useRef, useState } from 'react'
import MagneticButton from './MagneticButton'

const PORTRAIT_PATH = '/portrait-source/portrait.jpg'
const CHARS = ['.', ':', '·', "'", '`', '|', '/', '\\', '=', '+', '*', '░', '▒']
const BRIGHT_CHARS = ['#', '%', '@', '▓', '█']

export default function PortraitPage({ onBack }) {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.decoding = 'async'

    image.onload = () => {
      if (cancelled) return
      imageRef.current = image
      setImageLoaded(true)
      setHasError(false)
    }

    image.onerror = () => {
      if (cancelled) return
      imageRef.current = null
      setImageLoaded(false)
      setHasError(true)
    }

    image.src = PORTRAIT_PATH

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!imageLoaded || hasError) return undefined

    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let frameId = 0
    let time = 0
    const layout = {
      cols: 0,
      rows: 0,
      xStep: 0,
      cell: 0,
      offsetX: 0,
      offsetY: 0,
      pixels: null,
    }

    const recomputeLayout = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const cell = width < 640 ? 10 : 12
      const xStep = cell * 0.84
      const maxWidth = width * 0.88
      const maxHeight = height * 0.86
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height)

      const drawWidth = Math.max(cell, Math.floor(image.width * scale))
      const drawHeight = Math.max(cell, Math.floor(image.height * scale))
      const cols = Math.max(1, Math.floor(drawWidth / xStep))
      const rows = Math.max(1, Math.floor(drawHeight / cell))

      const sampleCanvas = document.createElement('canvas')
      sampleCanvas.width = cols
      sampleCanvas.height = rows
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true })
      if (!sampleContext) {
        layout.pixels = null
        return
      }

      sampleContext.drawImage(image, 0, 0, cols, rows)
      const sampleData = sampleContext.getImageData(0, 0, cols, rows).data

      layout.cols = cols
      layout.rows = rows
      layout.xStep = xStep
      layout.cell = cell
      layout.offsetX = (width - cols * xStep) / 2
      layout.offsetY = (height - rows * cell) / 2
      layout.pixels = sampleData
    }

    const resize = () => {
      const { innerWidth, innerHeight } = window
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      recomputeLayout()
    }

    const draw = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      context.fillStyle = '#000000'
      context.fillRect(0, 0, width, height)

      if (!layout.pixels) {
        frameId = window.requestAnimationFrame(draw)
        return
      }

      context.font = `700 ${layout.cell}px Tiny5, ui-monospace, SFMono-Regular, Menlo, monospace`
      context.textBaseline = 'top'

      for (let row = 0; row < layout.rows; row += 1) {
        for (let col = 0; col < layout.cols; col += 1) {
          const index = (row * layout.cols + col) * 4
          const r = layout.pixels[index]
          const g = layout.pixels[index + 1]
          const b = layout.pixels[index + 2]
          const alpha = layout.pixels[index + 3]

          if (alpha < 8) continue

          const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
          const baseLevel = 1 - luminance / 255
          const flicker = Math.sin(col * 0.21 + row * 0.17 + time * 3.4) * 0.06
          const level = Math.min(1, Math.max(0, baseLevel * 1.08 + flicker))

          if (level < 0.14) continue

          let char = CHARS[Math.min(CHARS.length - 1, Math.floor(level * CHARS.length))]
          let color = `rgba(190, 240, 35, ${Math.min(0.95, 0.3 + level * 0.62)})`

          if (level > 0.86) {
            char = BRIGHT_CHARS[Math.floor((col + row + time * 2.8) % BRIGHT_CHARS.length)]
            color = `rgba(230, 255, 130, ${Math.min(1, 0.62 + level * 0.32)})`
          } else if (level > 0.62) {
            char = CHARS[Math.min(CHARS.length - 1, Math.floor(level * CHARS.length))]
            color = `rgba(206, 255, 72, ${Math.min(0.98, 0.42 + level * 0.5)})`
          }

          context.fillStyle = color
          context.fillText(
            char,
            layout.offsetX + col * layout.xStep,
            layout.offsetY + row * layout.cell,
          )
        }
      }

      time += 0.012
      frameId = window.requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [hasError, imageLoaded])

  return (
    <main className="portrait-page">
      <MagneticButton
        type="button"
        className="portrait-back-button"
        onClick={onBack}
        aria-label="Назад"
      >
        ↩
      </MagneticButton>

      <section className="portrait-stage" aria-label="Портрет">
        {!hasError ? <canvas ref={canvasRef} className="portrait-canvas" /> : null}

        {hasError ? (
          <p className="portrait-message">
            Положи фото в <code>ascii-demo/public/portrait-source/portrait.jpg</code>
          </p>
        ) : null}

        {!hasError && !imageLoaded ? (
          <p className="portrait-message portrait-message-loading">Преобразуем портрет...</p>
        ) : null}
      </section>
    </main>
  )
}
