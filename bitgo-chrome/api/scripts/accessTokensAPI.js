/**
 * @ngdoc service
 * @name AccessTokensAPI
 * @description
 * This manages app API requests for the access token functionality in BitGo
 */
/* istanbul ignore next */
angular.module('BitGo.API.AccessTokensAPI', [])

.factory('AccessTokensAPI', ['$resource', 'SDK',
  function($resource, SDK) {

    /**
    * Add an access token to a user
    * @param params {Object}
    * @private
    */
    function add(params) {
      if (!params) {
        throw new Error('missing params');
      }
      return SDK.wrap(
        SDK.doPost('/user/accesstoken', params)
      );
    }

    /**
    * Lists the access tokens for a user
    * @private
    */
    function list() {
      return SDK.wrap(
        SDK.doGet('/user/accesstoken')
      );
    }

    /**
    * Remove an access token for a user
    * @private
    */
    function remove(accessTokenId) {
      if (!accessTokenId) {
        throw new Error('missing accessTokenId');
      }
      return SDK.wrap(
        SDK.doDelete('/user/accesstoken/' + accessTokenId)
      );
    }

    // Client API
    return {
      add: add,
      list: list,
      remove: remove
    };
  }
]);
