const CACHE_NAME = 'votaciones-estudiantiles-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Recursos críticos que se cachean durante la instalación
const CRITICAL_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  OFFLINE_URL
];

// Recursos que se cachean dinámicamente
const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  static: 'cache-first',
  html: 'network-first'
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v' + CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando recursos críticos');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Recursos críticos cacheados exitosamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error cacheando recursos críticos:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker v' + CACHE_NAME);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones no HTTP
  if (!request.url.startsWith('http')) return;
  
  // Manejar peticiones según el tipo de recurso
  if (url.pathname.startsWith('/api/') || url.hostname.includes('couchdb')) {
    // Estrategia network-first para APIs
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Estrategia cache-first para imágenes
    event.respondWith(handleImageRequest(request));
  } else if (request.mode === 'navigate') {
    // Estrategia network-first para navegación
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Estrategia por defecto
    event.respondWith(handleDefaultRequest(request));
  }
});

// Manejar peticiones de API (Network First)
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Solo cachear respuestas exitosas
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Red no disponible, buscando en cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retornar respuesta offline para APIs
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No hay conexión de red disponible'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Manejar peticiones de imágenes (Cache First)
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Error cargando imagen:', request.url);
    // Retornar imagen placeholder si está disponible
    return caches.match('/icons/placeholder.png') || 
           new Response('', { status: 404 });
  }
}

// Manejar navegación (Network First con fallback offline)
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navegación offline, mostrando página cacheada');
    
    // Intentar servir desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback a página offline
    return caches.match(OFFLINE_URL) || 
           caches.match('/') ||
           new Response('Aplicación no disponible offline', {
             status: 503,
             headers: { 'Content-Type': 'text/plain' }
           });
  }
}

// Manejar peticiones por defecto
async function handleDefaultRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Recurso no disponible:', request.url);
    return new Response('Recurso no disponible offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Manejar sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronización:', event.tag);
  
  if (event.tag === 'background-sync-votes') {
    event.waitUntil(syncVotes());
  } else if (event.tag === 'background-sync-students') {
    event.waitUntil(syncStudents());
  }
});

// Sincronizar votos pendientes
async function syncVotes() {
  try {
    console.log('[SW] Sincronizando votos pendientes...');
    
    // Obtener votos pendientes desde IndexedDB
    const pendingVotes = await getPendingVotes();
    
    for (const vote of pendingVotes) {
      try {
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vote)
        });
        
        if (response.ok) {
          await removePendingVote(vote.id);
          console.log('[SW] Voto sincronizado:', vote.id);
        }
      } catch (error) {
        console.error('[SW] Error sincronizando voto:', vote.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Error en sincronización de votos:', error);
  }
}

// Sincronizar datos de estudiantes
async function syncStudents() {
  try {
    console.log('[SW] Sincronizando datos de estudiantes...');
    // Implementar lógica de sincronización de estudiantes
  } catch (error) {
    console.error('[SW] Error en sincronización de estudiantes:', error);
  }
}

// Funciones auxiliares para IndexedDB
async function getPendingVotes() {
  // Implementar obtención de votos pendientes
  return [];
}

async function removePendingVote(voteId) {
  // Implementar eliminación de voto pendiente
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Notificación push recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'votaciones-notification',
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema de Votación', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Logging de errores
self.addEventListener('error', (event) => {
  console.error('[SW] Error en Service Worker:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Promise rechazado en Service Worker:', event.reason);
});