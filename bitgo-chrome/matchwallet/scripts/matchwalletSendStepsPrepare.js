/**
 * @ngdoc directive
 * @name matchwalletSendStepsPrepare
 * @description
 * Manages the send invitation prepare step.
 **/
angular.module('BitGo.Matchwallet.MatchwalletSendStepsPrepareDirective', [])

.directive('matchwalletSendStepsPrepare', ['$q', '$rootScope', 'NotifyService', 'CacheService', 'UtilityService', 'BG_DEV', 'AnalyticsProxy',
  function($q, $rootScope, NotifyService, CacheService, UtilityService, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^matchwalletSendManager', // explicitly require it
      controller: ['$scope', function($scope) {

        var minAmount = _.string.numberFormat(BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT / 100);

        // form error constants
        var ERRORS = {
          invalidEmail: {
            msg: 'Please enter a valid email address.'
          },
          sendToSelf: {
            msg: 'You cannot send to yourself.'
          },
          invalidAmount: {
            msg: 'Please enter a valid amount.'
          },
          insufficientFunds: {
            msg: 'Wallet does not contain enough funds to send this amount.'
          },
          alreadyInvited: {
            msg: 'You have already sent an invitation to this email address.'
          },
          invitationAmountTooSmall: {
            msg: 'The minimum invitation gift is ' + minAmount + ' bits'
          },
          amountTooSmall: {
            msg: 'This transaction amount is too small to send.'
          }
        };


        // function to set error on form and turn off processing flag
        function setErrorOnForm(errMsg) {
          if(!errMsg || typeof(errMsg) !== 'string') {
            throw new Error('Invalid form error');
          }
          $scope.setFormError(errMsg);
        }

        // Validate the transaciton input form
        function invitationIsValid() {
          var currentMatchwallet = $rootScope.matchwallets.current;
          var currentMatchwalletId = currentMatchwallet.data.id;
          var balance = currentMatchwallet.data.balance;
          var alreadyInvited = currentMatchwallet.data.invitations.filter(
            function(invitation) { return $scope.invitation.email == invitation.email; });

          // ensure a valid recipient address
          if (!($scope.invitation.email || "").match(/^[^@]+@[^@]+$/)) {
            setErrorOnForm(ERRORS.invalidEmail.msg);
            return false;
          }
          // ensure they're not sending coins to this wallet's address
          if ($scope.invitation.email == $rootScope.currentUser.settings.email.email) {
            setErrorOnForm(ERRORS.sendToSelf.msg);
            return false;
          }
          // ensure they're not sending coins to the same address multiple times
          if (alreadyInvited.length) {
            setErrorOnForm(ERRORS.alreadyInvited.msg);
            return false;
          }
          // ensure a valid amount
          if (!parseFloat($scope.invitation.amount)) {
            setErrorOnForm(ERRORS.invalidAmount.msg);
            return false;
          }
          // ensure they are not entering an amount greater than they're balance
          if ($scope.invitation.amount > balance) {
            setErrorOnForm(ERRORS.insufficientFunds.msg);
            return false;
          }
          // ensure amount is greater than the minimum invitation value
          if ($scope.invitation.amount < BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT) {
            setErrorOnForm(ERRORS.invitationAmountTooSmall.msg);
            return false;
          }
          // ensure amount is greater than the minimum dust value
          if ($scope.invitation.amount <= BG_DEV.TX.MINIMUM_BTC_DUST) {
            setErrorOnForm(ERRORS.amountTooSmall.msg);
            return false;
          }
          return true;
        }

        // advances the invitation state if the for and inputs are valid
        $scope.advanceInvitation = function() {
          $scope.clearFormError();
          if (invitationIsValid()) {
            AnalyticsProxy.track('prepareInvitation', { type: 'matchwallet', invitation: !!$rootScope.invitation });
            $scope.setState('confirmAndSend');
          }

          // The result of this function is only ever checked in tests.
          // However, rather than return false, it is good practice to return a
          // promise, since this function is asynchronous, and thus should
          // always return a promise.
          return $q(function(resolve, reject) {
            return resolve(false);
          });
        };

        function init() {
          if (!$scope.invitation) {
            throw new Error('Expect a invitation object when initializing');
          }
        }
        init();
      }]
    };
  }
]);
