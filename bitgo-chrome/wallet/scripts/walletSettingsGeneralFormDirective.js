/**
 * @ngdoc directive
 * @name walletSettingsGeneralForm
 * @description
 * Directive to manage the wallet settings. (delete and rename)
 * @example
 *   <div wallet-settings-general-form></div>
 */

angular.module('BitGo.Wallet.WalletSettingsGeneralFormDirective', [])

.directive('walletSettingsGeneralForm', ['$location', '$rootScope', 'UserAPI', 'UtilityService', 'NotifyService', 'WalletsAPI', 'BG_DEV', 'EnterpriseAPI',
  function($location, $rootScope, UserAPI, Util, Notify, WalletsAPI, BG_DEV, EnterpriseAPI) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // the name of the current wallet
        $scope.walletName = null;
        $scope.confirmationMessage = false;

        function formIsValid() {
          if (!$scope.walletName) {
            $scope.setFormError('Please enter new wallet name.');
            return false;
          }
          if ($scope.walletName === $rootScope.wallets.current.data.label) {
            $scope.setFormError('Please change the wallet name before saving');
            return false;
          }
          return true;
        }

        /**
        * Called when the user confirms delete
        * @private
        */
        $scope.confirmDelete = function () {
          if ($rootScope.wallets.current.data.balance > 0) {
            if ($rootScope.wallets.current.role == BG_DEV.WALLET.ROLES.ADMIN && $rootScope.wallets.current.data.adminCount < 2){
              Notify.error('Please transfer bitcoins before deleting');
              return false;
            }
          }
          WalletsAPI.removeWallet($rootScope.wallets.current)
          .then(function(){
            Notify.success('Wallet was removed from dashboard');
            // if the user deletes the last wallet in an enterprise where he is not an admin, redirect him to the personal wallets page
            if (_.isEmpty($rootScope.wallets.all) && !isEnterpriseAdmin()) {
              EnterpriseAPI.setCurrentEnterprise($rootScope.enterprises.all.personal);
              $location.path('/enterprise/personal/wallets');
            } else {
              $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
            }
          })
          .catch(Notify.errorHandler);
        };

        $scope.showRenameButton = function () {
          return $scope.walletName !== $rootScope.wallets.current.data.label;
        };

        function onRenameSuccess (data) {
          WalletsAPI.getAllWallets();
        }

        $scope.saveLabelChange = function() {
          // clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            var params = {
              walletAddress: $rootScope.wallets.current.data.id,
              label: $scope.walletName
            };
            WalletsAPI.renameWallet(params)
            .then(onRenameSuccess)
            .catch(Notify.errorHandler);
          }
        };

        function isEnterpriseAdmin () {
          var isAdmin = false;
          if ($rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal) {
            return true;
          }
          if ($rootScope.currentUser.settings.enterprises) {
            $rootScope.currentUser.settings.enterprises.forEach(function(enterprise) {
             if ($rootScope.enterprises.current && enterprise.id === $rootScope.enterprises.current.id) {
              isAdmin = true;
              return false;
             }
            });
          }
          return isAdmin;
        }

        function init() {
          $scope.walletName = $rootScope.wallets.current.data.label;
        }
        init();
      }]
    };
  }
]);
