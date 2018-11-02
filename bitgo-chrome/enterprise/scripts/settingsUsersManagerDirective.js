angular.module('BitGo.Enterprise.SettingsUsersManagerDirective', [])

/**
  Directive to help with user management in enterprise settings
  Helps with:
  - displaying all of the users on the enterprise
  - drilling in to see specific users on the enterprise and their role on all wallets
  - adding a new user to the enterprise (a specific wallet)
 */
.directive('settingsUsersManager', ['UtilityService', 'NotifyService', 'WalletsAPI', 'RequiredActionService', 'BG_DEV',
  function(Util, Notify, WalletsAPI, RequiredActionService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^EnterpriseSettingsController',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        // view states for the user settings area
        $scope.viewStates = ['showAllUsers', 'showOneUser', 'addUser'];
        // the current view state
        $scope.state = null;
        // template source for the current view
        $scope.userSettingsTemplateSource = null;
        // An enterprise user who was selected to view in detail
        $scope.selectedUser = null;

        // returns the view current view template (based on the $scope's current state)
        function getTemplate() {
          if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
            throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
          }
          var tpl;
          switch ($scope.state) {
            case 'showAllUsers':
              tpl = 'enterprise/templates/settings-partial-users-list.html';
              break;
            case 'showOneUser':
              tpl = 'enterprise/templates/settings-partial-users-manageuser.html';
              break;
            case 'addUser':
              tpl = 'enterprise/templates/settings-partial-users-adduser.html';
              break;
          }
          return tpl;
        }

        // Fires when an admin selects an Enterprise user to view in detail
        $scope.selectUser = function(userId, walletsAccessibleByUser) {
          $scope.selectedUserId = userId;
          $scope.setState('showOneUser');
        };

        // Event listeners
        var killStateWatch = $scope.$watch('state', function(state) {
          if (state) {
            // If the user has a weak login password and is trying to add a user
            // we force them to upgrade it before they can add someone
            if (state === 'addUser' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
              return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
            }
            // Otherwise set the template as needed
            $scope.userSettingsTemplateSource = getTemplate();
          }
        });

        // Listener cleanup
        $scope.$on('$destroy', function() {
          killStateWatch();
        });

        // Watch for click on users tab in parent element
        $scope.$on("EnterpriseSettingsController.showAllUsers", function() {
          $scope.state = 'showAllUsers';
        });

        $scope.revokeAccess = function(bitcoinAddress, userId) {
          WalletsAPI.revokeAccess(bitcoinAddress, userId)
          .then(revokeAccessSuccess)
          .catch(Notify.errorHandler);
        };

        $scope.canDelete = function (userId) {
          return userId && userId !== $rootScope.currentUser.settings.id;
        };

        function revokeAccessSuccess(wallet) {
          WalletsAPI.getAllWallets();
          if (wallet.adminCount > 1) {
            Notify.success('Pending approval sent for revoking wallet access.');
          }
          else {
            Notify.success('Wallet access was revoked.');
          }
        }

        function init() {
          $scope.state = 'showAllUsers';
        }
        init();
      }]
    };
  }
]);
