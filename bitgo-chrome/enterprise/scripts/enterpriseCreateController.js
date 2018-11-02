
/**
 * @ngdoc controller
 * @name EnterpriseCreateController
 * @description
 * This controls the flow and manages all states involved with creating a new enterprise
 * Manages: enterpriseCreateStepslabel, enterpriseCreateStepsSupport, enterpriseCreateStepsBilling
 */

angular.module('BitGo.Enterprise.EnterpriseCreateController', [])

.controller('EnterpriseCreateController', ['$scope', '$rootScope', '$location', 'AnalyticsProxy', 'BG_DEV',
  function($scope, $rootScope, $location, AnalyticsProxy, BG_DEV) {
    
    // view states for the enterprise creation
    $scope.viewStates = ['label', 'support', 'payment'];
    // the current view state
    $scope.state = null;
    // template source for the current view
    $scope.createFlowTemplateSource = null;
    // the data model used by the ui-inputs during enterprise creation
    $scope.inputs = null;

    // takes the user out of the wallet create flow
    // Accessible by all scopes inheriting this controller
    $scope.cancel = function() {
      // track the cancel
      AnalyticsProxy.track('CreateOrganizationCancelled');
      // Note: this redirect will also wipe all of the state that's been built up
      $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
    };

    // returns the view current view template (based on the $scope's current state)
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise create flow');
      }
      var tpl;
      switch ($scope.state) {
        case 'label':
          tpl = 'enterprise/templates/enterprise-create-partial-label.html';
          break;
        case 'support':
          tpl = 'enterprise/templates/enterprise-create-partial-support.html';
          break;
        case 'payment':
          tpl = 'enterprise/templates/enterprise-create-partial-payment.html';
          break;
      }
      return tpl;
    }

    // Event listeners
    var killStateWatch = $scope.$watch('state', function(state) {
      $scope.createFlowTemplateSource = getTemplate();
    });

    // Listener cleanup
    $scope.$on('$destroy', function() {
      killStateWatch();
    });

    function init() {
      $rootScope.setContext('createEnterprise');
      AnalyticsProxy.track('CreateOrganizationEntered');
      $scope.state = 'label';
      // All properties we expect the user to enter in creation
      $scope.inputs = {
        enterpriseSupportPlan: null,
        enterpriseLabel: null
      };
    }
    
    init();
  }
]);
