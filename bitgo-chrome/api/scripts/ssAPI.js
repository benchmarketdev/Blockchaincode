/**
 * @ngdoc service
 * @name ssAPI
 * @description
 * This module is for managing all http requests for all ShapeShift API in the app
 * Also contains other api related methods like a list of errors, get errors etc.
 */
angular.module('BitGo.API.ssAPI', [])
.factory('ssAPI', ['$http', '$q', '$location', '$resource', '$rootScope', 'UtilityService', 'CacheService',
  function($http, $q, $location, $resource, $rootScope, UtilityService, CacheService) {
    // Shapeshift API endpoint
    var kApiServer            = 'https://shapeshift.io/';

    // simple in-memory
    var coinsList            = [];

    /**  Shapeshift errors **/
    var shiftErrors           = {
      // This error should never happens, if happens there is a bug on the code :(
      unknownPair: {
        err: 'Unknown pair',
        msg: 'The selected address is temporarily unavailable for trades. Please try again later.'
      },
      // This error comes from Shapeshift
      invalidCoinType: {
        err: 'Please enter a valid alt-coin address or change the currency symbol',
        msg: 'Please enter a valid altCoin address or change the coin type'
      },

      invalidCoinAddress: {
        err: 'Please enter a valid address',
        msg: 'Please enter a valid address'
      },

      invalidReturnAddress: {
        err: 'Warning: Return address appears to be invalid for the deposit coin type.(final)',
        msg: 'Return address appears to be invalid for the deposit coin type. Please try again later.'
      },

      unavailableForTrades: {
        err: 'That pair is temporarily unavailable for trades.',
        msg: 'The selected address is temporarily unavailable for trades'
      },

      // On a API call
      unableToContactAPI: {
        err: 404,
        msg: 'Unable to connect to ShapeShift. Please try again later.'
      },

      unableToGetSelectedCoin: {
        err: 'unableToGetSelectedCoin',
        msg: 'Please select a type of address to send bitcoins'
      },

      failedGetDepositAddress: {
        err: 'Failed to get deposit address.',
        msg: 'Unable to get deposit address from ShapeShift. Please try again later.'
      },

      shapeShiftWithdrawlAddress: {
        err: 'Please enter an address belonging to an external wallet.',
        msg: 'Please enter an address belonging to an external wallet.'
      },

      // Logic error when user exceeds shapeshift limit
      limitExceeded: {
        err: 'limitExceeded',
        msg: 'This transaction amount exceeds the ShapeShift limit'
      },
      // Logic error when user exceeds shapeshift limit
      underLimit: {
        err: 'underLimit',
        msg: 'This transaction amount is below the Shapeshift limit'
      },
      // Error requesting deposit address to shapeshift
      unableToGetDepositAddress: {
        err: 'unableToGetDepositAddress',
        msg: 'Unable to get deposit address from ShapeShift'

      },

      missingAltCoinName: {
        err: 'missingAltCoinName',
        msg: 'An error has occurred. Please try again later.'
      },

      invalidShiftParameters: {
        err: 'invalidShiftParameters',
        msg: 'An error has occurred. Please try again later.'
      },

      timeoutError: {
        err: 0,
        msg: 'Unable to process ShapeShift request. Please try again later.'
      },

      // default:
      defaultError: {
        err: 'defaultError',
        msg: 'Unable to process ShapeShift request. Please try again later.'
      }
    };

    var coinsImages = {
      BTC: "/img/coins/bitcoin.png",
      BLK: "/img/coins/blackcoin.png",
      BITUSD:  "/img/coins/bitusd.png",
      BTS: "/img/coins/bitshares.png",
      BTCD:  "/img/coins/bitcoindark.png",
      CLAM:  "/img/coins/clams.png",
      XCP:  "/img/coins/counterparty.png",
      DASH: "/img/coins/dash.png",
      DGB:  "/img/coins/digibyte.png",
      DOGE: "/img/coins/dogecoin.png",
      FTC: "/img/coins/feathercoin.png",
      GEMZ:  "/img/coins/gemz.png",
      LTC:  "/img/coins/litecoin.png",
      MSC:  "/img/coins/mastercoin.png",
      MINT:  "/img/coins/mintcoin.png",
      MAID:  "/img/coins/maidsafe.png",
      XMR: "/img/coins/monero.png",
      NMC: "/img/coins/namecoin.png",
      NBT: "/img/coins/nubits.png",
      NXT:  "/img/coins/nxt.png",
      NVC: "/img/coins/novacoin.png",
      POT:  "/img/coins/potcoin.png",
      PPC: "/img/coins/peercoin.png",
      QRK:  "/img/coins/quark.png",
      RDD:  "/img/coins/reddcoin.png",
      XRP: "/img/coins/ripple.png",
      SDC: "/img/coins/shadowcash.png",
      START:  "/img/coins/startcoin.png",
      SJCX: "/img/coins/storjcoinx.png",
      SWARM: "/img/coins/swarm.png",
      USDT: "/img/coins/tether.png",
      UNO: "/img/coins/unobtanium.png",
      VRC: "/img/coins/vericoin.png",
      VTC: "/img/coins/vertcoin.png",
      MONA: "/img/coins/monacoin.png",
      IFC: "/img/coins/infinitecoin.png",
      STR: "/img/coins/stellar.png",
      FLO: "/img/coins/florincoin.png",
      IOC: "/img/coins/iocoin.png",
      NEOS: "/img/coins/neoscoin.png",
      IXC: "/img/coins/ixcoin.png",
      OPAL: "/img/coins/opal.png",
      TRON: "/img/coins/positron.png",
      ARCH:  "/img/coins/arch.png",

      DEFAULT: '/img/coins/default.png'
    };

    /**
     * Set into the coinsList object the list of coins
     * @param altCoins {Object} list of coins that comes from the ShapeShift API
     * @private
     */
    function loadAltCoinList(altCoins) {

      if (!altCoins) {
        throw new Error('missing alt coins');
      }

      // Create an entry record for each avaiable coin
      _.forIn(altCoins, function(altCoin) {
        // It is a coin? It is available?
        if (altCoin.status === 'available') {
          coinsList.push(getCoinEntry(altCoin));
        }
      });
    }

    /**
      This function sorts the list of coins based on the name
      property
      A-Z
      @private
    */
    function sortCoins() {
      coinsList.sort(function(a,b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
    }

    /**
      Creates a coin object, which is a representation of the coin but with extra attributes.
      @param altCoin Shapeshift object of the coin
      @returns {object}
      @private
    */
    function getCoinEntry(altCoin) {

      var entry = {
        name:     altCoin.name,
        symbol:   altCoin.symbol,
        image:    getCoinImage(altCoin.symbol),
        status:   altCoin.status,

        //The following attributes are going to be fulfilled on the marker info
        // request to shapeshift
        rate:     0,
        limit:    0,
        min:      0,
        minerFee: 0
      };

      return entry;
    }


    /**
      Search in the memory coinsList a coin by name
      @param name Name of the coin to Search
      @returns {object} - coin from coin list
      @private
    */
    function getByName(name) {
       return _.find(coinsList, function(altCoin) {
         return altCoin.name === name;
       });
    }

    /**
      There are two types of errors because of the design of the API
      1. Is when something fail on the request eg. Calling a non existing endpoint,
         this will cause the promise to fail, and the response will be on the format
         { status: 000, statusText: 'Error XXX' }
      2. The second escenario is when something fails internally, in this case
         we are going to receive the response 200, but the json will be like:
         { error: 'Unknown pair'}
      3. This third one is a logic one, so an error caused by us on the process, eg:
         We validate if the amount exceeds what ShapeShift supports, if exceed we throw an Error
         that will be founded here.

      So this function will look in the errors variable a match either for the status
      or the error string, and will return an object that handle several escenarios.
    
    @param {object} error
    @returns {object} - formatted error
    @public
    */
    function getError(error) {

      var err = error;
      // Do we have an error ?
      if(!_.isUndefined(err)) {

        // Find and get the error
        // It is on the message?
        if(!_.isUndefined(error.message)) {
          err = error.message;
        }else if (!_.isUndefined(error.status)) {
          err = error.status;
        }
        /**
          Shapeshift does not have a standard way of telling the user that it is using
          a address different than his chosing,
          Eg:
          Please enter a Bitshares registered account name or change the exchange type
          Please enter a Litecoin address or change the exchange type
        */
        if (err.startsWith("Please enter") && (err.endsWith("or change the currency symbol") || err.endsWith("change the exchange type"))) {
          shiftErrors.invalidCoinType.msg = err;
          return shiftErrors.invalidCoinType;
        }

        return _.find(shiftErrors, function(shiftError) {
          return shiftError.err === err;
        });
      }else{
        return err;
      }
    }


    /**
      Request the list of coins to shapeshift api
      url: shapeshift.io/getcoins
      method: GET

      Success Output:

          {
              "SYMBOL1" :
                  {
                      name: ["Currency Formal Name"],
                      symbol: <"SYMBOL1">,
                      image: ["https://shapeshift.io/images/coins/coinName.png"],
                      status: [available / unavailable]
                  }
              (one listing per supported currency)
          }

      The status can be either "available" or "unavailable". Sometimes coins become temporarily unavailable during updates or
      unexpected service issues.
    */
    function list() {

      // Cache was already loaded - return it
      if (!_.isEmpty(coinsList)) {
        return $q.when(coinsList);
      }

      // Get the list  of coins from ShapeShift
      var resource = $resource(kApiServer + 'getcoins/', {});
        return resource.get({}).$promise
        .then(
          function(data) {
            // Does Shapeshift return an error? :(
            if(!_.isUndefined(data.error)) {
              // Let's raise the exception to be handled on the catch block
              throw new Error(data.error);
            }
            // Load the coins in our in-memory object array
            loadAltCoinList(data);
            // Sort the coins
            sortCoins();
            // Return the in=memory object array
            return coinsList;
          }
        );
      }

    /**
      This is the primary data input into ShapeShift
      @public
      @param: {
        url:  shapeshift.io/shift
        method: POST
        data type: JSON
        data required:
        withdrawal     = the address for resulting coin to be sent to
        pair           = what coins are being exchanged in the form [input coin]_[output coin]  ie btc_ltc
        returnAddress  = (Optional) address to return deposit to if anything goes wrong with exchange
        destTag        = (Optional) Destination tag that you want appended to a Ripple payment to you
        rsAddress      = (Optional) For new NXT accounts to be funded, you supply this on NXT payment to you
        apiKey         = (Optional) Your affiliate PUBLIC KEY, for volume tracking, affiliate payments, split-shifts, etc...
      }
      example data: {"withdrawal":"AAAAAAAAAAAAA", "pair":"btc_ltc", returnAddress:"BBBBBBBBBBB"}

      Success Output:
        {
          deposit: [Deposit Address (or memo field if input coin is BTS / BITUSD)],
          depositType: [Deposit Type (input coin symbol)],
          withdrawal: [Withdrawal Address], //-- will match address submitted in post
          withdrawalType: [Withdrawal Type (output coin symbol)],
          public: [NXT RS-Address pubkey (if input coin is NXT)],
          xrpDestTag : [xrpDestTag (if input coin is XRP)],
          apiPubKey: [public API attached to this shift, if one was given]
        }
    */
    function shift(params) {
      // We require the name of the coin to exchange
      if (_.isUndefined(params) || params  === null) {
        throw new Error('invalidShiftParameters');
      }
      // Make API call to shapeshift :)
      var resource = $resource(kApiServer + 'shift/' , {});
      return resource.save(params).$promise;
    }

    /**
      Create the params object to be passed to the shift endpoint call
      @private
      @param params: 
      {
        recipientAddress: withdrawal address / alt-coin address
        symbol: alt-coin symbol
      }
      @return object which has valid parameters to be passed to the shapeshift api/shift method.
      return {
        pair:           'btc_' + params.symbol,
        returnAddress:  Optional return address
        withdrawal:     recipientAddress
      }
    */
    function getShiftParams(params) {
      // Required parameters
      if (_.isUndefined(params.recipientAddress) || _.isUndefined(params.symbol)) {
        throw new Error('invalidShiftParameters');
      }

      // Do we want to create an address to receive bitcoins?
      if (!_.isUndefined(params.receive) && params.receive === true) {

       return {
         pair:       params.symbol + '_btc',
         withdrawal: params.recipientAddress // We are going to sent the coins to our wallet :) TODO: FOR TEST'3BJtUYdrLuWL8AjrPuX9S94BpGZdQ8kWt2'
       };

      } else {
       // Ohh right, we are going to send to an alternative address
       return {
         pair:  'btc_' + params.symbol,
         returnAddress:  params.returnAddress,
         withdrawal:     params.recipientAddress
       };
      }
    }

    /**
    url: shapeshift.io/marketinfo/[pair]
    method: GET

    [pair] (OPTIONAL) is any valid coin pair such as btc_ltc or ltc_btc.
    The pair is not required and if not specified will return an array of all market infos.

    Success Output:
      {
        "pair"     : "btc_ltc",
        "rate"     : 130.12345678,
        "limit"    : 1.2345,
        "min"      : 0.02621232,
        "minerFee" : 0.0001
      }

      @param {string} name: Symbol of the altcoin
      {boolean} receive: Whether we are sending or receiving altcoins
    */
    function getMarketInfo(name, receive) {
      // We require the name of the coin to exchange, we supposed to never
      // catch this error, if happens we have a bug :(
      if (_.isUndefined(name) || name  === null) {
        throw new Error('missingAltCoinName');
      }

      // Get the alt coin loaded from cached
      var altCoin = getByName(name);
      // Pair is the symbol of two different coins
      var pair = "btc_" + altCoin.symbol;
      // If we are receiving then the pair is alt_coin/btc
      if (receive === true) {
        pair = altCoin.symbol + "_btc";
      }

      // Get the market info from the shapeshift API,
      // we will set the rate to the coin information and return the promise :)
      var resource = $resource(kApiServer + 'marketinfo/' + pair, {});
      return resource.get({}).$promise
      .then(
        function(data) {
          // Does Shapeshift return an error? :(
          if(!_.isUndefined(data.error)) {
            // Let's raise the exception to be handled on the catch block
            throw new Error(data.error);
          }

          // Let's finish fullfilling the alt coin object
          altCoin.rate      = data.rate;
          altCoin.limit     = data.limit;
          altCoin.min       = data.minimum;
          altCoin.minerFee  = data.minerFee;
          return altCoin ;
        }
      );
    }
    /*
      function which gets the altcoin image string. If not present, return default image
      @param {object} coin
      @returns {string} - Source of the altcoin image
      @public
    */
    function getCoinImage(coin) {
      return _.isUndefined(coinsImages[coin]) ?  coinsImages.DEFAULT : coinsImages[coin];
    }

    /*
      function used to convert decimal to integer. Multiplies with 1e8
      Used when doing arithmetic with altcoin rate
      @param {Integer} 
      @returns {Integer}
      @public
    */
    function decimalToInteger(val) {
      return parseInt(val * 1e8, 10);
    }

    /*
      function used to convert integer to decimal. Divided with 1e8
      Used when doing arithmetic.
      @param {Integer} 
      @returns {Integer}
      @public
    */
    function integerToDecimal(val) {
      return val / 1e8;
    }


    // In-client API
    return {
      list: list,
      getMarketInfo: getMarketInfo,
      getError: getError,
      getByName: getByName,
      getCoinImage: getCoinImage,
      getShiftParams: getShiftParams,
      shift: shift,
      decimalToInteger: decimalToInteger,
      integerToDecimal: integerToDecimal
    };
  }
]);
