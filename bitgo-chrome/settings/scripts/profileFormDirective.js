/**
 * @ngdoc directive
 * @name settingsProfileFormDirective
 * @description
 * Directive to manage the user settings. (delete and rename)
 * @example
 *   <div settings-profile-form></div>
 */

angular.module('BitGo.Settings.ProfileFormDirective', [])

/**
 * Directive to manage the settings about form
 */
    .directive('settingsProfileForm', ['$q', '$rootScope', '$location', '$modal', 'UserAPI', 'UtilityService', 'NotifyService', 'BG_DEV', 'WalletsAPI', 'AnalyticsProxy',
    function($q, $rootScope, $location, $modal, UserAPI, Util, Notify, BG_DEV, WalletsAPI, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        var validate = Util.Validators;

        $scope.settings = $rootScope.currentUser.settings;

        function formIsValid() {
          if (!$scope.settings.name.full) {
            $scope.setFormError('Please enter a name.');
            return false;
          }
          return true;
        }

        function onSaveAboutSuccess(settings) {
          $scope.getSettings();
        }

        function onSaveAboutFail(error) {
          if (Util.API.isOtpError(error)) {
            $scope.openModal()
            .then(function(data) {
              if (data.type === 'otpsuccess') {
                $scope.saveAboutForm();
              }
            })
            .catch(unlockFail);
          } else {
            Notify.error(error.error);
          }
        }

        function onLogoutSuccess() {
          $location.path('/login');
        }

        function logoutUser() {
          return UserAPI.logout();
        }

        $scope.needsIdentityVerification = function() {
          return !(($rootScope.currentUser.settings || {}).identity || {}).verified;
        };

        $scope.goToIdentityVerification = function() {
          $location.path('/identity/verify');
        };

        $scope.hasChanges = function() {
          if (!$scope.settings || !$scope.localSettings) {
            return false;
          }
          if (!_.isEqual($scope.localSettings.name, $scope.settings.name)) {
            return true;
          }
          if ($scope.localSettings.timezone !== $scope.settings.timezone) {
            return true;
          }
          return false;
        };

        /**
         *  Saves changes to the about form
         *  @private
         */
        $scope.saveAboutForm = function() {
          // clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            var newSettings = {
              otp: $scope.otp,
              settings: {
                name: {
                  full: $scope.settings.name.full
                },
                // cuts of GMT (offset) value from the string and stores only city.name
                timezone: $scope.settings.timezone
              }
            };
            $scope.saveSettings(newSettings)
            .then(onSaveAboutSuccess)
            .catch(onSaveAboutFail);
          }
        };

        /**
         * Modal - Open a modal for user deactivation
         * @private
         */
        function openModal(params) {
          var modalInstance = $modal.open({
            templateUrl: 'modal/templates/modalcontainer.html',
            controller: 'ModalController',
            scope: $scope,
            //            size: size,
            resolve: {
              // The return value is passed to ModalController as 'locals'
              locals: function () {
                return {
                  userAction: BG_DEV.MODAL_USER_ACTIONS.deactivationConfirmation,
                  type: params.type
                };
              }
            }
          });
          return modalInstance.result;
        }

        /**
        * Called when the user confirms deactivation
        *
        * @private
        */
        $scope.confirmDeactivate = function () {
          var userCacheEmpty = _.isEmpty(WalletsAPI.getAllWallets(true));
          if (!userCacheEmpty) {
            Notify.error('Please remove all wallets before deactivating account.');
            return false;
          } else {
            openModal({type: BG_DEV.MODAL_TYPES.deactivationConfirmation});
          }
        };
      }]
    };
  }
]);
