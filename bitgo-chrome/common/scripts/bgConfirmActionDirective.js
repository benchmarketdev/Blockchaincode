/**
 * @ngdoc directive
 * @name walletDeleteRow
 * @description
 * Directive to manage the delete functionality of a wallet
 * @example
 *   <div bg-confirm-action></div>
 */
angular.module('BitGo.Common.BGConfirmActionDirective', [])

.directive('bgConfirmAction', ['$rootScope', '$location', 'NotifyService', 'WalletsAPI', 'BG_DEV',
  function($rootScope, $location, Notify, WalletsAPI, BG_DEV) {
    return {
      restrict: 'A',
      scope: true,
      controller: ['$scope', function($scope) {
        // variable on scope used to show confirmation message
        $scope.confirmationMessage = false;

        // user initiates delete
        $scope.initiateAction = function() {
          $scope.confirmationMessage = true;
        };

        // If user does not confirm delete
        $scope.cancelAction = function() {
          $scope.confirmationMessage = false;
        };
      }]
    };
  }
]);
