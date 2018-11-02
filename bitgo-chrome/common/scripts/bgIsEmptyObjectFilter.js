/*

 * @ngdoc filter
 * @name bgIsObjectEmpty
 * @param {object} objects - The object you want to check if empty
 * @description
 * This filter checks whether the object passed in is empty pr not
   Particularly useful for ng-show/ng-hide
 * @example
 * <div ng-show="wallets.all | bgIsObjectEmpty">

    {{ {foo: "bar"} | bgIsObjectEmpty }} => false
    {{ {} | bgIsObjectEmpty }} => true
*/

angular.module('BitGo.Common.BGIsObjectEmptyFilter', [])

.filter('bgIsObjectEmpty', function () {
  var object;
  return function (objects) {
    for (var object in objects) {
      if (objects.hasOwnProperty(object)) {
          return false;
      }
    }
    return true;
  };
});