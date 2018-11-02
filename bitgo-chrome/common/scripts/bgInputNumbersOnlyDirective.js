angular.module('BitGo.Common.BGInputNumbersOnly', [])

.directive('bgInputNumbersOnly',['$timeout', function ($timeout) {
  return {
    require: 'ngModel',
    restrict: 'A',
    scope: {}, // note: isolate scoping allows for better component testing
    link: function (scope, element, attrs, ctrl) {
      // $setViewValue() and $render triggers the parser a second time.
      // Avoid an infinite loop by using the last known returned value
      var RETURNED_VAL;

      function inputValue(incomingVal) {
        // Also, update the last known returned value (to avoid angular infinite looping)
        var value = incomingVal.toString();
        if (value) {
          // parse out all non-digits (and possibly all but one decimal)
          if (attrs.allowDecimals === "true") {
            RETURNED_VAL = value.replace(/[^0-9\.]/g, '').replace(/(\..*)\./g,'$1');
          } else {
            RETURNED_VAL = value.replace(/[^0-9]/g, '');
          }
          // trim to maxlength
          RETURNED_VAL = RETURNED_VAL.slice(0, attrs.maxLength);
          $timeout(function() {
            ctrl.$setViewValue(RETURNED_VAL);
            ctrl.$render();
          }, 0);
          return RETURNED_VAL;
        }
      }
      // conversion "view -> model"
      ctrl.$parsers.unshift(inputValue);
    }
  };
}]);
