angular.module('BitGo.Auth.ForgotPwFormDirective', [])

/**
 * Directive to help with forgot pw form
 */
.directive('forgotPwForm', ['UserAPI', 'UtilityService', 'NotifyService',
  function(UserAPI, Util, Notify) {
    return {
      restrict: 'A',
      require: '^ForgotPwController',
      controller: ['$scope', function($scope) {
        function formIsValid() {
          return Util.Validators.emailOk($scope.user.settings.email.email);
        }

        function onSubmitSuccess() {
          return $scope.$emit('SetState', 'confirmEmail');
        }

        $scope.submitForgotPw = function() {
          // clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            var user = {
              email: Util.Formatters.email($scope.user.settings.email.email),
              type: "forgotpassword"
            };
            UserAPI.forgotpassword(user)
            .then(onSubmitSuccess)
            .catch(Notify.errorHandler);
          } else {
            $scope.setFormError('Please enter a valid email.');
          }
        };

        $scope.resendEmail = function() {
          var user = {
            email: Util.Formatters.email($scope.user.settings.email.email),
            type: "forgotpassword"
          };
          UserAPI.forgotpassword(user)
          .then(Notify.successHandler('Your email was sent.'))
          .catch(Notify.errorHandler);
        };

      }]
    };
  }
]);
