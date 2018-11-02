/**
 * @ngdoc directive
 * @name pressManager
 * @description
 * Directive to manage listing, pagination of press articles on the press page
 * @example
 *   <div press-manager></div>
 */

angular.module('BitGo.Marketing.PressManagerDirective', [])

.directive('pressManager', [
  function() {
    return {
      restrict: 'A',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        // view states for the user settings area

        $scope.viewStates = ['press', 'branding'];

        function init() {
          $scope.currentPage = 1; //The default page for pagination
          $scope.totalItems = 76; //Totals items to be paginated. Currently at 76 articles
          $scope.itemsPerPage = 12; //Number of items per page. Determines total number of pages
          $scope.state = 'press';
        }
        init();
      }]
    };
  }
]);
