/*
 * IntersectionObserver fallback for Golden Snack legacy terminals.
 *
 * Android 5 / Chrome-WebView 45-46 does not provide IntersectionObserver.
 * The terminal UI only needs a safe visibility observer so components that
 * depend on the API can render instead of crashing. On browsers with native
 * support this file does nothing.
 */

(function installIntersectionObserverPolyfill() {
  if (typeof window === 'undefined' || 'IntersectionObserver' in window) return;

  function makeRect(rect) {
    if (!rect) {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
      };
    }

    var width = typeof rect.width === 'number'
      ? rect.width
      : Math.max(0, rect.right - rect.left);
    var height = typeof rect.height === 'number'
      ? rect.height
      : Math.max(0, rect.bottom - rect.top);

    return {
      top: rect.top || 0,
      right: rect.right || 0,
      bottom: rect.bottom || 0,
      left: rect.left || 0,
      width: width,
      height: height,
    };
  }

  function LegacyIntersectionObserver(callback, options) {
    if (typeof callback !== 'function') {
      throw new TypeError('IntersectionObserver callback must be a function');
    }

    this._callback = callback;
    this._targets = [];
    this.root = options && options.root ? options.root : null;
    this.rootMargin = options && options.rootMargin ? options.rootMargin : '0px';
    this.thresholds = options && options.threshold != null
      ? (Array.isArray(options.threshold) ? options.threshold : [options.threshold])
      : [0];
  }

  LegacyIntersectionObserver.prototype.observe = function observe(target) {
    if (!target || typeof target.getBoundingClientRect !== 'function') return;
    if (this._targets.indexOf(target) === -1) this._targets.push(target);

    var self = this;
    window.setTimeout(function notifyVisible() {
      if (self._targets.indexOf(target) === -1) return;

      var rect = makeRect(target.getBoundingClientRect());
      var rootRect = makeRect({
        top: 0,
        left: 0,
        right: window.innerWidth || document.documentElement.clientWidth || 0,
        bottom: window.innerHeight || document.documentElement.clientHeight || 0,
      });
      rootRect.width = rootRect.right;
      rootRect.height = rootRect.bottom;

      self._callback([{
        time: Date.now(),
        target: target,
        rootBounds: rootRect,
        boundingClientRect: rect,
        intersectionRect: rect,
        isIntersecting: true,
        intersectionRatio: 1,
      }], self);
    }, 0);
  };

  LegacyIntersectionObserver.prototype.unobserve = function unobserve(target) {
    var index = this._targets.indexOf(target);
    if (index !== -1) this._targets.splice(index, 1);
  };

  LegacyIntersectionObserver.prototype.disconnect = function disconnect() {
    this._targets = [];
  };

  LegacyIntersectionObserver.prototype.takeRecords = function takeRecords() {
    return [];
  };

  window.IntersectionObserver = LegacyIntersectionObserver;
  window.IntersectionObserverEntry = function IntersectionObserverEntry(entry) {
    if (entry) {
      for (var key in entry) {
        if (Object.prototype.hasOwnProperty.call(entry, key)) this[key] = entry[key];
      }
    }
  };
})();
