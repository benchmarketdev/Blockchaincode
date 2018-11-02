/**
 * @ngdoc directive
 * @name bgInputToSatoshiConverter
 * @description
 * Converts an input from the rootScope's bitcoin unit to satoshis
 */
angular.module('BitGo.Common.BGInputToSatoshiConverterDirective', [])

.directive('bgInputToSatoshiConverter', ['$rootScope', '$parse', '$timeout',
  function ($rootScope, $parse, $timeout) {
    return {
      restrict: 'A',
      require: '^ngModel',
      link: function(scope, elem, attrs, ngModel) {
        // $setViewValue() and $render triggers the parser a second time.
        // Avoid an infinite loop by using the last known returned value
        var RETURNED_VAL;
        // Used to set cursor position based on change in input
        var OLD_RETURNED_VAL='';
        // valid types to use in conversions
        var TYPES = {
          BTC: {
            modifier: 1e8,
            decimalLength: 8
          },
          BTC8: {
            modifier: 1e8,
            decimalLength: 8
          },
          bits: {
            modifier: 1e2,
            decimalLength: 2
          },
          satoshis: {
            modifier: 1,
            decimalLength: 0
          }
        };

        /**
        * sets error when present. Requires name attribute to be set.
        * @param value {Boolean} - If error is present or not
        * @private
        */
        function setError(value) {
          if (attrs.name) {
            var err = attrs.name;
            scope[err + 'Error'] = value;
          }
        }

        setError(false);

        // app's current bitcoin unit
        var unit = attrs.bitcoinUnit ||  $rootScope.currency.bitcoinUnit;

        /**
        * checks if the value entered is divisible by one satoshi. If so, sets the error
        * @param value {String} value from the input
        * @param type {String} type to convert from
        * @private
        */
        function checkSatoshiError(limitValue, type) {
          if (!limitValue || !type) {
            setError(false);
            return;
          }
          // try to get the number after the decimal place
          var checkDecimal = limitValue.split('.');
          if (checkDecimal.length > 1) {
            decimalLength = checkDecimal[1].length;
            // check if the decimal length is greater than allowed for the currency type
            if (decimalLength > TYPES[type].decimalLength) {
              if (Number(checkDecimal[1].substr(TYPES[type].decimalLength)) > 0) {
                setError(true);
                return;
              }
            }
          }
          setError(false);
        }

        // returns the position of the cursor on the input field
        // http://stackoverflow.com/questions/263743/caret-position-in-textarea-in-characters-from-the-start
        function getCursorPosition() {
          //for browsers other than ie
          if (elem[0].selectionStart) {
            return elem[0].selectionStart;
          } else if (!document.selection) {
            return 0;
          }
          // for ie
          var c = "\001";
          var sel = document.selection.createRange();
          var dul = sel.duplicate();
          var len = 0;

          dul.moveToElementText(node);
          sel.text = c;
          len = dul.text.indexOf(c);
          sel.moveStart('character',-1);
          sel.text = "";
          return len;
        }

        // sets the cursor of the cursor on the input field
        // http://stackoverflow.com/questions/22574295/set-caret-position-in-input-with-angularjs
        function setCursorPosition(caretPos) {
          // for ie
          if (elem[0].createTextRange) {
            try {
              var range = elem.createTextRange();
              range.move('character', caretPos);
              range.select();
            } catch(e) {
              elem[0].focus();
            }
          }
          // for browsers other than ie
          else {
            if (elem[0].selectionStart) {
              elem[0].focus();
              elem[0].setSelectionRange(caretPos, caretPos);
            } else{
              elem[0].focus();
            }
          }
        }

        /**
        * converts the view value to a satoshi value
        * @param value {String} value from the input
        * @param type {String} type to convert from
        * @private
        * @returns {Int} converted amount
        */
        function viewToModel(value, type) {
          var satoshiValue;
          if (!value && !value.toString()) {
            return;
          }
          if (!_.has(TYPES, type)) {
            throw new Error('Invalid type');
          }
          // parse out all non-digits and all but one decimal and trim to maxlength
          // Also, update the last known returned value (to avoid angular infinite looping)
          RETURNED_VAL = value.replace(/[^0-9\.]/g, '').replace(/(\..*)\./g, '$1');
          RETURNED_VAL = RETURNED_VAL.slice(0, attrs.maxLength);
          // set the view value
          $timeout(function() {
            var cursorPosition = getCursorPosition();
            ngModel.$setViewValue(RETURNED_VAL);
            ngModel.$render();
            // incase the user actually inputs a valid chracter, set the cursor according to where it was before
            if (RETURNED_VAL !== OLD_RETURNED_VAL) {
              setCursorPosition(cursorPosition);
            }
            OLD_RETURNED_VAL = RETURNED_VAL;
          }, 0);

          checkSatoshiError(RETURNED_VAL, type);
          // check if just a decimal point is entered. If so, change the value to 0.
          if(RETURNED_VAL === '.') {
            RETURNED_VAL = '0.';
          }
          satoshiValue = Number(RETURNED_VAL) * TYPES[type].modifier;
          return Math.round(satoshiValue);
        }

        // Event Handlers
        elem.bind('focus', function () {
          setError(false);
        });

        /**
        * converts the model value (satoshi) to the correct bitcoin value
        * @param value {String} value from the input
        * @param type {String} type to convert from
        * @private
        * @returns {Int} converted amount
        */
        function modelToView(value, type) {
          if (value && !value.toString()) {
            return;
          }
          if (!_.has(TYPES, type)) {
            throw new Error('Invalid type');
          }

          var valueAux = value / TYPES[type].modifier;
          // If the attribute toFixed is passed into the element
          // the resulting view value will be formatted using that number.
          if(typeof attrs.toFixed !== 'undefined') {
            valueAux = parseFloat(parseFloat(valueAux).toFixed(attrs.toFixed));
          }
          return valueAux;
        }

        // conversion "view -> model"
        ngModel.$parsers.unshift( function(value){
          return viewToModel(value, unit);
        });
        // conversion "model -> view"
        ngModel.$formatters.unshift(function formatter(modelValue){
          return modelToView(modelValue, unit);
        });
      }
    };
  }
]);
