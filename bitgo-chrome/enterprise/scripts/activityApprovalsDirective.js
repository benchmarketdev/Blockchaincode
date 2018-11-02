/**
 * @ngdoc directive
 * @name activityApprovals
 * @description
 * Directive to help with the approvals section in the current enterprise
 */
angular.module('BitGo.Enterprise.ActivityApprovalsDirective', [])

.directive('activityApprovals', ['UtilityService', 'InternalStateService',
  function(Util, InternalStateService) {
    return {
      restrict: 'A',
      require: '^EnterpriseActivityController',
      controller: ['$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
        // show UI if enterprise approvals exist
        $scope.enterpriseApprovalsExist = null;
        // show empty state if no approvals exist
        $scope.noApprovalsExist = null;

        function displayUI () {
          if ($rootScope.enterprises &&
            $rootScope.enterprises.current &&
            !_.isEmpty($rootScope.enterprises.current.pendingApprovals)) {
            $scope.enterpriseApprovalsExist = true;
            $scope.noApprovalsExist = false;
          } else {
            $scope.enterpriseApprovalsExist = false;
            $scope.noApprovalsExist = true;
          }
        }

        $scope.goToSettings = function () {
          if ($rootScope.enterprises.current.isPersonal) {
            InternalStateService.goTo('personal_settings:users');
          } else {
            InternalStateService.goTo('enterprise_settings:users');
          }
        };

        // Event Listeners
        // Listen for the enterprises's approvals to be set
        var killApprovalsListener = $rootScope.$on('WalletsAPI.UserWalletsSet',
          function(evt, data) {
            displayUI();
          }
        );

        // Clean up the listeners -- helps decrease run loop time and
        // reduce liklihood of references being kept on the scope
        $scope.$on('$destroy', function() {
          killApprovalsListener();
        });

        // initialize the controller
        function init() {
          displayUI();
        }
        init();

      }]
    };
  }
]);
