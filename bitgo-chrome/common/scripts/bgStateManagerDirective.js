angular.module('BitGo.Common.BGStateManager', [])

/*
  BGStateManager is a module that works in conjunction with a controller
  (or directive, etc..) meant to manage multiple states of a flow in the
  app (e.g.: something like ['signup', 'confirm', 'finish']).

  A usage example:

  Sample Route: /sampleRoute
  Controller on this route: SampleController
  Need to define '$scope.state' and '$scope.viewStates' on SampleController

  <div bg-state-manager>
    <div showState('signup')>
      this shows when state is signup
      <button ng-click="next()">next</button>
    </div>
    <div showState('confirm')>
      this shows when state is confirm
      <button ng-click="prev()">back</button>
      <button ng-click="next()">next</button>
    </div>
    <div showState('finish')>
      this shows when state is finish
      <button ng-click="prev()">back</button>
    </div>
  </div>
*/
.directive('bgStateManager', [
  function() {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        function isValidState(state) {
          return $scope.viewStates.indexOf(state) > -1;
        }

        $scope.showState = function(state) {
          return state === $scope.state;
        };

        $scope.setState = function(state) {
          if (!isValidState(state)) {
            throw new Error('Invalid state');
          }
          $scope.state = state;
        };

        $scope.next = function() {
          var currentIdx = $scope.viewStates.indexOf($scope.state);
          var nextState = $scope.viewStates[currentIdx + 1];
          if (!isValidState(nextState)) {
            return;
          }
          $scope.setState(nextState);
        };

        $scope.prev = function() {
          var currentIdx = $scope.viewStates.indexOf($scope.state);
          var prevState = $scope.viewStates[currentIdx - 1];
          if (!isValidState(prevState)) {
            return;
          }
          $scope.setState(prevState);
        };

        $scope.$on('SetState', function(event, state) {
          $scope.setState(state);
        });

        // We expose this method for testing purposes
        $scope.initStateManager = function() {
          if (!$scope.viewStates || ($scope.viewStates && $scope.viewStates.length === 0)) {
            throw new Error('Directive - stateManager: expects $scope.viewStates to be set');
          }
          if (!$scope.state) {
            throw new Error('Directive - stateManager: expects $scope.state to be set');
          }
        };
        $scope.initStateManager();
      }]
    };
  }
]);
