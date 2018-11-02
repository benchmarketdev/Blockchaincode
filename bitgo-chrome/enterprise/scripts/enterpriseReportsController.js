/*
  Notes:
  - This controls the view for the enterprise wallet reporting page
*/
angular.module('BitGo.Enterprise.EnterpriseReportsController', [])

.controller('EnterpriseReportsController', ['$scope', '$rootScope', 'NotifyService', 'InternalStateService', 'BG_DEV', 'AnalyticsProxy', '$location',
  function($scope, $rootScope, Notify, InternalStateService, BG_DEV, AnalyticsProxy, $location) {
    // The view viewStates within the enterprise reports section
    $scope.viewStates = ['monthly', 'daily', 'csv', 'upsell'];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.activityTemplateSource = null;

    /**
     * UI - block the feature for the user
     *
     * @returns {Bool}
     */
    $scope.blockReports = function() {
      return ($rootScope.currentUser.isBasic() &&
              $rootScope.enterprises.current &&
              $rootScope.enterprises.current.isPersonal);
    };

    /**
    * Take the user to the create org page
    *
    * @public
    */
    $scope.goToCreateOrg = function() {
      AnalyticsProxy.track('clickUpsell', { type: 'reports' });
      $location.path('/create-organization');
    };

    // Return list of wallets sorted by name
    $scope.getWallets = function() {
      return _.chain($scope.wallets.all)
      .values()
      .sortBy(function(w) {
        return w.data.label;
      })
      .value();
    };

    // gets the view template based on the $scope's viewSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Missing $scope.state');
      }
      var template;
      switch ($scope.state) {
        case 'upsell':
          template = 'enterprise/templates/reports-partial-upsell.html';
          break;
        case 'monthly':
          template = 'enterprise/templates/reports-partial-monthly.html';
          break;
        case 'csv':
          template = 'enterprise/templates/reports-partial-csv.html';
          break;
      }
      return template;
    }

    // Event Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function(state) {
      if (!state) {
        return;
      }
      $scope.activityTemplateSource = getTemplate();

      // Track a user landing on the reports upsell
      if ($scope.state === 'upsell' && $scope.blockReports()) {
        AnalyticsProxy.track('arriveUpsell', { type: 'reports' });
      }
    });

    // Clean up when the scope is destroyed
    $scope.$on('$destroy', function() {
      // remove listeners
      killStateWatch();
    });

    function init() {
      $rootScope.setContext('enterpriseReports');
      if ($scope.blockReports()) {
        $scope.state = 'upsell';
      } else {
        $scope.state = 'monthly';
      }
      $scope.activityTemplateSource = getTemplate();
    }
    init();
  }
]);
