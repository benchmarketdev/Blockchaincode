angular.module('BitGo.Utility.CacheService', [])

.factory('CacheService', ['$location',
  function($location) {
    var BITGO_NAMESPACE = 'BG.';
    var VALID_STORAGE_TYPES = ['localStorage', 'sessionStorage'];

    // In-memory copy of all caches
    var cacheList = {};

    // Determines if the browser supports local or session storage
    function supportsStorageType(storageType) {
      if (!_.contains(VALID_STORAGE_TYPES, storageType)) {
        return false;
      }
      if ($location.protocol() === 'chrome-extension') {
        return false;  // Don't even try to touch window.localStorage or you'll get error messages in the console.
      }
      var storageTypeSupported;
      try {
        // Relevant conversation on github:
        // https://github.com/angular-translate/angular-translate/issues/629
        if (storageType in window) {
          if (window[storageType] !== null) {
            storageTypeSupported = true;
          }
        }
        // We might have the property on the window, but not have access
        // to storage -- test it
        var testKey = 'storageKey';
        window[storageType].setItem(testKey, 'foo');
        window[storageType].removeItem(testKey);
      } catch (e) {
        storageTypeSupported = false;
      }
      return storageTypeSupported;
    }

    // Facade for sessionStorage
    var SessionStorage = function(name) {
      this.name = name;
      this.store = window.sessionStorage;
    };

    SessionStorage.prototype.get = function(id) {
      id = this.name + '.' + id;
      // ensure it exists before parsing
      return window.sessionStorage[id] && JSON.parse(window.sessionStorage[id]);
    };

    SessionStorage.prototype.addOrUpdate = function(id, value) {
      id = this.name + '.' + id;
      // Session storage can only store strings
      window.sessionStorage[id] = JSON.stringify(value);
    };

    SessionStorage.prototype.remove = function(id) {
      id = this.name + '.' + id;
      delete window.sessionStorage[id];
    };

    SessionStorage.prototype.clear = function() {
      window.sessionStorage.clear();
    };

    // Facade for localStorage
    var LocalStorage = function(name) {
      this.name = name;
      this.store = window.localStorage;
    };

    LocalStorage.prototype.itemId = function(id) {
      return this.name + '.' + id;
    };

    LocalStorage.prototype.get = function(id) {
      id = this.itemId(id);
      var result;
      try {
        result = this.store.getItem(id);
      } catch (e) {
        console.log("LocalStorage could not get " + id + ": " + e);
        return undefined;
      }
      try {
        return JSON.parse(result);
      } catch (e) {
        this.remove(id);  // it's corrupt. nuke it.
      }
      return undefined;
    };

    LocalStorage.prototype.addOrUpdate = function(id, value) {
      id = this.itemId(id);
      try {
        return this.store.setItem(id, JSON.stringify(value));
      } catch (e) {
        console.log("LocalStorage could not addOrUpdate " + id + ": " + e);
      }
    };

    LocalStorage.prototype.remove = function(id) {
      id = this.itemId(id);
      try {
        this.store.removeItem(id);
      } catch (e) {
        console.log("LocalStorage could not remove " + id + ": " + e);
      }
    };

    LocalStorage.prototype.clear = function() {
      try {
        this.store.clear();
      } catch (e) {
        console.log("LocalStorage could not clear: " + e);
      }
    };

    // Facade for in-memory cache if no access to localStorage / sessionStorage
    var MemoryStorage = function(name) {
      this.name = name;
      this.cache = {};
    };

    MemoryStorage.prototype.get = function(id) {
      return this.cache[id];
    };

    MemoryStorage.prototype.addOrUpdate = function(id, value) {
      this.cache[id] = value;
    };

    MemoryStorage.prototype.remove = function(id) {
      delete this.cache[id];
    };

    MemoryStorage.prototype.clear = function() {
      this.cache = {};
    };

    // Object allowing instantiation of various cache types
    var storageTypes = {
      localStorage: function(cacheName) {
        return supportsStorageType('localStorage') ?
                new LocalStorage(BITGO_NAMESPACE + cacheName) :
                new MemoryStorage(BITGO_NAMESPACE + cacheName);
      },
      sessionStorage: function(cacheName) {
        return supportsStorageType('sessionStorage') ?
                new SessionStorage(BITGO_NAMESPACE + cacheName) :
                new MemoryStorage(BITGO_NAMESPACE + cacheName);
      },
      memoryStorage: function(cacheName) {
        return new MemoryStorage(BITGO_NAMESPACE + cacheName);
      }
    };

    // Cache Factory function
    function Cache(storageType, cacheName, expirationIntervalMillis) {
      if (storageType != 'localStorage' && storageType != 'sessionStorage' && storageType!= 'memoryStorage') {
        storageType = 'localStorage';
      }
      var cache = storageTypes[storageType](cacheName);
      this.expirationIntervalMillis = expirationIntervalMillis;
      this.storageType = storageType;
      this.storage = cache;
      // Add the instance to the cacheList
      cacheList[cacheName] = this;
    }
    Cache.prototype.add = function(id, value) {
      if (!value) {  // Don't cache undefined or null items.
        return value;
      }
      value._created = Date.now();
      this.storage.addOrUpdate(id, value);
    };
    Cache.prototype.get = function(id) {
      var item = this.storage.get(id);
      if (this.isExpired(item)) {
        this.remove(item);
        item = undefined;
      }
      if (!item) {
        return undefined;   // BE SURE TO RETURN undefined AND NOT null
      }
      return item;
    };
    Cache.prototype.remove = function(id) {
      this.storage.remove(id);
    };
    // WARNING: this clears all cache data globally, not just this cache.
    Cache.prototype.clear = function() {
      this.storage.clear();
      cacheList = [];
    };
    Cache.prototype.isExpired = function(item) {
      return (item && item._created && (Date.now() - item._created > this.expirationIntervalMillis));
    };

    // Get a specific cache from the inMemory list of caches
    function getCache(cacheName) {
      return cacheList[cacheName];
    }

    // Pubic API for CacheService
    return {
      Cache: Cache,
      getCache: getCache
    };
  }
]);
