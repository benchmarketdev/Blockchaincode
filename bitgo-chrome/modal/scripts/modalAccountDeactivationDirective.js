/**
 * @ngdoc directive
 * @name modalAccountDeactivation
 * @description 
 * Directive to help with user account deactivation
 *
 */
angular.module('BitGo.Modals.ModalAccountDeactivationDirective', [])

  .directive('modalAccountDeactivation', ['$location', 'UtilityService', 'NotifyService', 'UserAPI', 'BG_DEV',
  function($location, Util, Notify, UserAPI,  BG_DEV) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', '$timeout', function($scope, $timeout) {
  
        $scope.viewStates = ['confirm', 'form'];
        $scope.data = null;

        function onLogoutSuccess() {
          $location.path('/login');
        }
      
        $scope.deactivateUser = function() {
          $scope.setState('form');
        };

        $scope.confirmDeactivation = function() {
          UserAPI.deactivate($scope.data)
          .then(UserAPI.logout)
          .then($scope.closeWithSuccess({ type: 'dismissOfflineWarning'}))
          .then(onLogoutSuccess)
          .then(function() {
            Notify.success('User Account Removed');
           })
           .catch(Notify.errorHandler);
        };

       function init() {
         $scope.state = 'confirm';
           // Including the form field 
           $scope.data = {
             deactivationForm: ''
           };
         }
       init();
      }]
    };
  }
]);
