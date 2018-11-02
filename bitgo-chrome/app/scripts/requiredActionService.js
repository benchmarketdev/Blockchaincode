/**
 * @ngdoc service
 * @name RequiredActionService
 * @description
 * Manages any actions and setup needed to enforce the user to take
 * specific upgrade paths in the app during their course of using it
 * E.g. Legacy password upgrade (weak login passwords)
 */
angular.module('BitGo.App.RequiredActionService', [])

.factory('RequiredActionService', ['$rootScope', 'InternalStateService', 'BG_DEV',
  function($rootScope, InternalStateService, BG_DEV) {
    // All possible required actions that the BitGo service might enforce
    var REQUIRED_ACTION_HANDLERS = {};

    // Required Action Handlers
    // Weak account/legacy password:
    // If the user is using a weak account pw, at certain points in
    // the app, we force them to go into personal settings and
    // upgrade to a stronger pw
    REQUIRED_ACTION_HANDLERS[BG_DEV.REQUIRED_ACTIONS.WEAK_PW] = {
      handler: function() {
        // redirect them to personal settings
        InternalStateService.goTo('personal_settings:password');
      }
    };

    // holds any outstanding actions that need to be taken in the app
    var outstandingPendingActions = [];

    /**
    * Checks if there is an outstanding action of a certain type
    * @param actionName {String} name of the action being checking for
    * @private
    */
    function hasAction(actionName) {
      if (!actionName || !_.has(REQUIRED_ACTION_HANDLERS, actionName)) {
        throw new Error('Invalid action');
      }
      return _.filter(outstandingPendingActions, function(action) {
        return action.name === actionName;
      }).length === 1;
    }

    /**
    * Sets an outstanding required action in the app
    * @param actionName {String} name of the action
    * @private
    */
    function setAction(actionName) {
      if (!actionName || !_.has(REQUIRED_ACTION_HANDLERS, actionName)) {
        throw new Error('Invalid action');
      }
      var conflictsWithExisting = _.filter(outstandingPendingActions, function(action) {
        return action.name === actionName;
      }).length;
      if (conflictsWithExisting) {
        console.log('Attempted to overwrite a required action: ', actionName);
        return outstandingPendingActions;
      }
      var newAction = {
        name: actionName,
        handler: REQUIRED_ACTION_HANDLERS[actionName].handler
      };
      // Add the new action to the outstandingPendingActions
      outstandingPendingActions.push(newAction);
      return outstandingPendingActions;
    }

    /**
    * Clears an outstanding action of a certain type
    * @param actionName {String} name of the action being checking for
    * @private
    */
    function removeAction(actionName) {
      var idxToRemove;
      if (!actionName) {
        throw new Error('Invalid action');
      }
      _.forEach(outstandingPendingActions, function(action, index) {
        if (action.name === actionName) {
          idxToRemove = index;
          return false;
        }
      });
      outstandingPendingActions.splice(idxToRemove, 1);
      return outstandingPendingActions;
    }

    /**
    * Clears ALL outstanding actions
    * @private
    */
    function killAllActions() {
      outstandingPendingActions = [];
      return outstandingPendingActions;
    }

    /**
    * Runs outstanding required action's handler function
    * @param actionName {String} name of the action
    * @private
    */
    function runAction(actionName) {
      if (!actionName || !_.has(REQUIRED_ACTION_HANDLERS, actionName)) {
        throw new Error('Invalid action');
      }
      REQUIRED_ACTION_HANDLERS[actionName].handler();
      return true;
    }

    /** In-client API */
    return {
      hasAction: hasAction,
      killAllActions: killAllActions,
      removeAction: removeAction,
      runAction: runAction,
      setAction: setAction
    };
  }
]);
