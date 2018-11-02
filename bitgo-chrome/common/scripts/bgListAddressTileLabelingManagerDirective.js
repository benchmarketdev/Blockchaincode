/**
 * @ngdoc directive
 * @name bgListActiveTileManager
 * @description
 * Manages list tiles which can be edited. Toggles them open and close based on the tile clicked
 * Depends on:
 *    bg-state-manager
 *    A tile directive such as wallet-policy-whitelist-tile is expected to be used on each sub-tile
 * @example
 *   <tr bg-list-active-tile-manager bg-state-manager ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Common.BGListActiveTileManagerDirective', [])

.directive('bgListActiveTileManager', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // index of the current tile that is being labeled/modified
        $scope.currentTileIdx = null;

        /**
         * Lets us know what tile is being edited
         */
        function isCurrentTile(index) {
          return $scope.currentTileIdx === index;
        }

        /**
         * Closes the current tile being edited
         */
        $scope.closeCurrentTile = function() {
          $scope.currentTileIdx = null;
        };

        /**
         * Opens a single list tile to edit the label
         * @param index {String}
         */
        $scope.toggleActiveTile = function(tileItem) {
          // check parameters
          if (!tileItem || typeof tileItem.index === 'undefined') {
            console.log("tileItem missing properties");
            return;
          }
          // if user is viewer, he cannot change address labels
          if (!$rootScope.wallets.current.roleIsViewer()){
            // if the user is clicking on the existing open tile, close it
            if (isCurrentTile(tileItem.index)) {
              $scope.closeCurrentTile();
              return;
            }
            // if the user selects another tile, close the current one before
            // opening the next one
            if ($scope.currentTileIdx) {
              $scope.closeCurrentTile();
            }
            $scope.currentTileIdx = tileItem.index;
          }
        };

        // listen for whitelist tile to close
        var killWhitelistTileCloseWatch = $scope.$on('walletPolicyWhitelistTile.CloseCurrentTile',
          function(evt, data) {
            $scope.closeCurrentTile();
          }
        );

        // listen for receive tile to close
        var killReceiveTileCloseWatch = $scope.$on('walletReceiveAddressTile.CloseCurrentTile',
          function(evt, data) {
            $scope.closeCurrentTile();
          }
        );

        /**
         * Clean up the listeners
         */
        $scope.$on('$destroy', function() {
          killWhitelistTileCloseWatch();
          killReceiveTileCloseWatch();
        });
      }]
    };
  }
]);
