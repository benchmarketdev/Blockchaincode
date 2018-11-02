/*
  Notes:
  - This filter takes an input and formats the value according to an
  attribute type ('currency' || 'bitcoin')

  - E.g.:
    Note -> assume 350 current price, and currency is USD
  {{ 1 | bgBitcoinToCurrency:'BTC' }} => 350.00
  {{ 1 | bgBitcoinToCurrency:'bits' }} => .35
  {{ 10000000 | bgBitcoinToCurrency:'satoshis' }} => 350
*/
angular.module('BitGo.Common.BGBitcoinToCurrencyFilter', [])

.filter('bgBitcoinToCurrency', ['$rootScope', 'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function(bitcoinValue, bitcoinUnit) {
      // If unit not provided, assume satoshis
      bitcoinUnit = bitcoinUnit || 'satoshis';
      bitcoinValue = bitcoinValue || 0;
      var currency = $rootScope.currency;
      if (!currency || !currency.data) {
        console.error('Need valid $rootScope currency.data to convert bitcoin into currency');
        return;
      }
      if (_.isEmpty(currency.data.current)) {
        return currency.symbol + ' \u2014'; // em-dash
      }
      if (!bitcoinUnit || _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, bitcoinUnit) === -1) {
        throw new Error('Need valid bitcoinUnit when converting bitcoin into currency');
      }
      var multiplier;
      switch (bitcoinUnit) {
        case 'BTC':
        case 'BTC8':
          multiplier = 1;
          break;
        case 'bits':
          multiplier = 1e-6;
          break;
        case 'satoshis':
          multiplier = 1e-8;
          break;
      }
      var newValue = bitcoinValue * multiplier;
      var result = newValue * $rootScope.currency.data.current.last;
      return currency.symbol + ' ' + _.string.numberFormat(result, 2);
    };
  }
]);
