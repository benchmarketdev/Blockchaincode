/*
 * @ngdoc filter
 * @name bgOrderObjectsBy
 * @param {value} String - Either permissions or role
 * @param {reverse} boolean - If set converts role to permissions
 * @description
 * Filter converts permission string to role string or vice versa
   If provided a 'toPermissions' parameter set to true, it will convert role to permission
  @example
  {{ 'admin,spend,view' | bgPermissionsRoleConversionFilter }} => 'Admin'
  {{ 'spend,view' | bgPermissionsRoleConversionFilter }} => 'Spender'
  {{ 'view' | bgPermissionsRoleConversionFilter }} => 'Viewer'

  {{ 'Admin' | bgPermissionsRoleConversionFilter: true }} => 'admin,spend,view'
  {{ 'Spender' | bgPermissionsRoleConversionFilter: true }} => 'spend,view'
  {{ 'Viewer' | bgPermissionsRoleConversionFilter: true }} => 'view'
*/
angular.module('BitGo.Common.BGPermissionsRoleConversionFilter', [])

.filter('bgPermissionsRoleConversionFilter', ['BG_DEV',
  function (BG_DEV) {
    return function(value, toPermissions) {
      if (!value) {
        return;
      }
      // Types of roles available to a user on the wallet
      var WALLET_ROLES = {
        'admin': {
          permissions: 'admin',
          role: 'Admin'
        },
        'spend': {
          permissions: 'spend',
          role: 'Spender'
        },
        'view': {
          permissions: 'view',
          role: 'Viewer'
        }
      };

      function getRole() {
        if (value.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) > -1) {
          return BG_DEV.WALLET.ROLES.ADMIN;
        } else if (value.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1) {
          return BG_DEV.WALLET.ROLES.SPEND;
        } else if (value.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.VIEW;
        } else {
          throw new Error('Missing a valid permissions');
        }
      }

      function getPermissions(){
        if (value === BG_DEV.WALLET.ROLES.ADMIN) {
          return BG_DEV.WALLET.PERMISSIONS.ADMIN + ',' + BG_DEV.WALLET.PERMISSIONS.SPEND + ',' + BG_DEV.WALLET.PERMISSIONS.VIEW;
        } else if (value === BG_DEV.WALLET.ROLES.SPEND) {
          return BG_DEV.WALLET.PERMISSIONS.SPEND + ',' + BG_DEV.WALLET.PERMISSIONS.VIEW;
        } else if (value === BG_DEV.WALLET.ROLES.VIEW) {
          return BG_DEV.WALLET.PERMISSIONS.VIEW;
        } else {
          throw new Error('Missing a valid role');
        }
      }
      if (toPermissions) {
        return getPermissions();
      }
      return getRole();
    };
  }
]);
