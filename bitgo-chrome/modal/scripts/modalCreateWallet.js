angular.module('BitGo.Modals.ModalCreateWallet', [])

/**
 * Directive to create a wallet if none exist
 *
 */
.directive('modalCreateWallet', ['UtilityService', 'NotifyService', 'BG_DEV', 'AnalyticsProxy', '$window', '$location', 'RequiredActionService', '$rootScope', 'MatchwalletAPI',
  function(Util, NotifyService, BG_DEV, AnalyticsProxy, $window, $location, RequiredActionService, $rootScope, MatchwalletAPI) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', function($scope) {

        $scope.invitationGiftPending = MatchwalletAPI.invitationGiftPending;

        // Link off to the create new wallet flow
        $scope.createNewWallet = function() {
          // track the create flow kick-off
          AnalyticsProxy.track('CreateWalletStarted');

          // If the user has a weak login password, we force them to upgrade it
          // before they can create any more wallets
          if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
            return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
          }
          try {
            $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets/create');
            $scope.closeWithSuccess();
          } catch(error) {
            console.error('Expect $rootScope\'s current enterprise to be set.');
          }
        };
      }]
    };
  }
]);
