/**
 * @ngdoc directive
 * @name EnterpriseCreateStepsBillingDirective
 * @description
 * Directive to manage the org creation billinb step
 * Parent Controller is EnterpriseCreateController
 * @example
 *   <div enterprise-create-steps-billing></div>
 */

angular.module('BitGo.Enterprise.EnterpriseCreateStepsBillingDirective', [])

.directive('enterpriseCreateStepsBilling', ['$rootScope', 'AnalyticsProxy', 'BG_DEV', 'EnterpriseAPI', '$location', 'NotifyService', 'EnterpriseModel',
  function($rootScope, AnalyticsProxy, BG_DEV, EnterpriseAPI, $location, Notify, EnterpriseModel) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        /**
         * Go Back to choosing support plan of the org
         * @public
         */
        $scope.goBack = function() {
          AnalyticsProxy.track('CreateOrganizationBillingBack');
          $scope.setState('support');
        };

        /**
        * Add enterprise after getting new credit card info
        *
        * @public
        */
        var killCreditCardsListener = $scope.$on("BGCreditCardForm.CardSubmitted", function(evt, result) {
          if (!result.id) {
            throw new Error('Error handling Stripe result');
          }
          EnterpriseAPI.addEnterprise({
            token: result.id,
            name: $scope.inputs.enterpriseLabel,
            supportPlan: $scope.inputs.enterpriseSupportPlan.planId
          })
          .then(function(enterpriseData) {
            AnalyticsProxy.track('OrganizationCreated');
            $scope.inProcess = false;
            var enterprise = new EnterpriseModel.Enterprise(enterpriseData);
            // add the enterprise onto the user object
            if (!$rootScope.currentUser.settings.enterprises) {
              $rootScope.currentUser.settings.enterprises = [];
            }
            $rootScope.currentUser.settings.enterprises.push({id: enterprise.id});
            // add the enterprise to rootscope and redirect to new dashboard
            $rootScope.enterprises.all[enterprise.id] = enterprise;
            EnterpriseAPI.setCurrentEnterprise(enterprise);
            $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
          })
          .catch(function(err) {
            $scope.inProcess = false;
            Notify.error(err.error);
          });
        });

        // Clean up the listeners -- helps decrease run loop time and
        // reduce liklihood of references being kept on the scope
        $scope.$on('$destroy', function() {
          killCreditCardsListener();
        });

      }]
    };
  }
]);
