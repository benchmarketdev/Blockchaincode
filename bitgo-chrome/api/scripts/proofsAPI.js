/**
 * @ngdoc service
 * @name ProofsAPI
 * @description
 * Manages the http requests dealing with proof of reserves
 */
/* istanbul ignore next */
angular.module('BitGo.API.ProofsAPI', [])

.factory('ProofsAPI', ['$location', 'SDK',
  function($location, SDK) {
    /**
    * List all proofs
    * @private
    */
    function list() {
      return SDK.wrap(
        SDK.doGet('/proof')
      );
    }

    /**
    * Get a patner's proof based on hash
    * @private
    */
    function get(proofId) {
      if (!proofId) {
        throw new Error('missing proofId');
      }
      return SDK.wrap(
        SDK.doGet('/proof/' + proofId)
      );
    }

    /**
    * Get a specific liability proof
    * @private
    */
    function getLiability(params) {
      if (!params.hash) {
        throw new Error('invalid params');
      }
      return SDK.wrap(
        SDK.doGet('/proof/liability/' + params.hash, {
          user: params.user,
          nonce: params.nonce
        })
      );
    }

    /** In-client API */
    return {
      get: get,
      getLiability: getLiability,
      list: list
    };
  }
]);
