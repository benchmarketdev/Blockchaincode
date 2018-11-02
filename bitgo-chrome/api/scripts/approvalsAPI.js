/**
 * @ngdoc service
 * @name ApprovalsAPI
 * @description
 * Manages the http requests dealing with a wallet's approval objects
 */
/* istanbul ignore next */
angular.module('BitGo.API.ApprovalsAPI', [])

.factory('ApprovalsAPI', ['$q', '$location', '$resource', 'SDK', '$rootScope',
  function($q, $location, $resource, SDK, $rootScope) {
    /**
    * Updates a specific approval
    * @param {string} approvalId for the approval
    * @param {obj} object containing details needed to update the approval
    * @private
    */
    function update(approvalId, approvalData) {
      // TODO: SDK has method, but no way to construct a pending approval object from id
      return SDK.wrap(
        SDK.doPut('/pendingapprovals/' + approvalId, approvalData)
      );
    }

    /**
    * Get all the pending approvals for a user
    * @public
    * @returns {promise} - with pending approvals data
    */
    function getApprovals(params) {
      if (!params.enterprise) {
        throw new Error("invalid params for getApprovals");
      }
      // TODO: SDK has method, but no way to construct a pending approval object from id
      return SDK.wrap(
        SDK.doGet('/pendingapprovals', params)
      );
    }

    // When the enterprise is set, get all the approvals
    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function(evt, data) {
      // list of enterprises which the user is an admin on
      var adminEnterprises = [];
      _.forIn($rootScope.enterprises.all, function(enterprise) {
        if (enterprise.isAdmin && !enterprise.isPersonal) {
          adminEnterprises.push(enterprise);
        }
      });
      // Get all the pennding approvals and set it on the enterprise object
      return $q.all(adminEnterprises.map(function(enterprise) {
        return getApprovals({ enterprise: enterprise.id })
        .then(function(data) {
          $rootScope.enterprises.all[enterprise.id].setApprovals(data.pendingApprovals);
        });
      }));
    });

    /** In-client API */
    return {
      update: update,
      getApprovals: getApprovals
    };
  }
]);
