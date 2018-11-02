/**
 * @ngdoc directive
 * @name walletTransactionsManager
 * @description
 * Directive to manage the wallet transactions list page
 * @example
 *   <div wallet-transactions-manager></div>
 */
angular.module('BitGo.Wallet.WalletTransactionsManagerDirective', [])

.directive('walletTransactionsManager', ['$q', '$timeout', '$rootScope', '$location', 'NotifyService', 'CacheService', 'UtilityService', 'TransactionsAPI', 'InfiniteScrollService', 'WalletsAPI', 'AnalyticsProxy',
  function($q, $timeout, $rootScope, $location, NotifyService, CacheService, UtilityService, TransactionsAPI, InfiniteScrollService, WalletsAPI, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^WalletController',
      controller: ['$scope', function($scope) {
        // Max wallet sync fetch retries allowed
        var MAX_WALLET_SYNC_FETCHES = 5;
        // format for dates in tiles
        var DATE_FORMAT = 'MMM Do YYYY, h:mm A';

        // The tx list used to populate the view
        $scope.transactions = null;
        // ID of the current tx in the list that is being edited
        $scope.currentTxOpenId = null;

        $scope.noTransactionPresent = false;

        // the total of items we can possibly fetch
        var total;
        // the start index for the initial data fetch
        var startIdx;
        // limits the data fetch number of results
        var limit;
        // count for wallet sync data fetches
        var syncCounter;
        // lock for if a fetch is currently out
        var requestInFlight;

        /**
         * Fetch a wallet to sync it's data up with the client's changes
         * @private
         */
        function syncCurrentWallet() {
          if (syncCounter >= MAX_WALLET_SYNC_FETCHES) {
            console.error('Expect BitGo balance for current wallet to be different than existing balance in local memory');
          }
          var params = {
            bitcoinAddress: $rootScope.wallets.current.data.id
          };
          WalletsAPI.getWallet(params, false).then(function(wallet) {
            // If the new balance hasn't been picked up yet on the backend, refetch
            // to sync up the client's data
            if (wallet.data.balance === $rootScope.wallets.current.data.balance) {
              syncCounter++;
              $timeout(function() {
                syncCurrentWallet();
              }, 1000);
              return;
            }
            WalletsAPI.setCurrentWallet(wallet, true);
            initNewTxList();
            syncCounter = 0;
          });
        }

        /**
         * Logic to show/hide the list of approvals for any outstanding transactions
         * @public
         */
        $scope.showTxApprovals = function() {
          var currentWallet = $rootScope.wallets.current;
          if (!currentWallet || !currentWallet.data.pendingApprovals.length) {
            return false;
          }
          return _.filter(currentWallet.data.pendingApprovals, function(approvalItem) {
            return approvalItem.info.type === 'transactionRequest';
          }).length > 0;
        };

        /**
         * Closes the currently open tx that is being edited
         * @param event {Object} click event
         * @param tx {Object} wallet tx object
         * @public
         */
        $scope.closeCurrentTx = function(event, tx) {
          event.stopPropagation();
          $scope.$broadcast('walletTransactionsManager.TxTileClosed', tx);
          $scope.currentTxOpenId = null;
        };

        function isCurrentTx(tx) {
          return $scope.currentTxOpenId === tx.id;
        }

        /**
         * Opens a single tx to edit
         * @public
         */
        $scope.toggleTxView = function(event, tx) {
          if (!event) {
            throw new Error('Expected an event passed');
          }
          // if the user is clicking on the existing open tile, close it
          if (isCurrentTx(tx)) {
            $scope.closeCurrentTx(event, tx);
            return;
          }
          // if the user selects another tile, close the current one before
          // opening the next one
          if ($scope.currentTxOpenId) {
            $scope.closeCurrentTx(event, tx);
          }
          $scope.currentTxOpenId = tx.id;
          $scope.$broadcast('walletTransactionsManager.TxTileOpened', tx);
        };

        /**
         * Loads the tx list chunk by chunk for infinite scroll.
         * @returns {Promise}
         * @public
         */
        $scope.loadTxListOnPageScroll = function() {
          // If we fetch all the items, or have a request out, kill any further calls
          if ( (total && ($scope.transactions.length >= total)) || requestInFlight ) {
            return $q.reject();
          }
          var params = {
            skip: startIdx,
            limit: limit
          };
          // lock future calls while in flight
          requestInFlight = true;

          return TransactionsAPI.list($rootScope.wallets.current, params)
          .then(function(data) {
            // Set the total so we know when to stop calling
            if (!total) {
              total = data.total;
            }
            startIdx += limit;

            var newSortedTxs;
            var newUnsortedTxs = $scope.transactions.concat(data.transactions);

            // Due to block timing oddities we need to manually take all
            // of the transactions available and filter out any unconfirmed,
            // and surface them at the top of the tx list
            /**
             * Sorts a list of unconfirmed txs
             * @param transactions {Array}
             * @returns {Array} sorted by createdDate
             * @private
             */
            function sortUnconfirmedTxs(transactions) {
              if (!transactions) {
                throw new Error('missing transactions');
              }
              return _.sortBy(transactions, function(tx) {
                return tx.createdDate;
              });
            }

            /**
             * Builds a list of sorted txs with unconfirmed at the top
             * @param unsortedTransactions {Array}
             * @returns {Array}
             * @private
             */
            function sortTransactionsForView(unsortedTransactions) {
              if (!unsortedTransactions) {
                throw new Error('missing transactions');
              }
              var separatedTxs = _.partition(unsortedTransactions, function(tx) { return tx.state === 'unconfirmed'; });
              var unconfirmed = separatedTxs[0];
              var confirmed = separatedTxs[1];
              var sortedUnconfirmed = sortUnconfirmedTxs(unconfirmed);
              return sortedUnconfirmed.concat(confirmed);
            }

            /*
             * Decorate each incoming tx with the running balance and pretty dates
             * @param transactions {Array}
             * @returns {Array}
             * @private
             */
            function decorateTransactionsForView(transactions) {
              if (!transactions) {
                throw new Error('missing transactions');
              }
              var runningBalance = $rootScope.wallets.current.data.balance || 0;
              var prevTransactionAmount = 0;

              _.forEach(transactions, function(transaction) {
                if (transaction.state === 'confirmed') {
                  transaction.prettyDate = new moment(transaction.confirmedDate).format(DATE_FORMAT);
                } else {
                  transaction.prettyDate = new moment(transaction.createdDate).format(DATE_FORMAT);
                }
                // set the running balance for this tx
                transaction.runningBalance = runningBalance - prevTransactionAmount;
                // update the running balance for the next transaction
                runningBalance -= prevTransactionAmount;
                prevTransactionAmount = transaction.amount;
              });
              return transactions;
            }

            // Build the tx list for the view
            newSortedTxs = sortTransactionsForView(newUnsortedTxs);
            $scope.transactions = decorateTransactionsForView(newSortedTxs);

            // check transaction length on fetch
            if ($scope.transactions.length === 0) {
              $scope.noTransactionPresent = true;
            }
            requestInFlight = false;
            return true;
          })
          .catch(function(error) {
            requestInFlight = false;
            console.error('Error fetching transactions: ', error);
          });
        };

        /**
         * Listens for the current wallet to be set
         */
        var killCurrentWalletListener = $scope.$watch('wallets.current', function(wallet) {
          if (wallet && !$scope.transactions) {
            initNewTxList();
          }
        });

        /**
         * Listen for a transaction approval state to be updated and update the tx list
         */
        var killTxApprovalSetListener = $scope.$on('bgApprovalTileTxRequest.TxApprovalStateSet', function(evt, data) {
          //if the user approved the approval
          if (data && data.state === 'approved') {
            // Wait 2 seconds to allow the ui success message to get attention
            // then update the tx list for the user
            $timeout(function() {
              syncCurrentWallet();
            }, 2000);
          }
        });

        /**
         * Clean up when the scope is destroyed
         */
        $scope.$on('$destroy', function() {
          // remove listeners
          killCurrentWalletListener();
          killTxApprovalSetListener();
          // reset the global inifinte scroll handler
          InfiniteScrollService.clearScrollHandler();
        });

        function initNewTxList() {
          startIdx = 0;
          delete $scope.transactions;
          $scope.transactions = [];
          $scope.loadTxListOnPageScroll();
        }

        function init() {
          $rootScope.setContext('walletTransactions');
          AnalyticsProxy.track('WalletTransactionsEntered');
          // initialize locals
          limit = 25;
          syncCounter = 0;
          requestInFlight = false;
          // Set the global inifinte scroll handler
          InfiniteScrollService.setScrollHandler($scope.loadTxListOnPageScroll);
        }
        init();
      }]
    };
  }
]);
