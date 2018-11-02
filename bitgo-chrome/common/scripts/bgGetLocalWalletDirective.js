/*
  Notes:
  - This directive fetches the local data for a wallet based on the wallet id provided
  - E.g.: <span bg-get-local-wallet wallet-id="123abcd">{{ wallet.data.label }}</span>
*/
angular.module('BitGo.Common.BGGetLocalWalletDirective', [])

.directive("bgGetLocalWallet", ['$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        attrs.$observe('walletId', function(val) {
          // Don't fetch if there's no id
          if (!val) {
            return;
          }
          // set the wallet from the in-app store of wallets
          var wallet = $rootScope.wallets.all[val];
          scope.label = wallet ? wallet.data.label : val;
        });
      }
    };
  }
]);
