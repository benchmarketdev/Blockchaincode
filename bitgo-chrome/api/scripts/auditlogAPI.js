/* istanbul ignore next */
angular.module('BitGo.API.AuditLogAPI', [])

.factory('AuditLogAPI', ['$rootScope', 'SDK',
  function($rootScope, SDK) {

    // Get the audit log based on scoping provided in the params
    function get(params) {
      if (!params || !params.enterpriseId ||
          typeof(params.skip) !== 'number' ||
          typeof(params.limit) !== 'number') {
        throw new Error('Invalid params');
      }
      return SDK.wrap(
        SDK.doGet('/auditLog', params)
      );
    }

    // In-client API
    return {
      get: get
    };
  }
]);
