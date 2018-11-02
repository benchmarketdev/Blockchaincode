/**
 * @ngdoc directive
 * @name modalOtpPasswordFormDirective
 * @description
 * Manages the form for the modal with the otp and password fields. Also stores/gets the unlock time for the user
 * Requires: ModalController
 * @example
 *   <div modal-otp-password-form></div>
 */

angular.module('BitGo.Modals.ModalOtpPasswordFormDirective', [])

.directive('modalOtpPasswordForm', ['$rootScope', 'UtilityService', 'UserAPI', 'NotifyService', 'BG_DEV', 'KeychainsAPI', '$q', 'WalletsAPI', '$location', '$timeout', 'CacheService', 'SDK',
  function($rootScope, Util, UserAPI, NotifyService, BG_DEV, KeychainsAPI, $q, WalletsAPI, $location, $timeout, CacheService, SDK) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', '$timeout', function($scope, $timeout) {

        // If the user is accepting a wallet share, then we use a unique ui
        $scope.isAcceptingShare = null;
        // Error messages to be shown on the form
        $scope.otpError = false;
        $scope.passwordError = false;
        // form data handler
        $scope.form = null;
        // Cache setup
        var unlockTimeCache = CacheService.getCache('unlockTime') || new CacheService.Cache('sessionStorage', 'unlockTime', 120 * 60 * 1000);
        // variable to start and stop the $timeout function
        var timeOut;
        // unlock time contains the difference between the unlock expiration time and the current time (in seconds)
        $scope.unlockTimeRemaining = 0;
        // unlock time to be displayed on the modal (with the countdown)
        $scope.prettyUnlockTime = "2-step verification unlocked";
        // flag to indicate if a user has an otp device set
        $scope.otpDeviceSet = !!$scope.user.settings.otpDevices.length;

        /**
         * Validate the password field of the form;
         * @private
         */
        function passwordIsValid() {
          return $scope.form.password && $scope.form.password !== '';
        }

        /**
         * function to check if the otp submitted is valid
         * @private
         * @returns {boolean} indicating if otp is valid
         */
        function otpIsValid() {
          if ($scope.userUnlocked) {
            return true;
          }
          if (!$scope.otpDeviceSet) {
            return true;
          }
          return Util.Validators.otpOk($scope.form.otp);
        }

        function onPwVerifySuccess() {
          $scope.$emit('modalOtpThenUnlockManager.OtpAndUnlockSuccess', $scope.form);
        }

        /**
         * Sets the otp error on the form
         * @private
         * @params {object} error. We could have a custom error if needed
         */
        function onOtpSubmitError(error) {
          $scope.otpError = true;
        }

        /**
         * Converts seconds into a UI displayable format (m:ss)
         * @private
         * @params {number} The seconds needed to be displayed
         * @returns {String} Prettified time to be displayed
         */
        function getPrettyTime(seconds) {
          if (!seconds) {
            console.log("Could not get seconds to convert in modal");
            return;
          }
          var minutes = Math.floor(seconds/60);
          seconds = seconds - (minutes*60);
          return minutes + ':' + ("0" + seconds).slice(-2);
        }

        /**
         * Function for counting down the unlock time. Sets the display variable on the scope for the UI
         */
        function onTimeout() {
          $scope.unlockTimeRemaining--;
          $scope.prettyUnlockTime = "2-step verification unlocked for " + getPrettyTime($scope.unlockTimeRemaining);
          if ($scope.unlockTimeRemaining === 0) {
            $scope.prettyUnlockTime = "2-step verification unlocked";
            $timeout.cancel(timeOut);
            $scope.userUnlocked = false;
            return;
          }
          timeOut = $timeout(onTimeout,1000);
        }

        /**
         * Starts the countdown
         */
        function startTimeout() {
          if ($scope.userUnlocked && $scope.otpDeviceSet) {
            if (unlockTimeCache.get('time')) {
              var endUnlockTime = new Date(unlockTimeCache.get('time'));
              var currentTime = new Date();
              $scope.unlockTimeRemaining = Math.floor((endUnlockTime.getTime() - currentTime.getTime())/1000);
            } else {
              throw new Error('Could not read unlock time from cache');
            }
            timeOut = $timeout(onTimeout,1000);
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
              var privKey = SDK.decrypt(password, keychain.encryptedXprv);
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
            var privKey = SDK.decrypt(password, wallet.data.private.userPrivKey);
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
          return $q.reject();
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
          } else {
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

        /**
         * Clears the form errors on the otp-password form
         * @private
         */
        function clearErrors() {
          $scope.otpError = false;
          $scope.passwordError = false;
        }

        /**
         * Function which redirects the user to wallet recovery and closes modal
         */
        $scope.forgotPassword = function () {
          $scope.closeWithError('cancel');
          if ($scope.isAcceptingShare) {
            $location.path('/forgotpassword');
          } else {
            $location.path('/enterprise/' + $rootScope.enterprises.current.id +
                '/wallets/' + $rootScope.wallets.current.data.id + '/recover');
          }
        };

        /**
         * Function which verifies submitted password. Shows error if not valid or there's a decryption error
         */
        function verifyPassword() {
          if (passwordIsValid()) {
            getUserKeychain()
            .catch(function() {
              $scope.passwordError = true;
            });
          } else {
            $scope.passwordError = true;
          }
        }

        /**
         * Function for submitting the form. Unlocks the user if needed and calls verifyPassword function
         */
        $scope.submitVerification = function() {
          clearErrors();
          if (otpIsValid()  || $scope.userUnlocked) {
            var params = {
              otp: $scope.form.otp
            };

            // If creating an access token, do not try to do an unlock - we are using the otp directly
            if ($scope.locals.userAction === BG_DEV.MODAL_USER_ACTIONS.createAccessToken || $scope.userUnlocked) {
              return verifyPassword();
            }

            UserAPI.unlock(params)
            .then(function(data) {
              $scope.userUnlocked = true;
              unlockTimeCache.add('time', data.session.unlock.expires);
              startTimeout();
              verifyPassword();
            })
            .catch(onOtpSubmitError);
          } else {
            $scope.otpError = true;
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

        function onResendSuccess() {
          NotifyService.success('Your code was successfully resent.');
        }

        function onResendFail() {
          NotifyService.error('There was an issue sending the code.');
        }

        /**
         * Function which sends an sms message to the user for otp verification
         */
        $scope.resendOTP = function() {
          var params = {
            forceSMS: true
          };
          UserAPI.sendOTP(params)
          .then(onResendSuccess)
          .catch(onResendFail);
        };

        function init() {
          $scope.form = {
            otp: '',
            password: ''
          };
          setModalActions();
          startTimeout();
        }

        init();
      }]
    };
  }
]);
