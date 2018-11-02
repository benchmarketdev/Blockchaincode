/**
 * @ngdoc directive
 * @name modalFundWalletDirective
 * @description
 * 
 * Manages the modal which prompts users with a wallet and no Bitcoin to fund their wallets or to buy bitcoin
 * Requires: ModalController
 * @example
 *   <div modal-fund-wallet></div>
 * 
 **/

/* istanbul ignore next - modal controller covers all functionality*/

angular.module('BitGo.Modals.ModalFundWallet', [])

.directive('modalFundWallet', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', function($scope) {
        // Link off to the create new wallet flow
        $scope.modalFundWallet = _.findKey($rootScope.wallets.all);
      }]
    };
  }
]);
