/**
 * @ngdoc directive
 * @name bgApprovalTileBitcoinWhitelist
 * @description
 * This directive manages the approval tile state for general wallet approvals
 * 'General' type includes:
 *  bitcoinAddressWhitelist
 *  dailyLimitPolicy
 *  txLimitPolicy
 * @example
 *   <span bg-activity-tile-policy-description item="logItem"></span>
 */
angular.module('BitGo.Common.BGActivityTilePolicyDescriptionDirective', [])

.directive('bgActivityTilePolicyDescription', ['BG_DEV',
  function(BG_DEV) {
    return {
      restrict: 'A',
      scope: true,
      link: function(scope, elem, attrs) {

        scope.showById = function(id) {
          return scope.logItemId === id;
        };

        function handleWhitelist() {
          var addingAddress = !!scope.policyData.condition.add;
          if (addingAddress) {
            scope.addressInQuestion = scope.policyData.condition.add;
            scope.verb = 'Add';
            return;
          }
          scope.addressInQuestion = scope.policyData.condition.remove;
          scope.verb = 'Remove';
        }

        function handleSpendingLimit() {
          if (scope.logItem.data.action === "remove") {
            return;
          }
          scope.amountInQuestion = scope.policyData.condition.amount;
        }

        function initDescriptionData() {
          switch(scope.logItemId) {
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.whitelist.address"]:
              handleWhitelist();
              break;
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.limit.day"]:
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.limit.tx"]:
              handleSpendingLimit();
              break;
            default:
              throw new Error('invalid policy type in the activity tile');
          }
        }

        function init() {
          scope.policyData = scope.logItem.data.update;
          scope.logItemId = scope.policyData.id;
          initDescriptionData();
        }
        init();
      }
    };
  }
]);
