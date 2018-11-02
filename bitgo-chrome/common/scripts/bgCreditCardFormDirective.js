/**
 * @ngdoc directive
 * @name bgCreditCardFormDirective
 * @description
 * Directive to manage the credit card form
 * @example
 *   <div bg-credit-card-form></div>
 */
/**/
angular.module('BitGo.Common.BGCreditCardForm', [])

.directive('bgCreditCardForm', ['$rootScope', 'BG_DEV', '$http', '$compile', '$templateCache', 'NotifyService', '$location', 'AnalyticsUtilities',
  function($rootScope, BG_DEV, $http, $compile, $templateCache, Notify, $location, AnalyticsUtilities) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        // Will be the instance of our credit card tracking monitor
        var creditCardCompletionMonitor;

        // Bool to init the card tracking monitor only once per tab load
        var cardMonitorInitialized;

        // Holds user payment data
        $scope.cc = {
          cvc: undefined,
          expiry: undefined,
          number: undefined,
          name: undefined
        };

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
            if (!$scope.cc.name) {
              $scope.setFormError('Please provide the cardholder\'s name.');
              return false;
            }
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
            if ($scope.checkTerms && !$scope.terms) {
              $scope.setFormError('Please agree to the terms and conditions.');
              return false;
            }
            return true;
          } catch (e) {
            Notify.error("Could not validate credit card. " + e.message + ". Please refresh and try again.");
          }
        }

        /**
        * UI - Track the user completing entrance of a valid credit card
        *
        * @private
        */
        function trackCard() {
          if (!$scope.userPlan || !$scope.selectedPlan ||
              !$scope.userPlan.name || !$scope.selectedPlan.name) {
            return;
          }
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
        $scope.submitCard = function() {
          if (formValid()) {
            var stripeData = {
              name: $scope.cc.name,
              number: $scope.cc.number,
              cvc: $scope.cc.cvc,
              exp_month: parseExpry()[0],
              exp_year: parseExpry()[1]
            };
            $scope.inProcess = true;
            
            Stripe.setPublishableKey(BG_DEV.STRIPE.TEST.PUBKEY);
            Stripe.card.createToken(stripeData, function(status, result) {
              if (result.error) {
                $scope.inProcess = false;
                Notify.error(result.error.message);
                return;
              } else {
                $scope.$emit("BGCreditCardForm.CardSubmitted", result);
              }
            });
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

        var killCardWatcher = $scope.$watch('cc.number', function() {
          if (typeof($scope.cc.number) !== 'string' || $scope.cc.number === "") {
            return;
          }
          trackCard();
        });

        // Clean up when the scope is destroyed
        $scope.$on('$destroy', function() {
          // remove listeners
          killCardWatcher();
        });

        function init() {
          // set up credit card tracking
          creditCardCompletionMonitor = new AnalyticsUtilities.time.CreditCardCompletionMonitor();
          cardMonitorInitialized = false;
        }
        init();

      }],
      link: function (scope, element, attrs) {
        // if terms are added to form (note: attrs have to be lower case letters)
        if (attrs.addterms == "true") {
          scope.terms = false;
          // flag to check if terms have to be checked
          scope.checkTerms = true;
        }
      }
    };
  }
]);
