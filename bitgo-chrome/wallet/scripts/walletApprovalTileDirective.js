/**
 * @ngdoc directive
 * @name walletApprovalTile
 * @description
 * Manages the logic for ingesting an enterprise pendingApproval item and outputting the right template item to the DOM
 * @example
 *   <tr wallet-approval-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Wallet.WalletApprovalTileDirective', [])

.directive('walletApprovalTile', ['$rootScope', '$compile', '$http', '$templateCache', 'BG_DEV',
  function($rootScope, $compile, $http, $templateCache, BG_DEV) {
    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {

        function getPolicyTemplate(policyRuleRequest) {
          switch (policyRuleRequest.update.id) {
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.whitelist.address"]:
              return "bitcoinAddressWhitelist";
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.limit.day"]:
              return "dailyLimit";
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.limit.tx"]:
              return "transactionLimit";
            default:
              throw new Error('invalid policy id');
          }
        }

        // Returns the template path to compile based on approvalItem.info.type
        var getTemplate = function(approvalItemType) {
          var template = '';
          switch(approvalItemType) {
            case 'policyRuleRequest':
              var id = scope.approvalItem.info.policyRuleRequest.update.id;
              if (!id || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, id)) {
                throw new Error('Invalid BitGo policy id');
              }
              template = 'wallet/templates/approvaltiles/' + getPolicyTemplate(scope.approvalItem.info.policyRuleRequest) + '.html';
              break;
            case 'transactionRequest':
            case 'userChangeRequest':
              template = 'wallet/templates/approvaltiles/' + approvalItemType + '.html';
              break;
            default:
              throw new Error('Expected valid approval type. Got: ' + approvalItemType);
          }
          return template;
        };

        // Set pretty time for the ui
        scope.approvalItem.prettyDate = new moment(scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');

        function initTemplate() {
          $http.get(getTemplate(scope.approvalItem.info.type), {cache: $templateCache})
          .success(function(html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        initTemplate();
      }
    };
  }
]);
