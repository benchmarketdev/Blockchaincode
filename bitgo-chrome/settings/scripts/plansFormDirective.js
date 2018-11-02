/**
 * @ngdoc directive
 * @name settingsPlansForm
 * @description
 * Directive to manage the settings user account plans form
 * @example
 *   <div settings-plans-form></div>
 */
/**/
angular.module('BitGo.Settings.PlansFormDirective', [])

.directive('settingsPlansForm', ['$rootScope', 'BG_DEV', 'UserAPI', 'NotifyService', '$location', '$anchorScroll', 'AnalyticsProxy', 'AnalyticsUtilities',
  function($rootScope, BG_DEV, UserAPI, Notify, $location, $anchorScroll, AnalyticsProxy, AnalyticsUtilities) {
    return {
      restrict: 'A',
      require: '^?SettingsController',
      controller: ['$scope', function($scope) {

        // Will be the instance of our credit card tracking monitor
        var creditCardCompletionMonitor;

        // Bool to init the card tracking monitor only once per tab load
        var cardMonitorInitialized;

        // Holds user payment data
        $scope.cc = {
          cvc: undefined,
          expiry: undefined,
          number: undefined
        };

        // The valid user plans
        $scope.plans = BG_DEV.USER.ACCOUNT_LEVELS;

        // the user's current account plan
        $scope.userPlan = $rootScope.currentUser && $rootScope.currentUser.plan;

        // the currently selected plan
        $scope.selectedPlan = _.cloneDeep($scope.userPlan);

        // This keeps track of whether to show the success message on plan change
        $scope.confirmationState = false;

        // flag to see if plan change is in process
        $scope.inProcess = false;

        /**
        * Resets the selected plan to the user plan everytime the 'plans' section is selected
        *
        * @private
        */
        function resetSelectedPlan() {
          $scope.selectedPlan = _.cloneDeep($scope.userPlan);
        }

        /**
        * Parses the cc expiration date
        *
        * @returns { Array } ['month', 'year']
        * @private
        */
        function parseExpry() {
          if (!$scope.cc.expiry) {
            return [];
          }
          return $scope.cc.expiry.replace(/ /g,'').split('/');
        }

        /**
        * Check if the payment form is valid
        *
        * @returns { Bool }
        * @private
        */
        function formValid() {
          try {
            if (!Stripe.card.validateCardNumber($scope.cc.number)) {
              $scope.setFormError('Please enter a valid credit card number.');
              return false;
            }
            if (!$scope.cc.expiry || !Stripe.card.validateExpiry(parseExpry()[0], parseExpry()[1])) {
              $scope.setFormError('Please enter a valid expiration date.');
              return false;
            }
            if (!Stripe.card.validateCVC($scope.cc.cvc)) {
              $scope.setFormError('Please enter a valid cvc.');
              return false;
            }
            return true;
          } catch (e) {
            Notify.error("Could not validate credit card. " + e.message + ". Please refresh and try again.");
          }
        }

        /**
        * Tacks on updated stripe data on the user object as well scope variables required
        *
        * @params { object } - user settings object returned from the user
        * @private
        */
        function addStripeDataToUser(data) {
          $scope.inProcess = false;
          if (data.stripe) {
            $rootScope.currentUser.settings.stripe = data.stripe;
            $rootScope.currentUser.plan = $rootScope.currentUser.getPlan();
            $scope.userPlan = $rootScope.currentUser.plan;
            $scope.confirmationState = true;
          } else {
            throw new Error('Expected stripe data to update user');
          }
        }

        /**
        * UI - Track the user completing entrance of a valid credit card
        *
        * @private
        */
        function trackCard() {
          var evtData = {
            currentPlan: $scope.userPlan.name,
            selectedPlan: $scope.selectedPlan.name
          };
          creditCardCompletionMonitor.track('EnterCard', evtData);
        }

        /**
        * UI - Submit the user's credit card for payment
        *
        * @public
        */
        $scope.submitCard = function(planId) {
          if (formValid()) {
            var stripeData = {
              number: $scope.cc.number,
              cvc: $scope.cc.cvc,
              exp_month: parseExpry()[0],
              exp_year: parseExpry()[1]
            };
            if (planId) {
              $scope.inProcess = true;

              Stripe.card.createToken(stripeData, function(status, result) {
                if (result.error) {
                  $scope.inProcess = false;
                  Notify.error(result.error.message);
                  return;
                }
                UserAPI.payment({token: result.id}, {planId: planId})
                .then(function(data) {
                  var evtData = {
                    type: 'create',
                    billingCycle: 'monthly',
                    newPlan: $scope.selectedPlan.name
                  };
                  AnalyticsProxy.track('changePlan', evtData);
                  return addStripeDataToUser(data);
                })
                .catch(function(err) {
                  $scope.inProcess = false;
                  Notify.error(err.error);
                });
              });
            }
            else {
              throw new Error('Expected planId to submit payment');
            }
          }
        };

        /**
        * UI - Track the user's first entrance of credit card data into the form
        *
        * @public
        */
        $scope.initCardTracker = function() {
          if (cardMonitorInitialized) {
            return;
          }
          cardMonitorInitialized = true;
          trackCard();
        };

        /**
        * UI - change the plan which the user is on
        * params - {string} - The plan which to change to
        * @public
        */
        $scope.changePlan = function(planId) {
          if (!planId) {
            throw new Error('Invalid plan to change to');
          }
          $scope.inProcess = true;
          UserAPI.changeSubscription({planId: planId}, $rootScope.currentUser.settings.stripe.subscription.id)
          .then(function(data) {
            var evtData = {
              billingCycle: 'monthly',
              oldPlan: $scope.userPlan.name,
              newPlan: $scope.selectedPlan.name,
              type: $scope.isUpgrade() ? 'upgrade' : 'downgrade'
            };
            AnalyticsProxy.track('changePlan', evtData);
            return addStripeDataToUser(data);
          })
          .catch(function(err) {
            $scope.inProcess = false;
            Notify.error("There was an error in changing your plan. Please refresh and try again");
          });
        };

        /**
        * UI - Submit the user's credit card for payment
        * (not being used currently)
        * @public
        */
        $scope.deletePlan = function() {
          UserAPI.deleteSubscription($rootScope.currentUser.settings.stripe.subscription.id)
          .then(function(data) {
            var evtData = {
              type: 'delete',
              billingCycle: 'monthly',
              oldPlan: $scope.userPlan.name
            };
            AnalyticsProxy.track('changePlan', evtData);
            return addStripeDataToUser(data);
          })
          .catch(function(err) {
            $scope.inProcess = false;
            Notify.error("There was an error in downgrading your plan. Please refresh and try again");
          });
        };

        // Event Handlers
        // Watch for changes in the $scope's state and resets the selected plan when the plans section is loaded
        var killStateWatch = $scope.$watch('state', function(state) {
          if (state === 'plans') {
            init();
          }
        });

        var killCardWatcher = $scope.$watch('cc.number', function() {
          if (typeof($scope.cc.number) !== 'string' || $scope.cc.number === "") {
            return;
          }
          trackCard();
        });

        // Clean up when the scope is destroyed
        $scope.$on('$destroy', function() {
          // remove listeners
          killStateWatch();
          killCardWatcher();
        });

        function init() {
          // initialize the correct plan
          resetSelectedPlan();

          // set up credit card tracking
          creditCardCompletionMonitor = new AnalyticsUtilities.time.CreditCardCompletionMonitor();
          cardMonitorInitialized = false;
        }
        init();

      }],
      link: function(scope, ele, attrs) {

        /**
        * UI - Select a plan
        * @params {String}- Name of the plan to select
        * @public
        */
        scope.selectPlan = function(plan) {
          if (!plan) {
            throw new Error('Expect a valid plan when setting plan');
          }
          scope.confirmationState = false;
          // sroll to id of element
          $('html, body').animate({
              scrollTop: $("#plansChangeSection").offset().top
          });

          // Track the user toggling the plan
          AnalyticsProxy.track('togglePlan', {
            currentPlan:  scope.userPlan.name,
            selectedPlan: plan
          });

          // if user selects plan which is plus or pro, we try and maintain the same billing cycle as before (default is annual)
          if (plan === scope.plans.proMonthly.name || plan === scope.plans.plusMonthly.name) {
            scope.selectedPlan = scope.plans[plan + BG_DEV.USER.BILLING_CYCLE.monthly];
            return;
          }
          // if the user selects basic, we maintain the grandfather status if the user was one before
          else if (plan === scope.plans.basic.name) {
            if (_.isEqual(scope.userPlan, scope.plans.grandfathered)) {
              scope.selectedPlan = scope.plans.grandfathered;
              return;
            }
            scope.selectedPlan = scope.plans.basic;
          }
          else {
            throw new Error('Expect a valid plan when setting plan');
          }
        };

        /**
        * UI - Check if the selected plan is different from user plan
        *
        * @returns { Bool }
        * @public
        */
        scope.UserPlanDifferentFromSelectedPlan = function() {
          return !_.isEqual(scope.userPlan, scope.selectedPlan);
        };

        /**
        * UI - highlight the current plan
        *
        * @returns { Bool }
        * @public
        */
        scope.isSelectedPlan = function(plan) {
          return scope.selectedPlan.name === plan;
        };

        /**
        * UI - For choosing right button class for a particular user state
        *
        * @returns { String }
        * ''
        * @public
        */
        scope.buttonState = function(plan) {
          // check if plan is basic and change it to grandfathered if the user is grandfathered
          if ((plan === scope.plans.basic.name) &&
              (scope.userPlan.name == scope.plans.grandfathered.name)) {
            plan = scope.plans.grandfathered.name;
          }

          if (scope.isSelectedPlan(plan) && !scope.isUserPlan(plan)) {
            return "selectedNotUserPlan";
          } else if (!scope.isSelectedPlan(plan) && !scope.isUserPlan(plan)) {
            return "notSelectedNotUserPlan";
          } else if (scope.isSelectedPlan(plan) && scope.isUserPlan(plan)) {
            return "SelectedAndUserPlan";
          } else {
            return "notSelectedAndUserPlan";
          }
        };

        /**
        * UI - Change the billing of a selected plan
        *
        * @public
        */
        scope.changeBilling = function() {
          scope.selectedPlan = scope.plans[scope.selectedPlan.name + scope.billingCycle];
        };

        /**
        * UI - show if plan is user's current plan
        *
        * @returns { Bool }
        * @public
        */
        scope.isUserPlan = function(plan) {
          return scope.userPlan.name === plan;
        };

        /**
        * UI - check if the selected plan is an upgrade from the user plan
        *
        * @returns { Bool }
        * @public
        */
        scope.isUpgrade = function() {
          return scope.userPlan.level < scope.selectedPlan.level;
        };

        /**
        * UI - Take the user to learn about insurance
        *
        * @public
        */
        scope.goToViewInfo = function() {
          var evtData = {
            type: 'insurance',
            subSection: 'plans'
          };
          AnalyticsProxy.track('viewInfo', evtData);
          $location.path('/insurance');
        };

      }
    };
  }
]);
