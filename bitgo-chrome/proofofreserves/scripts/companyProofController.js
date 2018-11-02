/**
 * @ngdoc controller
 * @name CompanyProofController
 * @description
 * Manages all things dealing with a company-wide proof of reserves
 */
angular.module('BitGo.Proof.CompanyProofController', [])

.controller('CompanyProofController', ['$scope', '$rootScope', '$location', '$q', 'ProofsAPI', 'EnterpriseAPI', 'NotifyService',
  function($scope, $rootScope, $location, $q, ProofsAPI, EnterpriseAPI, NotifyService) {

    var DEFAULT_PROOF_ID = 'latest';

    var ERROR_HANDLERS = {
      // handle specific error cases from failed fetches
      SERVER_INVALID_PROOF_ID: 'invalid proof id',
      SERVER_MISSING_ENTERPRISE: 'missing enterprise',
      // handle client-specific failure cases
      CLIENT_FAIL_SINGLE_LIABILITY_BUILD: 'could not build single liability',
      CLIENT_INVALID_URL_FOR_REDIRECT: 'invalid url for redirect',
      CLIENT_NEEDS_REDIRECT_FROM_LATEST: 'needs redirect from latest'
    };
    // Boolean wto check if url entered is valid
    var validUrl = true;
    // Data for user-specific liabilities
    $scope.allUserLiabilities=[];

    // Holds the basic info for the current enterprise proof we're fetching
    $scope.currentEnterprise = undefined;

    // a pretty timestamp of the current enterprise proof
    $scope.prettyEnterpriseProofTimestamp = undefined;

    // visibility of details (which section is open)
    $scope.detailsVisible = undefined;

    // UI visible proof data for the enterprise and single user proofs
    $scope.enterpriseProofs = [];

    // an object holding all search query params from the url
    var query = $location.search();

    // Enterprise-specific data in the url - required
    // specific id for the enterprise proof to fetch
    var urlProofId;
    // enterprise name
    $scope.urlEnterpriseName = undefined;

    // User-specific data in the url - not required
    // nonce for the user for a specific liability proof
    var urlNonce;
    // id of the user that for which we're fetching a specific liability
    $scope.urlUserId = undefined;

    /**
    * Utility function to let us know if we're fetching a specific liability proof
    * @private
    * @returns { Bool }
    */
    function isUserSpecificProofUrl() {
      return query && _.has(query, 'user');
    }

    /**
    * Utility function to let us know if the url is right
    * @public
    * @returns { Bool }
    */
    $scope.isValidUrl = function() {
      return validUrl && ($scope.allUserLiabilities.length || !isUserSpecificProofUrl());
    };

    $scope.toggleDetails = function(section) {
      if ($scope.detailsVisible === section) {
        $scope.detailsVisible = undefined;
      } else {
        $scope.detailsVisible = section;
      }
    };

    $scope.detailsOpen = function(section) {
      return $scope.detailsVisible === section;
    };

    $scope.detailsLabel = function(section) {
      return $scope.detailsOpen(section) ? 'Close' : 'Details';
    };

    $scope.formatBalance = function(balance) {
      balance = Number(balance);
      var parts = balance.toString().split('.');
      var decimals = 2;
      if (parts.length === 2 && parts[1].length > 2) {
        decimals = parts[1].length;
      }
      return _.string.numberFormat(balance, decimals);
    };

    /**
    * URL - Parses the URL for all data we need to instantiate the proof controller
    * @private
    */
    function urlParseForParams() {
      // Valid / expected url formats:

      // /vbb/:enterpriseName/latest
      // /vbb/:enterpriseName/latest?user=[someuserid]&nonce=[somenonce]
      // /vbb/:enterpriseName/:proofId
      // /vbb/:enterpriseName/:proofId?user=[someuserid]&nonce=[somenonce]

      var urlParams = $location && $location.path().split('/');
      var startIdx = urlParams && urlParams.indexOf('vbb');
      // temp fix for changeTip
      if (startIdx === -1) {
        startIdx = urlParams.indexOf('proof');
      }

      function getProofIdFromUrl() {
        urlProofId = urlParams[startIdx + 2];
        if (!urlProofId) {
          // If no proof ID in the url, default to the latest proof
          urlProofId = DEFAULT_PROOF_ID;
        }
        return urlProofId;
      }

      $scope.urlEnterpriseName = urlParams[startIdx + 1].toLowerCase();
      $scope.urlUserId = query.user;
      urlNonce = query.nonce;
      urlProofId = getProofIdFromUrl();
    }

    /**
    * URL - Return the ID of the Proof that we're fetching
    * @private
    * @returns { String }
    */
    function urlGetProofIdForRedirect(proofs) {
      if (!proofs) {
        throw new Error(ERROR_HANDLERS.CLIENT_INVALID_URL_FOR_REDIRECT);
      }
      if (urlProofId === DEFAULT_PROOF_ID) {
        return proofs[0].id;
      }
      return _.filter(proofs, function(proof) {
        return proof.id === $scope.currentEnterprise.id;
      })[0];
    }

    /**
    * URL - Handle necessary redirects
    * @param { data } returned list of proofs for an enterprise
    * @private
    * @returns { Promise }
    */
    function urlHandleRedirect(data) {
      // If the proofid is 'latest' in the url, then grab the latest
      // proof from the list of proofs, set that as the proof to fetch,
      // and redirect to the proper formatted url
      if (urlProofId === DEFAULT_PROOF_ID) {
        var redirectId;
        try {
          redirectId = urlGetProofIdForRedirect(data.proofs);
        } catch(error) {
          throw new Error(ERROR_HANDLERS.CLIENT_INVALID_URL_FOR_REDIRECT);
        }
        return $q.reject({
          message: ERROR_HANDLERS.CLIENT_NEEDS_REDIRECT_FROM_LATEST,
          data: {
            path: '/vbb/' + $scope.urlEnterpriseName + '/' + redirectId,
            search: { user: $scope.urlUserId, nonce: urlNonce }
          }
        });
      }
      // Otherwise simply fetch the proof id from the url
      return ProofsAPI.get(urlProofId);
    }

    /**
    * UI Helper - Generate ui-consumable proof object (currently we only support xbt)
    * @param { Object } assets        a specific proof's assets
    * @param { Object } liabilities   a specific proof's liabilites
    * @private
    * @returns { Object } UI-consummable enterprise proof object
    */
    function uiGenerateEnterpriseXBTProof(assets, liabilities) {
      var currency = 'XBT';

      var proof = {
        currency: currency,
        assets: _.find(assets, function(asset) { return asset.currency === currency; }),
        liabilities: _.find(liabilities, function(liability) { return liability.currency === currency; }),
        solvent: false
      };

      if (parseFloat(proof.assets.sum) >= parseFloat(proof.liabilities.sum)) {
        proof.solvent = true;
      }

      return proof;
    }

    /**
    * Returns a ui-consummable currency string
    * @param { Object } any object that has a currency property to parse
    * @private
    * @returns { String } currency string
    */
    function uiGetPrettyCurrency(obj) {
      if (!obj || !obj.currency) {
        throw new Error('invalid currency args');
      }
      return obj.currency;
    }

    /**
    * UI Helper - Generate ui-consumable fetched liability object
    * @param { Object } liability   a single user liability
    * @private
    * @returns { Object } UI-consummable liability proof object
    */
    function uiGenerateSingleLiabilityProof(liability) {
      var result = {
        message: 'Data may be independently verified by pasting this JSON into the tool at http://syskall.com/proof-of-liabilities/#verify',
        currency: uiGetPrettyCurrency(liability),
        root: { sum: liability.sum, hash: liability.rootHash },
      };

      if (liability.proof) {
        result.user = liability.proof.user;
        result.partial_tree = liability.proof.partial_tree;
        try {
          verifySingleLiabilityProof(liability.proof.partial_tree, liability.proof.root);
          result.valid = true;
        } catch(error) {}
      }
      result.details = JSON.stringify(result, null, 2);
      return result;
    }

    /**
      * Verify a proof of a single liability
      * @param { Object } liability tree object
      * @param { String } liability root object
      * @private
      * @returns { Object } valid single liability proof
      */
    function verifySingleLiabilityProof(partialTree, root) {
      var treeString = JSON.stringify({ 'partial_tree': partialTree });
      var deserializedPartial = lproof.deserializePartialTree(treeString);
      return lproof.verifyTree(deserializedPartial, root);
    }

    /**
    * Builds specific enterprise proof; checks if we need to get a specific
    * liability and attest to it -- this is based on the url
    * @param { data } specified proof data based on specific proof id
    * @private
    * @returns { Promise }   promise for an array of liability records
    */
    function buildEnterpriseProof(data) {
      var enterpriseProof = data.proof;
      $scope.proofDetails = JSON.stringify(data.proof, null, 2);

      // UI - Set up the date for the view
      $scope.prettyEnterpriseProofTimestamp = moment.utc(enterpriseProof.date).format('dddd MMMM Do YYYY, h:mm:ss A UTC');
      // UI - add XBT solvency proof
      $scope.enterpriseProofs.push(uiGenerateEnterpriseXBTProof(enterpriseProof.assets, enterpriseProof.liabilities));

      var liabilities = _.map(enterpriseProof.liabilities, function(liability) {
        liability = _.extend({}, liability);

        // Don't look up liability inclusion data if it's not a user-specific URL
        if (!isUserSpecificProofUrl()) {
          return liability;
        }

        var params = {
          hash: liability.rootHash,
          nonce: urlNonce || '',
          user: $scope.urlUserId
        };

        return ProofsAPI.getLiability(params)
        .then(function(proof) {
          liability.proof = proof;
          return liability;
        })
        .catch(function(err) {
          return liability;
        });
      });

      return $q.all(liabilities)
      .then(function(liabilities) {
        // Build data for Other (Fiat) Liabilities section
        $scope.otherLiabilities = liabilities.map(function(liability) {
          var ret = _.pick(liability, ['currency', 'sum', 'rootHash']);
          ret.details = JSON.stringify(ret, null, 2);
          return ret;
        })
        .filter(function(x) { return x.currency !== 'XBT'; });

        // Data for user-specific liabilities
        $scope.allUserLiabilities = _.filter(liabilities.map(uiGenerateSingleLiabilityProof), 'user');
      });
    }

    /**
    * Initialize the controller
    * @private
    */
    function init() {
      // Grab the all params needed to construct the page from the url
      urlParseForParams();
      // 1) Get the enterprise ID based on the name parsed from the url
      return EnterpriseAPI.getInfoByName($scope.urlEnterpriseName)
      // 2) Get all proofs for this enterprise using the ID
      .then(function(enterprise) {
        $scope.currentEnterprise = enterprise;
        return ProofsAPI.list(enterprise.id);
      })
      // 3) Handle redirects to the appropriate url
      .then(urlHandleRedirect)
      // 4) Build the Enterprise proof; also a specific user liability proof
      // if the url has valid params for it
      .then(buildEnterpriseProof)
      .then(function() {
        $scope.loaded = true;
      })
      // Otherwise, handle any error_HANDLERS
      .catch(function(error) {
        var reason = error.message || error.error;

        switch(reason) {
          case ERROR_HANDLERS.CLIENT_NEEDS_REDIRECT_FROM_LATEST:
            // replace 'latest' in the url with the most recent enterprise proof id
            return $location.path(error.data.path).search(error.data.search);
          case ERROR_HANDLERS.CLIENT_FAIL_SINGLE_LIABILITY_BUILD:
            // happens when a single user liability fails to validate on the client
            // Fail state turns the UI balances boxes for the user red
          case ERROR_HANDLERS.CLIENT_INVALID_URL_FOR_REDIRECT:
          case ERROR_HANDLERS.SERVER_INVALID_PROOF_ID:
          case ERROR_HANDLERS.SERVER_MISSING_ENTERPRISE:
            validUrl = false;
            break;
          default:
            NotifyService.error('There was an error verifying this proof of reserves. Please ensure the url is correct and refresh your page.');
            console.log('Failed proof: ', reason);
            break;
        }
        $scope.loaded = true;
      });
    }
    // Initialize the proof controller
    init();
  }
]);
