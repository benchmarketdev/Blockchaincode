angular.module('BitGo.API.IdentityAPI', [])
/**
 * @ngdoc factory
 * @name IdentityAPI
 * @description API endpoints for identity verification
 */
.factory('IdentityAPI', ['$rootScope', 'SDK',
  /* istanbul ignore next */
  function($rootScope, SDK) {

    /**
     * Create a login with our KYC provider and return the oauth_key used
     * to verify identity.
     * @param identity {Object} - Include name, phone and finger strings
     * @returns Promise returning oauth_key
     */
    function createIdentity(identity) {
      return SDK.wrap(SDK.doPost('/identity/create', identity))
      .then(handleAPIErrors)
      .then(function(res) { return res.oauth_key; });
    }

    /**
     * Verify information submitted during identity verification process
     * is valid and unique to the user
     * @param oauth_key {String} - Returned from createIdentity API endpoint
     * @returns return {Object} containing a boolean property called 'verified'
     */
    function verifyIdentity(oauth_key) {
      return SDK.wrap(SDK.doPost('/identity/verify', { oauth_key: oauth_key }))
      .then(handleAPIErrors)
      .then(function(res) { return res.verified; });
    }

    function handleAPIErrors(res) {
      if (res.error) {
        var error = new Error(res.error);
        error.retryTime = res.retryTime;
        throw error;
      }
      return res;
    }

    return {
      createIdentity: createIdentity,
      verifyIdentity: verifyIdentity
    };

  }]
);
