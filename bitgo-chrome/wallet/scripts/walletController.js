/*
  Notes:
  - This controls the views and states for a selected wallet in an enterprise
  - Manages state for these views: Transactions, Users, Policy, Send, Receive
*/
angular.module('BitGo.Wallet.WalletController', [])

.controller('WalletController', ['$timeout', '$scope', '$rootScope', '$location', '$filter', 'UtilityService', 'WalletsAPI', 'LabelsAPI', 'SyncService', 'RequiredActionService', 'BG_DEV',
  function($timeout, $scope, $rootScope, $location, $filter, UtilityService, WalletsAPI, LabelsAPI, SyncService, RequiredActionService, BG_DEV) {
    // base string for the receive address' label
    var RECEIVE_ADDRESS_LABEL_BASE = 'Receive Address ';

    // view states for the user settings area
    $scope.viewStates = ['transactions', 'users', 'policy', 'settings', 'send', 'receive'];
    // the current view state
    $scope.state = null;
    // template source for the current view
    $scope.walletStateTemplateSource = null;
    // current receive address for the wallet
    $scope.currentReceiveAddress = null;

    // returns the view current view template based on the current viewState
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for a wallet');
      }
      var template;
      switch ($scope.state) {
        case 'transactions':
          template = 'wallet/templates/wallet-transactions-partial.html';
          break;
        case 'users':
          template = 'wallet/templates/wallet-users-partial.html';
          break;
        case 'policy':
          template = 'wallet/templates/wallet-policy-partial.html';
          break;
        case 'settings':
          template = 'wallet/templates/wallet-settings-partial.html';
          break;
        case 'send':
          template = 'wallet/templates/wallet-send-partial.html';
          break;
        case 'receive':
          template = 'wallet/templates/wallet-receive-partial.html';
          break;
      }
      return template;
    }

    /**
     * Get the newest usable receive address for the wallet
     * @param useExisting {Bool} is using an existing address ok
     * @returns {Promise}
     */
    $scope.generateNewReceiveAddressForWallet = function(useExisting) {
      if (typeof(useExisting) !== 'boolean') {
        throw new Error('invalid params');
      }
      return WalletsAPI.createReceiveAddress($rootScope.wallets.current.data.id, useExisting)
      .then(function(address) {
        if (!address) {
          console.error('Missing a current receive address for the wallet');
        }
        $scope.currentReceiveAddress = address;
        return LabelsAPI.get($scope.currentReceiveAddress.address, $rootScope.wallets.current.data.id);
      })
      .then(function(label) {
        var formattedLabel = label ? label.label : RECEIVE_ADDRESS_LABEL_BASE + $scope.currentReceiveAddress.index;
        $scope.currentReceiveAddress.label = formattedLabel;
        $scope.currentReceiveAddress.temporaryLabel = formattedLabel;
        return $scope.currentReceiveAddress;
      });
    };

    $scope.setSubState = function() {
      $scope.$broadcast("WalletController.showAllUsers");
    };

    // Masthead wallet nav state
    $scope.isCurrentWalletState = function(state) {
      return $scope.state === state;
    };

    /**
     * Sets the current receive address object on scope for safe wallets
     * @params {object} - The safe wallet object
     */
    function setSafeReceiveAddress(wallet) {
      if (wallet && !wallet.isSafehdWallet()) {
        $scope.currentReceiveAddress = {
          address: wallet.data.id,
          label: wallet.data.label,
          temporaryLabel: wallet.data.label
        };
      }
    }

    // Event Listeners
    /**
     * Listen for changes in the wallet's state and swap templates / sync app as needed
     */
    var killStateListener = $scope.$watch('state', function(newState, oldState) {
      if (newState) {
        // If the user has a weak login password and they're trying to spend btc,
        // we force them to upgrade it before they can send any btc
        if (newState === 'send' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
          return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
        }
        // Otherwise set the template as needed and sync the app state
        $scope.walletStateTemplateSource = getTemplate();
        // sync only if old state is not equal to new state
        // If they are the same it means, we are initializing the controller and url change will handle sync
        if (oldState !== newState) {
          SyncService.sync();
        }
      }
    });

    /**
     * Listens for the current wallet to be set and init the current receive address
     */
    var killCurrentWalletListener = $scope.$watch('wallets.current', function(wallet) {
      if (wallet && !$scope.currentReceiveAddress) {
        // if the wallet is safe set the label and address from the wallet object itself
        if (wallet.data && !wallet.isSafehdWallet()) {
          setSafeReceiveAddress(wallet);
          return;
        }
        $scope.generateNewReceiveAddressForWallet(true);
      }
    });

    /**
     * Listen for the user to hop out of the send coins flow
     */
    var killTxCancelListener = $scope.$on('WalletSendManagerDirective.SendTxCancel', function(evt, data) {
      $scope.setState('transactions');
    });

    // Clean up the listeners -- helps decrease run loop time and
    // reduce liklihood of references being kept on the scope
    $scope.$on('$destroy', function() {
      killCurrentWalletListener();
      killTxCancelListener();
      killStateListener();
   });

    function init() {
      $scope.state = 'transactions';
      $scope.walletStateTemplateSource = getTemplate();
    }
    init();
  }
]);
