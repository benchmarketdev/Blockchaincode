/**
 * @ngdoc directive
 * @name bgTypeaheadTrigger
 * @description
 * Triggers an event emit from from a dropdown list when an item is clicked
 */
angular.module('BitGo.Common.BGTypeaheadTriggerDirective', [])

.directive('bgTypeaheadTrigger', ['$parse', '$timeout',
  function($parse, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        angular.element(elem).on('click', function(evt) {
          if (!scope.match) {
            throw new error('Expected match');
          }
          var params = {
            match: { data: scope.match.model.data }
          };
          scope.$emit('bgTypeaheadTrigger.MatchSelected', params);
          scope.$apply();
        });
      }
    };
  }
]);
