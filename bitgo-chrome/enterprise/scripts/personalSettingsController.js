/**
 * @ngdoc controller
 * @name PersonalSettingsController
 * @description
 * This controls the view for the personal wallet settings page and
   all subsections (it uses bg-state-manager) to handle template swapping
 */
angular.module('BitGo.Enterprise.PersonalSettingsController', [])

.controller('PersonalSettingsController', ['$scope', 'InternalStateService',
  function($scope, InternalStateService) {
    // The viewStates within the settings for personal wallets
    $scope.viewStates = ['users'];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.enterpriseSettingsTemplateSource = null;

    // gets the view template based on the $scope's currentSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
      }
      var tpl;
      switch ($scope.state) {
        case 'users':
          tpl = 'enterprise/templates/settings-partial-users.html';
          break;
      }
      return tpl;
    }

    // Events Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function() {
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    });

    // Clean up the listeners when the scope is destroyed
    $scope.$on('$destroy', function() {
      killStateWatch();
    });

    $scope.setSubState = function() {
      $scope.$broadcast("EnterpriseSettingsController.showAllUsers");
    };

    function init() {
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'users';
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    }
    init();
  }
]);
