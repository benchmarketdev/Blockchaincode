/*
  About:
  - The LogoutController deals with managing the section of the
  app where a user signs out - handle any addtn'l data cleanup here
*/
angular.module('BitGo.Auth.LogoutController', [])

.controller('LogoutController', ['$scope', '$location', '$rootScope', 'UserAPI', 'NotifyService',
  function($scope, $location, $rootScope, UserAPI, Notify) {

    function onLogoutSuccess() {
      $location.path('/login');
    }

    UserAPI.logout()
    .then(onLogoutSuccess)
    .catch(function(error) {
      console.error('There was an issue signing the user out: ', error);
    });
  }
]);
