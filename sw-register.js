// Service Worker Registration Script
(function() {
  'use strict';
  
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return;
  }
  
  // Service Worker registration
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
  
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available, show update notification
              showUpdateNotification();
            } else {
              // Content is cached for the first time
              console.log('Content is cached for offline use');
            }
          }
        });
      });
      
      // Handle controller change (when new service worker takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        // Reload the page to get the new content
        window.location.reload();
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  // Show update notification
  function showUpdateNotification() {
    // Check if update notification already exists
    if (document.getElementById('update-notification')) {
      return;
    }
    
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-[100] max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-bold">Update Available</div>
          <div class="text-sm">New version is ready to install</div>
        </div>
        <div class="flex gap-2 ml-4">
          <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100">
            Update
          </button>
          <button id="dismiss-update-btn" class="text-white hover:text-gray-200 px-2">
            ✕
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add event listeners
    document.getElementById('update-btn').addEventListener('click', () => {
      // Tell the service worker to skip waiting and activate
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      notification.remove();
    });
    
    document.getElementById('dismiss-update-btn').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.getElementById('update-notification')) {
        notification.remove();
      }
    }, 10000);
  }
  
  // Check for updates periodically
  setInterval(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
    }
  }, 60000); // Check every minute
  
  // Handle online/offline status
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      // Trigger background sync when back online
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('background-sync');
        });
      }
    }
  }
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Expose service worker utilities globally
  window.swUtils = {
    getVersion: async () => {
      if (navigator.serviceWorker.controller) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.version);
          };
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          );
        });
      }
      return null;
    },
    
    skipWaiting: () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  };
  
})();
