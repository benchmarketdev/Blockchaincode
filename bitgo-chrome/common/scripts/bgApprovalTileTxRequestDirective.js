/**
 * @ngdoc directive
 * @name bgApprovalTileBitcoinWhitelist
 * @description
 * This directive manages the approval tile state for transaction approval requests
 * @example
 *   <span bg-approval-tile-tx-request>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTileTxRequestDirective', [])

.directive("bgApprovalTileTxRequest", ['$q', '$modal', '$rootScope', 'ApprovalsAPI', 'TransactionsAPI', 'SDK', 'NotifyService', 'UtilityService', 'BG_DEV', 'AnalyticsProxy', 'UserAPI',
  function ($q, $modal, $rootScope, ApprovalsAPI, TransactionsAPI, SDK, NotifyService, UtilityService, BG_DEV, AnalyticsProxy, UserAPI) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        /** All valid tile view states */
        $scope.viewStates = ['initial'];
        /** object hoding the tasansaction info for submittal */
        $scope.txInfo = null;
        /** handle ui state */
        $scope.processing = null;

        /** Show different templates if the approval is one the currentUser created */
        $scope.userIsCreator = $rootScope.currentUser.settings.id === $scope.approvalItem.creator;

        $scope.resetTxInfo = function() {
          var existingOtp = $scope.txInfo.otp;
          $scope.txInfo = {
            transaction: {},
            passcode: '',
            otp: existingOtp
          };
        };

        /**
        * Initializes the directive's controller state
        * @private
        */
        function init() {
          $scope.state = 'initial';
          $scope.processing = false;
          $scope.txInfo = {
            transaction: {},
            passcode: '',
            otp: ''
          };
        }
        init();
      }],
      link: function(scope, element, attrs) {
        /** Valid pending approval states */
        var validApprovalTypes = ['approved', 'rejected'];

        /** Triggers otp modal to open if user needs to otp */
        function openModal(params) {
          if (!params || !params.type) {
            throw new Error('Missing modal type');
          }
          var modalInstance = $modal.open({
            templateUrl: 'modal/templates/modalcontainer.html',
            controller: 'ModalController',
            scope: scope,
            size: params.size,
            resolve: {
              // The return value is passed to ModalController as 'locals'
              locals: function () {
                return {
                  type: params.type,
                  userAction: BG_DEV.MODAL_USER_ACTIONS.approveSendFunds,
                  wallet: $rootScope.wallets.all[scope.approvalItem.bitcoinAddress]
                };
              }
            }
          });
          return modalInstance.result;
        }

        // function which returns a needs unlock error
        function otpError() {
          return $q.reject(UtilityService.ErrorHelper({
            status: 401,
            data: { needsOTP: true, key: null },
            message: "Missing otp"
          }));
        }

        /**
         * Get the outputs from a transaction hex
         *
         * @param {String} txhex a transaction in hex format
         *
         * @returns {Object} addresses and values measured in satoshis in the form:
         *                   {address1: value1, address2: value2, ...}
         * @private
         */
        function getRecipients(txhex) {
          var bitcoin = SDK.bitcoin;
          var tx = bitcoin.Transaction.fromHex(txhex);
          var recipients = {}; // note that this includes change addresses
          tx.outs.forEach(function(txout) {
            var address = bitcoin.Address.fromOutputScript(txout.script, SDK.getNetwork()).toBase58Check();
            if (typeof recipients[address] === 'undefined') {
              recipients[address] = txout.value; // value is measured in satoshis
            } else {
              // The SDK's API does not support sending multiple different
              // values to the same address. We have no choice but to throw an
              // error in this case - we can't approve the transaction. Note
              // that BitGo would never generate such a transaction, and the
              // only way this would occur is if a user is going out of their
              // way to produce a transaction with multiple outputs to the same
              // address. TODO: Update the SDK's API to support sending
              // multiple values to the same address.
              throw new Error('The same address is detected more than once in the outputs. Approval process does not currently support this case.');
            }
          });
          return recipients;
        }

        /**
         * Submit the tx to bitgo and see if it is valid before approving the approval
         *
         * @returns {undefined}
         */
        scope.submitTx = function() {
          // To approve a transaction, the inputs may have been already spent,
          // so we must build and sign a new transaction.
          var recipients;
          try {
            scope.txInfo.transaction = scope.approvalItem.info.transactionRequest;
            recipients = getRecipients(scope.txInfo.transaction.transaction);
          } catch(error) {
            NotifyService.error('There is an issue with this transaction. Please refresh the page and try your action again.');
            return;
          }

          if (Object.keys(recipients).length === 2) {
            // If the number of outputs is 2, then there is one destination
            // address, and one change address. Of the transaction outputs, now
            // contained insidethe recipients object, find the one that is to
            // the destinationAddress, and set recipients to that, so we can
            // rebuild a transaction to the correct destination address and
            // potentially a new change address. If the number of outputs is
            // NOT two, then we leave the "recipients" as is, which will leave
            // the outputs set to the multiple different destination addresses
            // plus the change addresses.
            var destinationAddress = scope.txInfo.transaction.destinationAddress;
            recipients = _.pick(recipients, [destinationAddress]);
          }

          scope.processing = true;

          var txhex, wallet, unspents;
          return UserAPI.session()
          .then(function(session){
            if (session) {
              // if the data returned does not have an unlock object, then the user is not unlocked
              if (!session.unlock) {
                return otpError();
              } else {
                // if the txvalue for this unlock exeeds transaction limit, we need to unlock again
                if (session.unlock.txValue !== 0 && scope.txInfo.transaction.requestedAmount > (session.unlock.txValueLimit - session.unlock.txValue)) {
                  return otpError();
                }
              }
              return $q.when(SDK.get().wallets().get({ id: scope.approvalItem.bitcoinAddress }));
            }
            throw new Error('Could not fetch user session');
          })
          .then(function(res) {
            wallet = res;
            return wallet.createTransaction({
              recipients: recipients,
              minConfirms: 1,
              enforceMinConfirmsForChange: false
            });
          })
          .then(function(res) {
            txhex = res.transactionHex; // unsigned txhex
            unspents = res.unspents;
            var fee = res.fee; // TODO: Display this fee
            return wallet.getEncryptedUserKeychain({});
          })
          .then(function(keychain) {
            // check if we have the passcode.
            // Incase the user has been unlocked, we dont have the passcode and need to return an error to pop up the modal
            if (!scope.txInfo.passcode) {
              return $q.reject(UtilityService.ErrorHelper({
                status: 401,
                data: { needsPasscode: true, key: null },
                message: "Missing password"
              }));
            }
            // check if encrypted xprv is present. It is not present for cold wallets
            if (!keychain.encryptedXprv) {
              return $q.reject(UtilityService.ErrorHelper({
                status: 401,
                data: {},
                message: "Cannot transact. No user key is present on this wallet."
              }));
            }
            keychain.xprv = SDK.decrypt(scope.txInfo.passcode, keychain.encryptedXprv);
            return wallet.signTransaction({ transactionHex: txhex, keychain: keychain, unspents: unspents });
          })
          .then(function(tx) {
            scope.txInfo.tx = tx.tx; // signed txhex
            scope.submitApproval('approved');
          })
          .catch(function(error) {
            if (UtilityService.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock })
              .then(function(result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.otp && $rootScope.currentUser.settings.otpDevices > 0) {
                    throw new Error('Missing otp');
                  }
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  // set the otp code on the txInfo object before resubmitting it
                  scope.txInfo.otp = result.data.otp;
                  scope.txInfo.passcode = result.data.password;
                  // resubmit the tx on window close
                  scope.submitTx();
                }
              })
              .catch(function(error) {
                scope.processing = false;
              });
            }
            else if (UtilityService.API.isPasscodeError(error)) {
              openModal({ type: BG_DEV.MODAL_TYPES.passwordThenUnlock })
              .then(function(result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  scope.txInfo.passcode = result.data.password;
                  // resubmit to share wallet
                  scope.submitTx();
                }
              })
              .catch(function(error) {
                scope.processing = false;
              });
            } else {
              scope.processing = false;
              // Otherwise just display the error to the user
              NotifyService.error(error.error || error);
            }
          });
        };

        /**
        * Updates a pending approval's state / and the DOM once set
        * @param {string} approval's new state to set
        * @public
        */
        scope.submitApproval = function(newState) {
          if (_.indexOf(validApprovalTypes, newState) === -1) {
            throw new Error('Expect valid approval state to be set');
          }
          var data = {
            state: newState,
            id: scope.approvalItem.id,
            wallet: scope.approvalItem.bitcoinAddress,
            tx: scope.txInfo.tx
          };
          ApprovalsAPI.update(scope.approvalItem.id, data)
          .then(function(result) {
            // Mixpanel Tracking (currently track only successful tx approvals)
            if (newState === 'approved') {
              // Track the successful approval of a tx
              var metricsData = {
                walletID: scope.approvalItem.bitcoinAddress,
                enterpriseID: $rootScope.enterprises.current.id,
                txTotal: scope.approvalItem.info.transactionRequest.requestedAmount
              };
              AnalyticsProxy.track('ApproveTx', metricsData);
            }

            $('#' + scope.approvalItem.id).animate({
              height: 0,
              opacity: 0
            }, 500, function() {
              scope.$apply(function() {
                // let any listeners know about the approval to do work
                scope.$emit('bgApprovalTileTxRequest.TxApprovalStateSet', result);
                // remove the approval from the appropriate places
                $rootScope.enterprises.current.deleteApproval(scope.approvalItem.id);
                $rootScope.wallets.all[scope.approvalItem.bitcoinAddress].deleteApproval(scope.approvalItem.id);
                // handle the DOM cleanup
                $('#' + scope.approvalItem.id).remove();
                scope.$destroy();
              });
            });
          })
          .catch(function(error) {
            scope.processing = false;
            var failAction = (newState === 'approved') ? 'approving' : 'rejecting';
            NotifyService.error('There was an issue ' + failAction + ' this request. Please try your action again.');
          });
        };
      }
    };
  }
]);
