/**
 * @ngdoc service
 * @name SDK
 * @description
 * Manages authenticating with and caching the sdk object of the SDK, so that
 * the SDK can be used throughout the client.
 */
angular.module('BitGo.API.SDK', ['ngResource'])

.factory('SDK', ['$q', 'CacheService', 'UtilityService',
  function($q, CacheService, Utils) {
    var sdkCache = new CacheService.Cache('sessionStorage', 'SDK');
    var PromiseErrorHelper = Utils.API.promiseErrorHelper;

    // if a URL other than one of the standard ones (www.bitgo.com, etc.) is
    // detected, this gets set to that URL
    var customRootURI;

    // the network (bitcoin or test) if we aren't using one of the standard
    // environments
    var customBitcoinNetwork;

    var env = BitGoConfig.env.getSDKEnv();
    if (!env) {
      customRootURI = 'https://' + location.host;
      customBitcoinNetwork = 'test';
    }

    // parameters for constructing SDK object
    var params = {
      env: env,
      customRootURI: customRootURI,
      customBitcoinNetwork: customBitcoinNetwork,
      validate: false // for the benefit of slower devices, don't perform redundant validation
    };

    var sdk;

    return {
      bitcoin: BitGoJS.bitcoin,
      sjcl: BitGoJS.sjcl,

      /**
      * Returns the current instance of the SDK. If not already loaded, it
      * loads the SDK.
      *
      * @returns {Object} an instance of the SDK
      */
      get: function() {
        if (sdk) {
          return sdk;
        }
        return this.load();
      },

      getNetwork: function() {
        return this.bitcoin.networks[BitGoJS.getNetwork()];
      },

      /**
       * Helper functions to do direct verbs (GET/POST/PUT/DELETE) against SDK
       * @param   {String} url   URL path
       * @param   {Object} data   data to use as body or query (for GET)
       * @param   {String} field  (optional) field name to extract from result body
       * @returns {Promise<Object>}    result body
       */
      doPost: function(url, data, field) {
        var sdk = this.get();
        return sdk.post(sdk.url(url)).send(data).result(field);
      },

      doPut: function(url, data, field) {
        var sdk = this.get();
        return sdk.put(sdk.url(url)).send(data).result(field);
      },

      doGet: function(url, data, field) {
        var sdk = this.get();
        return sdk.get(sdk.url(url)).query(data).result(field);
      },

      doDelete: function(url, data, field) {
        data = data || {};
        var sdk = this.get();
        return sdk.del(sdk.url(url)).send(data).result(field);
      },

      /**
       * Pass-through for sjcl.encrypt
       */
      encrypt: function(password, message) {
        return this.get().encrypt({
          password: password,
          input: message
        });
      },

      /**
       * Pass-through for sjcl.decrypt
       */
      decrypt: function(password, message) {
        return this.get().decrypt({
          password: password,
          input: message
        });
      },

      /**
       * Generate a random password on the client
       * @param   {Number} numWords     Number of 32-bit words
       * @returns {String}          base58 random password
       */
      generateRandomPassword: function(numWords) {
        numWords = numWords || 5;
        var bytes = this.sjcl.codec.bytes.fromBits(this.sjcl.random.randomWords(numWords));
        return BitGoJS.bs58.encode(bytes);
      },

      /**
       * Generate HMAC of email/password for passing credentials to server
       * @param   {String} email    user's username
       * @param   {String} password   user's password
       * @returns {String}          HMAC'd password
       */
      passwordHMAC: function(email, password) {
        var sjcl = this.sjcl;
        var out =  (new sjcl.misc.hmac(
          sjcl.codec.utf8String.toBits(email),
          sjcl.hash.sha256
        ))
        .mac(password);
        return sjcl.codec.hex.fromBits(out).toLowerCase();
      },

      /**
       * Wrap a promise chain with Angular's $q, and catch with PromiseErrorHelper
       * @param   {Promise} promise    any promise
       * @returns {Promise}         an Angular $q promise
       */
      wrap: function(promise) {
        return $q.when(promise)
        .catch(PromiseErrorHelper());
      },

      /**
      * Loads an instance of the SDK from cache and returns it. If the SDK is
      * not found in the cache, a new instance is created and returned.
      *
      * @returns {Object} an instance of the SDK
      */
      load: function() {
        var json = sdkCache.get('sdk');
        sdk = new BitGoJS.BitGo(params);
        if (json) {
          try {
            sdk.fromJSON(json);
          } catch (e) {
            // if there was an error loading the SDK JSON data, we'll make a
            // new one. If such an error ever occurs, it may mean a logged-in
            // user is no longer logged in.
            sdk = new BitGoJS.BitGo(params);
          }
        }
        return sdk;
      },

      /**
      * Saves the current instance of the SDK to cache. This should be called
      * everytime you wish to cache the SDK, for instance after logging in, if
      * you wish to remember the state of the sdk upon page reload.
      *
      * @returns {undefined}
      */
      save: function() {
        sdkCache.add('sdk', sdk.toJSON());
      },

      /**
      * Deletes the instance of the SDK from cache. This is what you should do
      * when you want to clear the memory of the SDK, for instance if the user
      * is logging out.
      *
      * @returns {undefined}
      */
      delete: function() {
        sdk = undefined;
        sdkCache.remove('sdk');
      }
    };
  }
]);
