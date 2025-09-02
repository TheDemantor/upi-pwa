'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import jsQR from 'jsqr'

export default function QRScanner({ onScan, onClose }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    setIsScanning(false)
  }, [])

  const handleQRCode = useCallback((qrData) => {
    try {
      // Parse UPI QR code data
      if (qrData.startsWith('upi://')) {
        const url = new URL(qrData)
        const params = new URLSearchParams(url.search)
        
        const upiData = {
          upiId: params.get('pa') || '',
          amount: params.get('am') || '',
          note: params.get('tn') || '',
          merchantCode: params.get('mc') || '',
          transactionId: params.get('tr') || '',
          currency: params.get('cu') || 'INR'
        }
        
        console.log('Parsed UPI data:', upiData)
        onScan(upiData)
        stopScanning()
      } else {
        setError('Invalid UPI QR code format. Expected "upi://" prefix.')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      console.error('Error parsing QR data:', error)
      setError('Failed to parse QR code data')
      setTimeout(() => setError(''), 3000)
    }
  }, [onScan, stopScanning])

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Only proceed if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      // Video not ready yet, try again
      animationFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for QR detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code) {
      console.log('QR Code detected:', code.data)
      handleQRCode(code.data)
      return
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanFrame)
  }, [isScanning, handleQRCode])

  const startScanningBasic = useCallback(async () => {
    try {
      setError('')
      setIsScanning(true)

      // Very basic constraints as fallback
      const basicConstraints = { video: true }

      console.log('Retrying with very basic constraints:', basicConstraints)
      const stream = await navigator.mediaDevices.getUserMedia(basicConstraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            console.log('Basic video playing, starting scan')
            scanFrame()
          }).catch(playErr => {
            console.error('Error playing basic video:', playErr)
            setError('Failed to start video playback with basic settings')
            setIsScanning(false)
          })
        }
      }
    } catch (err) {
      console.error('Error with basic camera setup:', err)
      setError('Unable to access camera. Please check permissions and try again.')
      setIsScanning(false)
    }
  }, [scanFrame])

  const startScanning = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported in this browser or context.')
      return
    }

    try {
      setError('')
      setIsScanning(true)

      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      let constraints
      
      if (isMobile) {
        // Mobile-optimized constraints
        constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { min: 320, ideal: 640 },
            height: { min: 240, ideal: 480 }
          }
        }
        
        if (selectedDevice && selectedDevice.trim() !== '') {
          constraints.video.deviceId = { ideal: selectedDevice }
        }
      } else {
        // Desktop constraints
        constraints = {
          video: {
            facingMode: 'environment',
            width: { min: 320, ideal: 1280, max: 1920 },
            height: { min: 240, ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          }
        }
        
        if (selectedDevice && selectedDevice.trim() !== '') {
          constraints.video.deviceId = { exact: selectedDevice }
        }
      }

      console.log('Requesting camera with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight)
          videoRef.current.play().then(() => {
            console.log('Video playing, starting scan')
            scanFrame()
          }).catch(playErr => {
            console.error('Error playing video:', playErr)
            setError('Failed to start video playback')
            setIsScanning(false)
          })
        }
        
        videoRef.current.onerror = (videoErr) => {
          console.error('Video error:', videoErr)
          setError('Video stream error')
          setIsScanning(false)
        }
      }
    } catch (err) {
      console.error('Error starting camera:', err)
      let errorMessage = 'Failed to start camera. '
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access.'
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.'
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.'
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints not supported. Trying with basic settings...'
        setTimeout(() => startScanningBasic(), 1000)
        return
      } else {
        errorMessage += err.message || 'Unknown error occurred.'
      }
      
      setError(errorMessage)
      setIsScanning(false)
    }
  }, [selectedDevice, scanFrame, startScanningBasic])

  const handleDeviceChange = useCallback((deviceId) => {
    setSelectedDevice(deviceId)
    if (isScanning) {
      stopScanning()
      setTimeout(startScanning, 100)
    }
  }, [isScanning, stopScanning, startScanning])

  // Auto-start scanning when component mounts
  useEffect(() => {
    // Check if Media Devices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      
      if (!isSecure && isMobile) {
        setError('Camera access requires HTTPS on mobile devices. Please access this page via HTTPS.')
      } else {
        setError('Camera access is not supported in this browser or context.')
      }
      return
    }

    // Log browser info for debugging
    console.log('QRScanner initialized - starting camera')
    startScanning()

    return () => {
      stopScanning()
    }
  }, [startScanning, stopScanning]) // Add dependencies to fix ESLint warning

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera Selection */}
        {devices.length > 1 && (
          <div className="p-4 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Camera Device
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Camera View */}
        <div className="p-4">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Stop Scanning
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 text-sm text-gray-600">
          <p>Point your camera at a UPI QR code to scan and automatically fill the form.</p>
        </div>
      </div>
    </div>
  )
}