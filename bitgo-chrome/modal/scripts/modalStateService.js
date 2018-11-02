/**
 * @ngdoc service
 * @name SyncService
 * @description
 * Singleton to manage the state for all modals in the app
 */
angular.module('BitGo.Modals.ModalStateService', [])

.factory('ModalStateService', ['$rootScope', '$modal', 'BG_DEV',
  function($rootScope, $modal, BG_DEV) {
    // If the app loses connection, we want to only show the warning modal
    // once. We set this flag to true if we ever receive this fail case.
    var OFFLINE_WARNING_SHOWING = false;

    /**
     * Helper - Handles the modal for when the app is offline
     * @private
     */
    function openWarningModal() {
      // The instance of the app blocking modal used to let the user know
      // they've lost connectivity. It can only be dismissed by receiving a
      // successful pingback from the server
      $modal.open({
        templateUrl: 'modal/templates/modalcontainer.html',
        controller: 'ModalController',
        backdrop: 'static', // don't allow modal dismissal by clicking on backdrop
        resolve: {
          locals: function () {
            return {
              type: BG_DEV.MODAL_TYPES.offlineWarning,
              userAction: BG_DEV.MODAL_USER_ACTIONS.offlineWarning
            };
          }
        }
      }).result.then(
        function(data) {
          OFFLINE_WARNING_SHOWING = false;
        },
        function(error) {
          // kill the modal on error - this should never happen though
          OFFLINE_WARNING_SHOWING = false;
        }
      );
    }

    /**
     * Trigger the app-blocking modal when the app loses connectivity
     * @private
     */
    function triggerAppOfflineWarning() {
      if (OFFLINE_WARNING_SHOWING) {
        return;
      }
      OFFLINE_WARNING_SHOWING = true;
      openWarningModal();
    }

    // Public API
    return {
      triggerAppOfflineWarning: triggerAppOfflineWarning
    };
  }
]);
