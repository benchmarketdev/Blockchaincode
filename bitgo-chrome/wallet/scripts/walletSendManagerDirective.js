/**
  Directive to manage the wallet send flows
  - Parent Controller is WalletController
 */
angular.module('BitGo.Wallet.WalletSendManagerDirective', [])

.directive('walletSendManager', ['$q', '$timeout', '$rootScope', '$location', 'NotifyService', 'CacheService', 'UtilityService', 'TransactionsAPI', 'SDK', 'BG_DEV', 'AnalyticsProxy',
  function( $q, $timeout, $rootScope, $location, NotifyService, CacheService, UtilityService, TransactionsAPI, SDK, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^WalletController',
      controller: ['$scope', function($scope) {
        // viewstates for the send flow
        $scope.viewStates = ['prepareTx', 'confirmAndSendTx'];
        // current view state
        $scope.state = null;
        // the transaction object built as the user goes through the send flow
        $scope.transaction = null;
        // The actual bitcoin transaction object that will be signed and
        // sent to the BitGo server for processing
        $scope.pendingTransaction = null;
        // flag to show notice if we had to automatically add a fee
        $scope.showFeeAlert = null;
        // Get a copy of the Currency cache to use locally when switching between
        // currencies in the form (used when we allow currency switching)
        var currencyCache = CacheService.getCache('Currency');

        // Cancel the transaction send flow
        $scope.cancelSend = function() {
          $scope.$emit('WalletSendManagerDirective.SendTxCancel');
        };

        // Called to reset the send flow's state and local tx object
        $scope.resetSendManager = function() {
          $scope.$broadcast('WalletSendManagerDirective.ResetState');
          // reset the local state
          setNewTxObject();
          $scope.setState('prepareTx');
        };

        // resets the local, working version of the tx object
        function setNewTxObject() {
          delete $scope.transaction;
          // properties we can expect on the transaction object
          $scope.transaction = {
            // Don't set blockchainFee here - wait for building transaction to
            // calculate the fee based on the number of required inputs and
            // therefore the size of the transaction. Instead, estimate that
            // the fee will be, to first order, 0.0001 BTC. This figure can be
            // used to help calculate if there are enough funds left without
            // forcing any particular fee (which will depend on which utxouts
            // are used).
            blockchainFeeEstimate: 0.0001 * 1e8, // value is in Satoshis

            bitgoFee: 0.0,                  // value is in Satoshis
            // amount of the transaction
            amount: null,                   // value is in Satoshis
            // total transaction value with fees and amount included
            total: null,
            // time the transaction was confirmed (Shown in the ui on successful send)
            confirmationTime: '',
            // the otp code for sending the tx
            otp: '',
            // the passcode for the wallet
            passcode: '',
            // Label added to an address (optional)
            recipientLabel: '',
            // this property is set if a user selects a wallet from the dropdown
            // remains null otherwise (e.g. If a user only types in an address)
            recipientWallet: null,
            // the address to which bitcoins are being sent (can come from selecting
            // a wallet from the dropdown or typing it in manually)
            recipientAddress: null,
            recipientAddressType: 'bitcoin',
            // optional message for the tx
            message: null,

            // Wrap the whole shapeshift integration into this object
            altCoin: {

              useAltCoin:   false, // This flag tells if user wants to use an alt Coin
              selected:     null,  // Selected alternative coin from the dropdown

              symbol:       null,  // Symbol of the selected coin
              rate:         0,     // Conversion rate between bitcoins and the alt coin
              limit:        0,     // Shapeshift max limit for exchange.
              min:          0,     // Shapeshift minimun limit for exchange
              minerFee:     0,     // Miner Fees
              rateSatoshis: 0,     // This is the amount that the user will receive after substracting the shapeshift miner fee

              recipientAddress: null, // Alternative coin to send the money through Shapeshift
              returnAddres:     null, // Returning address for Shapeshift
              depositAddress:   null  // Shapeshift deposit address

            }

          };
        }

        // Creates a new pending transaction to be confirmed and send to the BitGo server
        $scope.createPendingTransaction = function(sender, recipient) {
          $scope.pendingTransaction = {
            sender: sender,
            recipient: recipient,
          };
          var wallet;
          var walletId;
          var recipients = {};
          recipients[recipient.address] = recipient.satoshis;

          // now, get to asynchronously get inputs before getting the fee for
          // spending those inputs.
          walletId = $rootScope.wallets.current.data.id;
          return $q.when(SDK.get().wallets().get({ id: walletId }))
          .then(function(res) {
            wallet = res;

            // In order to calculate the fee, we need to gather unspents and
            // try building a transaction. This is not the transaction that
            // will actually be signed - another one will be created if they
            // agree to the fee. For this transaction, which is merely used to
            // calculate the fee, we do not need to gather a new change
            // address, and therefore pass in a placeholder address (the user's
            // wallet id).
            return wallet.createTransaction({
              recipients: recipients,
              changeAddress: wallet.id(),
              minConfirms: 1,
              enforceMinConfirmsForChange: false
            });
          })
          .then(function(res) {
            var txhex = res.transactionHex;
            var unspents = res.unspents;
            var fee = res.fee;
            $scope.pendingTransaction.unsignedTxHex = txhex;
            $scope.transaction.feeRate = res.feeRate;
            $scope.pendingTransaction.fee = fee;
            $scope.transaction.total = $scope.transaction.amount + fee;
            $scope.transaction.blockchainFee = fee;
          });
        };

        function init() {
          $rootScope.setContext('walletSend');
          AnalyticsProxy.track('WalletSendEntered');
          $scope.state = 'prepareTx';
          $scope.showFeeAlert = false;
          setNewTxObject();
        }
        init();
      }]
    };
  }
]);
