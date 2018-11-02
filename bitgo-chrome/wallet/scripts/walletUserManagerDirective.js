angular.module('BitGo.Wallet.WalletUsersManagerDirective', [])

/**
  Directive to help with user management in wallets
  Helps with:
  - displaying all of the users on the wallet and their roles
  - adding a new user to a wallet
 */
.directive('walletUsersManager', ['UtilityService', 'RequiredActionService', 'BG_DEV', 'AnalyticsProxy',
  function(Util, RequiredActionService, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^WalletController',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        // view states for the user settings area
        $scope.viewStates = ['showAllUsers', 'addUser'];
        // the current view state
        $scope.state = null;
        // template source for the current view
        $scope.userWalletTemplateSource = null;

        // returns the view current view template (based on the $scope's current state)
        function getTemplate() {
          if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
            throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
          }
          var tpl;
          switch ($scope.state) {
            case 'showAllUsers':
              tpl = 'wallet/templates/wallet-users-partial-listuser.html';
              break;
            case 'addUser':
              tpl = 'wallet/templates/wallet-users-partial-adduser.html';
              break;
          }
          return tpl;
        }

        // Event listeners
        var killStateWatch = $scope.$watch('state', function(state) {
          if (state) {
            // If the user has a weak login password and is trying to add a user
            // we force them to upgrade it before they can add anyone
            if (state === 'addUser' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
              return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
            }
            // Otherwise set the template as needed
            $scope.userWalletTemplateSource = getTemplate();
          }
        });

        // Listener cleanup
        $scope.$on('$destroy', function() {
          killStateWatch();
        });

        // Watch for click on users tab in parent element
        $scope.$on("WalletController.showAllUsers", function() {
          $scope.state = 'showAllUsers';
        });

        function init() {
          $rootScope.setContext('walletUsers');
          AnalyticsProxy.track('WalletUsersEntered');
          $scope.state = 'showAllUsers';
        }
        init();
      }]
    };
  }
]);
