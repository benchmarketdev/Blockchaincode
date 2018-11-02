/**
 * @ngdoc directive
 * @name bgJsonDecrypt
 * @description
 * decrypts the json from a box D keycard input
 * @example
 *   <input bg-json-decrypt recovery-info="foo" wallet-data="bar" />
 */
angular.module('BitGo.Common.BGJsonDecryptDirective', [])

.directive('bgJsonDecrypt', ['$parse', '$timeout', 'SDK',
  function($parse, $timeout, SDK) {
    return {
      restrict: 'A',
      require: '^ngModel',
      scope: {
        recoveryInfo: '=',
        walletData: '='
      },
      link: function(scope, elem, attrs, ngModel) {
        // the json from the input
        var json;

        /**
        * Decrypt json for encrypted passcode with the
        * @returns unencryptedPasscode {String}
        * @private
        */
        function decryptJSON() {
          try {
            return SDK.decrypt(scope.recoveryInfo.passcodeEncryptionCode, json);
          } catch (e) {
            return undefined;
          }
        }

        /**
        * Attempt to decrypt the wallet passcode and then set
        * the decrypted value on the current wallet being recovered
        * @private
        */
        function tryDecrypt() {
          json = ngModel.$viewValue.replace(/ /g, "");
          try {
            JSON.parse(json);
          } catch(error) {
            console.error('Invalid Box D input: invalid JSON');
            return false;
          }
          // update the view value with valid json
          ngModel.$setViewValue(json);
          ngModel.$render();
          // set the password on the wallet recovery data object
          scope.walletData.decryptedKeycardBoxD = decryptJSON();
        }

        elem.bind('change', function() {
          tryDecrypt();
        });

        elem.bind('focus', function() {
          tryDecrypt();
        });

        elem.bind('focusout', function() {
          tryDecrypt();
        });
      }
    };
  }
]);
