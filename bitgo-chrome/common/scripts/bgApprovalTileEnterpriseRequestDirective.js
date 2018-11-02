/**
 * @ngdoc directive
 * @name bgApprovalTileEnterpriseRequest
 * @description
 * This directive manages the approval tile state for enterprise level approvals
 * @example
 *   <span bg-approval-tile-enterprise-request>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTileEnterpriseRequestDirective', [])

.directive("bgApprovalTileEnterpriseRequest", ['$rootScope', 'ApprovalsAPI', 'NotifyService', 'BG_DEV', 'SyncService', '$location', 'EnterpriseAPI',  'UtilityService',
  function ($rootScope, ApprovalsAPI, NotifyService, BG_DEV, SyncService, $location, EnterpriseAPI, UtilityService) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        /** All valid tile view states */
        $scope.viewStates = ['initial'];

        /** Show different templates if the approval is one the currentUser created */
        $scope.userIsCreator = $rootScope.currentUser.settings.id === $scope.approvalItem.creator;

        /**
        * Initializes the directive's controller state
        * @private
        */
        function init() {
          $scope.state = 'initial';
          $scope.approvalItem.prettyDate = new moment($scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');
        }
        init();
      }],
      link: function(scope, element, attrs) {
        /** Valid pending approval states */
        var validApprovalTypes = ['approved', 'rejected'];

        /**
        * Updates a pending approval's state / and the DOM once set
        * @param {string} approval's new state to set
        * @public
        */
        scope.setApprovalState = function(newState) {
          if (_.indexOf(validApprovalTypes, newState) === -1) {
            throw new Error('Expect valid approval state to be set');
          }
          var data = {
            state: newState,
            id: scope.approvalItem.id
          };
          ApprovalsAPI.update(data.id, data)
          .then(function(result) {
            $('#' + scope.approvalItem.id).animate({
              height: 0,
              opacity: 0
            }, 500, function() {
              scope.$apply(function() {
                // remove the approval from the appropriate places
                $rootScope.enterprises.current.deleteApproval(scope.approvalItem.id);
                //if the approval results in removing the current user from the enterprise
                if (result.info.updateEnterpriseRequest && result.info.updateEnterpriseRequest.action == 'remove' && result.info.updateEnterpriseRequest.userId === $rootScope.currentUser.settings.id) {
                  // check if there are no wallets and if it was an approval
                  if (_.isEmpty($rootScope.wallets.all) && newState == 'approved') {
                    EnterpriseAPI.setCurrentEnterprise($rootScope.enterprises.all.personal);
                    $location.path('/enterprise/personal/wallets');
                  }
                }
                // handle the DOM cleanup
                $('#' + scope.approvalItem.id).remove();
                scope.$destroy();
                
              });
            });
          })
          .catch(function(error) {
            var failAction = (newState === 'approved') ? 'approving' : 'rejecting';
            NotifyService.error('There was an issue ' + failAction + ' this request. Please try your action again.');
          });
        };
      }
    };
  }
]);
