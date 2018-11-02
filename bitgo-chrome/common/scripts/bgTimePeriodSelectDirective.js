/*
  Notes:
  - This directive is a selector which shows the current time period and, based on a
  range of time periods, allows someone to advance and go back to dates within
  the range provided
*/
angular.module('BitGo.Common.BGTimePeriodSelect', [])

.directive('bgTimePeriodSelect', ['$rootScope',
  function ($rootScope) {
    return {
      restrict: 'E',
      templateUrl: '/common/templates/timeperiodselect.html',
      scope: {
        periods: '=periods',
        currentPeriod: '=currentPeriod',
        onChange: '&onChange'
      },
      controller: ['$scope', function($scope) {
        var currentPeriodIdx = 0;

        // Watch for the time periods to become available on the scope
        $scope.$watch('periods', function(periods) {
          currentPeriodIdx = periods.length-1;
          $scope.currentPeriod = periods[currentPeriodIdx];
        });

        // Advance to the next time period
        $scope.nextPeriod = function() {
          var nextPeriod = $scope.periods[currentPeriodIdx + 1];
          if (nextPeriod) {
            currentPeriodIdx++;
            $scope.currentPeriod = nextPeriod;
          }
        };

        // Go to previous time period
        $scope.prevPeriod = function() {
          var prevPeriod = $scope.periods[currentPeriodIdx - 1];
          if (prevPeriod) {
            currentPeriodIdx--;
            $scope.currentPeriod = prevPeriod;
          }
        };

        // UI logic to show the button that allows user to go to next period
        $scope.showNext = function() {
          return !!$scope.periods[currentPeriodIdx + 1];
        };

        // UI logic to show the button that allows user to go to previous period
        $scope.showPrev = function() {
          return !!$scope.periods[currentPeriodIdx - 1];
        };
      }]
    };
  }
]);
