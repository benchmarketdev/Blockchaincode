// Model for Match Wallets
angular.module('BitGo.Models.MatchwalletModel', [])

.factory('MatchwalletModel', function() {

    function Matchwallet(matchwalletData) {
      this.data = matchwalletData;
    }

    return {
      Matchwallet: Matchwallet
    };
  }
);
