/**
 * @ngdoc directive
 * @name matchwalletWidget
 * @description
 * The info box on the enterprise page that links to the user's match wallet.
 * @example
 * <div matchwallet-widget>
 *   <a ng-click="goToMatchwallet()">Invite</a>
 * </div>
 */
angular.module('BitGo.Enterprise.MatchwalletWidgetDirective', [])

.directive('matchwalletWidget', ['$rootScope', 'MatchwalletAPI', 'AnalyticsProxy', 'UtilityService',
  function($rootScope, MatchwalletAPI, AnalyticsProxy, UtilityService) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        var onMatchwalletCreateFailure = UtilityService.API.promiseErrorHelper();
        var onMatchwalletCreateSuccess = function(matchwallet) {
          AnalyticsProxy.track('create', { type: 'matchwallet', invitation: !!$rootScope.invitation });
          MatchwalletAPI.setCurrentMatchwallet(matchwallet);
        };

        // Matchwallet template helpers
        $scope.canSendInvites = function canSendInvites() {
          if ($rootScope.enterprises && $rootScope.enterprises.current &&
              $rootScope.enterprises.current.isPersonal) {
            return MatchwalletAPI.canSendInvites();
          }
        };

        // Go to bitgo rewards wallt
        $scope.goToMatchwallet = function() {
          AnalyticsProxy.track('click', { type: 'matchwallet', invitation: !!$rootScope.invitation });
          // create a matchwallet if none exists
          if (!$rootScope.matchwallets || _.isEmpty($rootScope.matchwallets.all)) {
            return MatchwalletAPI.createMatchwallet()
            .then(onMatchwalletCreateSuccess)
            .catch(onMatchwalletCreateFailure);
          }
          // Get most recently created rewards wallet
          var lastMatchwallet = _.findLast($rootScope.matchwallets.all);
          MatchwalletAPI.setCurrentMatchwallet(lastMatchwallet);
        };

      }]
    };
  }
]);
