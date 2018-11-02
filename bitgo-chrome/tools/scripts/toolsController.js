/**
 * @ngdoc controller
 * @name ToolsController
 * @description
 * Manages the all functionality for the new key creation tool
 */
angular.module('BitGo.Tools.ToolsController', [])

.controller('ToolsController', ['$scope', 'SDK', 'KeychainsAPI',
  function($scope, SDK, KeychainsAPI) {
    $scope.random = '';
    $scope.creationDate = new Date().toLocaleString();

    // Generates a BIP32 key and populates it into the scope.
    $scope.onGenerateBIP32Key = function() {
      SDK.sjcl.random.addEntropy($scope.random, $scope.random.length, 'user');
      $scope.newKey = KeychainsAPI.generateKey();
      $scope.xpub = $scope.newKey.neutered().toBase58();
      $scope.xprv = $scope.newKey.toBase58();
      $scope.address = $scope.newKey.pubKey.getAddress(SDK.getNetwork()).toBase58Check();
    };
  }
]);
