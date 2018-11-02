/**
 * @ngdoc directive
 * @name walletSettingsPasscodeForm
 * @description
 * Directive to manage the wallet passcode
 * @example
 *   <div wallet-settings-passcode-form></div>
 */

angular.module('BitGo.Wallet.WalletSettingsPasscodeFormDirective', [])

.directive('walletSettingsPasscodeForm', ['$q', '$rootScope', '$modal', 'UtilityService', 'WalletsAPI', 'KeychainsAPI', 'NotifyService', 'BG_DEV', 'SDK',
  function($q, $rootScope, $modal, UtilityService, WalletsAPI, KeychainsAPI, NotifyService, BG_DEV, SDK) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // object containing the strength of the user's new passcode
        $scope.passcodeStrength = null;
        // existing wallet passcode
        $scope.oldPasscode = null;
        // new wallet passcode
        $scope.newPasscode = null;
        // new wallet passcode confirmation
        $scope.newPasscodeConfirm = null;

        /**
         * Validate the pw form before updating
         * @private
         */
        function formIsValid() {
          if (!$scope.passcodeStrength) {
            $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
            return false;
          }
          if (!$scope.oldPasscode) {
            $scope.setFormError('Please enter a current wallet password.');
            return false;
          }
          if (!$scope.newPasscode) {
            $scope.setFormError('Please enter new password.');
            return false;
          }
          if (!$scope.newPasscodeConfirm) {
            $scope.setFormError('Please confirm new password.');
            return false;
          }
          if ($scope.newPasscode !== $scope.newPasscodeConfirm) {
            $scope.setFormError('Please enter matching passwords.');
            return false;
          }
          if ($scope.passcodeStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
            $scope.setFormError('Please enter a stronger password.');
            return false;
          }
          return true;
        }

        /**
         * Open the modal for OTP
         * @param params {Object} params for modal
         * @private
         */
        function openModal(params) {
          if (!params || !params.type) {
            throw new Error('Missing modal type');
          }
          var modalInstance = $modal.open({
            templateUrl: 'modal/templates/modalcontainer.html',
            controller: 'ModalController',
            scope: $scope,
            size: params.size,
            resolve: {
              // The return value is passed to ModalController as 'locals'
              locals: function () {
                return {
                  type: params.type,
                  userAction: BG_DEV.MODAL_USER_ACTIONS.otp
                };
              }
            }
          });
          return modalInstance.result;
        }

        /**
         * Handle errors returned from the server in the process
         * @param error {Object} Client-formatted error object
         * @private
         */
        function handleError(error) {
          if (UtilityService.API.isOtpError(error)) {
            // If the user needs to OTP, use the modal to unlock their account
            openModal({ type: BG_DEV.MODAL_TYPES.otp })
            .then(function(result) {
              if (result.type === 'otpsuccess') {
                // attempt to update the password automatically when done
                $scope.updatePassword();
              }
            });
          } else if (UtilityService.API.isPasscodeError(error)) {
            $scope.setFormError('Invalid current wallet password.');
          } else {
            // Otherwise just display the error to the user
            NotifyService.error(error.error);
          }
        }

        /**
         * Attempt to decrypt an encrypted xPrv with a password
         * @param passcode {String} existing (old) wallet passcode
         * @param encryptedXprv {String} wallet's user encryptedXprv
         * @returns {String} user's decrypted private key || undefined
         * @private
         */
        function decryptKeychain(passcode, encryptedXprv) {
          try {
            var privKey = SDK.decrypt(passcode, encryptedXprv);
            return privKey;
          } catch (e) {
            return;
          }
        }

        /**
         * Submit the updated password for the wallet's xprv
         * @public
         */
        $scope.updatePassword = function() {
          $scope.clearFormError();
          if (formIsValid()) {
            var privateInfo = $rootScope.wallets.current.data.private;
            var userXpub = privateInfo.keychains[0].xpub;
            var userPath = privateInfo.keychains[0].path;

            KeychainsAPI.get(userXpub)
            .then(function(keychain) {
              // attempt to decrypt the xprv with the password provided
              var xprv = decryptKeychain($scope.oldPasscode, keychain.encryptedXprv);
              if (!xprv) {
                var error = { status: 401, message: 'Invalid current wallet password', data: { needsPasscode: true } };
                return $q.reject(new UtilityService.ErrorHelper(error));
              }
              // Get the xpub for the xprv provided. It might not match with xpub on the wallet for legacy wallets
              var newBip32;
              try {
                newBip32 = SDK.bitcoin.HDNode.fromBase58(xprv);
                console.assert(newBip32.privKey);
              } catch (e) {
                console.log(e.stack);
                var error = {
                  error: "There was an error with updating this password. Please refresh your page and try this again."
                };
                return $q.reject(error);
              }
              // encrypt the xprv with the user's new passcode
              var newKeychainData = {
                encryptedXprv: SDK.encrypt($scope.newPasscode, xprv),
                xpub: newBip32.neutered().toBase58()
              };
              return KeychainsAPI.update(newKeychainData);
            })
            .then(function(newKeychain) {
              // reset all fields when the keychain is updated
              initNewPasscodeFields();
              // then ensure we reset the updated wallet (with the new private data) in the app
              return WalletsAPI.getWallet({ bitcoinAddress: $rootScope.wallets.current.data.id });
            })
            .then(function(updatedWallet) {
              // Update (replace) the current wallet in the app
              WalletsAPI.setCurrentWallet(updatedWallet, true);
            })
            .catch(handleError);
          }
        };

        /**
         * Initialize new passcode values and fields
         * @private
         */
        function initNewPasscodeFields() {
          $scope.oldPasscode = '';
          $scope.newPasscode = '';
          $scope.newPasscodeConfirm = '';
        }

        function init() {
          initNewPasscodeFields();
        }
        init();
      }],
      link: function(scope, ele, attrs) {
        /**
         * UI show the password update button
         * @returns {Bool}
         * @public
         */
        scope.showUpdateButton = function() {
          if (scope.oldPasscode && scope.newPasscode && scope.newPasscode == scope.newPasscodeConfirm) {
            return true;
          }
          return false;
        };

        /**
         * Set the local passcode strength object
         * @param passcodeStrength {Object}
         * @public
         */
        scope.checkStrength = function(passcodeStrength) {
          scope.passcodeStrength = passcodeStrength;
        };

        /**
         * UI show the strength meter
         * @public
         */
        scope.showPasscodeStrength = function() {
          return scope.newPasscode &&
                  scope.newPasscode.length &&
                  scope.passcodeStrength;
        };
      }
    };
  }
]);
