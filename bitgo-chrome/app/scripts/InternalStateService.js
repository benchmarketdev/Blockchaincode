/**
 * @ngdoc service
 * @name InternalStateService
 * @description
 * Manages the internal redirects in the app from substateA to substateB
 * @example
 *   Set a redirect state:
 *   InternalStateService.goTo('enterprise_settings:users');
 *
 *   Check for a state to initialize:
 *   InternalStateService.getInitState(['array', 'of', 'states']);
 *
 *   1) Assume this was called somewhere in the app
 *   InternalStateService.goTo('enterprise_settings:users');
 *
 *   2) Example usage when a controller inits:
 *   function init() {
 *     $scope.state = InternalStateService.getInitState($scope.viewStates) || 'initial';
 *   }
 */
angular.module('BitGo.App.InternalStateService', [])

.factory('InternalStateService', ['$rootScope', '$location', '$timeout',
  function($rootScope, $location, $timeout) {
    // constant to map internal redirects
    var DESTINATION_MAP = {
      'enterprise_settings:users': {
        path: function() {
          return 'enterprise/' + $rootScope.enterprises.current.id + '/settings';
        }
      },
      'personal_settings:password': {
        path: function() {
          return '/settings';
        }
      },
      'personal_settings:users': {
        path: function() {
          return '/settings';
        }
      },
      'personal_settings:security': {
        path: function() {
          return '/settings';
        }
      },
      'personal_settings:subscriptions': {
        path: function() {
          return '/settings';
        }
      },
    };

    // state that we'll want to initialize to when this service is asked
    // if it has a state to initialize to
    var stateToInitialize;

    /**
    * Sets the bootstate for the controller at the destination path
    * which will be initialized
    * @param bootState {String}
    * @private
    */
    function setInitializationState(bootState) {
      stateToInitialize = bootState;
    }

    /**
    * Removes the local initialization state
    * @private
    */
    function unsetInitializationState() {
      stateToInitialize = undefined;
    }

    /**
    * Redirects the app to a new url and sets up the local variables
    * needed to initialize the correct sub-state at that url
    * @param destination {String} the destination to go to
    * @private
    */
    function goTo(destination) {
      if (!destination || typeof(destination) !== 'string' || !_.has(DESTINATION_MAP, destination)) {
        throw new Error('missing destination');
      }
      var bootState = destination.split(':')[1];
      if (!bootState) {
        throw new Error('missing an initialization state');
      }
      // Set the initilization state for the url we'll be going to
      if (stateToInitialize) {
        throw new Error('overwriting an existing initilization state');
      }
      setInitializationState(bootState);
      // Redirect the user to the correct url
      $location.path(DESTINATION_MAP[destination].path());
    }

    /**
    * Gets the state to use when initializing a particular controller
    * @param states {Array} viewstates that should include the current stateToInitialize
    * @private
    */
    function getInitState(states) {
      if (!states || typeof(states) !== 'object') {
        throw new Error('missing view states');
      }
      if (!stateToInitialize || _.indexOf(states, stateToInitialize) === -1) {
        return;
      }
      // clean out stateToInitialize so we don't reuse it
      // have this happen in the next run loop so we use it
      // before actually unsetting it
      $timeout(function() {
        unsetInitializationState();
      }, 50);
      return stateToInitialize;
    }

    /** In-client API */
    return {
      goTo: goTo,
      getInitState: getInitState
    };
  }
]);
