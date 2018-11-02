/**
 * @ngdoc directive
 * @name modalQrReceiveAddress
 * @description
 * Manages the qr receive address template
 * @example
 *   <div modal-qr-receive-address></div>
 */
angular.module('BitGo.Modals.ModalQrReceiveAddressDirective', [])

.directive('modalQrReceiveAddress', ['$rootScope', 'StatusAPI', 'WalletsAPI', 'LabelsAPI',
  function($rootScope, StatusAPI, WalletsAPI, LabelsAPI) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', function($scope) {

      }]
    };
  }
]);
