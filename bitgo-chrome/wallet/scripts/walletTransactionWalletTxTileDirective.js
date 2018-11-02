/**
 * @ngdoc directive
 * @name walletTransactionTile
 * @description
 * Manages the logic for ingesting a transaction item and compiling the right template
 * Also handles the state management for the tile
 * @example
 *   <tr wallet-transaction-wallettx-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Wallet.WalletTransactionWallettxTileDirective', [])

.directive('walletTransactionWallettxTile', ['$rootScope', '$timeout', '$compile', '$http', '$templateCache', 'TransactionsAPI', 'NotifyService',
  function($rootScope, $timeout, $compile, $http, $templateCache, TransactionsAPI, NotifyService) {
    return {
      restrict: 'A',
      replace: true,
      controller: ['$scope', function($scope) {
        // object that will hold any temporary info before submittal
        $scope.temp = null;
        // bool for if the comment tile is in the process of updating
        $scope.processing = null;

        // $scope helper functions used throughout
        $scope.txIsUnconfirmed = function() {
          return $scope.tx.state === 'unconfirmed';
        };
        $scope.txIsWithdrawal = function() {
          return $scope.tx.amount < 0;
        };
        $scope.txIsTransfer = function() {
          return !!$scope.tx.otherWalletId;
        };
        $scope.txIsTransferWithinSameWallet = function() {
          return $scope.tx.otherWalletId && $scope.tx.otherWalletId === $scope.tx.walletId;
        };
        $scope.txIsOpen = function() {
          return $scope.tx.id === $scope.currentTxOpenId;
        };

        /**
         * Shows or hides the templates buttons based on if the user has modified the comment
         */
        $scope.canShowButtons = function() {
          return $scope.temp.comment !== $scope.tx.comment;
        };

        /**
         * sets the icon class based on the tx send/receive transfer/non-transfer state
         */
        $scope.txBuildListIcon = function() {
          var iconClass = '';
          var txReceived = $scope.tx.amount > 0;
          if ($scope.txIsTransfer($scope.tx)) {
            iconClass = txReceived ?
                        'icon-arrows-h u-colorGreen' :
                        'icon-arrows-h u-colorRed';
          } else {
            iconClass = txReceived ?
                        'icon icon--arrowRight u-colorGreen' :
                        'icon icon--arrowLeft u-colorRed';
          }
          return iconClass;
        };

        function resetTileState() {
          $scope.temp = {
            comment: $scope.tx.comment || ''
          };
          $scope.processing = false;
        }

        /**
         * Listens for the tile to be opened in order to fetch the history details
         */
        var killFetchHistoryListener = $scope.$on('walletTransactionsManager.TxTileOpened',
          function(event, tx) {
            if (!tx) {
              throw new Error('missing tx');
            }
            if (tx.id === $scope.tx.id) {
              TransactionsAPI.getTxHistory(tx.id)
              .then(function(result) {
                $scope.tx.history = result.transaction.history;
              })
              .catch(NotifyService.errorHandler);
            }
          }
        );

        /**
         * Listens for the tile to be closed and resets the state
         */
        var killCloseListener = $scope.$on('walletTransactionsManager.TxTileClosed',
          function(event, tx) {
            if (!tx) {
              throw new Error('missing tx');
            }
            if (tx.id === $scope.tx.id) {
              resetTileState();
            }
          }
        );

        /**
         * Clean up when the scope is destroyed
         */
        $scope.$on('$destroy', function() {
          killFetchHistoryListener();
          killCloseListener();
        });

        function init() {
          resetTileState();
        }
        init();
      }],
      link: function(scope, element, attrs) {
        // /**
        //  * Function to handle the showing of the address popover for this tx item
        //  * TODO (Gavin): This is a tricky popover to create - will take some devoted time
        //  * to get this thing working right
        //  * notes: http://plnkr.co/edit/QhshtRqwpdsirvdFj9JG?p=preview
        //  * notes: http://plnkr.co/edit/STaPZI2f9eTaRhnsr6Qm?p=preview
        //  */
        // trigger in html: ng-click="triggerAddressPopoverToggle($event, tx)"
        // scope.triggerAddressPopoverToggle = function(event, tx) {
        //   if (!event) {
        //     throw new Error('Expected an event passed');
        //   }
        //   event.stopPropagation();
        //   // To avoid the $digest error, we explicitly fire this in the
        //   // next digest loop
        //   $timeout(function() {
        //     angular.element('#addressModal-' + tx.id).trigger('showAddressPopover');
        //   }, 0);
        // };

        /**
         * The entire <tr> is a click target, so this contains the event to
         * whatever element the method was triggered on.
         */
        scope.killPropagation = function(event) {
          if (!event) {
            throw new Error('Expected an event passed');
          }
          event.stopPropagation();
        };

        /**
         * Updates the comment for this transaction
         */
        scope.saveComment = function(event) {
          if (!event) {
            throw new Error('Expected an event passed');
          }
          event.stopPropagation();
          // lock the UI
          scope.processing = true;
          TransactionsAPI.updateComment($rootScope.wallets.current.data.id, scope.tx.id, scope.temp.comment)
          .then(function(result) {
            var updatedTx = result.transaction;
            scope.tx.comment = updatedTx.comment;
            scope.temp.comment = updatedTx.comment;
            // then close the field too
            scope.closeCurrentTx(event, scope.tx);
          })
          .catch(function(error) {
            NotifyService.error('There was an issue saving this memo. Please refresh the page and try the action again.');
          })
          .finally(function() {
            // always reset the processing state
            scope.processing = false;
          });
        };

        function initTemplate() {
          $http.get('wallet/templates/wallet-transaction-partial-listtile.html', {cache: $templateCache})
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
