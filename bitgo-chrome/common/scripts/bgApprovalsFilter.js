/**
 * @ngdoc directive
 * @name bgApprovalsFilter
 * @description
 * Filters approvals based on a type provided
 * @example
 *   <tr ng-repeat="item in items | bgApprovalsFilter:false:'transactionRequest'"></tr>
 */
angular.module('BitGo.Common.BGApprovalsFilter', [])

.filter('bgApprovalsFilter', ['BG_DEV',
  function (BG_DEV) {
    return function(approvalItems, filterByPolicyId, filterTarget) {

      function filterByBitGoPolicyId() {
        if (!_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, filterTarget)) {
          throw new Error('Invalid bitgo policy id');
        }
        return _.filter(approvalItems, function(approvalItem) {
          if (!approvalItem.info.policyRuleRequest) {
            return;
          }
          return approvalItem.info.policyRuleRequest.update.id === filterTarget;
        });
      }

      function filterByType() {
        var VALID_APPROVAL_TYPES = {
          'transactionRequest': true,
          'userChangeRequest': true,
          'updateEnterpriseRequest': true
        };
        if (!_.has(VALID_APPROVAL_TYPES, filterTarget)) {
          throw new Error('Invalid approval type');
        }
        return _.filter(approvalItems, function(approvalItem) {
          return approvalItem.info.type === filterTarget;
        });
      }
      if (filterByPolicyId) {
        return filterByBitGoPolicyId();
      }
      return filterByType();
    };
  }
]);
