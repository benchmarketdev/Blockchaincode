/*
  Notes:
  - This controls the view for the enterprise wallet settings page and
  all subsections (it uses bg-state-manager) to handle template swapping
*/
angular.module('BitGo.Enterprise.EnterpriseSettingsController', [])

.controller('EnterpriseSettingsController', ['$rootScope', '$scope', 'InternalStateService', 'EnterpriseAPI', 'NotifyService',
  function($rootScope, $scope, InternalStateService, EnterpriseAPI, Notify) {
    // The view viewStates within the enterprise settings for a specific enterprise
    $scope.viewStates = ['organization', 'users', 'support', 'billing'];
    // object which maps view states to correspoing html files
    var stateTemplates = {
      organization: 'enterprise/templates/settings-partial-company.html',
      users: 'enterprise/templates/settings-partial-users.html',
      support: 'enterprise/templates/settings-partial-support.html',
      billing: 'enterprise/templates/settings-partial-billing.html'
    };
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.enterpriseSettingsTemplateSource = null;
    // scope variable to store data of enterprise users
    $scope.enterpriseUsers = {};

    // gets the view template based on the $scope's currentSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
      }
      return stateTemplates[$scope.state];
    }

    // Events Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function() {
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    });

    // Listen for enteprises to be set
    var killEnterpriseListener = $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function() {
      EnterpriseAPI.getEnterpriseUsers({enterpriseId: $rootScope.enterprises.current.id}).then(function(data){
        $scope.enterpriseUsers = data;
      });
    });

    // Clean up the listeners when the scope is destroyed
    $scope.$on('$destroy', function() {
      killStateWatch();
      killEnterpriseListener();
    });

    function init() {
      $rootScope.setContext('enterpriseSettings');
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'organization';
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    }
    init();
  }
]);
