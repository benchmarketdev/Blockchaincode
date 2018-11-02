/**
 * @ngdoc directive
 * @name walletPolicyWhitelistAdd
 * @description
 * Manages the whitelist add new address section
 * @example
 *   <div wallet-policy-whitelist-add></div>
 */
angular.module('BitGo.Wallet.WalletPolicyWhitelistAddDirective', [])

.directive('walletPolicyWhitelistAdd', ['$rootScope', 'NotifyService', 'PolicyAPI', 'LabelsAPI', 'WalletsAPI', 'WalletModel', 'SDK',
  function($rootScope, NotifyService, PolicyAPI, LabelsAPI, WalletsAPI, WalletModel, SDK) {
    return {
      restrict: 'A',
      require: '^?walletPolicyWhitelistManager',
      controller: ['$scope', function($scope) {
        // data for an address to be added to the whitelist policy
        $scope.newAddress = null;

        function formIsValid() {
          if (!$scope.newAddress.address || !SDK.get().verifyAddress({address: $scope.newAddress.address})) {
            $scope.setFormError('Please enter a valid bitcoin address.');
            return false;
          }
          if (!$scope.newAddress.label) {
            $scope.setFormError('Please enter a label for the address.');
            return false;
          }
          return true;
        }

        function resetForm() {
          $scope.newAddress = {
            address: null,
            label: ''
          };
        }

        /**
         * Save the label for an address
         */
        function saveAddressLabel() {
          // Handle data
          var params = {
            walletId: $rootScope.wallets.current.data.id,
            address: $scope.newAddress.address,
            label: $scope.newAddress.label
          };
          return LabelsAPI.add(params);
        }

        /**
         * Add an address to a whitelist for a wallet
         */
        $scope.addAddress = function() {
          var params = {
            bitcoinAddress: $rootScope.wallets.current.data.id,
            rule: {
              id: $scope.policy.id,
              type: 'bitcoinAddressWhitelist',
              condition: {
                add: $scope.newAddress.address
              },
              action: { type: 'getApproval' }
            }
          };
          return $scope.updatePolicy(params)
          .then(saveAddressLabel)
          .then($scope.initPolicy)
          .catch(NotifyService.errorHandler)
          .finally(function() {
            resetForm();
            $scope.setState('list');
          });
        };

        /**
         * Handle form validation/errors and new address submittal
         */
        $scope.submitNewAddressForm = function() {
          // clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            $scope.addAddress();
          }
        };

        function init() {
          resetForm();
        }
        init();
      }]
    };
  }
]);
