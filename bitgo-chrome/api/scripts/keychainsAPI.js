angular.module('BitGo.API.KeychainsAPI', [])
/*
  Notes:
  - This module is for managing all http requests for Keychains
*/
.factory('KeychainsAPI', ['$q', '$location', '$rootScope', 'UtilityService', 'UserAPI', 'SDK',
  function($q, $location, $rootScope, Utils, UserAPI, SDK) {
    var PromiseErrorHelper = Utils.API.promiseErrorHelper;

    // Helper: generates a new BIP32 keychain to use
    function generateKey() {
      var keyData = SDK.get().keychains().create();
      return SDK.bitcoin.HDNode.fromBase58(keyData.xprv);
    }

    /* istanbul ignore next */
    function getColdKey(secret) {
      if (typeof(secret) !== 'string') {
        throw Error('illegal argument');
      }
      return SDK.wrap(
        SDK.doGet('/coldkey/' + secret)
      );
    }

    // Creates keychains on the BitGo server
    function createKeychain(data) {
      // source for the keychain being created (currently 'user' or 'cold')
      var source = data.source;
      // the passcode used to encrypt the xprv
      var passcode = data.passcode;
      // the BIP32 extended key used to create a keychain when a user wants to use their own backup
      var hdNode = data.hdNode;
      var saveEncryptedXprv = data.saveEncryptedXprv;

      // If the user doesn't provide a key, generate one
      if (!hdNode) {
        hdNode = generateKey();
      }
      // Each saved keychain object has these properties
      var keychainData = {
        source: data.source,
        xpub: hdNode.neutered().toBase58()
      };
      // If we're storing the encryptedXprv, include this with the request
      if (saveEncryptedXprv) {
        // The encrypted xprv; encrypted with the wallet's passcode
        keychainData.encryptedXprv = SDK.encrypt(passcode, hdNode.toBase58());
        // And a code that is used to encrypt the user's wallet passcode (the 'passcode' referenced in this function)
        // This code is only ever used to encrypt the original passcode for this keychain,
        // and is used only for recovery purposes with the original encrypted xprv blob.
        //if we are generating ECDH key for user, passcodencryption code is not needed
        if(source !== 'ecdh'){
          keychainData.originalPasscodeEncryptionCode = data.originalPasscodeEncryptionCode;
        }
      }

      function onCreateSuccess(data) {
        // For backup purposes: We'll decorate the returned keychain object
        // with the xprv and encryptedXprv so we can access them in the app
        if (hdNode.privKey) {
          data.xprv = hdNode.toBase58();
          if (!data.encryptedXprv) {
            data.encryptedXprv = SDK.encrypt(passcode, data.xprv);
          }
        }
        return data;
      }
      // Return the promise
      return $q.when(
        SDK.get().keychains().add(keychainData)
      )
      .then(
        function(data) {
          return onCreateSuccess(data);
        },
        function(error) {
          // 301 means we tried adding a keychain that already exists
          // so we treat this case like a success and return the keychain
          if (error.status === 301) {
            return onCreateSuccess(data);
          }
          return PromiseErrorHelper()(error);
        }
      );
    }

    // Create and return the new BitGo keychain
    /* istanbul ignore next */
    function createBitGoKeychain() {
      return SDK.wrap(
        SDK.get().keychains().createBitGo()
      );
    }

    /**
     * Create and return a new backup keychain from a backup provider
     * @param {string} the name of the provider to create the xpub from
     * @returns {Obj} new backup keychain with krs xpub
     */
    /* istanbul ignore next */
    function createBackupKeychain(provider) {
      return SDK.wrap(
        SDK.get().keychains().createBackup({ provider: provider })
      );
    }

    // Get a specific BitGo keychain
    /* istanbul ignore next */
    function get(xpub) {
      return SDK.wrap(
        SDK.get().keychains().get({ xpub: xpub })
      );
    }

    /**
     * Update a bitgo keychain
     * @param {Obj} bitgo keychain object to update
     * @returns {Obj} updated bitgo keychain
     */
    /* istanbul ignore next */
    function update(params) {
      return SDK.wrap(
        SDK.get().keychains().update(params)
      );
    }

    // In-client API
    return {
      get: get,
      update: update,
      createKeychain: createKeychain,
      createBitGoKeychain: createBitGoKeychain,
      createBackupKeychain: createBackupKeychain,
      generateKey: generateKey,
      getColdKey: getColdKey
    };
  }
]);
