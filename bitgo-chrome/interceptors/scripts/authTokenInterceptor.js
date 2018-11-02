angular.module('BitGo.Interceptors.AuthTokenInterceptor', [])

.factory('AuthTokenInterceptor', ['$q', '$injector',
  function ($q, $injector) {
    return {
      request: function (config) {
        var CacheService = $injector.get('CacheService');
        config.headers = config.headers || {};
        // If we have access to the browser's session storage, we
        // stored the token there. However, if we didn't have access to
        // to it, we set the token on $rootScope
        var tokenCache = CacheService.getCache('Tokens');
        var token = tokenCache && tokenCache.get('token');
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      },
      response: function (response) {
        return response || $q.when(response);
      }
    };
  }
]);
