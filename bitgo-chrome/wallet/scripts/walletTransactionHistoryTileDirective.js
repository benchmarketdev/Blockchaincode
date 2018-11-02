/**
 * @ngdoc directive
 * @name walletTransactionTile
 * @description
 * Directive to display a single history item from a transactions's history list
 * Also handles the state management for the tile
 * @example
 *   <tr wallet-transaction-history-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Wallet.WalletTransactionHistoryTileDirective', [])

.directive('walletTransactionHistoryTile', [function() {

  var templateSources = {
    created: '/wallet/templates/historytiles/generic.html',
    approved: '/wallet/templates/historytiles/generic.html',
    signed: '/wallet/templates/historytiles/signed.html',
    unconfirmed: '/wallet/templates/historytiles/unconfirmed.html',
    confirmed: '/wallet/templates/historytiles/confirmed.html'
  };

  return {
    restrict: 'E',
    replace: true,
    template: '<ng-include src="setTemplateSource()"></ng-include>',
    scope: {
      item: '=item'
    },
    link: function(scope, element, attrs) {
      // We compile the template dynamically, only once we have a history item to show
      attrs.$observe('item', function(item) {
        if (!item) {
          return;
        }
        scope.action = scope.item.action;
        scope.setTemplateSource = function() {
          if (!templateSources[scope.action]) {
            throw new Error('Invalid history item type');
          }
          return templateSources[scope.action];
        };
        scope.setTemplateSource();
      });
    }
  };
}]);
