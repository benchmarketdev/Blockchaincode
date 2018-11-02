/**
 * @ngdoc directive
 * @name bgDynamicTableRowManager
 * @description
 * This directive allows us to specify a handling directive for a <tr> element.
 * This is needed because of how the DOM expects tr/td nesting
 * @example
 *   <tr bg-dynamic-table-row-manager ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Common.BGDynamicTableRowManagerDirective', [])

.directive('bgDynamicTableRowManager', ['$compile', '$rootScope', 'BG_DEV',
  function($compile, $rootScope, BG_DEV) {
    return {
      restrict: 'A',
      terminal: true,
      /**
       * Note: ng-repeat priority is 1000 (this is used with ng-repeat)
       * We want to compile the html with this attribute after the repeater
       * (so we have access to the approvalItem -- or any other needed data),
       * so we give it a lower priority than 1000, yet we still want
       * it higher than any other directives on the element (priority: 0)
       * so we give it 900
       */
      priority: 900,
      compile: function compile(element, attrs) {
        return {
          pre: function preLink(scope, element, attrs, controller) {

            function initTemplate() {
              /**
               * the HTML-valid string value of the directive that will
               * manage the <tr> element that is being built
               */
              var rowManager;

              /**
               * Gets the string value of the managing directive we
               * want to use to manage the <tr> tile that we're biulding in the DOM
               */
              function getRowManager(approvalItemType) {
                var managingDirective = '';
                switch(approvalItemType) {
                  case 'policyRuleRequest':
                    var id = scope.approvalItem.info.policyRuleRequest.update.id;
                    if (!id || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, id)) {
                      throw new Error('Invalid BitGo policy id');
                    }
                    managingDirective = 'bg-approval-tile-policy-request';
                    break;
                  case 'userChangeRequest':
                    managingDirective = 'bg-approval-tile-policy-request';
                    break;
                  case 'transactionRequest':
                    managingDirective = 'bg-approval-tile-tx-request';
                    break;
                  case 'updateEnterpriseRequest':
                    managingDirective = 'bg-approval-tile-enterprise-request';
                    break;
                  case 'invitation':
                    managingDirective = 'bg-approval-tile-invitation';
                    break;
                  default:
                    throw new Error('Expected valid approval type. Got: ' + approvalItemType);
                }
                return managingDirective;
              }

              /** get the tile's state manager */
              if (scope.approvalItem && scope.approvalItem.info.type) {
                rowManager = getRowManager(scope.approvalItem.info.type);
              }
              /** dynamically set the tile state manager */
              element.attr(rowManager, 'true');

              /** remove the attribute to avoid an infinite loop */
              element.removeAttr("bg-dynamic-table-row-manager");
              element.removeAttr("data-bg-dynamic-table-row-manager");
              /** remove the ng-repeat so it doesn't trigger another round of compiling */
              element.removeAttr("ng-repeat");
              element.removeAttr("data-ng-repeat");

              /** compile the new DOM element with the managing directive */
              $compile(element)(scope);
            }
            initTemplate();

            // Listen for the latest wallets to be set; recompile templates
            // to be reflective of the latest policy state
            var killWalletsSetListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function() {
              initTemplate();
            });

            // Clean up the listeners
            scope.$on('$destroy', function() {
              killWalletsSetListener();
            });
          }
        };
      }
    };
  }
]);
