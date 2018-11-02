/*
  About:
  - The SignupController deals with managing the section of the
  app where a user signs in

  Notes:
  - This manages: SignUpForm
*/
angular.module('BitGo.Auth.SignupController', [])

.controller('SignupController', ['$scope', '$rootScope', 'UserAPI',
  function($scope, $rootScope, UserAPI) {
    $scope.viewStates = ['signup', 'confirmEmail'];
    // The initial view state; initialized later
    $scope.state = undefined;
    $scope.password = null;
    $scope.passwordConfirm = null;
    $scope.agreedToTerms = false;
    // Fields needed so to lock password and email from lastpass
    $scope.lockedPassword = null;
    $scope.lockedEmail = null;

    // Even handlers
    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function(evt, data) {
      $scope.user = $rootScope.currentUser;
    });

    // Event handler cleanup
    $scope.$on('$destroy', function() {
      killUserSetListener();
    });

    function init() {
      $rootScope.setContext('signup');

      $scope.user = $rootScope.currentUser;
      $scope.state = 'signup';
    }
    init();
  }
]);
