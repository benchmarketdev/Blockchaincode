/**
 * @ngdoc directive
 * @name modalReceiveAltCoin
 * @description
 * Manages AltCoin receive process, it shows the dropdown with
 * the different coins loaded, then when the user selects one of them
 * it makes a call to the ssAPI to retreive the deposit address
 * and the rate of conversion between pairs, it also shows a qr code with
 * the generated address
 */
angular.module('BitGo.Modals.ModalReceiveAltCoinDirective', [])

.directive('modalReceiveAltCoin', ['$rootScope',
  function($rootScope) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: ['$scope', 'ssAPI', 'NotifyService', function($scope, ssAPI, NotifyService) {

        // Does an error happens inside the dropdown?
        $scope.hasAltErrors           = false;
        // Its the dropdown unable to load the altcions?
        $scope.unableToLoadAltCoins   = false;
        // Are we generating a receive address for the altCoin?
        $scope.addressBeingGenerated  = false;
        // the transaction object built as the user goes request a new receive address
        $scope.receiveAltCoin = {

          // Wrap the whole shapeshift integration into this object
          altCoin: {

            useAltCoin:   false, // This flag tells if user wants to use an alt Coin
            selected:     null,  // Selected alternative coin from the dropdown
            receive:      true, // Flag to know if we are going to receive or send bitcoins

            symbol:       null,  // Symbol of the selected coin
            rate:         0,     // Conversion rate between bitcoins and the alt coin
            limit:        0,     // Shapeshift max limit for exchange.
            min:          0,     // Shapeshift minimun limit for exchange
            minerFee:     0,     // Miner Fees

            recipientAddress: $rootScope.wallets.current.data.id, // For receiving we are going to be the recipient address :)
            returnAddres:     null, // Returning address for Shapeshift
            depositAddress:   null, // Shapeshift deposit address
            label: null,
            // We need to ignore bitcoins in the dropdown
            // those are not required for the receive
            ignoreList: ['BTC']
          }
        };

        /**
          Set the values to the current scope using the marketInfo response
          @private setAltCoinValuesToScope
          @param altCoin: Received data from ssAPI when calling the marketInfo api.
        */
        function setAltCoinValuesToScope(altCoin) {
          $scope.receiveAltCoin.altCoin.rate             = altCoin.rate;
          $scope.receiveAltCoin.altCoin.limit            = altCoin.limit;
          $scope.receiveAltCoin.altCoin.min              = altCoin.min;
          $scope.receiveAltCoin.altCoin.minerFee         = altCoin.minerFee;
          $scope.receiveAltCoin.altCoin.symbol           = altCoin.symbol;

          $scope.receiveAltCoin.altCoin.label            = $scope.receiveAltCoin.altCoin.selected;
        }
        /**
        This method validates the shift response data, by cheking
        the values on the response, if the data.error key is present
        means that we receive an error from Shapeshift :(
        @private validateShiftResponse
        @param data: Incoming response when fetching data from ssAPI
        */
        function validateShiftResponse(data) {
          // Something happens with Shapeshift? We should not hit
          // this statement never.
          if (_.isUndefined(data) || data === null) {
            throw new Error('unableToGetDepositAddress');
          }

          // Does Shapeshift return an error? :(
          if(!_.isUndefined(data.error)) {
            // Let's raise the exception to be handled on the catch block
            throw new Error(data.error); // handled on the catch block
          }
        }

        /**
          When user change the type of coin we generate a new address for this
          by calling the ShapeShift API, to retreive a deposit address for it
          @public
        */
        $scope.changeCoin = function(altCoin) {

          // Get the coin
          $scope.receiveAltCoin.altCoin.selected = altCoin.name;
          //var altCoin = ssAPI.getByName($scope.receiveAltCoin.altCoin.selected);
          $scope.receiveAltCoin.altCoin.symbol  = altCoin.symbol;
          $scope.addressBeingGenerated          = true;
          $scope.hasAltErrors                   = false;
          // Use the Shapeshift API to get market info like rates, and limits
          ssAPI.getMarketInfo($scope.receiveAltCoin.altCoin.selected, true)
          .then(function(altCoin) {
            // Let's check the response
            validateShiftResponse(altCoin);
            // Fill required data for shapeshift exchange.
            setAltCoinValuesToScope(altCoin);
            // Let's get the deposit address from Shapeshift :)
            var shiftParams = ssAPI.getShiftParams($scope.receiveAltCoin.altCoin);
            return ssAPI.shift(shiftParams);
          })
          .then(function(data) {
            // Let's check the response
            validateShiftResponse(data);
            // Asign the received address from shapeshift to be displayed on screen
            $scope.receiveAltCoin.altCoin.depositAddress = data.deposit;
            $scope.receiveAltCoin.altCoin.useAltCoin = true;
          })
          .catch(function (error) {
            $scope.hasAltErrors = true;
            // Try to find the error on the ShapeShift error dictionary, if the error is found means
            // that a known error happens on the shapeshift flow.
            var shapeshiftError = ssAPI.getError(error);
            if (shapeshiftError !== null) {
              // Show the error
              NotifyService.error(shapeshiftError.msg);
            }else{
              NotifyService.errorHandler(error);
            }
          })
          .finally(function() {
            $scope.addressBeingGenerated = false;
          });
        };
      }]
    };
  }
]);
