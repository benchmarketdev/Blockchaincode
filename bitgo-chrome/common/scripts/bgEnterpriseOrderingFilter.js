/**
 * @ngdoc directive
 * @name bgEnterpriseOrderingFilter
 * @description
 * Sorts enterprises; puts personal at the top always
 * @example
 *   <div ng-repeat="enterprise in enterprises.all | bgEnterpriseOrderingFilter"></div>
 */
angular.module('BitGo.Common.BGEnterpriseOrderingFilter', [])

.filter('bgEnterpriseOrderingFilter', ['$rootScope', 'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function(enterprises) {
      if (!enterprises) {
        return;
      }
      var sorted = [];
      var personal = _.filter(enterprises, function(enterprise) {
        return enterprise.isPersonal;
      });
      var rest = _.filter(enterprises, function(enterprise) {
        return !enterprise.isPersonal;
      });
      return sorted.concat(personal, rest);
    };
  }
]);
