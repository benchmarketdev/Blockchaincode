// Directive for creating the wallet permissions for a user
angular.module('BitGo.Common.BGWalletPermissionsDirective', [])

.directive('bgWalletPermissions', ['$compile', '$rootScope', '$filter', 'BG_DEV',
  function($compile, $rootScope, $filter, BG_DEV) {
    return {
      restrict: 'E',
      template: '<select></select>',
      link: function(scope, ele, attrs) {
        var permissions = {
          init : function(){
            scope.role = $filter('bgPermissionsRoleConversionFilter')(attrs.permissions);
            // generate the html
            this.html = this.getHTMLOptions();
          },
          getHTMLOptions : function(){
            var html = '';
            scope.options = [BG_DEV.WALLET.ROLES.ADMIN, BG_DEV.WALLET.ROLES.SPEND, BG_DEV.WALLET.ROLES.VIEW];
            html = '<select class="customSelect-select" ng-model="role" ng-options = "option for option in options"></select>';
            return html;
          }
        };
        permissions.init();
        var compiledEle = $compile(permissions.html)(scope);
        ele.replaceWith(compiledEle);
      }
    };
  }
]);