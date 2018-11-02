/*
  Notes:
  - This directive fetches the details for a bitgo user based on the user's id
  - E.g.: <span bg-get-user user-id="123abcd">{{ user.settings.name.full }}</span>
*/
angular.module('BitGo.Common.BGGetUser', [])

.directive("bgGetUser", ['$rootScope', 'UserAPI',
  function ($rootScope, UserAPI) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element, attrs) {
        attrs.$observe('userId', function(val) {
          // Don't fetch if there's no id
          if (!val) {
            scope.user = null;
            return;
          }
          // If the ID is that of the currentUser, return the rootScope's user
          if (val === $rootScope.currentUser.settings.id) {
            scope.user = $rootScope.currentUser;
            return;
          }
          // Otherwise fetch the user, trying the cache first
          UserAPI.get(val, true)
          .then(function (user) {
            scope.user = user;
          })
          .catch(function (error) {
            console.log("Error getting userId " + val + ": " + error);
          });
        });
      }
    };
  }
]);
