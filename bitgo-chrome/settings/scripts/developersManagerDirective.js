/**
 * @ngdoc directive
 * @name developersManager
 * @description
 * Manages the ui and sub directives for viewing/adding/removing access tokens
 */
angular.module('BitGo.Settings.DevelopersManagerDirective', [])

.directive('developersManager', ['$rootScope', 'NotifyService', 'AccessTokensAPI',
  function($rootScope, NotifyService, AccessTokensAPI) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: ['$scope', function($scope) {
        // local oAuth scopes to filter the ui list against
        var OAUTH_SCOPES_MAP = [
          { name: 'wallet_view_all', text: 'View' },
          { name: 'wallet_spend_all', text: 'Spend' },
          { name: 'wallet_manage_all', text: 'Manage Wallets' },
          { name: 'wallet_create', text: 'Create Wallets' }
        ];

        // valid view states
        $scope.viewStates = ['add', 'list'];

        /**
        * Generate the scope's access token list
        * @public
        */
        $scope.refreshAccessTokens = function() {
          AccessTokensAPI.list()
          .then(function(data) {
            var tokens = data.accessTokens;
            var scopeLookup = _.indexBy(OAUTH_SCOPES_MAP, 'name');
            $scope.accessTokenList = _.transform(tokens, function(result, token) {
              // Only show tokens with labels (long term access)
              if (!!token.label) {
                // Do not display openid and profile scopes (they are implicit)
                token.scope = _.map(_.intersection(_.keys(scopeLookup), token.scope), function(name) {
                  return scopeLookup[name].text;
                });
                return result.push(token);
              }
            });
          })
          .catch(function(error) {
            console.log('Error getting list of access tokens: ' + error.error);
          });
        };

        /**
        * Reset to list view when user changes top level sections within settings
        * @private
        */
        var killStateWatcher = $scope.$on('SettingsController.StateChanged', function(evt, data) {
          if (data.newState) {
            $scope.setState('list');
          }
        });

        $scope.newToken = false;
        
        $scope.setToken = function(token) {
          $scope.newToken = token;
        };

        $scope.removeToken = function(token) {
          $scope.newToken = undefined;
        };

        /**
        * Clean up all watchers when the scope is garbage collected
        * @private
        */
        $scope.$on('$destroy', function() {
          killStateWatcher();
        });

        function init() {
          $scope.state = 'list';
          $scope.accessTokenList = [];
          $scope.refreshAccessTokens();
        }
        init();
      }]
    };
  }
]);
