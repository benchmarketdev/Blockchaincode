/**
 * Directive to manage the wallet create passcode step
 * - Parent Controller is WalletCreateController
 * - Determines if the passcode the user enters is their correct account passcode
 * - Creates the 3 keychains needed for the wallet about to be made
 * - Manages the wallet create progress bar going from 0 to 5.
 */
angular.module('BitGo.Wallet.WalletCreateStepsPasscodeDirective', [])

.directive('walletCreateStepsPasscode', ['$q', '$rootScope', 'NotifyService', 'KeychainsAPI', 'UserAPI', '$timeout', 'BG_DEV', 'AnalyticsProxy', 'AnalyticsUtilities', 'SDK',
  function($q, $rootScope, Notify, KeychainsAPI, UserAPI, $timeout, BG_DEV, AnalyticsProxy, AnalyticsUtilities, SDK) {
    // valid password type options
    var VALID_PW_OPTIONS = { newWalletPw: true, loginPw: true };

    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // Flag to show the wallet creation template when doing the
        // wallet creation work
        $scope.creatingWallet = null;
        // the currently selected wallet password option
        $scope.option = null;
        // Used to check the strength of a new user-entered password
        $scope.passcodeStrength = null;
        // Bool to show the pw strength meter
        $scope.showPasscodeStrength = null;

        /**
         * Track client-only signup failure events
         * @param error {String}
         *
         * @private
         */
        function trackClientSignupFail(error) {
          if (typeof(error) !== 'string') {
            throw new Error('invalid error');
          }
          var metricsData = {
            // Error Specific Data
            status: 'client',
            message: error,
            action: 'SetWalletPasscode'
          };
          AnalyticsProxy.track('Error', metricsData);
        }

        /**
         * Ensure a user-entered password form is valid
         * @private
         */
        function newWalletPasswordFormIsValid() {
          if (!$scope.inputs.passcode) {
            trackClientSignupFail('Custom Passcode Missing');
            $scope.setFormError('Please enter a strong password.');
            return false;
          }
          if (!$scope.passcodeStrength) {
            trackClientSignupFail('No Passcode Strength Module');
            $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
            return false;
          }
          if ($scope.passcodeStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
            trackClientSignupFail('Custom Passcode Weak');
            $scope.setFormError('Please enter a stronger password.');
            return false;
          }
          if ($scope.inputs.passcode != $scope.inputs.passcodeConfirm) {
            trackClientSignupFail('Custom Passcodes Do Not Match');
            $scope.setFormError('Please enter matching passwords.');
            return false;
          }
          return true;
        }

        /**
         * Verify if the login passcode the user entered is valid
         * @private
         */
        function loginPasswordFormCheck() {
          return UserAPI.verifyPassword({ password: $scope.inputs.passcode || '' });
        }

        /**
         * Function to encrypt the wallet's passcode with a secure code
         * @private
         */
        function generatePasscodeEncryptionCode() {
          // Update the UI progress bar
          $scope.updateProgress(1);

          try {
            $scope.generated.passcodeEncryptionCode = SDK.generateRandomPassword();
          } catch (e) {
            return $q.reject({ error: 'BitGo needs to gather more entropy for encryption. Please refresh your page and try this again.'});
          }
          $scope.generated.encryptedWalletPasscode = SDK.encrypt($scope.generated.passcodeEncryptionCode, $scope.inputs.passcode);
          // Let the user see the heavy lifting that we're doing while creating the wallet.
          return $q.when(function() {
            $timeout(function() {
              return $scope.generated.encryptedWalletPasscode;
            }, 500);
          });
        }

        /**
         * Creates the user keychain for the wallet being created
         * @private
         */
        function createUserKeychain() {
          // Update the UI progress bar
          $scope.updateProgress(2);
          var params = {
            source: 'user',
            saveEncryptedXprv: true,
            passcode: $scope.inputs.passcode,
            originalPasscodeEncryptionCode: $scope.generated.passcodeEncryptionCode
          };
          // Return a promise
          return KeychainsAPI.createKeychain(params)
          .then(function(keychain) {
            // advance the UI with CSS
            $scope.generated.walletKeychain = keychain;
            // Let the user see the heavy lifting that we're doing while creating the wallet.
            $timeout(function() {
              return true;
            }, 500);
          });
        }

        /**
         * Creates the user's backup keychain for the wallet being created
         * @private
         */
        function createBackupKeychain(callback) {
          // Update the UI progress bar
          $scope.updateProgress(3);

          // always return a promise
          var callCreateBackupAPIs = function() {
            // simply call the create backup route if a krs was selected
            if ($scope.inputs.backupKeyProvider) {
              return KeychainsAPI.createBackupKeychain($scope.inputs.backupKeyProvider);
            }

            var params = {
              source: 'user',
              passcode: $scope.inputs.passcode
            };
            // check if the user provided their own backup key
            if ($scope.generated.backupKeychain) {
              params.source = 'cold';
              params.hdNode = $scope.generated.backupKeychain;
            }
            // Return a promise
            return KeychainsAPI.createKeychain(params);
          };

          return callCreateBackupAPIs()
          .then(function(keychain) {
            // advance the UI with CSS
            $scope.generated.walletBackupKeychain = keychain;
            // Let the user see the heavy lifting that we're doing while creating the wallet.
            $timeout(function() {
              return true;
            }, 500);
          });
        }

        /**
         * Creates the bitgo keychain for the wallet being created
         * @private
         */
        function createBitGoKeychain(callback) {
          // Update the UI progress bar
          $scope.updateProgress(4);

          return KeychainsAPI.createBitGoKeychain()
          .then(function(keychain) {
            // advance the UI with CSS
            $scope.generated.bitgoKeychain = keychain;
            // Let the user see the heavy lifting that we're doing while creating the wallet.
            $timeout(function() {
              return true;
            }, 500);
          });
        }

        /**
         * Wipe any passcode data on the scope
         * @private
         */
        function resetPasscodeInputs() {
          $scope.inputs.passcode = null;
          $scope.inputs.passcodeConfirm = null;
        }

        /**
         * Kicks off the keychain creation for the new wallet
         * @private
         */
        function advancePasscodeStep() {
          var metricsData;

          // initialize the UI for wallet creation progress
          $scope.creatingWallet = true;

          generatePasscodeEncryptionCode()
          .then(createUserKeychain)
          .then(createBackupKeychain)
          .then(createBitGoKeychain)
          .then(function() {

            // track the successful keychain creations/advancement
            metricsData = {
              option: $scope.option,
              invitation: !!$rootScope.invitation
            };
            AnalyticsProxy.track('SetWalletPasscode', metricsData);

            // Let the user see the heavy lifting that we're doing while creating the wallet.
            $timeout(function() {
              $scope.updateProgress(5);
              $scope.creatingWallet = false;
              $scope.setState('activate');
            }, 500);
          })
          .catch(function(error) {
            $scope.updateProgress();
            $scope.creatingWallet = false;
            resetPasscodeInputs();
            // Alert the user in the UI
            Notify.error(error.error);

            // track the failed advancement
            metricsData = {
              // Error Specific Data
              status: error.status,
              message: error.error,
              action: 'SetWalletPasscode'
            };
            AnalyticsProxy.track('Error', metricsData);
          });
        }

        /**
         * Ensures a wallet-specific passcode is valid before making keychains
         * @public
         */
        $scope.advanceWithNewWalletPasscode = function() {
          // clear any errors
          $scope.clearFormError();
          if (newWalletPasswordFormIsValid()) {
            advancePasscodeStep();
          }
        };

        /**
         * Ensures a the login passcode is valid before making keychains
         * @public
         */
        $scope.advanceWithLoginPasscode = function() {
          // clear any errors
          $scope.clearFormError();
          loginPasswordFormCheck()
          .then(advancePasscodeStep)
          .catch(function() {
            $scope.setFormError('Invalid login password.');

            // track the failed advancement with the account passcode
            var metricsData = {
              // Error Specific Data
              status: 'client',
              message: 'Account Passcode Invalid',
              action: 'SetWalletPasscode'
            };
            AnalyticsProxy.track('Error', metricsData);
          });
        };

        /**
         * Watch option changes and modify scope data as needed
         * @private
         */
        var killOptionWatcher = $scope.$watch('option', function(option) {
          if (option) {
            resetPasscodeInputs();
          }
        });

        /**
         * Clean up the watchers when the directive is garbage collected
         * @private
         */
        $scope.$on('$destroy', function() {
          killOptionWatcher();
        });

        // Initialize the controller
        function init() {
          $scope.creatingWallet = false;

          // use the login password by default
          $scope.option = 'loginPw';
        }
        init();
      }],
      // We use the link function specifically to work with DOM elements
      // Angular cleans these up differently than controllers and memory
      // leaks are less likely this way
      link: function(scope, ele, attrs) {
        // Instance used to track how long it takes a user to enter a valid pw
        var analyticsPasswordMonitor;

        /**
         * Updates the UI progress bar as the keychains are created
         * @public
         */
        scope.updateProgress = function(step) {
          // Remove the class `processing-indicator--*` regardless
          $('.processing-indicator').removeClass(function (index, css) {
            return (css.match (/(^|\s)processing-indicator--\S+/g) || []).join(' ');
          });
          // If a valid step is passed in, let's augment the indicator class
          if (step) {
            var regex = new RegExp(/[1-5]/);
            if (regex.test(step)) {
              angular.element('.processing-indicator').addClass('processing-indicator--' + step);
            }
          }
        };

        /**
         * Set the password type to use when encrypting the wallet
         * @param option {String}
         * @public
         */
        scope.setPasswordOption = function(option) {
          // always clean out form errors when switching options
          scope.clearFormError();

          if (!option || !_.has(VALID_PW_OPTIONS, option)) {
            throw new Error('Expect a valid option when choosing a password method');
          }
          scope.option = option;

          // Track the password option selected
          var metricsData = {
            option: option,
            invitation: !!$rootScope.invitation
          };
          AnalyticsProxy.track('SelectWalletPasscodeOption', metricsData);
        };

        /**
         * UI - show/hide the correct password option
         * @param option {Object} option to use/show
         * @public
         */
        scope.showOption = function(option) {
          return scope.option === option;
        };

        /**
         * Set the local password strength object
         * @param passcodeStrength {Object}
         * @public
         */
        scope.checkStrength = function(passcodeStrength) {
          scope.passcodeStrength = passcodeStrength;

          // Track the time it takes the user to enter their first valid password
          analyticsPasswordMonitor.track('CreateCustomWalletPasscode', passcodeStrength);
        };

        /**
         * UI show the strength meter
         * @public
         */
        scope.showPasscodeStrength = function() {
          return scope.inputs.passcode &&
                  scope.inputs.passcode.length &&
                  scope.passcodeStrength;
        };

        function initLink() {
          // init an instance of the password time-to-complete tracker
          analyticsPasswordMonitor = new AnalyticsUtilities.time.PasswordCompletionMonitor();
        }
        initLink();
      }
    };
  }
]);
