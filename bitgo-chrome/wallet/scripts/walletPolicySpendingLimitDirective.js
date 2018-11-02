/**
 * @ngdoc directive
 * @name walletPolicySpendingLimit
 * @description
 * Manages the state for a policy spending limit type
 * @example
 *   <div wallet-policy-spending-limit policy-id="com.bitgo.limit.tx"></div>
 *   - or -
 *   <div wallet-policy-spending-limit policy-id="com.bitgo.limit.day"></div>
 */
angular.module('BitGo.Wallet.WalletPolicySpendingLimitDirective', [])

.directive('walletPolicySpendingLimit', ['$rootScope', 'NotifyService', 'PolicyAPI', 'WalletsAPI', 'WalletModel', 'BG_DEV',
  function($rootScope, NotifyService, PolicyAPI, WalletsAPI, WalletModel, BG_DEV) {
    // spending limit section names
    var DAILY_LIMIT_SECTION = 'dailyLimit';
    var TRANSACTION_LIMIT_SECTION = 'transactionLimit';

    // default policies if the user doesn't have one
    var DEFAULT_POLICIES = {
      "com.bitgo.limit.day": {
        action: { type: "getApproval" },
        condition: { amount: null },
        id: "com.bitgo.limit.day",
        type: "dailyLimit",
        default: true
      },
      "com.bitgo.limit.tx": {
        action: { type: "getApproval" },
        condition: { amount: null },
        id: "com.bitgo.limit.tx",
        type: "transactionLimit",
        default: true
      }
    };

    return {
      restrict: 'A',
      scope: true,
      controller: ['$scope', function($scope) {
        // local copy of the daily limit policy to keep track of user changes
        $scope.localPolicy = null;
        // actual user policy (if it exists)
        $scope.actualPolicy = null;

        /**
         * Validate if the a policy amount is above or below OK thresholds
         * @param amount {Int} (satoshi) value of new policy being set
         * @private
         */
        function amountValid(amount) {
          if (typeof(amount) === 'undefined') {
            $scope.setFormError('Please enter a valid limit.');
            return false;
          }
          return true;
        }

        /**
         * Set the spending limit policies on the scope data
         * @param policy {Object} BitGo policy object
         * @private
         */
        function setPolicyData(policy) {
          if (!policy) {
            throw new Error('missing policy');
          }
          $scope.actualPolicy = policy;
          // keep a local copy to watch for changes
          $scope.localPolicy = _.cloneDeep(policy);
        }

        /**
         * Init the spending limit policy based on user's policy
         * @private
         */
        function tryInitFromUserPolicy() {
          // clear any existing errors
          if ($scope.clearFormError) {
            $scope.clearFormError();
          }
          // clear any errors satoshi errors
          $scope.satoshiError = false;
          var defaultPolicy = DEFAULT_POLICIES[$scope.policyId];
          // the user may not have a policy, so set/use a default if needed
          if (!$rootScope.wallets.current.hasPolicy()) {
            return setPolicyData(defaultPolicy);
          }
          var policy = _.filter($rootScope.wallets.current.data.admin.policy.rules,
            function(policyRule, idx) {
              return policyRule.id === BG_DEV.WALLET.BITGO_POLICY_IDS[$scope.policyId];
            }
          )[0];
          var userPolicy = policy || defaultPolicy;
          setPolicyData(userPolicy);
        }

        /**
         * Init the spending limit policies on the rootScope
         * @public
         */
        $scope.initPolicy = function() {
          if (!$rootScope.wallets.current) {
            throw new Error('Expecting current wallet on rootscope');
          }
          if ($rootScope.wallets.current.data.admin &&
              $rootScope.wallets.current.data.admin.policy) {
            tryInitFromUserPolicy();
          } else {
            setPolicyData(DEFAULT_POLICIES[$scope.policyId]);
          }
        };

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
          // update local/actual policy with the latest data
          tryInitFromUserPolicy();
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
          // reset the local/actual policy - no update is needed b/c of approval
          tryInitFromUserPolicy();
        }

        /**
         * Reset the user's local policy changes
         * @public
         */
        $scope.cancelPolicyChanges = function() {
          // clear any existing errors
          $scope.clearFormError();
          // then reset the policy
          tryInitFromUserPolicy();
        };

        /**
         * Delete the user's tx limit
         * @public
         */
        $scope.deletePolicy = function() {
          // clear any existing errors
          $scope.clearFormError();
          var params = {
            bitcoinAddress: $rootScope.wallets.current.data.id,
            id: $scope.localPolicy.id,
          };
          PolicyAPI.deletePolicyRule(params)
          .then(function(data) {
            if (data.pendingApproval) {
              return handlePolicyPendingApproval(data.pendingApproval);
            }
            handlePolicyUpdate(data);
          })
          .catch(NotifyService.errorHandler);
        };

        /**
         * Submit the user's tx limit change
         * @public
         */
        $scope.submitChange = function() {
          // clear any existing errors
          $scope.clearFormError();
          // validate the amount before saving
          if (!amountValid($scope.localPolicy.condition.amount)) {
            return;
          }

          var params = {
            bitcoinAddress: $rootScope.wallets.current.data.id,
            rule: $scope.localPolicy,
          };
          PolicyAPI.updatePolicyRule(params)
          .then(function(data) {
            if (data.pendingApproval) {
              return handlePolicyPendingApproval(data.pendingApproval);
            }
            handlePolicyUpdate(data);
          })
          .catch(NotifyService.errorHandler);
        };

        /**
         * Listens for the current wallet to be updated
         */
        var killCurrentWalletListener = $scope.$watch('wallets.current', function(wallet) {
          if (wallet) {
            $scope.initPolicy();
          }
        });

        /**
         * Listen for the section to change to clean up unsaved state
         */
        var killStateWatcher = $scope.$on('walletPolicyManager.PolicySectionChanged', function(evt, data) {
          if (data.section === DAILY_LIMIT_SECTION || data.section === TRANSACTION_LIMIT_SECTION) {
            tryInitFromUserPolicy();
          }
        });

        $scope.$on('$destroy', function() {
          killCurrentWalletListener();
          killStateWatcher();
        });
      }],
      link: function(scope, ele, attrs) {
        /**
         * Logic to show/hide the daily limit save button
         * @public
         */
        scope.showSaveButton = function() {
          return scope.localPolicy && scope.actualPolicy &&
                  (scope.localPolicy.condition.amount != scope.actualPolicy.condition.amount);
        };

        scope.showRemoveButton = function() {
          return scope.localPolicy.condition.amount == scope.actualPolicy.condition.amount &&
                  !scope.localPolicy.default;
        };

        scope.showCancelButton = function() {
          return scope.localPolicy.condition.amount != scope.actualPolicy.condition.amount;
        };

        function init() {
          if (!attrs.policyId || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, attrs.policyId)) {
            throw new Error("invalid policy ID");
          }
          scope.policyId = attrs.policyId;
          scope.initPolicy();
        }
        init();
      }
    };
  }
]);
