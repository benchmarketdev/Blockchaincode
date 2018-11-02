/**
 * @ngdoc directive
 * @name walletPolicyWhitelistManager
 * @description
 * Manages the whitelist policy section in the app
 * Depends on:
 *   bg-state-manager
 *   bg-address-tile-labeling-manager
 * @example
 *   <div wallet-policy-whitelist-manager></div>
 */
angular.module('BitGo.Wallet.WalletPolicyWhitelistManagerDirective', [])

.directive('walletPolicyWhitelistManager', ['$rootScope', 'NotifyService', 'PolicyAPI', 'LabelsAPI', 'WalletsAPI', 'WalletModel', 'BG_DEV', 'InternalStateService', 'AnalyticsProxy', '$location',
  function($rootScope, NotifyService, PolicyAPI, LabelsAPI, WalletsAPI, WalletModel, BG_DEV, InternalStateService, AnalyticsProxy, $location) {
    // current section name
    var CURRENT_SECTION = 'whitelist';

    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        var DEFAULT_WHITELIST_POLICY = {
          action: { type: "getApproval" },
          condition: { addresses: [] },
          id: BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.whitelist.address"],
          type: BG_DEV.WALLET.POLICY_TYPES.bitcoinAddressWhitelist
        };

        // valid view states for the section
        $scope.viewStates = ['list', 'add'];
        // list of the bitcoin addresses whitelisted
        $scope.whitelist = null;
        // the user's whitelist policy
        $scope.policy = null;

        /**
         * Fetch the label for an address
         * @param address {String} bitcoin address
         */
        function getAddressLabel(params) {
          LabelsAPI.get(params.address, $rootScope.wallets.current.data.id)
          .then(function(label) {
            var whitelistItem = {
              index: params.index,
              address: params.address
            };
            if (label) {
              whitelistItem.label = label.label || '';
              whitelistItem.temporaryLabel = label.label || '';
            } else {
              whitelistItem.label = '';
              whitelistItem.temporaryLabel = '';
            }
            $scope.whitelist.push(whitelistItem);
          })
          .catch(function(error) {
            console.error('Error fetching label for: ', address, error);
          });
        }

        /**
         * Update the local data to be in sync the new wallet data
         * @param updatedWallet {Object} BitGo wallet object
         * @private
         */
        function handlePolicyUpdate(updatedWallet) {
          // Update the current wallet throughout the app
          // b/c we might have new policies and pending approvals
          var wallet = new WalletModel.Wallet(updatedWallet);
          WalletsAPI.setCurrentWallet(wallet, true);
          // update local policy with the latest data
          $scope.initPolicy();
          return true;
        }

        /**
         * Handle the returned pending approval from a policy update request
         * @param approval {Object} BitGo pending approval object
         * @private
         */
        function handlePolicyPendingApproval(approval) {
          NotifyService.success('This policy change was submitted for approval');
          // Add the pending approval in the current wallet
          $rootScope.wallets.current.addApproval(approval);
          // Then update the all pending approvals on the current enterprise
          // because the enterprise needs to know about all new pending approvals
          $rootScope.enterprises.current.setApprovals(approval);
          return true;
        }

        /**
         * Submit the user's whitelist policy change
         * @param params {Object} contains params for policy update
         * @returns {Promise}
         * @public
         */
        $scope.updatePolicy = function(params) {
          if (!params || !params.rule || !params.bitcoinAddress) {
            throw new Error('invalid params');
          }
          return PolicyAPI.updatePolicyRule(params)
          .then(function(data) {
            if (data.pendingApproval) {
              return handlePolicyPendingApproval(data.pendingApproval);
            }
            return handlePolicyUpdate(data);
          });
        };

        /**
         * Initialize the user's policy based on their latest data
         * @public
         */
        $scope.initPolicy = function() {
          if (!$rootScope.wallets.current) {
            throw new Error('Expecting current wallet on rootscope');
          }
          $scope.whitelist = [];
          $scope.policy = $rootScope.wallets.current.getWhitelist() || DEFAULT_WHITELIST_POLICY;
          _.forEach($scope.policy.condition.addresses, function(address, index) {
            var params = {
              index: index,
              address: address
            };
            getAddressLabel(params);
          });
        };

        /**
         * Remove an address from the user's whitelist
         * @public
         */
        $scope.removeAddress = function(tileItem) {
          if (!tileItem) {
            throw new Error('invalid params');
          }
          var params = {
            bitcoinAddress: $rootScope.wallets.current.data.id,
            rule: {
              id: $scope.policy.id,
              type: 'bitcoinAddressWhitelist',
              condition: {
                remove: tileItem.address
              },
              action: { type: 'getApproval' }
            }
          };
          $scope.updatePolicy(params)
          .catch(NotifyService.errorHandler);
        };

        /**
         * UI - block the feature for the user
         *
         * @returns {Bool}
         */
        $scope.blockWhitelist = function() {
          return ($rootScope.currentUser.isBasic() &&
                  $rootScope.enterprises.current &&
                  $rootScope.enterprises.current.isPersonal);
        };

        // listen for the tile to be updated, then close it
        var killTileUpdateWatch = $scope.$on('bgListAddressTileLabeler.CurrentTileUpdated',
          function(evt, updatedWhitelistItem) {
            $scope.whitelist[updatedWhitelistItem.index] = updatedWhitelistItem;
          }
        );

        /**
         * Listens for the current wallet to be updated
         */
        var killCurrentWalletListener = $scope.$watch('wallets.current', function(wallet) {
          if (wallet) {
            $scope.initPolicy();
          }
        });

        /**
         * This listener is fired when the user navigates to the whitelist policy section
         */
        var killStateWatcher = $scope.$on('walletPolicyManager.PolicySectionChanged', function(evt, data) {
          if (data.section === CURRENT_SECTION) {
            init();

            // Track a user navigating to whitelist and landing on the upsell
            if ($scope.blockWhitelist()) {
              AnalyticsProxy.track('arriveUpsell', { type: 'whitelist' });
            }
          }
        });

        /**
         * Clean up the listeners
         */
        $scope.$on('$destroy', function() {
          killTileUpdateWatch();
          killCurrentWalletListener();
          killStateWatcher();
        });

        function init() {
          $scope.state = 'list';
          $scope.initPolicy();
        }
        init();
      }],
      link: function(scope, ele, attrs) {

        /**
        * Take the user to the create org page
        *
        * @public
        */
        scope.goToCreateOrg = function() {
          AnalyticsProxy.track('clickUpsell', { type: 'whitelist' });
          $location.path('/create-organization');
        };
      }
    };
  }
]);
