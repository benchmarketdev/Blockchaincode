
/**
 * @ngdoc directive
 * @name servicesAgreementForm
 * @description
 * This directive manages the form to agree to a new services agreement
 * @example
 *   <div services-agreement-form></div>
 */


angular.module('BitGo.Auth.ServicesAgreementFormDirective', [])

.directive('servicesAgreementForm', ['EnterpriseAPI', 'NotifyService',
  function(EnterpriseAPI, Notify) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: ['$scope', function($scope) {
        // variable to keeps track of whether the user has agreed to the agreement
        $scope.agreeToTerms = false;
        // TODO: on service agreement updates, change the file this points to
        $scope.ServicesAgreementSource = 'marketing/templates/services_agreement_v1.html';


        /**
         * Handles submit of services agreement form
         * @public
         */
        $scope.submitTerms = function() {
          // Clear any errors
          $scope.clearFormError();
          if ($scope.agreeToTerms) {
            EnterpriseAPI.updateServicesAgreementVersion({enterpriseIds: $scope.enterprisesList})
            .then($scope.setPostauth)
            .catch(submitTermsFail);
          } else {
            $scope.setFormError('Please agree to the services agreement.');
          }
        };

        function submitTermsFail() {
          Notify.error('There was an error in updating the services agreement version. Please contact BitGo');
          // Take them to the dashboard anyway
          $scope.setPostauth();
        }

      }]
    };
  }
]);
