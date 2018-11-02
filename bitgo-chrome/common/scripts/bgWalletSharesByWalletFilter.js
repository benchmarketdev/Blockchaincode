/*

 * @ngdoc filter
 * @name bgWalletSharesByWallet
 * @param {object} outgoingWalletShares - list of wallet shares
 * @param {object} currWallet - The wallet to filter the wallet shares by
 * @description
 * It filters the walletshares list and returns a list of walletshares for that particular wallet
 * @return list of wallet shares
 * @example
 * <tr ng-repeat="(walletShareId, walletShare) in walletShares.all.outgoing | bgWalletSharesByWallet:wallets.current">
*/
angular.module('BitGo.Common.BGWalletSharesByWalletFilter', [])

.filter('bgWalletSharesByWallet', ['$rootScope',
  function ($rootScope) {
    return function(outgoingWalletShares, currWallet) {
      if (_.isEmpty(currWallet)) {
        console.log('Cannot filter wallet shares by wallet: Missing wallet');
        return null;
      }
      if (_.isEmpty(outgoingWalletShares)) {
        return null;
      }
      return _.pick(outgoingWalletShares, function(walletShare, key) {
        return walletShare.walletId &&
                walletShare.walletId === currWallet.data.id;
      });
    };
  }
]);
