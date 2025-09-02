// PWA Utility Functions

// Service Worker Registration
export async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is ready, show update prompt
            showUpdatePrompt(registration);
          }
        });
      });

      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Show update prompt
function showUpdatePrompt(registration) {
  if (confirm('A new version of the app is available. Update now?')) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}

// Push Notification Setup
export async function setupPushNotifications() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!('PushManager' in window)) {
      console.log('Push messaging not supported');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return null;
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Offline Storage with IndexedDB
export class OfflineStorage {
  constructor() {
    this.dbName = 'UPI-PWA';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('synced', 'synced', { unique: false });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Create cache metadata store
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          const cacheStore = db.createObjectStore('cacheMetadata', { keyPath: 'url' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async storeTransaction(transaction) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      
      const transactionWithId = {
        ...transaction,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        synced: navigator.onLine
      };
      
      const request = store.add(transactionWithId);
      request.onsuccess = () => resolve(transactionWithId);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsynced() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');
      const index = store.index('synced');
      
      const request = index.getAll(false);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const transaction = getRequest.result;
        if (transaction) {
          transaction.synced = true;
          const putRequest = store.put(transaction);
          putRequest.onsuccess = () => resolve(transaction);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Transaction not found'));
        }
      };
    });
  }

  async getAllTransactions() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['transactions'], 'readonly');
      const store = tx.objectStore('transactions');
      const index = store.index('timestamp');
      
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result.reverse());
      request.onerror = () => reject(request.error);
    });
  }

  async storeSetting(key, value) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['settings'], 'readwrite');
      const store = tx.objectStore('settings');
      
      const request = store.put({ key, value });
      request.onsuccess = () => resolve({ key, value });
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['settings'], 'readonly');
      const store = tx.objectStore('settings');
      
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
}

// Network Status Detection
export function setupNetworkStatusDetection() {
  const updateOnlineStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    document.body.setAttribute('data-network-status', status);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('networkstatuschange', {
      detail: { online: navigator.onLine }
    }));
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial status
  updateOnlineStatus();
}

// App Install Detection
export function setupInstallPrompt() {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button
    window.dispatchEvent(new CustomEvent('showinstallprompt', {
      detail: { prompt: deferredPrompt }
    }));
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    window.dispatchEvent(new CustomEvent('appinstalled'));
  });

  return deferredPrompt;
}

// Background Sync Registration
export async function registerBackgroundSync(tag = 'background-sync') {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered');
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}

// Share API
export async function shareContent(shareData) {
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  } else {
    // Fallback to clipboard
    if (navigator.clipboard && shareData.url) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        return true;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
      }
    }
  }
  return false;
}

// Performance Monitoring
export function setupPerformanceMonitoring() {
  // Monitor navigation timing
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load performance:', {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        });
      }, 0);
    });
  }

  // Monitor resource loading
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) {
          console.warn('Slow resource loading:', entry.name, entry.duration + 'ms');
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
}

// Initialize PWA features
export async function initPWA() {
  console.log('Initializing PWA features...');
  
  // Register service worker
  await registerSW();
  
  // Setup network detection
  setupNetworkStatusDetection();
  
  // Setup install prompt
  setupInstallPrompt();
  
  // Setup performance monitoring
  setupPerformanceMonitoring();
  
  // Initialize offline storage
  const storage = new OfflineStorage();
  await storage.init();
  
  console.log('PWA initialization complete');
  
  return {
    storage,
    setupPushNotifications,
    registerBackgroundSync,
    shareContent
  };
}
