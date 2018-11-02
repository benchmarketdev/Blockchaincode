/**
 * @ngdoc directive
 * @name matchwalletSendStepsConfirm
 * @description
 * Manages the send invitation confirmation step.
 **/
angular.module('BitGo.Matchwallet.MatchwalletSendStepsConfirmDirective', [])

.directive('matchwalletSendStepsConfirm', ['$q', '$timeout', '$rootScope', '$location', 'NotifyService', 'MatchwalletAPI', 'UtilityService', 'SDK', 'BG_DEV', 'AnalyticsProxy',
  function($q, $timeout, $rootScope, $location, NotifyService, MatchwalletAPI, UtilityService, SDK, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^matchwalletSendManager', // explicitly require it
      controller: ['$scope', function($scope) {
        // Max wallet sync fetch retries allowed
        var MAX_WALLET_SYNC_FETCHES = 5;
        // count for wallet sync data fetches
        var syncCounter;

        // flag letting us know when the invitation has been sent
        $scope.invitationSent = null;
        // state for the ui buttons to be diabled
        $scope.processing = null;
        // flag set if last invitation was sent
        $scope.lastInvitationSent = false;

        $scope.goToActivityFeed = function() {
          $location.path('/enterprise/personal/activity');
        };

        // Resets all the local state on this scope
        function resetLocalState() {
          $scope.invitationSent = null;
        }

        function handleInvitationSendError(error) {
          $scope.processing = false;
          if (error && error.error) {
            NotifyService.errorHandler(error);
            return;
          }
          NotifyService.error('Your invitation was unable to be processed. Please refresh your page and try sending again.');
        }

        function openModal(params) {
          return $modal.open({
            templateUrl: params.url,
              controller: 'ModalController',
              scope: $scope,
              resolve: {
              locals: function () {
                return _.merge({
                  type: BG_DEV.MODAL_TYPES[params.type],
                  userAction: BG_DEV.MODAL_USER_ACTIONS[params.type]
                }, params.locals);
              }
            }
          }).result;
        }

        /**
         * Fetch a wallet to sync it's balance/data with the latest data from the server
         * based on the user's recent action taken
         */
        function syncCurrentMatchwallet() {
          if (syncCounter >= MAX_WALLET_SYNC_FETCHES) {
            return;
          }
          var params = {
            id: $rootScope.matchwallets.current.data.id
          };
          MatchwalletAPI.getMatchwallet(params, false).then(function(matchwallet) {
            // If the new balance hasn't been picked up yet on the backend, refetch
            // to sync up the client's data
            if (matchwallet.data.balance === $rootScope.matchwallets.current.data.balance) {
              syncCounter++;
              $timeout(function() {
                syncCurrentMatchwallet();
              }, 2000);
              return;
            }
            // Since we have a new balance on this wallet
            // Fetch the latest wallet data
            // (this will also update the $rootScope.currentMatchwallet)
            MatchwalletAPI.getAllMatchwallets();
            // reset the sync counter
            syncCounter = 0;
          });
        }

        /**
         * Send invitation
         *
         * @returns {Object} promise for sending the invitation
         */
        $scope.sendInvitation = function() {
          $scope.processing = true;

          $scope.invitation.id = $rootScope.matchwallets.current.data.id;
          
          return MatchwalletAPI.sendInvitation($scope.invitation)
          .then(function(res) {

            // Handle the success state in the UI
            var balance = $rootScope.matchwallets.current.data.balance - $scope.invitation.amount;
            if (balance < BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT) {
              $scope.lastInvitationSent = true;
            }
            $scope.invitationSent = true;
            $scope.processing = false;

            // Track successful send
            AnalyticsProxy.track('sendInvitation', {
              type: 'matchwallet',
              amount: $scope.invitation.amount,
              invitation: !!$rootScope.invitation
            });

            // Sync up the new balances data across the app
            return syncCurrentMatchwallet();
          })
          .catch(function(error) {
            handleInvitationSendError(error);
          });
        };

        // Cleans out the scope's invitation object and takes the user back to the first step
        $scope.sendMoreInvites = function() {
          AnalyticsProxy.track('sendMoreInvitations', { type: 'matchwallet', invitation: !!$rootScope.invitation });
          resetLocalState();
          $scope.resetSendManager();
        };

        function init() {
          if (!$scope.invitation) {
            throw new Error('Expect a transaction object when initializing');
          }
          syncCounter = 0;
          $scope.processing = false;
        }
        init();

      }]
    };
  }
]);
