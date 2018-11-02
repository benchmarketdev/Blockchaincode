angular.module('BitGo.Interceptors.VerificationInterceptor', [])

.factory('VerificationInterceptor', ['$q', '$location', '$injector', '$rootScope', '$timeout',
  function ($q, $location, $injector, $rootScope, $timeout) {
    return {
      response: function (response) {
        var Util = $injector.get('UtilityService');
        var currentUser = $rootScope.currentUser;

        // URLs we want to check against for user phone/email verification
        var isCurrentUserFetch = response.config.url.indexOf('/user/me') !== -1;
        var isLoginDetailsFetch = response.config.url.indexOf('/user/login') !== -1;

        // Scrub any phone-or-email-verification-originated params from the url
        function scrubUrl() {
          Util.Url.scrubQueryString('phone');
          Util.Url.scrubQueryString('email');
        }

        if (isCurrentUserFetch || isLoginDetailsFetch) {
          // ensure response.user exists
          if (!response.data.user) {
            throw new Error('missing ressponse.data.user - data package changed');
          }
          var state;
          if (response.data.user.phone && !response.data.user.phone.verified) {
            state = 'verifyPhone';
          }
          if (response.data.user.phone && response.data.user.phone.phone === '') {
            state = 'setPhone';
          }
          if (response.data.user.email && !response.data.user.email.verified) {
            state = 'needsEmailVerify';
          }
          // scrub url before setting a new verification link
          scrubUrl();
          if (state) {
            $location.path('/login').search(state, true);
          } else {
            if (currentUser) {
              currentUser.setProperty({ hasAccess: true });
            }
          }
        }
        return response || $q.when(response);
      }
    };
  }
]);
