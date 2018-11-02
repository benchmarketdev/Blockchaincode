/**
  Directive to manage the wallet creation label step
  - Parent Controller is WalletCreateController
 */
angular.module('BitGo.Wallet.WalletCreateStepsLabelDirective', [])

.directive('walletCreateStepsLabel', ['$rootScope', 'UtilityService', 'NotifyService', 'AnalyticsProxy',
  function($rootScope, Utils, Notify, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // determines if the user cannot progress due to having an unsupported browser
        var isUnsupported = false;

        /**
         * Track client-only signup failure events
         * @param error {String}
         *
         * @private
         */
        function trackClientLabelFail(error) {
          if (typeof(error) !== 'string') {
            throw new Error('invalid error');
          }
          var metricsData = {
            // Error Specific Data
            status: 'client',
            message: error,
            action: 'LabelWallet'
          };
          AnalyticsProxy.track('Error', metricsData);
        }

        /**
         * Check if label step is valid
         *
         * @private
         */
        function isValidStep() {
          if (isUnsupported) {
            trackClientLabelFail('Unsupported Browser');
            $scope.setFormError('We do not support this version of Internet Explorer. Please upgrade to the latest version.');
            return false;
          }
          if ($scope.inputs.walletLabel === '' || !$scope.inputs.walletLabel) {
            trackClientLabelFail('Missing Wallet Name');
            $scope.setFormError('Please enter a wallet name.');
            return false;
          }
          if ($scope.inputs.walletLabel.indexOf('.') !== -1) {
            trackClientLabelFail('Invalid Wallet Name');
            $scope.setFormError('Wallet names cannot contain periods.');
            return false;
          }
          if ($scope.inputs.walletLabel.length > 50) {
            trackClientLabelFail('Invalid Wallet Name Length');
            $scope.setFormError('Wallet names cannot be longer than 50 characters.');
            return false;
          }
          return true;
        }

        /**
         * Check if the user's browser is supported (we do not support old IE versions)
         *
         * @private
         */
        function checkSupport() {
          if (Utils.Global.browserIsUnsupported()) {
            Notify.error('We do not support this version of Internet Explorer. Please upgrade to the latest version.');
            // kill advancement ability
            isUnsupported = true;
          }
        }

        $scope.advanceLabel = function() {
          // clear any errors
          $scope.clearFormError();
          if (isValidStep()) {

            // track the successful label advancement
            var metricsData = {
              walletLabel: $scope.inputs.walletLabel,
              invitation: !!$rootScope.invitation
            };
            AnalyticsProxy.track('LabelWallet', metricsData);

            // advance the form
            $scope.setState('backupkey');
          }
        };

        function init() {
          checkSupport();
        }
        init();
      }]
    };
  }
]);
