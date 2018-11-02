/**
 * @ngdoc directive
 * @name enterpriseBillingFormDirective
 * @description
 * Directive to manage billing information for enterprises
 * @example
 *   <div enterprise-settings-billing></div>
 */
/**/
angular.module('BitGo.Enterprise.EnterpriseSettingsBillingDirective', [])

.directive('enterpriseSettingsBilling', ['BG_DEV', '$rootScope', 'EnterpriseAPI', 'NotifyService',
  function(BG_DEV, $rootScope, EnterpriseAPI, Notify) {
    return {
      restrict: 'A',
      require: '^EnterpriseSettingsController',
      controller: ['$scope', function($scope) {
        $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
        // hardcoded now but this could change according to enterprise
        $scope.userCost = $scope.enterpriseUsers.count * 30;

        $scope.viewStates = ['showExistingCard', 'addNewCard'];
        $scope.state = null;

        /**
        * Update the billing info for the enteprise after getting a payment id from stripe
        * @public
        */
        $scope.$on("BGCreditCardForm.CardSubmitted", function(evt, result) {

          if (!result.id) {
            throw new Error('Error handling Stripe result');
          }
          EnterpriseAPI.updateEnterpriseBilling({
            cardToken: result.id,
            enterpriseId: $rootScope.enterprises.current.id
          })
          .then(function(newEnterprise) {
            $scope.state = 'showExistingCard';
            // check if payment existed before and present notification accordingly
            if ($rootScope.enterprises.current.hasPaymentOnFile()) {
              Notify.success("Your credit card was replaced");
            } else {
              Notify.success("A new credit card was added to the account");
            }
            // Tack on payment info onto the enterprise
            $rootScope.enterprises.current.customerData = newEnterprise.customerData;
            $scope.inProcess = false;
          })
          .catch(function(err) {
            $scope.inProcess = false;
            Notify.error(err.error);
          });
        });

        function init() {
          // Init the state based on whether the enterprise has a card on record or not
          if ($rootScope.enterprises.current.hasPaymentOnFile()) {
            $scope.state = 'showExistingCard';
          } else {
            $scope.state = 'addNewCard';
          }
        }

        init();
      }]
    };
  }
]);
