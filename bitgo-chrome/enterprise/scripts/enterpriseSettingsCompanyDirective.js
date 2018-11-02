/**
 * @ngdoc directive
 * @name enterpriseSettingsCompany
 * @description
 * Handles the addition and removal of admin users on the enterprise
 * @example
 * <div enterprise-settings-company>
 * </div>
 */
angular.module('BitGo.Enterprise.EnterpriseSettingsCompanyDirective', [])

.directive('enterpriseSettingsCompany', ['$rootScope', 'UtilityService', 'EnterpriseAPI', 'NotifyService', 'ApprovalsAPI',
  function($rootScope, Util, EnterpriseAPI, Notify, ApprovalsAPI) {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope) {

        function formIsValid() {
          if (!Util.Validators.emailOk($scope.email)) {
            $scope.setFormError('Please enter valid email');
            return false;
          }
          return true;
        }

        /**
        * Add an admin to an enterprise
        */
        $scope.addAdmin = function() {
          var email = $scope.email;
          if (formIsValid()) {
            $scope.clearFormError();
            var params = {
              username: email,
              enterpriseId: $rootScope.enterprises.current.id
            };
            EnterpriseAPI.addEnterpriseAdmin(params)
            .then(function(data) {
              //clear email if valid
              $scope.email = '';
              if ($scope.enterpriseUsers.adminUsers.length > 1) {
                // add to enterprise users with pending approval
                return ApprovalsAPI.getApprovals({ enterprise: $rootScope.enterprises.current.id })
                .then(function(data) {
                  $rootScope.enterprises.current.setApprovals(data.pendingApprovals);
                });
              }
              else {
                $scope.enterpriseUsers.adminUsers.push({username: email});
              }
            })
            .catch(function(error) {
              if (error.error === "invalid user") {
                Notify.error('Please have ' + email + ' signup with BitGo before adding as an owner');
              }
              else {
                Notify.errorHandler(error);
              }
            });
          }
        };

        /**
        * User cannot remove himself
        */
        $scope.canRemove = function(userId) {
          return userId !== $rootScope.currentUser.settings.id;
        };

        /**
        * Remove an admin from an enterprise
        * @params {string} username of admin to remove
        */
        $scope.removeAdmin = function(username) {
          var params = {
            username: username,
            enterpriseId: $rootScope.enterprises.current.id
          };
          EnterpriseAPI.removeEnterpriseAdmin(params)
          .then(function(data) {
            if ($scope.enterpriseUsers.adminUsers.length > 1) {
              // get pending approvals
              return ApprovalsAPI.getApprovals({ enterprise: $rootScope.enterprises.current.id })
              .then(function(data) {
                $rootScope.enterprises.current.setApprovals(data.pendingApprovals);
              });
            }
            else {
              // note: removing an enterprise admin always requires approval. Hence this should never be hit
              _.remove($scope.enterpriseUsers.adminUsers, function(user) {
                return user.username == params.username;
              });
            }
          })
          .catch(Notify.errorHandler);
        };
      }]
    };
  }
]);
