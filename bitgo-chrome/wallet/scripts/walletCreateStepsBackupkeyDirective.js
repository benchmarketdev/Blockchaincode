/**
 * Directive to manage the wallet create backup step and all of its possible choices
 * This
 */
angular.module('BitGo.Wallet.WalletCreateStepsBackupkeyDirective', [])

.directive('walletCreateStepsBackupkey', ['$rootScope', '$timeout', 'BG_DEV', 'UtilityService', 'KeychainsAPI', 'NotifyService', 'AnalyticsProxy', 'SDK', 'featureFlags',
  function($rootScope, $timeout, BG_DEV, Utils, KeychainsAPI, NotifyService, AnalyticsProxy, SDK, featureFlags) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // possible backupkey creation options
        var VALID_BACKUPKEY_OPTIONS = {
          inBrowser: {
            inBrowser: true,
            enabled: true
          },
          userProvided: {
            userProvided: true,
            enabled: true
          },
          krsProvided: {
            krsProvided: true,
            enabled: true
          },
          coldKeyApp: {
            coldKeyApp: true,
            enabled: true
          }
        };
        // the currently selected backup key creation option
        $scope.option = null;

        // Checks if everything is valid before advancing the flow
        function isValidStep() {
          var isValid;
          switch ($scope.option) {
            case 'inBrowser':
              isValid = true;
              break;
            case 'userProvided':
              isValid = $scope.userXpubValid();
              break;
            case 'coldKeyApp':
              isValid = $scope.userXpubValid();
              break;
            case 'krsProvided':
              isValid = true;
              break;
          }
          return isValid;
        }

        // If the user goes back to selecting the in-browser option,
        // clear the user-provided key info and the generated key info
        function clearBackupKeyInputs() {
          // Clear user key info
          $scope.inputs.useOwnBackupKey = false;
          $scope.inputs.backupPubKey = null;
          // Clear generated keychain info
          $scope.generated.backupKeychain = null;
          $scope.generated.backupKey = null;
          // Clear selected backup key provider
          $scope.inputs.backupKeyProvider = null;
        }

        // Attempts to generate a backup key from a user's provided xpub
        function generateBackupKeyFromXpub() {
          try {
            $scope.generated.backupKeychain = SDK.bitcoin.HDNode.fromBase58($scope.inputs.backupPubKey);
          } catch(error) {
            return false;
          }
          return true;
        }

        // Determine if the user provided xpub is valid to in constructing
        // their wallet's backup keychain
        $scope.userXpubValid = function() {
          if (!$scope.inputs.backupPubKey || $scope.inputs.backupPubKey.length === 0) {
            return false;
          }
          return generateBackupKeyFromXpub();
        };

        // Disable backup key creation options on this scope
        function disableOptions(optsToDisable) {
          if (!optsToDisable) {
            throw new Error('Expect array of key creation options to disable');
          }
          _.forEach(optsToDisable, function(option) {
            if (_.has(VALID_BACKUPKEY_OPTIONS, option)) {
              VALID_BACKUPKEY_OPTIONS[option].enabled = false;
            }
          });
        }

        // set a backup key creation option
        $scope.setBackupkeyOption = function(option) {
          if (!option || !_.has(VALID_BACKUPKEY_OPTIONS, option)) {
            throw new Error('Expect a valid option when choosing a backup key option');
          }
          $scope.option = option;

          // Track the creation option selected
          var metricsData = {
            option: option,
            invitation: !!$rootScope.invitation
          };
          AnalyticsProxy.track('SelectBackupKeyOption', metricsData);

          // prevent timeout from endless api calling
          $scope.waitingForColdKey = false;
          // If the user chooses another backup key creation option,
          // clear the form data from the other (unselected) options
          clearBackupKeyInputs();
          // scroll to bottom
          $('html body').animate({
            scrollTop: $(document).height()
          });
          if (option === 'krsProvided') {
            $scope.inputs.backupKeyProvider = $scope.backupKeyProviders[0].id;
          } else if (option === 'coldKeyApp') {
            // set up the variables for the passcodeStep
            $scope.inputs.backupKeySource = null;

            // set up qr code for coldkey app
            var coldKeySecret = 'ckid' + SDK.generateRandomPassword();
            var coldKeyQRCode = {
              v: 1, // version
              e: SDK.get().env || 'dev', // environment
              s: coldKeySecret
            };
            $scope.inputs.coldKeySecret = coldKeySecret;
            $scope.inputs.coldKeyQRCode = JSON.stringify(coldKeyQRCode);

            // We start polling in the background to check for a cold key
            $scope.waitingForColdKey = true;

            var currentStep = $scope.currentStep;
            var scheduleColdKeyCheck = function () {
              var kPollInterval = 2 * 1000;

              if (!$scope.waitingForColdKey) {
                return; // done!
              }
              $timeout(function () {
                KeychainsAPI.getColdKey($scope.inputs.coldKeySecret)
                  .then(function (response) {
                    if (response.xpub) {
                      $scope.waitingForColdKey = false;
                      $scope.inputs.coldKey = $scope.inputs.backupPubKey = response.xpub;
                      if ($scope.userXpubValid()) {
                        $('html body').animate({
                          scrollTop: $(document).height()
                        });
                      }
                    }
                  })
                  .catch(function (error) {
                    if (error.status === 404) {
                      scheduleColdKeyCheck();
                    } else {
                      NotifyService.errorHandler(error);
                    }
                  });
              }, kPollInterval);
            };
            scheduleColdKeyCheck();
          }
        };

        // Tells if the specific option is disabled based on the backup
        // key creation path selected
        $scope.optionIsDisabled = function(option) {
          if (_.has(VALID_BACKUPKEY_OPTIONS, option)) {
            return !VALID_BACKUPKEY_OPTIONS[option].enabled;
          }
          return false;
        };

        // UI - show/hide the backup key creation option
        $scope.showOption = function(option) {
          return $scope.option === option;
        };

        // advance the wallet creation flow
        // Note: this is called from the
        $scope.advanceBackupkey = function() {
          var metricsData;

          if (isValidStep()) {
            // track advancement from the backup key selection step
            metricsData = {
              option: $scope.option
            };
            AnalyticsProxy.track('SetBackupKey', metricsData);
            $scope.setState('passcode');
          } else {
            // track the failed advancement
            metricsData = {
              // Error Specific Data
              status: 'client',
              message: 'Invalid Backup Key xpub',
              action: 'SetBackupKey'
            };
            AnalyticsProxy.track('Error', metricsData);
          }
        };

        // Event handlers
        var killXpubWatcher = $scope.$watch('inputs.backupPubKey', function(xpub) {

          if (xpub && $scope.userXpubValid()) {
            // track the successful addition of a backup xpub
            AnalyticsProxy.track('ValidBackupXpubEntered');
            // enable only the selected option
            disableOptions(_.keys(VALID_BACKUPKEY_OPTIONS));
            _.find(VALID_BACKUPKEY_OPTIONS, $scope.option).enabled = true;
            $scope.inputs.useOwnBackupKey = true;
          }
        });
        // Clean up the listeners on the scope
        $scope.$on('$destroy', function() {
          killXpubWatcher();
        });

        // Initialize the controller
        function init() {
          if (featureFlags.isOn('krs')) {
            $scope.backupKeyProviders = BG_DEV.BACKUP_KEYS.krsProviders;
            $scope.inputs = $scope.inputs || {};
            var backupKeyProvidersById = _.indexBy($scope.backupKeyProviders, 'id');
            $scope.inputs.backupKeyProviderDisplayName = function () {
              return backupKeyProvidersById[$scope.inputs.backupKeyProvider].displayName;
            };
            $scope.inputs.backupKeyProviderUrl = function () {
              return backupKeyProvidersById[$scope.inputs.backupKeyProvider].url;
            };
            $scope.inputs.backupKeyProvider = $scope.backupKeyProviders[0].id;
            $scope.option = 'krsProvided';
          } else {
            $scope.option = 'inBrowser';
          }
        }
        init();
      }]
    };
  }
]);
