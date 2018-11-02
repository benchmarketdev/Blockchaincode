/**
 * @ngdoc service
 * @name matchwalletAPI
 * @description
 * Manages interactions with the matchwallet API endpoints and setting
 * related variables on $rootScope
 */
angular.module('BitGo.API.MatchwalletAPI', [])

.factory('MatchwalletAPI', ['$q', '$location', '$rootScope', '$injector', 'WalletsAPI', 'EnterpriseAPI', 'MatchwalletModel', 'NotifyService', 'UtilityService', 'CacheService', 'featureFlags', 'SDK', 'BG_DEV',
  function($q, $location, $rootScope, $injector, WalletsAPI, EnterpriseAPI, MatchwalletModel, Notify, UtilityService, CacheService, featureFlags, SDK, BG_DEV) {
    // fetch helpers
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;

    // Cache setup
    var matchwalletCache = CacheService.getCache('matchwallets') || new CacheService.Cache('localStorage', 'matchwallets', 120 * 60 * 1000);

    // The user's invitation, if they have one
    $rootScope.invitation = null;

    /**
     * True if the user has unclaimed invitation gift.
     */
    function invitationGiftPending() {
      return $rootScope.invitation &&
             !$rootScope.invitation.accepted &&
             !$rootScope.invitation.rejected &&
             !$rootScope.invitation.giftWalletId;
    }
    
    /**
     * @returns True if the user can send invites
     */
    function canSendInvites() {
      if (!$rootScope.invitation && !featureFlags.isOn("employee")) {
        return false;
      }
      if (!$rootScope.matchwallets || _.isEmpty($rootScope.matchwallets.all)) {
        return true;
      }
      var matchwallet = _.findLast($rootScope.matchwallets.all);
      return matchwallet.data.balance >= BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT &&
             matchwallet.data.balance > BG_DEV.TX.MINIMUM_BTC_DUST;
    }

    /**
     * Create Matchwallet API endpoint helper
     * @returns new matchwallet object
     * @private
     */
    function createMatchwallet() {
      return SDK.wrap(SDK.doPost('/matchwallet/create'))
      .then(function(matchwallet) {
        matchwallet = new MatchwalletModel.Matchwallet(matchwallet);
        // update the cache and rootScope wallets object
        matchwalletCache.add(matchwallet.data.id, matchwallet);
        $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
        return matchwallet;
      });
    }

    /**
      * initializes empty match wallet objects for the app / service
      * @private
      */
    function initEmptyMatchwallets() {
      $rootScope.matchwallets = {
        all: {},
        current: null
      };
    }

    /**
      * Clears all user match wallets from the match wallet cache
      * @private
      */
    function clearMatchwalletCache() {
      _.forIn($rootScope.matchwallets.all, function(matchwallet) {
        matchwalletCache.remove(matchwallet.data.id);
        console.assert(_.isUndefined(matchwalletCache.get(matchwallet.data.id)), matchwallet.data.id + ' was not removed from matchwalletCache');
      });
      initEmptyMatchwallets();
    }

    /**
      * Sets the new current matchwallet object on rootScope
      * @param matchwallet {Object} BitGo Matchwallet object
      * @param swapCurrentWallet {Bool} swap the current Matchwallet for the new one
      * @private
      */
    function setCurrentMatchwallet(matchwallet, swapCurrentMatchwallet) {
      if (!matchwallet) {
        throw new Error('Expect a wallet when setting the current wallet');
      }
      if (_.isEmpty($rootScope.matchwallets.all)) {
        throw new Error('Missing $rootScope.matchwallets.all');
      }
      var newCurrentMatchwallet = $rootScope.matchwallets.all[matchwallet.data.id];
      if (!newCurrentMatchwallet) {
        throw new Error('Matchwallet ' + matchwallet.data.id + ' not found when setting the current wallet');
      }
      // If we're swapping out the current wallet on rootScope
      if (swapCurrentMatchwallet) {
        $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
        newCurrentMatchwallet = matchwallet;
      }
      // Set the new current matchwallet
      $rootScope.matchwallets.current = newCurrentMatchwallet;
      // Broadcast the new event and go to the wallet's transaction list page
      var url = $location.path().split('/');
      var curWalletIdx = _.indexOf(url, 'matchwallet') + 1;
      if ($rootScope.matchwallets.current.data.id !== url[curWalletIdx]) {
        // wallet transactions path
        var path = '/matchwallet/' + $rootScope.matchwallets.current.data.id;
        $location.path(path);
      }
    }

    // Event Handlers
    function setMatchwallets() {
      var url = $location.path().split('/');
      var curWalletIdx = _.indexOf(url, 'matchwallet') + 1;
      var urlMatchwalletId = url[curWalletIdx];
      var urlCurrentMatchwallet = $rootScope.matchwallets.all[urlMatchwalletId];
      // handle wrong url by redirecting them to the dashboard
      if (urlMatchwalletId && !urlCurrentMatchwallet) {
        $location.path('/enterprise/personal/wallets');
      }
      if (urlMatchwalletId && urlCurrentMatchwallet) {
        setCurrentMatchwallet(urlCurrentMatchwallet);
      }
      setRewardsApproval();
    }

    // Fetch the details for a single wallet based on params criteria
    function getMatchwallet(params, cacheOnly) {
      if (!params) {
        throw new Error('Missing params for getting a wallet');
      }
      if (cacheOnly) {
        var result = matchwalletCache.get(params.id);
        return $q.when(result);
      }
      return SDK.wrap(SDK.doGet('/matchwallet/' + params.id))
      .then(function(matchwallet) {
        matchwallet = new MatchwalletModel.Matchwallet(matchwallet);
        // update the cache and rootScope wallets object
        matchwalletCache.add(params.id, matchwallet);
        $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
        return matchwallet;
      });
    }

    // Fetch the details for a user's invitation
    function fetchInvitation() {
      if (!$rootScope.currentUser.settings.signupToken) {
        return $q(function(resolve) {
          resolve(null);
        });
      }
      return SDK.wrap(SDK.doGet('/matchwallet/invitation'))
      .catch(function(err) {
        return null;
      });
    }

    function emitMatchwalletsSetMessage() {
      $rootScope.$emit('MatchwalletAPI.UserMatchwalletsSet', $rootScope.matchwallets.all);
    }

    // Fetch all match wallets for a user
    function getAllMatchwallets(localMatchwalletsOnly) {
      // Returns all wallets
      if (localMatchwalletsOnly) {
        return $rootScope.matchwallets.all;
      }
      return SDK.wrap(SDK.doGet('/matchwallet', { limit: 10 }))
      .then(function(data) {
        return $q.all(data.matchwallets.map(function(matchwallet) {
          return getMatchwallet({ id: matchwallet.id }, false)
          .then(function(matchwallet) {
            $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
          })
          .catch(function(error) {
            console.error(error);
          });
        }))
        .then(function() {
          setMatchwallets();
          emitMatchwalletsSetMessage();
          return $rootScope.matchwallets.all;
        });
      })
      .catch(PromiseErrorHelper());
    }

    /**
     * Updates the match wallet settings
     * @param {Object} params for the wallet. Contains wallet id and a new label or rewardWalletId
     * @returns {Promise} with success/error
     * @public
     */
    function updateMatchwallet(params) {
      if (!params.id || !(params.label || params.rewardWalletId)) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPut('/matchwallet/' + params.id, params))
      .then(
        PromiseSuccessHelper(),
        PromiseErrorHelper()
      );
    }

    /**
     * Sends an invitation
     * @params {Object} params for the invitation. Contains matchwallet id, email, amount and message
     * @returns {Promise} with success/error
     */
    function sendInvitation(params) {
      if (!params.id || !params.email || !params.amount) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPost('/matchwallet/' + params.id + '/send', params));
    }

    function setCurrentInvitation(invitation) {
      $rootScope.invitation = invitation;
      setRewardsApproval();
      $rootScope.$emit('MatchwalletAPI.UserInvitationSet', invitation);
    }

    function getInvitation() {
      return fetchInvitation().then(setCurrentInvitation);
    }

    // Fetch all wallets when the user signs in
    $rootScope.$on('UserAPI.CurrentUserSet', function(evt, user) {
      getAllMatchwallets();
      getInvitation();
    });

    // Clear the wallet cache on user logoout
    $rootScope.$on('UserAPI.UserLogoutEvent', function() {
      clearMatchwalletCache();
      delete $rootScope.invitation;
    });

    // Sets the "claim reward" approval on the personal enterprise
    function setRewardsApproval() {
      var personalEnterprise = _.find($rootScope.enterprises.all, { isPersonal: true });
      if (personalEnterprise) {
        var approvals = {};
        if ($rootScope.invitation &&
            !$rootScope.invitation.accepted &&
            !$rootScope.invitation.rejected &&
            !$rootScope.invitation.giftWalletId) {
          approvals[$rootScope.invitation.id] = {
            id: $rootScope.invitation.id,
            enterprise: personalEnterprise.id,
            createDate: $rootScope.invitation.createDate,
            info: {
              type: 'invitation',
              gift: true,
              invitation: $rootScope.invitation
            },
            state: 'pending'
          };
        }
        if ($rootScope.matchwallets) {
          _($rootScope.matchwallets.all)
          .values()
          .pluck('data')
          .pluck('invitations')
          .flatten()
          .value()
          .forEach(function(invitation) {
            if (!invitation.accepted &&
                !invitation.rejected &&
                !invitation.rewardWalletId) {
              approvals[invitation.id] = {
                id: invitation.id,
                enterprise: personalEnterprise.id,
                createDate: invitation.createDate,
                info: {
                  type: 'invitation',
                  reward: true,
                  invitation: invitation
                },
                state: 'pending'
              };
            }
          });
        }
        personalEnterprise.setApprovals(approvals);
      }
    }

    function claimReward(invitation, rewardWalletId) {
      if (!invitation || !rewardWalletId) {
        throw new Error("Expcetd invitation and rewardWalletId");
      }
      invitation.accepted = true;
      if (invitation === $rootScope.invitation) {
        return SDK.wrap(SDK.doPost('/matchwallet/invitation/claim', { giftWalletId: rewardWalletId }));
      }
      return SDK.wrap(SDK.doPost('/matchwallet/invitation/' + invitation.id + '/claim', { rewardWalletId: rewardWalletId }));
    }

    function rejectReward(invitation) {
      if (!invitation) {
        throw new Error("Expcetd invitation");
      }
      invitation.rejected = true;
      if (invitation === $rootScope.invitation) {
        return SDK.wrap(SDK.doPost('/matchwallet/invitation/reject'));
      }
      return SDK.wrap(SDK.doPost('/matchwallet/invitation/' + invitation.id + '/reject'));
    }

    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', setRewardsApproval);

    function init() {
      initEmptyMatchwallets();
    }
    init();

    // In-client API
    return {
      createMatchwallet: createMatchwallet,
      getMatchwallet: getMatchwallet,
      getAllMatchwallets: getAllMatchwallets,
      getInvitation: getInvitation,
      fetchInvitation: fetchInvitation,
      setCurrentMatchwallet: setCurrentMatchwallet,
      sendInvitation: sendInvitation,
      updateMatchwallet: updateMatchwallet,
      setCurrentInvitation: setCurrentInvitation,
      claimReward: claimReward,
      rejectReward: rejectReward,
      invitationGiftPending: invitationGiftPending,
      canSendInvites: canSendInvites
    };
  }
]);
