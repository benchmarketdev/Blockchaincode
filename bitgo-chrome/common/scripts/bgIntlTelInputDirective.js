/**
 * @ngdoc directive
 * @name bgIntlTelInput
 * @description
 * This directive creates the dropdown for choosing a country when selecting a phone number
 * It also formats the phone number entered
 * it requires ngmodel to be initialised along with it
 * @example
 *   <bg-intl-tel-input name="phone" type="phone" ng-model="user.settings.phone.phone" bg-input-validator></bg-intl-tel-input>
 */
angular.module('BitGo.Common.BGIntlTelInputDirective', [])

.directive('bgIntlTelInput',
  function () {
    return{
      replace: true,
      restrict: 'E',
      require: 'ngModel',
      template: '<input type="tel" class="inputText-input inputText-input--phoneNumber"/>',
      link: function(scope, element, attrs, ngModel){
        //Need to manually adjust the view value so it reflects in the UI
        var read = function() {
          ngModel.$setViewValue(element.intlTelInput("getNumber"));
        };
        //Set the initial value after ngmodel renders
        ngModel.$render = function() {
          element.intlTelInput("setNumber", ngModel.$modelValue || '');
        };
        element.intlTelInput({
          autoFormat: true,
          preventInvalidNumbers: true
        });
        //Listen for any changes that happen on the element
        element.on('focus blur keyup change', function() {
          scope.$apply(read);
        });

        // Always clear the error if user is selecting a flag
        angular.element('.flag-dropdown').click(function() {
          scope.$apply(function() {
            scope.$emit('SetFieldError', {
              field: 'phone',
              visibleError: false
            });
          });
        });
      }
    };
  }
);