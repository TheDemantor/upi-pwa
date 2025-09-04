'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import QRScanner from '../components/QRScanner'
import { OfflineStorage, registerBackgroundSync } from '../utils/pwa'
import { UPIIntent, isValidUPIId } from '../utils/upi'

export default function Home() {
  const [formData, setFormData] = useState({
    pocket: '',
    upiId: '',
    amount: '',
    note: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [cameraPermission, setCameraPermission] = useState('unknown') // 'unknown', 'granted', 'denied', 'checking'
  const [isOffline, setIsOffline] = useState(false)
  const [offlineStorage, setOfflineStorage] = useState(null)
  const [pendingPayment, setPendingPayment] = useState(null) // Track pending payment for confirmation

  // Initialize PWA features
  useEffect(() => {
    const transaction = {
              "pocket": "Fitness",
              "type": "debit",
              "amount": 10,
              "upiId": "9131646124@bank",
              "payee": "Vaibhav",
              "message": "test transaction 10.1"
          }
              // Console log required transaction data
                console.log(transaction);
              // Send transaction to backend API using axios
              axios.post('http://localhost:5000/api/user/transaction', transaction)
                .then(res => {
                  alert('Transaction sent to backend:', res.data);
                })
                .catch(e => {
                  alert("here" + e);
                  console.log("hee", e)
                });

    const initPWAFeatures = async () => {
      // Initialize offline storage
      const storage = new OfflineStorage()
      await storage.init()
      setOfflineStorage(storage)

      // Check network status
      setIsOffline(!navigator.onLine)

      // Listen for network changes
      const handleOnline = () => setIsOffline(false)
      const handleOffline = () => setIsOffline(true)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    initPWAFeatures()
  }, [])

  // Handle payment confirmation when user returns from payment app
  useEffect(() => {
      

    const handleVisibilityChange = () => {
      
      if (!document.hidden && pendingPayment) {
        // User has returned to the app and we have a pending payment
        setTimeout(() => {
          const isSuccess = window.confirm(
            `Did your payment of ₹${pendingPayment.amount} to ${pendingPayment.upiId} complete successfully?`
          )
          
          //   if (isSuccess) {
          //     // Prepare transaction data for API
          //     const transaction = {
          //       pocket: formData.pocket,
          //       type: 'debit',
          //       amount: Number(pendingPayment.amount),
          //       upiId: pendingPayment.upiId,
          //       payee: '',
          //       message: pendingPayment.note
          //     };
          //     // Console log required transaction data
          //       console.log(transaction);
          //       alert(transaction)
          //     // Send transaction to backend API using axios
          //     axios.post('http://localhost:5000/api/user/transaction', transaction)
          //       .then(res => {
          //         alert('Transaction sent to backend:', res.data);
          //       })
          //       .catch(err => {
          //         alert("here" + err);
          //       });
                
                

          //     // Save to localStorage (you can enhance this to use IndexedDB later)
          //     const existingHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]')
          //     existingHistory.unshift({ ...transaction, id: Date.now().toString(), status: 'success', timestamp: new Date().toISOString() })
          //     localStorage.setItem('transactionHistory', JSON.stringify(existingHistory))

          //     alert('Payment confirmed and saved to history!')

          //     // Clear the form including pocket dropdown
          //     setFormData({ pocket: '', upiId: '', amount: '', note: '' })
          //   } else {
          //   alert('Payment was not completed. You can try again.')
          // }
          
          // Clear pending payment
          setPendingPayment(null)
        }, 1000) // Small delay to ensure smooth transition
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pendingPayment])

  // Handle URL shortcuts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('action') === 'scan') {
      // Trigger camera permission check and open scanner
      const triggerScan = async () => {
        const granted = await checkCameraPermission()
        if (granted) {
          setShowQRScanner(true)
        }
      }
      triggerScan()
    }
  }, []) // Empty dependency array is fine here as this only needs to run once on mount

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate UPI ID format
    if (!isValidUPIId(formData.upiId)) {
      alert('Please enter a valid UPI ID (e.g., user@bank)')
      return
    }

    // Validate amount
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    
    try {
      // Store transaction locally first (for offline support)
      if (offlineStorage) {
        await offlineStorage.storeTransaction(formData)
      }

      // Launch UPI intent to open payment apps
      try {
        const success = await UPIIntent.launchUPIIntent({
          upiId: formData.upiId,
          amount: formData.amount,
          note: formData.note || `Payment to ${formData.upiId}`,
          transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 9)}`
        })

        if (success) {
          // Set pending payment to track when user returns
          setPendingPayment({
            upiId: formData.upiId,
            amount: formData.amount,
            note: formData.note || `Payment to ${formData.upiId}`,
            timestamp: new Date().toISOString()
          })
          
          // Show success message
          alert(`UPI payment initiated! You'll be redirected to your payment app to complete the transaction of ₹${formData.amount} to ${formData.upiId}`)
          
          // Don't clear form yet - we'll clear it after confirmation
        }
      } catch (upiError) {
        console.error('UPI Intent Error:', upiError)
        alert('Unable to launch UPI app. Please ensure you have a UPI app installed or try again.')
      }

      // Also try to log the transaction online if possible
      if (!isOffline) {
        try {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              status: 'initiated',
              timestamp: new Date().toISOString()
            }),
          })
          
          if (!response.ok) {
            console.log('Failed to log transaction online, saved offline')
          }
        } catch (networkError) {
          console.log('Network error while logging transaction:', networkError)
        }
      } else {
        // Register background sync for when we're back online
        await registerBackgroundSync('background-sync')
        console.log('Offline: Transaction will sync when back online')
      }

    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while processing your request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const pocketOptions = [
    'Food',
    'Fitness',
    'Travel',
    'Grocery',
    'Shopping',
    'Accomodation',
    'Investmant'
  ];

  const handleQRScan = (upiData) => {
    setFormData({
      upiId: upiData.upiId || '',
      amount: upiData.amount || '',
      note: upiData.note || ''
    })
    setShowQRScanner(false)
    alert('QR Code scanned successfully! UPI details filled automatically.')
  }

  const checkCameraPermission = async () => {
    // Check if Media Devices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSecure = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      
      if (!isSecure && isMobile) {
        alert('Camera access requires HTTPS on mobile devices. Please access this page via HTTPS.')
      } else {
        alert('Camera access is not supported in this browser.')
      }
      setCameraPermission('denied')
      return false
    }

    setCameraPermission('checking')

    try {
      // For mobile devices, try very basic constraints first
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      const constraints = isMobile ? { video: true } : { video: { facingMode: 'environment' } }
      
      console.log('Requesting camera permission with constraints:', constraints)
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Permission granted, stop the stream immediately
      stream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      return true
      
    } catch (err) {
      console.error('Camera permission denied:', err)
      setCameraPermission('denied')
      
      if (err.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access to scan QR codes.')
      } else if (err.name === 'NotFoundError') {
        alert('No camera found on this device.')
      } else if (err.name === 'NotSupportedError') {
        alert('Camera is not supported on this device or browser.')
      } else if (err.name === 'NotReadableError') {
        alert('Camera is already in use by another application.')
      } else {
        alert('Failed to access camera: ' + (err.message || 'Unknown error'))
      }
      return false
    }
  }

  const handleCameraClick = async () => {
    if (cameraPermission === 'granted') {
      // Permission already granted, open scanner
      setShowQRScanner(true)
    } else if (cameraPermission === 'denied') {
      // Permission was denied, retry permission request
      const granted = await checkCameraPermission()
      if (granted) {
        setShowQRScanner(true)
      }
    } else {
      // First time, check permission
      const granted = await checkCameraPermission()
      if (granted) {
        setShowQRScanner(true)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UPI PWA</h1>
          <p className="text-gray-600">Send money instantly with UPI</p>
        </div>

        {/* Navigation */}
        <div className="flex bg-white rounded-lg shadow-sm mb-6 p-1">
          <Link
            href="/"
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-blue-600 text-white"
          >
            Send Money
          </Link>
          <Link
            href="/history"
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            History
          </Link>
        </div>

        {/* UPI Form */}
        {pendingPayment && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-2">⏳</div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Payment Pending Confirmation</p>
                  <p className="text-xs text-yellow-700">
                    ₹{pendingPayment.amount} to {pendingPayment.upiId} - Return from your payment app to confirm
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Cancel pending payment confirmation?')) {
                    setPendingPayment(null)
                  }
                }}
                className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">


            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    id="upiId"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="example@paytm"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                      formData.upiId && !isValidUPIId(formData.upiId)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    required
                  />
                  {formData.upiId && !isValidUPIId(formData.upiId) && (
                    <p className="text-red-600 text-xs mt-1">Please enter a valid UPI ID (e.g., user@bank)</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCameraClick}
                  disabled={cameraPermission === 'checking'}
                  className={`px-3 py-2 rounded-md transition-colors text-lg ${
                    cameraPermission === 'denied'
                      ? 'bg-red-100 hover:bg-red-200 text-red-600 cursor-pointer'
                      : cameraPermission === 'checking'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                  }`}
                  title={
                    cameraPermission === 'denied'
                      ? 'Camera access denied - Click to retry'
                      : cameraPermission === 'checking'
                      ? 'Checking camera permission...'
                      : 'Scan QR Code'
                  }
                >
                  {cameraPermission === 'denied' ? '📷❌' : cameraPermission === 'checking' ? '⏳' : '📷'}
                </button>
              </div>
            </div>


            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="pocket" className="block text-sm font-medium text-gray-700 mb-1">
                Select Pocket
              </label>
              <select
                id="pocket"
                name="pocket"
                value={formData.pocket}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">-- Select Pocket --</option>
                {pocketOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Note (Optional)
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.upiId || !formData.amount}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Launching Payment App...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Pay with UPI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* UPI Apps Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-center mb-2">
            <span className="text-blue-600 text-lg mr-2">💳</span>
            <h3 className="text-sm font-medium text-blue-900">Supported UPI Apps</h3>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            Clicking &quot;Pay with UPI&quot; will open your installed payment app to complete the transaction.
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white rounded p-2 text-center">
              <div className="text-purple-600 mb-1">📱</div>
              <div className="font-medium text-gray-700">PhonePe</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="text-green-600 mb-1">💰</div>
              <div className="font-medium text-gray-700">Google Pay</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="text-blue-600 mb-1">💳</div>
              <div className="font-medium text-gray-700">Paytm</div>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 text-center">
            + BHIM, Amazon Pay, and other UPI apps
          </p>
        </div>

        {/* PWA Features */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">PWA Features</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">📱</div>
              <div className="font-medium text-gray-900">Installable</div>
              <div className="text-gray-600">Add to home screen</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-medium text-gray-900">
                {isOffline ? 'Offline Ready' : 'Lightning Fast'}
              </div>
              <div className="text-gray-600">
                {isOffline ? 'Works without internet' : 'Cached for speed'}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium text-gray-900">Auto Sync</div>
              <div className="text-gray-600">Syncs when back online</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-medium text-gray-900">Secure</div>
              <div className="text-gray-600">HTTPS & local storage</div>
            </div>
          </div>
          
          {/* PWA Status */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-orange-500' : 'bg-green-500'}`}></span>
              <span className="text-blue-800 font-medium">
                {isOffline ? 'Offline Mode Active' : 'Connected & Synced'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}
