'use client'

import { useEffect } from 'react'
import { initPWA } from '../utils/pwa'

export default function PWAInitializer() {
  useEffect(() => {
    // Initialize all PWA features
    const init = async () => {
      try {
        await initPWA()
      } catch (error) {
        console.error('PWA initialization failed:', error)
      }
    }

    init()
  }, [])

  // This component doesn't render anything visible
  return null
}
