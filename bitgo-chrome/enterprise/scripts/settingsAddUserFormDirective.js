angular.module('BitGo.Enterprise.SettingsAddUserFormDirective', [])

/**
 * Directive to manage the add user form
 */

.directive('addUserForm', ['$rootScope', '$q', 'UserAPI', 'NotifyService', 'KeychainsAPI', 'UtilityService', '$modal', 'WalletSharesAPI', '$filter', 'BG_DEV',
  function($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, BG_DEV) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        var params;
        function formIsValid() {
          if (!$scope.email) {
            $scope.setFormError('Please enter an email address.');
            return false;
          }

          if (!$scope.walletId) {
            $scope.setFormError('Please choose a wallet to share.');
            return false;
          }
          if (!$scope.role) {
            $scope.setFormError('Please set a role for the user.');
            return false;
          }
          return true;
        }

        $scope.saveAddUserForm = function() {
          if(!$scope.message){
            $scope.message = "I'd like to invite you to join a wallet on BitGo.";
          }
          // clear any errors
          $scope.clearFormError();

          if (formIsValid()) {
            UserAPI.sharingkey({email: $scope.email}).then(function(data){
              params = {
                user: data.userId,
                permissions: $filter('bgPermissionsRoleConversionFilter')($scope.role, true),
                message: $scope.message
              };
              $scope.otp = $scope.otp || '';
              if ( $scope.role === BG_DEV.WALLET.ROLES.SPEND || $scope.role === BG_DEV.WALLET.ROLES.ADMIN ){
                params.keychain = {
                  xpub: $rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub,
                  toPubKey: data.pubkey,
                  path: data.path
                };
                return $scope.shareWallet(params);
              }
              return WalletSharesAPI.createShare($scope.walletId, params).then($scope.onAddUserSuccess);
            })
            .catch(function(error){
              if (error.error === 'key not found') {
                Notify.error($scope.email + ' has not yet set up a BitGo account. Please have ' + $scope.email + ' sign up and log in to BitGo.');
              }
              else {
                Notify.error(error.error);
              }
            });
          }
        };
      }]
    };
  }
]);
