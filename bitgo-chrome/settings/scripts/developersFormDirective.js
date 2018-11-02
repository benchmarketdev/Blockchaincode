/**
 * @ngdoc directive
 * @name DevelopersForm
 * @description
 * Manages the ui for adding/removing access tokens for the API
 */
angular.module('BitGo.Settings.DevelopersFormDirective', [])

.directive('developersForm', ['AccessTokensAPI',
  function(AccessTokensAPI) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        // restricts user access to token if no otp device is set
        $scope.restrictedAccess = null;

        $scope.removeAccessToken = function(accessTokenId) {
          AccessTokensAPI.remove(accessTokenId)
          .then(function(data) {
            $scope.refreshAccessTokens();
          })
          .catch(function(error) {
            console.log('Error getting list of access tokens: ' + error.error);
          });
        };

        /**
         * Initializes the users access state
         * @private
         */
        function init() {
          if ($scope.user.settings.otpDevices.length === 0) {
            $scope.restrictedAccess = true;
          }
        }
        init();
      }]
    };
  }
]);
