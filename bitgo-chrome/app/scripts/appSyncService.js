/**
 * @ngdoc service
 * @name SyncService
 * @description
 * Manages the re-syncing of the entire app with the latest server data
 */
angular.module('BitGo.App.SyncService', [])

.factory('SyncService', ['$rootScope', '$timeout', 'EnterpriseAPI', 'WalletsAPI', 'WalletSharesAPI', '$location', 'NotifyService', '$q', 'MatchwalletAPI', 'ApprovalsAPI',
  function($rootScope, $timeout, EnterpriseAPI, WalletsAPI, WalletSharesAPI, $location, Notify, $q, MatchwalletAPI, ApprovalsAPI) {
    // constant used to ensure we throttle the sync calls (if wanted)
    var SYNC_TIMEOUT;
    // global sync throttle timeout
    var SYNC_THROTTLE = 0;

    /**
    * Sync the app with the current server state
    * @private
    */
    function sync() {
      if (SYNC_TIMEOUT) {
        $timeout.cancel(SYNC_TIMEOUT);
      }
      SYNC_TIMEOUT = $timeout(function() {
        // Sync the appropriate data sources
        EnterpriseAPI.getAllEnterprises();
        WalletsAPI.getAllWallets();
        WalletSharesAPI.getAllSharedWallets();
      }, SYNC_THROTTLE);
    }

    /** In-client API */
    return {
      sync: sync
    };
  }
]);
