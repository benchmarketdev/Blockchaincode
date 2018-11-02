/**
 * @ngdoc directive
 * @name jobsManager
 * @description
 * Directive to managing a listing of all jobs and state of the jobs page
 * @example
 *   <div jobs-manager></div>
 */

angular.module('BitGo.Marketing.JobsManagerDirective', [])

.directive('jobsManager', ['UtilityService', 'RequiredActionService', 'BG_DEV', 'JobsAPI', 'NotifyService',
  function(Util, RequiredActionService, BG_DEV, JobsAPI, Notify) {
    return {
      restrict: 'A',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        // view states for the user settings area
        $scope.viewStates = ['showAllJobs', 'showOneJob'];
        // the current view state
        $scope.state = null;
        // template source for the current view
        $scope.jobTemplateSource = null;
        // The current job being selected
        $scope.currentJob = null;

        /**
        * Goes into one job and sets it as the currentJob
        * @params - The job which needs to be set
        * @private
        */
        $scope.goToJob = function(job) {
          if(!job) {
            return;
          }
          $scope.currentJob = job;
          $scope.setState('showOneJob');
        };

        // returns the view current view template (based on the $scope's current state)
        function getTemplate() {
          if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
            throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
          }
          var tpl;
          switch ($scope.state) {
            case 'showAllJobs':
              tpl = 'marketing/templates/allJobs.html';
              break;
            case 'showOneJob':
              tpl = 'marketing/templates/oneJob.html';
              break;
          }
          return tpl;
        }

        /**
        * Fetches all the jobs listed in the workable website
        * @private
        */
        function fetchJobs () {
          JobsAPI.list().then(function(data){
            $scope.jobsList = data.jobs;
          })
          .catch(function(error){
            Notify.error(error);
          });
        }

        // Event listeners
        var killStateWatch = $scope.$watch('state', function(state) {
          if (state) {
            $scope.jobTemplateSource = getTemplate();
          }
        });

        // Listener cleanup
        $scope.$on('$destroy', function() {
          killStateWatch();
        });

        function init() {
          $scope.state = 'showAllJobs';
          fetchJobs();
        }
        init();
      }]
    };
  }
]);
