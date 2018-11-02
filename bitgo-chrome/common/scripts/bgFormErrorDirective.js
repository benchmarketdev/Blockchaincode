/*
  Notes:
  - This directive handles the display and cancellation of errors on a form
  - when added to a form element, the form's scope inherits all methods from
    this controller
*/
angular.module('BitGo.Common.BGFormError', [])

.directive('bgFormError', ['$rootScope',
  function ($rootScope) {
    return {
      restrict: 'E',
      templateUrl: '/common/templates/formerror.html',
      controller: ['$scope', function($scope) {
        // error shown in the markup
        $scope.formError = null;

        $scope.setFormError = function(msg) {
          if (typeof(msg) !== 'string') {
            throw new Error('Expected string');
          }
          $scope.formError = msg || 'This form has an invalid field.';
        };

        $scope.clearFormError = function() {
          $scope.formError = null;
        };

        // listen for changes to the formError object and clear
        // the error if it no longer remains
        var killErrorWatch = $scope.$watch('formError', function(error) {
          if (!error) {
            $scope.clearFormError();
          }
        });

        // Clean up the listeners when the scope goes away
        $scope.$on('$destroy', function() {
          killErrorWatch();
        });
      }]
    };
  }
]);
