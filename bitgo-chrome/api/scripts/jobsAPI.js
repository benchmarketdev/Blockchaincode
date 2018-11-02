/**
 * @ngdoc service
 * @name jobsAPI
 * @description
 * This manages app API requests for listing jobs through the BitGo website
 */
/* istanbul ignore next */
angular.module('BitGo.API.JobsAPI', [])

.factory('JobsAPI', ['SDK',
  function(SDK) {
    /**
    * List the jobs posted on the workable website
    * @private
    */
    function list() {
      return SDK.wrap(
        SDK.doGet('/jobs')
      );
    }

    // Client API
    return {
      list: list
    };
  }
]);
