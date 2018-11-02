/**
 * @ngdoc directive
 * @name modalPasswordForm
 * @description
 * Manages the form for the login password screen in the modal
 * Requires: bg-form-error
 * @example
 *   <div modal-password-form></div>
 */
angular.module('BitGo.Modals.ModalPasswordFormDirective', [])

.directive('modalPasswordForm', ['$q', '$rootScope', 'UtilityService', 'NotifyService', 'KeychainsAPI', 'WalletsAPI', 'UserAPI', 'BG_DEV',
  function($q, $rootScope, UtilityService, NotifyService, KeychainsAPI, WalletsAPI, UserAPI, BG_DEV) {
    return {
      restrict: 'A',
      require: '^?ModalController',
      controller: ['$scope', '$timeout', function($scope, $timeout) {
        // Form error types to set custom error messages per error (if needed)
        var ERRORS = {
          decryptFail: {
            type: 'decryptFail',
            msg: 'The password provided was invalid.'
          },
          invalidPassword: {
            type: 'invalidPassword',
            msg: 'The password provided was invalid.'
          },
        };

        // If the user is accepting a wallet share, then we use a unique ui
        $scope.isAcceptingShare = null;

        // form data handler
        $scope.form = null;

        /**
         * Validate the pw only form
         * @private
         */
        function passwordOnlyFormIsValid() {
          return $scope.form.password && $scope.form.password !== '';
        }

        function onPwVerifySuccess() {
          $scope.$emit('modalPasswordForm.PasswordVerifySuccess', {
            type: 'passwordverifysuccess',
            password: $scope.form.password
          });
        }

        function setLocalError(errorType) {
          $scope.setFormError(ERRORS[errorType].msg);
        }

        /**
         * Manage showing the correct error in the process
         * @param error {Object} bitGo formatted error object
         */
        function handleErrors(error) {
          switch(error.error) {
            case ERRORS.invalidPassword.type:
              setLocalError(ERRORS.invalidPassword.type);
              break;
            case ERRORS.decryptFail.type:
              setLocalError(ERRORS.decryptFail.type);
              break;
            default:
              NotifyService.error('An error occurred. Please refresh the page and try this again.');
              break;
          }
        }

        /**
         * Decrypt a keychain private key
         * @param {String} password
         * @param {Obj} bitGo keychain object
         * @returns {Obj} decrypted private key || undefined
         */
        function decryptKeychain(password, keychain) {
          try {
            // Check if the keychain is present. If not, it is a cold wallet
            if (keychain.encryptedXprv){
              var privKey = UtilityService.Crypto.sjclDecrypt(password, keychain.encryptedXprv);
              return { key: privKey };
            }
            return true;
          } catch (e) {
            return undefined;
          }
        }

        /**
         * Decrypt a the user priv key (only for safe walletes)
         * @param {String} password
         * @param {Obj} the wallet for which to decrypt key
         * @returns {Obj} decrypted private key || undefined
         */
        function decryptUserPrivKey(password, wallet) {
          try {
            var privKey = UtilityService.Crypto.sjclDecrypt(password, wallet.data.private.userPrivKey);
            return { key: privKey };
          } catch (e) {
            return undefined;
          }
        }

        /**
         * Function to handle the decrypted piv key
         * @param {Obj} privkey
         * @returns Promise of success or rejecting the decryption
         */

        function checkDecrypted(decrypted) {
          // If we decrypt successfully, then return the right data; kill modal flow
          if (decrypted) {
            // delete the decrypted xprv immediately
            decrypted = null;
            return onPwVerifySuccess();
          }
          var errorData = { status: 500, message: ERRORS.decryptFail.type, data: {} };
          return $q.reject(new UtilityService.ErrorHelper(errorData));
        }

        /**
         * Fetch and attempt to decrypt a user keychain for a wallet
         * @private
         */
        function getUserKeychain() {
          var publicKey;
          // if the user is accepting a share, verify the password against the ECDH key
          if ($scope.isAcceptingShare) {
            publicKey = $rootScope.currentUser.settings.ecdhKeychain;
          }
          else {
            // if the wallet is a safe wallet, decrypt the user priv key to verify
            if (!$scope.locals.wallet.isSafehdWallet()) {
                var params = {
                  bitcoinAddress: $scope.locals.wallet.data.id,
                  gpk: true
                };
                return WalletsAPI.getWallet(params, false, true)
                .then(
                  function(wallet) {
                    var decrypted = decryptUserPrivKey($scope.form.password, wallet);
                    return checkDecrypted(decrypted);
                  });
            }
            // if the wallet is safehd
            publicKey = $scope.locals.wallet.data.private.keychains[0].xpub;
          }
          return KeychainsAPI.get(publicKey)
          .then(function(keychain) {
            var decrypted = decryptKeychain($scope.form.password, keychain);
            return checkDecrypted(decrypted);
          });
        }

        $scope.verifyPassword = function() {
          $scope.clearFormError();
          if (passwordOnlyFormIsValid()) {
            getUserKeychain()
            .catch(handleErrors);
          } else {
            setLocalError(ERRORS.invalidPassword.type);
          }
        };

        /**
         * Handles any specific setup we need to do in the modal based on an action
         * @private
         */
        function setModalActions() {
          if ($scope.locals.userAction === BG_DEV.MODAL_USER_ACTIONS.acceptShare) {
            $scope.isAcceptingShare = true;
          }
        }

        function init() {
          $scope.form = {
            password: '',
            passwordConfirm: ''
          };
          setModalActions();
        }
        init();
      }],
      link: function(scope, ele, attrs) {
        /**
         * UI - Set the local password strength object
         * @param passwordStrength {Object}
         * @public
         */
        scope.checkStrength = function(passwordStrength) {
          scope.passwordStrength = passwordStrength;
        };

        /**
         * UI show the strength meter
         * @public
         */
        scope.showPasswordStrength = function() {
          return scope.form.password &&
                  scope.form.password.length &&
                  scope.passwordStrength;
        };
      }
    };
  }
]);
