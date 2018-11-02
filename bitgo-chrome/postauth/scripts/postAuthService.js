/**
 * @ngdoc service
 * @name PostAuthService
 * @description
 * Service for managing post sign-in actions and redirects
 */
angular.module('BitGo.PostAuth.PostAuthService', [])

.factory('PostAuthService', ['$location',
  function($location) {
    // All valid post auth types to be run
    var RUN_TYPES = {
      walletRecover: {
        checkDataValidity: function(data) {
          return data.email;
        },
        run: function() {
          $location.path('/login');
          return true;
        }
      },
      path: {
        checkDataValidity: function(data) {
          return (data && typeof data === 'string');
        },
        run: function() {
          if (!pendingPostAuth.data && typeof pendingPostAuth.data !== 'string') {
            console.log("Insufficient data to run post auth");
            return false;
          }
          $location.path(pendingPostAuth.data);
          return true;
        }
      }
    };

    // internal state to let us know if we have a post auth action awaiting
    var _hasPostAuth;
    // the pending postAuth that needs to be run
    var pendingPostAuth;

    /**
     * Clears out the postAuth state
     * @private
     */
    function _resetPostAuth() {
      _hasPostAuth = false;
      pendingPostAuth = null;
      return true;
    }

    /**
     * Runs the awaiting postauth action
     * @private
     * @returns {Bool}
     */
    function _runPostAuth() {
      var ran = RUN_TYPES[pendingPostAuth.type].run();
      var reset = _resetPostAuth();
      return ran && reset;
    }

    /**
     * Lets caller know if an existing postauth is set
     * @public
     * @returns {Bool}
     */
    function hasPostAuth() {
      return _hasPostAuth;
    }

    /**
     * Runs an existing postAuth
     * @public
     * @returns {Bool}
     */
    function runPostAuth() {
      if (_hasPostAuth) {
        return _runPostAuth();
      }
      return false;
    }

    /**
     * Sets a new postAuth to be run
     * @param {String} type of postauth
     * @param {Obj} data for postauth
     * @public
     */
    function setPostAuth(type, data) {
      if (!_.has(RUN_TYPES, type)) {
        throw new Error('Invalid postAuth type');
      }
      if (!RUN_TYPES[type].checkDataValidity(data)) {
        throw new Error('Invalid postAuth data');
      }
      if (_hasPostAuth) {
        throw new Error('Cannot overwrite an existing postAuth action');
      }
      // Set the local variables up
      _hasPostAuth = true;
      pendingPostAuth = { type: type, data: data };
      // clear out the url params before returning
      $location.search({});
      return true;
    }

    function init() {
      _resetPostAuth();
    }
    init();

    /**
     * API
     */
    return {
      hasPostAuth: hasPostAuth,
      runPostAuth: runPostAuth,
      setPostAuth: setPostAuth
    };
  }
]);
