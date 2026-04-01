import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SentraAppLogo from './assets/SentraApp.svg'

const root = document.documentElement
const density = localStorage.getItem('sentra-density')
if (density === 'compact' || density === 'comfortable' || density === 'spacious') {
  root.setAttribute('data-density', density)
}

const fontScale = localStorage.getItem('sentra-font-scale')
if (fontScale === 'small') {
  root.style.fontSize = '14px'
} else if (fontScale === 'large') {
  root.style.fontSize = '18px'
} else {
  root.style.fontSize = '16px'
}

if (localStorage.getItem('sentra-reduce-motion') === '1') {
  root.classList.add('reduce-motion')
}

const statusBadgeStyle = localStorage.getItem('sentra-status-badge-style')
if (statusBadgeStyle === 'filled' || statusBadgeStyle === 'outline' || statusBadgeStyle === 'minimal') {
  root.setAttribute('data-status-badge-style', statusBadgeStyle)
}

root.setAttribute('data-row-striping', localStorage.getItem('sentra-row-striping') === '1' ? 'on' : 'off')

let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
if (!favicon) {
  favicon = document.createElement('link')
  favicon.rel = 'icon'
  document.head.appendChild(favicon)
}
favicon.href = SentraAppLogo

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
