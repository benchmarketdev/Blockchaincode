angular.module('BitGo.API.TransactionsAPI', [])

.factory('TransactionsAPI', ['$location', '$rootScope', 'WalletsAPI', 'KeychainsAPI', 'SDK', 'BG_DEV',
  function($location, $rootScope, WalletsAPI, KeychainsAPI, SDK, BG_DEV) {
    /**
      * List all historical txs for a wallet
      * @param {object} wallet object
      * @param {object} params for the tx query
      * @returns {array} promise with array of wallettx items
      */
    /* istanbul ignore next */
    function list(wallet, params) {
      if (!wallet || !params) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(
        SDK.doGet(
          '/wallet/' + wallet.data.id + '/wallettx',
          { skip: params.skip || 0 }
        )
      );
    }

    /**
      * Get the tx history for a single wallettx item
      * @param {string} wallettx id
      * @returns {object} promise with the updated wallettx obj
      */
    /* istanbul ignore next */
    function getTxHistory(walletTxId) {
      if (!walletTxId) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(
        SDK.doGet('/wallettx/' + walletTxId)
      );
    }

    /**
      * Update a commment on a wallettx item
      * @param {string} wallet id
      * @param {string} wallettx id
      * @param {string} new comment for the transaction
      * @returns {object} promise with the updated wallettx obj
      */
    /* istanbul ignore next */
    function updateComment(walletId, walletTxId, comment) {
      if (!walletId || !walletTxId || typeof(comment) === 'undefined') {
        throw new Error('Invalid params');
      }
      return SDK.wrap(
        SDK.doPost('/wallettx/' + walletTxId + '/comment', {comment: comment})
      );
    }

    // In-client API
    return {
      getTxHistory: getTxHistory,
      updateComment: updateComment,
      list: list
    };
  }
]);
