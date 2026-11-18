// CampBridge service worker.
//
// - CACHE_NAME is versioned: bump the suffix to invalidate the old cache.
// - Cache-first: build-static assets and common static files (content-hashed
//   or immutable), so repeat loads work without the network.
// - Network-first for /api/*: always hit the network and never write API
//   responses to the cache — they are session-cookie gated and dynamic.
// - Navigations are never intercepted, so Next.js keeps full control of
//   routing and offline document handling.
const CACHE_NAME = "campbridge-v1"

// Version-stable, same-origin prefixes that are safe to serve from cache.
const CACHE_FIRST_PREFIXES = ["/_next/static/", "/_next/image"]

// Common static asset extensions served cache-first.
const STATIC_EXTENSIONS = [
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".wasm",
]

function isCacheFirstRequest(url, request) {
  if (request.method !== "GET") return false
  if (CACHE_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return true
  const pathname = url.pathname.toLowerCase()
  return STATIC_EXTENSIONS.some((extension) => pathname.endsWith(extension))
}

function isApiRequest(url) {
  return url.pathname === "/api" || url.pathname.startsWith("/api/")
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // Full page navigations are out of scope — never intercept them.
  if (request.mode === "navigate") return

  const url = new URL(request.url)

  // Only handle same-origin requests; third-party traffic passes through.
  if (url.origin !== self.location.origin) return

  // API traffic is network-first and never persisted: responses are
  // session-cookie gated and dynamic, so caching them would leak data
  // between accounts and serve stale mutation results.
  if (isApiRequest(url)) {
    event.respondWith(fetch(request))
    return
  }

  if (isCacheFirstRequest(url, request)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok && response.type === "basic") {
          try {
            const cache = await caches.open(CACHE_NAME)
            await cache.put(request, response.clone())
          } catch {
            // A failed cache write must never break the response.
          }
        }
        return response
      })()
    )
  }
})
