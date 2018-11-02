/**
 * @ngdoc directive
 * @name walletReceiveCurrentReceiveAddressManager
 * @description
 * Manages logic for dealing with the current receive address (top section) of the receive page
 * @example
 *   <div wallet-receive-current-receive-address-manager></div>
 */
angular.module('BitGo.Wallet.WalletReceiveCurrentReceiveAddressManager', [])

.directive('walletReceiveCurrentReceiveAddressManager', ['$rootScope', '$timeout', '$compile', '$http', '$modal', '$templateCache', 'NotifyService', 'LabelsAPI', 'BG_DEV', 'ssAPI',
  function($rootScope, $timeout, $compile, $http, $modal, $templateCache, NotifyService, LabelsAPI, BG_DEV, ssAPI) {
    return {
      restrict: 'A',
      replace: true,
      require: '^?walletReceiveManager',
      controller: ['$scope', function($scope) {

        // Open the modal when the user clicks on receive alt-coin
        $scope.useAltCoin = function(){

            var modalInstance = $modal.open({
              templateUrl: 'modal/templates/ssReceiveAltCoin.html',
              scope: $scope,
              resolve: {
                // The return value is passed to ModalController as 'locals'
                locals: function () {
                  return {
                    userAction: BG_DEV.MODAL_USER_ACTIONS.ssReceiveAltCoin,
                    type: BG_DEV.MODAL_TYPES.ssReceiveAltCoin
                  };
                }
              }
            });
            return modalInstance.result;
        };

        // state to let user know when an address is being generated
        $scope.addressBeingGenerated = null;
        /**
         * Logic to show/hide the main address label show/hide buttons
         */
        $scope.generateNewReceiveAddress = function() {
          if (!$scope.addressBeingGenerated) {
            // Lock the UI
            $scope.addressBeingGenerated = true;
            // This function exists in the ancestor WalletController
            // It was initially used to set up $scope.currentReceiveAddress
            $scope.generateNewReceiveAddressForWallet(false)
            .then(function(tileItem) {
              // refetch the address list to keep the local index in sync
              $scope.initAddressList();
            })
            .catch(NotifyService.errorHandler)
            .finally(function() {
              // always unlock the UI if something went wrong
              $scope.addressBeingGenerated = false;
            });
          }
        };

        /**
         * Empties the temporary address on current receive address textbox focus
         * @param {Obj} currentReceiveAddress - a bitgo address object
         */
        $scope.emptyTemporary = function (currentReceiveAddress) {
          if (!currentReceiveAddress || !currentReceiveAddress.index) {
            console.log('Could not get current receive address');
            return;
          }
          // reset temp address if the label is a default one
          if (currentReceiveAddress.temporaryLabel === "Receive Address " + currentReceiveAddress.index) {
            $scope.currentReceiveAddress.temporaryLabel = "";
          }
        };

        /**
         * Logic to disable the labelling text box on the most recent receive address
         */
        $scope.cannotEditLabel = function() {
          return $rootScope.wallets.current.role !== BG_DEV.WALLET.ROLES.ADMIN || !$rootScope.wallets.current.isSafehdWallet();
        };

        /**
         * Logic to show/hide 'generate address' button
         */
        $scope.canGenerateAddress = function() {
          return !$scope.addressBeingGenerated && $rootScope.wallets.current.role !== BG_DEV.WALLET.ROLES.VIEW && $rootScope.wallets.current.isSafehdWallet();
        };

        /**
         * Logic to show/hide the main address label show/hide buttons
         */
        $scope.canShowMainEditButtons = function() {
          if (!$scope.currentReceiveAddress) {
            return;
          }
          return $scope.currentReceiveAddress.temporaryLabel !== $scope.currentReceiveAddress.label;
        };

        function init() {
          $scope.addressBeingGenerated = false;
        }
        init();
      }],
      link: function(scope, element, attrs) {

        /**
         * Cancel editing the label for the primary address shown
         */
        scope.cancelMainLabelSave = function() {
          scope.currentReceiveAddress.temporaryLabel = scope.currentReceiveAddress.label;
        };

        /**
         * Save a new label for an address
         * @param {Obj} a bitgo address object
         * @param {String} new label for the address
         */
        scope.saveMainLabel = function(tileItem, label) {
          // Handle UI
          $timeout(function() {
            angular.element('input[name=temporaryLabel]').blur();
          }, 0);
          // Handle data
          var params = {
            walletId: $rootScope.wallets.current.data.id,
            address: tileItem.address,
            label: label
          };
          // Save the new label if there is a label present
          if (label) {
            return LabelsAPI.add(params)
            .then(function(label) {
              NotifyService.success('The label was saved.');
              params = {
                label: label.label,
                address: tileItem,
                index: tileItem.index
              };
              scope.decorateAddresses(params, true);
            })
            .catch(NotifyService.errorHandler);
          }
          // If there was no new label provided
          else {
            // if the label is default, cancel the save
            if (tileItem.label === "Receive Address " + tileItem.index) {
              scope.cancelMainLabelSave();
              return;
            }
            return LabelsAPI.remove(params)
            .then(function(label) {
              NotifyService.success('The label was removed.');
              params = {
                label: 'Receive Address ' + tileItem.index,
                address: tileItem,
                labelIsDefault: true,
                index: tileItem.index
              };
              scope.decorateAddresses(params, true);
            })
            .catch(NotifyService.errorHandler);
          }
        };
      }
    };
  }
]);
