/**
 * @ngdoc service
 * @name AnalyticsUtilities
 * @description
 * Helpers for analytics instrumentation and eventing
 */
angular.module('BitGo.Analytics.AnalyticsUtilitiesService', [])

.factory('AnalyticsUtilities', ['$rootScope', 'BG_DEV', 'AnalyticsProxy',
  function($rootScope, BG_DEV, AnalyticsProxy) {

    // Utility Class
    var utils = {};


    // Time Measurement Tools
    utils.time = {};


    /**
    * @constructor
    * Triggers proper analytics events for measuring the time it takes a user
    * to enter a valid password
    * @public
    */
    utils.time.PasswordCompletionMonitor = function() {
      this._states = { started: 'started', completed: 'completed' };
      this._currentState = null;
      this._startedAt = null;
      this._completedAt = null;
    };

    /**
    * Handle event triggering for start / completion of password entry
    * @param eventName { String }
    * @param passwordStrength { Object }
    * @public
    */
    utils.time.PasswordCompletionMonitor.prototype.track = function(eventName, passwordStrength) {
      // return data for the tracking call
      var data = {};
      var self = this;

      if (!passwordStrength) {
        return;
      }
      if (typeof(eventName) !== 'string') {
        throw new Error('missing password event eventName');
      }
      // Do not allow multiple success triggers
      if (self._currentState === self._states.completed) {
        return;
      }

      // Track the start of password attempts
      if (!self._currentState) {
        self._currentState = self._states.started;
        self._startedAt = new Date().getTime();
        data = {
          startedAt: self._startedAt,
          completedAt: self._completedAt,
          completionMS: undefined
        };
        return AnalyticsProxy.track(eventName, data);
      }

      // Track the first successful completion of a strong password
      if (self._currentState && self._currentState !== self._states.completed &&
          passwordStrength.progress.value >= BG_DEV.PASSWORD.MIN_STRENGTH) {
        self._currentState = self._states.completed;
        self._completedAt = new Date().getTime();
        data = {
          startedAt: self._startedAt,
          completedAt: self._completedAt,
          completionMS: self._completedAt - self._startedAt
        };
        return AnalyticsProxy.track(eventName, data);
      }
    };

    /**
    * @constructor
    * Triggers proper analytics events for measuring the time it takes a user
    * to enter a valid credit card
    * @public
    */
    utils.time.CreditCardCompletionMonitor = function() {
      this._states = { started: 'started', completed: 'completed' };
      this._currentState = null;
      this._startedAt = null;
      this._completedAt = null;
    };

    /**
    * Handle event triggering for start / completion of cc entry
    * @param eventName { String }
    * @param evtData { Object }
    * @public
    */
    utils.time.CreditCardCompletionMonitor.prototype.track = function(eventName, evtData) {
      // return data for the tracking call
      var data = {};
      var self = this;

      if (typeof(eventName) !== 'string' || !evtData ||
          typeof(evtData.currentPlan) !== 'string' ||
          typeof(evtData.selectedPlan) !== 'string') {
        throw new Error('missing credit card event data');
      }
      // Do not allow multiple success triggers
      if (self._currentState === self._states.completed) {
        return;
      }

      // Track the start of credit card entry attempts
      if (!self._currentState) {
        self._currentState = self._states.started;
        self._startedAt = new Date().getTime();
        data = {
          currentPlan: evtData.currentPlan,
          selectedPlan: evtData.selectedPlan,
          startedAt: self._startedAt,
          completedAt: self._completedAt,
          completionMS: undefined
        };
        return AnalyticsProxy.track(eventName, data);
      }

      // Track the first successful completion of a strong credit card entry
      if (self._currentState && self._currentState !== self._states.completed) {
        self._currentState = self._states.completed;
        self._completedAt = new Date().getTime();
        data = {
          currentPlan: evtData.currentPlan,
          selectedPlan: evtData.selectedPlan,
          startedAt: self._startedAt,
          completedAt: self._completedAt,
          completionMS: self._completedAt - self._startedAt
        };
        return AnalyticsProxy.track(eventName, data);
      }
    };


    // In-app API

    return utils;
  }
]);
