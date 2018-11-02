angular.module('BitGo.Common.BGFocusWhen', [])

/**
 * Directive to bring focus to an input based on the truthiness of a
 * condition.
 */
.directive('bgFocusWhen', ['$parse', '$timeout',
  function($parse, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        scope.$watch('state', function (newValue, oldValue, scope) {
          // The focusWhen attribute can either be a value or a function,
          // and we will evaluate its truth to determine whether or not to focus
          var focusHandler = $parse(attrs.bgFocusWhen);
          // invoke it passing the scope as the context
          var shouldFocus = focusHandler(scope);
          if (shouldFocus) {
            // ensure the dom is available - this is primarily an issue
            // when using bootstrap/js tabs
            $timeout(function() {
              if (elem) {
                angular.element(elem).focus();
              }
            }, 250);
          } else {
            $timeout(function() {
              if (elem) {
                angular.element(elem).blur();
              }
            }, 250);
          }
        });
      }
    };
  }
]);
