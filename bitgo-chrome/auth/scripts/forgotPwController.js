/*
  About:
  - The ForgotPwController deals with managing the section of the
  app if a user shows up having forgotten their password

  Notes:
  - This manages: ForgotPwForm
*/
angular.module('BitGo.Auth.ForgotPwController', [])

// configure the module.
.controller('ForgotPwController', ['$scope', '$rootScope', 'UserAPI', 'NotifyService',
  function($scope, $rootScope, UserAPI, Notify) {
    $scope.viewStates = ['initial', 'confirmEmail'];
    // The initial view state; initialized later
    $scope.state = undefined;

    $rootScope.$on('UserAPI.CurrentUserSet', function(evt, data) {
      $scope.user = $rootScope.currentUser;
    });

    function init() {
      $rootScope.setContext('forgotPassword');

      $scope.user = $rootScope.currentUser;
      $scope.state = 'initial';
    }
    init();
  }
]);
