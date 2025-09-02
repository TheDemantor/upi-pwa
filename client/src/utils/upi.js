/**
 * UPI Intent Utilities
 * Handles generation and launching of UPI payment intents
 */

export class UPIIntent {
  /**
   * Generate UPI payment URL/Intent
   * @param {Object} params - Payment parameters
   * @param {string} params.upiId - Recipient UPI ID
   * @param {string} params.amount - Payment amount
   * @param {string} params.note - Transaction note
   * @param {string} params.transactionId - Optional transaction ID
   * @param {string} params.merchantCode - Optional merchant code
   * @returns {string} UPI intent URL
   */
  static generateUPIIntent({ upiId, amount, note = '', transactionId = '', merchantCode = '' }) {
    // Validate required fields
    if (!upiId || !amount) {
      throw new Error('UPI ID and amount are required')
    }

    // Clean and validate amount
    const cleanAmount = parseFloat(amount).toFixed(2)
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      throw new Error('Invalid amount')
    }

    // Build UPI URI parameters
    const params = new URLSearchParams({
      pa: upiId, // payee address (UPI ID)
      am: cleanAmount, // amount
      cu: 'INR', // currency
      tn: note || `Payment to ${upiId}`, // transaction note
    })

    // Add optional parameters
    if (transactionId) {
      params.append('tr', transactionId) // transaction reference
    }
    if (merchantCode) {
      params.append('mc', merchantCode) // merchant code
    }

    // Generate transaction ID if not provided
    if (!transactionId) {
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      params.set('tr', `TXN${timestamp}${randomId}`)
    }

    return `upi://pay?${params.toString()}`
  }

  /**
   * Launch UPI intent
   * @param {Object} params - Payment parameters
   * @returns {Promise<boolean>} Success status
   */
  static async launchUPIIntent(params) {
    try {
      const upiUrl = this.generateUPIIntent(params)
      console.log('Generated UPI URL:', upiUrl)

      // Detect platform and launch intent accordingly
      if (this.isMobileDevice()) {
        return await this.launchMobileIntent(upiUrl, params)
      } else {
        return await this.launchDesktopIntent(upiUrl, params)
      }
    } catch (error) {
      console.error('Failed to launch UPI intent:', error)
      throw error
    }
  }

  /**
   * Launch UPI intent on mobile devices
   * @param {string} upiUrl - UPI intent URL
   * @param {Object} params - Payment parameters
   * @returns {Promise<boolean>} Success status
   */
  static async launchMobileIntent(upiUrl, params) {
    // Try to launch UPI intent directly
    try {
      // Method 1: Direct intent launch
      window.location.href = upiUrl
      return true
    } catch (error) {
      console.log('Direct intent failed, trying alternatives')
      
      // Method 2: Try specific app intents
      return await this.launchSpecificAppIntents(params)
    }
  }

  /**
   * Launch UPI intent on desktop
   * @param {string} upiUrl - UPI intent URL
   * @param {Object} params - Payment parameters
   * @returns {Promise<boolean>} Success status
   */
  static async launchDesktopIntent(upiUrl, params) {
    // For desktop, show QR code or provide app links
    const qrCodeUrl = await this.generateQRCode(upiUrl)
    
    // Show modal with QR code and app links
    this.showDesktopPaymentModal(qrCodeUrl, params)
    return true
  }

  /**
   * Try launching specific UPI app intents
   * @param {Object} params - Payment parameters
   * @returns {Promise<boolean>} Success status
   */
  static async launchSpecificAppIntents(params) {
    const upiUrl = this.generateUPIIntent(params)
    const apps = this.getUPIApps()
    
    // Try each app with a small delay
    for (const app of apps) {
      try {
        const appIntent = app.generateIntent(upiUrl, params)
        console.log(`Trying ${app.name} intent:`, appIntent)
        
        // Create hidden iframe to trigger intent
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = appIntent
        document.body.appendChild(iframe)
        
        // Clean up after 1 second
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe)
          }
        }, 1000)
        
        // Wait a bit before trying next app
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.log(`${app.name} intent failed:`, error)
        continue
      }
    }
    
    return true
  }

  /**
   * Get list of supported UPI apps with their intent formats
   * @returns {Array} List of UPI apps
   */
  static getUPIApps() {
    return [
      {
        name: 'PhonePe',
        packageName: 'com.phonepe.app',
        generateIntent: (upiUrl) => `phonepe://pay?${upiUrl.split('?')[1]}`,
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.phonepe.app'
      },
      {
        name: 'Google Pay',
        packageName: 'com.google.android.apps.nfc.payment',
        generateIntent: (upiUrl) => `tez://upi/pay?${upiUrl.split('?')[1]}`,
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nfc.payment'
      },
      {
        name: 'Paytm',
        packageName: 'net.one97.paytm',
        generateIntent: (upiUrl) => `paytmmp://pay?${upiUrl.split('?')[1]}`,
        playStoreUrl: 'https://play.google.com/store/apps/details?id=net.one97.paytm'
      },
      {
        name: 'BHIM',
        packageName: 'in.org.npci.upiapp',
        generateIntent: (upiUrl) => upiUrl,
        playStoreUrl: 'https://play.google.com/store/apps/details?id=in.org.npci.upiapp'
      },
      {
        name: 'Amazon Pay',
        packageName: 'in.amazon.mShop.android.shopping',
        generateIntent: (upiUrl) => upiUrl,
        playStoreUrl: 'https://play.google.com/store/apps/details?id=in.amazon.mShop.android.shopping'
      }
    ]
  }

  /**
   * Generate QR code for UPI URL
   * @param {string} upiUrl - UPI intent URL
   * @returns {Promise<string>} QR code data URL
   */
  static async generateQRCode(upiUrl) {
    // For now, return a placeholder. In production, you'd use a QR library
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`
  }

  /**
   * Show desktop payment modal with QR code and app links
   * @param {string} qrCodeUrl - QR code image URL
   * @param {Object} params - Payment parameters
   */
  static showDesktopPaymentModal(qrCodeUrl, params) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="text-center">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Complete Payment</h3>
          <p class="text-sm text-gray-600 mb-4">
            Scan the QR code with any UPI app to pay ₹${params.amount} to ${params.upiId}
          </p>
          <img src="${qrCodeUrl}" alt="UPI QR Code" class="mx-auto mb-4 rounded-lg shadow-md" />
          <div class="space-y-2 mb-4">
            <p class="text-xs text-gray-500">Or download a UPI app:</p>
            <div class="flex justify-center space-x-2">
              <a href="https://play.google.com/store/apps/details?id=com.phonepe.app" target="_blank" 
                 class="text-blue-600 hover:text-blue-800 text-xs">PhonePe</a>
              <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.nfc.payment" target="_blank" 
                 class="text-blue-600 hover:text-blue-800 text-xs">Google Pay</a>
              <a href="https://play.google.com/store/apps/details?id=net.one97.paytm" target="_blank" 
                 class="text-blue-600 hover:text-blue-800 text-xs">Paytm</a>
            </div>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md">
            Close
          </button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal)
      }
    }, 30000)
  }

  /**
   * Check if current device is mobile
   * @returns {boolean} Is mobile device
   */
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * Validate UPI ID format
   * @param {string} upiId - UPI ID to validate
   * @returns {boolean} Is valid UPI ID
   */
  static isValidUPIId(upiId) {
    // UPI ID format: username@bank
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
    return upiRegex.test(upiId)
  }

  /**
   * Format amount for display
   * @param {string|number} amount - Amount to format
   * @returns {string} Formatted amount
   */
  static formatAmount(amount) {
    const num = parseFloat(amount)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(num)
  }
}

// Export convenience functions
export const {
  generateUPIIntent,
  launchUPIIntent,
  isValidUPIId,
  formatAmount,
  isMobileDevice
} = UPIIntent
