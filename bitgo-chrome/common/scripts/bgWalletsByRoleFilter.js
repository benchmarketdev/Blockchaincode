/*
 * @ngdoc filter
 * @name bgWalletsByRoleFilter
 * @param {object} allWallets - list of wallets
 * @param {String} role - The role to filter the wallets by
 * @description
 * It filters the wallets list and returns a list of wallets with that particular role
 * @return list of wallets
 * @example
 * <tr ng-repeat="(walletId, wallet) in wallets.all | bgWalletsByRole:'Admin'">
*/
angular.module('BitGo.Common.BGWalletsByRoleFilter', [])

.filter('bgWalletsByRole', ['$rootScope',
  function ($rootScope) {
    return function(allWallets, role) {
      if (_.isEmpty(allWallets) || !role) {
        return null;
      }
      return _.pick(allWallets, function(wallet, key) {
        return wallet.role && wallet.role === role;
      });
    };
  }
]);
