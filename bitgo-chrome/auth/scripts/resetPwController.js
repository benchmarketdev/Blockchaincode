angular.module('BitGo.Auth.ResetPwController', [])

.controller('ResetPwController', ['$scope', '$rootScope', '$location', 'NotifyService', 'UtilityService', 'UserAPI', 'BG_DEV', 'SDK',
  function($scope, $rootScope, $location, NotifyService, UtilityService, UserAPI, BG_DEV, SDK) {

    // Holds params relevant to resetting the user pw
    var resetParams;

    // object to handle the form data
    $scope.form = null;
    // mock user to hold data for logging in if they successfully update their pw
    $scope.user = null;
    // object to hold the scope's password strength indicator when set
    // from a child passwordStrength directive
    $scope.passwordStrength = null;

    /**
     * Validates the form state before submitting things
     *
     * @private
     */
    function formIsValid() {
      if (!$scope.form.password) {
        $scope.setFormError('Please enter a strong password.');
        return false;
      }
      if (!$scope.passwordStrength) {
        $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
        return false;
      }
      if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
        $scope.setFormError('Please enter a stronger password.');
        return false;
      }
      if ($scope.form.password != $scope.form.passwordConfirm) {
        $scope.setFormError('Please enter matching passwords.');
        return false;
      }
      return true;
    }

    /**
     * Updates the scope password strength variable to be represented in the UI
     *
     * @public
     */
    $scope.checkStrength = function(passwordStrength) {
      $scope.passwordStrength = passwordStrength;
    };

    /**
     * Show the password strength indicator in the UI
     *
     * @public
     */
    $scope.showPasswordStrength = function() {
      return $scope.form.password &&
              $scope.form.password.length &&
              $scope.passwordStrength;
    };

    /**
     * Reset the user's password
     *
     * @public
     */
    $scope.submitReset = function() {
      // clear any errors
      $scope.clearFormError();

      if (formIsValid()) {
        var params = {
          code: resetParams.code,
          email: resetParams.email,
          type: 'forgotpassword',
          password: SDK.passwordHMAC(resetParams.email, $scope.form.password)
        };

        UserAPI.resetPassword(params)
        .then(function() {
          NotifyService.success('Your password was successfully updated. Please log in to recover your wallets.');

          // update the $rootScope user's email to prepopulate the form
          $scope.user.settings.email.email = resetParams.email;

          $location.path('/login');
        })
        .catch(function(error) {
          NotifyService.error('There was an error updating your password. Please refresh the page and try again.');
        })
        .finally(function() {
          // Wipe the resetParams data from the config
          BitGoConfig.preAppLoad.clearQueryparams();
        });
      }
    };

    /**
     * Verify that we have the correct params
     *
     * @private
     */
    function initResetPwParams() {
      /**
       * Verify we have the correct params
       *
       * @private
       */
      function verifyParams(params) {
        if (!params || !params.email || !params.code) {
          throw new Error('Missing url params');
        }
        if (!UtilityService.Validators.emailOk(params.email)) {
          throw new Error('Invalid email in params');
        }
      }

      // Grab the query params off the config object; these were stripped from the
      // URL before the app loaded and appended to this config object
      resetParams = BitGoConfig.preAppLoad.queryparams;
      verifyParams(resetParams);
    }

    /**
     * Init the reset controller
     *
     * @private
     */
    function init() {
      $rootScope.setContext('resetPassword');

      // verify the correct information was gathered before the app loaded
      // (we need a code and an email to have been plucked from the URL
      // before the app loaded)
      initResetPwParams();

      $scope.user = $rootScope.currentUser;
      $scope.form = {
        password: null,
        passwordConfirm: null
      };
    }
    init();
  }
]);
