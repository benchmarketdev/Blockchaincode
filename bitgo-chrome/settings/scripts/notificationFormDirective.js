angular.module('BitGo.Settings.NotificationFormDirective', [])

/**
 * Directive to manage the settings notifications form
 */
.directive('settingsNotificationForm', ['$rootScope', 'NotifyService',
  function($rootScope, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        $scope.digestIntervals = {
          daily: {name: 'daily', value: 86400 },
          every_other_day: {name: 'every other day', value: 86400 * 2},
          weekly: {name: 'weekly', value: 86400 * 7 },
          bi_weekly: {name: 'bi-weekly', value: 86400 * 7 * 2 },
          monthly: {name: 'monthly', value: 86400 * 7 * 2 * 2 }
        };

        function onSubmitSuccess() {
          $scope.getSettings();
        }

        // function to set/unset digest interval if digest is enabled/disabled 
        $scope.resetDigest = function () {
          //default to daily
          if ($scope.settings.digest.enabled) {
            $scope.settings.digest.intervalSeconds = 86400;
          }
          //reset to empty when checkbox is not checked
          else {
            $scope.settings.digest.intervalSeconds = 0;
          }
        };

        $scope.hasChanges = function() {
          if (!$scope.settings) {
            return false;
          }
          if (!(_.isEqual($scope.localSettings.notifications, $scope.settings.notifications))) {
            return true;
          }
          if (!(_.isEqual($scope.localSettings.digest, $scope.settings.digest))) {
            return true;
          }
          return false;
        };

        $scope.submitNotifications = function() {
          var params = {
            otp: $scope.otp,
            settings: $scope.settings
          };
          $scope.saveSettings(params)
          .then(onSubmitSuccess)
          .catch(Notify.errorHandler);
        };

      }]
    };
  }
]);
