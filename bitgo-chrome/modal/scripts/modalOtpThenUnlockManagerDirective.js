/**
 * @ngdoc directive
 * @name modalOtpThenUnlockManager
 * @description
 * Manages the modal flow for unlocking then otp'ing a user
 * Requires: bg-state-manager
 * @example
 *   <div modal-otp-then-unlock-manager bg-state-manager></div>
 */
angular.module('BitGo.Modals.ModalOtpThenUnlockManagerDirective', [])

.directive('modalOtpThenUnlockManager', [
  function() {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', '$timeout', function($scope, $timeout) {
        // valid view states
        $scope.viewStates = ['otp', 'password'];
        // form input fields across all states in the modal flow
        $scope.data = null;

        // Event Listeners (listen to advance/kill the flow)
        // Advance to the password step when the user otps successfully
        var killOtpSuccessListener = $scope.$on('modalOtpForm.OtpSuccess',
          function(evt, data) {
            if (!data.otp) {
              throw new Error('missing otp');
            }
            $scope.data.otp = data.otp;
            $scope.setState('password');
          }
        );

        // Kill the flow when the user successfully decrypts their xprv
        var killPwVerifySuccessListener = $scope.$on('modalPasswordForm.PasswordVerifySuccess',
          function(evt, data) {
            if (!data.password) {
              throw new Error('missing password');
            }
            $scope.data.password = data.password;
            $scope.$emit('modalOtpThenUnlockManager.OtpAndUnlockSuccess', $scope.data);
          }
        );

        // Clean up the scope listeners
        $scope.$on('$destroy', function() {
          killOtpSuccessListener();
          killPwVerifySuccessListener();
        });

        function init() {
          $scope.state = $scope.initialState;
          // All fields anticipated during this flow
          $scope.data = {
            password: '',
            otp: ''
          };
        }
        init();
      }]
    };
  }
]);
