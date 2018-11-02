/**
 * @ngdoc directive
 * @name monthlyReports
 * @description
 * This directive contains all the required functions displaying monthly reports
 * @example
 *   <div monthly-reports></div>
 */
 angular.module('BitGo.Enterprise.MonthlyReportsDirective', [])

.directive('monthlyReports', ['$rootScope', 'NotifyService', 'ReportsAPI', 'UtilityService',
  function($rootScope, Notify, ReportsAPI, Utils) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        // The date range for all wallets reports on this enterprise
        $scope.dateVisibleRange = null;
        // The current wallet for reports (if a user selects one)
        $scope.selectedWallet = null;
        // The selected month to see reports for all wallets in an enterprise for a given month
        $scope.selectedDate = null;
        // Flag to see if there are any reports for the current period
        $scope.hasReportsForCurrentPeriod = false;

        // Filtering function to show only wallets in the view that have a report
        // to show for the current month selected
        // TODO(gavin): clean this up? can we do better than double loop?
        $scope.showWalletForCurrentPeriod = function(wallet) {
          var hasMonth;
          _.forEach(wallet.data.reportDates, function(reportDate) {
            _.forEach(reportDate.data, function(monthlyData) {
              if (monthlyData.dateVisible === $scope.selectedDate) {
                $scope.hasReportsForCurrentPeriod = true;
                hasMonth = true;
                return;
              }
            });
          });
          return hasMonth;
        };

        // Function to fetch the monthly report data for a wallet from the server
        $scope.getReport = function(wallet, dateInfo) {
          var reportInfoObj;
          // If there is dateInfo passed (to specify getting a report for that)
          // specific period, use dateInfo to construct the fetch params
          if (dateInfo) {
            reportInfoObj = wallet.getReportDateInfoForPeriod(dateInfo.dateVisible);
          } else {
            reportInfoObj = wallet.getReportDateInfoForPeriod($scope.selectedDate);
          }

          var reportTime = moment.utc(reportInfoObj.startTime);
          var reportStart = reportInfoObj.startTime;
          var reportParams = {
            walletAddress: wallet.data.id,
            start: Number(reportStart),
            period: 'month',
            format: 'pdf'
          };

          ReportsAPI.getReport(reportParams)
          .then(function(data) {
            if (data.format === 'pdf') {
              // Safari does not support Blob downloads, and opening a Blob URL with
              // an unsupported data-type causes Safari to complain.
              // Github Issue: https://github.com/eligrey/FileSaver.js/issues/12
              if (bowser.name === "Safari") {
                document.location.href = "data:application/pdf;base64, " + data.data;
              } else {
                var buffer = Utils.Converters.base64ToArrayBuffer(data.data);
                var file = new Blob([buffer], { type: 'application/octet-stream'});
                var name = 'BitGo-Monthly-' + wallet.data.id.slice(0,8) + '-' + reportTime.format('YYYY-MM') + '.pdf';
                saveAs(file, name);
              }
            }
          })
          .catch(Notify.errorHandler);
        };

        // Build a UI-consumable array of dates for the reports based on all wallets
        // in the enterprise
        function buildUIReportRange(allWalletRanges) {
          var yearlyReports = [];
          var monthlyReports = [];
          var year = "";
          var oldYear = "";

          // reset dateVisibleRange on the scope
          $scope.dateVisibleRange = [];
          // ranges will be an object of date objects for each wallet in the enterprise
          _.forIn(allWalletRanges, function(singleWalletRanges, walletId) {
            _.forEach(singleWalletRanges, function(rangeItem) {
              if (!rangeItem.dateVisible) {
                throw new Error('Missing `dateVisible` property when using report range');
              }
              $scope.dateVisibleRange.push(rangeItem.dateVisible);
            });
            yearlyReports = [];
            monthlyReports = [];
            year = "";
            oldYear = "";
            //orders the reports in chunks based on year
            if (singleWalletRanges) {
              _.forEach(singleWalletRanges, function(month){
                //fetches the year of the report from the date visible
                year = month.dateVisible.substr(month.dateVisible.length -4);
                if (year !== oldYear && oldYear !== "") {
                  yearlyReports.push({
                    year: oldYear,
                    data: monthlyReports
                  });
                  monthlyReports=[];
                }
                monthlyReports.push(month);
                oldYear = year;
              });
              yearlyReports.push({
                year: year,
                data: monthlyReports
              });
              // incase $rootScope.wallets.all is emptied out due to navigation
              if ($rootScope.wallets.all[walletId]){
                // Add the report data to each wallet instance
                $rootScope.wallets.all[walletId].setReportDates(yearlyReports);
              }
            }
          });
          // Filter out any duplicates from the all array and sort by time
          $scope.dateVisibleRange = _.uniq($scope.dateVisibleRange).sort(function(a, b) {
            var aTime = new moment(a);
            var bTime = new moment(b);
            return aTime - bTime;
          });
        }

        // Get report date ranges for all wallets in the current enterprise
        function getEnterpriseReportRange(wallets) {
          if (!wallets) {
            throw new Error('Expect wallets object when fetching an enterprise report range');
          }
          var params = {
            wallets: wallets,
            stepType: 'month'
          };
          ReportsAPI.getAllWalletsReportRange(params)
          .then(function(ranges) {
            buildUIReportRange(ranges);
          })
          .catch(Notify.errorHandler);
        }

        // Event handlers
        // Set up the report data once the FilteredWallets have been set up (based on the
        // current enterprise and list of all possible wallets)
        var killWalletsSetListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function(evt, data) {
          getEnterpriseReportRange(data.enterpriseWallets.all);
        });

        // Clean out the scope listeners to reduce run loop and multiple registrations
        $scope.$on('$destroy', function() {
          killWalletsSetListener();
        });


        function init() {
          $scope.dateVisibleRange = [];
          // TODO(gavin): clean up
          if (!_.isEmpty($rootScope.wallets.all)) {
            getEnterpriseReportRange($rootScope.wallets.all);
          }
        }
        init();

      }]
    };
  }
]);
