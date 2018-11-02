/* istanbul ignore next */
angular.module('BitGo.API.PolicyAPI', [])

.factory('PolicyAPI', ['$rootScope', 'SDK',
  function($rootScope, SDK) {

    /**
    * Update a policy rule on specified wallet
    * @param params {Object} params for the the policy update
    * @private
    */
    function updatePolicyRule(params) {
      if (!params.rule || !params.bitcoinAddress) {
        throw new Error('invalid params');
      }
      console.log(JSON.stringify(params.rule, null, 2));
      return SDK.wrap(
        SDK.get()
        .newWalletObject({id: params.bitcoinAddress})
        .updatePolicyRule(params.rule)
      );
    }

    /**
    * Delete a policy rule on specified wallet
    * @param params {Object} params for the the policy update
    * @private
    */
    function deletePolicyRule(params) {
      if (!params.id || !params.bitcoinAddress) {
        throw new Error('invalid params');
      }
      return SDK.wrap(
        SDK.get()
        .newWalletObject({id: params.bitcoinAddress})
        .deletePolicyRule({id: params.id})
      );
    }

    // In-client API
    return {
      updatePolicyRule: updatePolicyRule,
      deletePolicyRule: deletePolicyRule
    };
  }
]);
