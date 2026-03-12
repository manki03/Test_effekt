import { useEffect, useState } from 'react'
import AsciiNoiseBackgroundDemo from './AsciiNoiseBackgroundDemo'
import PortraitPage from './PortraitPage'
import './App.css'

function normalizePath(pathname) {
  if (!pathname) return '/'
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}

function App() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setPathname(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (to) => {
    const nextPath = normalizePath(to)
    if (nextPath === pathname) return
    window.history.pushState({}, '', nextPath)
    setPathname(nextPath)
  }

  if (pathname === '/portrait') {
    return <PortraitPage onBack={() => navigate('/')} />
  }

  return <AsciiNoiseBackgroundDemo onOpenPortrait={() => navigate('/portrait')} />
}

export default App
