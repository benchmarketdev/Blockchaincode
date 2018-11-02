angular.module('BitGo.Auth.TwoFactorFormDirective', [])

/**
 * Directive to help with login otp code verification
 */
.directive('twoFactorForm', ['UserAPI', 'SettingsAPI', 'UtilityService', 'NotifyService', 'BG_DEV', 'AnalyticsProxy', 'featureFlags',
  function(UserAPI, SettingsAPI, Util, Notify, BG_DEV, AnalyticsProxy, featureFlags) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {

        $scope.twoFactorMethods = ['totp', 'yubikey', 'authy', 'text'];
        $scope.twoFactorMethod = 'totp';

        /**
         * Checks if the user has a verified email before allowing login
         * @private
         */
        function userHasAccess() {
          if (!$scope.user.settings.email.verified) {
            $scope.$emit('SetState', 'needsEmailVerify');
            return false;
          }
          return true;
        }
       
        function formIsValid() {
          return Util.Validators.otpOk($scope.otpCode);
        }

        /**
         * Handle successful OTP push
         * @private
         */
        function onSendOTPSuccess() {
          // Clear any form errors
          $scope.clearFormError();

          // Set params for OTP device type
          var params = { type: $scope.forceSMS ? 'text' : 'authy' };

          AnalyticsProxy.track('OTP', params);

          // Route user to verification page
          $scope.setState('verifyPhone');
        }
        /**
         * Handle failed OTP push
         * @private
         */
        function onSendOTPFail() {
          // Clear any form errors
          $scope.clearFormError();

          // Set params for OTP device type
          var params = { type: $scope.forceSMS ? 'text' : 'authy' };

          // Track phone verification success
          AnalyticsProxy.track('OTP', params);
          // Provide error feedback
          $scope.setFormError('Please enter a valid phone number.');
        }
        /**
         * Handle successful Totp verification from the BitGo service
         * @param user {Object}
         * @private
         */
        function onTotpSuccess(user) {
          // Set params for OTP device type
          var params = {
            type: 'totp'
          };
          // Track phone verification success
          AnalyticsProxy.track('AddOTPDevice', params);
          if (userHasAccess()) {
            $scope.$emit('SignUserIn');
          }
        }

        /**
         * Handle failed Totp from the BitGo service
         * @param error {Object}
         * @private
         */
        function onTotpFail(error) {
          // Track the server verification fail
          var params = {
            // Error Specific Data
            status: error.status,
            message: error.error,
            action: 'AddOTPDevice',
            type: 'totp'
          };
          AnalyticsProxy.track('Error', params);
          
          Notify.error('Please enter a valid code');
        }

        /**
         * Handle successful Yubikey verification from the BitGo service
         * @param user {Object}
         * @private
         */
        function onYubikeySuccess(user) {
          var params = {
            type: 'yubikey'
          };
          // Track phone verification success
          AnalyticsProxy.track('AddOTPDevice', params);

          if (userHasAccess()) {
            $scope.$emit('SignUserIn');
          }
        }


        /**
         * Handle failed yubikey from the BitGo service
         * @param error {Object}
         * @private
         */
        function onYubikeyFail(error) {
          // Track the server verification fail
          var metricsData = {
            // Error Specific Data
            status: error.status,
            message: error.error,
            action: 'AddOTPDevice',
            type: 'yubikey'
          };
          AnalyticsProxy.track('Error', metricsData);
          
          Notify.error('Please enter a valid code');
        }


        /**
         * Handle successful phone verification from the BitGo service
         * @param user {Object}
         * @private
         */
        function onVerifySuccess(user) {
          var params = {
            type: 'authy'
          };
          // Track phone verification success
          AnalyticsProxy.track('AddOTPDevice', params);
          if (userHasAccess()) {
            $scope.$emit('SignUserIn');
          }
        }

        /**
         * Handle failed phone verification from the BitGo service
         * @param error {Object}
         * @private
         */
        function onVerifyFail(error) {
          // Track the server verification fail
          var metricsData = {
            // Error Specific Data
            status: error.status,
            message: error.error,
            action: 'AddOTPDevice',
            type: 'authy'
          };
          AnalyticsProxy.track('Error', metricsData);

          Notify.error('Please enter a valid code');
        }

        function onResendSuccess() {
          Notify.success('Your code was sent.');
        }

        function onResendFail(error) {
          if (error.status === 401 && error.needsOTP) {
            // In this case, the user was hitting /login to force the SMS resend
            // (since it is protected). If this error case comes back, we assume
            // that the server successfully sent the code to the user
            Notify.success('Your code was sent.');
          } else {
            Notify.error('There was an issue resending your code. Please refresh your page and log in again.');
          }
        }

        function onSubmitOTPSuccess() {
          // Track the OTP success
          AnalyticsProxy.track('Otp');

          if (userHasAccess()) {
            $scope.$emit('SignUserIn');
          }
        }

        function onSubmitOTPFail(error) {
          // Track the OTP fail
          var metricsData = {
            // Error Specific Data
            status: error.status,
            message: error.error,
            action: 'Otp Login'
          };
          AnalyticsProxy.track('Error', metricsData);

          Notify.error('The code provided was invalid.');
        }

        /**
         * UI - verifies if a method is the currently selected Otp method
         * @public
         */
        $scope.isTwoFactorMethod = function(method) {
          return method === $scope.twoFactorMethod;
        };

        /**
         * UI - sets the current Otp method on the scope
         * @public
         */
        $scope.setTwoFactorMethod = function(method) {
          if (typeof(method) !== 'string') {
            throw new Error('invalid method');
          }
          $scope.twoFactorMethod = method;

          // Track the method selected
          var metricsData = {
            method: method
          };
          AnalyticsProxy.track('SelectOtpMethod', metricsData);
        };

        /**
         * Allows user to defer two-step verification setup
         * @public
         */

        $scope.deferTwoFactor = function() {
          var params = {
            key: 'bypassSetOTP',
            value: 'true'
          };
          if(userHasAccess()) {
            return UserAPI.me()
            .then(UserAPI.putClientCache(params))
            .then(function() {
              $scope.$emit('SignUserIn');
            });
          }
        };

        $scope.sendOTP = function(forceSMS) {
          // Clear any errors
          $scope.clearFormError();
          $scope.forceSMS = !!forceSMS;
          var params = {
            phone: $scope.user.settings.phone.phone,
            forceSMS: $scope.forceSMS
          };
          return UserAPI.sendOTP(params)
          .then(onSendOTPSuccess)
          .catch(onSendOTPFail);
        };

        $scope.submitVerifyPhone = function() {
          // Clear any errors
          $scope.clearFormError();

          if (formIsValid()) {
            var params = {
              type: 'authy',
              otp: $scope.otpCode,
              phone: $scope.user.settings.phone.phone,
              label: 'Authy',
              forceSMS: $scope.forceSMS
            };
            UserAPI.addOTPDevice(params)
            .then(function() {
              return UserAPI.me();
            })
            .then(onVerifySuccess)
            .catch(onVerifyFail);
          } else {
            $scope.setFormError('Please enter a valid 2-step verification code.');
          }
        };

        $scope.newTotp = function() {
          $scope.state = 'totpSetup';
          $scope.clearFormError();
          return UserAPI.newTOTP()
          .then(function(totpUrl) {
             $scope.totpUrl = totpUrl;
           });
        };
        
        $scope.setTotp = function() {
          var params = {
            type: 'totp',
            otp: $scope.otpCode,
            hmac: $scope.totpUrl.hmac,
            key: $scope.totpUrl.key,
            label: 'Google Authenticator'
          };
          return UserAPI.addOTPDevice(params)
          .then(function() {
            return UserAPI.me();
          })
          .then(onTotpSuccess)
          .catch(onTotpFail);
        };

        $scope.cancelTotp = function() {
          return $scope.$emit('SetState', 'setOtpDevice');
        };

        $scope.submitSetYubikey = function() {
          // Clear any errors
          $scope.clearFormError();

          if (formIsValid()) {
            var params = {
              type: 'yubikey',
              otp: $scope.otpCode,
              label: $scope.otpLabel
            };
            UserAPI.addOTPDevice(params)
            .then(function() {
              return UserAPI.me();
            })
            .then(onYubikeySuccess)
            .catch(onYubikeyFail);

          } else {
            $scope.setFormError('Please enter a valid Yubikey verification code.');
          }

        };

        $scope.submitOTP = function() {
          // Clear any errors
          $scope.clearFormError();

          if (formIsValid()) {
            $scope.attemptLogin()
            .then(onSubmitOTPSuccess)
            .catch(onSubmitOTPFail);
          } else {
            $scope.setFormError('Please enter a valid 2-step verification code.');
          }
        };

        $scope.resendOTP = function(forceSMS) {
          // Track the text resend
          AnalyticsProxy.track('ResendOtp');

          if ($scope.user.loggedIn) {
            // If there is a session user, they are verifying their phone
            // and we can use the sendOTP protected route
            var params = {
              phone:  $scope.user.settings.phone.phone,
              forceSMS: !!forceSMS
            };
            UserAPI.sendOTP(params)
            .then(onResendSuccess)
            .catch(onResendFail);
          } else {
            // If there is no user, we have a user trying to otp to log in
            $scope.attemptLogin(forceSMS)
            .then(onResendSuccess)
            .catch(onResendFail);
          }
        };
      }]
 
    };
  }
]);
