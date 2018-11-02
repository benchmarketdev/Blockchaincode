angular.module('BitGo.Auth.LoginFormDirective', [])

/**
 * Directive to help with login form
 */
.directive('loginForm', ['UtilityService', 'NotifyService', 'RequiredActionService', 'BG_DEV', 'AnalyticsProxy', 'UserAPI',
  function(Util, Notify, RequiredActionService, BG_DEV, AnalyticsProxy, UserAPI) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: ['$scope', function($scope) {

        /**
         * Sets the locked password on the scope to use in the future
         */
        function setLockedPassword() {
          $scope.lockedPassword = _.clone($scope.password);
          $scope.lockedEmail = _.clone($scope.user.settings.email.email);
        }

        // This is specifically for firefox and how it handles the form autofilling
        // when a user chose to "remember my password" the autofill doesn't trip the
        // angular form handlers, so we check manually at form submit time
        function fetchPreFilledFields() {
          if (!$scope.user.settings.email.email) {
            var email = $('[name=email]').val();
            if (email) {
              $scope.user.settings.email.email = Util.Formatters.email(email);
            }
          }
          if (!$scope.password) {
            var password = $('[name=password]').val();
            if (password) {
              $scope.password = password;
            }
          }
        }

        function formIsValid() {
          return (!!$scope.password && Util.Validators.emailOk($scope.user.settings.email.email));
        }

        /**
         * Checks if we need a user to upgrade a weak login password
         * @returns {Bool}
         * @private
         */
        function passwordUpgradeActionSet() {
          var action = BG_DEV.REQUIRED_ACTIONS.WEAK_PW;
          if (!$scope.passwordStrength) {
            return false;
          }
          if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
            RequiredActionService.setAction(action);
          } else {
            RequiredActionService.removeAction(action);
          }
          return true;
        }

        /**
        * Sets the scope's password strength object
        * @param passwordStrength {Object}
        * @public
        */
        $scope.checkStrength = function(passwordStrength) {
          $scope.passwordStrength = passwordStrength;
        };

        function onLoginSuccess(user) {
          if (!$scope.user.settings.email.verified) {
            return $scope.$emit('SetState', 'needsEmailVerify');
          }
          // check the OTP devices
          if (user.settings.otpDevices.length) {
            return $scope.$emit('SignUserIn');
          }
          UserAPI.getClientCache()
          .then(function(cache) {
            // if the verified user object has been returned and user
            // needs OTP, set access to false
            if (!cache.bypassSetOTP) {
              // if the verified user object has been returned and user
              // needs OTP, set access to false
              $scope.user.hasAccess = false;
              return $scope.$emit('SetState', 'setOtpDevice');
            }
            $scope.$emit('SignUserIn');
          });
        }

        function onLoginFail(error) {
          if (error.needsOTP) {
            // Track the successful password verification
            // needsOTP failure means that the username / pw match was correct
            AnalyticsProxy.track('VerifyPassword');
            return $scope.$emit('SetState', 'otp');
          }
          // Track the password / username failure
          var metricsData = {
            // Error Specific Data
            status: error.status,
            message: error.error,
            action: 'Login'
          };
          AnalyticsProxy.track('Error', metricsData);
          Notify.error("Incorrect email or password.");
        }

        $scope.submitLogin = function() {
          // clear any errors
          if ($scope.clearFormError) {
            $scope.clearFormError();
          }
          fetchPreFilledFields();
          // handle the LastPass pw/email issues
          setLockedPassword();
          // check the login password strength for legacy weak pw's
          if (!passwordUpgradeActionSet()) {
            $scope.setFormError('There was an error confirming your password strength. Please reload your page and try again.');
            return;
          }

          // Submit the login form
          if (formIsValid()) {
            $scope.attemptLogin()
            .then(onLoginSuccess)
            .catch(onLoginFail);
          } else {
            // Track the failed auth
            var metricsData = {
              // Error Specific Data
              status: 'client',
              message: 'Invalid Login Form',
              action: 'Login'
            };
            AnalyticsProxy.track('Error', metricsData);
            $scope.setFormError('Missing required information.');
          }
        };

        function init() {
          $scope.passwordStrength = null;
        }
        init();
      }]
    };
  }
]);
