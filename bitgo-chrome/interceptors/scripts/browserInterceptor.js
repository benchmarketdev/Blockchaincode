/* istanbul ignore next */
angular.module('BitGo.Interceptors.BrowserInterceptor', [])

.factory('BrowserInterceptor', ['$q', '$location',
  function ($q, $location) {
    var UNSUPPORTED_BROWSERS = ['Windows Phone'];
    var currentBrowser = bowser.name;
    return {
      request: function (config) {
        if (_.contains(UNSUPPORTED_BROWSERS, currentBrowser)) {
          $location.path('/unsupported');
        }
        return config;
      },
      response: function (response) {
        return response || $q.when(response);
      }
    };
  }
]);
