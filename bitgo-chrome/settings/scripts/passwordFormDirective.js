angular.module('BitGo.Settings.PasswordFormDirective', [])

/**
 * Directive to manage the settings password form
 */
.directive('settingsPwForm', ['$rootScope', 'UserAPI', 'UtilityService', 'NotifyService', 'RequiredActionService', 'BG_DEV', 'SDK',
  function($rootScope, UserAPI, Util, Notify, RequiredActionService, BG_DEV, SDK) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        var validate = Util.Validators;

        // object containing the strength of the user's new password
        $scope.passwordStrength = null;
        // If the user has a weak login password, show the warning
        $scope.showWeakPasswordWarning = false;

        function formIsValid() {
          if (!$scope.settings.local) {
            $scope.setFormError('You must enter passwords in order to change your password.');
            return false;
          }
          if (!$scope.settings.local.oldPassword) {
            $scope.setFormError('Please enter your existing password.');
            return false;
          }
          if (!$scope.settings.local.newPassword) {
            $scope.setFormError('Please enter new password.');
            return false;
          }
          if (!$scope.settings.local.newPasswordConfirm) {
            $scope.setFormError('Please confirm new password.');
            return false;
          }
          if ($scope.settings.local.newPassword !== $scope.settings.local.newPasswordConfirm) {
            $scope.setFormError('Please enter matching passwords.');
            return false;
          }
          if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
            $scope.setFormError('Please enter a stronger password.');
            return false;
          }
          return true;
        }

        $scope.hasChanges = function() {
          if (!$scope.settings || !$scope.settings.local) {
            return false;
          }
          if ($scope.settings.local.oldPassword && $scope.settings.local.newPassword && $scope.settings.local.newPassword == $scope.settings.local.newPasswordConfirm) {
            return true;
          }
          return false;
        };

        function resetForm() {
          $scope.formError = null;
          $scope.settings.local.newPassword = null;
          $scope.settings.local.newPasswordConfirm = null;
          $scope.settings.local.oldPassword = null;
          $scope.passwordStrength = null;
        }

        function onGetEncryptedFail(error) {
          if (Util.API.isOtpError(error)) {
            $scope.openModal()
            .then(function(data) {
              if (data.type === 'otpsuccess') {
                $scope.savePw();
              }
            });
          } else {
            Notify.error(error.error);
          }
        }

        function savePwSuccess(settings) {
          // If the user was upgrading a legacy weak password as a result of
          // a required action, clear it out now
          if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
            RequiredActionService.removeAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
            $scope.showWeakPasswordWarning = false;
          }
          // Reset the form
          resetForm();
          return Notify.success('Your password has been successfully updated');
        }

        // Function to verify if the passcode the user put in is valid
        function checkPasscode(password) {
          return UserAPI.verifyPassword({password: password});
        }

        // Decrypt a keychain private key
        function decryptXprv(encryptedXprv, passcode) {
          try {
            var xprv = SDK.decrypt(passcode, encryptedXprv);
            return xprv;
          } catch (e) {
            return undefined;
          }
        }

        function decryptThenReencrypt(encrypted, oldRawPassword, newRawPassword) {
          if(!encrypted.keychains) {
            return {};
          }
          var newKeychains = {};
          _.forOwn(encrypted.keychains, function(encryptedXprv, xpub) {
            var xprv = decryptXprv(encryptedXprv, oldRawPassword);
            if (xprv) {
              // reencrypt with newpassword
              newKeychains[xpub] = SDK.encrypt(newRawPassword, xprv);
            } else {
              // since we can't decrypt this, leave it untouched
              newKeychains[xpub] = encryptedXprv;
            }
          });
          return newKeychains;
        }

        $scope.savePw = function() {
          if (formIsValid()) {
            var oldRawPassword = $scope.settings.local.oldPassword;
            var newRawPassword = $scope.settings.local.newPassword;
            var oldPassword = SDK.passwordHMAC($scope.settings.username, oldRawPassword);
            var newPassword = SDK.passwordHMAC($scope.settings.username, newRawPassword);

            checkPasscode(oldRawPassword)
            .then(function() {
              return UserAPI.getUserEncryptedData();
            })
            .then(function(encrypted) {
              var keychains = decryptThenReencrypt(encrypted, oldRawPassword, newRawPassword);
              return {
                keychains: keychains,
                version: encrypted.version,
                oldPassword: oldPassword,
                password: newPassword
              };
            })
            .then(function(params) {
              return UserAPI.changePassword(params);
            })
            .then(savePwSuccess)
            .catch(onGetEncryptedFail);
          }
        };

        $scope.checkStrength = function(passwordStrength) {
          $scope.passwordStrength = passwordStrength;
        };

        $scope.showPasswordStrength = function() {
          var local = $scope.settings && $scope.settings.local;
          return local && local.newPassword &&
                  local.newPassword.length && $scope.passwordStrength;
        };

        function init() {
          // Check if the user has a weak legacy password upgrade action
          // that needs to be taken
          if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
            $scope.showWeakPasswordWarning = true;
          }
          $scope.formError = null;
        }
        init();

      }]
    };
  }
]);
