/**
 * @ngdoc directive
 * @name settingsPhoneForm
 * @description
 * Directive to manage the settings phone form
 */
angular.module('BitGo.Settings.PhoneFormDirective', [])

.directive('settingsPhoneForm', ['$rootScope', 'UserAPI', 'UtilityService', 'NotifyService',
  function($rootScope, UserAPI, Util, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        // access to the utility class validators
        var validate = Util.Validators;
        // Bool to show/hide the verification
        var phoneNeedsVerification;

        function formIsValid() {
          if (!validate.phoneOk($scope.settings.phone.phone)) {
            $scope.setFormError('Please enter a valid phone number.');
            return false;
          }
          return true;
        }

        $scope.hasPhoneChanges = function() {
          if (!$scope.settings || !$scope.localSettings) {
            return false;
          }
          if (!(_.isEqual($scope.localSettings.phone, $scope.settings.phone))) {
            return true;
          }
          return false;
        };

        /**
          * Resets the user's phone number back to the existing/verified number
          */
        function resetPhoneNumber() {
          $scope.settings.phone.phone = $scope.localSettings.phone.phone;
        }

        /**
          * Resets the phone verification state
          */
        function resetVerificationState() {
          phoneNeedsVerification = false;
          $scope.verificationOtp = '';
        }

        /**
          * Resets state if user abandons initial otp to change phone number
          */
        function unlockFail() {
          resetPhoneNumber();
          resetVerificationState();
        }

        function onSavePhoneSuccess(settings) {
          $scope.getSettings();
          resetVerificationState();
        }

        function onSavePhoneFail(error) {
          if (Util.API.isOtpError(error)) {
            $scope.openModal()
            .then(function(data) {
              if (data.type === 'otpsuccess') {
                phoneNeedsVerification = true;
              }
            })
            .catch(unlockFail);
          } else {
            Notify.error(error.error);
          }
        }

        /**
          * Logic in the UI to show/hide the verification form
          * @returns {Bool}
          */
        $scope.showVerificationForm = function() {
          return phoneNeedsVerification;
        };

        /**
          * Logic in the UI to show/hide the verified/unverified text
          * @returns {Bool}
          */
        $scope.needsVerification = function() {
          if (!$scope.settings || !$scope.localSettings) {
            return;
          }
          return !$scope.settings.phone.verified ||
                  !validate.phoneMatch($scope.settings.phone.phone, $scope.localSettings.phone.phone);
        };

        $scope.sendSMS = function() {
          // send the sms to their new phone number
          var params = {
            forceSMS: true,
            phone: $scope.settings.phone.phone
          };
          UserAPI.sendOTP(params)
          .then(Notify.successHandler('Your code was sent.'))
          .catch(Notify.errorHandler);
        };

        $scope.savePhoneForm = function() {
          // clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            var newSettings = {
              otp: $scope.verificationOtp,
              phone: $scope.settings.phone.phone
            };
            $scope.savePhone(newSettings)
            .then(onSavePhoneSuccess)
            .catch(onSavePhoneFail);
          }
        };

        $scope.cancelPhoneReset = function() {
          resetPhoneNumber();
          resetVerificationState();
        };

        function init() {
          resetVerificationState();
        }
        init();
      }]
    };
  }
]);
