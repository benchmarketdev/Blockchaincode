/**
 * @ngdoc directive
 * @name walletSettingsManager
 * @description
 * Manages the all of the wallet settings management state and its sub-directives
 * Depends on: bg-state-manager
 * @example
 *   <div wallet-settings-manager></div>
 */
angular.module('BitGo.Wallet.WalletSettingsManagerDirective', [])

.directive('walletSettingsManager', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // All valid view stats for the settings section
        $scope.viewStates = ['general', 'passcode'];

        /**
         * Let all children views know when the section changes
         * @public
         */
        var killStateWatcher = $scope.$watch('state', function(state) {
          if (state) {
            $scope.$broadcast('walletSettingsManager.SettingsSectionChanged', { section: state });
          }
        });

        /**
         * Clean up the listeners on garbage collection
         * @public
         */
        $scope.$on('$destroy', function() {
          killStateWatcher();
        });

        function init() {
          $rootScope.setContext('walletSettings');

          $scope.state = 'general';
        }
        init();
      }]
    };
  }
]);
