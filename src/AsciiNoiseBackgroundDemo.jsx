import { useEffect, useRef } from 'react'
import MagneticButton from './MagneticButton'

export default function AsciiNoiseBackgroundDemo({ onOpenPortrait }) {
  const textBlockRef = useRef(null)

  return (
    <div className="ascii-demo-root">
      <AsciiField avoidRef={textBlockRef} />

      <div className="ascii-demo-content">
        <div ref={textBlockRef} className="ascii-demo-text">
          <p className="ascii-demo-title">Свяжитесь</p>
          <a
            className="ascii-demo-brand"
            href="https://t.me/manki033"
            target="_blank"
            rel="noreferrer"
          >
            @manki033
          </a>
          <MagneticButton
            type="button"
            className="ascii-demo-button"
            onClick={onOpenPortrait}
          >
            Портрет
          </MagneticButton>
        </div>
      </div>
    </div>
  )
}

function AsciiField({ avoidRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId = 0
    let time = 0
    const chars = ['.', ':', '·', "'", '`', '|', '/', '\\', '=', '+', '*', '░', '▒']
    const brightChars = ['#', '%', '@', '▓', '█']
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const mouse = { x: -9999, y: -9999, active: false }

    const resize = () => {
      const { innerWidth, innerHeight } = window
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const onLeave = () => {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }

    const noise2d = (x, y, t) => {
      const a = Math.sin(x * 0.018 + t * 0.7)
      const b = Math.cos(y * 0.024 - t * 0.55)
      const c = Math.sin((x + y) * 0.011 + t * 0.35)
      return (a + b + c) / 3
    }

    const blob = (x, y, cx, cy, radiusX, radiusY) => {
      const dx = (x - cx) / radiusX
      const dy = (y - cy) / radiusY
      const v = 1 - dx * dx - dy * dy
      return Math.max(0, v)
    }

    const isInsideRoundedRect = (x, y, rect, radius) => {
      const clampedRadius = Math.max(
        0,
        Math.min(radius, (rect.right - rect.left) / 2, (rect.bottom - rect.top) / 2),
      )

      if (
        x >= rect.left + clampedRadius &&
        x <= rect.right - clampedRadius &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return true
      }

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top + clampedRadius &&
        y <= rect.bottom - clampedRadius
      ) {
        return true
      }

      const corners = [
        { cx: rect.left + clampedRadius, cy: rect.top + clampedRadius },
        { cx: rect.right - clampedRadius, cy: rect.top + clampedRadius },
        { cx: rect.left + clampedRadius, cy: rect.bottom - clampedRadius },
        { cx: rect.right - clampedRadius, cy: rect.bottom - clampedRadius },
      ]

      for (const corner of corners) {
        const dx = x - corner.cx
        const dy = y - corner.cy
        if (dx * dx + dy * dy <= clampedRadius * clampedRadius) {
          return true
        }
      }

      return false
    }

    const draw = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const cell = width < 640 ? 11 : 12
      const textRect = avoidRef?.current?.getBoundingClientRect()
      const avoidPadding = width < 640 ? 16 : 26
      const avoidRadius = 24
      const avoidRect = textRect
        ? {
            left: textRect.left - avoidPadding,
            top: textRect.top - avoidPadding,
            right: textRect.right + avoidPadding,
            bottom: textRect.bottom + avoidPadding,
          }
        : null

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      ctx.font = `700 ${cell}px Tiny5, ui-monospace, SFMono-Regular, Menlo, monospace`
      ctx.textBaseline = 'top'

      const blobA = {
        x: width * 0.28 + Math.sin(time * 0.5) * 20,
        y: height * 0.22 + Math.cos(time * 0.4) * 18,
        rx: 90,
        ry: 120,
      }

      const blobB = {
        x: width * 0.68 + Math.cos(time * 0.45) * 24,
        y: height * 0.27 + Math.sin(time * 0.35) * 16,
        rx: 86,
        ry: 116,
      }

      const blobC = {
        x: width * 0.52 + Math.sin(time * 0.25) * 30,
        y: height * 0.75 + Math.cos(time * 0.2) * 18,
        rx: width * 0.32,
        ry: 120,
      }

      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell * 0.8) {
          const sampleX = x + cell * 0.4
          const sampleY = y + cell * 0.5
          if (
            avoidRect &&
            isInsideRoundedRect(sampleX, sampleY, avoidRect, avoidRadius)
          ) {
            continue
          }

          const n = noise2d(x, y, time)
          const b1 = blob(x, y, blobA.x, blobA.y, blobA.rx, blobA.ry)
          const b2 = blob(x, y, blobB.x, blobB.y, blobB.rx, blobB.ry)
          const b3 = blob(x, y, blobC.x, blobC.y, blobC.rx, blobC.ry)
          const density = Math.max(
            0,
            ((n + 1) / 2) * 0.75 + b1 * 0.85 + b2 * 0.85 + b3 * 0.45 - 0.2,
          )

          let mouseBoost = 0
          if (mouse.active) {
            const dx = x - mouse.x
            const dy = y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            mouseBoost = Math.max(0, 1 - dist / 160) * 0.55
          }

          const level = density + mouseBoost
          const flicker = Math.sin(x * 0.07 + y * 0.03 + time * 8) * 0.08
          const finalLevel = level + flicker

          if (finalLevel < 0.24) continue

          let ch = chars[Math.floor(((finalLevel * 10) % 1) * chars.length)]
          let color = 'rgba(210, 255, 40, 0.72)'

          if (finalLevel > 0.9) {
            ch =
              brightChars[
                Math.floor(((x + y) * 0.01 + time * 2) % brightChars.length)
              ]
            color = 'rgba(230, 255, 120, 0.92)'
          } else if (finalLevel > 0.62) {
            ch =
              chars[
                Math.min(
                  chars.length - 1,
                  Math.floor(finalLevel * chars.length) % chars.length,
                )
              ]
            color = 'rgba(190, 240, 35, 0.82)'
          }

          ctx.fillStyle = color
          ctx.fillText(ch, x, y)
        }
      }

      time += 0.012
      animationFrameId = window.requestAnimationFrame(draw)
    }

    resize()
    draw()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [avoidRef])

  return <canvas ref={canvasRef} className="ascii-demo-canvas" />
}
