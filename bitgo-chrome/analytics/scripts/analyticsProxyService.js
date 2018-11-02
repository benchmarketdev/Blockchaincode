/**
 * @ngdoc service
 * @name AnalyticsProxy
 * @description
 * This unifies / proxies calls to all client-side analytics services
 */
angular.module('BitGo.Analytics.AnalyticsProxyService', [])

.factory('AnalyticsProxy', ['$rootScope', '$location', 'BG_DEV', 'MixpanelProvider', 'FacebookProvider', 'GoogleAdwordsProvider',
  function($rootScope, $location, BG_DEV, MixpanelProvider, FacebookProvider, GoogleAdwordsProvider) {

    // Analytics Tool Initialization / Shutdown

    // Note: Eventually, when we bring in multiple analytics services,
    // we will map the calls unique to each service within the actual functions

    /**
    * Proxy initialization calls to analytics tools
    * @private
    */
    function init() {
      try {
        MixpanelProvider.init();
      } catch(e) {
        throw new Error('Invalid analytics init: ', e);
      }
      return true;
    }

    /**
    * Kills connection to analytics tools
    * @private
    */
    function shutdown() {
      // Eventually map to multiple services within
      try {
        MixpanelProvider.shutdown();
      } catch(e) {
        // Don't throw an error on logout
        console.error('Invalid analytics shutdown: ', e);
        return false;
      }
      return true;
    }


    // Event Tracking

    /**
    * Trigger a tracking event
    * @param eventName {String}
    * @param eventData {Object} (optional)
    * @private
    */

    // Additional Notes on Event Tracking:
    //
    // NAMING
    // ==============================
    // Keep event names short and descriptive of the action taken; use properties for
    // the additional details. Use 'Verb' or 'VerbNoun' syntax as needed.
    // E.g.: CreateWallet, ApproveTx, Login, Logout, Signup
    //
    // EVENTS
    // ==============================
    // All events are decorated with:
    //  context: the section of the app the user is in (Wallet, Transactions, Account Settings, etc.)
    //  path: the current $location.path() => COMING SOON

    function track(eventName, eventData) {
      if (!eventName) {
        throw new Error('invalid tracking attempt');
      }

      // Attach this data to each event tracked
      var data = eventData || {};
      data.path = $location.path();
      data.currentContext = $rootScope.getContext().current;
      data.previousContext = $rootScope.getContext().previous;

      try {
        MixpanelProvider.track(eventName, data);
      } catch (e) {
        throw new Error('Invalid analytics track: ', e);
      }
      return true;
    }

    /**
    * Attach data that is then forwarded along with all all subsequent analytics calls
    * @param data {Object}
    * @param doNotAllowOverwritingData {Bool} (optional)
    * @private
    */
    function sendWithAllTrackingEvents(data, doNotAllowOverwritingData) {
      if (!data) {
        throw new Error('invalid attach data attempt');
      }
      try {
        MixpanelProvider.register(data);
      } catch (e) {
        throw new Error('Invalid data registration: ', e);
      }
      return true;
    }


    // User Tracking

    /**
    * The recommended usage pattern is to call this when the user signs up
    * Currently tracks using: Mixpanel, Facebook, Google Adwords
    * @param userID {String}
    * @private
    */
    function register(userID) {
      if (!userID) {
        throw new Error('invalid userID');
      }
      try {
        MixpanelProvider.alias(userID);
        FacebookProvider.identify();
        GoogleAdwordsProvider.identify();
      } catch (e) {
        throw new Error('Invalid user registration: ', e);
      }
      return true;
    }

    /**
    * The recommended usage pattern is to call this when the user logs in
    * @param userID {String}
    * @private
    */
    function login(userID) {
      if (!userID) {
        throw new Error('invalid userID');
      }
      try {
        MixpanelProvider.identify(userID);
      } catch (e) {
        throw new Error('Invalid user login track event: ', e);
      }
      return true;
    }


    // In-app API

    return {
      init: init,
      track: track,
      loginUser: login,
      shutdown: shutdown,
      registerUser: register,
      sendWithAllTrackingEvents: sendWithAllTrackingEvents
    };
  }
]);
