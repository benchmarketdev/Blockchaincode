/**
  Directive to manage the wallet creation insurance upsell step
  - Parent Controller is WalletCreateController
 */
angular.module('BitGo.Wallet.WalletCreateStepsInsureDirective', [])

.directive('walletCreateStepsInsure', ['$rootScope', '$location', 'AnalyticsProxy', 'InternalStateService',
  function($rootScope, $location, AnalyticsProxy, InternalStateService) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        /**
        * Take the user to their account settings - plans page
        *
        * @public
        */
        $scope.goToPlans = function() {
          AnalyticsProxy.track('clickUpsell', { type: 'createWallet' });
          InternalStateService.goTo('personal_settings:plans');
        };

        /**
        * Take the user back to their wallet list
        *
        * @public
        */
        $scope.skipPlans = function() {
          AnalyticsProxy.track('skipUpsell', { type: 'createWallet' });
          $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
        };

        /**
        * Initialize the controller
        *
        * @private
        */
        function init() {
          AnalyticsProxy.track('arriveUpsell', { type: 'createWallet' });
        }

        init();
      }]
    };
  }
]);
