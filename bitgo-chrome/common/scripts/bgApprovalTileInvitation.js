/**
 * @ngdoc directive
 * @name
 * @description
 * 
 * @example
 *   <span bg-approval-tile-invitation>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTileInvitation', [])

.directive("bgApprovalTileInvitation", ['$rootScope', '$location', 'MatchwalletAPI',
  function ($rootScope, $location, MatchwalletAPI) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        /** All valid tile view states */
        $scope.viewStates = ['initial'];
        /** Reward wallet ID will be set here from matchwallet-reward-wallet directive */
        $scope.rewardWalletId = null;

        $scope.goToIdentityVerification = function() {
          $location.path('/identity/verify');
        };

        $scope.goToCreateWallet = function() {
          $location.path('/enterprise/personal/wallets/create');
        };

        /**
        * Initializes the directive's controller state
        * @private
        */
        function init() {
          $scope.state = 'initial';
          $scope.approvalItem.prettyDate = new moment($scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');
          $scope.rewardWalletId = _.findLastKey($rootScope.wallets.all);
        }
        init();
      }],
      link: function(scope, element, attrs) {
        /** Valid pending approval states */
        var validApprovalTypes = ['approved', 'rejected'];
        // User can approve if they have verified their identity and created a wallet
        var isIdentified = $rootScope.currentUser.settings.identity.verified;
        if (scope.approvalItem.info.gift) {
          scope.canClaimReward = isIdentified && scope.rewardWalletId;
        } else if (scope.approvalItem.info.reward) {
          scope.canClaimReward = isIdentified &&
                                 scope.approvalItem.info.invitation.giftClaimed &&
                                 scope.rewardWalletId;
        }
        // If invited user accepted their invitation
        if (scope.approvalItem.info.reward) {
          scope.invitationAccepted = scope.approvalItem.info.invitation.giftClaimed;
        }
        // Animate and remove approval
        function removeItem() {
          $('#' + scope.approvalItem.id).animate({
            height: 0,
            opacity: 0
          }, 500, function() {
            scope.$apply(function() {
              // remove the approval from the appropriate places
              $('#' + scope.approvalItem.id).remove();
              scope.$destroy();
            });
          });
        }

        /**
        * Updates a pending approval's state / and the DOM once set
        * @param {string} approval's new state to set
        * @public
        */
        scope.setApprovalState = function(newState) {
          if (_.indexOf(validApprovalTypes, newState) === -1) {
            throw new Error('Expect valid approval state to be set');
          }
          if (newState === 'approved') {
            MatchwalletAPI.claimReward(scope.approvalItem.info.invitation, scope.rewardWalletId)
            .then(removeItem);
          }
          if (newState === 'rejected') {
            MatchwalletAPI.rejectReward(scope.approvalItem.info.invitation)
            .then(removeItem);
          }
        };
      }
    };
  }
]);
