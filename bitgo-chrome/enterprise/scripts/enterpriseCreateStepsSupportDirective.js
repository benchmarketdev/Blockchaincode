/**
 * @ngdoc directive
 * @name enterpriseCreateStepsSupport
 * @description
 * Directive to manage the org creation support step
 * Parent Controller is EnterpriseCreateController
 * @example
 *   <div enterprise-create-steps-support></div>
 */

angular.module('BitGo.Enterprise.EnterpriseCreateStepsSupportDirective', [])

.directive('enterpriseCreateStepsSupport', ['$rootScope', 'AnalyticsProxy', 'BG_DEV',
  function($rootScope, AnalyticsProxy, BG_DEV) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        // The valid user plans
        $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
        // if the plan was pre-selected
        if ($scope.inputs.enterpriseSupportPlan) {
          $scope.selectedPlanId = $scope.inputs.enterpriseSupportPlan.planId;
        } else {
          // default selected plan to professional
          $scope.selectedPlanId = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS.OrgProMonthly.planId;
        }
        /**
         * Go Back to the labelling of the org
         * @public
         */
        $scope.goBack = function() {
          AnalyticsProxy.track('CreateOrganizationSupportBack');
          $scope.setState('label');
        };

        /**
         * Advance the org creation flow by choosing support plan
         *
         * @public
         */
        $scope.advanceSupport = function() {
         
            // track the successful support plan choosing
            var metricsData = {
              enterpriseSupportPlan: BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS[$scope.selectedPlanId]
            };
            AnalyticsProxy.track('ChooseSupportPlan', metricsData);
            $scope.inputs.enterpriseSupportPlan = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS[$scope.selectedPlanId];
            // advance the form
            $scope.setState('payment');
        };

      }]
    };
  }
]);
