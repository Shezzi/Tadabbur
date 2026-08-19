// Service Worker Registration Script
(function() {
  'use strict';

  // Captured synchronously: document.currentScript is only readable while this
  // script is executing, and the app must work both at a domain root and inside a
  // GitHub Pages project subfolder (e.g. /Tadabbur/).
  var BASE_URL = new URL('.', (document.currentScript && document.currentScript.src) || window.location.href);

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
      const registration = await navigator.serviceWorker.register(new URL('sw.js', BASE_URL).href, {
        scope: BASE_URL.href
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
      
      // Handle controller change (when new service worker takes control).
      // The refreshing flag prevents an infinite reload loop.
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('Service Worker controller changed, reloading for new content');
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
      // The SKIP_WAITING message must go to the *waiting* worker; the active
      // controller is the old version and ignores it.
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });
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
  
  // Ask the browser to re-check sw.js for a new deployment. registration.update() is
  // what actually fetches it; the previous postMessage('CHECK_UPDATE') was a no-op
  // because the service worker has no handler for that message.
  function checkForUpdate() {
    navigator.serviceWorker.getRegistration().then(function (registration) {
      if (registration) registration.update();
    }).catch(function () { /* offline: nothing to do */ });
  }

  setInterval(checkForUpdate, 60 * 60 * 1000); // hourly

  // Also check whenever the user returns to the tab.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') checkForUpdate();
  });

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
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  };
  
})();


