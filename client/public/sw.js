const CACHE_NAME = 'upi-pwa-v2';
const STATIC_CACHE = 'upi-static-v2';
const DYNAMIC_CACHE = 'upi-dynamic-v2';

const staticAssets = [
  '/',
  '/history',
  '/manifest.json',
  '/offline.html',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

const cacheFirst = [
  /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp)$/
];

const networkFirst = [
  /\/api\//,
  /\/auth\//
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(staticAssets);
      }),
      caches.open(DYNAMIC_CACHE)
    ]).then(() => {
      console.log('Service Worker: Installed');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Activated');
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    // Handle POST requests for offline functionality
    if (request.method === 'POST' && url.pathname === '/api/transactions') {
      event.respondWith(handleOfflineTransaction(request));
    }
    return;
  }

  // Cache first strategy for static assets
  if (cacheFirst.some(regex => regex.test(request.url))) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Network first strategy for API calls
  if (networkFirst.some(regex => regex.test(request.url))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Stale while revalidate for pages
  event.respondWith(staleWhileRevalidate(request));
});

// Cache first strategy
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => {
    // If network fails and we have no cache, show offline page
    if (!cached && request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw new Error('Network failed and no cache available');
  });

  return cached || fetchPromise;
}

// Handle offline transactions
async function handleOfflineTransaction(request) {
  try {
    // Try to send the transaction
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Store for background sync
    const transaction = await request.json();
    await storeOfflineTransaction(transaction);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('background-sync');
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Transaction stored for when you\'re back online',
      offline: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineTransactions());
  }
});

// Store offline transaction in IndexedDB
async function storeOfflineTransaction(transaction) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UPI-PWA', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      
      const transactionWithId = {
        ...transaction,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      store.add(transactionWithId);
      
      tx.oncomplete = () => resolve(transactionWithId);
      tx.onerror = () => reject(tx.error);
    };
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

// Sync offline transactions
async function syncOfflineTransactions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UPI-PWA', 1);
    
    request.onsuccess = async () => {
      const db = request.result;
      const tx = db.transaction(['transactions'], 'readwrite');
      const store = tx.objectStore('transactions');
      const index = store.index('synced');
      
      const unsyncedRequest = index.getAll(false);
      
      unsyncedRequest.onsuccess = async () => {
        const unsynced = unsyncedRequest.result;
        console.log('Service Worker: Found', unsynced.length, 'unsynced transactions');
        
        for (const transaction of unsynced) {
          try {
            const response = await fetch('/api/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                upiId: transaction.upiId,
                amount: transaction.amount,
                note: transaction.note
              }),
            });
            
            if (response.ok) {
              // Mark as synced
              transaction.synced = true;
              store.put(transaction);
              console.log('Service Worker: Transaction synced successfully');
              
              // Send notification to user
              self.registration.showNotification('Transaction Sent', {
                body: `₹${transaction.amount} sent to ${transaction.upiId}`,
                icon: '/icon-192x192.svg',
                badge: '/icon-72x72.svg',
                tag: 'transaction-success'
              });
            }
          } catch (error) {
            console.error('Service Worker: Failed to sync transaction:', error);
          }
        }
        resolve();
      };
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192x192.svg',
    badge: '/icon-72x72.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-192x192.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('UPI PWA', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
