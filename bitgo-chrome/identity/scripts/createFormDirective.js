angular.module('BitGo.Identity.CreateFormDirective', [])
/**
 * @ngdoc directive
 * @name identityCreateFormDirective
 * @description
 * Directive to set user name and phone required to proceed with verification.
 * @example
 *   <div identity-create-form></div>
 */
.directive('identityCreateForm', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      require: '^IdentityController',
      controller: ['$scope', function($scope) {

        function formIsValid() {
          if (!$scope.identity.name || $scope.identity.name === $rootScope.currentUser.settings.email.email) {
            $scope.setFormError("Please enter your legal name.");
            return false;
          }
          var phone = $scope.identity.phone;
          if (!phone) {
            $scope.setFormError("Please enter your phone number.");
            return false;
          }
          if (phone[0] !== '+') {
            phone = '+'.concat(phone);
          }
          if (!intlTelInputUtils.isValidNumber(phone)) {
            $scope.setFormError("Please enter a valid phone number.");
            return false;
          }
          if (!$scope.agree) {
            $scope.setFormError('Please agree to the terms and conditions');
            return false;
          }
          return true;
        }

        $scope.submitForm = function submitForm() {
          if (!formIsValid()) {
            return;
          }
          // Set to true when synapse iframe is set visible
          $scope.submitted = true;
          $scope.createIdentity();
        };

      }]
    };
  }
]);
