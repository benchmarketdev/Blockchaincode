/*
  Notes:
  - This controls the view for the enterprise wallet activity log page and
  all subsections (it uses bg-state-manager) to handle template swapping
*/
angular.module('BitGo.Enterprise.EnterpriseActivityController', [])

.controller('EnterpriseActivityController', ['$scope', '$rootScope', 'BG_DEV', 'InternalStateService', 'AnalyticsProxy', '$location',
  function($scope, $rootScope, BG_DEV, InternalStateService, AnalyticsProxy, $location) {
    // The view viewStates within the enterprise activity section
    $scope.viewStates = ['auditlog', 'approvals'];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.activityTemplateSource = null;

    // Show the notification bullet for this tab
    $scope.showApprovalIcon = function() {
      return $rootScope.enterprises.current &&
              _.keys($rootScope.enterprises.current.pendingApprovals).length > 0;
    };

    // Highlights the tab the user is currently in
    $scope.isActivitySection = function(state) {
      if (_.indexOf($scope.viewStates, state) === -1) {
        throw new Error('Missing valid state');
      }
      return state === $scope.state;
    };

    /**
     * UI - block the feature for the user
     *
     * @returns {Bool}
     */
    $scope.blockAuditLog = function() {
      return (!$rootScope.currentUser.isPro() &&
              $rootScope.enterprises.current &&
              $rootScope.enterprises.current.isPersonal);
    };

    /**
    * Take the user to the create organization page
    *
    * @public
    */
    $scope.goToCreateOrg = function() {
      AnalyticsProxy.track('clickUpsell', { type: 'auditLog' });
      $location.path('/create-organization');
    };

    // gets the view template based on the $scope's viewSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Missing $scope.state');
      }
      var template;
      switch ($scope.state) {
        case 'auditlog':
          template = 'enterprise/templates/activity-partial-auditlog.html';
          break;
        case 'approvals':
          template = 'enterprise/templates/activity-partial-approvals.html';
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

      // Track a user landing on the audit log upsell
      if ($scope.state === 'auditlog' && $scope.blockAuditLog()) {
        AnalyticsProxy.track('arriveUpsell', { type: 'auditLog' });
      }
    });

    // Clean up when the scope is destroyed
    $scope.$on('$destroy', function() {
      // remove listeners
      killStateWatch();
    });

    function init() {
      $rootScope.setContext('enterpriseActivity');
      $scope.state = 'approvals';
      $scope.activityTemplateSource = getTemplate();
    }
    init();
  }
]);
