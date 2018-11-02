angular.module('BitGo.Modals.ModalOtpFormDirective', [])

/**
 * Directive to help with the otp auth modal form
 *
 */
.directive('modalOtpForm', ['UtilityService', 'UserAPI', 'NotifyService', 'BG_DEV',
  function(Util, UserAPI, NotifyService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', 'CacheService', function($scope, CacheService) {
        /** form data handler */
        $scope.form = null;

        // Cache setup
        var unlockTimeCache = CacheService.getCache('unlockTime') || new CacheService.Cache('sessionStorage', 'unlockTime', 120 * 60 * 1000);

        function formIsValid() {
          return Util.Validators.otpOk($scope.form.otp);
        }

        function onSubmitSuccess() {
          $scope.$emit('modalOtpForm.OtpSuccess', { type: 'otpsuccess', otp: $scope.form.otp });
        }

        function onSubmitError(error) {
          $scope.clearFormError();
          $scope.setFormError('Please enter a valid code');
        }

        $scope.submitOTP = function() {
          $scope.clearFormError();
          if (formIsValid()) {
            var params = {
              otp: $scope.form.otp
            };

            // If creating an access token, do not try to do an unlock - we are using the otp directly
            if ($scope.locals.userAction === BG_DEV.MODAL_USER_ACTIONS.createAccessToken) {
              return onSubmitSuccess();
            }

            UserAPI.unlock(params)
            .then(function(data) {
              unlockTimeCache.add('time', data.session.unlock.expires);
              onSubmitSuccess();
            })
            .catch(onSubmitError);
          } else {
            onSubmitError();
          }
        };

        function onResendSuccess() {
          NotifyService.success('Your code was successfully resent.');
        }

        function onResendFail() {
          NotifyService.error('There was an issue sending the code.');
        }

        $scope.resendOTP = function() {
          var params = {
            forceSMS: true
          };
          UserAPI.sendOTP(params)
          .then(onResendSuccess)
          .catch(onResendFail);
        };

        function init() {
          $scope.form = {
            otp: ''
          };
        }
        init();
      }]
    };
  }
]);
