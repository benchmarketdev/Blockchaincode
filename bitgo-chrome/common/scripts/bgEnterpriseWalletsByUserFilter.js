/*
  Notes:
  - This filter takes a list (object) of users on a given enterprise and
  a selectedUserId - it returns a filtered object of wallets that the selected
  user has access to on the enterprise
*/
angular.module('BitGo.Common.BGEnterpriseWalletsByUser', [])

.filter('bgEnterpriseWalletsByUser', ['$rootScope',
  function ($rootScope) {
    return function(enterpriseUsers, selectedUserId) {
      if (!selectedUserId ) {
        console.log('Cannot filter enterpriseWallets by user: Missing a userId');
        return null;
      }
      if (_.isEmpty(enterpriseUsers)) {
        console.log('Cannot filter enterpriseWallets by user: Missing a list of wallets on the enterprise');
        return null;
      }
      return enterpriseUsers[selectedUserId];
    };
  }
]);
