/*
 * Minimal IntersectionObserver polyfill for Golden Snack legacy terminals.
 * Targets Android 5 / Chrome-WebView 45-46 and only installs itself when the
 * native API is missing. No external network dependency is required.
 */

(function installIntersectionObserverPolyfill() {
  if (typeof window === 'undefined' || 'IntersectionObserver' in window) return;