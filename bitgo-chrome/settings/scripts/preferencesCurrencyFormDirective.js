angular.module('BitGo.Settings.PreferencesCurrencyFormDirective', [])

/**
 * Directive to manage the settings currency form
 */
.directive('settingsPreferencesCurrencyForm', ['$rootScope', 'NotifyService',
  function($rootScope, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        function onSubmitSuccess() {
          $scope.getSettings();
        }

        $scope.submitCurrency = function() {
          var params = {
            otp: $scope.otp,
            settings: $scope.settings
          };
          $scope.saveSettings(params)
          .then(onSubmitSuccess)
          .catch(Notify.errorHandler);
        };

        $scope.hasCurrencyChanges = function() {
          if (!$scope.settings || !$scope.localSettings) {
            return false;
          }
          if (!(_.isEqual($scope.localSettings.currency, $scope.settings.currency))) {
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

      }]
    };
  }
]);
