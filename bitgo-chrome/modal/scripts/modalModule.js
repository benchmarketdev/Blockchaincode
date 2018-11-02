/*
  Notes:
  - This module is for definition of all modal-specific controllers and
  directives used with the UI-Bootstrap service
*/
angular.module('BitGo.Modals', [
  // Modules for BitGo.Modals composition
  'BitGo.Modals.ModalController',
  'BitGo.Modals.ModalStateService',
  // Just Otp
  'BitGo.Modals.ModalOtpFormDirective',
  // Otp Then Unlock flow
  'BitGo.Modals.ModalOtpPasswordFormDirective',
  // App Offline Warning
  'BitGo.Modals.ModalOfflineWarningDirective',
  // User Deactivation Modal
  'BitGo.Modals.ModalAccountDeactivationDirective',
  // QR Receive Address
  'BitGo.Modals.ModalQrReceiveAddressDirective',
  // Shapeshift receive address
  'BitGo.Modals.ModalReceiveAltCoinDirective',
  // Create Wallet
  'BitGo.Modals.ModalCreateWallet',
  // Fund Wallet
  'BitGo.Modals.ModalFundWallet'
])

.run(['$rootScope', '$compile', '$http', '$templateCache', 'CONSTANTS', 'ModalStateService',
  function($rootScope, $compile, $http, $templateCache, CONSTANTS, ModalStateService) {
    // We need to handle the case when the user loses browser connection.
    // In this instance, we will not be able to fetch any templates we need
    // to render. To handle being able to show the offline-warning modal,
    // we force load and cache the necessary templates when the app is
    // instantiated
    _.forEach(CONSTANTS.TEMPLATES.REQUIRED_OFFLINE, function(template) {
      $http.get(template, { cache: $templateCache })
      .then(function(response) {
        // response.data is the actual template html
        // Compile the response, which automatically puts it into the cache
        $compile(response.data);
      });
    });

    // Listen for the App to have any BitGo service calls fail due to the
    // app going offline.
    $rootScope.$on('UtilityService.AppIsOffline', function(evt, data) {
      ModalStateService.triggerAppOfflineWarning();
    });
  }
])

.constant('CONSTANTS', {
  TEMPLATES: {
    // Put all modal templates in here that might be required when
    // the app loses an internet connection
    REQUIRED_OFFLINE: [
      'modal/templates/modalcontainer.html',
      'modal/templates/modal-offline-warning.html'
    ]
  }
});
