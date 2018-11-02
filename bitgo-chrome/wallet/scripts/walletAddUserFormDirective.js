/**
 * @ngdoc directive
 * @name walletUserList
 * @description
 * Directive to manage the add user form after selecting a wallet. To be used along with bgAddWalletToUser directive
 * @example
 *   <div bg-add-user-to-wallet><form wallet-add-user-form></form></div>
 */
angular.module('BitGo.Wallet.WalletAddUserFormDirective', [])

.directive('walletAddUserForm', ['$rootScope', '$q', 'UserAPI', 'NotifyService', 'KeychainsAPI', 'UtilityService', '$modal', 'WalletSharesAPI', '$filter', 'BG_DEV', 'InternalStateService', 'AnalyticsProxy', '$location',
  function($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, BG_DEV, InternalStateService, AnalyticsProxy, $location) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        // will hold form data
        var params;

        function formIsValid() {
          if (!$scope.email) {
            $scope.setFormError('Please enter email');
            return false;
          }

          if (!$scope.role) {
            $scope.setFormError('Please set role for user');
            return false;
          }
          return true;
        }

        $scope.saveAddUserForm = function() {
          if(!$scope.message){
            $scope.message = "Hi! Join my wallet on BitGo!";
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
              if ( $scope.role === BG_DEV.WALLET.ROLES.SPEND || $scope.role === BG_DEV.WALLET.ROLES.ADMIN ){
                params.keychain = {
                  xpub: $rootScope.wallets.current.data.private.keychains[0].xpub,
                  toPubKey: data.pubkey,
                  path: data.path
                };
                $scope.walletId = $rootScope.wallets.current.data.id;
                return $scope.shareWallet(params);
              }
              return WalletSharesAPI.createShare($rootScope.wallets.current.data.id, params).then($scope.onAddUserSuccess);
            })
            .catch(function(error){
              if (error.error === 'key not found') {
                Notify.error($scope.email + ' does not have a sharing key. The sharing key will be generated when the user next logs in. Have ' + $scope.email + ' login to BitGo before sharing again.');
              }
              else {
                Notify.error(error.error);
              }
            });
          }
        };
      }],
      link: function(scope, ele, attrs) {

        /**
         * UI - block the feature for the user
         *
         * @returns {Bool}
         */
        scope.blockRole = function() {
          if (scope.role === BG_DEV.WALLET.ROLES.VIEW) {
            return (!$rootScope.currentUser.isPro() &&
                    $rootScope.enterprises.current &&
                    $rootScope.enterprises.current.isPersonal);
          }
          return false;
        };

        /**
        * Take the user to the create organization page
        *
        * @public
        */
        scope.goToCreateOrg = function() {
          AnalyticsProxy.track('clickUpsell', { type: 'addPremiumUser' });
          $location.path('/create-organization');
        };

        // Listen for the selected role to change, and if this role is
        // blocked, trigger a mixpanel event for showing the upsell
        var killRoleListener = scope.$watch('role', function(newRole) {
          if (scope.role === BG_DEV.WALLET.ROLES.VIEW && scope.blockRole()) {
            AnalyticsProxy.track('triggerUpsell', { type: 'addPremiumUser' });
          }
        });

        // Clean up listeners on when scope is gc'd
        scope.$on('$destroy', function() {
          killRoleListener();
        });
      }
    };
  }
]);