angular.module('BitGo.Interceptors.NetworkBusyInterceptor', [])

.factory('NetworkBusyInterceptor', ['$q', '$rootScope', '$injector',
  function($q, $rootScope, $injector) {
    $rootScope.networkRequests = 0;
    return {
      responseError: function(rejection) {
        // To avoid a circular dependency, use $injector to grab the service now
        var UserAPI = $injector.get('UserAPI');
        if (rejection.data && rejection.data.error) {
          // Error when there is an invalid access_token and the request
          // tried to access protected data. Distinctly different from a
          // 'needs OTP' error
          if (rejection.data.error === 'Authorization required') {
            UserAPI.endSession();
          }
        }
        return $q.reject(rejection);
      }
    };
  }
]);
