/*
  Notes:
  - This directive fetches the label for an address based on the address and a wallet ID
  - E.g.: <span bg-get-address-label address-id="123abcd" wallet-id="456erty">{{ label }}</span>
*/
angular.module('BitGo.Common.BGGetAddressLabelDirective', [])

.directive("bgGetAddressLabel", ['$rootScope', 'LabelsAPI',
  function ($rootScope, LabelsAPI) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element, attrs) {
        attrs.$observe('addressId', function(val) {
          // Flag to see if the label has been found
          scope.foundLabel = false;
          // When the addressId changes, walletId might not be loaded. Only fetch when both are present.
          if (!val || !attrs.walletId) {
            return;
          }
          // Otherwise fetch the label, trying the cache first
          LabelsAPI.get(attrs.addressId, attrs.walletId)
          .then(function (label) {
            if (label) {
              scope.label = label.label;
              scope.foundLabel = true;
            } else {
              scope.foundLabel = false;
              scope.label = attrs.addressId;
            }
          })
          .catch(function (error) {
            console.log("Error getting walletId " + val + ": " + error);
          });
        });
      }
    };
  }
]);
