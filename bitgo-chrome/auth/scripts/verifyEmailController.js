/**
 * @ngdoc controller
 * @name VerifyEmailController
 * @description
 * Manages verifying a user email and what to do once verified
 */
angular.module('BitGo.Auth.VerifyEmailController', [])

.controller('VerifyEmailController', ['$scope', '$rootScope', '$location', 'UserAPI', 'NotifyService', 'BG_DEV', 'AnalyticsProxy',
  function($scope, $rootScope, $location, UserAPI, NotifyService, BG_DEV, AnalyticsProxy) {

    function handleVerificationFailure(error) {
      // Track the server email validation fail
      var metricsData = {
        // Error Specific Data
        status: error.status,
        message: error.error,
        action: 'Email Verification'
      };
      AnalyticsProxy.track('Error', metricsData);

      NotifyService.error('There was an issue with the verification email. Please attempt logging in to receive another email.');
      return $location.path('/login');
    }

    function initVerification() {
      // Grab the query params off the config object; these were stripped from the
      // URL before the app loaded and appended to this config object
      var urlParams = BitGoConfig.preAppLoad.queryparams;

      // set the email on user if possible
      if (urlParams.email) {
        $scope.user.settings.email.email = urlParams.email;
      }
      // If no code or email in the url, the verification email is botched somehow
      if (!urlParams.email || !urlParams.code) {
        var errorData = {
          status: 'client',
          error: 'Missing Email or Code in Params'
        };
        return handleVerificationFailure(errorData);
      }
      var verificationDetails = {
        type: 'email',
        code: urlParams.code,
        email: urlParams.email
      };
      UserAPI.verify(verificationDetails)
      .then(function(data) {
        // Track the email verify success
        AnalyticsProxy.track('VerifyEmail');

        NotifyService.success('Your email was successfully verified. You can now log in to your BitGo account.');
        $location.path('/login');
      })
      .catch(handleVerificationFailure)
      .finally(function() {
        // Wipe the data from the config
        BitGoConfig.preAppLoad.clearQueryparams();
      });
    }

    function init() {
      $scope.user = $rootScope.currentUser;
      initVerification();
    }
    init();
  }
]);
