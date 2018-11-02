/**
 * @ngdoc directive
 * @name walletPolicyManager
 * @description
 * Manages the all of the policy management state and its sub-directives
 * Depends on: bg-state-manager
 * @example
 *   <div wallet-policy-manager></div>
 */
angular.module('BitGo.Wallet.WalletPolicyManagerDirective', [])

.directive('walletPolicyManager', ['$rootScope', 'NotifyService', 'BG_DEV', 'AnalyticsProxy',
  function($rootScope, NotifyService, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // valid spending limit types
        var SPENDING_LIMIT_TYPES = {
          tx: true,
          day: true
        };

        // All valid view stats for the policy section
        $scope.viewStates = ['dailyLimit', 'transactionLimit', 'whitelist'];

        /**
         * Logic to show/hide whitelist pending approvals
         * @public
         */
        $scope.showWhitelistApprovals = function() {
          var currentWallet = $rootScope.wallets.current;
          if (!currentWallet || !currentWallet.data.pendingApprovals.length) {
            return false;
          }
          return _.filter(currentWallet.data.pendingApprovals, function(approvalItem) {
            if (!approvalItem.info.policyRuleRequest) {
              return;
            }
            return approvalItem.info.policyRuleRequest.update.id === BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.whitelist.address"];
          }).length > 0;
        };

        /**
         * Logic to show/hide spending limit pending approvals
         * @public
         */
        $scope.showLimitApprovals = function(type) {
          if (!type || !_.has(SPENDING_LIMIT_TYPES, type)) {
            throw new Error('invalid spending limit type');
          }
          var currentWallet = $rootScope.wallets.current;
          if (!currentWallet || !currentWallet.data.pendingApprovals.length) {
            return false;
          }
          var typeString = "com.bitgo.limit." + type;
          return _.filter(currentWallet.data.pendingApprovals, function(approvalItem) {
            if (!approvalItem.info.policyRuleRequest) {
              return;
            }
            return approvalItem.info.policyRuleRequest.update.id === BG_DEV.WALLET.BITGO_POLICY_IDS[typeString];
          }).length > 0;
        };

        /**
         * Let all children views know when the section changes
         * @public
         */
        var killStateWatcher = $scope.$watch('state', function() {
          $scope.$broadcast('walletPolicyManager.PolicySectionChanged', { section: $scope.state });
        });

        $scope.$on('$destroy', function() {
          killStateWatcher();
        });

        function init() {
          $rootScope.setContext('walletPolicy');
          AnalyticsProxy.track('WalletPolicyEntered');
          $scope.state = 'dailyLimit';
        }
        init();
      }]
    };
  }
]);
