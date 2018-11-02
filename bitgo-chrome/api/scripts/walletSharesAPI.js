/**
 * @ngdoc service
 * @name WalletSharesAPI
 * @description
 * This module is for managing all http requests for all Wallet Share objects in the app
 * Also manages which wallet shares to show based on the current enterprise
 */
angular.module('BitGo.API.WalletSharesAPI', [])

.factory('WalletSharesAPI', ['$location', '$rootScope', 'WalletModel', 'NotifyService', 'CacheService', 'LabelsAPI', 'UserAPI', 'SDK',
  function($location, $rootScope, WalletModel, Notify, CacheService, LabelsAPI, UserAPI, SDK) {

    // local copy of all wallet shares that exist for a given user
    var allWalletShares;

    /**
      * @description
      * initializes empty wallet shares objects for the app. It also initialises wallet shares on the rootscope
      * @private
      */
    function initEmptyWallets() {
      $rootScope.walletShares = {
        all: {
          incoming: {},
          outgoing: {}
        }
      };
      allWalletShares = {
        incoming: {},
        outgoing: {}
      };
    }
    /**
     * @description
     * Helper function which sets filtered wallet shares on the rootscope based on enterprise (handles only 'personal')
     * @param {object} The local walletShares object which contains a list of all walletShares across enterprises
     * @returns - none
     * @private
     */
    function getPersonalEnterpriseWalletShares(allWalletShares) {
      $rootScope.walletShares.all.incoming = _.pick(allWalletShares.incoming, function(walletShare, key) {
        return !walletShare.enterprise;
      });
      $rootScope.walletShares.all.outgoing = _.pick(allWalletShares.outgoing, function(walletShare, key) {
        return !walletShare.enterprise;
      });
    }

    /**
     * @description
     * Helper function which sets filtered wallet shares on the rootscope based on current enterprise (handles non 'personal' enterprises)
     * @param {object} The local walletShares object which contains a list of all walletShares across enterprises
     * @returns - none
     * @private
     */
    function getNormalEnterpriseWalletShares(allWalletShares, currentEnterprise) {
      $rootScope.walletShares.all.incoming = _.pick(allWalletShares.incoming, function(wallet, key) {
        return wallet.enterprise && currentEnterprise &&
                wallet.enterprise === currentEnterprise.id;
      });
      $rootScope.walletShares.all.outgoing = _.pick(allWalletShares.outgoing, function(wallet, key) {
        return wallet.enterprise && currentEnterprise &&
                wallet.enterprise === currentEnterprise.id;
      });
    }

    /**
     * @description
     * Helper function which sets filtered wallet shares on the rootscope based on current enterprise
     * @param - none
     * @returns - Appropriate filtering function based on the current enterprise (personal or non-personal)
     * @private
     */
    function getCurrentEnterpriseWalletShares() {
      if (!$rootScope.enterprises.current) {
        console.log('Cannot filter wallet shares without a current enterprise');
        return false;
      }
      var currentEnterprise = $rootScope.enterprises.current;
      if (currentEnterprise && currentEnterprise.isPersonal) {
        return getPersonalEnterpriseWalletShares(allWalletShares);
      } else {
        return getNormalEnterpriseWalletShares(allWalletShares, currentEnterprise);
      }
    }

    /**
     * @description
     * Filters the wallet shares and emits an event when the filtered wallete shares are set
     * @private
     */
    function setFilteredWalletShares() {
      // Set the correct wallet shares on rootScope based on the current enterprise
      getCurrentEnterpriseWalletShares();

      $rootScope.$emit('WalletSharesAPI.FilteredWalletSharesSet', {
        walletShares: $rootScope.walletShares
      });

      $rootScope.$emit('WalletSharesAPI.AllUserWalletSharesSet', {
        walletShares: allWalletShares
      });
    }

    // Set the correct wallet shares scoped by the current enterprise
    // once we have a current enterprise set in the app
    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function(evt, data) {
      setFilteredWalletShares();
    });

    // Fetch all wallet shares when the user signs in
    $rootScope.$on('UserAPI.CurrentUserSet', function(evt, user) {
      getAllSharedWallets();
    });

    /**
     * @description
     * Fetches all wallet shares for the main user. Calls appropriate function to filter the wallet shares and set on rootscope as well
     * @params - none
     * @returns {Promise} which handles getting email ids of the user object in the data returned from server
     * @public
     */
    function getAllSharedWallets() {
      return SDK.wrap(
        SDK.get().wallets().listShares()
      )
      .then(function(data){
        // Reset the local and rootscope wallet share list
        initEmptyWallets();
        // set incoming wallet shares on allWalletShares list
        data.incoming.forEach(function(incomingWalletShare){
          allWalletShares.incoming[incomingWalletShare.id] = incomingWalletShare;
        });
        // set outgoing wallet shares on allWalletShares list
        data.outgoing.forEach(function(outgoingWalletShare){
          allWalletShares.outgoing[outgoingWalletShare.id] = outgoingWalletShare;
        });
        setFilteredWalletShares();
      });
    }

    /**
     * @description
     * Fetches details about a wallet share. Needed for accepting admin or spend wallet shares
     * @params {object} - requires a share id. (The id of the wallet share)
     * @returns {promise} - with data regarding the wallet share from the server
     * @public
     */
    /* istanbul ignore next */
    function getSharedWallet(params) {
      if (!params.walletShareId) {
        throw new Error('Invalid data when getting a wallet share');
      }
      return SDK.wrap(
        SDK.get().wallets().getShare(params)
      );
    }

    /**
     * create a wallet share with another user
     * @param {String} Wallet id for the wallet to be shared
     * @param {object} params containing details of both users and keychain info for shared wallet
     * @returns {object} promise with data for the shared wallet
     */
    /* istanbul ignore next */
    function createShare(walletId, params) {
      if (!walletId || !params) {
        throw new Error('Invalid data when creating a wallet share');
      }
      return SDK.wrap(
        SDK.get().newWalletObject({ id: walletId })
        .createShare(params)
      );
    }

    /**
     * Request a reshare of a wallet from admins on the wallet (just an email + setting a bit for now)
     *
     * @param   {String} walletId   wallet id
     * @param   {Object} params    params (none)
     * @returns {Promise}
     */
    /* istanbul ignore next */
    function requestReshare(walletId, params) {
      if (!walletId || !params) {
        throw new Error('Invalid data when requesting a reshare');
      }
      return SDK.wrap(
        SDK.doPost('/wallet/' + walletId + '/requestreshare', params)
      );
    }

    /**
     * update a wallet share (either reject or save)
     * @param {object} params with data containing id and state(rejected or accepted)
     * @returns {object} promise with data from the updated share
     */
    /* istanbul ignore next */
    function updateShare(params) {
      return SDK.wrap(
        SDK.get().wallets().updateShare(params)
      );
    }

    /**
     * update a wallet share (either reject or save)
     * @param {object} params with data containing id and state(rejected or accepted)
     * @returns {object} promise with data from the updated share
     */
    /* istanbul ignore next */
    function cancelShare(params) {
      return SDK.wrap(
        SDK.get().wallets().cancelShare(params)
      );
    }

    /**
     * resend a wallet share email - for when you have already tried to share a
     * wallet with someone (which should have sent them an email), and you want
     * to send the email again
     *
     * @param {object} params with data containing id
     * @returns {object} promise with object saying whether the share was resent
     */
    /* istanbul ignore next */
    function resendEmail(params) {
      if (!params.walletShareId){
        throw new Error('Invalid data when resending wallet share');
      }
      return SDK.wrap(
        SDK.doPost('/walletshare/' + params.walletShareId + '/resendemail', params)
      );
    }

    function init() {
      initEmptyWallets();
    }
    init();

    // In-client API
    return {
      getSharedWallet: getSharedWallet,
      getAllSharedWallets: getAllSharedWallets,
      createShare: createShare,
      updateShare: updateShare,
      cancelShare: cancelShare,
      resendEmail: resendEmail,
      requestReshare: requestReshare
    };
  }
]);
