/**
 * @ngdoc directive
 * @name bgFocusUI
 * @description
 * Directive to highlight styled select tags when in focus
 * @example
 *   <select bg-focus-ui></select>
 */
angular.module('BitGo.Common.BGFocusUiDirective', [])

.directive('bgFocusUi', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        $scope.highlightParent = function (ev) {
          angular.element(ev.target).parent().addClass('highlight');
        };

        $scope.removeHighlight = function (ev) {
          angular.element(ev.target).parent().removeClass('highlight');
        };

      }]
    };
  }
]);
