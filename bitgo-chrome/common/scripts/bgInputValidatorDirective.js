angular.module('BitGo.Common.BGInputValidator', [])

/**
 * Helps with determining state of the input
 */
.directive('bgInputValidator', ['SDK',
  function(SDK) {
    return {
      restrict: 'A',
      require: '^ngModel',
      controller: ['$scope', function($scope) {
        $scope.$on('SetFieldError', function(event, data) {
          var err = data.field;
          $scope[err + 'Error'] = data.visibleError;
        });
      }],
      link: function(scope, elem, attrs, ngModel) {
        // validate if an input is a valid BIP32 xpub
        function xpubValid(xpub) {
          try {
            console.assert(!SDK.bitcoin.HDNode.fromBase58(xpub).privKey);
          } catch(error) {
            return false;
          }
          return true;
        }

        // validate if an input is a valid email
        function emailValid(email) {
          return (/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/).test(email);
        }

        // validate if an input is a valid phone number
        function phoneValid(phone) {
          if (!phone) {
            return false;
          }
          if (phone[0] !== '+') {
            phone = '+'.concat(phone);
          }
          return intlTelInputUtils.isValidNumber(phone);
        }

        function setVisibleErrorState() {
          if (!ngModel.$touched || ngModel.$viewValue === '') {
            return;
          }
          var modelInvalid = ngModel.$invalid;
          switch (attrs.type) {
            case 'email':
              modelInvalid = !emailValid(ngModel.$viewValue);
              break;
            case 'tel':
              modelInvalid = !phoneValid(ngModel.$viewValue);
              break;
            case 'xpub':
              modelInvalid = !xpubValid(ngModel.$viewValue);
              break;
            case 'custom':
              modelInvalid = !attrs.custom(ngModel.$viewValue);
              break;
          }
          var visibleError = modelInvalid && ngModel.$dirty && !ngModel.focused;
          // DOM access for setting focus was async, so
          // $apply to get back into angular's run loop
          scope.$apply(function() {
            scope.$emit('SetFieldError', {
              field: attrs.name,
              visibleError: visibleError
            });
          });
        }

        function setFocusState() {
          ngModel.focused = (elem[0] === document.activeElement);
        }

        // Event Handlers
        elem.bind('focus', function() {
          setFocusState();
          setVisibleErrorState();
        });

        elem.bind('focusout', function() {
          setFocusState();
          ngModel.$setTouched();
          setVisibleErrorState();
        });

        elem.bind('blur', function() {
          setFocusState();
          ngModel.$setTouched();
          setVisibleErrorState();
        });
      }
    };
  }
]);
