/*
  Notes:
  - This controls the view for the enterprise wallet list page
*/
angular.module('BitGo.Enterprise.EnterpriseWalletsController', [])

.controller('EnterpriseWalletsController', ['$q', '$scope', '$modal', '$rootScope', 'CacheService', '$location', '$filter', 'WalletsAPI', 'WalletSharesAPI', 'UtilityService', 'NotifyService', 'KeychainsAPI', 'EnterpriseAPI', 'BG_DEV', 'SyncService', 'RequiredActionService', 'AnalyticsProxy', 'InternalStateService', 'SDK',
  function($q, $scope, $modal, $rootScope, CacheService, $location, $filter, WalletsAPI, WalletSharesAPI, UtilityService, Notify, KeychainsAPI, EnterpriseAPI, BG_DEV, SyncService, RequiredActionService, AnalyticsProxy, InternalStateService, SDK) {
    // start cache service for create wallet modal
    var enterpriseCache = new CacheService.Cache('sessionStorage', 'Enterprise', 60 * 60 * 1000);
    // show the ui if user has access to any wallets
    $scope.noWalletsAcrossEnterprisesExist = null;
    // show the ui if filtered wallets exist
    $scope.filteredWalletsExist = null;
    // show the ui for no wallets existing
    $scope.noWalletsExist = null;
    // Helps in UI when share is in process
    $scope.processShare = false;
    // show the ui if filtered walletshares exist
    $scope.filteredWalletSharesExist = null;
    // show the ui for no wallet shares existing
    $scope.noWalletSharesExist = null;

    // keeps track of whether we received WalletsAPI.CurrentWalletsSet
    var receivedUserWalletsSetEvent = false;

    $scope.setTwoStepVerification = function() {
      InternalStateService.goTo('personal_settings:security');
    };

    /* istanbul ignore next */
    $scope.goToCreateOrg = function() {
      AnalyticsProxy.track('clickUpsell', { type: 'dashboardWidget', invitation: !!$rootScope.invitation });
      $location.path('/create-organization');
    };

    /* istanbul ignore next */
    $scope.redirectReferralLink = function() {
      AnalyticsProxy.track('clickReferral', { type: 'dashboardWidget', invitation: !!$rootScope.invitation });
    };

    function isBitfinexReferent(){
      var referrer = $rootScope.currentUser.settings.referrer;
      if (referrer && referrer.source && referrer.source.toLowerCase().indexOf(BG_DEV.REFERRER.BITFINEX.toLowerCase()) > -1) {
        return true;
      }
      return false;
    }

    /* istanbul ignore next */
    $scope.showReferralWidget = function() {
      // Check for bitfinex enterpise
      var isWalletListEmpty = _.isEmpty($rootScope.wallets.all);
      var isBitfinexEnterprise = $rootScope.enterprises.current && ($rootScope.enterprises.current.id === BG_DEV.ENTERPRISE.BITFINEX_ID);
      /*
      Only show the dialog if a) the user has a wallet which b) is not associated with a Bitfinex enterprise and c) the
      user didn't come to us from or due to a referral by Bitfinex
       */
      return !isWalletListEmpty && !isBitfinexEnterprise && !isBitfinexReferent();
    };

    /* istanbul ignore next */
    $scope.showCreateOrgWidget = function() {
      return ($rootScope.currentUser.isBasic() || $rootScope.currentUser.isGrandfathered()) &&
              !$rootScope.currentUser.isEnterpriseCustomer();
    };

    /* istanbul ignore next */
    $scope.otpDeviceNotSet = function() {
      return _.isEmpty($rootScope.currentUser.settings.otpDevices);
    };

    function showFundModal() {
      // Check for bitfinex enterpise
      // TODO: Barath - remove this and do a cleaner fix along with oauth/signup referral      
      if (!_.isEmpty($rootScope.wallets.all) && !isBitfinexReferent()) {
        return $rootScope.enterprises.current &&
               $rootScope.enterprises.current.balance === 0 && $rootScope.enterprises.current.isPersonal;
      }
    }

    /**
     * show the wallet list once filtering listeners are stabilized
     * @private
     */
    function setFilteredWalletsForUI() {
      if (!_.isEmpty($rootScope.wallets.all)) {
        $scope.filteredWalletsExist = true;
        $scope.noWalletsExist = false;
      } else {
        $scope.filteredWalletsExist = false;
        $scope.noWalletsExist = true;
      }
    }

    /**
      * show the wallet shares list once filtering listeners are stabilized
      * @private
      */
    function setFilteredWalletSharesForUI() {
      // incase of success wallet share, we want to stop processing share before displayign wallets
      $scope.processShare = false;
      if (!_.isEmpty($rootScope.walletShares.all.incoming)) {
        $scope.filteredWalletSharesExist = true;
        $scope.noWalletSharesExist = false;
      } else {
        $scope.filteredWalletSharesExist = false;
        $scope.noWalletSharesExist = true;
      }
    }

    // show the UI when there are no wallets, walletshares in current enterprise but are present in other enterprises
    $scope.noWalletsInEnterprise = function() {
      return $scope.noWalletsExist && $scope.noWalletSharesExist && !$scope.noWalletsAcrossEnterprisesExist;
    };

    // show the welcome message if no wallets or walletshares exist and sharing isn't in process
    $scope.canShowWelcomeMessage = function() {
      return $scope.noWalletSharesExist && $scope.noWalletsAcrossEnterprisesExist && !$scope.processShare;
    };

    // Link off to the create new wallet flow
    $scope.createNewWallet = function() {
      // track the create flow kick-off
      AnalyticsProxy.track('CreateWalletStarted', { invitation: !!$rootScope.invitation });

      // If the user has a weak login password, we force them to upgrade it
      // before they can create any more wallets
      if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
        return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
      }
      try {
        $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets/create');
      } catch(error) {
        console.error('Expect $rootScope\'s current enterprise to be set.');
      }
    };

    // function to check if the user can create wallets on the current enterprise
    $scope.canCreateWallet = function() {
      if ($rootScope.enterprises.current && $rootScope.enterprises.current.isAdmin) {
        return true;
      }
    };

    // Link in to a specific wallet and set the current wallet on rootscope
    $scope.goToWallet = function(wallet) {
      WalletsAPI.setCurrentWallet(wallet);
    };

    // Go to identity verification page
    $scope.goToIdentityVerification = function goToIdentityVerification() {
      $location.path('/identity/verify');
    };

    /**
    * accept wallet share error handler.
    * @params - The wallet share you want to accept
    * @returns {function} which handles the appropriate errors from accepting a share. It calls modals etc
    */
    function AcceptShareErrorHandler(walletShare) {
      return function onAcceptShareFail(error) {
        if (UtilityService.API.isOtpError(error)) {
          // If the user needs to OTP, use the modal to unlock their account
          openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock, walletName: walletShare.walletLabel })
          .then(function(result) {
            if (result.type === 'otpThenUnlockSuccess') {
              if (!result.data.otp && !$scope.noOtpDeviceSet) {
                throw new Error('Missing otp');
              }
              if (!result.data.password) {
                throw new Error('Missing login password');
              }
              $scope.password = result.data.password;
              // resubmit to share wallet
              return $scope.acceptShare(walletShare);
            }
          }).catch(function(){
            $scope.processShare = false;
          });
        }
        else if (UtilityService.API.isPasscodeError(error)) {
          openModal({ type: BG_DEV.MODAL_TYPES.passwordThenUnlock, walletName: walletShare.walletLabel })
          .then(function(result) {
            if (result.type === 'otpThenUnlockSuccess') {
              if (!result.data.password) {
                throw new Error('Missing login password');
              }
              $scope.password = result.data.password;
              // resubmit to share wallet
              return $scope.acceptShare(walletShare);
            }
          }).catch(function(){
            $scope.processShare = false;
          });
        }
        else {
          $scope.processShare = false;
          // Otherwise just display the error to the user
          Notify.error(error.error || error);
        }
      };
    }

    /**
    * accepts wallet share.
    * Steps for accepting a wallet share
    *   - Fetch the details of the wallet share from the server.
    *   - Get ECDH keychain of the current user.
    *   - decrypt the xprv with the users passcode.
    *   - get the echd secret
    *   - get the shared wallet xprv with the secret and the pubkey
    *   - encrypt the shared wallet xprv with the passcode
    *   - send this data to the server
    * @params - The wallet share you want to accept
    * @returns {promise} with data/error from the server calls.
    */
    $scope.acceptShare = function(walletShare) {
      $scope.processShare = true;
      var params = {
        state: 'accepted',
        walletShareId: walletShare.id
      };
      var role = $filter('bgPermissionsRoleConversionFilter')(walletShare.permissions);
      if (role === BG_DEV.WALLET.ROLES.ADMIN || role === BG_DEV.WALLET.ROLES.SPEND) {
        WalletSharesAPI.getSharedWallet({walletShareId: walletShare.id})
        .then(function(data){
          // check if the wallet is a cold wallet. If so accept share without getting secret etc. (this just behaves as a 'view only' share wallet)
          if (!data.keychain) {
            return WalletSharesAPI.updateShare(params).then($scope.shareUserSuccess);
          } else {
            return KeychainsAPI.get($rootScope.currentUser.settings.ecdhKeychain)
            .then(function(sharingKeychain) {
              if (!sharingKeychain.encryptedXprv) {
                throw new Error('EncryptedXprv was not found on sharing keychain');
              }
              if (!$scope.password){
                var errorData = {
                  status: 401,
                  message: "Missing Password",
                  data: { needsPasscode: true, key: null }
                };
                return $q.reject(UtilityService.ErrorHelper(errorData));
              }
              // Now we have the sharing keychain, we can work out the secret used for sharing the wallet with us
              sharingKeychain.xprv = SDK.decrypt($scope.password, sharingKeychain.encryptedXprv);
              var rootExtKey = SDK.bitcoin.HDNode.fromBase58(sharingKeychain.xprv);
              // Derive key by path (which is used between these 2 users only)
              var extKey = rootExtKey.deriveFromPath(data.keychain.path);
              var secret = SDK.get().getECDHSecret({
                eckey: extKey.privKey,
                otherPubKeyHex: data.keychain.fromPubKey
              });

              // Yes! We got the secret successfully here, now decrypt the shared wallet xprv
              var decryptedSharedWalletXprv = SDK.decrypt(secret, data.keychain.encryptedXprv);

              encryptedSharedWalletXprv = SDK.encrypt($scope.password, decryptedSharedWalletXprv);
              params.encryptedXprv = encryptedSharedWalletXprv;
              return WalletSharesAPI.updateShare(params);
            });
          }
        }).then($scope.shareUserSuccess)
        .catch(AcceptShareErrorHandler(walletShare));
      }
      else {
        return WalletSharesAPI.updateShare(params).then($scope.shareUserSuccess);
      }
    };

    $scope.shareUserSuccess = function() {
      // TODO Barath. Might be a better (smoother for UI) way to accept share
      SyncService.sync();
    };

    function rejectShareSuccess() {
      $scope.processShare = false;
      WalletSharesAPI.getAllSharedWallets();
    }

    // reject a share
    $scope.rejectShare = function(walletShare) {
      $scope.processShare = true;
      WalletSharesAPI.cancelShare({walletShareId: walletShare.id})
      .then(rejectShareSuccess)
      .catch(Notify.errorHandler);
    };

    function showModal(walletsData) {
      var firstWalletPromptShown = enterpriseCache.get('firstWalletPromptShown');
      var fundWalletPromptShown = enterpriseCache.get('fundWalletPromptShown');
      var isWalletModal = true;
      // if this is the first wallet with no balance, show the fund wallet modal
      if (showFundModal() && !fundWalletPromptShown) {
        enterpriseCache.add('fundWalletPromptShown', true);
        openModal({type: BG_DEV.MODAL_TYPES.fundWallet, userAction: BG_DEV.MODAL_USER_ACTIONS.fundWallet,
                   url: 'modal/templates/fundWallet.html'}, isWalletModal);
      } else if ((_.isEmpty(walletsData.allWallets)) && (_.isEmpty($rootScope.walletShares.all.incoming)) && !firstWalletPromptShown) {
        enterpriseCache.add('firstWalletPromptShown', true);
        openModal({type: BG_DEV.MODAL_TYPES.createWallet, userAction: BG_DEV.MODAL_USER_ACTIONS.createWallet,
                   url: 'modal/templates/createWallet.html'}, isWalletModal);
      }
    }

    // Event Listeners
    // Listen for the enterprises's wallet shares to be set before showing the list
    var killWalletSharesListener = $rootScope.$on('WalletSharesAPI.FilteredWalletSharesSet',
      function(evt, data) {
        setFilteredWalletSharesForUI();
      }
    );

    // Listen for all user wallets to be set
    var killUserWalletsListener = $rootScope.$on('WalletsAPI.UserWalletsSet',
      function(evt, data) {
        receivedUserWalletsSetEvent = true;
        if (_.isEmpty(data.allWallets)) {
          $scope.noWalletsAcrossEnterprisesExist = true;
        } else {
          $scope.noWalletsAcrossEnterprisesExist = false;
        }
        setFilteredWalletsForUI();
        showModal(data);
      }
    );

    // Clean up the listeners -- helps decrease run loop time and
    // reduce liklihood of references being kept on the scope
    $scope.$on('$destroy', function() {
      killWalletSharesListener();
      killUserWalletsListener();
    });

    function openModal(params, isWalletModal) {
      if (!params || !params.type) {
        throw new Error('Missing modal params');
      }
      var modalInstance;
      if (isWalletModal) {
        modalInstance = $modal.open({
          templateUrl: params.url,
          controller: 'ModalController',
          scope: $scope,
          size: params.size,
          resolve: {
           // The return value is passed to ModalController as 'locals'
            locals: function () {
              return {
                type: params.type,
                userAction: params.userAction
              };
            }
          }
        });
      }
     // if it is a wallet share accept
      else {
        // check for wallet name while accepting share
        if (!params.walletName) {
          throw new Error('Missing modal params');
        }
        modalInstance = $modal.open({
          templateUrl: 'modal/templates/modalcontainer.html',
          controller: 'ModalController',
          scope: $scope,
          size: params.size,
          resolve: {
            // The return value is passed to ModalController as 'locals'
            locals: function () {
              return {
                type: params.type,
                userAction: BG_DEV.MODAL_USER_ACTIONS.acceptShare,
                walletName: params.walletName
              };
            }
          }
        });
      }
      return modalInstance.result;
    }

    function init() {
      $rootScope.setContext('enterpriseWalletsList');
      $scope.balance = {
        bitcoinTotal: 0
      };
      $scope.noWalletsAcrossEnterprisesExist = false;
      $scope.filteredWalletsExist = false;
      $scope.noWalletsExist = false;
      $scope.filteredWalletSharesExist = false;
      $scope.noWalletSharesExist = false;
    }
    init();
  }
]);
