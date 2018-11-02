/*
  Notes:
  - This filter takes a bitcoin value input and converts from one bitcoin
    unit into another

  - E.g.:
  @param {String} decorator - 'symbol'|'name'|null
  @param {String} toType -  the target unit type: BTC|bits|satoshis (defaults to setting in $rootScope.currency)
  @param {String} fromType - the src unit type: BTC|bits|satoshis (defaults to satoshis)
  @param {Boolean} valueIfNull - return string instead of typical emdash (if bitcoinValue is undefined)
  @param {Boolean} useFullPrecision - use full precision

  {{ 100000000 | bgBitcoinFormat:'name' }} => '1.0000 BTC'
  {{ 50000000 | bgBitcoinFormat:'symbol' }} => 'Ƀ 0.5000'
  {{ 7 | bgBitcoinFormat:null:'bits':'BTC' }} => '7,000,000'
  {{ undefined | bgBitcoinFormat:null:null:null:'Unlimited' }} => 'Unlimited'
*/
angular.module('BitGo.Common.BGBitcoinFormatFilter', [])

.filter('bgBitcoinFormat', ['$rootScope', 'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function(bitcoinValue, decorator, toType, fromType, valueIfNull, useFullPrecision) {
      // default to satoshis as fromType
      fromType = fromType || 'satoshis';

      // If toType not explicitly provided, use user setting
      if (!toType) {
        var currency = $rootScope.currency;
        if (!currency) {
          console.error('Need valid $rootScope currency object or explicit toType');
          return;
        }
        toType = currency.bitcoinUnit;
      }

      var params = {
        BTC: {
          modifier: 1e8,
          decimals: 4,
          fullDecimals: 8,
          name: 'BTC',
          symbol: '\u0243'
        },
        BTC8: {
          modifier: 1e8,
          decimals: 8,
          fullDecimals: 8,
          name: 'BTC',
          symbol: '\u0243'
        },
        bits: {
          modifier: 1e2,
          decimals: 0,
          fullDecimals: 2,
          name: 'bits',
          symbol: '\u0180'
        },
        satoshis: {
          modifier: 1,
          decimals: 0,
          fullDecimals: 0,
          name: 'satoshis',
          symbol: 's'
        }
      };

      var prefix = '';
      var suffix = '';

      switch(decorator) {
        case 'symbol':
          prefix = params[toType].symbol + ' ';
          break;
        case 'name':
          suffix = ' ' + params[toType].name;
          break;
      }

      var decorate = function(s) {
        return prefix + s + suffix;
      };

      if (isNaN(parseFloat(bitcoinValue, 10))) {
        if (valueIfNull === null || valueIfNull === undefined) {
          valueIfNull = '\u2014'; // em-dash
        }
        return decorate(valueIfNull);
      }
      // ensure valid types
      if (!fromType || _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, fromType) === -1 ||
          !toType || _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, toType) === -1) {
        throw new Error('Need valid bitcoin unit types when converting bitcoin units');
      }

      var multiplier = params[fromType].modifier / params[toType].modifier;
      var value = bitcoinValue * multiplier;
      if (!value) {
        return decorate('0');
      }
      var decimals = useFullPrecision ? params[toType].fullDecimals : params[toType].decimals;
      return decorate(_.string.numberFormat(value, decimals));
    };
  }
]);
