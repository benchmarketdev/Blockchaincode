 /**
 * @ngdoc directive
 * @name bgOtpDevicesDirective
 * @description
 * Directive to provide otp information on scope
 * @example
 * <div bg-otp-devices></div>
 */

angular.module('BitGo.Common.BGOtpDevicesDirective', [])

.directive('bgOtpDevices', ['$rootScope', '$modal', '$location', '$q', 'BG_DEV', 'UtilityService', 'NotifyService', 'AnalyticsProxy', 'UserAPI', 'CacheService',
  function($rootScope, $modal, $location, $q, BG_DEV, Util, Notify, AnalyticsProxy, UserAPI, CacheService) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // set two factor auth methods
        $scope.twoFactorMethods = ['totp', 'yubikey', 'authy'];
        // set Google Authenticator to be the default
        $scope.twoFactorMethod = 'totp';
        // Cache setup
        var unlockTimeCache = CacheService.getCache('unlockTime') || new CacheService.Cache('localStorage', 'unlockTime', 120 * 60 * 1000);

        /**
          *  UI - verifies if a method is the currently selected Otp method
          *  @public
          */
        $scope.isTwoFactorMethod = function(method) {
          return method === $scope.twoFactorMethod;
        };

        /**
          *  UI - sets the current Otp method on the scope
          *  @public
          */
        $scope.setTwoFactorMethod = function(method) {

          $scope.initFormFields();
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
          *  UI - retrieves relevant params from scope and returns a params object
          *  @public
          */
        $scope.userHasPhone = function () {
          if ($rootScope.currentUser.settings.phone.phone) {
            return true;
          }
          return false;
        };

        $scope.getOtpParams = function(otpDeviceType) {
          switch(otpDeviceType) {

            case 'totp':
              return {
                type: 'totp',
                otp: $scope.device.otpCode,
                hmac: $scope.device.totpUrl.hmac,
                key: $scope.device.totpUrl.key,
                label: 'Google Authenticator'
              };

            case 'yubikey':
              return {
                type: 'yubikey',
                otp: $scope.device.otpCode,
                label: $scope.device.otpLabel
              };

            case 'authy':
              return {
                type: 'authy',
                otp: $scope.device.otpCode,
                phone: $rootScope.inputPhone,
                label: 'Authy'
              };

            default:
             return null;
          }
        };

        /**
         * Sets the user on the otp device list page after a removal or addition of an otp device
         */
        $scope.refreshOtpDevices = function() {
          $scope.getSettings();
        };

        /**
         * Initializes form fields that may contain user input
         * @public
         */
        $scope.initFormFields = function(action) {
          $scope.device = {};
          $scope.formError = null;
          $scope.twoFactorMethod = 'totp';

          if (action === 'added') {
            $scope.device.added = true;
          }

          if (action === 'removed') {
            $scope.device.removed = true;
          }

        };

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

        function handleAddDeviceSuccess() {
          if ($rootScope.currentUser.settings.otpDevices.length === 0) {
            if (unlockTimeCache.get('unlockTime')) {
              unlockTimeCache.remove('unlockTime');
            }
          }
          $scope.initFormFields('added');
          $scope.setTemplate('twoStepVerificationList', true);
          Notify.success('Two-step verification device successfully added');
        }

        function handleRemoveDeviceSuccess() {
          $scope.initFormFields('removed');
          $scope.setTemplate('twoStepVerificationList');
          Notify.success('Two-step verification device successfully removed');
        }

        // Set user to the twoStepVerificationSelect page
        $scope.setTwoStepVerificationSelect = function() {
          $scope.initFormFields();
          $scope.setState('twoStepVerificationSelect');
          $scope.setTwoFactorMethod('totp');
        };

       /**
         * Handles error states associated with attempting to remove a device
         * @private
         */
        function handleRemoveDeviceError(error, params) {
          if (Util.API.isOtpError(error)) {
            // If the user needs to OTP, use the modal to unlock their account
            return openModal({ type: BG_DEV.MODAL_TYPES.otp })
            .then(function(result) {
              if (result.type === 'otpsuccess') {
                // automatically resubmit the otpDeviceId on modal close
                $scope.removeDevice(params.id);
              }
            });
          }
          // Otherwise just display the error to the user
          Notify.error('This device has already been removed');
        }

      /**
         * Handles error states associated with attempting to add a device
         * @private
         */
        function handleAddDeviceError(error) {
          if (error.message === 'device is already registered') {
            return Notify.error('This device is already registered');
          }
          return Notify.error('Please enter a valid code');
        }

        function setPhoneVerificationState() {
          $rootScope.inputPhone = $scope.device.inputPhone;
          return $scope.setState('phoneVerification');
        }

        function phoneIsValid() {
          return Util.Validators.phoneOk($scope.device.inputPhone);
        }

        $scope.setPhoneVerification = function() {

          if ($scope.device.inputPhone === $scope.user.getPhone()) {
            return $scope.setFormError('This phone is already registered');
          }

          if (!phoneIsValid()) {
            return $scope.setFormError('Invalid phone number');
          }

          // set sendOTP params
          var params = {
            phone:  $scope.device.inputPhone
          };
          return UserAPI.sendOTP(params)
          .then(setPhoneVerificationState());
        };

        $scope.removeDevice = function(otpDeviceId) {
            if (!otpDeviceId) {
              return Notify.error('There was an error removing your device.  Please refresh the page and try again.');
            }

            var params = { id: otpDeviceId };

            return UserAPI.removeOTPDevice(params)
            .then(function(data) {
              $scope.getSettings();
            })
            .then(function(data) {
              handleRemoveDeviceSuccess();
            })
            .catch(function(error) {
              handleRemoveDeviceError(error, params);
            });
        };

        $scope.unlockThenAddOtpDevice = function() {
          return UserAPI.unlock()
          .then(function(res) {
            return UserAPI.addOTPDevice($scope.params);
          })
          .then(function(res) {
            $scope.refreshOtpDevices();
          })
          .then(handleAddDeviceSuccess)
          .catch(function(error) {
            handleAddDeviceError(error);
          });
        };

        $scope.addOTPDevice = function(otpDeviceType) {
          // retrieve the params set to the scope form fields
          $scope.params = $scope.getOtpParams(otpDeviceType);
          // ensure that the otp device params were retrieved from scope
          if(otpDeviceType === null || !$scope.params) {
            return Notify.error('There was an error adding your device. Please refresh the page and try again.');
          }
          // if user is shown the select otp device view initially
          // will need an unlock, prior to adding an otp device
          if ($rootScope.currentUser.settings.otpDevices.length === 0) {
            return $scope.unlockThenAddOtpDevice();
          }
          return UserAPI.addOTPDevice($scope.params)
          .then(function(res) {
            $scope.refreshOtpDevices();
          })
          .then(handleAddDeviceSuccess)
          .catch(function(error) {
            handleAddDeviceError(error);
          });
        };

        $scope.device = {};
      }]
    };
  }
]);

