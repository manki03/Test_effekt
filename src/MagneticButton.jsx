import { useEffect, useRef } from 'react'

export default function MagneticButton({
  className = '',
  strength = 0.34,
  radius = 150,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  children,
  ...props
}) {
  const buttonRef = useRef(null)
  const frameRef = useRef(0)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const animate = () => {
    const nextX = currentRef.current.x + (targetRef.current.x - currentRef.current.x) * 0.18
    const nextY = currentRef.current.y + (targetRef.current.y - currentRef.current.y) * 0.18
    currentRef.current = { x: nextX, y: nextY }

    if (buttonRef.current) {
      buttonRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`
    }

    const settledX = Math.abs(targetRef.current.x - nextX) < 0.2
    const settledY = Math.abs(targetRef.current.y - nextY) < 0.2

    if (settledX && settledY && Math.abs(nextX) < 0.2 && Math.abs(nextY) < 0.2) {
      frameRef.current = 0
      if (buttonRef.current) {
        buttonRef.current.style.transform = 'translate3d(0px, 0px, 0px)'
      }
      return
    }

    frameRef.current = window.requestAnimationFrame(animate)
  }

  const ensureAnimation = () => {
    if (!frameRef.current) {
      frameRef.current = window.requestAnimationFrame(animate)
    }
  }

  const setTarget = (x, y) => {
    targetRef.current = { x, y }
    ensureAnimation()
  }

  const handleMove = (event) => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = event.clientX - centerX
    const dy = event.clientY - centerY
    const distance = Math.hypot(dx, dy)

    if (distance > radius) {
      setTarget(0, 0)
      return
    }

    const pull = (1 - distance / radius) * strength
    setTarget(dx * pull, dy * pull)
  }

  const reset = () => setTarget(0, 0)

  const handlePointerMove = (event) => {
    handleMove(event)
    if (onPointerMove) onPointerMove(event)
  }

  const handlePointerLeave = (event) => {
    reset()
    if (onPointerLeave) onPointerLeave(event)
  }

  const handlePointerDown = (event) => {
    reset()
    if (onPointerDown) onPointerDown(event)
  }

  return (
    <button
      ref={buttonRef}
      className={`magnetic-button ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </button>
  )
}
