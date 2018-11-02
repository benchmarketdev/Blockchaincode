angular.module('BitGo.Enterprise.ActivityAuditLogDirective', [])

/**
  Directive to help with the audit log in enterprise
  Helps with:
  - fetching and displaying all of the audit log
 */
.directive('activityAuditLog', ['$q', 'UtilityService', 'NotifyService', 'InfiniteScrollService', 'AuditLogAPI', 'BG_DEV',
  function($q, Util, Notify, InfiniteScrollService, AuditLogAPI, BG_DEV) {
    return {
      restrict: 'A',
      require: '^EnterpriseActivityController',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        // The auditlog used to populate the view
        $scope.auditLog = null;
        // the total of items we can possibly fetch
        var total;
        // the start index for the initial data fetch
        var startIdx;
        // limits the data fetch number of results
        var limit;

        // initiazlizes a clean auditlog fetch setup on the scope
        function initNewAuditLog() {
          startIdx = 0;
          $scope.auditLog = [];
          $scope.loadAuditLogOnPageScroll();
        }

        // wipe out the existing auditlog
        function clearAuditLog() {
          startIdx = 0;
          $scope.auditLog = [];
        }

        // Loads the auditlog events chunk by chunk for infinite scroll.
        // Note: This function must return a promise.
        $scope.loadAuditLogOnPageScroll = function() {
          // If we fetch all the items, kill any further calls
          if (total && ($scope.auditLog.length >= total)) {
            return $q.reject();
          }
          var params = {
            enterpriseId: $rootScope.enterprises.current.id,
            skip: startIdx,
            limit: limit
          };
          return AuditLogAPI.get(params)
          .then(function(data) {
            // Set the total so we know when to stop calling
            if (!total) {
              total = data.total;
            }
            startIdx += limit;
            $scope.auditLog = $scope.auditLog.concat(data.logs);
            return true;
          })
          .catch(Notify.errorHandler);
        };

        // listen for the current enterprise to be set and load the events once ready
        var killEnterprisesListener = $scope.$watchCollection('enterprises', function(enterprises) {
          if (enterprises && enterprises.current) {
            // Set the global inifinte scroll handler
            InfiniteScrollService.setScrollHandler($scope.loadAuditLogOnPageScroll);
            initNewAuditLog();
          }
        });

        // Clean up when the scope is destroyed - happens when switching sections
        $scope.$on('$destroy', function() {
          clearAuditLog();
          killEnterprisesListener();
          // reset the global inifinte scroll handler
          InfiniteScrollService.clearScrollHandler();
        });

        function init() {
          // initialize locals
          limit = 25;
        }
        init();
      }]
    };
  }
]);
