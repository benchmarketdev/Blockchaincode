/**
 * @ngdoc directive
 * @name matchwalletSendManager
 * @description
 * Manages the state of the invitation send flow
 **/
angular.module('BitGo.Matchwallet.MatchwalletSendManagerDirective', [])

.directive('matchwalletSendManager', ['$rootScope', '$location', 'BG_DEV', 'AnalyticsProxy',
  function($rootScope, $location, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^MatchwalletController',
      controller: ['$scope', function($scope) {
        // Invitation default values
        var INVITATION_MESSAGE = 'Try out a BitGo secure wallet with some free bitcoin :)';

        // the invitation object built as the user goes through the send flow
        $scope.invitation = null;

        // Cancel the invitation send flow
        $scope.cancelSend = function() {
          AnalyticsProxy.track('cancelInvitation', { type: 'matchwallet', invitation: !!$rootScope.invitation });
          $location.path('/enterprise/personal/wallets');
        };

        // Called to reset the send flow's state and local invitation object
        $scope.resetSendManager = function() {
          // reset the local state
          setNewInvitationObject();
          $scope.setState('prepare');
        };

        // resets the local, working version of the invitation object
        function setNewInvitationObject() {
          delete $scope.invitation;
          // properties we can expect on the invitation object
          $scope.invitation = {
            matchwallet: null,
            // amount of the invitation
            amount: BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT,
            // invited user's email address
            email: null,
            // optional message for the invitation
            message: INVITATION_MESSAGE
          };
        }

        function init() {
          $rootScope.setContext('matchwalletSend');
          setNewInvitationObject();
        }
        init();
      }]
    };
  }
]);
