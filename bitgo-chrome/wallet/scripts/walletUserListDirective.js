/**
 * @ngdoc directive
 * @name walletUserList
 * @description
 * Manages the user list for a selected wallet. It helps handle accepting and approving shares as well
 * @example
 *   <div wallet-user-list></div>
 */

angular.module('BitGo.Wallet.WalletUserListDirective', [])

.directive('walletUserList', ['$rootScope', '$filter', 'UserAPI', 'NotifyService', 'WalletSharesAPI', 'WalletsAPI',
  function($rootScope, $filter, UserAPI, Notify, WalletSharesAPI, WalletsAPI) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        function revokeAccessSuccess(wallet) {
          WalletsAPI.getAllWallets();
          if (wallet.adminCount > 1) {
            Notify.success('Your request to revoke access is pending approval.');
          }
          else {
            Notify.success('Wallet access was revoked.');
          }
        }

        $scope.revokeAccess = function(bitcoinAddress, userId) {
          WalletsAPI.revokeAccess(bitcoinAddress, userId)
          .then(revokeAccessSuccess)
          .catch(Notify.errorHandler);
        };

        $scope.hasApprovals = function() {
          var filter = $filter('bgApprovalsFilter');
          return filter($rootScope.wallets.current.data.pendingApprovals, false, 'userChangeRequest').length > 0;
        };

        $scope.canDelete = function (userId) {
          return userId && userId !== $rootScope.currentUser.settings.id;
        };
      }],
      link: function(scope, element, attrs) {

        /**
         * Resend the invite email to join a share.
         *
         * @param walletShareId {String} the public id string of the wallet share
         */
        scope.resendEmail = function(walletShareId) {
          if (!walletShareId) {
            throw new Error('Expect walletShareId to be set');
          }
          WalletSharesAPI.resendEmail({walletShareId: walletShareId})
          .then(function(result) {
            Notify.success('Wallet invite email was re-sent.');
          })
          .catch(Notify.errorHandler);
        };

        scope.rejectInvite = function(walletShareId) {
          if (!walletShareId) {
            throw new Error('Expect walletShareId to be set');
          }
          WalletSharesAPI.cancelShare({walletShareId: walletShareId})
          .then(function(result) {
            $('#' + walletShareId).animate({
              height: 0,
              opacity: 0
            }, 500, function() {
              scope.$apply(function() {
                WalletSharesAPI.getAllSharedWallets();
                $('#' + walletShareId).remove();
              });
            });
          })
          .catch(Notify.errorHandler);
        };
      }
    };
  }
]);
