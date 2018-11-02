/**
  Directive to manage the wallet send flows
  - Parent Controller is from the walletSendManagerDirective
 */
angular.module('BitGo.Wallet.WalletSendStepsPrepareTxDirective', [])
.directive('walletSendStepsPrepareTx', ['$q', '$rootScope', 'NotifyService', 'CacheService', 'UtilityService', 'BG_DEV', 'LabelsAPI', 'SDK', 'featureFlags', 'ssAPI',
  function($q, $rootScope, NotifyService, CacheService, UtilityService, BG_DEV, LabelsAPI, SDK, featureFlags, ssAPI) {
    return {
      restrict: 'A',
      require: '^walletSendManager', // explicitly require it
      controller: ['$scope', function($scope) {
        // Flag to indicate whether getting pair info from ShapeShift is in process
        $scope.gatheringMarketInfo = false;
        // This flag is passed to the ss-dropdown, to indicate whenever an error happen
        $scope.hasAltErrors = false;
        // Flag to indicate that an error ocurrs loading the AltCoins
        $scope.unableToLoadAltCoins = false;
        // Flag to indicate whether transaction creation is in process
        $scope.gatheringUnspents = false;
        // Flag to show the dropdown, this variable will become true when user click on "Want to send.." link..
        $scope.showAltCoinDropDown = false;
        // Flag to show instant confirm advert
        $scope.showInstantWalletAdvert = false;

        // form error constants
        var ERRORS = {
          invalidRecipient: {
            type: 'invalidRecipient',
            msg: 'Please enter a valid recipient.'
          },
          sendToSelf: {
            type: 'sendToSelf',
            msg: 'You cannot send to yourself.'
          },
          invalidAmount: {
            type: 'invalidAmount',
            msg: 'Please enter a valid amount.'
          },
          insufficientFunds: {
            type: 'insufficientFunds',
            msg: 'You do not have sufficient funds to complete this transaction.'
          },
          amountTooSmall: {
            type: 'amountTooSmall',
            msg: 'This transaction amount is too small to send.'
          }

        };

        /**
        This object is used for the changing values from one input to another
        by changing it on any of them
        If user changes the BTC will automatically calculates the amount on the AltCoin
        If user changes the AltCoin will automatically calculates the amount on the BTC
        */
        function CoinAmount() {
          var bitcoins = null;
          var altCoins = null;
          // Clear amounts
          var clearValues = function () {
            altCoins =  null;
            bitcoins = null;
            $scope.transaction.amount = null;
          };

          this.__defineGetter__("bitcoins", function () {
              return bitcoins;
          });

          this.__defineGetter__("altCoins", function () {
              return altCoins;
          });

          this.__defineSetter__("bitcoins", function (val) {
              bitcoins  = val;
              if (!isNaN(val)) {
                // Do we have a rate?
                if($scope.transaction.altCoin.rate !== null && $scope.transaction.altCoin.rate > 0) {
                  /*
                  We are using the satoshis converter so in order to have the correct
                  rate on the altcoin we should make that calculations using integers
                  */
                  altCoins = bitcoins * ssAPI.decimalToInteger($scope.transaction.altCoin.rate);
                  altCoins = ssAPI.integerToDecimal(altCoins);
                  $scope.transaction.amount = bitcoins;
                }

              }else{
                clearValues();
              }
          });

          this.__defineSetter__("altCoins", function (val) {
            altCoins  = val;
            if (!isNaN(val)) {
              // Do we have a rate?
              if( $scope.transaction.altCoin.rate !== null && $scope.transaction.altCoin.rate > 0) {
                /*
                We are using the satoshis converter so in order to have the correct
                rate on the altcoin we should make that calculations using integers
                */
                bitcoins = val / ssAPI.decimalToInteger( $scope.transaction.altCoin.rate);
                bitcoins = ssAPI.decimalToInteger(bitcoins);
                $scope.transaction.amount = bitcoins;
              }
            }else{
              clearValues();
            }

          });
        }

        /**
         If the message is null, we are going to set the initial one with the following:
         Sent to {coin} address {address} via ShapeShift
         First check if the user has change to use an AltCoin!, if not we don't want to change
         nothing :) */
        $scope.changeMemo = function() {
          if(hasChangeCoin) {
            var newAddress = $scope.transaction.altCoin.recipientAddress === null ? "" : $scope.transaction.altCoin.recipientAddress + " ";
            var newMessage = "Sent to " + $scope.transaction.altCoin.selected + " address " + newAddress + "via ShapeShift";
            $scope.transaction.message = newMessage;
          }
        };

        var hasChangeCoin = false;
        $scope.altCoinAmount = new CoinAmount();

        function clearChangeCoinValues() {
          // Clear if errors and clear values
          hasChangeCoin = false;

          $scope.hasAltErrors               = false;
          $scope.recipientInvalid           = false;
          $scope.recipientViewValue         = null;
          $scope.altCoinAmount.bitcoins     = 0;

          $scope.transaction.recipientLabel = null;
          $scope.transaction.amount         = null;
          $scope.transaction.message        = null;

          $scope.transaction.altCoin.symbol = "--";
          $scope.transaction.altCoin.rate   = 0;
          $scope.transaction.altCoin.recipientAddress = null;
          $scope.transaction.altCoin.useAltCoin = false;
        }

        /**
          This method handles the change even on the dropdown,
          Everytime the user changes the coin we must clear some values
          Like memo's, amounts, and others,
          If the coin is an AltCoin we are going to call the API to bring us
          the information about the pair btc_alt
        */
        $scope.changeCoin = function(coin) {
          //
          $scope.transaction.altCoin.selected = coin.name;
          $scope.transaction.altCoin.image    = coin.image;
          // Clear the form from errors each time we change the coin
          if (_.isFunction($scope.clearFormError)) {
            $scope.clearFormError();
          }
          // Clear some scope values when user changes the coin
          clearChangeCoinValues();
          // Does the user selects an AltCoin? :)
          if(coin.symbol !== 'BTC') {
            $scope.transaction.altCoin.useAltCoin = true;
            $scope.transaction.recipientLabel     = null;
            hasChangeCoin = true;
            // Change the memo when the user changes the type of coin
            $scope.changeMemo();
            // Get coin information! Rate and limits!
            getMarketInfo(coin.name);
          }
        };

        function showShapeshiftError(msg) {
          var shapeshiftError = null;
          // Try to find the error on the ShapeShift error dictionary, if the error is found means
          // that a known error happens on the shapeshift flow.
          shapeshiftError = ssAPI.getError(msg);
          if(shapeshiftError !== null) {
            // Show the error at the top of the page
            $scope.setFormError(shapeshiftError.msg);
            // Move the user to the top of the page
            window.scrollTo(0,0);
          }
          return shapeshiftError;
        }

        function getMarketInfo(name) {
          // Disable dropdown and change text on the button by changing this flag
          $scope.gatheringMarketInfo = true;
          ssAPI.getMarketInfo(name)
          .then(function(altCoin) {
            // Fill required data for shapeshift exchange.
            $scope.transaction.altCoin.rate             = altCoin.rate;
            $scope.transaction.altCoin.limit            = altCoin.limit;
            $scope.transaction.altCoin.min              = altCoin.min;
            $scope.transaction.altCoin.minerFee         = altCoin.minerFee;
            $scope.transaction.altCoin.symbol           = altCoin.symbol;
          })
          .catch(function(error) {
            // Disable next button until user selects another coin that does not have errors :
            $scope.hasAltErrors = true;
            showShapeshiftError(error);
          }).finally(function() {
            // Enable things back.
            $scope.gatheringMarketInfo = false;
          });
        }
        /**
          Handles the ng-click event for the link "Want to send AltCoin",
          by toogle this flag, will show the dropdown and hide the link
        */
        $scope.useAltCoin = function() {
          $scope.showAltCoinDropDown = true;
        };

        // shows the labeling field for the recipient address if it was manually
        // entered by the user
        $scope.showRecipientLabelField = function() {
          return $scope.transaction.recipientAddress && !$scope.transaction.recipientWallet;
        };

        // flag to let user know if they're violating the wallet spending limit
        $scope.violatesSpendingLimit = function() {
          var violatesTxLimit;
          var violatesDailyLimit;
          var amount = $scope.transaction.amount;
          try {
            violatesTxLimit = $rootScope.wallets.current.checkPolicyViolation(BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.limit.tx"], amount);
            violatesDailyLimit = $rootScope.wallets.current.checkPolicyViolation(BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.limit.day"], amount);
            return violatesTxLimit || violatesDailyLimit;
          } catch(error) {
            console.log('Missing $rootScope.wallets.current: ', error);
            return false;
          }
        };

        // If the user enters a new label, we add the new label to their
        // labels so they can find it by label next time they send
        function saveLabel() {
          if ($scope.transaction.recipientLabel) {
            var fromWallet = $rootScope.wallets.current;
            var validBtcAddress = SDK.get().verifyAddress({ address: $scope.transaction.recipientAddress });
            if (validBtcAddress) {
              var params = {
                walletId: fromWallet.data.id,
                label: $scope.transaction.recipientLabel,
                address: $scope.transaction.recipientAddress
              };
              LabelsAPI.add(params)
              .then(
                function(data) {},
                function(error) {
                  console.log('Error when saving label for an address: ', error);
                }
              );
            }
          }
        }

        // function to set error on form and turn off processing flag
        function setErrorOnForm(errMsg) {
          if(!errMsg || typeof(errMsg) !== 'string') {
            throw new Error('Invalid form error');
          }
          $scope.setFormError(errMsg);
          $scope.gatheringUnspents = false;
        }

        // Validate the transaciton input form
        function txIsValid() {
          var balance;
          var currentWallet;
          var currentWalletAddress;
          var validRecipientAddress;

          // ensure if recipient address is present
          if (!$scope.transaction.recipientAddress) {
            setErrorOnForm(ERRORS.invalidRecipient.msg);
            return false;
          }

          try {
            // Wallet checking
            validRecipientAddress = $scope.transaction.altCoin.useAltCoin === true ? true : SDK.get().verifyAddress({ address: $scope.transaction.recipientAddress });
            currentWallet = $rootScope.wallets.current;
            currentWalletAddress = currentWallet.data.id;
            // Funds checking
            balance = currentWallet.data.balance;
          } catch(error) {
            // TODO (Gavin): show user an error here? What can they do?
            console.error('There was an issue preparing the transaction: ', error.message);
          }

          // ensure a valid recipient address
          if (!validRecipientAddress) {
            setErrorOnForm(ERRORS.invalidRecipient.msg);
            return false;
          }
          // ensure they're not sending coins to this wallet's address
          if ($scope.transaction.recipientAddress === currentWalletAddress) {
            setErrorOnForm(ERRORS.sendToSelf.msg);
            return false;
          }
          // ensure a valid amount
          if (!parseFloat($scope.transaction.amount)) {
            setErrorOnForm(ERRORS.invalidAmount.msg);
            return false;
          }
          // ensure they are not entering an amount greater than they're balance
          if ($scope.transaction.amount > balance) {
            setErrorOnForm(ERRORS.insufficientFunds.msg);
            return false;
          }
          // ensure amount is greater than the minimum dust value
          if ($scope.transaction.amount <= BG_DEV.TX.MINIMUM_BTC_DUST) {
            setErrorOnForm(ERRORS.amountTooSmall.msg);
            return false;
          }

          // ShapeShift validations
          if($scope.transaction.altCoin.useAltCoin) {
            // If user checks the box but not selects a type of coin let's throw an exception
            if ($scope.transaction.altCoin.selected === null) {
              showShapeshiftError('unableToGetSelectedCoin');
              return false;
            }

            // Get back the satoshis to the original value on bitcoins
            var amount  = ssAPI.integerToDecimal($scope.transaction.amount);
            // Does the transaction exceed the shapeshift limit?
            if (amount > $scope.transaction.altCoin.limit) {
              showShapeshiftError('limitExceeded');
              return false;
            }
            // Shapeshift also has a lower limit, are we trying to sent lower than that?
            if (amount < $scope.transaction.altCoin.min) {
              showShapeshiftError('underLimit'); // handled on the catch block
              return false;
            }
          }

          return true;
        }

        function prepareTx() {
          // Set up objects for the TransactionAPI
          var sender = {
            wallet: $rootScope.wallets.current,
            otp: $scope.transaction.otp || '',
            passcode: $scope.transaction.passcode || '',
            message: $scope.transaction.message
          };
          var recipient = {
            type: $scope.transaction.recipientAddressType,
            address: $scope.transaction.recipientAddress,
            satoshis: parseFloat($scope.transaction.amount),
            message: $scope.transaction.message,
            suppressEmail: false
          };

          var createPendingTransaction = function () {
            return $scope.createPendingTransaction(sender, recipient)
            .then(function() {
              saveLabel();
            });
          };

          // If we are using an alt-coin, let's use the shapeshift api to get the coin information
          if ($scope.transaction.altCoin.useAltCoin) {
            // Set other required data
            $scope.transaction.altCoin.returnAddress    = $rootScope.wallets.current.data.id;

            var shiftParams = ssAPI.getShiftParams($scope.transaction.altCoin);
            // Get the deposit address from Shapeshift!
            return ssAPI.shift(shiftParams)
            .then(function(data) {
              // Something happens with Shapeshift? We should not hit
              // this statement ever.
              if (_.isUndefined(data) || data === null) {
                throw new Error('unableToGetDepositAddress');
              }

              // Does Shapeshift return an error? :(
              if(!_.isUndefined(data.error)) {
                // Let's raise the exception to be handled on the catch block
                throw new Error(data.error); // handled on the catch block
              }

              // Let's make sure to receive the deposit address
              if (typeof data.deposit !== 'undefined') {
                // Let's set the deposit address :D
                $scope.transaction.altCoin.depositAddress = data.deposit;
                // Assign new deposit address
                $scope.transaction.recipientAddress       = data.deposit;
                recipient.address                         = data.deposit;
              }else{
                throw new Error('unableToGetDepositAddress');
              }
            })
            .then(createPendingTransaction);

          }else{
            return createPendingTransaction();
          }


        }

        // advances the transaction state if the for and inputs are valid
        $scope.advanceTransaction = function(amountSpendWasReduced) {
          // amountSpendWasReduced is used to repesent how much lower the total
          // amount the user can send is if they are trying to send an amount
          // that is larger than for which they can afford the blockchain fees.
          // i.e., if they try to spend their full balance, this will be
          // automatically reduced by amountSpendWasReduced to an amount they
          // can afford to spend. This variable must be scoped to the
          // advanceTransaction method so that every time they click the "next"
          // button it gets reset to undefined, in case they blick back and
          // next over and over changing the total amount, ensuring that it
          // gets recomputed each time.
          $scope.transaction.amountSpendWasReduced = amountSpendWasReduced;

          $scope.gatheringUnspents = true;

          /**
            Since we are using a separate control when using alt-coins,
            lets set the value of the control to the transaction recipient
          */
          if ($scope.transaction.altCoin.useAltCoin) {
            $scope.transaction.recipientAddress = $scope.transaction.altCoin.recipientAddress;
          }

          $scope.clearFormError();
          if (txIsValid()) {
            return prepareTx()
            .then(function() {
              $scope.gatheringUnspents = false;
              $scope.setState('confirmAndSendTx');
            })
            .catch(function(error) {

              $scope.gatheringUnspents = false;
              if (error == 'Error: Insufficient funds') {
                var fee = error.result.fee;
                var available = error.result.available;
                // An insufficient funds error might happen for a few reasons.
                // The user might spending way more money than they have, in
                // which case this is an actual error. Or an insufficient funds
                // error might occur if they are spending the same or slightly
                // less than their total balance, and they don't have enough
                // money to pay the balance. If the former, throw an error, if
                // the latter, we try to handle it specially, explained below.
                if (typeof fee === 'undefined' || fee >= $scope.transaction.amount) {
                  NotifyService.error('You do not have enough funds in your wallet to pay for the blockchain fees for this transaction.');
                } else {
                  // If the user is trying to spend a large amount and they
                  // don't quite have enough funds to pay the fees, then we
                  // automatically subtract the fee from the amount they are
                  // sending and try again. In order to prevent a possible
                  // infinite loop if this still isn't good enough, we keep
                  // track of whether we have already tried this, and if we
                  // have, we throw an error. Furthermore, we create an
                  // automaticallySubtractinFee variable so that the client can
                  // optionally display a warning if desired.
                  if (!amountSpendWasReduced) {
                    amountSpendWasReduced = $scope.transaction.amount - (available - fee);
                    // If the amount reduced is  too large (this can happen when not enough confirmed funds) or the fee exceeds available amount -> notify user  
                    if (amountSpendWasReduced > 1e6 || (available - fee <= 0)) {
                      NotifyService.error('You do not have enough confirmed funds in your wallet.');
                      return;
                    }
                    $scope.transaction.amount = available - fee;
                    $scope.advanceTransaction(amountSpendWasReduced);
                  } else {
                    NotifyService.error('You do not have enough funds in your wallet to pay for the blockchain fees for this transaction.');
                  }
                }
              } else {
                // Try to find the error on the ShapeShift error dictionary, if the error is found means
                // that a known error happens on the shapeshift flow.
                if (showShapeshiftError(error) === null) {
                  // Default case
                  Raven.captureException(error, { tags: { loc: 'ciaffxsd00000wc52djlzz2tp' } });
                  NotifyService.error('Your transaction was unable to be processed. Please ensure it does not violate any policies, then refresh your page and try sending again.');
                }

              }

            });
          }

          // The result of this function is only ever checked in tests.
          // However, rather than return false, it is good practice to return a
          // promise, since this function is asynchronous, and thus should
          // always return a promise.
          return $q(function(resolve, reject) {
            return resolve(false);
          });
        };


        /**
          Handles the ng-click event for the Instant Transaction advert
        */
        $scope.toggleAdvert = function() {
          $scope.showInstantWalletAdvert = !$scope.showInstantWalletAdvert;
        };

        function init() {
          if (!$scope.transaction) {
            throw new Error('Expect a transaction object when initializing');
          }
        }
        init();
      }]
    };
  }
]);
