/**
 * @ngdoc directive
 * @name matchwalletRewardWallet
 * @description
 * Directive to manage selecting a reward wallet
 * @example
 *   <div matchwallet-reward-wallet></div>
 */
angular.module('BitGo.Matchwallet.MatchwalletRewardWalletDirective', [])

.directive('matchwalletRewardWallet', ['$rootScope', 'MatchwalletAPI',
  function($rootScope, MatchwalletAPI) {
    return {
      restrict: 'A',
      templateUrl: 'matchwallet/templates/matchwallet-reward-wallet-partial.html',
      controller: ['$scope', function($scope) {

        $scope.isCurrentRewardWallet = function(wallet) {
          if ($rootScope.matchwallets && $rootScope.matchwallets.current) {
            return $rootScope.matchwallets.current.data.rewardWalletId === wallet.data.id;
          } else if (_.isEmpty($rootScope.matchwallets.all)) {
            return $scope.rewardWalletId === wallet.data.id;
          }
        };

        function init() {
          if ($rootScope.matchwallets && $rootScope.matchwallets.current) {
            $scope.rewardWalletId = $rootScope.matchwallets.current.data.rewardWalletId;
          } else if ($rootScope.wallets) {
            $scope.rewardWalletId = _.findLastKey($rootScope.wallets.all);
          }
        }
        init();
      }]
    };
  }
]);