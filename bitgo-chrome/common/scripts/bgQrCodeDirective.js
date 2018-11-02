/*
 * @ngdoc directive
 * @name BGQrCode
 * @description
 * Creates QR codes based on data in the text attribute
 * @example
  <div bg-qr-code></div>
*/

angular.module('BitGo.Common.BGQrCode', [])

.directive('bgQrCode', ['$rootScope', 'BG_DEV', '$modal',
  function ($rootScope, BG_DEV, $modal) {
    return {
      restrict: 'AE',
      transclude: true,
      controller: ['$scope', function($scope) {
        $scope.openModal = function(address, label) {
          var modalInstance = $modal.open({
            templateUrl: 'modal/templates/modalcontainer.html',
            controller: 'ModalController',
            scope: $scope,
            resolve: {
            // The return value is passed to ModalController as 'locals'                                                                                                 
              locals: function () {
                return {
                  userAction: BG_DEV.MODAL_USER_ACTIONS.qrReceiveAddress,
                  type: BG_DEV.MODAL_TYPES.qrReceiveAddress,
                  address: address,
                  label: label
                };
              }
            }
          });
        return modalInstance.result;
        };
      }],
      compile: function (element, attrs, transclude) {
        return function postLink(scope, iElement, iAttrs, controller) {
          iElement[0].complete = false;
          iAttrs.$observe('text', function (value) {
            var height = attrs.height ? parseInt(attrs.height, 10) : 200;
            var text = value.replace(/^\s+|\s+$/g, '');
            iElement[0].innerHTML = '';
            var qrcode = new QRCode(iElement[0], { height: height, width: height, correctLevel: 0});
            qrcode.makeCode(text);
            iElement[0].complete = true;
          });
        };
      }
    };
  }
]);
