/**
 * @ngdoc controller
 * @name MatchwalletController
 * @description
 * Controls the view state of the match wallet module.
 **/
angular.module('BitGo.Matchwallet.MatchwalletController', [])

.controller('MatchwalletController', ['$scope', 'MatchwalletAPI',
  function($scope, MatchwalletAPI) {
    // viewstates for the send flow
    $scope.viewStates = ['prepare', 'confirmAndSend'];
    // current view state
    $scope.state = 'prepare';
    // Matchwallet template helper
    $scope.canSendInvites = MatchwalletAPI.canSendInvites;
  }
]);
