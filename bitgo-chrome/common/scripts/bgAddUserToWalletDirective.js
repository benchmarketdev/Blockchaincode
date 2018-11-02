angular.module('BitGo.Common.BGAddUserToWalletDirective', [])
/**
 * @ngdoc directive
 * @name bgAddUserToWallet
 * @description
 * This directive contains all the required functions for sharing a wallet with a user.
 * Generally used along with an add user form directive
 * @example
 *   <div bg-add-user-to-wallet></div>
 */

.directive('bgAddUserToWallet', ['$rootScope', '$q', 'UserAPI', 'NotifyService', 'KeychainsAPI', 'UtilityService', '$modal', 'WalletSharesAPI', '$filter', 'WalletsAPI', 'SyncService', 'BG_DEV', 'SDK',
  function($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, WalletsAPI, SyncService, BG_DEV, SDK) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        //Called when user is successfully added to a wallet
        $scope.onAddUserSuccess = function (walletShare) {
          SyncService.sync();
          // if there are other admins, the wallet share reuires approval
          if ($rootScope.wallets.all[walletShare.walletId].multipleAdmins) {
            Notify.success('Invite is awaiting approval.');
          }
          $scope.setState('showAllUsers');
        };

        //Called when wallet sharing fails
        function onAddUserFail(error) {
          Notify.error(error.error);
        }

        function createShareErrorHandler (params) {
          return function createShareError (error) {
            if (UtilityService.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({type: BG_DEV.MODAL_TYPES.otpThenUnlock})
              .then(function(result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.otp && $rootScope.currentUser.settings.otpDevices > 0) {
                    throw new Error('Missing otp');
                  }
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  $scope.password = result.data.password;
                  // resubmit to share wallet
                  return $scope.shareWallet(params);
                }
              });
            }
            else if (UtilityService.API.isPasscodeError(error)) {
              openModal({type: BG_DEV.MODAL_TYPES.passwordThenUnlock})
              .then(function(result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  $scope.password = result.data.password;
                  // resubmit to share wallet
                  return $scope.shareWallet(params);
                }
              });
            }
            else {
              onAddUserFail(error);
            }
          };
        }

        /**
        * creates a wallet share with another user.
        * Steps for wallet sharing
        *   - Fetch the keychain for the particular wallet.
        *   - Get xprv by decrypting encrypted xprv.
        *   - create an ECDH secret.
        *   - encrypt the secret with the xprv
        *   - send this data to the server
        * @params {object} - data required for the create wallet share function
        * @returns {promise} with data/error from the server calls.
        */
       // TODO(ben): replace with SDK's shareWallet method?
        $scope.shareWallet = function (shareParams) {
          var error = {
            status: 401
          };
          if (!shareParams || !shareParams.keychain) {
            error.error = "Invalid share params";
            return $q.reject(error);
          }
          var createShareParams = _.clone(shareParams);
          return KeychainsAPI.get($rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub).then(function(data){
            // Cold wallets don't have encrypted xprv. Wallet sharing becomes similar to 'View Only' share then
            if (!data.encryptedXprv) {
              //empty out the keychain object bfeore sending to the server
              createShareParams.keychain = {};
              return WalletSharesAPI.createShare($scope.walletId, createShareParams);
            }
            else {
              if (!$scope.password){
                error.message = "Missing Password";
                error.data = { needsPasscode: true, key: null };
                return $q.reject(UtilityService.ErrorHelper(error));
              }
              var xprv = SDK.decrypt($scope.password, data.encryptedXprv);
              // init a new bip32 object based on the xprv from the server
              var testHDNode;
              try {
                testHDNode = SDK.bitcoin.HDNode.fromBase58(xprv);
                console.assert(testHDNode.privKey);
              } catch (e) {
                error.error = "Could not share wallet. Invalid private key";
                return $q.reject(error);
              }
              var testXpub = testHDNode.neutered().toBase58();
              // check if the xprv returned matches the xpub sent to the server
              if ($rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub !== testXpub) {
                error.error = "This is a legacy wallet and cannot be shared.";
                return $q.reject(error);
              }
              var eckey = SDK.bitcoin.ECKey.makeRandom();
              var secret = SDK.get().getECDHSecret({
                otherPubKeyHex: createShareParams.keychain.toPubKey,
                eckey: eckey
              });
              createShareParams.keychain.fromPubKey = eckey.pub.toHex();
              createShareParams.keychain.encryptedXprv = SDK.encrypt(secret, xprv);
              return WalletSharesAPI.createShare($scope.walletId, createShareParams);
            }
          })
          .then($scope.onAddUserSuccess)
          .catch(createShareErrorHandler(shareParams));
        };

        /**
         * We have already shared a wallet with this user, and they have lost
         * the password, and are now in the needsRecovery state, and thus need
         * to be shared with again. The key difference when resharing is that
         * we must set reshare=true. By design, this method is very similar to
         * saveAddUserForm.
         *
         * @param walletUserEntry {object} An element from the wallet.users array.
         * @param user {object} A wallet user object corresponding to the user from the walletUserEntry.
         *
         */
        $scope.reshareWallet = function(walletUserEntry, user) {
          var role = $filter('bgPermissionsRoleConversionFilter')(walletUserEntry.permissions);
          UserAPI.sharingkey({email: user.settings.email.email}).then(function(data) {
            params = {
              user: data.userId,
              reshare: true,
              permissions: walletUserEntry.permissions, // resharing uses existing permissions, but it is still necessary to pass this parameter
              message: "Resharing wallet."
            };
            if ( role === BG_DEV.WALLET.ROLES.SPEND || role === BG_DEV.WALLET.ROLES.ADMIN ) {
              params.keychain = {
                xpub: $rootScope.wallets.current.data.private.keychains[0].xpub,
                toPubKey: data.pubkey,
                path: data.path
              };
              $scope.walletId = $rootScope.wallets.current.data.id;
              return $scope.shareWallet(params);
            }
            return WalletSharesAPI.createShare($rootScope.wallets.current.data.id, params).then($scope.onAddUserSuccess);
          })
          .catch(function(error) {
            if (error.error === 'key not found') {
              Notify.error(user.settings.email.email + ' does not have a sharing key. The sharing key will be generated when the user next logs in. Have ' + user.settings.email.email + ' login to BitGo before sharing again.');
            }
            else {
              Notify.error(error.error);
            }
          });
        };

        // Triggers otp modal (with login password) to open if user needs to otp before sending a tx
        /* istanbul ignore next - all functionality provided by modal controller */
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
                  userAction: BG_DEV.MODAL_USER_ACTIONS.createShare,
                  wallet: $rootScope.wallets.all[$scope.walletId]
                };
              }
            }
          });
          return modalInstance.result;
        }

      }]
    };
  }
]);
