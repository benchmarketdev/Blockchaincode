/**
 * @ngdoc directive
 * @name enterpriseSettingsSupport
 * @description
 * Handles the addition and removal of admin users on the enterprise
 * @example
 * <div enterprise-settings-support>
 * </div>
 */
angular.module('BitGo.Enterprise.EnterpriseSettingsSupportDirective', [])

.directive('enterpriseSettingsSupport', ['$rootScope', 'BG_DEV', 'EnterpriseAPI', 'NotifyService',
  function($rootScope, BG_DEV, EnterpriseAPI, Notify) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        // The valid user plans
        $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
        // check if the current org plan is valid
        if (!_.has($scope.plans, $rootScope.enterprises.current.supportPlan)) {
          //default to basic
          $rootScope.enterprises.current.supportPlan = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS.OrgBasicMonthly.planId;
        }
        // default selected plan to current plan
        $scope.selectedPlanId = $scope.plans[$rootScope.enterprises.current.supportPlan].planId;
        // flag to keep track of whether a new plan is selected
        $scope.newPlanSelected = false;
        // flag to decide whether to show confirmation state
        $scope.confirmationState = false;

        /**
        * Gets called when the user makes a change in plan selection
        */
        $scope.onSelectSupportPlan = function() {
          $scope.confirmationState = false;
          $scope.newPlanSelected = false;
          //if selected support plan is different from current support plan, show submit button and scroll to bottom
          if ($scope.selectedPlanId !== $scope.plans[$rootScope.enterprises.current.supportPlan].planId) {
            $scope.newPlanSelected = true;
            $('html, body').animate({
              scrollTop: $(document).height()
            });
          }
        };

        /**
        * logic to show 'upgrade' or 'downgrade' based on what the user is doing
        * params {string} the planId with which compare the users current plan
        */
        $scope.isUpgrade = function(planId) {
          if(!planId) {
            throw new Error('isUpgrade requires planId');
          }
          return $scope.plans[$rootScope.enterprises.current.supportPlan].level < $scope.plans[planId].level;
        };

        /**
        * Function to change support plan
        */
        $scope.submitSupportPlan = function() {
          // if there is no card on file (for old enterprises) -> throw error
          if (!$rootScope.enterprises.current.hasPaymentOnFile()) {
            Notify.error("Please add a credit card before changing support plan");
            return;
          }
          var params = {
            enterpriseId: $rootScope.enterprises.current.id,
            supportPlan: $scope.selectedPlanId
          };
          EnterpriseAPI.updateEnterpriseBilling(params)
          .then(function(data) {
            $scope.confirmationState = true;
            // update the users support plan
            $rootScope.enterprises.current.supportPlan = data.supportPlan;
          })
          .catch(Notify.errorHandler);
        };

        function init() {
          // if they are legacy users switch them over to custom
          if ($rootScope.enterprises.current.supportPlan === BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS.external.planId) {
            $scope.selectedPlanId = $scope.plans.custom.planId;
          }
        }

        init();
      }]
    };
  }
]);
