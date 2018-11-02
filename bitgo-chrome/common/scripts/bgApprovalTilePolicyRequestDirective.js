/**
 * @ngdoc directive
 * @name bgApprovalTileBitcoinWhitelist
 * @description
 * This directive manages the approval tile state for general wallet approvals
 * 'General' type includes:
 *  bitcoinAddressWhitelist
 *  dailyLimitPolicy
 *  txLimitPolicy
 * @example
 *   <span bg-approval-tile-policy-request>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTilePolicyRequestDirective', [])

.directive("bgApprovalTilePolicyRequest", ['$rootScope', 'ApprovalsAPI', 'WalletsAPI', 'NotifyService', 'BG_DEV', 'SyncService', '$location', 'EnterpriseAPI',  'UtilityService',
  function ($rootScope, ApprovalsAPI, WalletsAPI, NotifyService, BG_DEV, SyncService, $location, EnterpriseAPI, UtilityService) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {
        /** All valid tile view states */
        $scope.viewStates = ['initial'];

        /** Show different templates if the approval is one the currentUser created */
        $scope.userIsCreator = $rootScope.currentUser.settings.id === $scope.approvalItem.creator;
        // the action being taken in the pending approval item (e.g. update)
        $scope.approvalItemAction = null;
        // the type of pending approval (see BG_DEV for types)
        $scope.approvalItemId = null;
        // details for the approval item
        $scope.approvalItemDetails = null;

        /**
        * Tells if action taken requires the approval templates to refresh themselves
        * @param {string} the new/updated approval state (just set by the user)
        * @private
        * @returns {bool}
        */
        $scope.actionRequiresTileRefresh = function(state) {
          if (state === 'rejected') {
            return false;
          }
          return true;
        };

        function initWhitelistTile() {
          $scope.addingAddress = !!$scope.approvalItemDetails.condition.add;
          if ($scope.addingAddress) {
            $scope.addressInQuestion = $scope.approvalItemDetails.condition.add;
            return;
          }
          $scope.addressInQuestion = $scope.approvalItemDetails.condition.remove;
        }

        /**
        * Initializes the specific details for each given tile type
        * @private
        */
        function initTileDetails() {
          if (!$scope.approvalItem.info.policyRuleRequest) {
            return;
          }
          $scope.approvalItemAction = $scope.approvalItem.info.policyRuleRequest.action;
          $scope.approvalItemId = $scope.approvalItem.info.policyRuleRequest.update.id;
          if (!$scope.approvalItemAction || !$scope.approvalItemId) {
            throw new Error('invalid approval item');
          }
          $scope.approvalItemDetails = $scope.approvalItem.info.policyRuleRequest.update;
          if (!$scope.approvalItemDetails) {
            throw new Error('invalid approval item');
          }
          switch ($scope.approvalItemId) {
            case BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.whitelist.address"]:
              initWhitelistTile();
              break;
          }
        }

        /**
        * Initializes the directive's controller state
        * @private
        */
        function init() {
          $scope.state = 'initial';
          initTileDetails();
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
            id: scope.approvalItem.id,
            wallet: scope.approvalItem.bitcoinAddress
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
                $rootScope.wallets.all[scope.approvalItem.bitcoinAddress].deleteApproval(scope.approvalItem.id);
                //if the approval results in removing the current user from the wallet
                if (result.info.userChangeRequest && result.info.userChangeRequest.action == 'removed' && result.info.userChangeRequest.userChanged === $rootScope.currentUser.settings.id) {
                  WalletsAPI.removeWalletFromScope($rootScope.wallets.all[scope.approvalItem.bitcoinAddress]);
                  //if the user is inside a wallet (within the 'users' tab)
                  if (UtilityService.Url.getEnterpriseSectionFromUrl() === 'wallets') {
                    $location.path('/enterprise/' + EnterpriseAPI.getCurrentEnterprise() + '/wallets');
                  }
                }
                // handle the DOM cleanup
                $('#' + scope.approvalItem.id).remove();
                scope.$destroy();
                // Update the wallets and recompile the tiles if the update
                // critically affects the state of other tiles
                // E.g. removing any (or the last) whitelist address
                if (scope.actionRequiresTileRefresh(newState)) {
                  // This refetch triggers a recompile of the tile templates
                  // to show the correct current tile states
                  SyncService.sync();
                }
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
