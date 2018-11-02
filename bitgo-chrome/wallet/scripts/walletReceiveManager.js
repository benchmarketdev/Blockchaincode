/**
 * @ngdoc directive
 * @name walletReceiveManager
 * @description
 * Directive to manage the wallet receive page (top section and list areas)
 * @example
 *   <div wallet-receive-manager></div>
 */
angular.module('BitGo.Wallet.WalletReceiveManagerDirective', [])

.directive('walletReceiveManager', ['$q', '$timeout', '$rootScope', 'NotifyService', 'CacheService', 'UtilityService', 'InfiniteScrollService', 'WalletsAPI', 'LabelsAPI', 'BG_DEV', 'AnalyticsProxy',
  function($q, $timeout, $rootScope, NotifyService, CacheService, UtilityService, InfiniteScrollService, WalletsAPI, LabelsAPI, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^?WalletController',
      controller: ['$scope', function($scope) {
        // base string for the receive address' label
        var RECEIVE_ADDRESS_LABEL_BASE = 'Receive Address ';
        // the total of items we can possibly fetch
        var total;
        // the start index for the initial data fetch
        var startIdx;
        // limits the data fetch number of results
        var limit;
        // bool to let us know if address list is being fetched
        var gettingAddresses;

        // list of addresses belonging to the wallet (consumed for the UI)
        $scope.addresses = null;
        // index of the address tile being edited
        $scope.currentTileIdx = null;

        /**
         * Return whether or not the user can edit a label (ui logic)
         * @param tileItem {Object} a list tile item
         * @returns {Bool}
         */
        $scope.userCanEdit = function(tileItem) {
          if (!tileItem) {
            throw new Error('missing tile item');
          }
          if (tileItem.index === 0) {
            return false;
          }
          return $rootScope.wallets.current.role !== BG_DEV.WALLET.ROLES.VIEW;
        };

        /**
         * Decorate a addresses with updated properties
         * @param {Obj} params to update the address object in the list
         * @param {Bool} is the address the main/current receive address shown
         */
        $scope.decorateAddresses = function(params, isMainReceiveAddress) {
          if (!params.index && params.index !== 0) {  // 0 index should be valid
            throw new Error('Invalid params');
          }
          var listItem;
          _.forEach($scope.addresses, function(tileItem) {
            if (tileItem.index === params.index) {
              listItem = tileItem;
            }
          });
          if (!listItem) {
            throw new Error('Expected address object');
          }
          // add the label
          if (params.label) {
            listItem.label = params.label;
            listItem.temporaryLabel = params.label;
            // update the main receive address if needed
            if (isMainReceiveAddress) {
              $scope.currentReceiveAddress.label = params.label;
              $scope.currentReceiveAddress.temporaryLabel = params.label;
            }
          }
          // Handle setup for if the label is a default label vs. user-given
          if (params.labelIsDefault) {
            listItem.labelIsDefault = params.labelIsDefault;
            listItem.temporaryLabel = "";
          }
        };

        /**
         * Closes the current tile being edited
         */
        $scope.closeCurrentTile = function() {
          $scope.currentTileIdx = null;
        };

        /**
         * Opens a single address list tile to edit the label
         * @param {Obj} a bitgo address object
         */
        $scope.toggleActiveTile = function(tileItem) {
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
          $scope.$broadcast('walletReceiveManager.TileOpened', tileItem);
        };

        /**
         * Fetches all the addresses associated with the wallet and sets up the scope
         * Also sets the rootScope's scroll handler function
         * @returns {Promise}
         */
        $scope.getAddressesOnPageScroll = function() {
          // Kill the call if: we fetched all the items or if we're generating an address
          if (total && ($scope.addresses.length >= total) || gettingAddresses) {
            return $q.reject();
          }
          // lock further calls
          gettingAddresses = true;
          // make the call
          var params = {
            bitcoinAddress: $rootScope.wallets.current.data.id,
            chain: 0,
            limit: limit,
            details: true,
            skip: startIdx,
            sort: -1
          };
          return WalletsAPI.getAllAddresses(params)
          .then(function(data) {
            if (!total) {
              total = data.total;
            }
            startIdx += limit;
            $scope.addresses = $scope.addresses.concat(data.addresses);
            // Get the label for each address
            _.forEach($scope.addresses, function(tileItem) {
              getAddressLabel(tileItem);
            });
            return true;
          })
          .catch(NotifyService.errorHandler)
          .finally(function() {
            // unlock further calls
            gettingAddresses = false;
          });
        };

        /**
         * Fetch/set a fresh address list on the scope
         */
        $scope.initAddressList = function() {
          // reset local vars
          startIdx = 0;
          total = null;
          // reset scope vars
          $scope.addresses = [];
          $scope.getAddressesOnPageScroll();
        };

        // Event Listeners
        /**
         * Listen for changes to a tile item address obj and update it with the new details
         */
        var killDecorateReceiveAddrListener = $scope.$on('walletReceiveAddressTile.CurrentTileUpdated', function(evt, params) {
          if (!params.label || !params.address || !params.index.toString()) { // toString to handle 0 index
            throw new Error('Invalid params');
          }
          var isMainReceiveAddress = params.index === $scope.currentReceiveAddress.index;
          $scope.decorateAddresses(params, isMainReceiveAddress);
        });

        /**
         * Clean up listeners
         */
        $scope.$on('$destroy', function() {
          killDecorateReceiveAddrListener();
          // reset the global inifinte scroll handler
          InfiniteScrollService.clearScrollHandler();
        });

        /**
         * Fetch the label for an address
         * @param {Obj} a bitgo address object
         */
        function getAddressLabel(tileItem) {
          LabelsAPI.get(tileItem.address, $rootScope.wallets.current.data.id)
          .then(function(label) {
            // Boolean to let us know if it is a user-given label vs. a default label
            var labelIsDefault = !label;
            var params = {
              label: label ? label.label : RECEIVE_ADDRESS_LABEL_BASE + tileItem.index,
              labelIsDefault: labelIsDefault,
              index: tileItem.index
            };
            $scope.decorateAddresses(params, false);
          })
          .catch(function(error) {
            console.error('Error fetching label for: ', tileItem);
          });
        }

        /**
         * Helper to let us know what tile is being edited
         */
        function isCurrentTile(index) {
          return $scope.currentTileIdx === index;
        }

        function init() {
          $rootScope.setContext('walletReceive');
          AnalyticsProxy.track('WalletReceiveEntered');
          limit = 25;
          gettingAddresses = false;
          $scope.initAddressList();

          // Set the global inifinte scroll handler
          InfiniteScrollService.setScrollHandler($scope.getAddressesOnPageScroll);
        }
        init();
      }]
    };
  }
]);
