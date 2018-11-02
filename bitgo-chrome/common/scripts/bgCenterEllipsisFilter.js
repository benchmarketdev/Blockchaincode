/**
 * @ngdoc filter
 * @name BgCenterEllipsis
 * @description
 * This filter cuts a string to a given size by hiding the middle portion which is replaced by '...'
 * It leaves the first and last few characters as is
 * @example
 *   <div>{{ transactions.send.address | bgCenterEllipsis:12 }}</div>
 */

angular.module('BitGo.Common.BGCenterEllipsisFilter', [])

.filter('bgCenterEllipsis', function() {
  return function (address, maxLength) {
    if (!maxLength || isNaN(maxLength)) {
      throw new Error('missing params for BGAddressLengthFilter');
    }
    if (address) {
      var charLength = maxLength - 3;
      var oneSideLength = Math.floor(charLength/2);
      if (address.length > maxLength) {
        var transformedAddress = address.substring(0, oneSideLength);
        transformedAddress = transformedAddress + "...";
        transformedAddress = transformedAddress + address.substring(address.length - oneSideLength, address.length);
        return transformedAddress;
      }
    }
    return address;
  };
});