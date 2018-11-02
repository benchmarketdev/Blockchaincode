/**
 * @ngdoc directive
 * @name developersAccesstokenAddForm
 * @description
 * Manages the ui for adding new access tokens
 */
angular.module('BitGo.Settings.DevelopersAccesstokenAddFormDirective', [])

.directive('developersAccesstokenAddForm', ['$rootScope', '$modal', 'NotifyService', 'AccessTokensAPI', 'UtilityService', 'BG_DEV',
  function($rootScope, $modal, NotifyService, AccessTokensAPI, UtilityService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^developersManager', // requires the developers tab manager
      controller: ['$scope', function($scope) {
        // the params to be submitted when creating new tokens
        $scope.tokenParams = null;
        // access token object used for managing the list of tokens and
        // associated scopes
        $scope.accessToken = null;
        // agreement for creating new tokens
        $scope.agreedToTerms = null;
        // user otp for adding new token
        $scope.otp = null;

        /**
        * Initialize a new oauth scopes object
        * @private
        */
        function initNewOAuthScopes() {
          $scope.accessToken.oAuthScopes = [
            { name: 'wallet_view_all', text: 'View', selected: true },
            { name: 'wallet_spend_all', text: 'Spend', selected: true },
            { name: 'wallet_manage_all', text: 'Manage Wallets', selected: true },
            { name: 'wallet_create', text: 'Create Wallets', selected: true }
          ];
        }

        /**
        * Creates a fresh tokenParams object on the scope
        * @private
        */
        function initNewTokenParams() {
          $scope.tokenParams = {
            label: '',
            ipRestrict: undefined,
            txValueLimit: 0,
            duration: 315360000, // seconds
            oAuthScopes: ['openid', 'profile']
          };
          $scope.agreedToTerms = false;
          $scope.otp = '';
        }

        /**
        * Validates the form before submitting a new token to be created
        * @private
        */
        function formIsValid() {
          if (!$scope.agreedToTerms) {
            $scope.setFormError('Please accept the Terms to create a new token.');
            return false;
          }
          if (!$scope.tokenParams.label) {
            $scope.setFormError('New tokens must have a label.');
            return false;
          }
          if (BitGoConfig.env.isProd() && !$scope.tokenParams.ipRestrict) {
            $scope.setFormError('New tokens must have restricted IP addresses specified.');
            return false;
          }
          if (!$scope.tokenParams.txValueLimit || !$scope.tokenParams.txValueLimit.toString()) {
            $scope.setFormError('New tokens must have a specified spending limit.');
            return false;
          }
          if (!$scope.tokenParams.duration) {
            $scope.setFormError('New tokens must have a specified duration.');
            return false;
          }
          var permissions = _.filter($scope.accessToken.oAuthScopes, function(permission) {
            return permission.selected === true;
          });
          if (permissions.length < 1) {
            $scope.setFormError('Please set at least one permission for the new token');
            return false;
          }
          return true;
        }

        /**
        * Triggers otp modal to open if user needs to otp before adding a token
        * @private
        */
        function openModal(params) {
          if (!params || !params.type) {
            throw new Error('Missing modal type');
          }
          var modalInstance = $modal.open({
            templateUrl: 'modal/templates/modalcontainer.html',
            controller: 'ModalController',
            scope: $scope,
            size: params.size,
            resolve: {
              // The return value is passed to ModalController as 'locals'
              locals: function () {
                return {
                  type: params.type,
                  userAction: BG_DEV.MODAL_USER_ACTIONS.createAccessToken
                };
              }
            }
          });
          return modalInstance.result;
        }

        /**
        * Handles error states associated with attempting to add a token
        * @private
        */
        function handleAddTokenError(error) {
          if (UtilityService.API.isOtpError(error)) {
            if ($scope.otp) {
              NotifyService.error('Please enter a valid code!');
            }
            // If the user needs to OTP, use the modal to unlock their account
            openModal({ type: BG_DEV.MODAL_TYPES.otp })
            .then(function(result) {
              if (result.type === 'otpsuccess') {
                $scope.otp = result.data.otp;
                // automatically resubmit the token on modal close
                $scope.addNewToken();
              }
            });
          } else {
            // Otherwise just display the error to the user
            NotifyService.error('There was an error creating your token: ' + error.error);
          }
        }

        /**
        * Submits a new token to the server for creation
        * @private
        */
        function submitToken() {
          var ipRestrict = $scope.tokenParams.ipRestrict && $scope.tokenParams.ipRestrict.replace(/ /g,'').split(',');
          var selectedOAuthScope = _.filter($scope.accessToken.oAuthScopes, function(scope) {
            return scope.selected === true;
          });
          var selectedOAuthScopeNames = _.map(selectedOAuthScope, function(o) {
            return o.name;
          });
          // Always assume these 2 scopes by default, since we're in first-party mode
          selectedOAuthScopeNames.push('openid', 'profile');

          var tokenParams = {
            label: $scope.tokenParams.label,
            scope: selectedOAuthScopeNames,
            duration: $scope.tokenParams.duration,
            ipRestrict: ipRestrict !== '' ? ipRestrict: undefined,
            txValueLimit: $scope.tokenParams.txValueLimit,
            otp: $scope.otp
          };

          return AccessTokensAPI.add(tokenParams);
        }

        /**
        * Adds a new access token on to the user
        * @public
        */
        $scope.addNewToken = function() {
          // clear any errors
          $scope.clearFormError();
          if (formIsValid()) {
            submitToken()
            .then(function(data) {
              // reset local state
              initNewTokenParams();
              initNewOAuthScopes();
              // refresh the token list and take the user back to the list view
              $scope.setToken(data);
              $scope.refreshAccessTokens();  // function in parent (developersManager)
              $scope.setState('list');
            })
            .catch(handleAddTokenError);
          }
          else {
            NotifyService.error('Form is invalid. Please correct errors and submit again.');
          }
        };

        /**
        * Toggles terms
        * @public
        */
        $scope.toggleTerms = function() {
          $scope.agreedToTerms = !$scope.agreedToTerms;
        };

        /**
        * Watch for state changes to clean up any state
        * @private
        */
        var killStateWatcher = $scope.$watch('state', function(state) {
          if (state) {
            if (state !== 'add') {
              $scope.clearFormError();
              initNewTokenParams();
              initNewOAuthScopes();
            }
          }
        });

        /**
        * Clean up all watchers when the scope is garbage collected
        * @private
        */
        $scope.$on('$destroy', function() {
          killStateWatcher();
        });

        function init() {
          $scope.accessToken = {};
          initNewTokenParams();
          initNewOAuthScopes();
        }
        init();
      }]
    };
  }
]);
