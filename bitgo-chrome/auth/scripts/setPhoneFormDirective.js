angular.module('BitGo.Auth.SetPhoneFormDirective', [])

/**
  Directive to help with login phone setting form
 */
.directive('setPhoneForm', ['UtilityService', 'SettingsAPI', 'UserAPI', 'NotifyService', 'BG_DEV', 'AnalyticsProxy',
  function(Util, SettingsAPI, UserAPI, Notify, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: ['$scope', function($scope) {
        function formIsValid() {
          return Util.Validators.phoneOk($scope.user.settings.phone.phone);
        }

        // Sets a new (unverified) phone number on the user
        // Note: as long as the phone number is not verified, we can set new phone
        // numbers on the user and sent otps to them -- but once verified, there
        // is an entirely different flow/route to change their phone number
        $scope.submitSetPhone = function() {
          // Clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            // Track the phone set success
            AnalyticsProxy.track('SetPhone');

            UserAPI.sendOTP({ phone:  $scope.user.settings.phone.phone })
            .then(function() {
              $scope.$emit('SetState', 'verifyPhone');
            });
          } else {
            $scope.setFormError('Please add a valid phone number.');

            // Track the phone set fail on the client
            var metricsData = {
              // Error Specific Data
              status: 'client',
              message: 'Invalid Phone Number',
              action: 'Set Phone'
            };
            AnalyticsProxy.track('Error', metricsData);
          }
        };
      }]
    };
  }
]);
