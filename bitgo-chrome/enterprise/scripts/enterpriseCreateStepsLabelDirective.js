/**
 * @ngdoc directive
 * @name enterpriseCreateStepsLabel
 * @description
 * Directive to manage the org creation label step
 * Parent Controller is EnterpriseCreateController
 * @example
 *   <div enterprise-create-steps-label></div>
 */

angular.module('BitGo.Enterprise.EnterpriseCreateStepsLabelDirective', [])

.directive('enterpriseCreateStepsLabel', ['$rootScope', 'AnalyticsProxy',
  function($rootScope, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        /**
         * Track org create failure events
         * @param error {String}
         *
         * @private
         */
        function trackClientLabelFail(error) {
          if (typeof(error) !== 'string') {
            throw new Error('invalid error');
          }
          var metricsData = {
            // Error Specific Data
            status: 'client',
            message: error,
            action: 'LabelEnterprise'
          };
          AnalyticsProxy.track('Error', metricsData);
        }

        /**
         * Check if label step is valid
         *
         * @private
         */
        function isValidStep() {
          if ($scope.inputs.enterpriseLabel === '' || !$scope.inputs.enterpriseLabel) {
            trackClientLabelFail('Missing Enterprise Name');
            $scope.setFormError('Please enter organization  name.');
            return false;
          }
          if ($scope.inputs.enterpriseLabel.indexOf('.') !== -1) {
            trackClientLabelFail('Invalid Organization Name');
            $scope.setFormError('Organization names cannot contain periods.');
            return false;
          }
          if ($scope.inputs.enterpriseLabel.length > 50) {
            trackClientLabelFail('Invalid Organization Name Length');
            $scope.setFormError('Organization names cannot be longer than 50 characters.');
            return false;
          }
          return true;
        }

        /**
         * Advance the org creation flow by labelling enterprise
         *
         * @public
         */
        $scope.advanceLabel = function() {
          // clear any errors
          $scope.clearFormError();
          if (isValidStep()) {

            // track the successful label advancement
            var metricsData = {
              enterpriseLabel: $scope.inputs.enterpriseLabel
            };
            AnalyticsProxy.track('LabelEnterprise', metricsData);

            // advance the form
            $scope.setState('support');
          }
        };

      }]
    };
  }
]);
