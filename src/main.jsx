import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The PWA needs the service worker for offline use; the Capacitor APK already bundles every file.
if (import.meta.env.PROD && "serviceWorker" in navigator && !window.Capacitor?.isNativePlatform()) {
  navigator.serviceWorker.register("/sw.js");
}
