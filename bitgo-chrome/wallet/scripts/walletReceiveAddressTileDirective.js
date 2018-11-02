/**
 * @ngdoc directive
 * @name walletReceiveAddressTileDirective
 * @description
 * Manages template state and compiling for the receive address tile
 * Depends on:
 *    bg-list-address-tile-labeling-manager
 * @example
 *   <tr wallet-receive-address-tile></tr>
 */

angular.module('BitGo.Common.WalletReceiveAddressTileDirective', [])

.directive('walletReceiveAddressTile', ['$rootScope', '$http', '$compile', '$templateCache', 'LabelsAPI', 'NotifyService',
  function($rootScope, $http, $compile, $templateCache, LabelsAPI, NotifyService) {

    return {
      restrict: 'A',
      scope: true,
      controller: ['$scope', function($scope) {
        $scope.viewStates = ['initial', 'labeling'];

        /**
         * Cancel the labeling for the currently open tile
         */
        $scope.cancelTileItemEdit = function() {
          $scope.tileItem.temporaryLabel = $scope.tileItem.labelIsDefault ? "" : $scope.tileItem.label;
          $scope.$emit('walletReceiveAddressTile.CloseCurrentTile');
        };

        function init() {
          $scope.state = 'initial';
        }
        init();
      }],
      link: function(scope, element, attrs) {
        /**
         * Save a new label for an address
         * @param {Obj} tile item being updated
         * @param {String} new label for the address
         */
        scope.saveTileItemReceiveLabel = function(tileItem, label) {
          if (!tileItem) {
            throw new Error('Missing params');
          }
          // If the label was not changed
          if (label === tileItem.label) {
            return;
          }
          // Handle data
          var params = {
            walletId: $rootScope.wallets.current.data.id,
            address: tileItem.address,
            label: label
          };
          // If a label exists, save the new label
          if (label) {
            return LabelsAPI.add(params)
            .then(function(label) {
              params = {
                label: label.label,
                temporaryLabel: label.label,
                labelIsDefault: false,  // ensure we flip the default label flag
                address: tileItem.address,
                index: tileItem.index
              };
              // update the local tile item first
              scope.tileItem.label = params.label;
              scope.tileItem.temporaryLabel = params.temporaryLabel;
              scope.tileItem.labelIsDefault = params.labelIsDefault;
              // broadcast the update of the tile item to relevant listeners
              scope.$emit('walletReceiveAddressTile.CurrentTileUpdated', params);
            })
            .catch(NotifyService.errorHandler)
            .finally(function() {
              // always close the tile
              scope.cancelTileItemEdit();
            });
          }
          // If the label does not exist, delete the existing label
          else {
            // If the titleItem had a label by default
            if (tileItem.labelIsDefault) {
              //close the tile
              scope.cancelTileItemEdit();
              return;
            }
            return LabelsAPI.remove(params)
            .then(function(label) {
              NotifyService.success('The label was removed.');
              params = {
                label: 'Receive Address ' + tileItem.index,
                temporaryLabel: '',
                labelIsDefault: true,
                address: tileItem.address,
                index: tileItem.index
              };
              // update the local tile item first
              scope.tileItem.label = params.label;
              scope.tileItem.temporaryLabel = params.temporaryLabel;
              scope.tileItem.labelIsDefault = params.labelIsDefault;
              // broadcast the update of the tile item to relevant listeners
              scope.$emit('walletReceiveAddressTile.CurrentTileUpdated', params);
            })
            .catch(NotifyService.errorHandler)
            .finally(function() {
              // always close the tile
              scope.cancelTileItemEdit();
            });
          }
        };

        /**
         * Watch the tile index; show if this tile currently being labeled
         */
        var killTileIdxWatch = scope.$watch('currentTileIdx', function() {
          if (scope.tileItem.index === scope.currentTileIdx) {
            scope.setState('labeling');
          } else {
            scope.setState('initial');
          }
        });

        /**
         * Clean up the listeners
         */
        scope.$on('$destroy', function() {
          killTileIdxWatch();
        });

        function init() {
          $http.get('wallet/templates/wallet-receive-partial-address-list-tile.html', {cache: $templateCache})
          .success(function(html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        init();
      }
    };
  }
]);
