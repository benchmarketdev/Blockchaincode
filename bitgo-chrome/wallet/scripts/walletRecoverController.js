/**
 * @ngdoc controller
 * @name WalletRecoverController
 * @description
 * Handles all functionality associated with recovering a single wallet
 *
 * This is a 2 step process:
 * 1) Attempt Decryption of the wallet's user key using a number of methods
 * 2) Re encrypt the xprv decrypted in step 1 and update the wallet
 */
angular.module('BitGo.Wallet.WalletRecoverController', [])

.controller('WalletRecoverController', ['$modal', '$rootScope', '$scope', 'UtilityService', 'SDK', 'BG_DEV', 'NotifyService', 'WalletsAPI', 'KeychainsAPI', 'WalletSharesAPI',
  function($modal, $rootScope, $scope, UtilityService, SDK, BG_DEV, NotifyService, WalletsAPI, KeychainsAPI, WalletSharesAPI) {
    // valid password type options
    var RECOVERY_OPTIONS = { keycard: 'keycard', requestInvite: 'requestInvite' };

    // view states of the recovery process
    $scope.viewStates = ['initial', 'recovery', 'newpasscode', 'requestedReshare', 'done'];
    // the recovery option being used for the wallet
    $scope.option = null;
    // the wallet-specific info we need for wallet recovery (box D)
    // Note: we only have this information set on the user if they were
    // the wallet's creator. If the user had the wallet shared with them
    // then this data will not be set, and they will not have box D
    $scope.walletRecoveryInfo = null;
    // The user-input values used during the recovery process
    $scope.userInputRecoveryData = null;
    // The new user-input password to re-encrypt the wallet being recovered
    $scope.newPasscode = null;
    $scope.newPasscodeConfirm = null;
    // object containing the strength of the user's new wallet passcode
    $scope.passcodeStrength = null;

    /**
    * Modal - Open a modal specifically for otp
    * @private
    */
    function openModal(size) {
      var modalInstance = $modal.open({
        templateUrl: 'modal/templates/modalcontainer.html',
        controller: 'ModalController',
        scope: $scope,
        size: size,
        resolve: {
          // The return value is passed to ModalController as 'locals'
          locals: function () {
            return {
              type: BG_DEV.MODAL_TYPES.otp,
              userAction: BG_DEV.MODAL_USER_ACTIONS.otp
            };
          }
        }
      });
      return modalInstance.result;
    }

    /**
     * UI - Show the invite box recovery option
     * @public
     */
    $scope.showInviteRecoveryOption = function() {
      // check if current wallet is set. This takes sometime when the user directly navigates through the URL.
      if ($rootScope.wallets.current) {
        var userIsAdmin = $rootScope.wallets.current.role === BG_DEV.WALLET.ROLES.ADMIN;
        var walletHasMultipleAdmins = $rootScope.wallets.current.multipleAdmins;
        if (!userIsAdmin || (userIsAdmin && walletHasMultipleAdmins)) {
          return true;
        }
      }
      return false;
    };

    /**
     * UI - Set the recovery type to use
     * @param option {String}
     * @public
     */
    $scope.setRecoveryOption = function(option) {
      if (!option || !_.has(RECOVERY_OPTIONS, option)) {
        throw new Error('invalid recovery option');
      }
      $scope.option = option;
    };

    /**
     * UI - show/hide the correct recovery option
     * @param option {Object} option to use/show
     * @public
     */
    $scope.showOption = function(option) {
      if (!option || !_.has(RECOVERY_OPTIONS, option)) {
        throw new Error('invalid recovery option');
      }
      return $scope.option === option;
    };

    /**
     * UI show the password update button
     * @returns {Bool}
     * @public
     */
    $scope.showUpdateButton = function() {
      if ($scope.newPasscode && $scope.newPasscode == $scope.newPasscodeConfirm) {
        return true;
      }
      return false;
    };

    /**
     * UI - Set the local passcode strength object
     * @param passcodeStrength {Object}
     * @public
     */
    $scope.checkStrength = function(passcodeStrength) {
      $scope.passcodeStrength = passcodeStrength;
    };

    /**
     * UI show the strength meter
     * @public
     */
    $scope.showPasscodeStrength = function() {
      return $scope.newPasscode &&
              $scope.newPasscode.length &&
              $scope.passcodeStrength;
    };

    /**
     * Step 1: Xprv / Invite - Attempt to decrypt an encrypted xPrv with a passcode
     * @param encryptedXprv {String} wallet's user encryptedXprv
     * @param passcode {String} existing (old) wallet passcode
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
     * Step 1: Xprv / Invite - Check validity of the xprv provided
     * @private
     */
    function userXprvFormValid() {
      if (!$scope.userInputRecoveryData.userXprv.toString()) {
        $scope.setFormError('Please enter a valid private key.');
        return false;
      }
      return true;
    }

    /**
     * Step 1: Xprv / Invite - Attempt verifying user-entered xprv
     * @public
     */
    $scope.recoverWithUserXprv = function() {
      $scope.clearFormError();
      if (userXprvFormValid()) {
        // init a new bip32 object baced on the xprv provided
        var testBip32;
        try {
          testBip32 = SDK.bitcoin.HDNode.fromBase58($scope.userInputRecoveryData.userXprv);
        } catch (e) {
          $scope.setFormError('Please enter a valid BIP32 master private key (xprv).');
          return;
        }
        var privateInfo = $rootScope.wallets.current.data.private;
        var userXpub = privateInfo.keychains[0].xpub;
        var testXpub = testBip32.neutered().toBase58();
        if (userXpub !== testXpub) {
          $scope.setFormError('Please enter a valid BIP32 master private key (xprv) for this wallet.');
          return;
        }
        // If the provided xprv's xpub matches the user xpub for the wallet
        // then advance to the re-encryption step
        $scope.userInputRecoveryData.decryptedXprv = $scope.userInputRecoveryData.userXprv;
        $scope.setState('newpasscode');
      }
    };

    /**
     * Step 1: Xprv / Invite - Check validity of the wallet keycard form
     * @private
     */
    function keycardBoxDFormValid() {
      if (!$scope.userInputRecoveryData.keycardBoxD.toString()) {
        $scope.setFormError('Please enter valid JSON.');
        return false;
      }
      return true;
    }

    /**
     * Step 1: Xprv / Invite - Attempt decryption using box D
     * @public
     */
    $scope.recoverWithKeycardBoxD = function() {
      $scope.clearFormError();
      if (keycardBoxDFormValid()) {
        var xprv = decryptKeychain($scope.userInputRecoveryData.decryptedKeycardBoxD, $scope.walletRecoveryInfo.encryptedXprv);
        if (!xprv) {
          $scope.setFormError('Unable to decrypt with the JSON provided');
          return;
        }
        $scope.userInputRecoveryData.decryptedXprv = xprv;
        $scope.setState('newpasscode');
      }
    };

    $scope.recoverWithReshare = function() {
      $scope.clearFormError();
      WalletSharesAPI.requestReshare($rootScope.wallets.current.data.id, {})
      .then(function() {
        $scope.setState('requestedReshare');
      })
      .catch(NotifyService.errorHandler);
    };

    /**
     * Step 2: Encrypt - Validate the pw form before updating
     * @private
     */
    function newPasscodeFormIsValid() {
      if (!$scope.passcodeStrength) {
        $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
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
    * Handler - Handle the error cases that return from the keychain update call
    * @param error {Object} error object returned from the call
    * @private
    */
    function handleKeychainUpdateError(error) {
      if (UtilityService.API.isOtpError(error)) {
        // If the user needs to OTP, use the modal to unlock their account
        openModal()
        .then(function(result) {
          if (result.type === 'otpsuccess') {
            $scope.finishRecovery();
          }
        });
      } else {
        NotifyService.error('There was an error with updating this keychain. Please refresh your page and try this again.');
      }
    }

    /**
     * Step 2: Encrypt - re-encrypt the wallet's user keychain with a new passcode
     * @public
     */
    $scope.finishRecovery = function() {
      $scope.clearFormError();
      if (newPasscodeFormIsValid()) {
        // Get the xpub for the xprv provided. It might not match with xpub on the wallet for legacy wallets
        var newBip32;
        try {
          newBip32 = SDK.bitcoin.HDNode.fromBase58($scope.userInputRecoveryData.decryptedXprv);
        } catch (e) {
          console.log(e.stack);
          NotifyService.error('There was an error with updating this keychain. Please refresh your page and try this again.');
          return;
        }
        // encrypt the xprv with the user's new passcode
        var newKeychainData = {
          encryptedXprv: SDK.encrypt($scope.newPasscode, $scope.userInputRecoveryData.decryptedXprv),
          xpub: newBip32.neutered().toBase58()
        };
        KeychainsAPI.update(newKeychainData)
        .then(function(newKeychain) {
          // Then ensure we reset the updated wallet (with the new private data) in the app
          return WalletsAPI.getWallet({ bitcoinAddress: $rootScope.wallets.current.data.id });
        })
        .then(function(updatedWallet) {
          // Finally, update the current wallet in the app and finish the process
          WalletsAPI.setCurrentWallet(updatedWallet, true);
          $scope.setState('done');
        })
        .catch(handleKeychainUpdateError);
      }
    };

    /**
    * Init - initializes the default recovery option for the user based on available data
    * @private
    */
    function initInitialRecoveryOption() {
      $scope.option = RECOVERY_OPTIONS.keycard;

      // If multiple admins on the wallet, best option is to request re-invite
      if ($scope.showInviteRecoveryOption()) {
        $scope.option = RECOVERY_OPTIONS.requestInvite;
      }
    }

    /**
    * Handler - Handle the error cases that return from the data initialization call
    * @param error {Object} error object returned from the call
    * @private
    */
    function handleInitRecoveryInfoError(error) {
      if (UtilityService.API.isOtpError(error)) {
        // If the user needs to OTP, use the modal to unlock their account
        openModal()
        .then(function(result) {
          if (result.type === 'otpsuccess') {
            $scope.initRecoveryInfo();
          }
        });
      } else {
        // We hit this case if the user is on a shared wallet and doesn't have
        // any of the necessary recovery info associated with their keychain on the wallet
        // Specifically, $scope.walletRecoveryInfo is undefined in this state
        $scope.setState('recovery');
      }
    }

    /**
    * Init - Fetch the passcode encryption code for box D of the current wallet
    * @public
    */
    $scope.initRecoveryInfo = function() {
      var params = {
        walletAddress: $rootScope.wallets.current.data.id
      };
      WalletsAPI.getWalletPasscodeRecoveryInfo(params)
      .then(function(data) {
        // If we have this data, it means that this was the wallet's creator
        // and they can use Box D to attempt wallet recovery
        $scope.walletRecoveryInfo = data.recoveryInfo;

        // Also, if we're in the initial step, advance the state to the actual recovery screen
        if ($scope.state === 'initial') {
          $scope.setState('recovery');
        }
      })
      .catch(handleInitRecoveryInfoError)
      .finally(function() {
        initInitialRecoveryOption();
      });
    };

    /**
    * Watcher - watch recovery option changes to modify the scope as needed
    * @private
    */
    var killOptionWatch = $scope.$watch('option', function() {
      // clear errors (if possible) when the user switches recovery options
      if ($scope.clearFormError) {
        $scope.clearFormError();
      }
    });

    /**
    * Watcher - kill watchers when the scope is GC'd
    * @private
    */
    $scope.$on('$destroy', function() {
      killOptionWatch();
    });

    function init() {
      // set the first view state to initial
      $scope.state = 'initial';

      // init all the fields needed during the process
      $scope.userInputRecoveryData = {
        decryptedKeycardBoxD: '',
        decryptedXprv: '',
        keycardBoxD: '',
        userXprv: '',
      };
    }
    init();
  }
]);
