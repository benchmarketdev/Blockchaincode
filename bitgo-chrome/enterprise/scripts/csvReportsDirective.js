/**
 * @ngdoc directive
 * @name csvReports
 * @description
 * This directive contains all the required functions displaying CSV reports
 * @example
 *   <div csv-reports></div>
 */
angular.module('BitGo.Enterprise.CSVReportsDirective', [])

.directive('csvReports', ['$rootScope', 'NotifyService', 'ReportsAPI', 'UtilityService',
  function($rootScope, Notify, ReportsAPI, Utils) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        // Function to fetch the monthly report data for a wallet from the server
        $scope.getReport = function(wallet) {
          var reportInfoObj;
          var reportParams = {
            walletAddress: wallet.data.id,
            period: 'all',
            format: 'csv'
          };

          ReportsAPI.getReport(reportParams)
          .then(function(data) {
            if (data.format === 'csv') {
              // Safari does not support Blob downloads, and opening a Blob URL with
              // an unsupported data-type causes Safari to complain.
              // Github Issue: https://github.com/eligrey/FileSaver.js/issues/12
              if (bowser.name === "Safari") {
                document.location.href = "data:text/csv, " + data.data;
              } else {
                var file = new Blob([data.data], { type: 'application/octet-stream'});
                var name = wallet.data.label + '.csv';
                saveAs(file, name);
              }
            }
          })
          .catch(Notify.errorHandler);
        };
      }]
    };
  }
]);
