/**
 * @ngdoc directive
 * @name modalOfflineWarning
 * @description
 * Manages the modal warning for when a user loses connectivity
 * @example
 *   <div modal-offline-warning></div>
 */
angular.module('BitGo.Modals.ModalOfflineWarningDirective', [])

.directive('modalOfflineWarning', ['StatusAPI',
  function(StatusAPI) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', function($scope) {

        /**
         * Helper - Attempts to reconnect the app to the BitGo service
         * @public
         */
        $scope.tryReconnect = function() {
          // Remove any error messages
          $scope.clearFormError();
          // Ping BitGo
          StatusAPI.ping()
          .then(function(data) {
            $scope.$emit('modalOfflineWarning.DismissOfflineWarning');
          })
          .catch(function(error) {
            $scope.setFormError('Unable to reconnect.');
          });
        };
      }]
    };
  }
]);
