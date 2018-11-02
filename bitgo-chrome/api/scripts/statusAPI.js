/**
 * @ngdoc service
 * @name StatusAPI
 * @description
 * Manages the http requests dealing with server status/availability
 */
/* istanbul ignore next */
angular.module('BitGo.API.StatusAPI', [])

.factory('StatusAPI', ['SDK',
  function(SDK) {

    /**
    * Check BitGo service status
    * @private
    */
    function ping() {
      return SDK.wrap(
        SDK.get().ping()
      );
    }

    /** In-client API */
    return {
      ping: ping
    };
  }
]);
