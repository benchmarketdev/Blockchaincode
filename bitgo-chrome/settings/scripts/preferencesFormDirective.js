/**
 * @ngdoc directive
 * @name PreferencesForm
 * @description
 * Directive to manage the currency and notification settings
 * @example
 *   <div settings-preferences-form></div>
 */
/**/

angular.module('BitGo.Settings.PreferencesFormDirective', [])

.directive('settingsPreferencesForm', ['$rootScope', 'NotifyService',
  function($rootScope, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {

        $scope.digestIntervals = {
          daily: {name: 'Daily', value: 86400 },
          weekly: {name: 'Weekly', value: 86400 * 7 },
          monthly: {name: 'Monthly', value: 86400 * 7 * 2 * 2 }
        };

        function onSubmitSuccess() {
          $scope.getSettings();
        }

        $scope.submitPreferences = function() {
          // remove otp devices from settings
          var settings = _.omit($scope.settings, 'otpDevices');
          var params = {
            otp: $scope.otp,
            settings: settings
          };
          $scope.saveSettings(params)
          .then(onSubmitSuccess)
          .catch(Notify.errorHandler);
        };

        $scope.hasPreferenceChanges = function() {
          if (!$scope.settings || !$scope.localSettings) {
            return false;
          }
          if (!(_.isEqual($scope.localSettings.currency, $scope.settings.currency))) {
            return true;
          }
          if (!(_.isEqual($scope.localSettings.notifications, $scope.settings.notifications))) {
            return true;
          }
          // convert from string back to number as the input tag modifies value to string
          $scope.settings.digest.intervalSeconds = Number($scope.settings.digest.intervalSeconds);
          if (!(_.isEqual($scope.localSettings.digest, $scope.settings.digest))) {
            return true;
          }
          return false;
        };

        // Listen for changes to user's settings and update the
        // app's financial data/preferences if needed
        $rootScope.$on('SettingsController.HasNewSettings', function() {
          if ($scope.settings.currency.bitcoinUnit !== $rootScope.currency.bitcoinUnit) {
            $rootScope.$emit('SettingsCurrencyForm.ChangeBitcoinUnit', $scope.settings.currency.bitcoinUnit);
          }
          if ($scope.settings.currency.currency !== $rootScope.currency.currency) {
            $rootScope.$emit('SettingsCurrencyForm.ChangeAppCurrency', $scope.settings.currency.currency);
          }
        });

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

      }]
    };
  }
]);
