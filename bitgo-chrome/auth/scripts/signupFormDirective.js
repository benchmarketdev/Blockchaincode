angular.module('BitGo.Auth.SignupFormDirective', [])

/**
 * Directive to manage the signup form
 */
.directive('signupForm', ['$rootScope', '$timeout', '$location', '$routeParams', 'UserAPI', 'UtilityService',  'NotifyService', 'BG_DEV',  'AnalyticsProxy', 'AnalyticsUtilities', 'SDK',
  function($rootScope, $timeout, $location, $routeParams, UserAPI, Util, Notify, BG_DEV, AnalyticsProxy, AnalyticsUtilities, SDK) {
    return {
      restrict: 'A',
      require: '^SignupController',
      controller: ['$scope', function($scope) {

        // Instance used to track how long it takes a user to enter a valid pw
        var analyticsPasswordMonitor;

        // Allows us to track the user's password strength
        $scope.passwordStrength = null;

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

        /**
         * Track client-only signup failure events
         * @param error {String}
         * @private
         */
        function trackClientSignupFail(error) {
          if (typeof(error) !== 'string') {
            throw new Error('invalid error');
          }
          var metricsData = {
            // Error Specific Data
            status: 'client',
            message: error,
            action: 'Signup'
          };
          AnalyticsProxy.track('Error', metricsData);
        }

        /**
         * Client signup form validator
         * @private
         */
        function formIsValid() {
          if (!Util.Validators.emailOk($scope.lockedEmail)) {
            $scope.setFormError('Please enter a valid email.');
            trackClientSignupFail('Invalid Email');
            return false;
          }
          if (!$scope.lockedPassword) {
            $scope.setFormError('Please enter a strong password.');
            trackClientSignupFail('Missing Password');
            return false;
          }
          if (!$scope.passwordStrength) {
            $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
            return false;
          }
          if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
            $scope.setFormError('Please enter a stronger password.');
            trackClientSignupFail('Weak Password');
            return false;
          }
          if ($scope.lockedPassword != $scope.passwordConfirm) {
            $scope.setFormError('Please enter matching passwords.');
            trackClientSignupFail('Passwords Do Not Match');
            return false;
          }
          if (!$scope.agreedToTerms) {
            $scope.setFormError('You must agree to the Terms of Service.');
            trackClientSignupFail('TOS Not Checked');
            return false;
          }
          return true;
        }

        /**
         * Toggles the accept terms checkbox
         * @public
         */
        $scope.toggleTerms = function() {
          $scope.agreedToTerms = !$scope.agreedToTerms;
        };

        /**
         * Check the strength of the user's password / Track events
         * @param passwordStrength {Object}
         * @public
         */
        $scope.checkStrength = function(passwordStrength) {
          $scope.passwordStrength = passwordStrength;

          // Track the time it takes the user to enter their first valid password
          analyticsPasswordMonitor.track('SetPassword', passwordStrength);
        };

        /**
         * UI - show the password strength monitor
         * @public
         */
        $scope.showPasswordStrength = function() {
          return $scope.password &&
                  $scope.password.length &&
                  $scope.passwordStrength;
        };

        /**
         * Signup server-success handler
         * @param user {Object}
         * @private
         */
        function signupSuccess(user) {
          if (!$routeParams.email || $routeParams.email != $scope.lockedEmail) {
            return $scope.$emit('SetState', 'confirmEmail');
          }
          UserAPI.login({
            email: user.username,
            password: $scope.lockedPassword
          })
          .then(function() {
            $location.search('setOtpDevice', '1');
            $location.path('/login');
          });
        }

        /**
         * Signup server-fail handler
         * @param error {Object}
         * @private
         */
        function signupFail(error) {
          Notify.error(error.error);

          // Track the server signup failure
          var metricsData = {
            // Error Specific Data
            status: error.status,
            message: error.error,
            action: 'Signup'
          };
          AnalyticsProxy.track('Error', metricsData);
        }

        /**
         * Submit the user signup form
         * @public
         */
        $scope.submitSignup = function() {
          // clear any errors
          $scope.clearFormError();
          fetchPreFilledFields();
          setLockedPassword();
          if (formIsValid()) {
            var formattedEmail = Util.Formatters.email($scope.lockedEmail);
            var newUser = {
              email: formattedEmail,
              password: SDK.passwordHMAC(formattedEmail, $scope.lockedPassword)
            };
            if (typeof($routeParams.token) !== 'undefined') {
              newUser.token = $routeParams.token;
            }
            // if there's a referral going on and the utm source and campaign aren't empty, we wanna forward that
            if ($routeParams.utm_medium === 'referral' && $routeParams.utm_source && $routeParams.utm_campaign) {
              newUser.utm_campaign = $routeParams.utm_campaign;
              newUser.utm_source = $routeParams.utm_source;
            }

            UserAPI.signup(newUser)
            .then(signupSuccess)
            .catch(signupFail);
          }
        };

        function init() {
          // init an instance of the password time-to-complete tracker
          analyticsPasswordMonitor = new AnalyticsUtilities.time.PasswordCompletionMonitor();
          if ($routeParams.email) {
            $scope.user.settings.email.email = $routeParams.email;
          }
        }
        init();

      }]
    };
  }
]);
