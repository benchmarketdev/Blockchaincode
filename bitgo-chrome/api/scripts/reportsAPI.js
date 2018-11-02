angular.module('BitGo.API.ReportsAPI', [])
/*
  Notes:
  - This module is for managing all http requests for reports
*/
.factory('ReportsAPI', ['$q', '$location', '$rootScope', 'SDK', 'UtilityService',
  function($q, $location, $rootScope, SDK, UtilityService) {
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;

    // local copy of the report range for all wallets
    var startDates = {};

    /**
     * Gets the first transaction date for a wallet
     * @param   {object} params { walletAddress: String }
     * @returns {Promise}   promise for { walletId: String, startDate: Date }
     */
    function getWalletStartDate(params) {
      if (typeof(startDates[params.walletAddress]) !== 'undefined') {
        return $q.when(startDates[params.walletAddress]);
      }
      // Don't use wrap here -- we'll catch in getAllWalletsReportRange
      return $q.when(
        SDK.doGet('/reports/' + params.walletAddress + '/startDate', {}, 'startDate')
      )
      .then(function(startDate) {
        // cache it
        startDates[params.walletAddress] = startDate;
        return startDate;
      });
    }

    /**
     * Gets a set of ranges based on a start date and time step
     * @param   {Date} startDate  start date
     * @param   {String} stepType  day|month
     * @returns {[Date]}           array of dates for starting reports
     */
    function getTimeRange(startDate, stepType) {
      var VALID_RANGE_STEP_TYPES = ['day', 'month'];
      console.assert(_.contains(VALID_RANGE_STEP_TYPES, stepType));
      if (!startDate) {
        return [];
      }
      var result = [];
      var now = moment.utc();
      var currentDate = new moment.utc(startDate).startOf(stepType);
      while (currentDate <= now) {
        result.push(new Date(currentDate));
        currentDate.add(1, stepType);
      }
      return result;
    }

    // Get the report range for each wallet in a list of wallets
    // E.g.: all wallets in a specific enterprise
    // The time interval can be configured by stepType ('day' | 'month')
    function getAllWalletsReportRange(params) {
      startDates = {};
      if (!params.wallets) {
        throw new Error('Expect list of wallets when getting report range for a wallet group');
      }
      // Reset the local report range object
      ranges = {};

      var formatDateForStepType = function(time, stepType) {
        console.assert(time instanceof Date);
        switch (stepType) {
          case 'month':
            return moment.utc(time).format('MMMM YYYY'); // August 2014
          case 'day':
            return moment.utc(time).format('MMMM Do YYYY'); // August 12th 2014
          default:
            throw new Error('unknown step type ' + stepType);
        }
      };

      // Fetch the report range for each wallet
      var fetches = [];
      _.forIn(params.wallets, function(wallet) {
        var walletData = {
          walletAddress: wallet.data.id,
        };
        fetches.push(getWalletStartDate(walletData));
      });
      // Return the ranges of report dates
      return $q.all(fetches)
      .then(
        function(data) {
          ranges = _.mapValues(startDates, function(startDate) {
            var range = getTimeRange(startDate, params.stepType || 'month');
            return range.map(function(start) {
              return {
                startTime: start,
                dateVisible: formatDateForStepType(start, params.stepType)
              };
            });
          });
          return ranges;
        },
        PromiseErrorHelper()
      );
    }

    // Get a specific report (based on params) for a specific wallet
    /* istanbul ignore next */
    function getReport(params) {
      return SDK.wrap(
        SDK.doGet('/reports/' + params.walletAddress, params)
      );
    }

    function init() {
      ranges = {};
    }
    init();

    // In-client API
    return {
      getAllWalletsReportRange: getAllWalletsReportRange,
      getReport: getReport
    };
  }
]);
