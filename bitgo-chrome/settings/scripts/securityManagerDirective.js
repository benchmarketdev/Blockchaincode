/**
 * @ngdoc directive
 *
 * @name securityManagerDirective
 *
 * @description
 *
 * Directive to manage the password and otp device settings
 *
 * @example
 *
 * <div security-manager-directive></div>
 */

angular.module('BitGo.Settings.SecurityManagerDirective', [])

.directive('securityManagerDirective', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$rootScope', '$scope', '$modal', '$q', 'UserAPI', 'BG_DEV', 'CacheService',
        function($rootScope, $scope, $modal, $q, UserAPI, BG_DEV, CacheService) {
        // set the security tab views
        $scope.viewStates = ['twoStepVerificationList', 'twoStepVerificationSelect', 'phoneVerification', 'addTotpDevice', 'password'];
        $scope.state = 'twoStepVerificationList';

        /**
         * Is used to check if the user should be encouraged to setup two-step verification
         * @private
         */
        function needsTwoStepVerification() {
          return ($scope.securityView === 'twoStepVerificationList' &&
                  $rootScope.currentUser.settings.otpDevices.length === 0);
        }

        /**
         * Triggers otp modal to open if user needs to otp before adding/removing a device
         * @private
         */
        function openModal(params) {
          if (!params || !params.type) {
            throw new Error('Missing modal type');
          }
          var modalInstance = $modal.open({
            templateUrl: 'modal/templates/modalcontainer.html',
            controller: 'ModalController',
            scope: $scope,
            size: params.size,
            resolve: {
              // The return value is passed to ModalController as 'locals'
              locals: function () {
                return {
                  type: params.type,
                  userAction: BG_DEV.MODAL_USER_ACTIONS.otp
                };
              }
            }
          });
          return modalInstance.result;
        }

        function getTemplate(ignoreOTP) {
          if (needsTwoStepVerification() && !ignoreOTP) {
            $scope.setTemplate('twoStepVerificationSelect');
          }
          var tplMap = {
            addTotpDevice: 'settings/templates/add-totp-device.html',
            password: 'settings/templates/password.html',
            phoneVerification: 'settings/templates/phone-verification.html',
            twoStepVerificationList: 'settings/templates/two-step-verification-list.html',
            twoStepVerificationSelect: 'settings/templates/two-step-verification-select.html'
          };
          return tplMap[$scope.securityView];
        }

        $scope.checkUnlock = function() {
          UserAPI.session()
          .then(function(session){
            if (session) {
              // if the data returned does not have an unlock object, then the user is not unlocked
              if (session.unlock) {
                return $scope.setTemplate('twoStepVerificationSelect');
              }
              $scope.openModal({ type: BG_DEV.MODAL_TYPES.otp })
              .then(function(result) {
                if (result.type === 'otpsuccess') {
                  $scope.setTemplate('twoStepVerificationSelect');
                }
              });
            }
          });
        };

        $scope.fetchTotpParams = function() {
          UserAPI.newTOTP()
          .then(function(totpUrl){
            $scope.device = { totpUrl: totpUrl };
            // on fetch success set state to 'addTotpDevice'
            $scope.setState('addTotpDevice');
          });
        };

        $scope.setTemplate = function(state, ignoreOTP) {
          $scope.securityView = state;
          $scope.templateSource = getTemplate(ignoreOTP);
        };

        // Event listeners
        var killStateWatch = $scope.$watch('state', function(state) {
          $scope.securityView = state;
          $scope.templateSource = getTemplate();
        });
      }]
    };
  }
]);
