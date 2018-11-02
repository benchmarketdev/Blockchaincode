/*
  About:
  - Main modal controller will control all instances of a modal opened.
  It needs to be specified when instantiating.

  Example:
  var modalInstance = $modal.open({
    templateUrl: 'foo.html',
    controller: 'ModalController',
    resolve: {
      // The return value is passed to ModalController as 'locals'
      locals: function () {
        return {
          type: _someValidType_,
          userAction: _someValidAction_
        };
      }
    }
  });

  Notes:
  - Expects a valid modal 'type' so that it can set a template and any
  sub-controllers/directives appropriately

  This controls: ModalOtpForm
*/
angular.module('BitGo.Modals.ModalController', [])

.controller('ModalController', ['$scope', '$modalInstance', 'locals', 'BG_DEV',
  function($scope, $modalInstance, locals, BG_DEV) {
    // the current flow for the modal controller instance
    var currentModalFlow = null;

    // locals for the scope
    $scope.locals = locals;

    $scope.closeWithSuccess = function (result) {
      $modalInstance.close(result);
    };

    $scope.closeWithError = function(reason) {
      $modalInstance.dismiss(reason);
    };

    var killOtpSuccessListener = $scope.$on('modalOtpForm.OtpSuccess', function(evt, data) {
      if (!data.otp) {
        throw new Error('Missing modal close data');
      }
      if (currentModalFlow === BG_DEV.MODAL_TYPES.otp) {
        return $scope.closeWithSuccess({ type: 'otpsuccess', data: data });
      }
    });

    var killOtpAndUnlockSuccessListener = $scope.$on('modalOtpThenUnlockManager.OtpAndUnlockSuccess', function(evt, data) {
      if (!data.password) {
        throw new Error('Missing modal close data');
      }
      $scope.closeWithSuccess({ type: 'otpThenUnlockSuccess',  data: data });
    });

    var killDismissOfflineWarningListener = $scope.$on('modalOfflineWarning.DismissOfflineWarning', function(evt, data) {
      $scope.closeWithSuccess({ type: 'dismissOfflineWarning' });
    });

    $scope.$on('$destroy', function() {
      killOtpSuccessListener();
      killOtpAndUnlockSuccessListener();
      killDismissOfflineWarningListener();
    });

    function getTemplate() {
      var tpl;
      switch (locals.type) {
        // This case handles the case when otp and password is needed
        case BG_DEV.MODAL_TYPES.otpThenUnlock:
          // Starts from the OTP state
          $scope.initialState = 'otp';
          tpl = 'modal/templates/otp-password-unlock.html';
          break;
        // This case handles the case when only password is needed
        case BG_DEV.MODAL_TYPES.passwordThenUnlock:
          // Sets initial state to password. (Starts the flow from there)
          $scope.userUnlocked = true;
          // Get the time which the user is unlocked from cache if possible
          tpl = 'modal/templates/otp-password-unlock.html';
          break;
        // This case handles the case when only otp is needed
        case BG_DEV.MODAL_TYPES.otp:
          tpl = 'modal/templates/otp.html';
          break;
        // This case handles when the app is offline
        case BG_DEV.MODAL_TYPES.offlineWarning:
          tpl = 'modal/templates/modal-offline-warning.html';
          break;
        // This case handles user deactivation
        case BG_DEV.MODAL_TYPES.deactivationConfirmation:
          tpl = 'modal/templates/deactivationConfirmation.html';
          break;
        // This case handles the qr modal for viewing receiving addresses
        case BG_DEV.MODAL_TYPES.qrReceiveAddress:
          tpl = 'modal/templates/qrReceiveAddress.html';
          break;
        case BG_DEV.MODAL_TYPES.ssReceiveAltCoin:
          tpl = 'modal/templates/ssReceiveAltCoin.html';
          break;
        case BG_DEV.MODAL_TYPES.createWallet:
          tpl = 'modal/templates/createWallet.html';
          break;
        case BG_DEV.MODAL_TYPES.fundWallet:
          tpl = 'modal/templates/fundWallet.html';
          break;
        default:
          tpl = 'modal/templates/default.html';
          break;
      }
      return tpl;
    }

    function init() {
      if (!locals.type || !_.has(BG_DEV.MODAL_TYPES, locals.type)) {
        throw new Error('Modal controller expected a valid type');
      }
      if (!locals.userAction || !_.has(BG_DEV.MODAL_USER_ACTIONS, locals.userAction)) {
        throw new Error('Modal controller expected a valid userAction');
      }
      // if it's a modal for accepting share, we need wallet name as well
      if (locals.userAction === BG_DEV.MODAL_USER_ACTIONS.acceptShare && !locals.walletName) {
        throw new Error('Modal controller expected wallet name');
      }
      $scope.templateSource = getTemplate();
      currentModalFlow = BG_DEV.MODAL_TYPES[locals.type];
    }
    init();
  }
]);
