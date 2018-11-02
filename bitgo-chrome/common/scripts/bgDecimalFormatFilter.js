/*
  Notes:
  - This filter takes a number and transform fixed the decimals of it.
  - If given a value less than 1 (0.0005), 
    It shows the last decimal even if its greater than numberOfDecimals specified

  - E.g.:
  @param {Number} numberOfDecimals - null|'number'
  @param {Number} decorator - If invalid number will use this


  {{ 100000000 | bgDecimalFormat:null:nulll }} => '1.0000'
  {{ 50000000 | bgDecimalFormat:5:null }} => '5.00000'
  {{ 'string' | bgDecimalFormat:null:null }} => '--'
  {{ 'string' | bgDecimalFormat:null:'**' }} => '**'
*/
angular.module('BitGo.Common.BGDecimalFormatFilter', [])

.filter('bgDecimalFormat', ['$rootScope', 'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function(value, numberOfDecimals, decorator) {
      // default to 4 as the number of decimals
      numberOfDecimals  = numberOfDecimals || 4;
      decorator         = decorator || '--';

      // If there is no value return decorator
      if (!value) {
        return decorator;
      }
      // Remove text
      value = value.toString().replace(/[^0-9\.]/g, '').replace(/(\..*)\./g, '$1');
      if(!isNaN(value)) {
        var aux = value;
        if(aux > 0) {
          value = parseFloat(value).toFixed(numberOfDecimals);
          // There are cases when fixed for 2 decimals is not enought, we can get
          // 0.00 cause the original value is 0.00005 so we are going to loop
          // until we reach the first number so 0.000058 will become 0.00005

          while(parseFloat(value) === 0){
            value = parseFloat(aux).toFixed(numberOfDecimals++);
          }
        }
      }
      // After removing the text do we got something?
      if (!value || value.toString().length === 0) {
        return  decorator;
      }
      // Return the value formatted
      return value;
    };
  }
]);
