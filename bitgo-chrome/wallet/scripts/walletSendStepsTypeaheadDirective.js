/**
  Directive to help with the wallet-select typeahead input
  - Parent controller comes from the walletSendStepsPrepareTx directive
 */
angular.module('BitGo.Wallet.WalletSendStepsTypeahead', [])
.directive('walletSendStepsTypeahead', ['$q', '$rootScope', 'LabelsAPI', 'WalletsAPI', 'SDK',
  function($q, $rootScope, LabelsAPI, WalletsAPI, SDK) {
    return {
      restrict: 'A',
      require: '^walletSendStepsPrepareTx',  // explicitly require
      controller: ['$scope', function($scope) {
        // Timer to handle multiple events fired from the typeahead
        var timeout;
        // the view model for the dropdown wallet typeahead
        $scope.recipientViewValue = null;
        // the list of wallets expected in the typeahead's dropdown
        $scope.dropdownWallets = null;
        // was the address in the input selected from the dropdown list
        $scope.selectedFromDropdown = null;
        // flag to show an error if the user inputs an invalid bitcoin address
        $scope.recipientInvalid = null;
        // flag which tracks whether the dropdown is open or not
        $scope.isClosed = true;
        // flag which tracks whether the input element has focus
        $scope.isFocussed = null;

        /**
        * See if a bitcoin address has a label already associated with it
        * and manually set that value as the label on the transaction
        * @param bitcoinAddress {String}
        * @private
        */
        function setLabelFromManuallyEnteredAddress(bitcoinAddress) {
          var labelObj = _.filter($scope.dropdownWallets,function(wallet){
            return wallet.data.id === bitcoinAddress;
          })[0];
          if (labelObj) {
            $scope.transaction.recipientLabel = labelObj.data.label;
          }
        }

        // Clears the recipient wallet
        $scope.clearRecipient = function() {
          $scope.selectedFromDropdown = null;
          // update the input viewValue
          $scope.recipientViewValue = null;
          // update the $scope's transaction object
          $scope.transaction.recipientWallet = null;
          $scope.transaction.recipientAddress = null;
        };

        // (Triggered when a user selects a wallet from the recipeint typeahead)
        // Sets the view value in the typeahead and sets the recipient wallet
        // on the scope's transaction object
        $scope.setRecipientFromTypeahead = function(selectedWallet) {
          // First, clean out the old recipient
          $scope.clearRecipient();
          // it was selected from the list
          $scope.selectedFromDropdown = true;
          // update the input viewValue
          $scope.recipientViewValue = selectedWallet.data.label;
          // update the $scope's transaction object
          $scope.transaction.recipientWallet = selectedWallet;
          $scope.transaction.recipientAddress = selectedWallet.data.id;
        };

        /**
        * Validate (and set if needed) the recipient address on the scope's transaction object
        * @param evt {Obj} event (optional)
        * @public
        */
        $scope.validateRecipient = function(evt) {
          // We wrap this in a 100ms timeout because the blur handler triggers
          // right before with the click event when selecting from the typeahead
          // and we only want to fire this once
          timeout = setTimeout(function() {
            if (timeout) {
              clearTimeout(timeout);
            }
            var address;
            var manuallyEntered = evt && !$scope.selectedFromDropdown;
            // If the user entered the address, then the recipient address
            // is the view value of the input
            if (manuallyEntered) {
              address = $scope.recipientViewValue;
            }
            // If the user selected an address from the list, the recipient wallet will
            // have been set; we can get recipientAddress from the transaction object
            if ($scope.transaction.recipientWallet) {
              address = $scope.transaction.recipientAddress;
            }
            // If the recipient is valid, set the address on the transaction object
            // If we are using an alt-coin we are going to delegate the address validation to Shapeshift
            $scope.recipientInvalid =  $scope.transaction.altCoin.useAltCoin === true ? false : !SDK.get().verifyAddress({ address: address });
            if (!$scope.recipientInvalid) {
              // if the user pasted in a valid address that has an existing label
              // set it in the label field manually so they know it's already labeled
              if (manuallyEntered) {
                setLabelFromManuallyEnteredAddress(address);
              }
            }
            $scope.transaction.recipientAddress = address;
            $scope.$apply();
          }, 100);
        };

        // Event handlers
        // Watch for the recipientViewValue model to be wiped, then clean up the
        // scope's data model too
        var killViewValueWatcher = $scope.$watch('recipientViewValue', function(value) {
          if (!value) {
            $scope.clearRecipient();
          }
        });

        // When the state clears, clear out the view values
        var killResetStateListener = $scope.$on('WalletSendManagerDirective.ResetState', function() {
          $scope.clearRecipient();
        });

        // Listen for a recipient address object to be manually selected from the dropdown typeahead
        var killMatchSelectedListener = $scope.$on('bgTypeaheadTrigger.MatchSelected', function(evt, data) {
           if (!data.match) {
              throw new error('Expected match');
           }
           // First set the recipient wallet / recipeint address
           $scope.setRecipientFromTypeahead(data.match);
           // Then validate the selection
           $scope.validateRecipient();
        });

        // Listen for opening and closing of list of addresses in type ahead
        var killIsClosedListener = $scope.$on('typeaheadPopup.isClosed', function(evt, data) {
           $scope.isClosed = data;
           // If dropdown is closed and the input is not in focus, check recipient
           if (data && !$scope.isFocussed) {
              $scope.validateRecipient(evt);
           }
        });

        // Clean up the listeners when $scope is destroyed
        $scope.$on('$destroy', function() {
          killViewValueWatcher();
          killResetStateListener();
          killMatchSelectedListener();
          killIsClosedListener();
        });

        // For the typeahead, we convert rootScope's wallets.all into an array
        // We also fetch labels from the labels api and merge them into this list
        function initDropdownWallets() {
          // init the dropdown wallets array for the typeahead
          $scope.dropdownWallets = [];

          function initLabelsFromLabelsAPI() {
            return LabelsAPI.list()
            .then(function(labels) {
              try {
                // labels is an object with keys representing the recipient address
                _.forIn(labels, function(labelsArray, address) {
                  // Each key contains an array of label objects that have
                  // a label and a wallet (to which that particular label is scoped)
                  _.forEach(labelsArray, function(labelObj, idx) {
                    // Only add the label to the list if it is valid to this wallet. Don't add the current wallet to the list
                    if ((labelObj.walletId === $rootScope.wallets.current.data.id) && (address !== $rootScope.wallets.current.data.id)) {
                      // Note: these objects mimic the structure on BitGo wallets
                      var dropdownItem = {
                        data: { id: address, label: labelObj.label }
                      };
                      $scope.dropdownWallets.push(dropdownItem);
                    }
                  });
                });
              } catch(error) {
                console.log('Error setting up labels from the LabelsAPI');
              }
              return true;
            });
          }

          function initLabelsFromUserWallets() {
            _.forIn($rootScope.wallets.all, function(wallet) {
              // add all wallets except for the current one
              if (wallet.data.id !== $rootScope.wallets.current.data.id) {
                $scope.dropdownWallets.push(wallet);
              }
            });
            return $q.when(true);
          }

          /**
          * Dedupe the list of dropdown wallets based on uniqueness of addresses
          * @private
          */
          function deDupe() {
            $scope.dropdownWallets = _.uniq($scope.dropdownWallets, function(wallet) {
              return wallet.data.id;
            });
            return $q.when(true);
          }

          // Load the labels
          initLabelsFromLabelsAPI()
          .then(initLabelsFromUserWallets)
          .then(deDupe)
          .catch(function(error) {
            console.log('Error loading labels from the labels API: ', error);
          });
        }

        function init() {
          // Ensure $scope.transaction has been set already in the walletSend controller
          // We need it to set properties on based on the user choice from the typeahead dropdown
          if (!$scope.transaction) {
            throw new Error('Expect $scope.transaction to be set in order to instantiate the wallet typeahead helper');
          }
          $scope.recipientInvalid = false;
          initDropdownWallets();
        }
        init();
      }],
      link: function(scope, elem, attrs) {
        // When the user enters the field, remove any error state from the field
        angular.element("input[name='recipientViewValue']").on('focus', function(evt) {
          scope.isFocussed = true;
          scope.recipientInvalid = false;
          scope.$apply();
        });

        // When the user leaves the field, make sure the recipient address is valid
        angular.element("input[name='recipientViewValue']").on('blur', function(evt) {
          // skip validation if no value in the field or if the dropdown is open
          scope.isFocussed = false;
          if (evt.currentTarget.value === '' || !scope.isClosed) {
            return;
          }
          scope.validateRecipient(evt);
          scope.$apply();
        });
      }
    };
  }
]);
