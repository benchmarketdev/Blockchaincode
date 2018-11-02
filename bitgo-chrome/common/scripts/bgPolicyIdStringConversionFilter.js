/*
 * @ngdoc filter
 * @name bgPolicyIdStringConversion
 * @param policyId {String}
 * @description
 * Converts a policy id to a string
 * @example
 * {{ "com.bitgo.whitelist.address" | bgPolicyIdStringConversion }} => 'bitcoin address whitelist'
*/
angular.module('BitGo.Common.BGPolicyIdStringConversionFilter', [])

.filter('bgPolicyIdStringConversion', ['BG_DEV',
  function (BG_DEV) {
    return function(policyId) {
      if (!policyId) {
        return;
      }
      if (!_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, policyId)) {
        throw new Error('invalid policy id');
      }
      var converters = {
        "com.bitgo.whitelist.address": 'bitcoin address whitelist',
        "com.bitgo.limit.tx": 'transaction spending limit',
        "com.bitgo.limit.day": 'daily spending limit'
      };
      return converters[policyId];
    };
  }
]);
