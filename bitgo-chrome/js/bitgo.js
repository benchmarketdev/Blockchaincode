APP_ENV = {
  'version': '0.0.1',
  'revision': '150a72e',
  'date': 'Mon Apr 20 2015 18:03:12',
  'bitcoinNetwork': 'prod'
};(function (global) {
  // Locals & Constants
  //
  var config;
  // URLs we care about watching / stripping of any valuable info
  var WATCH_URLS = {
      '/verifyemail': true,
      '/verifyforgotpassword': true
    };
  // URL search params we care about watching / stripping from the query
  var WATCH_PARAMS = {
      'code': true,
      'email': true
    };
  // Production hosts
  var PROD_HOSTS = {
      'staging.bitgo.com': true,
      'www.bitgo.com': true
    };
  // App Config Setup
  //
  /**
    * Initialize the general config object
    *
    * @private
    */
  function initConfig() {
    global.BitGoConfig = global.BitGoConfig ? global.BitGoConfig : {};
    config = global.BitGoConfig;
  }
  /**
    * Initialize the helpers used in managing data before the angular app boots
    *
    * @private
    */
  function initConfigPreAppLoadHelpers() {
    if (!config) {
      throw new Error('missing config');
    }
    // Attach an object that will hold any setup we need to do before
    // the angular app loads / any external requests are made
    config.preAppLoad = {
      queryparams: {},
      clearQueryparams: function () {
        config.preAppLoad.queryparams = {};
        return true;
      }
    };
  }
  /**
    * Initialize environment config
    *
    * @private
    */
  function initConfigEnvironmentHelpers() {
    if (!config) {
      throw new Error('missing config');
    }
    /**
      * Check the production state of the app
      *
      * @returns { Bool }
      * @private
      */
    function checkProductionState() {
      var isChromeApp = location.protocol === 'chrome-extension:';
      if (isChromeApp && typeof APP_ENV !== 'undefined') {
        return APP_ENV.bitcoinNetwork !== 'testnet';
      }
      return _.has(PROD_HOSTS, location.hostname);
    }
    config.env = {
      prodHosts: PROD_HOSTS,
      isProd: checkProductionState
    };
  }
  // URL Sanitizing
  //
  /**
    * Clean out the request header's referrer and redirect the app to the
    * appropriate state once sanitized
    *
    * @private
    */
  function sanitizeRefererHeader() {
    var needsSanitization;
    var path = location.pathname;
    /**
      * Check if the URL might need to be sanitized
      *
      * @param path { String } Url path
      * @returns { Bool }
      * @private
      */
    function urlNeedsSanitizing(path) {
      if (!path) {
        throw new Error('missing path');
      }
      return _.has(WATCH_URLS, path);
    }
    /**
      * Store a search query param in the pre-app-load storage object for consumption
      * when the app boots up
      *
      * @param param { Object }
      * @returns { Bool }
      * @private
      */
    function storeParam(param) {
      var item;
      var key;
      var value;
      if (!param) {
        throw new Error('missing param');
      }
      item = param.split('=');
      if (item.length < 2) {
        return false;
      }
      key = decodeURIComponent(item[0]);
      value = decodeURIComponent(item[1]);
      if (_.has(WATCH_PARAMS, key)) {
        config.preAppLoad.queryparams[key] = value;
        return true;
      }
      return false;
    }
    if (urlNeedsSanitizing(path)) {
      // Store the URL query params in the BitGo config object
      location.search.substr(1).split('&').forEach(function (item) {
        var stored = storeParam(item);
        if (stored) {
          needsSanitization = true;
        }
      });
      // Explicitly reset the request header's referer if needed
      if (needsSanitization) {
        // Working with browser history is best done with this method:
        // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history
        window.history.pushState({}, null, path);
      }
    }
  }
  // App Initialization
  //
  /**
    * Init pre app-load routines
    *
    * @private
    */
  function init() {
    // set up the config object
    initConfig();
    initConfigPreAppLoadHelpers();
    initConfigEnvironmentHelpers();
    // do any work needed before the app loads
    sanitizeRefererHeader();
  }
  init();
}(window));// Configure the app and module dependencies
angular.module('BitGo', [
  'BitGo.Analytics',
  'BitGo.API',
  'BitGo.App',
  'BitGo.Auth',
  'BitGo.Common',
  'BitGo.Enterprise',
  'BitGo.Interceptors',
  'BitGo.Marketing',
  'BitGo.Modals',
  'BitGo.Model',
  'BitGo.Notifications',
  'BitGo.PostAuth',
  'BitGo.Settings',
  'BitGo.Tools',
  'BitGo.Utility',
  'BitGo.Wallet',
  'angular-md5',
  'ga',
  'ngCookies',
  'ngRaven',
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'ui.bootstrap'
]).config([
  '$routeProvider',
  '$locationProvider',
  function ($routeProvider, $locationProvider) {
    var isChromeApp = location.protocol === 'chrome-extension:';
    $locationProvider.html5Mode(!isChromeApp);
    // Angular Factory function to ensure authorization when a route resolves
    var requireAuth = [
        '$rootScope',
        '$q',
        '$location',
        'UserAPI',
        'PostAuthService',
        function ($rootScope, $q, $location, UserAPI, PostAuthService) {
          var currentUser = $rootScope.currentUser;
          if (currentUser.loggedIn) {
            return true;
          } else {
            var deferred = $q.defer();
            UserAPI.init().then(deferred.resolve(true), function () {
              deferred.reject();
              PostAuthService.setPostAuth('path', $location.path());
              $location.path('/login');
            });
            return deferred.promise;
          }
        }
      ];
    // Marketing Routes
    $routeProvider.when('/', {
      templateUrl: 'marketing/templates/landing.html',
      controller: 'MarketingController'
    });
    $routeProvider.when('/enterprise', {
      templateUrl: 'marketing/templates/enterprise.html',
      controller: 'MarketingController'
    });
    $routeProvider.when('/platform', {
      templateUrl: 'marketing/templates/platform.html',
      controller: 'MarketingController'
    });
    $routeProvider.when('/pricing', {
      templateUrl: 'marketing/templates/pricing.html',
      controller: 'MarketingController'
    });
    $routeProvider.when('/terms', {
      templateUrl: 'marketing/templates/terms.html',
      controller: 'MarketingController'
    });
    $routeProvider.when('/privacy', {
      templateUrl: 'marketing/templates/privacy.html',
      controller: 'MarketingController'
    });
    $routeProvider.when('/p2sh_safe_address', {
      templateUrl: 'marketing/templates/p2sh_safe_address.html',
      controller: 'MarketingController'
    });
    // Auth Routes
    $routeProvider.when('/login', {
      templateUrl: 'auth/templates/login.html',
      controller: 'LoginController'
    });
    $routeProvider.when('/logout', {
      template: '',
      controller: 'LogoutController'
    });
    $routeProvider.when('/signup', {
      templateUrl: 'auth/templates/signup.html',
      controller: 'SignupController'
    });
    $routeProvider.when('/resetpassword', {
      templateUrl: 'auth/templates/resetpassword.html',
      controller: 'ResetPwController'
    });
    $routeProvider.when('/forgotpassword', {
      templateUrl: 'auth/templates/forgotpassword.html',
      controller: 'ForgotPwController'
    });
    $routeProvider.when('/verifyemail', {
      templateUrl: 'auth/templates/verifyemail.html',
      controller: 'VerifyEmailController'
    });
    // TODO(ryan): The verifyforgotpassword route is obsolete and should be
    // removed once the new client is live. Before removing it, be sure the
    // email link is updated correctly so that the email link goes to
    // /resetpassword instead of /verifyforgotpassword. The email link is
    // located in www/app/controllers/api/notifications.tasks.js
    $routeProvider.when('/verifyforgotpassword', {
      templateUrl: 'auth/templates/resetpassword.html',
      controller: 'ResetPwController'
    });
    // Account Settings Routes
    $routeProvider.when('/settings', {
      templateUrl: 'settings/templates/settings.html',
      controller: 'SettingsController',
      resolve: requireAuth
    });
    $routeProvider.when('/unsub', { templateUrl: 'settings/templates/emailunsubscribe.html' });
    // Enterprise Routes
    $routeProvider.when('/enterprise/:enterpriseId/wallets', {
      templateUrl: 'enterprise/templates/wallets.html',
      controller: 'EnterpriseWalletsController',
      resolve: requireAuth
    });
    $routeProvider.when('/enterprise/:enterpriseId/activity', {
      templateUrl: 'enterprise/templates/activity.html',
      controller: 'EnterpriseActivityController',
      resolve: requireAuth
    });
    $routeProvider.when('/enterprise/:enterpriseId/reports', {
      templateUrl: 'enterprise/templates/reports.html',
      controller: 'EnterpriseReportsController',
      resolve: requireAuth
    });
    $routeProvider.when('/enterprise/:enterpriseId/settings', {
      templateUrl: 'enterprise/templates/enterprise-settings.html',
      controller: 'EnterpriseSettingsController',
      resolve: requireAuth
    });
    $routeProvider.when('/personal/settings', {
      templateUrl: 'enterprise/templates/personal-settings.html',
      controller: 'PersonalSettingsController',
      resolve: requireAuth
    });
    // Wallet Routes
    $routeProvider.when('/enterprise/:enterpriseId/wallets/create', {
      templateUrl: 'wallet/templates/wallet-create.html',
      controller: 'WalletCreateController',
      resolve: requireAuth
    });
    $routeProvider.when('/enterprise/:enterpriseId/wallets/:walletId', {
      templateUrl: 'wallet/templates/wallet.html',
      controller: 'WalletController',
      resolve: requireAuth
    });
    $routeProvider.when('/enterprise/:enterpriseId/wallets/:walletId/recover', {
      templateUrl: 'wallet/templates/wallet-recover.html',
      controller: 'WalletRecoverController',
      resolve: requireAuth
    });
    // BitGo Customer Tools Routes
    $routeProvider.when('/tools/keychaincreator', {
      templateUrl: 'tools/templates/keychaincreator.html',
      controller: 'ToolsController'
    });
    // Unsupported Browser Route
    $routeProvider.when('/unsupported', { templateUrl: 'interceptors/templates/unsupported.html' });
  }
]).config([
  '$tooltipProvider',
  function ($tooltipProvider) {
    $tooltipProvider.setTriggers({
      'mouseenter': 'mouseleave',
      'click': 'click',
      'focus': 'blur',
      'showAddressPopover': 'showAddressPopover'
    });
  }
]).config([
  '$httpProvider',
  function ($httpProvider) {
    $httpProvider.interceptors.push('NetworkBusyInterceptor');
    $httpProvider.interceptors.push('BrowserInterceptor');
    $httpProvider.interceptors.push('VerificationInterceptor');
    $httpProvider.interceptors.push('AuthTokenInterceptor');
  }
]).config([
  'RavenProvider',
  function (RavenProvider) {
    function endsWith(s, t) {
      return s && t && s.length >= t.length && s.substr(s.length - t.length) == t;
    }
    RavenProvider.development(!endsWith(location.hostname, '.bitgo.com'));
    Raven.config('https://3b6ad9594a9146afa752be5d035d39db@app.getsentry.com/26556').install();
  }
]).config([
  '$compileProvider',
  function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
  }
]).run([
  '$rootScope',
  '$interval',
  'UtilityService',
  'UserAPI',
  'MarketDataAPI',
  'SyncService',
  'RequiredActionService',
  function ($rootScope, $interval, UtilityService, UserAPI, MarketDataAPI, SyncService, RequiredActionService) {
    // Set the API route if it hasn't been set
    if (!UtilityService.API.apiServer) {
      UtilityService.API.setApiServer();
    }
    // Initialize PRNG
    var prng;
    function initPrng(ttl) {
      if (ttl < 4) {
        try {
          prng = new SecureRandom();
          prng.clientSideRandomInit();
          UtilityService.Crypto.setPrng(prng);
        } catch (err) {
          console.error('error initializing prng: (attempt ' + ttl + '):', err);
          ttl++;
          setTimeout(function () {
            initPrng(ttl);
          }, 1500);
        }
      }
    }
    initPrng(0);
    // Set Chrome App-specific details
    $rootScope.isChromeApp = UtilityService.Global.isChromeApp;
    $rootScope.TemplatePathPrefix = $rootScope.isChromeApp ? 'index.html#' : '';
    // Set Bitcoin Network and external urls
    Bitcoin.setNetwork(BitGoConfig.env.isProd() ? 'prod' : 'testnet');
    if (Bitcoin.network == 'testnet') {
      $rootScope.externalTransactionUrl = 'http://tbtc.blockr.io/tx/info/';
      $rootScope.externalAddressUrl = 'https://tbtc.blockr.io/address/info/';
    } else {
      $rootScope.externalTransactionUrl = 'http://btc.blockr.io/tx/info/';
      $rootScope.externalAddressUrl = 'https://btc.blockr.io/address/info/';
    }
    // Initialize the app user only if we are accessing the web app
    if (!UtilityService.Url.isMarketingPage()) {
      UserAPI.init().then(function (user) {
        console.log('Initialized with a user: ', user);
      }).catch(function (error) {
        console.log('Initialized without a user: ', error);
      });
    }
    // Initialize the app currency data / poll
    function initMarketDataPoll() {
      $interval(function () {
        MarketDataAPI.latest().catch(function (error) {
          console.log('Error when polling financial data: ', error);
        });
      }, 10000);
      MarketDataAPI.latest().catch(function (error) {
        console.log('Initialized without financial data: ', error);
      });
    }
    initMarketDataPoll();
    // Run these tasks on major url changes
    $rootScope.$on('$routeChangeStart', function (event, next, current) {
      var userLoggingOut = next.$$route.originalPath.indexOf('logout') > -1;
      // Sync the app data
      if (!userLoggingOut && $rootScope.currentUser.loggedIn && $rootScope.currentUser.hasAccess) {
        SyncService.sync();
      }
      // Wipe all required actions on user logout
      if (userLoggingOut) {
        RequiredActionService.killAllActions();
      }
    });
  }
]).run([
  '$rootScope',
  'BG_DEV',
  'AnalyticsProxy',
  function ($rootScope, BG_DEV, AnalyticsProxy) {
    // This is the context that we use to track the user movement through
    // the app - as opposed to url/nav changes, we use changes to this
    // context to fire tracking events to mixpanel and understand user movement
    var CURRENT_CONTEXT = 'initApp';
    var PREV_CONTEXT = null;
    /**
    * Set the app context and trigger user nav tracking event
    * @param ctx {String}
    *
    * @public
    */
    $rootScope.setContext = function (ctx) {
      if (!ctx || !_.has(BG_DEV.APP_CONTEXTS, ctx)) {
        throw new Error('invalid context');
      }
      // don't set the context if it hasn't changed
      if (ctx === CURRENT_CONTEXT) {
        return CURRENT_CONTEXT;
      }
      // update the context and track it
      PREV_CONTEXT = _.clone(CURRENT_CONTEXT);
      CURRENT_CONTEXT = ctx;
      AnalyticsProxy.track('Nav');
      return CURRENT_CONTEXT;
    };
    /**
    * Get the app context
    *
    * @public
    */
    $rootScope.getContext = function () {
      return {
        current: CURRENT_CONTEXT,
        previous: PREV_CONTEXT
      };
    };
  }
]).constant('BG_DEV', {
  ERRORS: {
    INVALID_BITCOIN_UNIT: 'Expected a valid unit when setting the app bitcoin unit.',
    INVALID_CURRENCY: 'Expected a valid currency when setting the app currency.',
    INVALID_ROOT_USER_PROP: 'Can only set an existing property on RootUser'
  },
  CURRENCY: {
    DEFAULTS: {
      BITCOIN_UNIT: 'BTC',
      CURRENCY: 'USD'
    },
    VALID_CURRENCIES: [
      'AUD',
      'CAD',
      'CNY',
      'EUR',
      'GBP',
      'USD',
      'ZAR'
    ],
    VALID_BITCOIN_UNITS: [
      'BTC',
      'BTC8',
      'bits',
      'satoshis'
    ]
  },
  PASSWORD: { MIN_STRENGTH: 80 },
  REQUIRED_ACTIONS: { WEAK_PW: 'weakAccountPasswordUpgrade' },
  MODAL_TYPES: {
    otp: 'otp',
    otpThenUnlock: 'otpThenUnlock',
    passwordThenUnlock: 'passwordThenUnlock',
    offlineWarning: 'offlineWarning'
  },
  MODAL_USER_ACTIONS: {
    otp: 'otp',
    createShare: 'createShare',
    acceptShare: 'acceptShare',
    sendFunds: 'sendFunds',
    approveSendFunds: 'approveSendFunds',
    createAccessToken: 'createAccessToken',
    offlineWarning: 'offlineWarning'
  },
  TX: {
    MINIMUM_BTC_DUST: 5460,
    MAXIMUM_BTC_SPENDING_LIMIT: 10000 * 100000000
  },
  WALLET: {
    PERMISSIONS: {
      ADMIN: 'admin',
      SPEND: 'spend',
      VIEW: 'view'
    },
    ROLES: {
      ADMIN: 'Admin',
      SPEND: 'Spender',
      VIEW: 'Viewer'
    },
    POLICY_TYPES: {
      bitcoinAddressWhitelist: 'bitcoinAddressWhitelist',
      transactionLimit: 'transactionLimit',
      dailyLimit: 'dailyLimit'
    },
    BITGO_POLICY_IDS: {
      'com.bitgo.whitelist.address': 'com.bitgo.whitelist.address',
      'com.bitgo.limit.day': 'com.bitgo.limit.day',
      'com.bitgo.limit.tx': 'com.bitgo.limit.tx'
    },
    WALLET_TYPES: {
      SAFEHD: 'safehd',
      SAFE: 'safe'
    }
  },
  MARKETING_PAGES: [
    'platform',
    'enterprise',
    'terms',
    'about',
    'help',
    'jobs',
    'api',
    'blog',
    'p2sh_safe_address'
  ],
  ANALYTICS: {
    TOOLS: ['Mixpanel'],
    MIXPANEL: {
      NAME: 'Mixpanel',
      APP_TOKEN: BitGoConfig.env.isProd() ? '97c8108bf199a67ac9d2dace818b5a73' : 'f4ad58617c9bb4fd19d424da990fdb31'
    }
  },
  APP_CONTEXTS: {
    signup: 'signup',
    login: 'login',
    forgotPassword: 'forgotPassword',
    resetPassword: 'resetPassword',
    enterpriseSettings: 'enterpriseSettings',
    enterpriseWalletsList: 'enterpriseWalletsList',
    enterpriseReports: 'enterpriseReports',
    enterpriseActivity: 'enterpriseActivity',
    walletSend: 'walletSend',
    walletReceive: 'walletReceive',
    walletTransactions: 'walletTransactions',
    walletPolicy: 'walletPolicy',
    walletUsers: 'walletUsers',
    walletSettings: 'walletSettings',
    createWallet: 'createWallet',
    accountSettings: 'accountSettings',
    marketingHome: 'marketingHome',
    marketingAPI: 'marketingAPI',
    marketingEnterprise: 'marketingEnterprise'
  }
});/**
 * @ngdoc module
 * @name BitGo.Analytics
 * @description
 * Manages all things dealing with in-app analytics
 */
angular.module('BitGo.Analytics', [
  'BitGo.Analytics.AnalyticsUtilitiesService',
  'BitGo.Analytics.AnalyticsProxyService',
  'BitGo.Analytics.MixpanelProvider'
]);/**
 * @ngdoc service
 * @name AnalyticsProxy
 * @description
 * This unifies / proxies calls to all client-side analytics services
 */
angular.module('BitGo.Analytics.AnalyticsProxyService', []).factory('AnalyticsProxy', [
  '$rootScope',
  '$location',
  'BG_DEV',
  'MixpanelProvider',
  function ($rootScope, $location, BG_DEV, MixpanelProvider) {
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
      } catch (e) {
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
      } catch (e) {
        throw new Error('Invalid analytics shutdown: ', e);
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
    * @param userID {String}
    * @private
    */
    function register(userID) {
      if (!userID) {
        throw new Error('invalid userID');
      }
      try {
        MixpanelProvider.alias(userID);
      } catch (e) {
        throw new Error('Invalid user registration: ', e);
      }
      return true;
    }
    /**
    * The recommended usage pattern is to call this when the user signs up
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
        throw new Error('Invalid user login: ', e);
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
]);/**
 * @ngdoc service
 * @name AnalyticsUtilities
 * @description
 * Helpers for analytics instrumentation and eventing
 */
angular.module('BitGo.Analytics.AnalyticsUtilitiesService', []).factory('AnalyticsUtilities', [
  '$rootScope',
  'BG_DEV',
  'AnalyticsProxy',
  function ($rootScope, BG_DEV, AnalyticsProxy) {
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
    utils.time.PasswordCompletionMonitor = function () {
      this._states = {
        started: 'started',
        completed: 'completed'
      };
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
    utils.time.PasswordCompletionMonitor.prototype.track = function (eventName, passwordStrength) {
      // return data for the tracking call
      var data = {};
      var self = this;
      if (!passwordStrength) {
        return;
      }
      if (typeof eventName !== 'string') {
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
      if (self._currentState && self._currentState !== self._states.completed && passwordStrength.progress.value >= BG_DEV.PASSWORD.MIN_STRENGTH) {
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
    // In-app API
    return utils;
  }
]);/**
 * @ngdoc service
 * @name MixpanelProvider
 * @description
 * This manages the analytics calls to Mixpanel
 */
angular.module('BitGo.Analytics.MixpanelProvider', []).factory('MixpanelProvider', [
  '$rootScope',
  'BG_DEV',
  function ($rootScope, BG_DEV) {
    /**
    * Initialize Mixpanel analytics
    * @private
    */
    function init() {
      if (typeof mixpanel.init !== 'function') {
        throw new Error('Missing Mixpanel');
      }
      mixpanel.init(BG_DEV.ANALYTICS.MIXPANEL.APP_TOKEN);
      return true;
    }
    /**
    * Kill Mixpanel analytics for the current user (usually called on logout)
    * @private
    */
    function shutdown() {
      // Mixpanel is unclear about how to handle user logouts - best practices are used below
      // https://github.com/mixpanel/mixpanel-android/issues/97
      // http://stackoverflow.com.80bola.com/questions/21137286/what-should-i-do-when-users-log-out/22059786
      mixpanel.cookie.clear();
      init('');
      return true;
    }
    // Event Tracking
    /**
    * Track a generic event in Mixpanel
    * @param eventName {String}
    * @param eventData {Object}
    * @private
    */
    // Additional Notes on Tracking Mixpanel Events:
    //
    // TRACKING
    // ==============================
    // For different events, we expect specific properties to come along
    // when the event is registered in Mixpanel
    //
    // All Error Events:
    //  status: server's error status || 'client'
    //  message: server's error msg || custom client message
    //  action: What action the user was taking to trigger the error
    //
    // Nav Events:
    //  location: next location that the user is navigating to
    function track(eventName, eventData) {
      if (!eventName) {
        throw new Error('invalid params');
      }
      if (eventData) {
        mixpanel.track(eventName, eventData);
        return true;
      }
      mixpanel.track(eventName);
      return true;
    }
    // Super Properties
    /**
    * Set data to be sent along with all tracking events in future tracking calls
    * @param data {Object}
    * @param registerOnce {Bool} (optional) Kills attempts to overwrite data later in the same session
    * @private
    */
    function register(data, registerOnce) {
      if (!data) {
        throw new Error('invalid params');
      }
      if (typeof registerOnce === 'boolean' && registerOnce) {
        mixpanel.register_once(data);
        return true;
      }
      mixpanel.register(data);
      return true;
    }
    // User Identification / Tracking
    // Notes:
    // The recommended usage pattern is to call mixpanel.alias when
    // the user signs up, and mixpanel.identify when they log in.
    // This will keep the BitGo signup funnels working correctly.
    /**
    * The recommended usage pattern is to call this when the user signs up
    * @param userID {String}
    * @private
    */
    function alias(userID) {
      if (!userID) {
        throw new Error('invalid params');
      }
      mixpanel.alias(userID);
      return true;
    }
    /**
    * The recommended usage pattern is to call this when the user logs in
    * @param userID {String}
    * @private
    */
    function identify(userID) {
      if (!userID) {
        throw new Error('invalid params');
      }
      mixpanel.identify(userID);
      return true;
    }
    // Initialize Mixpanel as soon as the app boots
    init();
    // In-app API
    // Notes:
    // We proxy analytics calls through a global analytics handler: AnalyticsProxy
    // The calls below are the used subset of all Mixpanel functions:
    // https://mixpanel.com/help/reference/javascript-full-api-reference
    return {
      init: init,
      shutdown: shutdown,
      track: track,
      register: register,
      identify: identify,
      alias: alias
    };
  }
]);/**
 * @ngdoc service
 * @name AccessTokensAPI
 * @description
 * This manages app API requests for the access token functionality in BitGo
 */
angular.module('BitGo.API.AccessTokensAPI', []).factory('AccessTokensAPI', [
  '$resource',
  'UtilityService',
  function ($resource, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    /**
    * Add an access token to a user
    * @param params {Object}
    * @private
    */
    function add(params) {
      if (!params) {
        throw new Error('missing params');
      }
      var resource = $resource(kApiServer + '/user/accesstoken', {}, { 'add': { method: 'POST' } });
      return new resource(params).$add().then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
    * Lists the access tokens for a user
    * @private
    */
    function list() {
      var resource = $resource(kApiServer + '/user/accesstoken', {});
      return new resource.get({}).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
    * Remove an access token for a user
    * @private
    */
    function remove(accessTokenId) {
      if (!accessTokenId) {
        throw new Error('missing accessTokenId');
      }
      var resource = $resource(kApiServer + '/user/accesstoken/' + accessTokenId, {});
      return new resource({}).$delete().then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    // Client API
    return {
      add: add,
      list: list,
      remove: remove
    };
  }
]);/*
  About:
  - Deals with all the BitGo API requests
*/
angular.module('BitGo.API', [
  'BitGo.API.AccessTokensAPI',
  'BitGo.API.ApprovalsAPI',
  'BitGo.API.AuditLogAPI',
  'BitGo.API.EnterpriseAPI',
  'BitGo.API.KeychainsAPI',
  'BitGo.API.LabelsAPI',
  'BitGo.API.MarketDataAPI',
  'BitGo.API.PolicyAPI',
  'BitGo.API.ReportsAPI',
  'BitGo.API.SettingsAPI',
  'BitGo.API.StatusAPI',
  'BitGo.API.TransactionsAPI',
  'BitGo.API.UserAPI',
  'BitGo.API.WalletsAPI',
  'BitGo.API.WalletSharesAPI',
  'BitGo.Model',
  'BitGo.Utility'
]);/**
 * @ngdoc service
 * @name ApprovalsAPI
 * @description
 * Manages the http requests dealing with a wallet's approval objects
 */
angular.module('BitGo.API.ApprovalsAPI', []).factory('ApprovalsAPI', [
  '$q',
  '$location',
  '$resource',
  'UtilityService',
  function ($q, $location, $resource, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    /**
    * Updates a wallet's specific approval
    * @param {string} walletId for the approval
    * @param {obj} object containing details needed to update the approval
    * @private
    */
    function update(walletId, approvalData) {
      var resource = $resource(kApiServer + '/pendingapprovals/' + walletId, {}, { update: { method: 'PUT' } });
      return new resource(approvalData).$update({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /** In-client API */
    return { update: update };
  }
]);angular.module('BitGo.API.AuditLogAPI', []).factory('AuditLogAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  function ($q, $location, $resource, $rootScope, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // Get the audit log based on scoping provided in the params
    function get(params) {
      if (!params || !params.enterpriseId || typeof params.skip !== 'number' || typeof params.limit !== 'number') {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/auditlog', {});
      return resource.get(params).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    // In-client API
    return { get: get };
  }
]);angular.module('BitGo.API.EnterpriseAPI', []).factory('EnterpriseAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  'CacheService',
  'EnterpriseModel',
  'NotifyService',
  function ($q, $location, $resource, $rootScope, UtilityService, CacheService, EnterpriseModel, NotifyService) {
    var DEFAULT_CACHED_ENTERPRISE_ID = 'personal';
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // Cache setup
    var enterpriseCache = new CacheService.Cache('localStorage', 'Enterprises', 120 * 60 * 1000);
    /**
    * update the user's cached current enterprise
    * @param enterprise {String} id for the new enterprise to set in cache
    * @private
    */
    function updateUserCurrentEnterpriseCache(enterprise) {
      var userId = $rootScope.currentUser.settings.id;
      if (!enterprise || !userId) {
        throw new Error('missing params');
      }
      enterpriseCache.add('currentEnterprise' + userId, enterprise);
    }
    /**
    * Set up a default current enterprise before a user is set
    * @private
    */
    function initUserCurrentEnterpriseCache() {
      var userId = $rootScope.currentUser && $rootScope.currentUser.settings.id;
      var cachedEnterprise = userId && enterpriseCache.get('currentEnterprise' + userId);
      if (cachedEnterprise) {
        // if the user has cached preferences, update the cache based on them
        return updateUserCurrentEnterpriseCache(cachedEnterprise);
      } else {
        // otherwise update the cache with a default current enterprise ('personal')
        return updateUserCurrentEnterpriseCache(DEFAULT_CACHED_ENTERPRISE_ID);
      }
    }
    /**
    * Returns the current enterprise
    * @returns {String} current enterprise id || undefined
    * @private
    */
    function getCurrentEnterprise() {
      // If there is no user, return the default cached enterprise
      var userId = $rootScope.currentUser && $rootScope.currentUser.settings.id;
      if (!userId) {
        console.error('Missing current user id');
        return;
      }
      // Return the user's last cached current enterprise or default to personal
      var curEnterpriseId = enterpriseCache.get('currentEnterprise' + userId) || 'personal';
      return curEnterpriseId;
    }
    /**
    * Sets the new current enterprise object on rootScope
    * @param enterprise {String} id for the new current enterprise
    * @private
    */
    function setCurrentEnterprise(enterprise) {
      if (!enterprise) {
        throw new Error('Missing enterprise');
      }
      if (_.isEmpty($rootScope.enterprises.all)) {
        throw new Error('Missing $rootScope.enterprises.all');
      }
      var newCurrentEnterprise = $rootScope.enterprises.all[enterprise.id];
      if (!newCurrentEnterprise) {
        throw new Error('Could not find the enterprise: ' + enterprise.id);
      }
      // Set the new current enterprise in the app and cache
      $rootScope.enterprises.current = newCurrentEnterprise;
      updateUserCurrentEnterpriseCache($rootScope.enterprises.current.id);
      // If the new enterprise is different from the one the user is currently in,
      // broadcast the new event and go to the enterprise's wallets list page
      if ($rootScope.enterprises.current.id !== UtilityService.Url.getEnterpriseIdFromUrl()) {
        $rootScope.$emit('EnterpriseAPI.CurrentEnterpriseSet', { enterprises: $rootScope.enterprises });
      }
    }
    // Fetch all enterprises for the user
    function getAllEnterprises() {
      var resource = $resource(kApiServer + '/enterprise', {});
      return resource.get({}).$promise.then(function (data) {
        // Array of enterprises returned
        var enterprises = data.enterprises;
        // Reset the rootScope enterprise list
        $rootScope.enterprises.all = {};
        // Create all 'real' enterprise objects
        _.forEach(enterprises, function (enterpriseData) {
          enterprise = new EnterpriseModel.Enterprise(enterpriseData);
          $rootScope.enterprises.all[enterprise.id] = enterprise;
          enterpriseCache.add(enterprise.name, enterprise);
        });
        // Create the 'personal' enterprise object
        var personalEnterprise = new EnterpriseModel.Enterprise();
        $rootScope.enterprises.all[personalEnterprise.id] = personalEnterprise;
        enterpriseCache.add(personalEnterprise.name, personalEnterprise);
        // If an enterprise is set in the url use it; otherwise default to personal
        var curEnterpriseId = getCurrentEnterprise();
        _.forIn($rootScope.enterprises.all, function (enterprise) {
          if (enterprise.id === curEnterpriseId) {
            $rootScope.enterprises.current = enterprise;
          }
        });
        // Let listeners in the app know that the enterprise list was set
        $rootScope.$emit('EnterpriseAPI.CurrentEnterpriseSet', { enterprises: $rootScope.enterprises });
        return enterprises;
      }, PromiseErrorHelper());
    }
    /**
    * Creates an enterprise inquiry for the marketing team
    * @param inquiry {Object} contains necessary params for the post
    * @private
    */
    function createInquiry(inquiry) {
      if (!inquiry) {
        throw new Error('invalid params');
      }
      var resource = $resource(kApiServer + '/enterprise/inquiry', {});
      return new resource.save(inquiry).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
    * Sets the users on the current enterprise
    * @private
    */
    function setCurrentEnterpriseUsers() {
      if (!$rootScope.enterprises.current) {
        console.log('Cannot set users on the current enterprise without a current enterprise');
        return false;
      }
      $rootScope.enterprises.current.setUsers($rootScope.wallets.all);
    }
    /**
    * Decorates each enterprise with wallet data once every wallet returns
    * @param wallets {Object} collection of BitGo client wallet objects
    * @private
    */
    function decorateEnterprisesWithWalletShareData(walletShares) {
      _.forIn($rootScope.enterprises.all, function (enterprise) {
        enterprise.setWalletShareCount(walletShares);
      });
    }
    /**
    * Decorates each enterprise with wallet data once every wallet returns
    * @param wallets {Object} collection of BitGo client wallet objects
    * @private
    */
    function decorateEnterprisesWithWalletData(wallets) {
      _.forIn($rootScope.enterprises.all, function (enterprise) {
        enterprise.setWalletCount(wallets);
        enterprise.setBalance(wallets);
      });
    }
    // Event Handling
    $rootScope.$on('UserAPI.CurrentUserSet', function (evt, user) {
      initUserCurrentEnterpriseCache();
      getAllEnterprises();
    });
    $rootScope.$on('UserAPI.UserLogoutEvent', function (evt, user) {
      // clear enterprises on rootscope on logout
      init();
    });
    $rootScope.$on('WalletsAPI.UserWalletsSet', function (evt, data) {
      if (_.isEmpty(data.allWallets)) {
        return;
      }
      // Set users on the current enterprise
      setCurrentEnterpriseUsers();
      // Decorate all enterprises with the latest wallet data
      decorateEnterprisesWithWalletData(data.allWallets);
    });
    $rootScope.$on('WalletSharesAPI.AllUserWalletSharesSet', function (evt, data) {
      if (_.isEmpty(data.walletShares.incoming) && _.isEmpty(data.walletShares.outgoing)) {
        return;
      }
      // Decorate all enterprises with the latest walletShares data
      decorateEnterprisesWithWalletShareData(data.walletShares);
    });
    function init() {
      $rootScope.enterprises = {
        all: {},
        current: null
      };
    }
    init();
    // In-client API
    return {
      getAllEnterprises: getAllEnterprises,
      setCurrentEnterprise: setCurrentEnterprise,
      getCurrentEnterprise: getCurrentEnterprise,
      createInquiry: createInquiry
    };
  }
]);angular.module('BitGo.API.KeychainsAPI', []).factory('KeychainsAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  'UserAPI',
  function ($q, $location, $resource, $rootScope, Utils, UserAPI) {
    var kApiServer = Utils.API.apiServer;
    var PromiseSuccessHelper = Utils.API.promiseSuccessHelper;
    var PromiseErrorHelper = Utils.API.promiseErrorHelper;
    // Helper: generates a new BIP32 keychain to use
    function generateKey() {
      // Generate the entropy for the keychain's seed
      var randomBytes = new Array(256);
      new Bitcoin.SecureRandom().nextBytes(randomBytes);
      var seed = Bitcoin.Util.bytesToHex(randomBytes);
      // create a new BIP32 object from the random seed
      return new Bitcoin.BIP32().initFromSeed(seed);
    }
    // Creates keychains on the BitGo server
    function createKeychain(data) {
      // source for the keychain being created (currently 'user' or 'cold')
      var source = data.source;
      // the passcode used to encrypt the xprv
      var passcode = data.passcode;
      // the BIP32 extended key used to create a keychain when a user wants to use their own backup
      var extendedKey = data.extendedKey;
      var saveEncryptedXprv = data.saveEncryptedXprv;
      // If the user doesn't provide a key, generate one
      if (!extendedKey) {
        extendedKey = generateKey();
      }
      // Each saved keychain object has these properties
      var keychainData = {
          source: data.source,
          xpub: extendedKey.extended_public_key_string()
        };
      // If we're storing the encryptedXprv, include this with the request
      if (saveEncryptedXprv) {
        // The encrypted xprv; encrypted with the wallet's passcode
        keychainData.encryptedXprv = Utils.Crypto.sjclEncrypt(passcode, extendedKey.extended_private_key_string());
        // And a code that is used to encrypt the user's wallet passcode (the 'passcode' referenced in this function)
        // This code is only ever used to encrypt the original passcode for this keychain,
        // and is used only for recovery purposes with the original encrypted xprv blob.
        //if we are generating ECDH key for user, passcodencryption code is not needed
        if (source !== 'ecdh') {
          keychainData.originalPasscodeEncryptionCode = data.originalPasscodeEncryptionCode;
        }
      }
      function onCreateSuccess(data) {
        // For backup purposes: We'll decorate the returned keychain object
        // with the xprv and encryptedXprv so we can access them in the app
        if (extendedKey.has_private_key) {
          data.xprv = extendedKey.extended_private_key_string();
          if (!data.encryptedXprv) {
            data.encryptedXprv = Utils.Crypto.sjclEncrypt(passcode, data.xprv);
          }
        }
        return data;
      }
      // Return the promise
      var resource = $resource(kApiServer + '/keychain', {});
      return new resource(keychainData).$save({}).then(function (data) {
        return onCreateSuccess(data);
      }, function (error) {
        // 301 means we tried adding a keychain that already exists
        // so we treat this case like a success and return the keychain
        if (error.status === 301) {
          return onCreateSuccess(data);
        }
        return PromiseErrorHelper()(error);
      });
    }
    // Create and return the new BitGo keychain
    function createBitGoKeychain() {
      var resource = $resource(kApiServer + '/keychain/bitgo', {});
      return new resource({}).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    // Get a specific BitGo keychain
    function get(xpub) {
      if (typeof xpub !== 'string') {
        throw new Error('illegal argument');
      }
      var keychainsResource = $resource(kApiServer + '/keychain/' + xpub, {});
      return new keychainsResource().$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * Update a bitgo keychain
     * @param {Obj} bitgo keychain object to update
     * @returns {Obj} updated bitgo keychain
     */
    function update(keychainData) {
      if (typeof keychainData.xpub !== 'string' || typeof keychainData.encryptedXprv !== 'string') {
        throw new Error('illegal argument');
      }
      var resource = $resource(kApiServer + '/keychain/' + keychainData.xpub, {}, { update: { method: 'PUT' } });
      return new resource(keychainData).$update({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    // In-client API
    return {
      get: get,
      update: update,
      createKeychain: createKeychain,
      createBitGoKeychain: createBitGoKeychain,
      generateKey: generateKey
    };
  }
]);angular.module('BitGo.API.LabelsAPI', []).factory('LabelsAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  'CacheService',
  function ($q, $location, $resource, $rootScope, UtilityService, CacheService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // simple in-memory cache
    var labelsCache = {};
    /**
     * Init the label cache
     */
    function initCache() {
      if (_.isEmpty(labelsCache) || _.isEmpty($rootScope.wallets.all)) {
        return;
      }
      _.forEach($rootScope.wallets.all, function (wallet) {
        get(wallet.data.id, wallet.data.id);
      });
    }
    /**
     * Augment the label cache with the user's wallet labels
     * @param wallets {Object} all wallets the user has access to
     * @private
     */
    function augmentCacheWithWallets(wallets) {
      if (!wallets) {
        throw new Error('missing user wallets');
      }
      _.forIn(wallets, function (wallet) {
        var entry = [{
              walletId: wallet.data.id,
              label: wallet.data.label
            }];
        labelsCache[wallet.data.id] = entry;
      });
    }
    // Adds labels for a wallet to the in-memory cache
    function addLabelToCache(label) {
      // If the label doesn't have an address, it is of
      // no use to us.  This shouldn't happen.
      if (!label.address) {
        return;
      }
      // The cache is a map of entries indexed by walletId.
      // Each entry is an array of [walletId, label] pairs.
      // This way, if two wallets each define a label for the same bitcoin address,
      // we can be sure to use the right one.  This is annoying, but the edge case exists.
      var entry = labelsCache[label.address] || [];
      // remove existing labels
      _.remove(entry, function (entryItem) {
        return entryItem.walletId === label.walletId;
      });
      // add the new label
      entry.push({
        walletId: label.walletId,
        label: label.label
      });
      // add the new labels array for this wallet to the cache
      labelsCache[label.address] = entry;
    }
    /**
     * Removes labels for a wallet from in-memory cache
     * @param label {Object} A label of a particular address
     * @private
     */
    function removeLabelFromCache(label) {
      // If the label doesn't have an address, it is of
      // no use to us.  This shouldn't happen.
      if (!label.address) {
        return;
      }
      var entry = labelsCache[label.address] || [];
      // remove existing labels
      _.remove(entry, function (entryItem) {
        return entryItem.walletId === label.walletId;
      });
      // add the new labels array for this wallet to the cache
      labelsCache[label.address] = entry;
    }
    // Add a label to an address for a wallet
    function add(params) {
      var resource = $resource(kApiServer + '/labels/' + params.walletId + '/' + params.address, {}, { 'save': { method: 'PUT' } });
      return new resource.save({ label: params.label }).$promise.then(function (data) {
        addLabelToCache(data);
        return data;
      }, PromiseErrorHelper());
    }
    /**
     * Delete a label for an address in a wallet
     * @param label {Object} Object containing a walletid and address
     * @return promise
     * @public
     */
    function remove(params) {
      if (!params.walletId || !params.address) {
        return;
      }
      var resource = $resource(kApiServer + '/labels/' + params.walletId + '/' + params.address, {});
      return new resource({}).$delete().then(function (data) {
        removeLabelFromCache(data);
        return data;
      }, PromiseErrorHelper());
    }
    // Return a list of labeled addresses associated with a wallet
    function list() {
      // Cache was already loaded - return it
      if (!_.isEmpty(labelsCache)) {
        return $q.when(labelsCache);
      }
      var resource = $resource(kApiServer + '/labels/', {});
      return resource.get({}).$promise.then(function (data) {
        _.forEach(data.labels, function (label) {
          addLabelToCache(label);
        });
        return labelsCache;
      }, PromiseErrorHelper());
    }
    // Return a label for an address hopefully scoped by wallet
    function get(address, walletId) {
      if (!walletId || !address) {
        console.log('Missing get address arguments');
        return $q.reject();
      }
      return list().then(function () {
        var cacheEntry = labelsCache[address];
        if (!cacheEntry || cacheEntry.length === 0) {
          return undefined;
        }
        var result = cacheEntry.reduce(function (item) {
            if (!item) {
              return;
            }
            return item.walletId === walletId ? item.label : undefined;
          });
        // Return the match or just return the first entry.
        // Note that this policy intentionally returns cross-
        // wallet matches.
        return result ? result : cacheEntry[0].label;
      });
    }
    /**
     * Fetch the user's labels to populate the cache when they log in
     */
    $rootScope.$on('UserAPI.CurrentUserSet', function (evt) {
      list().catch(function (error) {
        console.error('Error initializing user labels: ', error);
      });
    });
    /**
     * Augment the label cache with the wallet labels when wallets become available
     */
    $rootScope.$on('WalletsAPI.UserWalletsSet', function (evt, data) {
      if (!_.isEmpty(data.allWallets)) {
        augmentCacheWithWallets(data.allWallets);
      }
    });
    // In-client API
    return {
      get: get,
      add: add,
      list: list,
      initCache: initCache,
      remove: remove
    };
  }
]);angular.module('BitGo.API.MarketDataAPI', ['ngResource']).factory('MarketDataAPI', [
  '$resource',
  '$http',
  '$rootScope',
  'BG_DEV',
  'UtilityService',
  'CacheService',
  function ($resource, $http, $rootScope, BG_DEV, Utils, CacheService) {
    var kApiServer = Utils.API.apiServer;
    var PromiseSuccessHelper = Utils.API.promiseSuccessHelper;
    var PromiseErrorHelper = Utils.API.promiseErrorHelper;
    var validators = Utils.Validators;
    var currencyCache = new CacheService.Cache('localStorage', 'Currency', 60 * 60 * 1000);
    var symbolMap = {
        'AUD': 'A$',
        'CAD': 'C$',
        'CNY': '\xa5',
        'EUR': '\u20ac',
        'GBP': '\xa3',
        'USD': '$',
        'ZAR': 'R'
      };
    // Listen for when the root user is set on the app,
    // update the app's currency to reflect their settings
    $rootScope.$on('UserAPI.CurrentUserSet', function () {
      try {
        var userCurrency = $rootScope.currentUser.settings.currency.currency;
        var userBitcoinUnit = $rootScope.currentUser.settings.currency.bitcoinUnit;
        if (userCurrency) {
          setInAppMarketData(userCurrency);
        }
        if (userBitcoinUnit) {
          setBitcoinUnit(userBitcoinUnit);
        }
      } catch (error) {
        console.log('Error updating app currency to user preferences', error);
      }
    });
    // Listens for changes in user currency settings
    $rootScope.$on('SettingsCurrencyForm.ChangeBitcoinUnit', function (evt, newUnit) {
      if (!validators.bitcoinUnitOk(newUnit)) {
        throw new Error(BG_DEV.ERRORS.INVALID_BITCOIN_UNIT);
      }
      setBitcoinUnit(newUnit);
    });
    $rootScope.$on('SettingsCurrencyForm.ChangeAppCurrency', function (evt, newCurrency) {
      if (!validators.currencyOk(newCurrency)) {
        throw new Error(BG_DEV.ERRORS.INVALID_CURRENCY);
      }
      setInAppMarketData(newCurrency);
    });
    // Blockchain Data Setters
    function setMarketCapData() {
      try {
        var cap = $rootScope.currency.data.current.last * $rootScope.blockchainData.blockchain.totalbc;
        $rootScope.blockchainData.marketcap = cap;
      } catch (error) {
        console.log('Error setting market cap data', error);
      }
    }
    function setBlockchainData() {
      try {
        $rootScope.blockchainData = {
          blockchain: currencyCache.storage.get('blockchain'),
          updateTime: currencyCache.storage.get('updateTime')
        };
      } catch (error) {
        console.log('Error setting blockchain data', error);
      }
    }
    // Financial Data Setter
    function setFinancialData() {
      var currency = getAppCurrency();
      try {
        $rootScope.currency = {
          currency: currency,
          bitcoinUnit: getBitcoinUnit(),
          symbol: symbolMap[currency],
          data: {
            current: currencyCache.get('current')[currency],
            previous: currencyCache.get('previous')[currency]
          }
        };
      } catch (error) {
        console.log('Error setting app financial data', error);
      }
    }
    // bitcoinUnit setter/getter
    function getBitcoinUnit() {
      var cachedBitcoinUnit = currencyCache.get('bitcoinUnit');
      return cachedBitcoinUnit ? cachedBitcoinUnit : $rootScope.currency.bitcoinUnit;
    }
    function setBitcoinUnit(unit) {
      if (!validators.bitcoinUnitOk(unit)) {
        throw new Error(BG_DEV.ERRORS.INVALID_BITCOIN_UNIT);
      }
      currencyCache.add('bitcoinUnit', unit);
      // update the app's financial data with the new unit
      setInAppMarketData(getAppCurrency());
    }
    // AppCurrency setter/getter
    function getAppCurrency() {
      var cachedCurrency = currencyCache.get('currency');
      return cachedCurrency ? cachedCurrency : $rootScope.currency.currency;
    }
    function setInAppMarketData(currency) {
      if (!validators.currencyOk(currency)) {
        throw new Error(BG_DEV.ERRORS.INVALID_CURRENCY);
      }
      currencyCache.add('currency', currency);
      // update the app's financial data with the new currency
      setFinancialData();
      setBlockchainData();
      setMarketCapData();
      $rootScope.$emit('MarketDataAPI.AppCurrencyUpdated', $rootScope.currency);
    }
    // CurrencyCache Setter
    function setCurrencyCache(data) {
      // Currency & Unit Data
      currencyCache.add('currency', getAppCurrency());
      currencyCache.add('bitcoinUnit', getBitcoinUnit());
      // Blockchain Data
      currencyCache.add('blockchain', data.latest.blockchain);
      currencyCache.add('updateTime', data.latest.updateTime);
      // Market Currency Data
      var previous = currencyCache.get('previous') ? currencyCache.get('current') : data.latest.currencies;
      currencyCache.add('previous', previous);
      currencyCache.add('current', data.latest.currencies);
    }
    // Initialization to set up the currency for the app before user and
    // financial data is returned
    function init() {
      // Initialize the app's fin/blockchain data - used throughout the app
      $rootScope.currency = {};
      $rootScope.blockchainData = {};
      // Initialize a currency for the app
      var storedAppCurrency = currencyCache.get('currency');
      $rootScope.currency.currency = storedAppCurrency ? storedAppCurrency : BG_DEV.CURRENCY.DEFAULTS.CURRENCY;
      // Initialize a bitcoinUnit for the app
      var cachedBitcoinUnit = currencyCache.get('bitcoinUnit');
      $rootScope.currency.bitcoinUnit = cachedBitcoinUnit ? cachedBitcoinUnit : BG_DEV.CURRENCY.DEFAULTS.BITCOIN_UNIT;
    }
    init();
    return {
      latest: function () {
        var resource = $resource(kApiServer + '/market/latest', {});
        return resource.get({}).$promise.then(function (result) {
          if (!_.isEmpty(result.latest.currencies)) {
            var currency = getAppCurrency();
            setCurrencyCache(result);
            setInAppMarketData(currency);
            return $rootScope.currency;
          }
        }, PromiseErrorHelper());
      },
      price: function (range, currency) {
        if (!range) {
          throw new Error('Need range when getting market data');
        } else if (!currency) {
          throw new Error('Need currency when getting market data');
        }
        var resource = $resource(kApiServer + '/market/last/:range/:currency', {
            range: range,
            currency: currency
          });
        return resource.query({}).$promise.then(function (results) {
          var prices = [];
          var max = 0;
          var min = results[0][1];
          results.forEach(function (result) {
            prices.push({
              x: new Date(result[0] * 1000),
              y: result[1]
            });
            if (result[1] > max) {
              max = result[1];
            } else if (min > result[1]) {
              min = result[1];
            }
          });
          return {
            prices: prices,
            max: max,
            min: min
          };
        }, PromiseErrorHelper());
      }
    };
  }
]);angular.module('BitGo.API.PolicyAPI', []).factory('PolicyAPI', [
  '$resource',
  '$rootScope',
  'UtilityService',
  function ($resource, $rootScope, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    /**
    * Update a policy rule on specified wallet
    * @param params {Object} params for the the policy update
    * @private
    */
    function updatePolicyRule(params) {
      if (!params.rule || !params.bitcoinAddress) {
        throw new Error('invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/' + params.bitcoinAddress + '/policy/rule', {}, { 'save': { method: 'PUT' } });
      return new resource.save(params.rule).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
    * Delete a policy rule on specified wallet
    * @param params {Object} params for the the policy update
    * @private
    */
    function deletePolicyRule(params) {
      if (!params.id || !params.bitcoinAddress) {
        throw new Error('invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/' + params.bitcoinAddress + '/policy/rule', { id: params.id });
      return new resource.delete().$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    // In-client API
    return {
      updatePolicyRule: updatePolicyRule,
      deletePolicyRule: deletePolicyRule
    };
  }
]);angular.module('BitGo.API.ReportsAPI', []).factory('ReportsAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  function ($q, $location, $resource, $rootScope, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // local copy of the report range for all wallets
    var ranges;
    // Fetch the report range for a specific wallet based on a time step
    function getWalletReportRange(params) {
      var rangeParams = { stepType: params.stepType || 'month' };
      var resource = $resource(kApiServer + '/reports/' + params.walletAddress + '/range', {});
      return new resource.get(rangeParams).$promise.then(function (data) {
        ranges[params.walletAddress] = data.range;
        return data.range;
      });
    }
    // Get the report range for each wallet in a list of wallets
    // E.g.: all wallets in a specific enterprise
    // The time interval can be configured by stepType ('day' | 'month')
    function getAllWalletsReportRange(params) {
      if (!params.wallets) {
        throw new Error('Expect list of wallets when getting report range for a wallet group');
      }
      // Reset the local report range object
      ranges = {};
      // Fetch the report range for each wallet
      var fetches = [];
      _.forIn(params.wallets, function (wallet) {
        var walletData = {
            walletAddress: wallet.data.id,
            stepType: params.stepType || 'month'
          };
        fetches.push(getWalletReportRange(walletData));
      });
      // Return the ranges of report dates
      return $q.all(fetches).then(function (data) {
        return ranges;
      }, PromiseErrorHelper());
    }
    // Get a specific report (based on params) for a specific wallet
    function getReport(params) {
      var resource = $resource(kApiServer + '/reports/' + params.walletAddress, {});
      return new resource.get(params).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    function init() {
      ranges = {};
    }
    init();
    // In-client API
    return {
      getAllWalletsReportRange: getAllWalletsReportRange,
      getReport: getReport
    };
  }
]);angular.module('BitGo.API.SettingsAPI', []).factory('SettingsAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  function ($q, $location, $resource, $rootScope, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    function assertAuth(data) {
      console.assert(_.has(data, 'token_type'), 'missing token_type');
      console.assert(_.has(data, 'access_token'), 'missing access_token');
      console.assert(_.has(data, 'expires_in'), 'missing expires_in');
    }
    function assertSettings(data) {
      console.assert(_.has(data, 'settings'), 'missing settings');
      console.assert(_.has(data.settings, 'username'), 'missing settings.username');
      console.assert(_.has(data.settings, 'name'), 'missing settings.name');
      console.assert(_.has(data.settings.name, 'full'), 'missing settings.name.full');
      console.assert(_.has(data.settings.name, 'first'), 'missing settings.name.first');
      console.assert(_.has(data.settings.name, 'last'), 'missing settings.name.last');
      console.assert(_.has(data.settings, 'email'), 'missing settings.email');
      console.assert(_.has(data.settings.email, 'email'), 'missing settings.email.email');
      console.assert(_.has(data.settings.email, 'verified'), 'missing settings.email.verified');
      console.assert(_.has(data.settings, 'phone'), 'missing settings.phone');
      console.assert(_.has(data.settings.phone, 'phone'), 'missing settings.phone.phone');
      console.assert(_.has(data.settings.phone, 'verified'), 'missing settings.phone.verified');
      console.assert(_.has(data.settings, 'notifications'), 'missing notifications');
      console.assert(_.has(data.settings, 'isPrivateProfile'), 'missing isPrivateProfile');
      console.assert(_.has(data.settings.notifications, 'via_email'), 'missing settings.notifications.via_email');
      console.assert(_.has(data.settings.notifications, 'via_phone'), 'missing settings.notifications.via_phone');
      console.assert(_.has(data.settings.notifications, 'on_send_btc'), 'missing settings.notifications.on_send_btc');
      console.assert(_.has(data.settings.notifications, 'on_recv_btc'), 'missing settings.notifications.on_recv_btc');
      console.assert(_.has(data.settings.notifications, 'on_message'), 'missing settings.notifications.on_message');
      console.assert(_.has(data.settings.notifications, 'on_btc_change'), 'missing settings.notifications.on_btc_change');
      console.assert(_.has(data.settings.notifications, 'on_follow'), 'missing settings.notifications.on_follow');
      console.assert(_.has(data.settings.notifications, 'on_join'), 'missing settings.notifications.on_join');
      console.assert(_.has(data.settings, 'digest'), 'missing digest');
      console.assert(_.has(data.settings.digest, 'enabled'), 'missing settings.digest.enabled');
      console.assert(_.has(data.settings.digest, 'intervalSeconds'), 'missing settings.digest.intervalSeconds');
    }
    // In-client API
    return {
      get: function () {
        var resource = $resource(kApiServer + '/user/settings', {});
        return resource.get({}).$promise.then(function (response) {
          assertSettings(response);
          return response.settings;
        }, PromiseErrorHelper());
      },
      save: function (params) {
        if (!params) {
          throw new Error('invalid params');
        }
        var resource = $resource(kApiServer + '/user/settings', {}, { 'save': { method: 'PUT' } });
        return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      savePhone: function (params) {
        if (!params) {
          throw new Error('invalid params');
        }
        var resource = $resource(kApiServer + '/user/settings/phone', {});
        return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      }
    };
  }
]);/**
 * @ngdoc service
 * @name StatusAPI
 * @description
 * Manages the http requests dealing with server status/availability
 */
angular.module('BitGo.API.StatusAPI', []).factory('StatusAPI', [
  '$resource',
  'UtilityService',
  function ($resource, UtilityService) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    /**
    * Check BitGo service status
    * @private
    */
    function ping() {
      var resource = $resource(kApiServer + '/ping', {});
      return new resource.get({}).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /** In-client API */
    return { ping: ping };
  }
]);angular.module('BitGo.API.TransactionsAPI', []).factory('TransactionsAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  'WalletsAPI',
  'KeychainsAPI',
  'BG_DEV',
  function ($q, $location, $resource, $rootScope, UtilityService, WalletsAPI, KeychainsAPI, BG_DEV) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    /**
      * List all historical txs for a wallet
      * @param {object} wallet object
      * @param {object} params for the tx query
      * @returns {array} promise with array of wallettx items
      */
    function list(wallet, params) {
      if (!wallet || !params) {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/:walletId/wallettx', {
          walletId: wallet.data.id,
          skip: params.skip || 0
        });
      return resource.get({}).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
      * Get the tx history for a single wallettx item
      * @param {string} wallettx id
      * @returns {object} promise with the updated wallettx obj
      */
    function getTxHistory(walletTxId) {
      if (!walletTxId) {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/wallettx/' + walletTxId, {});
      return resource.get({}).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
      * Update a commment on a wallettx item
      * @param {string} wallet id
      * @param {string} wallettx id
      * @param {string} new comment for the transaction
      * @returns {object} promise with the updated wallettx obj
      */
    function updateComment(walletId, walletTxId, comment) {
      if (!walletId || !walletTxId || typeof comment === 'undefined') {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/wallettx/:walletTxId/comment', {
          walletId: walletId,
          walletTxId: walletTxId
        });
      return resource.save({ comment: comment }).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    // Send a transaction to the BitGo servers
    function post(transaction) {
      var resource = $resource(kApiServer + '/tx/send', {});
      return new resource(transaction).$save({});
    }
    // Get the list of unspents for a wallet
    function getUTXO(bitcoinAddress, target) {
      var resource = $resource(kApiServer + '/wallet/' + bitcoinAddress + '/unspents', { target: target });
      return new resource.get({}).$promise;
    }
    /**
      * TransactionBuilder
      * The TransactionBuilder is a heavy-lifting bitcoin workhorse for creating, signing, and sending
      * bitcoin transactions from one wallet to either another wallet or an email address.
      * Example usage:
      *       sender = {
      *         wallet: Wallet,    // A client wallet object
      *       };
      *       recipient = {
      *         type: String,
      *         wallet: Wallet,    // A bitcoin address (string) or email address
      *        satoshis: Number,
      *        message: String
      *      };
      *      feeSatoshis = 0.0001 * 1e8;
      *      var tb = new TransactionAPI.TransactionBuilder(sender, recipient, feeSatoshis);
      *      tb.signAndSendTransaction(passcode, otp);
      */
    var TransactionBuilder = function (sender, recipient, feeSatoshis) {
      var self = this;
      this.sender = sender;
      this.recipient = recipient;
      this.feeSatoshis = feeSatoshis;
      var _changeAddress;
      var _credentials = {};
      var _inputs;
      var _outputs;
      var _message = sender.message ? sender.message : '';
      var _transaction;
      var _unspents;
      // Returns the hex-serialized transaction from what has been built so far.
      this.tx = function () {
        if (!_transaction) {
          _transaction = new Bitcoin.Transaction();
        }
        var bytes = _transaction.serialize();
        return Crypto.util.bytesToHex(bytes);
      };
      //
      // Private Methods
      //
      // Decrypt a signing key.
      // Returns {
      //    key:       // the decrypted key, null on failure
      //    error:     // optional string error that occurred
      // }
      var decryptSigningKey = function (account, passcode) {
        var findChainRoot = function (account) {
          if (account.chain && account.chain.parent) {
            var result = findChainRoot(account.chain.parent);
            if (result.key) {
              var chainCode = Bitcoin.Util.hexToBytes(account.chain.code);
              var eckey = Bitcoin.ECKey.createECKeyFromChain(result.key, chainCode);
              result.key = eckey.getWalletImportFormat();
            }
            return result;
          }
          // At the root, decrypt the priv key here.
          try {
            var privKey = UtilityService.Crypto.sjclDecrypt(passcode, account.private.userPrivKey);
            return { key: privKey };
          } catch (e) {
            return {
              error: 'Invalid password: ' + e,
              key: null
            };
          }
        };
        return findChainRoot(account);
      };
      // Decrypt a keychain private key
      var decryptKeychain = function (keychain, passcode) {
        try {
          var privKey = UtilityService.Crypto.sjclDecrypt(passcode, keychain.encryptedXprv);
          return { key: privKey };
        } catch (e) {
          return {
            error: 'Invalid password: ' + e,
            key: null
          };
        }
      };
      // Get the credentials required to send a transaction from fromWallet.
      // Returns a promise.
      var deferred;
      var _getCredentials = function () {
        if (!self.sender || typeof self.sender.wallet.data !== 'object' || typeof self.sender.otp !== 'string' || typeof self.sender.passcode !== 'string') {
          throw Error('invalid argument');
        }
        var errorData = {
            status: 401,
            data: {
              needsPasscode: true,
              key: null
            }
          };
        var params;
        if (self.sender.wallet.data.type === 'external' || self.sender.wallet.data.type === 'safe') {
          if (self.sender.wallet.data.private && self.sender.wallet.data.private.userPrivKey) {
            // check if we have the passcode
            if (!self.sender.passcode) {
              errorData.message = 'Missing password';
              return $q.reject(UtilityService.ErrorHelper(errorData));
            }
            // we already have the key!
            var result = decryptSigningKey(self.sender.wallet.data, self.sender.passcode);
            if (result.error) {
              errorData.message = result.error;
              return $q.reject(UtilityService.ErrorHelper(errorData));
            } else {
              _credentials.key = result.key;
            }
            return $q.when(self);
          }
          params = {
            bitcoinAddress: self.sender.wallet.data.id,
            gpk: true
          };
          return WalletsAPI.getWallet(params, false).then(function (wallet) {
            // check if we have the passcode
            if (!self.sender.passcode) {
              errorData.message = 'Missing password';
              return $q.reject(UtilityService.ErrorHelper(errorData));
            }
            var result = decryptSigningKey(wallet.data, self.sender.passcode);
            if (result.error) {
              errorData.message = result.error;
              throw UtilityService.ErrorHelper(errorData);
            } else {
              _credentials.key = result.key;
              return self;
            }
          }, function (error) {
            return error;
          });
        } else if (self.sender.wallet.data.type === 'safehd') {
          params = { bitcoinAddress: self.sender.wallet.data.id };
          var wallet;
          return WalletsAPI.getWallet(params, false).then(function (returnedWallet) {
            wallet = returnedWallet;
            return KeychainsAPI.get(wallet.data.private.keychains[0].xpub, self.sender.otp);
          }).then(function (keychain) {
            _credentials.keychainPath = keychain.path;
            _credentials.path = keychain.path + wallet.data.private.keychains[0].path;
            // check if we have the passcode
            if (!self.sender.passcode) {
              errorData.message = 'Missing password';
              return $q.reject(UtilityService.ErrorHelper(errorData));
            }
            // check if encrypted xprv is present. It is not present for cold wallets
            if (!keychain.encryptedXprv) {
              return $q.reject({
                error: 'Cannot transact. No user key is present on this wallet.',
                status: 401
              });
            }
            var result = decryptKeychain(keychain, self.sender.passcode);
            if (result.error) {
              errorData.message = result.error;
              throw UtilityService.ErrorHelper(errorData);
            } else {
              _credentials.key = result.key;
              return self;
            }
          });
        } else {
          return $q.reject('can\'t send from this wallet');
        }
      };
      // Compute the wallet we'll send to for this transaction, whether it is an email
      // wallet or a bitcoin address.
      // Returns a promise.
      var _getReceiverWallet = function () {
        if (!self || !self.recipient) {
          throw Error('invalid argument');
        }
        switch (self.recipient.type) {
        case 'bitcoin':
          // Nothing to do, wallet already provided.
          return $q.when(self);
        default:
          throw new Error('unknown receiver type');
        }
      };
      // Prepare a simple transaction from one account to another with fees.
      // Will fetch the unspents, process them, and return an unsigned transaction given the parameters requested.
      // Returns a promise.
      var _prepareTransaction = function () {
        var deferred = $q.defer();
        if (!self.sender || !self.recipient || typeof self.recipient.address !== 'string' || typeof self.recipient.satoshis !== 'number' || typeof self.feeSatoshis !== 'number') {
          throw Error('invalid argument');
        }
        if (self.feeSatoshis > 100000000 || self.feeSatoshis > 100000000) {
          return deferred.reject('fee too large');  // Protection against bad inputs
        }
        // Convert any possible floats to integers.
        self.feeSatoshis = parseInt(self.feeSatoshis, 10);
        self.recipient.satoshis = parseInt(self.recipient.satoshis, 10);
        var totalSpendSatoshis = self.feeSatoshis + self.recipient.satoshis;
        console.log('Sending ' + totalSpendSatoshis);
        // Fetch unspents wrapped in a promise.
        var getUnspents = function () {
          return getUTXO(self.sender.wallet.data.id, totalSpendSatoshis).then(function (result) {
            _unspents = result.unspents;
            return self;
          }, function (error) {
            return error;
          });
        };
        // Collect inputs for createTransaction wrapped in a promise.
        var collectInputs = function () {
          var inputs = [];
          var inputAmountSatoshis = 0;
          _unspents.every(function (unspent) {
            inputs.push(unspent);
            inputAmountSatoshis += unspent.value;
            return inputAmountSatoshis < totalSpendSatoshis;  // Drops out of the loop when false, which stops adding inputs.
          });
          if (totalSpendSatoshis > inputAmountSatoshis) {
            return $q.reject('Insufficient funds');
          }
          _inputs = {
            inputAmountSatoshis: inputAmountSatoshis,
            inputs: inputs
          };
          return $q.when(self);
        };
        // Get a change address wrapped in a promise
        var getChangeAddress = function () {
          if (self.sender.wallet.data.type !== 'safehd') {
            _changeAddress = self.sender.wallet.data.id;
            return $q.when(self);
          }
          return WalletsAPI.createChangeAddress(self.sender.wallet.data.id).then(function (newAddress) {
            _changeAddress = newAddress.address;
            return self;
          }, function (error) {
            return error;
          });
        };
        // Collect outputs for createTransaction wrapped in a promise.
        var collectOutputs = function () {
          _outputs = [{
              address: self.recipient.address,
              value: self.recipient.satoshis
            }];
          var remainder = _inputs.inputAmountSatoshis - totalSpendSatoshis;
          // As long as the remainder is greater than dust we send it to our change
          // wallet.  Otherwise, let it go to the miners.
          if (remainder > BG_DEV.TX.MINIMUM_BTC_DUST) {
            _outputs.push({
              address: _changeAddress,
              value: remainder
            });
          }
          return $q.when(self);
        };
        // Returns an unsigned bitcoin trasaction accommodating a set of inputs and outputs.
        // Returns {
        //    transaction:  // the transaction, null on failure
        //    error:        // optional string error that occurred
        // }
        var createTransaction = function () {
          try {
            // The Bitcoin.Transaction library uses exceptions for errors.
            var transaction = new Bitcoin.Transaction();
            _inputs.inputs.forEach(function (unspent) {
              var input = new Bitcoin.TransactionIn({
                  outpoint: {
                    hash: unspent.tx_hash,
                    index: unspent.tx_output_n
                  },
                  script: new Bitcoin.Script(unspent.script),
                  sequence: 4294967295
                });
              transaction.addInput(input);
            });
            _outputs.forEach(function (output) {
              var address = new Bitcoin.Address(output.address);
              var value = output.value;
              transaction.addOutput(address, value);
            });
            return { transaction: transaction };
          } catch (e) {
            return {
              error: 'Error while creating transaction: ' + e,
              transaction: null
            };
          }
        };
        // Open the transaction with the computed inputs and outputs.
        var openTransaction = function () {
          var txResult = createTransaction();
          if (txResult.error) {
            return deferred.reject(txResult.error);
          }
          _transaction = txResult.transaction;
          return deferred.resolve(self);
        };
        getUnspents().then(collectInputs).then(getChangeAddress).then(collectOutputs).then(openTransaction).catch(function (error) {
          deferred.reject(error);
        });
        return deferred.promise;
      };
      // Sign a transaction from either P2SH or PubKey wallets.
      // Returns a promise.
      var _signTransaction = function () {
        var wallet = self.sender.wallet.data;
        if (wallet.type === 'safe') {
          var key = new Bitcoin.ECKey(_credentials.key);
          for (var index = 0; index < _transaction.ins.length; ++index) {
            var redeemScript = new Bitcoin.Script(_unspents[index].redeemScript);
            if (!_transaction.signMultiSigWithKey(index, key, redeemScript)) {
              return $q.reject('Failed to sign input #' + index);
            }
            _transaction.verifyInputSignatures(index, redeemScript);
          }
        } else if (wallet.type === 'safehd') {
          var rootExtKey = UtilityService.BitcoinJSLibAugment.BIP32.createFromXprv(_credentials.key);
          for (var index2 = 0; index2 < _transaction.ins.length; ++index2) {
            var path = _credentials.path + _unspents[index2].chainPath;
            var extKey = rootExtKey.derive(path);
            var redeemScript2 = new Bitcoin.Script(_unspents[index2].redeemScript);
            if (!_transaction.signMultiSigWithKey(index2, extKey.eckey, redeemScript2)) {
              return $q.reject('Failed to sign input #' + index2);
            }
            _transaction.verifyInputSignatures(index2, redeemScript2);
          }
        } else if (wallet.type === 'external') {
          var eckey = new Bitcoin.ECKey(_credentials.key);
          _transaction.signWithKey(eckey);
        } else {
          return $q.reject('Unknown account type');
        }
        return $q.when(self);
      };
      // Serializes a signed transaction and posts it for sending.
      // Returns a promise.
      var _sendTransaction = function (transaction) {
        var hexTransaction = self.tx();
        // add the id of the transaction being sent to the object being returned
        var txId = Bitcoin.Util.bytesToHex(_transaction.getHashBytes().reverse());
        console.log('Sending Transaction: ' + txId);
        console.log(hexTransaction);
        return post({
          message: _message,
          tx: hexTransaction
        }).then(function (result) {
          if (result.error) {
            self.pendingApproval = result;  // self.pendingApproval won't exist unless the TX violates a limit
          }
          self.transactionId = result.transactionHash;
          return result;
        });
      };
      // After sending, notifies email recipients of their bitcoin custodial account.
      // Returns a promise.
      var _notifyDelivery = function () {
        // If this is not a custodial account, we have no work to do.
        if (!self.recipient.custodialAccount) {
          return $q.when(self);
        }
        throw new Error('email based delivery removed');
      };
      //
      // Public Methods
      //
      // Sign a transaction, if you already have the key.
      // Returns a promise.
      this.signWithKey = function (key, path) {
        _credentials = {
          key: key,
          path: path ? path : 'm'
        };
        return _getReceiverWallet().then(_prepareTransaction).then(_signTransaction);
      };
      // Fetch a user's key from storage, decrypt it, and then create and sign a transaction.
      // Returns a promise.
      this.signTransaction = function (passcode, otp) {
        self.sender.passcode = passcode;
        self.sender.otp = otp || '';
        return _getCredentials().then(_getReceiverWallet).then(_prepareTransaction).then(_signTransaction);
      };
      // Send a Transaction.
      // Returns a promise.
      this.sendTransaction = function (passcode, otp) {
        return _sendTransaction().then(_notifyDelivery);
      };
      // Sign and Send a Transaction.
      // Returns a promise.
      this.signAndSendTransaction = function (passcode, otp) {
        return self.signTransaction(passcode, otp).then(self.sendTransaction);
      };
    };
    /**
    * Given an existing transaction, clone the outputs with current
    * unspents and return a TransactionBuilder for a new transaction.
    * Note:  this is only intended to work with a bitgo style transaction -
    * where the first output is the value being sent.
    *
    * @param {obj} sender - tx sender information
    * @param {obj} tx - deserialized bitcoin transaction object
    * @returns {obj} new instance of TransactionBuilder object
    * @public
    * @example
    *   sender = {
    *     wallet: Wallet // a wallet object
    *   };
    *   var tb = new TransactionAPI.clone(sender, tx);
    *   tb.signAndSendTransaction(passcode, otp);
    */
    function clone(sender, tx) {
      var oldOutput = tx.outs[0];
      var outputAddresses = [];
      oldOutput.script.extractAddresses(outputAddresses);
      var recipient = {
          type: 'bitcoin',
          address: outputAddresses[0].toString(),
          satoshis: oldOutput.value
        };
      var feeSatoshis = 0.0001 * 100000000;
      // Probably shouldn't hard code this.
      return new TransactionBuilder(sender, recipient, feeSatoshis);
    }
    // In-client API
    return {
      TransactionBuilder: TransactionBuilder,
      getTxHistory: getTxHistory,
      updateComment: updateComment,
      clone: clone,
      list: list
    };
  }
]);angular.module('BitGo.API.UserAPI', ['ngResource']).factory('UserAPI', [
  '$location',
  '$q',
  '$resource',
  '$rootScope',
  'UserModel',
  'UtilityService',
  'CacheService',
  'AnalyticsProxy',
  'BG_DEV',
  function ($location, $q, $resource, $rootScope, UserModel, UtilityService, CacheService, AnalyticsProxy, BG_DEV) {
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // Cache setup
    var tokenCache = new CacheService.Cache('sessionStorage', 'Tokens');
    // flag which is set for every user when they login. It tracks whether an email has been sent out for verification
    // incase the user has an unverified email
    var emailVerificationCache = new CacheService.Cache('sessionStorage', 'emailVerification');
    var userCache = new CacheService.Cache('localStorage', 'Users', 60 * 60 * 1000);
    var currentUser;
    function setPlaceholderUser() {
      currentUser = $rootScope.currentUser = new UserModel.PlaceholderUser();
    }
    function assertAuth(data) {
      console.assert(_.has(data, 'token_type'), 'missing token_type');
      console.assert(_.has(data, 'access_token'), 'missing access_token');
      console.assert(_.has(data, 'expires_in'), 'missing expires_in');
    }
    /**
      * asserts if received data has necessary properties required for fetching other users
      * @param {object} The data received from the server when fetching another user
      */
    function assertGeneralBitgoUserProperties(data) {
      console.assert(_.has(data, 'user'), 'missing user');
      console.assert(_.has(data.user, 'id'), 'missing user.id');
      console.assert(_.has(data.user, 'name'), 'missing user.name');
      console.assert(_.has(data.user.name, 'full'), 'missing user.name.full');
      console.assert(_.has(data.user, 'email'), 'missing user.email');
      console.assert(_.has(data.user.email, 'email'), 'missing user.email.email');
    }
    /**
      * asserts if received data has necessary properties required for the main user
      * @param {object} The data received from the server for the main user
      */
    function assertCurrentUserProperties(data) {
      console.assert(_.has(data, 'user'), 'missing user');
      console.assert(_.has(data.user, 'id'), 'missing user.id');
      console.assert(_.has(data.user, 'username'), 'missing user.username');
      console.assert(_.has(data.user, 'name'), 'missing user.name');
      console.assert(_.has(data.user, 'email'), 'missing user.email');
      console.assert(_.has(data.user.email, 'email'), 'missing user.email.email');
      console.assert(_.has(data.user.email, 'verified'), 'missing user.email.verified');
      console.assert(_.has(data.user, 'phone'), 'missing user.phone');
      console.assert(_.has(data.user.phone, 'phone'), 'missing user.phone.phone');
      console.assert(_.has(data.user.phone, 'verified'), 'missing user.phone.verified');
      console.assert(_.has(data.user, 'isActive'), 'missing user.isActive');
    }
    function setAuthToken(token) {
      tokenCache.add('token', token);
    }
    // sets the 'canSend' email flag for a user, intitally on login
    function setEmailVerificationToken(data) {
      emailVerificationCache.add('canSend', data);
    }
    function clearAuthToken() {
      tokenCache.remove('token');
    }
    function clearEmailVerificationToken() {
      emailVerificationCache.remove('canSend');
    }
    function setCurrentUser(user) {
      if (user) {
        // Set up the app's user
        currentUser = $rootScope.currentUser = new UserModel.User(true, user);
        Raven.setUser({ id: currentUser.settings.id });
        // Emit signal to set initial app state for the user
        $rootScope.$emit('UserAPI.CurrentUserSet');
      } else {
        // Remove the app's user
        setPlaceholderUser();
        $rootScope.$emit('UserAPI.PlaceholderUserSet');
      }
    }
    /**
    * Remove any current user data
    * @private
    */
    function clearCurrentUser() {
      clearAuthToken();
      clearEmailVerificationToken();
      Raven.setUser();
      setCurrentUser();
    }
    // Initialize the factory
    function init() {
      setPlaceholderUser();
    }
    init();
    // In-client API
    return {
      init: function () {
        var self = this;
        var deferred = $q.defer();
        // If we have a token stored, then we should be able to use the API
        // already.  Attempt to get the current user.
        if (tokenCache.get('token')) {
          return self.me().then(function (user) {
            return currentUser;
          });
        } else {
          deferred.reject('no token');
        }
        return deferred.promise;
      },
      me: function () {
        var resource = $resource(kApiServer + '/user/me', {});
        return resource.get({}).$promise.then(function (data) {
          assertCurrentUserProperties(data);
          setCurrentUser(data.user);
          return currentUser;
        }, PromiseErrorHelper());
      },
      get: function (userId, useCache) {
        if (!userId) {
          throw new Error('Need userId when getting a user\'s info');
        }
        // If using cache, check it first
        if (useCache) {
          var cacheUser = userCache.get(userId);
          if (cacheUser) {
            return $q.when(cacheUser);
          }
        }
        // Otherwise perform the fetch and add the user to the cache
        var resource = $resource(kApiServer + '/user/' + userId, {});
        return resource.get({}).$promise.then(function (data) {
          assertGeneralBitgoUserProperties(data);
          var decoratedUser = new UserModel.User(false, data.user);
          userCache.add(userId, decoratedUser);
          return decoratedUser;
        }, PromiseErrorHelper());
      },
      login: function (params) {
        // Wipe an existing user's token if a new user signs
        // in without logging out of the current user's account
        if (currentUser.loggedIn) {
          // logout user so that it clears up wallets and enterprises on scope
          $rootScope.$emit('UserAPI.UserLogoutEvent');
          clearCurrentUser();
        }
        // Flag for the new client - need email to be verified first
        params.isNewClient = true;
        var resource = $resource(kApiServer + '/user/login');
        return new resource(params).$save({}).then(function (data) {
          assertAuth(data);
          assertCurrentUserProperties(data);
          setAuthToken(data.access_token);
          // By default 'canSendEmail' is set to true
          setEmailVerificationToken(true);
          setCurrentUser(data.user);
          // Mixpanel Tracking
          var trackingData = { userID: data.user.id };
          AnalyticsProxy.loginUser(trackingData.userID);
          // Note: this data is sent w/ all future track calls while this person uses BitGo
          AnalyticsProxy.sendWithAllTrackingEvents(trackingData);
          // Track the successful login
          AnalyticsProxy.track('Login');
          return currentUser;
        }, PromiseErrorHelper());
      },
      signup: function (params) {
        // Wipe an existing user's token if a new user signs
        // up without logging out of the current user's account
        if (currentUser.loggedIn) {
          clearCurrentUser();
        }
        var resource = $resource(kApiServer + '/user/signup');
        return new resource(params).$save({}).then(function (data) {
          // Mixpanel Tracking
          AnalyticsProxy.registerUser(data.user.userID);
          // Track the successful signup
          AnalyticsProxy.track('Signup');
          return data.user;
        }, PromiseErrorHelper());
      },
      getUserEncryptedData: function () {
        var Resource = $resource(kApiServer + '/user/encrypted', {}, { post: { method: 'POST' } });
        var getEncrypted = new Resource();
        return getEncrypted.$post().then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      resetPassword: function (params) {
        if (!params || !params.password || !params.email) {
          throw new Error('Invalid params');
        }
        var Resource = $resource(kApiServer + '/user/resetpassword', {}, { post: { method: 'POST' } });
        var reset = new Resource(params);
        return reset.$post().then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      verifyPassword: function (params) {
        if (!params.password) {
          throw new Error('Expect a password to verify');
        }
        var resource = $resource(kApiServer + '/user/verifypassword', {}, { post: { method: 'POST' } });
        return new resource(params).$post().then(function (data) {
          if (!data.valid) {
            // If invalid, return a needs passcode error
            var error = new UtilityService.ErrorHelper({
                status: 401,
                data: { needsPasscode: true },
                message: 'invalidPassword'
              });
            return $q.reject(error);
          }
          return data.valid;
        }, PromiseErrorHelper());
      },
      changePassword: function (params) {
        if (!params.password) {
          throw new Error('Expect a new password');
        }
        if (!params.oldPassword) {
          throw new Error('Expect the current password');
        }
        if (!params.version) {
          throw new Error('Expect current version');
        }
        if (!params.keychains) {
          throw new Error('Expect keychains');
        }
        var resource = $resource(kApiServer + '/user/changepassword', {}, { post: { method: 'POST' } });
        return new resource(params).$post().then(function (data) {
          return data;
        }, PromiseErrorHelper());
      },
      logout: function () {
        $rootScope.$emit('UserAPI.UserLogoutEvent');
        var resource = $resource(kApiServer + '/user/logout', {});
        // Regardless of success or fail, we want to clear user data
        return resource.get({}).$promise.then(function (result) {
          // Track the successful logout
          AnalyticsProxy.track('Logout');
          AnalyticsProxy.shutdown();
          clearCurrentUser();
          return result;
        }, function (error) {
          // Track the failed logout
          var metricsData = {
              status: error.status,
              message: error.error,
              action: 'Logout'
            };
          AnalyticsProxy.track('Error', metricsData);
          AnalyticsProxy.shutdown();
          clearCurrentUser();
          $location.path('/login');
          return error;
        });
      },
      endSession: function () {
        // emit a message so that all wallets/walletshares can be cleared out
        $rootScope.$emit('UserAPI.UserLogoutEvent');
        // Track the successful logout
        AnalyticsProxy.track('Logout');
        AnalyticsProxy.shutdown();
        clearCurrentUser();
        $location.path('/login');
      },
      unlock: function (params) {
        var resource = $resource(kApiServer + '/user/unlock', {}, { post: { method: 'POST' } });
        var unlockRequest = new resource(params);
        return unlockRequest.$post({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      search: function (email) {
        // Searches for email-verified users by email
        var resource = $resource(kApiServer + '/user/search/', { email: email });
        return resource.get({}).$promise.then(function (data) {
          assertGeneralBitgoUserProperties(data.results[0]);
          return data.results[0];
        }, PromiseErrorHelper());
      },
      create: function (params) {
        var Resource = $resource(kApiServer + '/user/create', {}, { post: { method: 'POST' } });
        var createRequest = new Resource(params);
        return createRequest.$post({}).then(function (data) {
          assertAuth(data);
          assertCurrentUserProperties(data);
          return data.user;
        }, PromiseErrorHelper());
      },
      invite: function (params) {
        var inviteRequest;
        if (params.type == 'local') {
          var LocalResource = $resource(kApiServer + '/user/invite', {}, { post: { method: 'POST' } });
          inviteRequest = new LocalResource(params);
        }
        return inviteRequest.$post({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      sendOTP: function (params, onSuccess, onError) {
        var resource = $resource(kApiServer + '/user/sendotp', {}, { post: { method: 'POST' } });
        return new resource(params).$post({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      verify: function (parameters) {
        var VALID_TYPES = [
            'phone',
            'email',
            'forgotpassword'
          ];
        var type;
        if (parameters) {
          type = parameters.type;
        }
        var verifyUrl = '';
        if (!type || type && _.indexOf(VALID_TYPES, type) === -1) {
          throw new Error('Verify expects a valid verification type');
        }
        switch (parameters.type) {
        case 'phone':
          verifyUrl = '/user/verifyphone';
          break;
        case 'email':
          verifyUrl = '/user/verifyemail';
          break;
        case 'forgotpassword':
          verifyUrl = '/user/verifyforgotpassword';
          break;
        }
        var resource = $resource(kApiServer + verifyUrl, parameters);
        return resource.get({}).$promise.then(function (data) {
          assertCurrentUserProperties(data);
          return data.user;
        }, PromiseErrorHelper());
      },
      request: function (params) {
        // Flag for the new client - need email link to be to new client
        // TODO: remove once migrated
        params.isNewClient = true;
        var resource = $resource(kApiServer + '/user/requestverification');
        return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      forgotpassword: function (params) {
        var resource = $resource(kApiServer + '/user/forgotpassword');
        return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      },
      sharingkey: function (params) {
        if (!params.email) {
          throw new Error('Expect email of person to share');
        }
        var resource = $resource(kApiServer + '/user/sharingkey');
        return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
      }
    };
  }
]);/**
 * @ngdoc service
 * @name WalletSharesAPI
 * @description
 * This module is for managing all http requests for all Wallet Share objects in the app
 * Also manages which wallet shares to show based on the current enterprise
 */
angular.module('BitGo.API.WalletSharesAPI', []).factory('WalletSharesAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'WalletModel',
  'NotifyService',
  'UtilityService',
  'CacheService',
  'LabelsAPI',
  'UserAPI',
  function ($q, $location, $resource, $rootScope, WalletModel, Notify, UtilityService, CacheService, LabelsAPI, UserAPI) {
    // $http fetch helpers
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // local copy of all wallet shares that exist for a given user
    var allWalletShares;
    /**
      * @description
      * initializes empty wallet shares objects for the app. It also initialises wallet shares on the rootscope
      * @private
      */
    function initEmptyWallets() {
      $rootScope.walletShares = {
        all: {
          incoming: {},
          outgoing: {}
        }
      };
      allWalletShares = {
        incoming: {},
        outgoing: {}
      };
    }
    /**
     * @description
     * Helper function which sets filtered wallet shares on the rootscope based on enterprise (handles only 'personal')
     * @param {object} The local walletShares object which contains a list of all walletShares across enterprises
     * @returns - none
     * @private
     */
    function getPersonalEnterpriseWalletShares(allWalletShares) {
      $rootScope.walletShares.all.incoming = _.pick(allWalletShares.incoming, function (walletShare, key) {
        return !walletShare.enterprise;
      });
      $rootScope.walletShares.all.outgoing = _.pick(allWalletShares.outgoing, function (walletShare, key) {
        return !walletShare.enterprise;
      });
    }
    /**
     * @description
     * Helper function which sets filtered wallet shares on the rootscope based on current enterprise (handles non 'personal' enterprises)
     * @param {object} The local walletShares object which contains a list of all walletShares across enterprises
     * @returns - none
     * @private
     */
    function getNormalEnterpriseWalletShares(allWalletShares, currentEnterprise) {
      $rootScope.walletShares.all.incoming = _.pick(allWalletShares.incoming, function (wallet, key) {
        return wallet.enterprise && currentEnterprise && wallet.enterprise === currentEnterprise.id;
      });
      $rootScope.walletShares.all.outgoing = _.pick(allWalletShares.outgoing, function (wallet, key) {
        return wallet.enterprise && currentEnterprise && wallet.enterprise === currentEnterprise.id;
      });
    }
    /**
     * @description
     * Helper function which sets filtered wallet shares on the rootscope based on current enterprise
     * @param - none
     * @returns - Appropriate filtering function based on the current enterprise (personal or non-personal)
     * @private
     */
    function getCurrentEnterpriseWalletShares() {
      if (!$rootScope.enterprises.current) {
        console.log('Cannot filter wallet shares without a current enterprise');
        return false;
      }
      var currentEnterprise = $rootScope.enterprises.current;
      if (currentEnterprise && currentEnterprise.isPersonal) {
        return getPersonalEnterpriseWalletShares(allWalletShares);
      } else {
        return getNormalEnterpriseWalletShares(allWalletShares, currentEnterprise);
      }
    }
    /**
     * @description
     * Filters the wallet shares and emits an event when the filtered wallete shares are set
     * @private
     */
    function setFilteredWalletShares() {
      // Set the correct wallet shares on rootScope based on the current enterprise
      getCurrentEnterpriseWalletShares();
      $rootScope.$emit('WalletSharesAPI.FilteredWalletSharesSet', { walletShares: $rootScope.walletShares });
      $rootScope.$emit('WalletSharesAPI.AllUserWalletSharesSet', { walletShares: allWalletShares });
    }
    // Set the correct wallet shares scoped by the current enterprise
    // once we have a current enterprise set in the app
    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function (evt, data) {
      setFilteredWalletShares();
    });
    // Fetch all wallet shares when the user signs in
    $rootScope.$on('UserAPI.CurrentUserSet', function (evt, user) {
      getAllSharedWallets();
    });
    /**
     * @description
     * Fetches all wallet shares for the main user. Calls appropriate function to filter the wallet shares and set on rootscope as well
     * @params - none
     * @returns {Promise} which handles getting email ids of the user object in the data returned from server
     * @public
     */
    function getAllSharedWallets() {
      var resource = $resource(kApiServer + '/walletshare', {});
      return resource.get({}).$promise.then(function (data) {
        // Reset the local and rootscope wallet share list
        initEmptyWallets();
        // set incoming wallet shares on allWalletShares list
        data.incoming.forEach(function (incomingWalletShare) {
          allWalletShares.incoming[incomingWalletShare.id] = incomingWalletShare;
        });
        // set outgoing wallet shares on allWalletShares list
        data.outgoing.forEach(function (outgoingWalletShare) {
          allWalletShares.outgoing[outgoingWalletShare.id] = outgoingWalletShare;
        });
        setFilteredWalletShares();
      }, PromiseErrorHelper());
    }
    /**
     * @description
     * Fetches details about a wallet share. Needed for accepting admin or spend wallet shares
     * @params {object} - requires a share id. (The id of the wallet share)
     * @returns {promise} - with data regarding the wallet share from the server
     * @public
     */
    function getSharedWallet(params) {
      if (!params.shareId) {
        throw new Error('Invalid data when getting a wallet share');
      }
      var resource = $resource(kApiServer + '/walletshare/' + params.shareId);
      return resource.get({}).$promise.then(function (wallet) {
        return wallet;
      });
    }
    /**
     * create a wallet share with another user
     * @param {String} Wallet id for the wallet to be shared
     * @param {object} params containing details of both users and keychain info for shared wallet
     * @returns {object} promise with data for the shared wallet
     */
    function createShare(walletId, params) {
      if (!walletId || !params) {
        throw new Error('Invalid data when creating a wallet share');
      }
      var resource = $resource(kApiServer + '/wallet/' + walletId + '/share', {});
      return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * Request a reshare of a wallet from admins on the wallet (just an email + setting a bit for now)
     *
     * @param   {String} walletId   wallet id
     * @param   {Object} params    params (none)
     * @returns {Promise}
     */
    function requestReshare(walletId, params) {
      if (!walletId || !params) {
        throw new Error('Invalid data when requesting a reshare');
      }
      var resource = $resource(kApiServer + '/wallet/' + walletId + '/requestreshare', {});
      return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * update a wallet share (either reject or save)
     * @param {object} params with data containing id and state(rejected or accepted)
     * @returns {object} promise with data from the updated share
     */
    function updateShare(params) {
      if (!params) {
        throw new Error('Invalid data when updating share');
      }
      var resource = $resource(kApiServer + '/walletshare/' + params.shareId, {});
      return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * update a wallet share (either reject or save)
     * @param {object} params with data containing id and state(rejected or accepted)
     * @returns {object} promise with data from the updated share
     */
    function cancelShare(params) {
      if (!params) {
        throw new Error('Invalid data when cancelling wallet share');
      }
      var resource = $resource(kApiServer + '/walletshare/' + params.shareId, {});
      return new resource(params).$remove({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * resend a wallet share email - for when you have already tried to share a
     * wallet with someone (which should have sent them an email), and you want
     * to send the email again
     *
     * @param {object} params with data containing id
     * @returns {object} promise with object saying whether the share was resent
     */
    function resendEmail(params) {
      if (!params) {
        throw new Error('Invalid data when resending wallet share');
      }
      var resource = $resource(kApiServer + '/walletshare/' + params.shareId + '/resendemail', {});
      return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    function init() {
      initEmptyWallets();
    }
    init();
    // In-client API
    return {
      getSharedWallet: getSharedWallet,
      getAllSharedWallets: getAllSharedWallets,
      createShare: createShare,
      updateShare: updateShare,
      cancelShare: cancelShare,
      resendEmail: resendEmail,
      requestReshare: requestReshare
    };
  }
]);angular.module('BitGo.API.WalletsAPI', []).factory('WalletsAPI', [
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'WalletModel',
  'NotifyService',
  'UtilityService',
  'CacheService',
  'LabelsAPI',
  function ($q, $location, $resource, $rootScope, WalletModel, Notify, UtilityService, CacheService, LabelsAPI) {
    // $http fetch helpers
    var kApiServer = UtilityService.API.apiServer;
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // local copy of all wallets that exist for a given user
    var allWallets;
    // Cache setup
    var walletCache = CacheService.getCache('Wallets') || new CacheService.Cache('localStorage', 'Wallets', 120 * 60 * 1000);
    /**
      * initializes empty wallet objects for the app / service
      * @private
      */
    function initEmptyWallets() {
      $rootScope.wallets = {
        all: {},
        current: null
      };
      allWallets = {};
    }
    /**
      * Clears all user wallets from the wallet cache
      * @private
      */
    function clearWalletCache() {
      _.forIn(allWallets, function (wallet) {
        walletCache.remove(wallet.data.id);
        console.assert(_.isUndefined(walletCache.get(wallet.data.id)), wallet.data.id + ' was not removed from walletCache');
      });
      initEmptyWallets();
    }
    /**
      * Sets the new current wallet object on rootScope
      * @param wallet {Object} BitGo wallet object
      * @param swapCurrentWallet {Bool} swap the current currentWallet for the new one
      * @private
      */
    function setCurrentWallet(wallet, swapCurrentWallet) {
      if (!wallet) {
        throw new Error('Expect a wallet when setting the current wallet');
      }
      if (_.isEmpty($rootScope.wallets.all)) {
        throw new Error('Missing $rootScope.wallets.all');
      }
      var newCurrentWallet = $rootScope.wallets.all[wallet.data.id];
      if (!newCurrentWallet) {
        throw new Error('Wallet ' + wallet.data.id + ' not found when setting the current wallet');
      }
      // If we're swapping out the current wallet on rootScope
      if (swapCurrentWallet) {
        $rootScope.wallets.all[wallet.data.id] = wallet;
        newCurrentWallet = wallet;
      }
      // Set the  new current wallet
      $rootScope.wallets.current = newCurrentWallet;
      // Broadcast the new event and go to the wallet's transaction list page
      if ($rootScope.wallets.current.data.id !== UtilityService.Url.getWalletIdFromUrl()) {
        // wallet transactions path
        var path = '/enterprise/' + $rootScope.enterprises.current.id + '/wallets/' + $rootScope.wallets.current.data.id;
        $location.path(path);
        $rootScope.$emit('WalletsAPI.CurrentWalletSet', { wallets: $rootScope.wallets });
      }
    }
    // Wallet Filtering Helpers (filter wallets based on enterprise)
    // Sets |$rootScope.wallets.all| based if the current enterprise selected is personal
    function getPersonalEnterpriseWallets(allWallets) {
      return _.pick(allWallets, function (wallet, key) {
        return !wallet.data.enterprise;
      });
    }
    // Sets |$rootScope.wallets.all| based on the current enterprise selected.
    function getNormalEnterpriseWallets(allWallets, currentEnterprise) {
      return _.pick(allWallets, function (wallet, key) {
        return wallet.data.enterprise && currentEnterprise && wallet.data.enterprise === currentEnterprise.id;
      });
    }
    // Sets |$rootScope.wallets.all| and returns wallets based on the current enterprise selected.
    function getCurrentEnterpriseWallets() {
      if (!$rootScope.enterprises.current) {
        console.log('Cannot filter wallets without a current enterprise');
        return false;
      }
      var currentEnterprise = $rootScope.enterprises.current;
      if (currentEnterprise && currentEnterprise.isPersonal) {
        $rootScope.wallets.all = getPersonalEnterpriseWallets(allWallets);
      } else {
        $rootScope.wallets.all = getNormalEnterpriseWallets(allWallets, currentEnterprise);
      }
    }
    function setAllEnterpriseApprovals() {
      if (!$rootScope.enterprises.all) {
        console.log('Cannot set approvals on enterprises without a enterprises');
        return false;
      }
      _.forIn($rootScope.enterprises.all, function (enterprise) {
        if (enterprise && enterprise.isPersonal) {
          enterprise.setApprovals(getPersonalEnterpriseWallets(allWallets));
        } else {
          enterprise.setApprovals(getNormalEnterpriseWallets(allWallets, enterprise));
        }
      });
    }
    // Event Handlers
    function setFilteredWallets() {
      // Set the correct wallets on rootScope based on the current enterprise
      getCurrentEnterpriseWallets();
      // Init the label cache
      LabelsAPI.initCache();
      var urlWalletId = UtilityService.Url.getWalletIdFromUrl();
      var urlCurrentWallet = $rootScope.wallets.all[urlWalletId];
      if (urlWalletId && urlCurrentWallet) {
        setCurrentWallet(urlCurrentWallet);
      }
    }
    // Set the correct wallets scoped by the current enterprise
    // once we have a current enterprise set in the app
    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function (evt, data) {
      setFilteredWallets();
    });
    // Fetch all wallets when the user signs in
    $rootScope.$on('UserAPI.CurrentUserSet', function (evt, user) {
      getAllWallets();
    });
    // Clear the wallet cache on user logoout
    $rootScope.$on('UserAPI.UserLogoutEvent', function () {
      clearWalletCache();
    });
    // Fetch the details for a single wallet based on params criteria
    function getWallet(params, cacheOnly) {
      var query = {};
      if (!params) {
        throw new Error('Missing params for getting a wallet');
      }
      if (cacheOnly) {
        var result = walletCache.get(params.bitcoinAddress);
        return $q.when(result);
      }
      if (params.gpk) {
        query.gpk = 1;
      }
      var resource = $resource(kApiServer + '/wallet/' + params.bitcoinAddress);
      return resource.get(query).$promise.then(function (wallet) {
        wallet = new WalletModel.Wallet(wallet);
        // update the cache and rootScope wallets object
        walletCache.add(params.bitcoinAddress, wallet);
        allWallets[wallet.data.id] = wallet;
        return wallet;
      });
    }
    function emitWalletSetMessage() {
      $rootScope.$emit('WalletsAPI.UserWalletsSet', {
        enterpriseWallets: $rootScope.wallets,
        allWallets: allWallets,
        enterprises: $rootScope.enterprises
      });
    }
    // Fetch all wallets for a user
    function getAllWallets() {
      var resource = $resource(kApiServer + '/wallet?limit=500', {});
      return resource.get({}).$promise.then(function (data) {
        var pendingFetches = data.wallets.length;
        function onFetchFinished() {
          setFilteredWallets();
          // set pending approvals of all the wallets on enterprises on rootscope
          setAllEnterpriseApprovals();
          // All user wallets are set along with approvals
          emitWalletSetMessage();
          return allWallets;
        }
        function onFetchSuccess(wallet) {
          // we only support safe and safehd wallets currently
          if (wallet.data.type === 'safehd' || wallet.data.type === 'safe') {
            allWallets[wallet.data.id] = wallet;
          }
          if (--pendingFetches === 0) {
            onFetchFinished();
          }
        }
        function onFetchFail(error) {
          // TODO (Gavin): expose errors here?
          if (--pendingFetches === 0) {
            onFetchFinished();
          }
        }
        var numWallets = data.wallets.length;
        if (numWallets > 0) {
          // Fetch each single wallet
          // Note: use native 'for in' loop b/c we need to use 'continue'
          for (var idx = 0; idx < numWallets; idx++) {
            var curWallet = data.wallets[idx];
            // Omit custodial accounts
            if (curWallet.custodialAccount) {
              pendingFetches--;
              continue;
            }
            var fetchData = {
                type: curWallet.type,
                bitcoinAddress: curWallet.id
              };
            getWallet(fetchData, false).then(onFetchSuccess).catch(onFetchFail);
          }
        } else {
          // User wallets are now set along with approvals. Even though they are empty
          emitWalletSetMessage();
        }
      }, PromiseErrorHelper());
    }
    // Create a new BitGo safeHD wallet
    function createSafeHD(params) {
      /**
      * Converts the id provided into an id expected by the server
      * @param id {String} id to modify
      * @private
      */
      function safeId(id) {
        if (!id || typeof id !== 'string') {
          throw new Error('Missing id');
        }
        return id === 'personal' ? '' : id;
      }
      if (!params.xpubs || !params.label) {
        throw new Error('Invalid data when generating safeHD wallet');
      }
      // pull the xpubs out of the params
      var keychains = params.xpubs.map(function (xpub) {
          return { xpub: xpub };
        });
      var walletData = {
          label: params.label,
          m: 2,
          n: 3,
          keychains: keychains,
          enterprise: safeId($rootScope.enterprises.current.id)
        };
      var resource = $resource(kApiServer + '/wallet', {});
      return new resource(walletData).$save({}).then(function (wallet) {
        var decoratedWallet = new WalletModel.Wallet(wallet);
        walletCache.add(decoratedWallet.data.id, decoratedWallet);
        return decoratedWallet;
      }, PromiseErrorHelper());
    }
    /**
      * Create a new chain address for the wallet
      * @param bitcoinAddress {String}
      * @param chain {Int} is this an internal or external chain
      * @param allowExisting {Bool} if true, allow re-use of existing, unused addresses
      * @returns {Promise}
      */
    function createChainAddress(bitcoinAddress, chain, allowExisting) {
      if (!bitcoinAddress || !chain.toString() || !allowExisting.toString()) {
        throw new Error('invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/' + bitcoinAddress + '/address/' + chain, {});
      return new resource({ allowExisting: allowExisting }).$save().then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
      * @description Revoke Access to a wallet for a particular user
      * @param {String} The bitcoin address of the wallet you want revoked
      * @param {String} The userId of the person to be revoked
      * @returns {promise} with success/error messages
    */
    function revokeAccess(bitcoinAddress, userId) {
      if (!bitcoinAddress || !userId) {
        throw new Error('Invalid params');
      }
      var params = { user: userId };
      var resource = $resource(kApiServer + '/wallet/' + bitcoinAddress + '/policy/revoke', {});
      return new resource(params).$save().then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
      * Create a new receive address for a wallet
      * @param bitcoinAddress {String}
      * @param allowExisting {Bool}
      * @returns {Promise}
      */
    function createReceiveAddress(bitcoinAddress, allowExisting) {
      if (!bitcoinAddress || !allowExisting.toString()) {
        throw new Error('invalid params');
      }
      return createChainAddress(bitcoinAddress, 0, allowExisting);
    }
    /**
      * Create a new change address for a wallet
      * @param bitcoinAddress {String}
      * @returns {Promise}
      */
    function createChangeAddress(bitcoinAddress) {
      if (!bitcoinAddress) {
        throw new Error('invalid params');
      }
      return createChainAddress(bitcoinAddress, 1, false);
    }
    /**
      * List all addresses for a wallet
      * @param {object} params for the address list query
      * @returns {object} promise with data for address list fetch
      */
    function getAllAddresses(params) {
      if (!params.bitcoinAddress || !params.limit || !params.chain.toString()) {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/' + params.bitcoinAddress + '/addresses', {
          limit: params.limit,
          skip: params.skip || 0,
          sort: params.sort || 1,
          chain: params.chain || 0,
          details: params.details || false
        });
      return resource.get({}).$promise.then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * Returns info needed to recover a specific wallet
     * @param {String} params for the wallet data recovery fetch
     * @returns {Promise} with wallet recovery info
     * @public
     */
    function getWalletPasscodeRecoveryInfo(params) {
      if (!params.walletAddress) {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/' + params.walletAddress + '/passcoderecovery', {});
      return new resource(params).$save({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * Deletes a wallet
     * @param {object} params for the wallet containing bicoin Address information
     * @returns {Promise} with success/error
     * @public
     */
    function removeWallet(wallet) {
      if (!wallet) {
        throw new Error('Invalid params');
      }
      var params = { walletAddress: wallet.data.id };
      var resource = $resource(kApiServer + '/wallet/' + wallet.data.id, {});
      return new resource(params).$remove({}).then(function (data) {
        // cleans up data before next wallets fetch
        wallet.data.pendingApprovals.forEach(function (pendingApproval) {
          $rootScope.enterprises.current.deleteApproval(pendingApproval.id);
        });
        removeWalletFromScope(wallet);
      }, PromiseErrorHelper());
    }
    /**
     * Deletes a wallet form the client. Removes it from allWallets and rootscope
     * @param {object} wallet which needs to be removed
     * @public
     */
    function removeWalletFromScope(wallet) {
      if (!wallet) {
        throw new Error('Invalid params, cannot remove wallet from scope');
      }
      delete allWallets[wallet.data.id];
      delete $rootScope.wallets.all[wallet.data.id];
    }
    /**
     * Updates the name of a wallet
     * @param {Object} params for the wallet name change. Contains wallet Address and new label
     * @returns {Promise} with success/error
     * @public
     */
    function renameWallet(params) {
      if (!params.walletAddress || !params.label) {
        throw new Error('Invalid params');
      }
      var resource = $resource(kApiServer + '/wallet/' + params.walletAddress, {}, { update: { method: 'PUT' } });
      return new resource(params).$update({}).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * Returns all wallets from the cache for recovery
     * @returns {Promise} with all cached wallets
     * @public
     */
    function getWalletsForRecovery() {
      return $q.when(allWallets);
    }
    function init() {
      initEmptyWallets();
    }
    init();
    // In-client API
    return {
      createSafeHD: createSafeHD,
      createChainAddress: createChainAddress,
      createChangeAddress: createChangeAddress,
      createReceiveAddress: createReceiveAddress,
      getWallet: getWallet,
      getAllWallets: getAllWallets,
      getAllAddresses: getAllAddresses,
      setCurrentWallet: setCurrentWallet,
      getWalletPasscodeRecoveryInfo: getWalletPasscodeRecoveryInfo,
      getWalletsForRecovery: getWalletsForRecovery,
      removeWallet: removeWallet,
      removeWalletFromScope: removeWalletFromScope,
      renameWallet: renameWallet,
      revokeAccess: revokeAccess
    };
  }
]);/**
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
angular.module('BitGo.App.InternalStateService', []).factory('InternalStateService', [
  '$rootScope',
  '$location',
  '$timeout',
  function ($rootScope, $location, $timeout) {
    // constant to map internal redirects
    var DESTINATION_MAP = {
        'enterprise_settings:users': {
          path: function () {
            return 'enterprise/' + $rootScope.enterprises.current.id + '/settings';
          }
        },
        'personal_settings:password': {
          path: function () {
            return '/settings';
          }
        },
        'personal_settings:users': {
          path: function () {
            return '/personal/settings';
          }
        }
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
      if (!destination || typeof destination !== 'string' || !_.has(DESTINATION_MAP, destination)) {
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
      if (!states || typeof states !== 'object') {
        throw new Error('missing view states');
      }
      if (!stateToInitialize || _.indexOf(states, stateToInitialize) === -1) {
        return;
      }
      // clean out stateToInitialize so we don't reuse it
      // have this happen in the next run loop so we use it
      // before actually unsetting it
      $timeout(function () {
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
]);/*
  About:
  - This manages state for overarching components in the app (e.g. header bar)
*/
angular.module('BitGo.App.AppController', []).controller('AppController', [
  '$scope',
  '$rootScope',
  '$location',
  'UserAPI',
  'EnterpriseAPI',
  'UtilityService',
  '$timeout',
  function ($scope, $rootScope, $location, UserAPI, EnterpriseAPI, Utils, $timeout) {
    // The count for outstanding approvals that were not initiated by the user
    $scope.relevantApprovalCount = {};
    // The count for outstanding approvals and walletshares that were not initiated by the user
    $scope.approvalAndSharesCount = {};
    $scope.toggleDropdown = undefined;
    // Checks if the ng-view is loaded. The footer should display only after its loaded
    $scope.isViewLoaded = undefined;
    /**
     * Sets the latest user on the scope
     * @private
     */
    function updateAppUser() {
      $scope.user = $rootScope.currentUser;
    }
    /**
    * Checks if there are approvals or walletShares in enterprises which are not the current one.
    * @return {Boolean} Value which determines whether the dropdown should be open or not
    */
    var hasApprovalsOrShares = function () {
      var openDropdown = false;
      _.forIn($rootScope.enterprises.all, function (enterprise) {
        if (enterprise.id === $rootScope.enterprises.current.id || _.keys(enterprise.pendingApprovals).length + enterprise.walletShareCount.incoming === 0) {
          return;
        }
        if (enterprise.walletShareCount.incoming > 0) {
          openDropdown = true;
          return false;
        }
        _.forOwn(enterprise.pendingApprovals, function (approval) {
          if (approval.creator !== $rootScope.currentUser.settings.id) {
            openDropdown = true;
            return false;
          }
        });
      });
      return openDropdown;
    };
    // Header State Controls
    $scope.isCurrentEnterpriseSection = function (section) {
      return Utils.Url.getEnterpriseSectionFromUrl() === section;
    };
    /**
     * Logic to turn the top nav dropdown title blue if user is in settings
     * @public
     */
    $scope.isSettingsSection = function () {
      return $location.path().indexOf('settings') > -1;
    };
    /**
     * Logic to show active tile in the top level nav
     * @param id {String} enterprise id
     * @public
     */
    $scope.isCurrentEnterprise = function (id) {
      if (!id) {
        throw new Error('missing enterprise id');
      }
      return $rootScope.enterprises.current.id == id;
    };
    /**
     * Logic to show active tile in the top level nav
     * @param id {String} enterprise id
     * @public
     */
    $scope.isDropdownSection = function (section) {
      if (!section) {
        throw new Error('missing top level nav section');
      }
      // If section passed in is settings, determine if it is selected from the url. (This deals with global settings)
      if (section === 'settings') {
        if (Utils.Url.getEnterpriseIdFromUrl() === '') {
          return true;
        }
        return false;
      }
      // else check the check the enterprise from the url
      return Utils.Url.getEnterpriseIdFromUrl() === section;
    };
    /**
     * Go to the global settings for the app
     * @public
     */
    $scope.goToGlobalSettings = function () {
      $location.path('/settings');
    };
    /**
     * Sign the user out of the app
     * @public
     */
    $scope.logout = function () {
      $location.path('/logout');
    };
    $scope.enterpriseIsPersonal = function () {
      return $rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal;
    };
    /**
     * Sets the current enterprise and navigates to their wallets
     * @param {Object} bitgo client enterprise object
     * @public
     */
    $scope.goToEnterprise = function (enterprise) {
      if (!enterprise) {
        throw new Error('missing enterprise');
      }
      EnterpriseAPI.setCurrentEnterprise(enterprise);
      $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
    };
    /**
     * Sets the current enterprise and navigates to their wallets
     * @param event {Object} the click event
     * @param enterprise {Object} bitgo client enterprise object
     * @public
     */
    $scope.goToEnterpriseSettings = function (event, enterprise) {
      if (!event || !enterprise) {
        throw new Error('missing args');
      }
      // kill the event from propagating out to the 'goToEnterprise'
      // handler on the parent div
      event.stopPropagation();
      EnterpriseAPI.setCurrentEnterprise(enterprise);
      if (enterprise.isPersonal) {
        $location.path('personal/settings');
      } else {
        $location.path('/enterprise/' + enterprise.id + '/settings');
      }
    };
    $scope.isMarketingPage = function () {
      return Utils.Url.isMarketingPage();
    };
    $scope.viewloaded = function () {
      $scope.isViewLoaded = true;
    };
    // Show the notification bullet for the current enterprise's Activity tab
    $scope.showApprovalIcon = function (enterpriseId) {
      if (!$rootScope.enterprises.all[enterpriseId] || _.keys($rootScope.enterprises.all[enterpriseId].pendingApprovals).length === 0) {
        return false;
      }
      $scope.relevantApprovalCount[enterpriseId] = 0;
      _.forOwn($rootScope.enterprises.all[enterpriseId].pendingApprovals, function (approval) {
        if (approval.creator !== $rootScope.currentUser.settings.id) {
          $scope.relevantApprovalCount[enterpriseId]++;
        }
      });
      return $scope.relevantApprovalCount[enterpriseId] > 0;
    };
    /**
     * Show the notification bullet if there are approvals or shares
     * @param event {String} the enterprise id
     */
    $scope.showApprovalAndSharesIcon = function (enterpriseId) {
      if (!$rootScope.enterprises.all[enterpriseId] || _.keys($rootScope.enterprises.all[enterpriseId].pendingApprovals).length + $rootScope.enterprises.all[enterpriseId].walletShareCount.incoming === 0) {
        return false;
      }
      $scope.approvalAndSharesCount[enterpriseId] = 0;
      _.forOwn($rootScope.enterprises.all[enterpriseId].pendingApprovals, function (approval) {
        if (approval.creator !== $rootScope.currentUser.settings.id) {
          $scope.approvalAndSharesCount[enterpriseId]++;
        }
      });
      $scope.approvalAndSharesCount[enterpriseId] += $rootScope.enterprises.all[enterpriseId].walletShareCount.incoming;
      return $scope.approvalAndSharesCount[enterpriseId] > 0;
    };
    // Event handlers
    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function (evt, data) {
        // When the currentUser is set, update the local user
        updateAppUser();
        // open the enterprise dropdown if there are any pending approvals or shares across enterprises
        if (hasApprovalsOrShares()) {
          // add timeout so that it gets added to the next digest cycle
          $timeout(function () {
            $scope.toggleDropdown = true;
          }, 0);
        }
      });
    var killPlaceholderUserSetListener = $rootScope.$on('UserAPI.PlaceholderUserSet', function (evt, data) {
        updateAppUser();
      });
    // Clean up the event listeners when the scope is destroyed
    // This keeps the angular run loop leaner and reduces the odds that
    // a reference to this scope is kept once the controller is scrapped
    $scope.$on('$destroy', function () {
      killPlaceholderUserSetListener();
      killUserSetListener();
    });
    function init() {
      $scope.toggleDropdown = false;
      $scope.isViewLoaded = false;
      updateAppUser();
    }
    init();
  }
]);// Module for components controlling the overall app state
angular.module('BitGo.App', [
  'BitGo.App.AppController',
  'BitGo.App.InternalStateService',
  'BitGo.App.RequiredActionService',
  'BitGo.App.SyncService'
]);/**
 * @ngdoc service
 * @name SyncService
 * @description
 * Manages the re-syncing of the entire app with the latest server data
 */
angular.module('BitGo.App.SyncService', []).factory('SyncService', [
  '$rootScope',
  '$timeout',
  'EnterpriseAPI',
  'WalletsAPI',
  'WalletSharesAPI',
  function ($rootScope, $timeout, EnterpriseAPI, WalletsAPI, WalletSharesAPI) {
    // constant used to ensure we throttle the sync calls (if wanted)
    var SYNC_TIMEOUT;
    // global sync throttle timeout
    var SYNC_THROTTLE = 0;
    /**
    * Sync the app with the current server state
    * @private
    */
    function sync() {
      if (SYNC_TIMEOUT) {
        $timeout.cancel(SYNC_TIMEOUT);
      }
      SYNC_TIMEOUT = $timeout(function () {
        // Sync the appropriate data sources
        EnterpriseAPI.getAllEnterprises();
        WalletsAPI.getAllWallets();
        WalletSharesAPI.getAllSharedWallets();
      }, SYNC_THROTTLE);
    }
    /** In-client API */
    return { sync: sync };
  }
]);/**
 * @ngdoc service
 * @name RequiredActionService
 * @description
 * Manages any actions and setup needed to enforce the user to take
 * specific upgrade paths in the app during their course of using it
 * E.g. Legacy password upgrade (weak login passwords)
 */
angular.module('BitGo.App.RequiredActionService', []).factory('RequiredActionService', [
  '$rootScope',
  'InternalStateService',
  'BG_DEV',
  function ($rootScope, InternalStateService, BG_DEV) {
    // All possible required actions that the BitGo service might enforce
    var REQUIRED_ACTION_HANDLERS = {};
    // Required Action Handlers
    // Weak account/legacy password:
    // If the user is using a weak account pw, at certain points in
    // the app, we force them to go into personal settings and
    // upgrade to a stronger pw
    REQUIRED_ACTION_HANDLERS[BG_DEV.REQUIRED_ACTIONS.WEAK_PW] = {
      handler: function () {
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
      return _.filter(outstandingPendingActions, function (action) {
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
      var conflictsWithExisting = _.filter(outstandingPendingActions, function (action) {
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
      _.forEach(outstandingPendingActions, function (action, index) {
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
]);/*
  About:
  - Deals with everything login, signup related
*/
angular.module('BitGo.Auth', [
  'BitGo.Auth.SignupController',
  'BitGo.Auth.SignupFormDirective',
  'BitGo.Auth.LoginController',
  'BitGo.Auth.LoginFormDirective',
  'BitGo.Auth.SetPhoneFormDirective',
  'BitGo.Auth.TwoFactorFormDirective',
  'BitGo.Auth.LogoutController',
  'BitGo.Auth.ResetPwController',
  'BitGo.Auth.ForgotPwController',
  'BitGo.Auth.ForgotPwFormDirective',
  'BitGo.Auth.VerifyEmailController'
]);/*
  About:
  - The ForgotPwController deals with managing the section of the
  app if a user shows up having forgotten their password

  Notes:
  - This manages: ForgotPwForm
*/
angular.module('BitGo.Auth.ForgotPwController', []).controller('ForgotPwController', [
  '$scope',
  '$rootScope',
  'UserAPI',
  'NotifyService',
  function ($scope, $rootScope, UserAPI, Notify) {
    $scope.viewStates = [
      'initial',
      'confirmEmail'
    ];
    // The initial view state; initialized later
    $scope.state = undefined;
    $rootScope.$on('UserAPI.CurrentUserSet', function (evt, data) {
      $scope.user = $rootScope.currentUser;
    });
    function init() {
      $rootScope.setContext('forgotPassword');
      $scope.user = $rootScope.currentUser;
      $scope.state = 'initial';
    }
    init();
  }
]);angular.module('BitGo.Auth.ForgotPwFormDirective', []).directive('forgotPwForm', [
  'UserAPI',
  'UtilityService',
  'NotifyService',
  function (UserAPI, Util, Notify) {
    return {
      restrict: 'A',
      require: '^ForgotPwController',
      controller: [
        '$scope',
        function ($scope) {
          function formIsValid() {
            return Util.Validators.emailOk($scope.user.settings.email.email);
          }
          function onSubmitSuccess() {
            return $scope.$emit('SetState', 'confirmEmail');
          }
          $scope.submitForgotPw = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var user = {
                  email: Util.Formatters.email($scope.user.settings.email.email),
                  type: 'forgotpassword'
                };
              UserAPI.forgotpassword(user).then(onSubmitSuccess).catch(Notify.errorHandler);
            } else {
              $scope.setFormError('Please enter a valid email.');
            }
          };
          $scope.resendEmail = function () {
            var user = {
                email: Util.Formatters.email($scope.user.settings.email.email),
                type: 'forgotpassword'
              };
            UserAPI.forgotpassword(user).then(Notify.successHandler('Your email was sent.')).catch(Notify.errorHandler);
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc controller
 * @name LoginController
 * @description
 * The LoginController deals with managing the flow/section of the
 * app where a user signs in. All $scope variables set here are available
 * to all directives in the flow that depend on it.
 *
 * The directives that require this controller are:
 *   - LogInForm
 *   - SetPhoneForm
 *   - TwoFactorForm
 */
angular.module('BitGo.Auth.LoginController', []).controller('LoginController', [
  '$scope',
  '$rootScope',
  '$location',
  'UserAPI',
  'UtilityService',
  'KeychainsAPI',
  'SettingsAPI',
  'NotifyService',
  'PostAuthService',
  'EnterpriseAPI',
  'RequiredActionService',
  'BG_DEV',
  'CacheService',
  function ($scope, $rootScope, $location, UserAPI, Util, KeychainsAPI, SettingsAPI, Notify, PostAuthService, EnterpriseAPI, RequiredActionService, BG_DEV, CacheService) {
    $scope.viewStates = [
      'login',
      'needsEmailVerify',
      'setPhone',
      'verifyPhone',
      'otp'
    ];
    // The initial view state; initialized later
    $scope.state = undefined;
    $scope.otpCode = null;
    $scope.password = null;
    // user object used in the signup flow
    $scope.user = null;
    // This is the password/email we use once we verify that the user is valid
    // We need to do this because LastPass sometimes overwrites the
    // password/email fields in the middle of the login flow
    $scope.lockedPassword = null;
    $scope.lockedEmail = null;
    var killUserLoginListener = $scope.$on('SignUserIn', function () {
        // Priority 1: run any necessary post auth actions
        if (PostAuthService.hasPostAuth()) {
          return PostAuthService.runPostAuth();
        }
        // Priority 2: run any relevant required actions
        if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
          return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
        }
        // Priority 3: direct log in
        $location.path('/enterprise/' + EnterpriseAPI.getCurrentEnterprise() + '/wallets');
      });
    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function (evt, data) {
        // stores settings returned after creating ecdh key for user
        var newSettings;
        $scope.user = $rootScope.currentUser;
        //check if user has ECDH keychain. If not, make it for him
        if (!$rootScope.currentUser.settings.ecdhKeychain) {
          var params = {
              source: 'ecdh',
              saveEncryptedXprv: true,
              passcode: $scope.password
            };
          KeychainsAPI.createKeychain(params).then(function (data) {
            newSettings = {
              otp: null,
              settings: { ecdhKeychain: data.xpub }
            };
            return SettingsAPI.save(newSettings);
          }).then(function () {
            $rootScope.currentUser.settings.ecdhKeychain = newSettings.settings.ecdhKeychain;
          }).catch(function (error) {
            console.error('Error setting the user ecdh keychain: ', error.error);
          });
        }
      });
    // Event handler cleanup
    $scope.$on('$destroy', function () {
      killUserSetListener();
      killUserLoginListener();
    });
    $scope.attemptLogin = function (forceSMS) {
      // Use the UI locked variables if available
      var safePassword = $scope.lockedPassword || $scope.password;
      var safeEmail = $scope.lockedEmail || $scope.user.settings.email.email;
      // Set the params
      var formattedEmail = Util.Formatters.email(safeEmail);
      var user = {
          email: formattedEmail,
          password: Util.Crypto.sjclHmac(formattedEmail, safePassword),
          otp: $scope.otpCode,
          forceSMS: !!forceSMS
        };
      return UserAPI.login(user);
    };
    $scope.sendEmailVerification = function () {
      var email = $scope.user.settings.email.email;
      if (email) {
        var params = {
            type: 'email',
            email: email
          };
        UserAPI.request(params).then(Notify.successHandler('Your email was sent.')).catch(function (error) {
          Notify.error('There was an issue resending your email. Please refresh your page and try this again.');
        });
      }
    };
    function getVerificationState() {
      var verificationStates = [
          'needsEmailVerify',
          'setPhone',
          'verifyPhone'
        ];
      var result;
      var foundState;
      var urlStates = $location.search();
      _.forEach(verificationStates, function (state) {
        if (_.has(urlStates, state)) {
          if (!foundState) {
            foundState = true;
            result = state;
          } else {
            throw new Error('Cannot set more than one verification state in the URL');
          }
        }
      });
      return result;
    }
    function init() {
      $rootScope.setContext('login');
      $scope.user = $rootScope.currentUser;
      var verificationState = getVerificationState();
      var emailVerificationCache;
      if (verificationState === 'needsEmailVerify') {
        emailVerificationCache = CacheService.getCache('emailVerification');
        // check if the email had already been sent. Do not send if it has been sent already
        if (emailVerificationCache && emailVerificationCache.get('canSend')) {
          $scope.sendEmailVerification();
          // set the canSend flag on the cache after sending
          emailVerificationCache.add('canSend', false);
        }
      }
      var state = 'login';
      // Only if there is a user can we jump to a verification state,
      // otherwise, force log in first
      if ($scope.user.loggedIn) {
        state = verificationState ? verificationState : 'login';
      }
      $scope.state = state;
    }
    init();
  }
]);angular.module('BitGo.Auth.LoginFormDirective', []).directive('loginForm', [
  'UtilityService',
  'NotifyService',
  'RequiredActionService',
  'BG_DEV',
  'AnalyticsProxy',
  function (Util, Notify, RequiredActionService, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: [
        '$scope',
        function ($scope) {
          /**
         * Sets the locked password on the scope to use in the future
         */
          function setLockedPassword() {
            $scope.lockedPassword = _.clone($scope.password);
            $scope.lockedEmail = _.clone($scope.user.settings.email.email);
          }
          // This is specifically for firefox and how it handles the form autofilling
          // when a user chose to "remember my password" the autofill doesn't trip the
          // angular form handlers, so we check manually at form submit time
          function fetchPreFilledFields() {
            if (!$scope.user.settings.email.email) {
              var email = $('[name=email]').val();
              if (email) {
                $scope.user.settings.email.email = Util.Formatters.email(email);
              }
            }
            if (!$scope.password) {
              var password = $('[name=password]').val();
              if (password) {
                $scope.password = password;
              }
            }
          }
          function formIsValid() {
            return !!$scope.password && Util.Validators.emailOk($scope.user.settings.email.email);
          }
          /**
         * Checks if we need a user to upgrade a weak login password
         * @returns {Bool}
         * @private
         */
          function passwordUpgradeActionSet() {
            var action = BG_DEV.REQUIRED_ACTIONS.WEAK_PW;
            if (!$scope.passwordStrength) {
              return false;
            }
            if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
              RequiredActionService.setAction(action);
            } else {
              RequiredActionService.removeAction(action);
            }
            return true;
          }
          /**
        * Sets the scope's password strength object
        * @param passwordStrength {Object}
        * @public
        */
          $scope.checkStrength = function (passwordStrength) {
            $scope.passwordStrength = passwordStrength;
          };
          function onLoginSuccess(user) {
            if (user.emailNotVerified()) {
              return $scope.$emit('SetState', 'needsEmailVerify');
            }
            if (user.phoneNotSet()) {
              return $scope.$emit('SetState', 'setPhone');
            }
            if (user.phoneNotVerified()) {
              return $scope.$emit('SetState', 'verifyPhone');
            }
          }
          function onLoginFail(error) {
            if (error.needsOTP) {
              // Track the successful password verification
              // needsOTP failure means that the username / pw match was correct
              AnalyticsProxy.track('VerifyPassword');
              return $scope.$emit('SetState', 'otp');
            }
            // Track the password / username failure
            var metricsData = {
                status: error.status,
                message: error.error,
                action: 'Login'
              };
            AnalyticsProxy.track('Error', metricsData);
            Notify.error('Incorrect email or password.');
          }
          $scope.submitLogin = function () {
            // clear any errors
            $scope.clearFormError();
            fetchPreFilledFields();
            // handle the LastPass pw/email issues
            setLockedPassword();
            // check the login password strength for legacy weak pw's
            if (!passwordUpgradeActionSet()) {
              $scope.setFormError('There was an error confirming your password strength. Please reload your page and try again.');
              return;
            }
            // Submit the login form
            if (formIsValid()) {
              $scope.attemptLogin().then(onLoginSuccess).catch(onLoginFail);
            } else {
              // Track the failed auth
              var metricsData = {
                  status: 'client',
                  message: 'Invalid Login Form',
                  action: 'Login'
                };
              AnalyticsProxy.track('Error', metricsData);
              $scope.setFormError('Missing required information.');
            }
          };
          function init() {
            $scope.passwordStrength = null;
          }
          init();
        }
      ]
    };
  }
]);/*
  About:
  - The LogoutController deals with managing the section of the
  app where a user signs out - handle any addtn'l data cleanup here
*/
angular.module('BitGo.Auth.LogoutController', []).controller('LogoutController', [
  '$scope',
  '$location',
  '$rootScope',
  'UserAPI',
  'NotifyService',
  function ($scope, $location, $rootScope, UserAPI, Notify) {
    function onLogoutSuccess() {
      $location.path('/login');
    }
    UserAPI.logout().then(onLogoutSuccess).catch(function (error) {
      console.error('There was an issue signing the user out: ', error);
    });
  }
]);angular.module('BitGo.Auth.ResetPwController', []).controller('ResetPwController', [
  '$scope',
  '$rootScope',
  '$location',
  'NotifyService',
  'UtilityService',
  'UserAPI',
  'BG_DEV',
  function ($scope, $rootScope, $location, NotifyService, UtilityService, UserAPI, BG_DEV) {
    // Holds params relevant to resetting the user pw
    var resetParams;
    // object to handle the form data
    $scope.form = null;
    // mock user to hold data for logging in if they successfully update their pw
    $scope.user = null;
    // object to hold the scope's password strength indicator when set
    // from a child passwordStrength directive
    $scope.passwordStrength = null;
    /**
     * Validates the form state before submitting things
     *
     * @private
     */
    function formIsValid() {
      if (!$scope.form.password) {
        $scope.setFormError('Please enter a strong password.');
        return false;
      }
      if (!$scope.passwordStrength) {
        $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
        return false;
      }
      if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
        $scope.setFormError('Please enter a stronger password.');
        return false;
      }
      if ($scope.form.password != $scope.form.passwordConfirm) {
        $scope.setFormError('Please enter matching passwords.');
        return false;
      }
      return true;
    }
    /**
     * Updates the scope password strength variable to be represented in the UI
     *
     * @public
     */
    $scope.checkStrength = function (passwordStrength) {
      $scope.passwordStrength = passwordStrength;
    };
    /**
     * Show the password strength indicator in the UI
     *
     * @public
     */
    $scope.showPasswordStrength = function () {
      return $scope.form.password && $scope.form.password.length && $scope.passwordStrength;
    };
    /**
     * Reset the user's password
     *
     * @public
     */
    $scope.submitReset = function () {
      // clear any errors
      $scope.clearFormError();
      if (formIsValid()) {
        var params = {
            code: resetParams.code,
            email: resetParams.email,
            type: 'forgotpassword',
            password: UtilityService.Crypto.sjclHmac(resetParams.email, $scope.form.password)
          };
        UserAPI.resetPassword(params).then(function () {
          NotifyService.success('Your password was successfully updated. Please log in to recover your wallets.');
          // update the $rootScope user's email to prepopulate the form
          $scope.user.settings.email.email = resetParams.email;
          $location.path('/login');
        }).catch(function (error) {
          NotifyService.error('There was an error updating your password. Please refresh the page and try again.');
        }).finally(function () {
          // Wipe the resetParams data from the config
          BitGoConfig.preAppLoad.clearQueryparams();
        });
      }
    };
    /**
     * Verify that we have the correct params
     *
     * @private
     */
    function initResetPwParams() {
      /**
       * Verify we have the correct params
       *
       * @private
       */
      function verifyParams(params) {
        if (!params || !params.email || !params.code) {
          throw new Error('Missing url params');
        }
        if (!UtilityService.Validators.emailOk(params.email)) {
          throw new Error('Invalid email in params');
        }
      }
      // Grab the query params off the config object; these were stripped from the
      // URL before the app loaded and appended to this config object
      resetParams = BitGoConfig.preAppLoad.queryparams;
      verifyParams(resetParams);
    }
    /**
     * Init the reset controller
     *
     * @private
     */
    function init() {
      $rootScope.setContext('resetPassword');
      // verify the correct information was gathered before the app loaded
      // (we need a code and an email to have been plucked from the URL
      // before the app loaded)
      initResetPwParams();
      $scope.user = $rootScope.currentUser;
      $scope.form = {
        password: null,
        passwordConfirm: null
      };
    }
    init();
  }
]);angular.module('BitGo.Auth.SetPhoneFormDirective', []).directive('setPhoneForm', [
  'UtilityService',
  'SettingsAPI',
  'UserAPI',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  function (Util, SettingsAPI, UserAPI, Notify, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: [
        '$scope',
        function ($scope) {
          function formIsValid() {
            return Util.Validators.phoneOk($scope.user.settings.phone.phone);
          }
          // Now request that an otp code be sent to the user's new (unverified) number
          function onSetPhoneSuccess(user) {
            // Track the phone set success
            AnalyticsProxy.track('SetPhone');
            var phone = $scope.user.settings.phone.phone;
            if (phone) {
              var params = { type: 'phone' };
              UserAPI.request(params);
            }
            return $scope.$emit('SetState', 'verifyPhone');
          }
          /**
         * Handle server fail when setting phone on login
         * @param error {Object}
         * @private
         */
          function onSetPhoneFail(error) {
            Notify.error(error.error);
            // Track the phone set server fail
            var metricsData = {
                status: error.status,
                message: error.error,
                action: 'Set Phone'
              };
            AnalyticsProxy.track('Error', metricsData);
          }
          // Sets a new (unverified) phone number on the user
          // Note: as long as the phone number is not verified, we can set new phone
          // numbers on the user and sent otps to them -- but once verified, there
          // is an entirely different flow/route to change their phone number
          $scope.submitSetPhone = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var data = { settings: { phone: { phone: $scope.user.settings.phone.phone } } };
              SettingsAPI.save(data).then(onSetPhoneSuccess).catch(onSetPhoneFail);
            } else {
              $scope.setFormError('Please add a valid phone numer.');
              // Track the phone set fail on the client
              var metricsData = {
                  status: 'client',
                  message: 'Invalid Phone Number',
                  action: 'Set Phone'
                };
              AnalyticsProxy.track('Error', metricsData);
            }
          };
        }
      ]
    };
  }
]);/*
  About:
  - The SignupController deals with managing the section of the
  app where a user signs in

  Notes:
  - This manages: SignUpForm
*/
angular.module('BitGo.Auth.SignupController', []).controller('SignupController', [
  '$scope',
  '$rootScope',
  'UserAPI',
  function ($scope, $rootScope, UserAPI) {
    $scope.viewStates = [
      'signup',
      'confirmEmail'
    ];
    // The initial view state; initialized later
    $scope.state = undefined;
    $scope.password = null;
    $scope.passwordConfirm = null;
    $scope.agreedToTerms = false;
    // Even handlers
    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function (evt, data) {
        $scope.user = $rootScope.currentUser;
      });
    // Event handler cleanup
    $scope.$on('$destroy', function () {
      killUserSetListener();
    });
    function init() {
      $rootScope.setContext('signup');
      $scope.user = $rootScope.currentUser;
      $scope.state = 'signup';
    }
    init();
  }
]);angular.module('BitGo.Auth.SignupFormDirective', []).directive('signupForm', [
  '$rootScope',
  '$timeout',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  'AnalyticsUtilities',
  function ($rootScope, $timeout, UserAPI, Util, Notify, BG_DEV, AnalyticsProxy, AnalyticsUtilities) {
    return {
      restrict: 'A',
      require: '^SignupController',
      controller: [
        '$scope',
        function ($scope) {
          // Instance used to track how long it takes a user to enter a valid pw
          var analyticsPasswordMonitor;
          // Allows us to track the user's password strength
          $scope.passwordStrength = null;
          // This is specifically for firefox and how it handles the form autofilling
          // when a user chose to "remember my password" the autofill doesn't trip the
          // angular form handlers, so we check manually at form submit time
          function fetchPreFilledFields() {
            if (!$scope.user.settings.email.email) {
              var email = $('[name=email]').val();
              if (email) {
                $scope.user.settings.email.email = Util.Formatters.email(email);
              }
            }
            if (!$scope.password) {
              var password = $('[name=password]').val();
              if (password) {
                $scope.password = password;
              }
            }
          }
          /**
         * Track client-only signup failure events
         * @param error {String}
         * @private
         */
          function trackClientSignupFail(error) {
            if (typeof error !== 'string') {
              throw new Error('invalid error');
            }
            var metricsData = {
                status: 'client',
                message: error,
                action: 'Signup'
              };
            AnalyticsProxy.track('Error', metricsData);
          }
          /**
         * Client signup form validator
         * @private
         */
          function formIsValid() {
            if (!Util.Validators.emailOk($scope.user.settings.email.email)) {
              $scope.setFormError('Please enter a valid email.');
              trackClientSignupFail('Invalid Email');
              return false;
            }
            if (!$scope.password) {
              $scope.setFormError('Please enter a strong password.');
              trackClientSignupFail('Missing Password');
              return false;
            }
            if (!$scope.passwordStrength) {
              $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
              return false;
            }
            if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
              $scope.setFormError('Please enter a stronger password.');
              trackClientSignupFail('Weak Password');
              return false;
            }
            if ($scope.password != $scope.passwordConfirm) {
              $scope.setFormError('Please enter matching passwords.');
              trackClientSignupFail('Passwords Do Not Match');
              return false;
            }
            if (!$scope.agreedToTerms) {
              $scope.setFormError('You must agree to the Terms of Service.');
              trackClientSignupFail('TOS Not Checked');
              return false;
            }
            return true;
          }
          /**
         * Toggles the accept terms checkbox
         * @public
         */
          $scope.toggleTerms = function () {
            $scope.agreedToTerms = !$scope.agreedToTerms;
          };
          /**
         * Check the strength of the user's password / Track events
         * @param passwordStrength {Object}
         * @public
         */
          $scope.checkStrength = function (passwordStrength) {
            $scope.passwordStrength = passwordStrength;
            // Track the time it takes the user to enter their first valid password
            analyticsPasswordMonitor.track('SetPassword', passwordStrength);
          };
          /**
         * UI - show the password strength monitor
         * @public
         */
          $scope.showPasswordStrength = function () {
            return $scope.password && $scope.password.length && $scope.passwordStrength;
          };
          /**
         * Signup server-success handler
         * @param user {Object}
         * @private
         */
          function signupSuccess(user) {
            return $scope.$emit('SetState', 'confirmEmail');
          }
          /**
         * Signup server-fail handler
         * @param error {Object}
         * @private
         */
          function signupFail(error) {
            Notify.error(error.error);
            // Track the server signup failure
            var metricsData = {
                status: error.status,
                message: error.error,
                action: 'Signup'
              };
            AnalyticsProxy.track('Error', metricsData);
          }
          /**
         * Submit the user signup form
         * @public
         */
          $scope.submitSignup = function () {
            // clear any errors
            $scope.clearFormError();
            fetchPreFilledFields();
            if (formIsValid()) {
              var formattedEmail = Util.Formatters.email($scope.user.settings.email.email);
              var newUser = {
                  email: formattedEmail,
                  password: Util.Crypto.sjclHmac(formattedEmail, $scope.password)
                };
              UserAPI.signup(newUser).then(signupSuccess).catch(signupFail);
            }
          };
          function init() {
            // init an instance of the password time-to-complete tracker
            analyticsPasswordMonitor = new AnalyticsUtilities.time.PasswordCompletionMonitor();
          }
          init();
        }
      ]
    };
  }
]);angular.module('BitGo.Auth.TwoFactorFormDirective', []).directive('twoFactorForm', [
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  function (UserAPI, Util, Notify, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: [
        '$scope',
        function ($scope) {
          $scope.twoFactorMethods = [
            'authy',
            'text'
          ];
          $scope.twoFactorMethod = 'authy';
          /**
         * UI - verifies if a method is the currently selected Otp method
         * @public
         */
          $scope.isTwoFactorMethod = function (method) {
            return method === $scope.twoFactorMethod;
          };
          /**
         * UI - sets the current Otp method on the scope
         * @public
         */
          $scope.setTwoFactorMethod = function (method) {
            if (typeof method !== 'string') {
              throw new Error('invalid method');
            }
            $scope.twoFactorMethod = method;
            // Track the method selected
            var metricsData = { method: method };
            AnalyticsProxy.track('SelectOtpMethod', metricsData);
          };
          /**
         * Checks if the user has a verified email and phone before allowing login
         * @private
         */
          function userHasAccess() {
            if ($scope.user.emailNotVerified()) {
              $scope.$emit('SetState', 'needsEmailVerify');
              return false;
            }
            if ($scope.user.phoneNotSet()) {
              $scope.$emit('SetState', 'setPhone');
              return false;
            }
            if ($scope.user.phoneNotVerified()) {
              $scope.$emit('SetState', 'verifyPhone');
              return false;
            }
            return true;
          }
          function formIsValid() {
            return Util.Validators.otpOk($scope.otpCode);
          }
          /**
         * Handle successful phone verification from the BitGo service
         * @param user {Object}
         * @private
         */
          function onVerifySuccess(user) {
            // Track phone verification success
            AnalyticsProxy.track('VerifyPhone');
            if (userHasAccess()) {
              $scope.$emit('SignUserIn');
            }
          }
          /**
         * Handle failed phone verification from the BitGo service
         * @param error {Object}
         * @private
         */
          function onVerifyFail(error) {
            // Track the server verification fail
            var metricsData = {
                status: error.status,
                message: error.error,
                action: 'Verify Phone'
              };
            AnalyticsProxy.track('Error', metricsData);
            Notify.error('There was a problem verifying your phone.');
          }
          $scope.submitVerifyPhone = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var params = {
                  type: 'phone',
                  phone: $scope.user.settings.phone.phone,
                  code: $scope.otpCode
                };
              UserAPI.verify(params).then(function () {
                return UserAPI.me();
              }).then(onVerifySuccess).catch(onVerifyFail);
            } else {
              $scope.setFormError('Please enter a valid 7-digit code.');
            }
          };
          function onSubmitOTPSuccess() {
            // Track the OTP success
            AnalyticsProxy.track('Otp');
            if (userHasAccess()) {
              $scope.$emit('SignUserIn');
            }
          }
          function onSubmitOTPFail(error) {
            // Track the OTP fail
            var metricsData = {
                status: error.status,
                message: error.error,
                action: 'Otp Login'
              };
            AnalyticsProxy.track('Error', metricsData);
            Notify.error('The code provided was invalid.');
          }
          $scope.submitOTP = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              $scope.attemptLogin().then(onSubmitOTPSuccess).catch(onSubmitOTPFail);
            } else {
              $scope.setFormError('Please enter a valid 7-digit code.');
            }
          };
          function onResendSuccess() {
            Notify.success('Your code was sent.');
          }
          function onResendFail(error) {
            if (error.status === 401 && error.needsOTP) {
              // In this case, the user was hitting /login to force the SMS resend
              // (since it is protected). If this error case comes back, we assume
              // that the server successfully sent the code to the user
              Notify.success('Your code was sent.');
            } else {
              Notify.error('There was an issue resending your code. Please refresh your page and log in again.');
            }
          }
          $scope.resendOTP = function (forceSMS) {
            // Track the text resend
            AnalyticsProxy.track('ResendOtp');
            if ($scope.user.loggedIn) {
              // If there is a session user, they are verifying their phone
              // and we can use the sendOTP protected route
              var params = { forceSMS: !!forceSMS };
              UserAPI.sendOTP(params).then(onResendSuccess).catch(onResendFail);
            } else {
              // If there is no user, we have a user trying to otp to log in
              $scope.attemptLogin(forceSMS).then(onResendSuccess).catch(onResendFail);
            }
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc controller
 * @name VerifyEmailController
 * @description
 * Manages verifying a user email and what to do once verified
 */
angular.module('BitGo.Auth.VerifyEmailController', []).controller('VerifyEmailController', [
  '$scope',
  '$location',
  '$rootScope',
  'UserAPI',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  function ($scope, $location, $rootScope, UserAPI, NotifyService, BG_DEV, AnalyticsProxy) {
    function handleVerificationFailure(error) {
      // Track the server email validation fail
      var metricsData = {
          status: error.status,
          message: error.error,
          action: 'Email Verification'
        };
      AnalyticsProxy.track('Error', metricsData);
      NotifyService.error('There was an issue with the verification email. Please attempt logging in to receive another email.');
      return $location.path('/login');
    }
    function initVerification() {
      // Grab the query params off the config object; these were stripped from the
      // URL before the app loaded and appended to this config object
      var urlParams = BitGoConfig.preAppLoad.queryparams;
      // set the email on user if possible
      if (urlParams.email) {
        $scope.user.settings.email.email = urlParams.email;
      }
      // If no code or email in the url, the verification email is botched somehow
      if (!urlParams.email || !urlParams.code) {
        var errorData = {
            status: 'client',
            error: 'Missing Email or Code in Params'
          };
        return handleVerificationFailure(errorData);
      }
      var verificationDetails = {
          type: 'email',
          code: urlParams.code,
          email: urlParams.email
        };
      UserAPI.verify(verificationDetails).then(function (data) {
        // Track the email verify success
        AnalyticsProxy.track('VerifyEmail');
        NotifyService.success('Your email was successfully verified. You can now log in to your BitGo account.');
        $location.path('/login');
      }).catch(handleVerificationFailure).finally(function () {
        // Wipe the data from the config
        BitGoConfig.preAppLoad.clearQueryparams();
      });
    }
    function init() {
      $scope.user = $rootScope.currentUser;
      initVerification();
    }
    init();
  }
]);/*
  angular-md5 - v0.1.7
  2014-01-20
*/
(function (window, angular, undefined) {
  angular.module('angular-md5', ['gdi2290.md5']);
  angular.module('ngMd5', ['gdi2290.md5']);
  angular.module('gdi2290.md5', [
    'gdi2290.gravatar-filter',
    'gdi2290.md5-service',
    'gdi2290.md5-filter'
  ]);
  'use strict';
  angular.module('gdi2290.gravatar-filter', []).filter('gravatar', [
    'md5',
    function (md5) {
      var cache = {};
      return function (text, defaultText) {
        if (!cache[text]) {
          defaultText = defaultText ? md5.createHash(defaultText.toString().toLowerCase()) : '';
          cache[text] = text ? md5.createHash(text.toString().toLowerCase()) : defaultText;
        }
        return cache[text];
      };
    }
  ]);
  'use strict';
  angular.module('gdi2290.md5-filter', []).filter('md5', [
    'md5',
    function (md5) {
      return function (text) {
        return text ? md5.createHash(text.toString().toLowerCase()) : text;
      };
    }
  ]);
  'use strict';
  angular.module('gdi2290.md5-service', []).factory('md5', [function () {
      var md5 = {
          createHash: function (str) {
            var xl;
            var rotateLeft = function (lValue, iShiftBits) {
              return lValue << iShiftBits | lValue >>> 32 - iShiftBits;
            };
            var addUnsigned = function (lX, lY) {
              var lX4, lY4, lX8, lY8, lResult;
              lX8 = lX & 2147483648;
              lY8 = lY & 2147483648;
              lX4 = lX & 1073741824;
              lY4 = lY & 1073741824;
              lResult = (lX & 1073741823) + (lY & 1073741823);
              if (lX4 & lY4) {
                return lResult ^ 2147483648 ^ lX8 ^ lY8;
              }
              if (lX4 | lY4) {
                if (lResult & 1073741824) {
                  return lResult ^ 3221225472 ^ lX8 ^ lY8;
                } else {
                  return lResult ^ 1073741824 ^ lX8 ^ lY8;
                }
              } else {
                return lResult ^ lX8 ^ lY8;
              }
            };
            var _F = function (x, y, z) {
              return x & y | ~x & z;
            };
            var _G = function (x, y, z) {
              return x & z | y & ~z;
            };
            var _H = function (x, y, z) {
              return x ^ y ^ z;
            };
            var _I = function (x, y, z) {
              return y ^ (x | ~z);
            };
            var _FF = function (a, b, c, d, x, s, ac) {
              a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
              return addUnsigned(rotateLeft(a, s), b);
            };
            var _GG = function (a, b, c, d, x, s, ac) {
              a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
              return addUnsigned(rotateLeft(a, s), b);
            };
            var _HH = function (a, b, c, d, x, s, ac) {
              a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
              return addUnsigned(rotateLeft(a, s), b);
            };
            var _II = function (a, b, c, d, x, s, ac) {
              a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
              return addUnsigned(rotateLeft(a, s), b);
            };
            var convertToWordArray = function (str) {
              var lWordCount;
              var lMessageLength = str.length;
              var lNumberOfWords_temp1 = lMessageLength + 8;
              var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - lNumberOfWords_temp1 % 64) / 64;
              var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
              var lWordArray = new Array(lNumberOfWords - 1);
              var lBytePosition = 0;
              var lByteCount = 0;
              while (lByteCount < lMessageLength) {
                lWordCount = (lByteCount - lByteCount % 4) / 4;
                lBytePosition = lByteCount % 4 * 8;
                lWordArray[lWordCount] = lWordArray[lWordCount] | str.charCodeAt(lByteCount) << lBytePosition;
                lByteCount++;
              }
              lWordCount = (lByteCount - lByteCount % 4) / 4;
              lBytePosition = lByteCount % 4 * 8;
              lWordArray[lWordCount] = lWordArray[lWordCount] | 128 << lBytePosition;
              lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
              lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
              return lWordArray;
            };
            var wordToHex = function (lValue) {
              var wordToHexValue = '', wordToHexValue_temp = '', lByte, lCount;
              for (lCount = 0; lCount <= 3; lCount++) {
                lByte = lValue >>> lCount * 8 & 255;
                wordToHexValue_temp = '0' + lByte.toString(16);
                wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
              }
              return wordToHexValue;
            };
            var x = [], k, AA, BB, CC, DD, a, b, c, d, S11 = 7, S12 = 12, S13 = 17, S14 = 22, S21 = 5, S22 = 9, S23 = 14, S24 = 20, S31 = 4, S32 = 11, S33 = 16, S34 = 23, S41 = 6, S42 = 10, S43 = 15, S44 = 21;
            x = convertToWordArray(str);
            a = 1732584193;
            b = 4023233417;
            c = 2562383102;
            d = 271733878;
            xl = x.length;
            for (k = 0; k < xl; k += 16) {
              AA = a;
              BB = b;
              CC = c;
              DD = d;
              a = _FF(a, b, c, d, x[k + 0], S11, 3614090360);
              d = _FF(d, a, b, c, x[k + 1], S12, 3905402710);
              c = _FF(c, d, a, b, x[k + 2], S13, 606105819);
              b = _FF(b, c, d, a, x[k + 3], S14, 3250441966);
              a = _FF(a, b, c, d, x[k + 4], S11, 4118548399);
              d = _FF(d, a, b, c, x[k + 5], S12, 1200080426);
              c = _FF(c, d, a, b, x[k + 6], S13, 2821735955);
              b = _FF(b, c, d, a, x[k + 7], S14, 4249261313);
              a = _FF(a, b, c, d, x[k + 8], S11, 1770035416);
              d = _FF(d, a, b, c, x[k + 9], S12, 2336552879);
              c = _FF(c, d, a, b, x[k + 10], S13, 4294925233);
              b = _FF(b, c, d, a, x[k + 11], S14, 2304563134);
              a = _FF(a, b, c, d, x[k + 12], S11, 1804603682);
              d = _FF(d, a, b, c, x[k + 13], S12, 4254626195);
              c = _FF(c, d, a, b, x[k + 14], S13, 2792965006);
              b = _FF(b, c, d, a, x[k + 15], S14, 1236535329);
              a = _GG(a, b, c, d, x[k + 1], S21, 4129170786);
              d = _GG(d, a, b, c, x[k + 6], S22, 3225465664);
              c = _GG(c, d, a, b, x[k + 11], S23, 643717713);
              b = _GG(b, c, d, a, x[k + 0], S24, 3921069994);
              a = _GG(a, b, c, d, x[k + 5], S21, 3593408605);
              d = _GG(d, a, b, c, x[k + 10], S22, 38016083);
              c = _GG(c, d, a, b, x[k + 15], S23, 3634488961);
              b = _GG(b, c, d, a, x[k + 4], S24, 3889429448);
              a = _GG(a, b, c, d, x[k + 9], S21, 568446438);
              d = _GG(d, a, b, c, x[k + 14], S22, 3275163606);
              c = _GG(c, d, a, b, x[k + 3], S23, 4107603335);
              b = _GG(b, c, d, a, x[k + 8], S24, 1163531501);
              a = _GG(a, b, c, d, x[k + 13], S21, 2850285829);
              d = _GG(d, a, b, c, x[k + 2], S22, 4243563512);
              c = _GG(c, d, a, b, x[k + 7], S23, 1735328473);
              b = _GG(b, c, d, a, x[k + 12], S24, 2368359562);
              a = _HH(a, b, c, d, x[k + 5], S31, 4294588738);
              d = _HH(d, a, b, c, x[k + 8], S32, 2272392833);
              c = _HH(c, d, a, b, x[k + 11], S33, 1839030562);
              b = _HH(b, c, d, a, x[k + 14], S34, 4259657740);
              a = _HH(a, b, c, d, x[k + 1], S31, 2763975236);
              d = _HH(d, a, b, c, x[k + 4], S32, 1272893353);
              c = _HH(c, d, a, b, x[k + 7], S33, 4139469664);
              b = _HH(b, c, d, a, x[k + 10], S34, 3200236656);
              a = _HH(a, b, c, d, x[k + 13], S31, 681279174);
              d = _HH(d, a, b, c, x[k + 0], S32, 3936430074);
              c = _HH(c, d, a, b, x[k + 3], S33, 3572445317);
              b = _HH(b, c, d, a, x[k + 6], S34, 76029189);
              a = _HH(a, b, c, d, x[k + 9], S31, 3654602809);
              d = _HH(d, a, b, c, x[k + 12], S32, 3873151461);
              c = _HH(c, d, a, b, x[k + 15], S33, 530742520);
              b = _HH(b, c, d, a, x[k + 2], S34, 3299628645);
              a = _II(a, b, c, d, x[k + 0], S41, 4096336452);
              d = _II(d, a, b, c, x[k + 7], S42, 1126891415);
              c = _II(c, d, a, b, x[k + 14], S43, 2878612391);
              b = _II(b, c, d, a, x[k + 5], S44, 4237533241);
              a = _II(a, b, c, d, x[k + 12], S41, 1700485571);
              d = _II(d, a, b, c, x[k + 3], S42, 2399980690);
              c = _II(c, d, a, b, x[k + 10], S43, 4293915773);
              b = _II(b, c, d, a, x[k + 1], S44, 2240044497);
              a = _II(a, b, c, d, x[k + 8], S41, 1873313359);
              d = _II(d, a, b, c, x[k + 15], S42, 4264355552);
              c = _II(c, d, a, b, x[k + 6], S43, 2734768916);
              b = _II(b, c, d, a, x[k + 13], S44, 1309151649);
              a = _II(a, b, c, d, x[k + 4], S41, 4149444226);
              d = _II(d, a, b, c, x[k + 11], S42, 3174756917);
              c = _II(c, d, a, b, x[k + 2], S43, 718787259);
              b = _II(b, c, d, a, x[k + 9], S44, 3951481745);
              a = addUnsigned(a, AA);
              b = addUnsigned(b, BB);
              c = addUnsigned(c, CC);
              d = addUnsigned(d, DD);
            }
            var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
            return temp.toLowerCase();
          }
        };
      return md5;
    }]);
}(this, this.angular, void 0));/**
 * @ngdoc directive
 * @name bgApprovalTileBitcoinWhitelist
 * @description
 * This directive manages the approval tile state for general wallet approvals
 * 'General' type includes:
 *  bitcoinAddressWhitelist
 *  dailyLimitPolicy
 *  txLimitPolicy
 * @example
 *   <span bg-activity-tile-policy-description item="logItem"></span>
 */
angular.module('BitGo.Common.BGActivityTilePolicyDescriptionDirective', []).directive('bgActivityTilePolicyDescription', [
  'BG_DEV',
  function (BG_DEV) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, elem, attrs) {
        scope.showById = function (id) {
          return scope.logItemId === id;
        };
        function handleWhitelist() {
          var addingAddress = !!scope.policyData.condition.add;
          if (addingAddress) {
            scope.addressInQuestion = scope.policyData.condition.add;
            scope.verb = 'Added';
            return;
          }
          scope.addressInQuestion = scope.policyData.condition.remove;
          scope.verb = 'Removed';
        }
        function handleSpendingLimit() {
          if (scope.logItem.data.action === 'remove') {
            return;
          }
          scope.amountInQuestion = scope.policyData.condition.amount;
        }
        function initDescriptionData() {
          switch (scope.logItemId) {
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address']:
            handleWhitelist();
            break;
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.day']:
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.tx']:
            handleSpendingLimit();
            break;
          default:
            throw new Error('invalid policy type in the activity tile');
          }
        }
        function init() {
          scope.policyData = scope.logItem.data.update;
          scope.logItemId = scope.policyData.id;
          initDescriptionData();
        }
        init();
      }
    };
  }
]);angular.module('BitGo.Common.BGAddUserToWalletDirective', []).directive('bgAddUserToWallet', [
  '$rootScope',
  '$q',
  'UserAPI',
  'NotifyService',
  'KeychainsAPI',
  'UtilityService',
  '$modal',
  'WalletSharesAPI',
  '$filter',
  'WalletsAPI',
  'SyncService',
  'BG_DEV',
  function ($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, WalletsAPI, SyncService, BG_DEV) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          //Called when user is successfully added to a wallet
          $scope.onAddUserSuccess = function (walletShare) {
            SyncService.sync();
            // if there are other admins, the wallet share reuires approval
            if ($rootScope.wallets.all[walletShare.walletId].multipleAdmins) {
              Notify.success('Invite is awaiting approval.');
            }
            $scope.setState('showAllUsers');
          };
          //Called when wallet sharing fails
          function onAddUserFail(error) {
            Notify.error(error.error);
          }
          function createShareErrorHandler(params) {
            return function createShareError(error) {
              if (UtilityService.API.isOtpError(error)) {
                // If the user needs to OTP, use the modal to unlock their account
                openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock }).then(function (result) {
                  if (result.type === 'otpThenUnlockSuccess') {
                    if (!result.data.otp) {
                      throw new Error('Missing otp');
                    }
                    if (!result.data.password) {
                      throw new Error('Missing login password');
                    }
                    $scope.password = result.data.password;
                    // resubmit to share wallet
                    return $scope.shareWallet(params);
                  }
                });
              } else if (UtilityService.API.isPasscodeError(error)) {
                openModal({ type: BG_DEV.MODAL_TYPES.passwordThenUnlock }).then(function (result) {
                  if (result.type === 'otpThenUnlockSuccess') {
                    if (!result.data.password) {
                      throw new Error('Missing login password');
                    }
                    $scope.password = result.data.password;
                    // resubmit to share wallet
                    return $scope.shareWallet(params);
                  }
                });
              } else {
                onAddUserFail(error);
              }
            };
          }
          /**
        * creates a wallet share with another user.
        * Steps for wallet sharing
        *   - Fetch the keychain for the particular wallet.
        *   - Get xprv by decrypting encrypted xprv.
        *   - create an ECDH secret.
        *   - encrypt the secret with the xprv
        *   - send this data to the server
        * @params {object} - data required for the create wallet share function
        * @returns {promise} with data/error from the server calls.
        */
          $scope.shareWallet = function (shareParams) {
            var error = { status: 401 };
            if (!shareParams || !shareParams.keychain) {
              error.error = 'Invalid share params';
              return $q.reject(error);
            }
            var createShareParams = _.clone(shareParams);
            return KeychainsAPI.get($rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub).then(function (data) {
              // Cold wallets don't have encrypted xprv. Wallet sharing becomes similar to 'View Only' share then
              if (!data.encryptedXprv) {
                //empty out the keychain object bfeore sending to the server
                createShareParams.keychain = {};
                return WalletSharesAPI.createShare($scope.walletId, createShareParams);
              } else {
                if (!$scope.password) {
                  error.message = 'Missing Password';
                  error.data = {
                    needsPasscode: true,
                    key: null
                  };
                  return $q.reject(UtilityService.ErrorHelper(error));
                }
                var xprv = UtilityService.Crypto.sjclDecrypt($scope.password, data.encryptedXprv);
                // init a new bip32 object based on the xprv from the server
                var testBip32;
                try {
                  testBip32 = new Bitcoin.BIP32(xprv);
                } catch (e) {
                  error.error = 'Could not share wallet. Invalid private key';
                  return $q.reject(error);
                }
                var testXpub = testBip32.extended_public_key_string();
                // check if the xprv returned matches the xpub sent to the server
                if ($rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub !== testXpub) {
                  error.error = 'This is a legacy wallet and cannot be shared.';
                  return $q.reject(error);
                }
                var eckey = new Bitcoin.ECKey();
                var secret = UtilityService.Crypto.getECDHSecret(eckey.priv, createShareParams.keychain.toPubKey);
                createShareParams.keychain.fromPubKey = eckey.getPubKeyHex();
                createShareParams.keychain.encryptedXprv = UtilityService.Crypto.sjclEncrypt(secret, xprv);
                return WalletSharesAPI.createShare($scope.walletId, createShareParams);
              }
            }).then($scope.onAddUserSuccess).catch(createShareErrorHandler(shareParams));
          };
          /**
         * We have already shared a wallet with this user, and they have lost
         * the password, and are now in the needsRecovery state, and thus need
         * to be shared with again. The key difference when resharing is that
         * we must set reshare=true. By design, this method is very similar to
         * saveAddUserForm.
         *
         * @param walletUserEntry {object} An element from the wallet.users array.
         * @param user {object} A wallet user object corresponding to the user from the walletUserEntry.
         *
         */
          $scope.reshareWallet = function (walletUserEntry, user) {
            var role = $filter('bgPermissionsRoleConversionFilter')(walletUserEntry.permissions);
            UserAPI.sharingkey({ email: user.settings.email.email }).then(function (data) {
              params = {
                user: data.userId,
                reshare: true,
                permissions: walletUserEntry.permissions,
                message: 'Resharing wallet.'
              };
              if (role === BG_DEV.WALLET.ROLES.SPEND || role === BG_DEV.WALLET.ROLES.ADMIN) {
                params.keychain = {
                  xpub: $rootScope.wallets.current.data.private.keychains[0].xpub,
                  toPubKey: data.pubkey,
                  path: data.path
                };
                $scope.walletId = $rootScope.wallets.current.data.id;
                return $scope.shareWallet(params);
              }
              return WalletSharesAPI.createShare($rootScope.wallets.current.data.id, params).then($scope.onAddUserSuccess);
            }).catch(function (error) {
              if (error.error === 'key not found') {
                Notify.error(user.settings.email.email + ' does not have a sharing key. The sharing key will be generated when the user next logs in. Have ' + user.settings.email.email + ' login to BitGo before sharing again.');
              } else {
                Notify.error(error.error);
              }
            });
          };
          // Triggers otp modal (with login password) to open if user needs to otp before sending a tx
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
                  locals: function () {
                    return {
                      type: params.type,
                      userAction: BG_DEV.MODAL_USER_ACTIONS.createShare,
                      wallet: $rootScope.wallets.all[$scope.walletId]
                    };
                  }
                }
              });
            return modalInstance.result;
          }
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name bgApprovalTileBitcoinWhitelist
 * @description
 * This directive manages the approval tile state for general wallet approvals
 * 'General' type includes:
 *  bitcoinAddressWhitelist
 *  dailyLimitPolicy
 *  txLimitPolicy
 * @example
 *   <span bg-approval-tile-policy-request>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTilePolicyRequestDirective', []).directive('bgApprovalTilePolicyRequest', [
  '$rootScope',
  'ApprovalsAPI',
  'WalletsAPI',
  'NotifyService',
  'BG_DEV',
  'SyncService',
  '$location',
  'EnterpriseAPI',
  'UtilityService',
  function ($rootScope, ApprovalsAPI, WalletsAPI, NotifyService, BG_DEV, SyncService, $location, EnterpriseAPI, UtilityService) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          /** All valid tile view states */
          $scope.viewStates = ['initial'];
          /** Show different templates if the approval is one the currentUser created */
          $scope.userIsCreator = $rootScope.currentUser.settings.id === $scope.approvalItem.creator;
          // the action being taken in the pending approval item (e.g. update)
          $scope.approvalItemAction = null;
          // the type of pending approval (see BG_DEV for types)
          $scope.approvalItemId = null;
          // details for the approval item
          $scope.approvalItemDetails = null;
          /**
        * Tells if action taken requires the approval templates to refresh themselves
        * @param {string} the new/updated approval state (just set by the user)
        * @private
        * @returns {bool}
        */
          $scope.actionRequiresTileRefresh = function (state) {
            if (state === 'rejected') {
              return false;
            }
            return true;
          };
          function initWhitelistTile() {
            $scope.addingAddress = !!$scope.approvalItemDetails.condition.add;
            if ($scope.addingAddress) {
              $scope.addressInQuestion = $scope.approvalItemDetails.condition.add;
              return;
            }
            $scope.addressInQuestion = $scope.approvalItemDetails.condition.remove;
          }
          /**
        * Initializes the specific details for each given tile type
        * @private
        */
          function initTileDetails() {
            if (!$scope.approvalItem.info.policyRuleRequest) {
              return;
            }
            $scope.approvalItemAction = $scope.approvalItem.info.policyRuleRequest.action;
            $scope.approvalItemId = $scope.approvalItem.info.policyRuleRequest.update.id;
            if (!$scope.approvalItemAction || !$scope.approvalItemId) {
              throw new Error('invalid approval item');
            }
            $scope.approvalItemDetails = $scope.approvalItem.info.policyRuleRequest.update;
            if (!$scope.approvalItemDetails) {
              throw new Error('invalid approval item');
            }
            switch ($scope.approvalItemId) {
            case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address']:
              initWhitelistTile();
              break;
            }
          }
          /**
        * Initializes the directive's controller state
        * @private
        */
          function init() {
            $scope.state = 'initial';
            initTileDetails();
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        /** Valid pending approval states */
        var validApprovalTypes = [
            'approved',
            'rejected'
          ];
        /**
        * Updates a pending approval's state / and the DOM once set
        * @param {string} approval's new state to set
        * @public
        */
        scope.setApprovalState = function (newState) {
          if (_.indexOf(validApprovalTypes, newState) === -1) {
            throw new Error('Expect valid approval state to be set');
          }
          var data = {
              state: newState,
              id: scope.approvalItem.id,
              wallet: scope.approvalItem.bitcoinAddress
            };
          ApprovalsAPI.update(scope.approvalItem.bitcoinAddress, data).then(function (result) {
            $('#' + scope.approvalItem.id).animate({
              height: 0,
              opacity: 0
            }, 500, function () {
              scope.$apply(function () {
                // remove the approval from the appropriate places
                $rootScope.enterprises.current.deleteApproval(scope.approvalItem.id);
                $rootScope.wallets.all[scope.approvalItem.bitcoinAddress].deleteApproval(scope.approvalItem.id);
                //if the approval results in removing the current user from the wallet
                if (result.info.userChangeRequest && result.info.userChangeRequest.action == 'removed' && result.info.userChangeRequest.userChanged === $rootScope.currentUser.settings.id) {
                  WalletsAPI.removeWalletFromScope($rootScope.wallets.all[scope.approvalItem.bitcoinAddress]);
                  //if the user is inside a wallet (within the 'users' tab)
                  if (UtilityService.Url.getEnterpriseSectionFromUrl() === 'wallets') {
                    $location.path('/enterprise/' + EnterpriseAPI.getCurrentEnterprise() + '/wallets');
                  }
                }
                // handle the DOM cleanup
                $('#' + scope.approvalItem.id).remove();
                scope.$destroy();
                // Update the wallets and recompile the tiles if the update
                // critically affects the state of other tiles
                // E.g. removing any (or the last) whitelist address
                if (scope.actionRequiresTileRefresh(newState)) {
                  // This refetch triggers a recompile of the tile templates
                  // to show the correct current tile states
                  SyncService.sync();
                }
              });
            });
          }).catch(function (error) {
            var failAction = newState === 'approved' ? 'approving' : 'rejecting';
            NotifyService.error('There was an issue ' + failAction + ' this request. Please try your action again.');
          });
        };
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name bgApprovalTileBitcoinWhitelist
 * @description
 * This directive manages the approval tile state for transaction approval requests
 * @example
 *   <span bg-approval-tile-tx-request>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTileTxRequestDirective', []).directive('bgApprovalTileTxRequest', [
  '$modal',
  '$rootScope',
  'ApprovalsAPI',
  'TransactionsAPI',
  'NotifyService',
  'UtilityService',
  'BG_DEV',
  'AnalyticsProxy',
  function ($modal, $rootScope, ApprovalsAPI, TransactionsAPI, NotifyService, UtilityService, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          /** All valid tile view states */
          $scope.viewStates = ['initial'];
          /** object hoding the tasansaction info for submittal */
          $scope.txInfo = null;
          /** handle ui state */
          $scope.processing = null;
          /** Show different templates if the approval is one the currentUser created */
          $scope.userIsCreator = $rootScope.currentUser.settings.id === $scope.approvalItem.creator;
          $scope.resetTxInfo = function () {
            var existingOtp = $scope.txInfo.otp;
            $scope.txInfo = {
              transaction: {},
              passcode: '',
              otp: existingOtp
            };
          };
          /**
        * Initializes the directive's controller state
        * @private
        */
          function init() {
            $scope.state = 'initial';
            $scope.processing = false;
            $scope.txInfo = {
              transaction: {},
              passcode: '',
              otp: ''
            };
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        /** Valid pending approval states */
        var validApprovalTypes = [
            'approved',
            'rejected'
          ];
        /** Triggers otp modal to open if user needs to otp */
        function openModal(params) {
          if (!params || !params.type) {
            throw new Error('Missing modal type');
          }
          var modalInstance = $modal.open({
              templateUrl: 'modal/templates/modalcontainer.html',
              controller: 'ModalController',
              scope: scope,
              size: params.size,
              resolve: {
                locals: function () {
                  return {
                    type: params.type,
                    userAction: BG_DEV.MODAL_USER_ACTIONS.approveSendFunds,
                    wallet: $rootScope.wallets.all[scope.approvalItem.bitcoinAddress]
                  };
                }
              }
            });
          return modalInstance.result;
        }
        /** Subtmit the tx to bitgo and see if it is valid before approving the approval */
        scope.submitTx = function () {
          // Deserialize the tx to submit it
          var deserializedTx;
          try {
            scope.txInfo.transaction = scope.approvalItem.info.transactionRequest;
            deserializedTx = Bitcoin.Transaction.deserialize(Bitcoin.Util.hexToBytes(scope.txInfo.transaction.transaction));
          } catch (error) {
            console.log('Issue when deserializing the transaction');
            NotifyService.error('There is an issue with this transaction. Please refresh the page and try your action again.');
            return;
          }
          // Set variables up for submittal
          var sender = {
              wallet: $rootScope.wallets.all[scope.approvalItem.bitcoinAddress],
              passcode: scope.txInfo.passcode,
              otp: scope.txInfo.otp
            };
          scope.processing = true;
          var tb = new TransactionsAPI.clone(sender, deserializedTx);
          // try to sign the transaction before handling the approval
          tb.signTransaction(scope.txInfo.passcode, scope.txInfo.otp).then(function (transaction) {
            // set the tx on the txInfo object before submitting
            scope.txInfo.tx = transaction.tx();
            scope.submitApproval('approved');
          }).catch(function (error) {
            if (UtilityService.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock }).then(function (result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.otp) {
                    throw new Error('Missing otp');
                  }
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  // set the otp code on the txInfo object before resubmitting it
                  scope.txInfo.otp = result.data.otp;
                  scope.txInfo.passcode = result.data.password;
                  // resubmit the tx on window close
                  scope.submitTx();
                }
              }).catch(function (error) {
                scope.processing = false;
              });
            } else if (UtilityService.API.isPasscodeError(error)) {
              openModal({ type: BG_DEV.MODAL_TYPES.passwordThenUnlock }).then(function (result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  scope.txInfo.passcode = result.data.password;
                  // resubmit to share wallet
                  scope.submitTx();
                }
              }).catch(function (error) {
                scope.processing = false;
              });
            } else {
              scope.processing = false;
              // Otherwise just display the error to the user
              NotifyService.error(error.error || error);
            }
          });
        };
        /**
        * Updates a pending approval's state / and the DOM once set
        * @param {string} approval's new state to set
        * @public
        */
        scope.submitApproval = function (newState) {
          if (_.indexOf(validApprovalTypes, newState) === -1) {
            throw new Error('Expect valid approval state to be set');
          }
          var data = {
              state: newState,
              id: scope.approvalItem.id,
              wallet: scope.approvalItem.bitcoinAddress,
              tx: scope.txInfo.tx
            };
          ApprovalsAPI.update(scope.approvalItem.id, data).then(function (result) {
            // Mixpanel Tracking (currently track only successful tx approvals)
            if (newState === 'approved') {
              // Track the successful approval of a tx
              var metricsData = {
                  walletID: scope.approvalItem.bitcoinAddress,
                  enterpriseID: $rootScope.enterprises.current.id,
                  txTotal: scope.approvalItem.info.transactionRequest.requestedAmount
                };
              AnalyticsProxy.track('ApproveTx', metricsData);
            }
            $('#' + scope.approvalItem.id).animate({
              height: 0,
              opacity: 0
            }, 500, function () {
              scope.$apply(function () {
                // let any listeners know about the approval to do work
                scope.$emit('bgApprovalTileTxRequest.TxApprovalStateSet', result);
                // remove the approval from the appropriate places
                $rootScope.enterprises.current.deleteApproval(scope.approvalItem.id);
                $rootScope.wallets.all[scope.approvalItem.bitcoinAddress].deleteApproval(scope.approvalItem.id);
                // handle the DOM cleanup
                $('#' + scope.approvalItem.id).remove();
                scope.$destroy();
              });
            });
          }).catch(function (error) {
            scope.processing = false;
            var failAction = newState === 'approved' ? 'approving' : 'rejecting';
            NotifyService.error('There was an issue ' + failAction + ' this request. Please try your action again.');
          });
        };
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name bgApprovalsFilter
 * @description
 * Filters approvals based on a type provided
 * @example
 *   <tr ng-repeat="item in items | bgApprovalsFilter:false:'transactionRequest'"></tr>
 */
angular.module('BitGo.Common.BGApprovalsFilter', []).filter('bgApprovalsFilter', [
  'BG_DEV',
  function (BG_DEV) {
    return function (approvalItems, filterByPolicyId, filterTarget) {
      function filterByBitGoPolicyId() {
        if (!_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, filterTarget)) {
          throw new Error('Invalid bitgo policy id');
        }
        return _.filter(approvalItems, function (approvalItem) {
          if (!approvalItem.info.policyRuleRequest) {
            return;
          }
          return approvalItem.info.policyRuleRequest.update.id === filterTarget;
        });
      }
      function filterByType() {
        var VALID_APPROVAL_TYPES = {
            'transactionRequest': true,
            'userChangeRequest': true
          };
        if (!_.has(VALID_APPROVAL_TYPES, filterTarget)) {
          throw new Error('Invalid approval type');
        }
        return _.filter(approvalItems, function (approvalItem) {
          return approvalItem.info.type === filterTarget;
        });
      }
      if (filterByPolicyId) {
        return filterByBitGoPolicyId();
      }
      return filterByType();
    };
  }
]);/*
  Notes:
  - This filter takes a bitcoin value input and converts from one bitcoin
    unit into another

  - E.g.:
  @param {String} decorator - 'symbol'|'name'|null
  @param {String} toType -  the target unit type: BTC|bits|satoshis (defaults to setting in $rootScope.currency)
  @param {String} fromType - the src unit type: BTC|bits|satoshis (defaults to satoshis)
  @param {Boolean} valueIfNull - return string instead of typical emdash (if bitcoinValue is undefined)
  @param {Boolean} useFullPrecision - use full precision

  {{ 100000000 | bgBitcoinFormat:'name' }} => '1.0000 BTC'
  {{ 50000000 | bgBitcoinFormat:'symbol' }} => 'Ƀ 0.5000'
  {{ 7 | bgBitcoinFormat:null:'bits':'BTC' }} => '7,000,000'
  {{ undefined | bgBitcoinFormat:null:null:null:'Unlimited' }} => 'Unlimited'
*/
angular.module('BitGo.Common.BGBitcoinFormatFilter', []).filter('bgBitcoinFormat', [
  '$rootScope',
  'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function (bitcoinValue, decorator, toType, fromType, valueIfNull, useFullPrecision) {
      // default to satoshis as fromType
      fromType = fromType || 'satoshis';
      // If toType not explicitly provided, use user setting
      if (!toType) {
        var currency = $rootScope.currency;
        if (!currency) {
          console.error('Need valid $rootScope currency object or explicit toType');
          return;
        }
        toType = currency.bitcoinUnit;
      }
      var params = {
          BTC: {
            modifier: 100000000,
            decimals: 4,
            fullDecimals: 8,
            name: 'BTC',
            symbol: '\u0243'
          },
          BTC8: {
            modifier: 100000000,
            decimals: 8,
            fullDecimals: 8,
            name: 'BTC',
            symbol: '\u0243'
          },
          bits: {
            modifier: 100,
            decimals: 0,
            fullDecimals: 2,
            name: 'bits',
            symbol: '\u0180'
          },
          satoshis: {
            modifier: 1,
            decimals: 0,
            fullDecimals: 0,
            name: 'satoshis',
            symbol: 's'
          }
        };
      var prefix = '';
      var suffix = '';
      switch (decorator) {
      case 'symbol':
        prefix = params[toType].symbol + ' ';
        break;
      case 'name':
        suffix = ' ' + params[toType].name;
        break;
      }
      var decorate = function (s) {
        return prefix + s + suffix;
      };
      if (isNaN(parseFloat(bitcoinValue, 10))) {
        if (valueIfNull === null || valueIfNull === undefined) {
          valueIfNull = '\u2014';  // em-dash
        }
        return decorate(valueIfNull);
      }
      // ensure valid types
      if (!fromType || _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, fromType) === -1 || !toType || _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, toType) === -1) {
        throw new Error('Need valid bitcoin unit types when converting bitcoin units');
      }
      var multiplier = params[fromType].modifier / params[toType].modifier;
      var value = bitcoinValue * multiplier;
      if (!value) {
        return decorate('0');
      }
      var decimals = useFullPrecision ? params[toType].fullDecimals : params[toType].decimals;
      return decorate(_.string.numberFormat(value, decimals));
    };
  }
]);/*
  Notes:
  - This filter takes an input and formats the value according to an
  attribute type ('currency' || 'bitcoin')

  - E.g.:
    Note -> assume 350 current price, and currency is USD
  {{ 1 | bgBitcoinToCurrency:'BTC' }} => 350.00
  {{ 1 | bgBitcoinToCurrency:'bits' }} => .35
  {{ 10000000 | bgBitcoinToCurrency:'satoshis' }} => 350
*/
angular.module('BitGo.Common.BGBitcoinToCurrencyFilter', []).filter('bgBitcoinToCurrency', [
  '$rootScope',
  'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function (bitcoinValue, bitcoinUnit) {
      // If unit not provided, assume satoshis
      bitcoinUnit = bitcoinUnit || 'satoshis';
      bitcoinValue = bitcoinValue || 0;
      var currency = $rootScope.currency;
      if (!currency || !currency.data) {
        console.error('Need valid $rootScope currency.data to convert bitcoin into currency');
        return;
      }
      if (_.isEmpty(currency.data.current)) {
        return currency.symbol + ' \u2014';  // em-dash
      }
      if (!bitcoinUnit || _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, bitcoinUnit) === -1) {
        throw new Error('Need valid bitcoinUnit when converting bitcoin into currency');
      }
      var multiplier;
      switch (bitcoinUnit) {
      case 'BTC':
      case 'BTC8':
        multiplier = 1;
        break;
      case 'bits':
        multiplier = 0.000001;
        break;
      case 'satoshis':
        multiplier = 1e-8;
        break;
      }
      var newValue = bitcoinValue * multiplier;
      var result = newValue * $rootScope.currency.data.current.last;
      return currency.symbol + ' ' + _.string.numberFormat(result, 2);
    };
  }
]);/*
  Filter to capitalize the first character of a word
  {{ foo | bgCapitalize }} => Foo
  {{ bar | bgCapitalize }} => Bar
*/
angular.module('BitGo.Common.BGCapitalizeFilter', []).filter('bgCapitalize', [function () {
    return function (input) {
      return !!input ? input.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }) : '';
    };
  }]);/**
 * @ngdoc filter
 * @name BgCenterEllipsis
 * @description
 * This filter cuts a string to a given size by hiding the middle portion which is replaced by '...'
 * It leaves the first and last few characters as is
 * @example
 *   <div>{{ transactions.send.address | bgCenterEllipsis:12 }}</div>
 */
angular.module('BitGo.Common.BGCenterEllipsisFilter', []).filter('bgCenterEllipsis', function () {
  return function (address, maxLength) {
    if (!maxLength || isNaN(maxLength)) {
      throw new Error('missing params for BGAddressLengthFilter');
    }
    if (address) {
      var charLength = maxLength - 3;
      var oneSideLength = Math.floor(charLength / 2);
      if (address.length > maxLength) {
        var transformedAddress = address.substring(0, oneSideLength);
        transformedAddress = transformedAddress + '...';
        transformedAddress = transformedAddress + address.substring(address.length - oneSideLength, address.length);
        return transformedAddress;
      }
    }
    return address;
  };
});/**
 * @ngdoc directive
 * @name walletDeleteRow
 * @description
 * Directive to manage the delete functionality of a wallet
 * @example
 *   <div bg-confirm-action></div>
 */
angular.module('BitGo.Common.BGConfirmActionDirective', []).directive('bgConfirmAction', [
  '$rootScope',
  '$location',
  'NotifyService',
  'WalletsAPI',
  'BG_DEV',
  function ($rootScope, $location, Notify, WalletsAPI, BG_DEV) {
    return {
      restrict: 'A',
      scope: true,
      controller: [
        '$scope',
        function ($scope) {
          // variable on scope used to show confirmation message
          $scope.confirmationMessage = false;
          // user initiates delete
          $scope.initiateAction = function () {
            $scope.confirmationMessage = true;
          };
          // If user does not confirm delete
          $scope.cancelAction = function () {
            $scope.confirmationMessage = false;
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name bgDynamicTableRowManager
 * @description
 * This directive allows us to specify a handling directive for a <tr> element.
 * This is needed because of how the DOM expects tr/td nesting
 * @example
 *   <tr bg-dynamic-table-row-manager ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Common.BGDynamicTableRowManagerDirective', []).directive('bgDynamicTableRowManager', [
  '$compile',
  '$rootScope',
  'BG_DEV',
  function ($compile, $rootScope, BG_DEV) {
    return {
      restrict: 'A',
      terminal: true,
      priority: 900,
      compile: function compile(element, attrs) {
        return {
          pre: function preLink(scope, element, attrs, controller) {
            function initTemplate() {
              /**
               * the HTML-valid string value of the directive that will
               * manage the <tr> element that is being built
               */
              var rowManager;
              /**
               * Gets the string value of the managing directive we
               * want to use to manage the <tr> tile that we're biulding in the DOM
               */
              function getRowManager(approvalItemType) {
                var managingDirective = '';
                switch (approvalItemType) {
                case 'policyRuleRequest':
                  var id = scope.approvalItem.info.policyRuleRequest.update.id;
                  if (!id || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, id)) {
                    throw new Error('Invalid BitGo policy id');
                  }
                  managingDirective = 'bg-approval-tile-policy-request';
                  break;
                case 'userChangeRequest':
                  managingDirective = 'bg-approval-tile-policy-request';
                  break;
                case 'transactionRequest':
                  managingDirective = 'bg-approval-tile-tx-request';
                  break;
                default:
                  throw new Error('Expected valid approval type. Got: ' + approvalItemType);
                }
                return managingDirective;
              }
              /** get the tile's state manager */
              if (scope.approvalItem && scope.approvalItem.info.type) {
                rowManager = getRowManager(scope.approvalItem.info.type);
              }
              /** dynamically set the tile state manager */
              element.attr(rowManager, 'true');
              /** remove the attribute to avoid an infinite loop */
              element.removeAttr('bg-dynamic-table-row-manager');
              element.removeAttr('data-bg-dynamic-table-row-manager');
              /** remove the ng-repeat so it doesn't trigger another round of compiling */
              element.removeAttr('ng-repeat');
              element.removeAttr('data-ng-repeat');
              /** compile the new DOM element with the managing directive */
              $compile(element)(scope);
            }
            initTemplate();
            // Listen for the latest wallets to be set; recompile templates
            // to be reflective of the latest policy state
            var killWalletsSetListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function () {
                initTemplate();
              });
            // Clean up the listeners
            scope.$on('$destroy', function () {
              killWalletsSetListener();
            });
          }
        };
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name bgEnterpriseOrderingFilter
 * @description
 * Sorts enterprises; puts personal at the top always
 * @example
 *   <div ng-repeat="enterprise in enterprises.all | bgEnterpriseOrderingFilter"></div>
 */
angular.module('BitGo.Common.BGEnterpriseOrderingFilter', []).filter('bgEnterpriseOrderingFilter', [
  '$rootScope',
  'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function (enterprises) {
      if (!enterprises) {
        return;
      }
      var sorted = [];
      var personal = _.filter(enterprises, function (enterprise) {
          return enterprise.isPersonal;
        });
      var rest = _.filter(enterprises, function (enterprise) {
          return !enterprise.isPersonal;
        });
      return sorted.concat(personal, rest);
    };
  }
]);/*
  Notes:
  - This filter takes a list (object) of users on a given enterprise and
  a selectedUserId - it returns a filtered object of wallets that the selected
  user has access to on the enterprise
*/
angular.module('BitGo.Common.BGEnterpriseWalletsByUser', []).filter('bgEnterpriseWalletsByUser', [
  '$rootScope',
  function ($rootScope) {
    return function (enterpriseUsers, selectedUserId) {
      if (!selectedUserId) {
        console.log('Cannot filter enterpriseWallets by user: Missing a userId');
        return null;
      }
      if (_.isEmpty(enterpriseUsers)) {
        console.log('Cannot filter enterpriseWallets by user: Missing a list of wallets on the enterprise');
        return null;
      }
      return enterpriseUsers[selectedUserId];
    };
  }
]);/**
 * @ngdoc directive
 * @name bgFocusUI
 * @description
 * Directive to highlight styled select tags when in focus
 * @example
 *   <select bg-focus-ui></select>
 */
angular.module('BitGo.Common.BGFocusUiDirective', []).directive('bgFocusUi', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          $scope.highlightParent = function (ev) {
            angular.element(ev.target).parent().addClass('highlight');
          };
          $scope.removeHighlight = function (ev) {
            angular.element(ev.target).parent().removeClass('highlight');
          };
        }
      ]
    };
  }
]);angular.module('BitGo.Common.BGFocusWhen', []).directive('bgFocusWhen', [
  '$parse',
  '$timeout',
  function ($parse, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        scope.$watch('state', function (newValue, oldValue, scope) {
          // The focusWhen attribute can either be a value or a function,
          // and we will evaluate its truth to determine whether or not to focus
          var focusHandler = $parse(attrs.bgFocusWhen);
          // invoke it passing the scope as the context
          var shouldFocus = focusHandler(scope);
          if (shouldFocus) {
            // ensure the dom is available - this is primarily an issue
            // when using bootstrap/js tabs
            $timeout(function () {
              if (elem) {
                angular.element(elem).focus();
              }
            }, 250);
          } else {
            $timeout(function () {
              if (elem) {
                angular.element(elem).blur();
              }
            }, 250);
          }
        });
      }
    };
  }
]);/*
  Notes:
  - This directive handles the display and cancellation of errors on a form
  - when added to a form element, the form's scope inherits all methods from
    this controller
*/
angular.module('BitGo.Common.BGFormError', []).directive('bgFormError', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'E',
      templateUrl: '/common/templates/formerror.html',
      controller: [
        '$scope',
        function ($scope) {
          // error shown in the markup
          $scope.formError = null;
          $scope.setFormError = function (msg) {
            if (typeof msg !== 'string') {
              throw new Error('Expected string');
            }
            $scope.formError = msg || 'This form has an invalid field.';
          };
          $scope.clearFormError = function () {
            $scope.formError = null;
          };
          // listen for changes to the formError object and clear
          // the error if it no longer remains
          var killErrorWatch = $scope.$watch('formError', function (error) {
              if (!error) {
                $scope.clearFormError();
              }
            });
          // Clean up the listeners when the scope goes away
          $scope.$on('$destroy', function () {
            killErrorWatch();
          });
        }
      ]
    };
  }
]);/*
  Notes:
  - This directive fetches the label for an address based on the address and a wallet ID
  - E.g.: <span bg-get-address-label address-id="123abcd" wallet-id="456erty">{{ label }}</span>
*/
angular.module('BitGo.Common.BGGetAddressLabelDirective', []).directive('bgGetAddressLabel', [
  '$rootScope',
  'LabelsAPI',
  function ($rootScope, LabelsAPI) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element, attrs) {
        attrs.$observe('addressId', function (val) {
          // When the addressId changes, walletId might not be loaded. Only fetch when both are present.
          if (!val || !attrs.walletId) {
            return;
          }
          // Otherwise fetch the label, trying the cache first
          LabelsAPI.get(attrs.addressId, attrs.walletId).then(function (label) {
            scope.label = label ? label.label : attrs.addressId;
          }).catch(function (error) {
            console.log('Error getting walletId ' + val + ': ' + error);
          });
        });
      }
    };
  }
]);/*
  Notes:
  - This directive fetches the local data for a wallet based on the wallet id provided
  - E.g.: <span bg-get-local-wallet wallet-id="123abcd">{{ wallet.data.label }}</span>
*/
angular.module('BitGo.Common.BGGetLocalWalletDirective', []).directive('bgGetLocalWallet', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        attrs.$observe('walletId', function (val) {
          // Don't fetch if there's no id
          if (!val) {
            return;
          }
          // set the wallet from the in-app store of wallets
          var wallet = $rootScope.wallets.all[val];
          scope.label = wallet ? wallet.data.label : val;
        });
      }
    };
  }
]);/*
  Notes:
  - This directive fetches the details for a bitgo user based on the user's id
  - E.g.: <span bg-get-user user-id="123abcd">{{ user.settings.name.full }}</span>
*/
angular.module('BitGo.Common.BGGetUser', []).directive('bgGetUser', [
  '$rootScope',
  'UserAPI',
  function ($rootScope, UserAPI) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element, attrs) {
        attrs.$observe('userId', function (val) {
          // Don't fetch if there's no id
          if (!val) {
            return;
          }
          // If the ID is that of the currentUser, return the rootScope's user
          if (val === $rootScope.currentUser.settings.id) {
            scope.user = $rootScope.currentUser;
            return;
          }
          // Otherwise fetch the user, trying the cache first
          UserAPI.get(val, true).then(function (user) {
            scope.user = user;
          }).catch(function (error) {
            console.log('Error getting userId ' + val + ': ' + error);
          });
        });
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name BGGravatarDirective
 * @requires md5
 * @description
 * Directive to include a gravatar image given a user's email address.
 * @param {string} email The email address to fetch a gravatar for
 * @param {string} name The alt-text for the image
 * @param {string} height The height of the image
 * @param {string} width The width of the image
 * @example
 *   <span bg-gravatar email="john@doe.com"></span>
 */
angular.module('BitGo.Common.BGGravatarDirective', []).directive('bgGravatar', [
  'md5',
  function (md5) {
    return {
      restrict: 'AE',
      replace: true,
      scope: {
        name: '@',
        height: '@',
        width: '@',
        email: '@'
      },
      link: function (scope, el, attr) {
        scope.$watch('email', function (newValue, oldValue, scope) {
          if (newValue) {
            scope.emailHash = md5.createHash(newValue);
          }
        });
      },
      template: '<img alt="{{ name }}" height="{{ height }}"  width="{{ width }}" src="https://secure.gravatar.com/avatar/{{ emailHash }}.jpg?s={{ width }}&d=mm">'
    };
  }
]);angular.module('BitGo.Common.BGInfiniteScrollDirective', []).directive('bgInfiniteScroll', [
  '$parse',
  '$timeout',
  '$rootScope',
  function ($parse, $timeout, $rootScope) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        var element = elem[0];
        // We scroll the entire page, so we need the window element
        $(window).scroll(function () {
          if ($(document).scrollTop() + element.offsetHeight >= element.scrollHeight - 250) {
            // Do not allow handler calls when a request is in flight
            if ($rootScope.handlerRequestInFlight) {
              return;
            }
            scope.$apply(attrs.whenScrolled);
          }
        });
      }
    };
  }
]);angular.module('BitGo.Common.BGInfiniteScrollService', []).factory('InfiniteScrollService', [
  '$rootScope',
  '$timeout',
  function ($rootScope, $timeout) {
    // this lets us know if there is a handler request in flight
    $rootScope.handlerRequestInFlight = false;
    // Handle the app's global (window) scroll event if there is one attached
    $rootScope.handleScroll = function () {
      // Don't allow subsequent handler calls while a request is out
      if (!$rootScope.infiniteScrollHandler || $rootScope.handlerRequestInFlight) {
        return;
      }
      $rootScope.handlerRequestInFlight = true;
      $rootScope.infiniteScrollHandler().finally(function () {
        $rootScope.handlerRequestInFlight = false;
      });
    };
    function clearScrollHandler() {
      $rootScope.infiniteScrollHandler = null;
    }
    function setScrollHandler(handler) {
      if (!handler || typeof handler !== 'function') {
        throw new Error('Expected a function');
      }
      if ($rootScope.infiniteScrollHandler) {
        console.log('Existing scrollHandler on $rootScope -- overwriting with a new scrollHandler');
        clearScrollHandler();
      }
      $rootScope.infiniteScrollHandler = handler;
    }
    function init() {
      $rootScope.infiniteScrollHandler = null;
    }
    init();
    // In-client API
    return {
      setScrollHandler: setScrollHandler,
      clearScrollHandler: clearScrollHandler
    };
  }
]);angular.module('BitGo.Common.BGInputNumbersOnly', []).directive('bgInputNumbersOnly', [
  '$timeout',
  function ($timeout) {
    return {
      require: 'ngModel',
      restrict: 'A',
      scope: {},
      link: function (scope, element, attrs, ctrl) {
        // $setViewValue() and $render triggers the parser a second time.
        // Avoid an infinite loop by using the last known returned value
        var RETURNED_VAL;
        function inputValue(incomingVal) {
          // Also, update the last known returned value (to avoid angular infinite looping)
          var value = incomingVal.toString();
          if (value) {
            // parse out all non-digits (and possibly all but one decimal)
            if (attrs.allowDecimals === 'true') {
              RETURNED_VAL = value.replace(/[^0-9\.]/g, '').replace(/(\..*)\./g, '$1');
            } else {
              RETURNED_VAL = value.replace(/[^0-9]/g, '');
            }
            // trim to maxlength
            RETURNED_VAL = RETURNED_VAL.slice(0, attrs.maxLength);
            $timeout(function () {
              ctrl.$setViewValue(RETURNED_VAL);
              ctrl.$render();
            }, 0);
            return RETURNED_VAL;
          }
        }
        // conversion "view -> model"
        ctrl.$parsers.unshift(inputValue);
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name bgInputToSatoshiConverter
 * @description
 * Converts an input from the rootScope's bitcoin unit to satoshis
 */
angular.module('BitGo.Common.BGInputToSatoshiConverterDirective', []).directive('bgInputToSatoshiConverter', [
  '$rootScope',
  '$parse',
  '$timeout',
  function ($rootScope, $parse, $timeout) {
    return {
      restrict: 'A',
      require: '^ngModel',
      link: function (scope, elem, attrs, ngModel) {
        // $setViewValue() and $render triggers the parser a second time.
        // Avoid an infinite loop by using the last known returned value
        var RETURNED_VAL;
        // valid types to use in conversions
        var TYPES = {
            BTC: {
              modifier: 100000000,
              decimalLength: 8
            },
            BTC8: {
              modifier: 100000000,
              decimalLength: 8
            },
            bits: {
              modifier: 100,
              decimalLength: 2
            },
            satoshis: {
              modifier: 1,
              decimalLength: 0
            }
          };
        /**
        * sets error when present. Requires name attribute to be set.
        * @param value {Boolean} - If error is present or not
        * @private
        */
        function setError(value) {
          if (attrs.name) {
            var err = attrs.name;
            scope[err + 'Error'] = value;
          }
        }
        setError(false);
        // app's current bitcoin unit
        var unit = $rootScope.currency.bitcoinUnit;
        /**
        * checks if the value entered is divisible by one satoshi. If so, sets the error
        * @param value {String} value from the input
        * @param type {String} type to convert from
        * @private
        */
        function checkSatoshiError(limitValue, type) {
          if (!limitValue || !type) {
            setError(false);
            return;
          }
          // try to get the number after the decimal place
          var checkDecimal = limitValue.split('.');
          if (checkDecimal.length > 1) {
            decimalLength = checkDecimal[1].length;
            // check if the decimal length is greater than allowed for the currency type
            if (decimalLength > TYPES[type].decimalLength) {
              if (Number(checkDecimal[1].substr(TYPES[type].decimalLength)) > 0) {
                setError(true);
                return;
              }
            }
          }
          setError(false);
        }
        /**
        * converts the view value to a satoshi value
        * @param value {String} value from the input
        * @param type {String} type to convert from
        * @private
        * @returns {Int} converted amount
        */
        function viewToModel(value, type) {
          var satoshiValue;
          if (!value && !value.toString()) {
            return;
          }
          if (!_.has(TYPES, type)) {
            throw new Error('Invalid type');
          }
          // parse out all non-digits and all but one decimal and trim to maxlength
          // Also, update the last known returned value (to avoid angular infinite looping)
          RETURNED_VAL = value.replace(/[^0-9\.]/g, '').replace(/(\..*)\./g, '$1');
          RETURNED_VAL = RETURNED_VAL.slice(0, attrs.maxLength);
          // set the view value
          $timeout(function () {
            ngModel.$setViewValue(RETURNED_VAL);
            ngModel.$render();
          }, 0);
          checkSatoshiError(RETURNED_VAL, type);
          satoshiValue = Number(RETURNED_VAL) * TYPES[type].modifier;
          return Math.round(satoshiValue);
        }
        // Event Handlers
        elem.bind('focus', function () {
          setError(false);
        });
        elem.bind('focusout', function () {
          setError(false);
        });
        /**
        * converts the model value (satoshi) to the correct bitcoin value
        * @param value {String} value from the input
        * @param type {String} type to convert from
        * @private
        * @returns {Int} converted amount
        */
        function modelToView(value, type) {
          if (value && !value.toString()) {
            return;
          }
          if (!_.has(TYPES, type)) {
            throw new Error('Invalid type');
          }
          return value / TYPES[type].modifier;
        }
        // conversion "view -> model"
        ngModel.$parsers.unshift(function (value) {
          return viewToModel(value, unit);
        });
        // conversion "model -> view"
        ngModel.$formatters.unshift(function formatter(modelValue) {
          return modelToView(modelValue, unit);
        });
      }
    };
  }
]);angular.module('BitGo.Common.BGInputValidator', []).directive('bgInputValidator', [function () {
    return {
      restrict: 'A',
      require: '^ngModel',
      controller: [
        '$scope',
        function ($scope) {
          $scope.$on('SetFieldError', function (event, data) {
            var err = data.field;
            $scope[err + 'Error'] = data.visibleError;
          });
        }
      ],
      link: function (scope, elem, attrs, ngModel) {
        // validate if an input is a valid BIP32 xpub
        function xpubValid(xpub) {
          try {
            new Bitcoin.BIP32(xpub);
          } catch (error) {
            return false;
          }
          return true;
        }
        // validate if an input is a valid email
        function emailValid(email) {
          return /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(email);
        }
        // validate if an input is a valid phone number
        function phoneValid(phone) {
          if (!phone) {
            return false;
          }
          if (phone[0] !== '+') {
            phone = '+'.concat(phone);
          }
          return intlTelInputUtils.isValidNumber(phone);
        }
        function setVisibleErrorState() {
          if (!ngModel.$touched || ngModel.$viewValue === '') {
            return;
          }
          var modelInvalid = ngModel.$invalid;
          switch (attrs.type) {
          case 'email':
            modelInvalid = !emailValid(ngModel.$viewValue);
            break;
          case 'tel':
            modelInvalid = !phoneValid(ngModel.$viewValue);
            break;
          case 'xpub':
            modelInvalid = !xpubValid(ngModel.$viewValue);
            break;
          }
          var visibleError = modelInvalid && ngModel.$dirty && !ngModel.focused;
          // DOM access for setting focus was async, so
          // $apply to get back into angular's run loop
          scope.$apply(function () {
            scope.$emit('SetFieldError', {
              field: attrs.name,
              visibleError: visibleError
            });
          });
        }
        function setFocusState() {
          ngModel.focused = elem[0] === document.activeElement;
        }
        // Event Handlers
        elem.bind('focus', function () {
          setFocusState();
          setVisibleErrorState();
        });
        elem.bind('focusout', function () {
          setFocusState();
          ngModel.$setTouched();
          setVisibleErrorState();
        });
        elem.bind('blur', function () {
          setFocusState();
          ngModel.$setTouched();
          setVisibleErrorState();
        });
      }
    };
  }]);/**
 * @ngdoc directive
 * @name bgIntlTelInput
 * @description
 * This directive creates the dropdown for choosing a country when selecting a phone number
 * It also formats the phone number entered
 * it requires ngmodel to be initialised along with it
 * @example
 *   <bg-intl-tel-input name="phone" type="phone" ng-model="user.settings.phone.phone" bg-input-validator></bg-intl-tel-input>
 */
angular.module('BitGo.Common.BGIntlTelInputDirective', []).directive('bgIntlTelInput', function () {
  return {
    replace: true,
    restrict: 'E',
    require: 'ngModel',
    template: '<input type="tel" class="inputText-input inputText-input--phoneNumber"/>',
    link: function (scope, element, attrs, ngModel) {
      //Need to manually adjust the view value so it reflects in the UI
      var read = function () {
        ngModel.$setViewValue(element.intlTelInput('getNumber'));
      };
      //Set the initial value after ngmodel renders
      ngModel.$render = function () {
        element.intlTelInput('setNumber', ngModel.$modelValue || '');
      };
      element.intlTelInput({
        autoFormat: true,
        preventInvalidNumbers: true
      });
      //Listen for any changes that happen on the element
      element.on('focus blur keyup change', function () {
        scope.$apply(read);
      });
      // Always clear the error if user is selecting a flag
      angular.element('.flag-dropdown').click(function () {
        scope.$apply(function () {
          scope.$emit('SetFieldError', {
            field: 'phone',
            visibleError: false
          });
        });
      });
    }
  };
});/*

 * @ngdoc filter
 * @name bgIsObjectEmpty
 * @param {object} objects - The object you want to check if empty
 * @description
 * This filter checks whether the object passed in is empty pr not
   Particularly useful for ng-show/ng-hide
 * @example
 * <div ng-show="wallets.all | bgIsObjectEmpty">

    {{ {foo: "bar"} | bgIsObjectEmpty }} => false
    {{ {} | bgIsObjectEmpty }} => true
*/
angular.module('BitGo.Common.BGIsObjectEmptyFilter', []).filter('bgIsObjectEmpty', function () {
  var object;
  return function (objects) {
    for (var object in objects) {
      if (objects.hasOwnProperty(object)) {
        return false;
      }
    }
    return true;
  };
});/**
 * @ngdoc directive
 * @name bgJsonDecrypt
 * @description
 * decrypts the json from a box D keycard input
 * @example
 *   <input bg-json-decrypt recovery-info="foo" wallet-data="bar" />
 */
angular.module('BitGo.Common.BGJsonDecryptDirective', []).directive('bgJsonDecrypt', [
  '$parse',
  '$timeout',
  'UtilityService',
  function ($parse, $timeout, UtilityService) {
    return {
      restrict: 'A',
      require: '^ngModel',
      scope: {
        recoveryInfo: '=',
        walletData: '='
      },
      link: function (scope, elem, attrs, ngModel) {
        // the json from the input
        var json;
        /**
        * Decrypt json for encrypted passcode with the
        * @returns unencryptedPasscode {String}
        * @private
        */
        function decryptJSON() {
          try {
            var unencryptedPasscode = UtilityService.Crypto.sjclDecrypt(scope.recoveryInfo.passcodeEncryptionCode, json);
            return unencryptedPasscode;
          } catch (e) {
            return undefined;
          }
        }
        /**
        * Attempt to decrypt the wallet passcode and then set
        * the decrypted value on the current wallet being recovered
        * @private
        */
        function tryDecrypt() {
          json = ngModel.$viewValue.replace(/ /g, '');
          try {
            JSON.parse(json);
          } catch (error) {
            console.error('Invalid Box D input: invalid JSON');
            return false;
          }
          // update the view value with valid json
          ngModel.$setViewValue(json);
          ngModel.$render();
          // set the password on the wallet recovery data object
          scope.walletData.decryptedKeycardBoxD = decryptJSON();
        }
        elem.bind('change', function () {
          tryDecrypt();
        });
        elem.bind('focus', function () {
          tryDecrypt();
        });
        elem.bind('focusout', function () {
          tryDecrypt();
        });
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name bgListActiveTileManager
 * @description
 * Manages list tiles which can be edited. Toggles them open and close based on the tile clicked
 * Depends on:
 *    bg-state-manager
 *    A tile directive such as wallet-policy-whitelist-tile is expected to be used on each sub-tile
 * @example
 *   <tr bg-list-active-tile-manager bg-state-manager ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Common.BGListActiveTileManagerDirective', []).directive('bgListActiveTileManager', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // index of the current tile that is being labeled/modified
          $scope.currentTileIdx = null;
          /**
         * Lets us know what tile is being edited
         */
          function isCurrentTile(index) {
            return $scope.currentTileIdx === index;
          }
          /**
         * Closes the current tile being edited
         */
          $scope.closeCurrentTile = function () {
            $scope.currentTileIdx = null;
          };
          /**
         * Opens a single list tile to edit the label
         * @param index {String}
         */
          $scope.toggleActiveTile = function (tileItem) {
            // check parameters
            if (!tileItem || typeof tileItem.index === 'undefined') {
              console.log('tileItem missing properties');
              return;
            }
            // if user is viewer, he cannot change address labels
            if (!$rootScope.wallets.current.isRoleViewer()) {
              // if the user is clicking on the existing open tile, close it
              if (isCurrentTile(tileItem.index)) {
                $scope.closeCurrentTile();
                return;
              }
              // if the user selects another tile, close the current one before
              // opening the next one
              if ($scope.currentTileIdx) {
                $scope.closeCurrentTile();
              }
              $scope.currentTileIdx = tileItem.index;
            }
          };
          // listen for whitelist tile to close
          var killWhitelistTileCloseWatch = $scope.$on('walletPolicyWhitelistTile.CloseCurrentTile', function (evt, data) {
              $scope.closeCurrentTile();
            });
          // listen for receive tile to close
          var killReceiveTileCloseWatch = $scope.$on('walletReceiveAddressTile.CloseCurrentTile', function (evt, data) {
              $scope.closeCurrentTile();
            });
          /**
         * Clean up the listeners
         */
          $scope.$on('$destroy', function () {
            killWhitelistTileCloseWatch();
            killReceiveTileCloseWatch();
          });
        }
      ]
    };
  }
]);/*

 * @ngdoc filter
 * @name bgOrderObjectsBy

 * @param {items} objects - The object you want to order
 * @param {key} objects - The key which you want to order things by
 * @param {reverse} boolean - Lets you order in the reverse order

 * @description
 * This filter orders objects based on the keys
   (The built in orderBy filter in Angular only does arrays)

 * @example
 * <div ng-repeat="wallet in wallets.all | bgOrderObjectsBy:'data.label'">
 * {{ item in items | bgOrderObjectsBy:'color':true }}
*/
angular.module('BitGo.Common.BGOrderObjectsByFilter', []).filter('bgOrderObjectsBy', function () {
  var object;
  return function (objects, key, reverse) {
    // clone object so that objet passed in is not directly modified
    var items = _.clone(objects);
    if (!items || _.isEmpty(items)) {
      return;
    }
    if (!key) {
      throw new Error('missing sort key');
    }
    var sortBy = [];
    var sorted = [];
    function getValueFromKeys(item, keys) {
      _.forEach(keys, function (key) {
        if (_.has(item, key)) {
          item = item[key];
        } else {
          throw new Error('Expected object key to exist');
        }
      });
      return item;
    }
    var keys = key.split('.');
    _.forIn(items, function (item) {
      sortBy.push(getValueFromKeys(item, keys));
    });
    sortBy.sort(function (a, b) {
      return a > b ? 1 : -1;
    });
    if (reverse) {
      sortBy.reverse();
    }
    _.forEach(sortBy, function (sortVal) {
      _.forIn(items, function (item, itemKey) {
        var label = getValueFromKeys(item, keys);
        if (label === sortVal) {
          sorted.push(item);
          // delete properties from the object so that if there are objects with the same label, they don't get counted twice
          delete items[itemKey];
        }
      });
    });
    return sorted;
  };
});angular.module('BitGo.Common.BGPasswordStrength', []).directive('bgPasswordStrength', function () {
  return {
    restrict: 'A',
    scope: {
      passwordStrength: '=bgPasswordStrength',
      onPasswordChange: '&onPasswordChange'
    },
    link: function (scope, element, attr) {
      var priorScore = 0;
      var checkPassword = function () {
        if (typeof zxcvbn != 'undefined') {
          var password = element[0].value;
          scope.passwordStrength = zxcvbn(password);
          var crack_time = scope.passwordStrength.crack_time * 1.5;
          var crack_time_display;
          // Compute the "time to crack" sentence
          var seconds_per_minute = 60;
          var seconds_per_hour = seconds_per_minute * 60;
          var seconds_per_day = seconds_per_hour * 24;
          var seconds_per_month = seconds_per_day * 30;
          var seconds_per_year = seconds_per_month * 12;
          var seconds_per_decade = seconds_per_year * 10;
          var seconds_per_century = seconds_per_decade * 10;
          if (crack_time < seconds_per_minute * 2) {
            crack_time_display = 'about a minute';
          } else if (crack_time < seconds_per_hour * 2) {
            var minutes = Math.round(crack_time / seconds_per_minute);
            crack_time_display = 'about ' + minutes + ' minutes';
          } else if (crack_time < seconds_per_day * 2) {
            var hours = Math.round(crack_time / seconds_per_hour);
            crack_time_display = 'about ' + hours + ' hours';
          } else if (crack_time < seconds_per_month * 2) {
            var days = Math.round(crack_time / seconds_per_day);
            crack_time_display = 'about ' + days + ' days';
          } else if (crack_time < seconds_per_year * 2) {
            var months = Math.round(crack_time / seconds_per_month);
            crack_time_display = 'about ' + months + ' months';
          } else if (crack_time < seconds_per_decade * 2) {
            var years = Math.round(crack_time / seconds_per_year);
            crack_time_display = 'about ' + years + ' years';
          } else if (crack_time < seconds_per_century) {
            var decades = Math.round(crack_time / seconds_per_decade);
            crack_time_display = 'about ' + decades + ' decades';
          } else {
            crack_time_display = 'more than a century';
          }
          scope.passwordStrength.crack_time_display = crack_time_display;
          // Compute details about how this password was cracked
          var types = [];
          var passwordDetails = '';
          scope.passwordStrength.match_sequence.forEach(function (match, index) {
            var type;
            switch (match.pattern) {
            case 'dictionary':
              type = 'the ' + match.dictionary_name + ' dictionary';
              break;
            case 'date':
              type = 'a simple date';
              break;
            case 'sequence':
              type = 'a pattern sequence';
              break;
            case 'spatial':
              type = 'keys that are close to each other on the keyboard';
              break;
            case 'digits':
              type = 'easy to guess digits';
              break;
            }
            if (type && types.indexOf(type) == -1) {
              types.push(type);
              if (!passwordDetails.length) {
                passwordDetails += 'BitGo detects this password is comprised of: ';
              } else {
                if (index == scope.passwordStrength.match_sequence.length - 1) {
                  passwordDetails += ' and ';
                } else {
                  passwordDetails += ', ';
                }
              }
              passwordDetails += type;
            }
          });
          scope.passwordStrength.details = passwordDetails;
          // Compute indicator for a progress meter
          var progress = {};
          progress.value = (scope.passwordStrength.score + 1) / 5 * 100;
          progress.class = [
            'passwordStrength-fill--1',
            'passwordStrength-fill--2',
            'passwordStrength-fill--3',
            'passwordStrength-fill--4',
            'passwordStrength-fill--5'
          ][scope.passwordStrength.score];
          scope.passwordStrength.progress = progress;
          scope.$apply(scope.passwordStrength);
          if (priorScore != progress.value && scope.onPasswordChange) {
            scope.onPasswordChange();
            priorScore = progress.value;
          }
        }
      };
      element.bind('change', checkPassword);
      element.bind('keyup', checkPassword);
    }
  };
});/*
 * @ngdoc filter
 * @name bgOrderObjectsBy
 * @param {value} String - Either permissions or role
 * @param {reverse} boolean - If set converts role to permissions
 * @description
 * Filter converts permission string to role string or vice versa
   If provided a 'toPermissions' parameter set to true, it will convert role to permission
  @example
  {{ 'admin,spend,view' | bgPermissionsRoleConversionFilter }} => 'Admin'
  {{ 'spend,view' | bgPermissionsRoleConversionFilter }} => 'Spender'
  {{ 'view' | bgPermissionsRoleConversionFilter }} => 'Viewer'

  {{ 'Admin' | bgPermissionsRoleConversionFilter: true }} => 'admin,spend,view'
  {{ 'Spender' | bgPermissionsRoleConversionFilter: true }} => 'spend,view'
  {{ 'Viewer' | bgPermissionsRoleConversionFilter: true }} => 'view'
*/
angular.module('BitGo.Common.BGPermissionsRoleConversionFilter', []).filter('bgPermissionsRoleConversionFilter', [
  'BG_DEV',
  function (BG_DEV) {
    return function (value, toPermissions) {
      if (!value) {
        return;
      }
      // Types of roles available to a user on the wallet
      var WALLET_ROLES = {
          'admin': {
            permissions: 'admin',
            role: 'Admin'
          },
          'spend': {
            permissions: 'spend',
            role: 'Spender'
          },
          'view': {
            permissions: 'view',
            role: 'Viewer'
          }
        };
      function getRole() {
        if (value.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) > -1) {
          return BG_DEV.WALLET.ROLES.ADMIN;
        } else if (value.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1) {
          return BG_DEV.WALLET.ROLES.SPEND;
        } else if (value.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.VIEW;
        } else {
          throw new Error('Missing a valid permissions');
        }
      }
      function getPermissions() {
        if (value === BG_DEV.WALLET.ROLES.ADMIN) {
          return BG_DEV.WALLET.PERMISSIONS.ADMIN + ',' + BG_DEV.WALLET.PERMISSIONS.SPEND + ',' + BG_DEV.WALLET.PERMISSIONS.VIEW;
        } else if (value === BG_DEV.WALLET.ROLES.SPEND) {
          return BG_DEV.WALLET.PERMISSIONS.SPEND + ',' + BG_DEV.WALLET.PERMISSIONS.VIEW;
        } else if (value === BG_DEV.WALLET.ROLES.VIEW) {
          return BG_DEV.WALLET.PERMISSIONS.VIEW;
        } else {
          throw new Error('Missing a valid role');
        }
      }
      if (toPermissions) {
        return getPermissions();
      }
      return getRole();
    };
  }
]);/*
 * @ngdoc filter
 * @name bgPolicyIdStringConversion
 * @param policyId {String}
 * @description
 * Converts a policy id to a string
 * @example
 * {{ "com.bitgo.whitelist.address" | bgPolicyIdStringConversion }} => 'bitcoin address whitelist'
*/
angular.module('BitGo.Common.BGPolicyIdStringConversionFilter', []).filter('bgPolicyIdStringConversion', [
  'BG_DEV',
  function (BG_DEV) {
    return function (policyId) {
      if (!policyId) {
        return;
      }
      if (!_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, policyId)) {
        throw new Error('invalid policy id');
      }
      var converters = {
          'com.bitgo.whitelist.address': 'bitcoin address whitelist',
          'com.bitgo.limit.tx': 'transaction spending limit',
          'com.bitgo.limit.day': 'daily spending limit'
        };
      return converters[policyId];
    };
  }
]);/**
 * Notes: Creates QR codes based on data in the text attribute
 */
angular.module('BitGo.Common.BGQrCode', []).directive('bgQrCode', [function () {
    return {
      restrict: 'E',
      transclude: true,
      compile: function (element, attrs, transclude) {
        return function postLink(scope, iElement, iAttrs, controller) {
          iElement[0].complete = false;
          iAttrs.$observe('text', function (value) {
            var height = attrs.height ? parseInt(attrs.height, 10) : 200;
            var text = value.replace(/^\s+|\s+$/g, '');
            iElement[0].innerHTML = '';
            var qrcode = new QRCode(iElement[0], {
                height: height,
                width: height,
                correctLevel: 0
              });
            qrcode.makeCode(text);
            iElement[0].complete = true;
          });
        };
      }
    };
  }]);angular.module('BitGo.Common.BGStateManager', []).directive('bgStateManager', [function () {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          function isValidState(state) {
            return $scope.viewStates.indexOf(state) > -1;
          }
          $scope.showState = function (state) {
            return state === $scope.state;
          };
          $scope.setState = function (state) {
            if (!isValidState(state)) {
              throw new Error('Invalid state');
            }
            $scope.state = state;
          };
          $scope.next = function () {
            var currentIdx = $scope.viewStates.indexOf($scope.state);
            var nextState = $scope.viewStates[currentIdx + 1];
            if (!isValidState(nextState)) {
              return;
            }
            $scope.setState(nextState);
          };
          $scope.prev = function () {
            var currentIdx = $scope.viewStates.indexOf($scope.state);
            var prevState = $scope.viewStates[currentIdx - 1];
            if (!isValidState(prevState)) {
              return;
            }
            $scope.setState(prevState);
          };
          $scope.$on('SetState', function (event, state) {
            $scope.setState(state);
          });
          // We expose this method for testing purposes
          $scope.initStateManager = function () {
            if (!$scope.viewStates || $scope.viewStates && $scope.viewStates.length === 0) {
              throw new Error('Directive - stateManager: expects $scope.viewStates to be set');
            }
            if (!$scope.state) {
              throw new Error('Directive - stateManager: expects $scope.state to be set');
            }
          };
          $scope.initStateManager();
        }
      ]
    };
  }]);/*
  Notes:
  - This directive is a selector which shows the current time period and, based on a
  range of time periods, allows someone to advance and go back to dates within
  the range provided
*/
angular.module('BitGo.Common.BGTimePeriodSelect', []).directive('bgTimePeriodSelect', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'E',
      templateUrl: '/common/templates/timeperiodselect.html',
      scope: {
        periods: '=periods',
        currentPeriod: '=currentPeriod',
        onChange: '&onChange'
      },
      controller: [
        '$scope',
        function ($scope) {
          var currentPeriodIdx = 0;
          // Watch for the time periods to become available on the scope
          $scope.$watch('periods', function (periods) {
            currentPeriodIdx = periods.length - 1;
            $scope.currentPeriod = periods[currentPeriodIdx];
          });
          // Advance to the next time period
          $scope.nextPeriod = function () {
            var nextPeriod = $scope.periods[currentPeriodIdx + 1];
            if (nextPeriod) {
              currentPeriodIdx++;
              $scope.currentPeriod = nextPeriod;
            }
          };
          // Go to previous time period
          $scope.prevPeriod = function () {
            var prevPeriod = $scope.periods[currentPeriodIdx - 1];
            if (prevPeriod) {
              currentPeriodIdx--;
              $scope.currentPeriod = prevPeriod;
            }
          };
          // UI logic to show the button that allows user to go to next period
          $scope.showNext = function () {
            return !!$scope.periods[currentPeriodIdx + 1];
          };
          // UI logic to show the button that allows user to go to previous period
          $scope.showPrev = function () {
            return !!$scope.periods[currentPeriodIdx - 1];
          };
        }
      ]
    };
  }
]);// Directive for creating the timezone selector for a user
angular.module('BitGo.Common.BGTimezoneSelect', []).directive('bgTimezoneSelect', [
  '$compile',
  '$rootScope',
  function ($compile, $rootScope) {
    return {
      restrict: 'E',
      template: '<select></select>',
      scope: { settings: '=settings' },
      link: function (scope, ele, attrs) {
        var Timezone = {
            init: function (cities, formatName) {
              this.cities = [];
              this.formatName = formatName;
              for (var key in cities) {
                if (typeof cities[key] != 'function') {
                  this.cities.push({
                    name: cities[key],
                    offset: moment.tz(cities[key]).format('Z')
                  });
                }
              }
              // sort by time offset
              this.cities.sort(function (a, b) {
                return parseInt(a.offset.replace(':', ''), 10) - parseInt(b.offset.replace(':', ''), 10);
              });
              // generate the html
              this.html = this.getHTMLOptions();
              this.currentTimezone = this.getCurrentTimezoneKey();
            },
            getHTMLOptions: function () {
              var html = '';
              var offset = 0;
              var index;
              var city;
              for (index = 0; index < this.cities.length; index++) {
                city = this.cities[index];
                if (scope.settings) {
                  if (city.name === scope.settings.timezone) {
                    scope.settings.timezoneDisplay = '(GMT ' + city.offset + ') ' + city.name;
                  }
                }
                html += '<option offset="' + city.offset + '" value=' + city.name + '>(GMT ' + city.offset + ') ' + city.name + '</option>';
              }
              return html;
            },
            getCurrentTimezoneKey: function () {
              return moment().format('Z');
            }
          };
        Timezone.init(moment.tz.names());
        var options = Timezone.getHTMLOptions();
        var compiledEle = $compile('<select ng-model="settings.timezone" class="customSelect-select">' + options + '</select>')(scope);
        scope.$watchCollection('[settings.timezoneDisplay, settings.timezone]', function () {
          if (scope.settings) {
            scope.settings.timezoneDisplay = '(GMT ' + moment.tz(scope.settings.timezone).format('Z') + ') ' + scope.settings.timezone;
          }
        });
        ele.replaceWith(compiledEle);
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name bgTypeaheadTrigger
 * @description
 * Triggers an event emit from from a dropdown list when an item is clicked
 */
angular.module('BitGo.Common.BGTypeaheadTriggerDirective', []).directive('bgTypeaheadTrigger', [
  '$parse',
  '$timeout',
  function ($parse, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        angular.element(elem).on('click', function (evt) {
          if (!scope.match) {
            throw new error('Expected match');
          }
          var params = { match: { data: scope.match.model.data } };
          scope.$emit('bgTypeaheadTrigger.MatchSelected', params);
          scope.$apply();
        });
      }
    };
  }
]);// Directive for creating the wallet permissions for a user
angular.module('BitGo.Common.BGWalletPermissionsDirective', []).directive('bgWalletPermissions', [
  '$compile',
  '$rootScope',
  '$filter',
  'BG_DEV',
  function ($compile, $rootScope, $filter, BG_DEV) {
    return {
      restrict: 'E',
      template: '<select></select>',
      link: function (scope, ele, attrs) {
        var permissions = {
            init: function () {
              scope.role = $filter('bgPermissionsRoleConversionFilter')(attrs.permissions);
              // generate the html
              this.html = this.getHTMLOptions();
            },
            getHTMLOptions: function () {
              var html = '';
              scope.options = [
                BG_DEV.WALLET.ROLES.ADMIN,
                BG_DEV.WALLET.ROLES.SPEND,
                BG_DEV.WALLET.ROLES.VIEW
              ];
              html = '<select class="customSelect-select" ng-model="role" ng-options = "option for option in options"></select>';
              return html;
            }
          };
        permissions.init();
        var compiledEle = $compile(permissions.html)(scope);
        ele.replaceWith(compiledEle);
      }
    };
  }
]);/*

 * @ngdoc filter
 * @name bgWalletSharesByWallet
 * @param {object} outgoingWalletShares - list of wallet shares
 * @param {object} currWallet - The wallet to filter the wallet shares by
 * @description
 * It filters the walletshares list and returns a list of walletshares for that particular wallet
 * @return list of wallet shares
 * @example
 * <tr ng-repeat="(walletShareId, walletShare) in walletShares.all.outgoing | bgWalletSharesByWallet:wallets.current">
*/
angular.module('BitGo.Common.BGWalletSharesByWalletFilter', []).filter('bgWalletSharesByWallet', [
  '$rootScope',
  function ($rootScope) {
    return function (outgoingWalletShares, currWallet) {
      if (_.isEmpty(currWallet)) {
        console.log('Cannot filter wallet shares by wallet: Missing wallet');
        return null;
      }
      if (_.isEmpty(outgoingWalletShares)) {
        return null;
      }
      return _.pick(outgoingWalletShares, function (walletShare, key) {
        return walletShare.walletId && walletShare.walletId === currWallet.data.id;
      });
    };
  }
]);/*
 * @ngdoc filter
 * @name bgWalletsByRoleFilter
 * @param {object} allWallets - list of wallets
 * @param {String} role - The role to filter the wallets by
 * @description
 * It filters the wallets list and returns a list of wallets with that particular role
 * @return list of wallets
 * @example
 * <tr ng-repeat="(walletId, wallet) in wallets.all | bgWalletsByRole:'Admin'">
*/
angular.module('BitGo.Common.BGWalletsByRoleFilter', []).filter('bgWalletsByRole', [
  '$rootScope',
  function ($rootScope) {
    return function (allWallets, role) {
      if (_.isEmpty(allWallets) || !role) {
        return null;
      }
      return _.pick(allWallets, function (wallet, key) {
        return wallet.role && wallet.role === role;
      });
    };
  }
]);/*
  Notes:
  - All BitGo directives are namespaced with BG to make a
  clear distinction between HTML attrs, other libraries,
  and BitGo's library code.
  OK: bg-focus-when || Not OK: focus-when

  - The BitGo.Common module is intended to be used throughout the app and
  should not be composed of (have dependencies on) any other modules
  outside of those in the BitGo.Common namespace.
*/
angular.module('BitGo.Common', [
  'BitGo.Common.BGActivityTilePolicyDescriptionDirective',
  'BitGo.Common.BGAddUserToWalletDirective',
  'BitGo.Common.BGApprovalsFilter',
  'BitGo.Common.BGApprovalTilePolicyRequestDirective',
  'BitGo.Common.BGApprovalTileTxRequestDirective',
  'BitGo.Common.BGBitcoinFormatFilter',
  'BitGo.Common.BGBitcoinToCurrencyFilter',
  'BitGo.Common.BGCapitalizeFilter',
  'BitGo.Common.BGCenterEllipsisFilter',
  'BitGo.Common.BGConfirmActionDirective',
  'BitGo.Common.BGDynamicTableRowManagerDirective',
  'BitGo.Common.BGEnterpriseOrderingFilter',
  'BitGo.Common.BGEnterpriseWalletsByUser',
  'BitGo.Common.BGFormError',
  'BitGo.Common.BGFocusUiDirective',
  'BitGo.Common.BGFocusWhen',
  'BitGo.Common.BGGetAddressLabelDirective',
  'BitGo.Common.BGGetLocalWalletDirective',
  'BitGo.Common.BGGetUser',
  'BitGo.Common.BGGravatarDirective',
  'BitGo.Common.BGInfiniteScrollDirective',
  'BitGo.Common.BGInfiniteScrollService',
  'BitGo.Common.BGInputNumbersOnly',
  'BitGo.Common.BGInputToSatoshiConverterDirective',
  'BitGo.Common.BGInputValidator',
  'BitGo.Common.BGIsObjectEmptyFilter',
  'BitGo.Common.BGIntlTelInputDirective',
  'BitGo.Common.BGJsonDecryptDirective',
  'BitGo.Common.BGListActiveTileManagerDirective',
  'BitGo.Common.BGOrderObjectsByFilter',
  'BitGo.Common.BGPasswordStrength',
  'BitGo.Common.BGPermissionsRoleConversionFilter',
  'BitGo.Common.BGPolicyIdStringConversionFilter',
  'BitGo.Common.BGQrCode',
  'BitGo.Common.BGStateManager',
  'BitGo.Common.BGTimePeriodSelect',
  'BitGo.Common.BGTimezoneSelect',
  'BitGo.Common.BGTypeaheadTriggerDirective',
  'BitGo.Common.BGWalletPermissionsDirective',
  'BitGo.Common.BGWalletSharesByWalletFilter',
  'BitGo.Common.BGWalletsByRoleFilter',
  'BitGo.Common.BGWalletSharesByWalletFilter'
]);/**
 * @ngdoc directive
 * @name activityApprovals
 * @description
 * Directive to help with the approvals section in the current enterprise
 */
angular.module('BitGo.Enterprise.ActivityApprovalsDirective', []).directive('activityApprovals', [
  'UtilityService',
  'InternalStateService',
  function (Util, InternalStateService) {
    return {
      restrict: 'A',
      require: '^EnterpriseActivityController',
      controller: [
        '$scope',
        '$rootScope',
        '$location',
        function ($scope, $rootScope, $location) {
          // show UI if enterprise approvals exist
          $scope.enterpriseApprovalsExist = null;
          // show empty state if no approvals exist
          $scope.noApprovalsExist = null;
          function displayUI() {
            if (!_.isEmpty($rootScope.enterprises.current.pendingApprovals)) {
              $scope.enterpriseApprovalsExist = true;
              $scope.noApprovalsExist = false;
            } else {
              $scope.enterpriseApprovalsExist = false;
              $scope.noApprovalsExist = true;
            }
          }
          $scope.goToSettings = function () {
            if ($rootScope.enterprises.current.isPersonal) {
              InternalStateService.goTo('personal_settings:users');  //$location.path('/settings');
            } else {
              InternalStateService.goTo('enterprise_settings:users');  //$location.path('/enterprise/' + $rootScope.enterprises.current.id + '/settings');
            }
          };
          // Event Listeners
          // Listen for the enterprises's approvals to be set
          var killApprovalsListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function (evt, data) {
              displayUI();
            });
          // Clean up the listeners -- helps decrease run loop time and
          // reduce liklihood of references being kept on the scope
          $scope.$on('$destroy', function () {
            killApprovalsListener();
          });
        }
      ]
    };
  }
]);angular.module('BitGo.Enterprise.ActivityAuditLogDirective', []).directive('activityAuditLog', [
  '$q',
  'UtilityService',
  'NotifyService',
  'InfiniteScrollService',
  'AuditLogAPI',
  function ($q, Util, Notify, InfiniteScrollService, AuditLogAPI) {
    return {
      restrict: 'A',
      require: '^EnterpriseActivityController',
      controller: [
        '$scope',
        '$rootScope',
        function ($scope, $rootScope) {
          // The auditlog used to populate the view
          $scope.auditLog = null;
          // the total of items we can possibly fetch
          var total;
          // the start index for the initial data fetch
          var startIdx;
          // limits the data fetch number of results
          var limit;
          // initiazlizes a clean auditlog fetch setup on the scope
          function initNewAuditLog() {
            startIdx = 0;
            $scope.auditLog = [];
            $scope.loadAuditLogOnPageScroll();
          }
          // wipe out the existing auditlog
          function clearAuditLog() {
            startIdx = 0;
            $scope.auditLog = [];
          }
          // Loads the auditlog events chunk by chunk for infinite scroll.
          // Note: This function must return a promise.
          $scope.loadAuditLogOnPageScroll = function () {
            // If we fetch all the items, kill any further calls
            if (total && $scope.auditLog.length >= total) {
              return $q.reject();
            }
            var params = {
                enterpriseId: $rootScope.enterprises.current.id,
                skip: startIdx,
                limit: limit
              };
            return AuditLogAPI.get(params).then(function (data) {
              // Set the total so we know when to stop calling
              if (!total) {
                total = data.total;
              }
              startIdx += limit;
              $scope.auditLog = $scope.auditLog.concat(data.logs);
              return true;
            }).catch(Notify.errorHandler);
          };
          // listen for the current enterprise to be set and load the events once ready
          var killEnterprisesListener = $scope.$watchCollection('enterprises', function (enterprises) {
              if (enterprises && enterprises.current) {
                // Set the global inifinte scroll handler
                InfiniteScrollService.setScrollHandler($scope.loadAuditLogOnPageScroll);
                initNewAuditLog();
              }
            });
          // Clean up when the scope is destroyed - happens when switching sections
          $scope.$on('$destroy', function () {
            clearAuditLog();
            killEnterprisesListener();
            // reset the global inifinte scroll handler
            InfiniteScrollService.clearScrollHandler();
          });
          function init() {
            // initialize locals
            limit = 25;
          }
          init();
        }
      ]
    };
  }
]);angular.module('BitGo.Enterprise.AuditLogActivityTileDirective', []).directive('auditLogActivityTile', [
  '$compile',
  '$http',
  '$templateCache',
  function ($compile, $http, $templateCache) {
    // Returns the template path to compile based on logItem.type
    var getTemplate = function (logItemType) {
      var template = '';
      switch (logItemType) {
      // User Auth
      case 'userSignup':
      case 'userLogin':
      case 'userFailedLogin':
      // Transactions
      case 'bitgoSigned':
      case 'createTransaction':
      case 'approveTransaction':
      case 'rejectTransaction':
      // Policy Changes
      case 'addPolicy':
      case 'changePolicy':
      case 'removePolicy':
      case 'approvePolicy':
      case 'rejectPolicy':
      // User Shares
      case 'addUser':
      case 'removeUser':
      case 'shareUser':
      case 'shareUserAccept':
      case 'shareUserCancel':
      case 'shareUserDecline':
      case 'approveUser':
      case 'rejectUser':
      // User Settings change
      case 'userSettingsChange':
      case 'userPasswordChange':
      case 'userPasswordReset':
      // Wallet Actions
      case 'createWallet':
      case 'removeWallet':
      case 'renameWallet':
      // Label Address
      case 'labelAddress':
      // Commenting
      case 'updateComment':
        template = 'enterprise/templates/activitytiles/' + logItemType + '.html';
        break;
      default:
        throw new Error('Expected valid audit log type. Got: ' + logItemType);
      }
      return template;
    };
    // Note:
    // We work in the link function because we need to specify the
    // template before compile time; then manually compile it once we have
    // data on the scope
    return {
      restrict: 'A',
      replace: true,
      link: function (scope, element, attrs) {
        function checkPolicyItem(logItemType) {
          switch (logItemType) {
          case 'addPolicy':
          case 'changePolicy':
          case 'removePolicy':
          case 'approvePolicy':
          case 'rejectPolicy':
            return true;
          default:
            return false;
          }
        }
        // Set pretty time for the ui
        scope.logItem.prettyDate = new moment(scope.logItem.date).format('MMMM Do YYYY, h:mm:ss A');
        // Bool for if the action is a policy item
        scope.logItem.isPolicyItem = checkPolicyItem(scope.logItem.type);
        // init the template
        $http.get(getTemplate(scope.logItem.type), { cache: $templateCache }).success(function (html) {
          element.html(html);
          $compile(element.contents())(scope);
        });
      }
    };
  }
]);/*
  Notes:
  - This controls the view for the enterprise wallet activity log page and
  all subsections (it uses bg-state-manager) to handle template swapping
*/
angular.module('BitGo.Enterprise.EnterpriseActivityController', []).controller('EnterpriseActivityController', [
  '$scope',
  '$rootScope',
  function ($scope, $rootScope) {
    // The view viewStates within the enterprise activity section
    $scope.viewStates = [
      'auditlog',
      'approvals'
    ];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.activityTemplateSource = null;
    // Show the notification bullet for this tab
    $scope.showApprovalIcon = function () {
      return $rootScope.enterprises.current && _.keys($rootScope.enterprises.current.pendingApprovals).length > 0;
    };
    // Highlights the tab the user is currently in
    $scope.isActivitySection = function (state) {
      if (_.indexOf($scope.viewStates, state) === -1) {
        throw new Error('Missing valid state');
      }
      return state === $scope.state;
    };
    // gets the view template based on the $scope's viewSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Missing $scope.state');
      }
      var template;
      switch ($scope.state) {
      case 'auditlog':
        template = 'enterprise/templates/activity-partial-auditlog.html';
        break;
      case 'approvals':
        template = 'enterprise/templates/activity-partial-approvals.html';
        break;
      }
      return template;
    }
    // Event Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function (state) {
        if (!state) {
          return;
        }
        $scope.activityTemplateSource = getTemplate();
      });
    // Clean up when the scope is destroyed
    $scope.$on('$destroy', function () {
      // remove listeners
      killStateWatch();
    });
    function init() {
      $rootScope.setContext('enterpriseActivity');
      $scope.state = 'approvals';
      $scope.activityTemplateSource = getTemplate();
    }
    init();
  }
]);/**
 * @ngdoc directive
 * @name enterpriseApprovalTile
 * @description
 * Manages the logic for ingesting am enterprise pendingApproval item and outputting the right template item to the DOM
 * @example
 *   <tr enterprise-approval-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Enterprise.EnterpriseApprovalTileDirective', []).directive('enterpriseApprovalTile', [
  '$rootScope',
  '$compile',
  '$http',
  '$templateCache',
  'BG_DEV',
  function ($rootScope, $compile, $http, $templateCache, BG_DEV) {
    return {
      restrict: 'A',
      replace: true,
      link: function (scope, element, attrs) {
        // Set pretty time for the ui
        scope.approvalItem.prettyDate = new moment(scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');
        function getPolicyTemplate(policyRuleRequest) {
          switch (policyRuleRequest.update.id) {
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address']:
            return 'bitcoinAddressWhitelist';
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.day']:
            return 'dailyLimit';
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.tx']:
            return 'transactionLimit';
          default:
            throw new Error('invalid policy id');
          }
        }
        /** Returns the template path to compile based on approvalItem.info.type */
        var getTemplate = function (approvalItemType) {
          var template = '';
          switch (approvalItemType) {
          case 'policyRuleRequest':
            var id = scope.approvalItem.info.policyRuleRequest.update.id;
            if (!id || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, id)) {
              throw new Error('Invalid BitGo policy id');
            }
            template = 'enterprise/templates/approvaltiles/' + getPolicyTemplate(scope.approvalItem.info.policyRuleRequest) + '.html';
            break;
          case 'transactionRequest':
          case 'userChangeRequest':
            template = 'enterprise/templates/approvaltiles/' + approvalItemType + '.html';
            break;
          default:
            throw new Error('Expected valid approval type. Got: ' + approvalItemType);
          }
          return template;
        };
        function initTemplate() {
          $http.get(getTemplate(scope.approvalItem.info.type), { cache: $templateCache }).success(function (html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        initTemplate();
      }
    };
  }
]);/*
  About:
  - Handles all functionality for a BitGo Enterprise (e.g dealing with
  wallet lists, enterprise settings, etc...)
*/
angular.module('BitGo.Enterprise', [
  'BitGo.Enterprise.EnterpriseWalletsController',
  'BitGo.Enterprise.MarketWidgetDirective',
  'BitGo.Enterprise.EnterpriseActivityController',
  'BitGo.Enterprise.ActivityAuditLogDirective',
  'BitGo.Enterprise.ActivityApprovalsDirective',
  'BitGo.Enterprise.AuditLogActivityTileDirective',
  'BitGo.Enterprise.EnterpriseApprovalTileDirective',
  'BitGo.Enterprise.EnterpriseSettingsController',
  'BitGo.Enterprise.PersonalSettingsController',
  'BitGo.Enterprise.SettingsUsersManagerDirective',
  'BitGo.Enterprise.SettingsAddUserFormDirective',
  'BitGo.Enterprise.EnterpriseReportsController',
  'BitGo.Enterprise.MonthlyReportsDirective'
]);/*
  Notes:
  - This controls the view for the enterprise wallet reporting page
*/
angular.module('BitGo.Enterprise.EnterpriseReportsController', []).controller('EnterpriseReportsController', [
  '$scope',
  '$rootScope',
  'NotifyService',
  function ($scope, $rootScope, Notify) {
    // The view viewStates within the enterprise reports section
    $scope.viewStates = ['monthly'];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.activityTemplateSource = null;
    // gets the view template based on the $scope's viewSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Missing $scope.state');
      }
      var template;
      switch ($scope.state) {
      case 'monthly':
        template = 'enterprise/templates/reports-partial-monthly.html';
        break;
      }
      return template;
    }
    // Event Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function (state) {
        if (!state) {
          return;
        }
        $scope.activityTemplateSource = getTemplate();
      });
    // Clean up when the scope is destroyed
    $scope.$on('$destroy', function () {
      // remove listeners
      killStateWatch();
    });
    function init() {
      $rootScope.setContext('enterpriseReports');
      $scope.state = 'monthly';
      $scope.activityTemplateSource = getTemplate();
    }
    init();
  }
]);/*
  Notes:
  - This controls the view for the enterprise wallet settings page and
  all subsections (it uses bg-state-manager) to handle template swapping
*/
angular.module('BitGo.Enterprise.EnterpriseSettingsController', []).controller('EnterpriseSettingsController', [
  '$scope',
  'InternalStateService',
  function ($scope, InternalStateService) {
    // The view viewStates within the enterprise settings for a specific enterprise
    $scope.viewStates = [
      'company',
      'users'
    ];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.enterpriseSettingsTemplateSource = null;
    // gets the view template based on the $scope's currentSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
      }
      var tpl;
      switch ($scope.state) {
      case 'company':
        tpl = 'enterprise/templates/settings-partial-company.html';
        break;
      case 'users':
        tpl = 'enterprise/templates/settings-partial-users.html';
        break;
      }
      return tpl;
    }
    // Events Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function () {
        $scope.enterpriseSettingsTemplateSource = getTemplate();
      });
    // Clean up the listeners when the scope is destroyed
    $scope.$on('$destroy', function () {
      killStateWatch();
    });
    $scope.setSubState = function () {
      $scope.$broadcast('EnterpriseSettingsController.showAllUsers');
    };
    function init() {
      $rootScope.setContext('enterpriseSettings');
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'company';
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    }
    init();
  }
]);/*
  Notes:
  - This controls the view for the enterprise wallet list page
*/
angular.module('BitGo.Enterprise.EnterpriseWalletsController', []).controller('EnterpriseWalletsController', [
  '$q',
  '$scope',
  '$modal',
  '$rootScope',
  '$location',
  '$filter',
  'WalletsAPI',
  'WalletSharesAPI',
  'UtilityService',
  'NotifyService',
  'KeychainsAPI',
  'EnterpriseAPI',
  'BG_DEV',
  'SyncService',
  'RequiredActionService',
  'AnalyticsProxy',
  function ($q, $scope, $modal, $rootScope, $location, $filter, WalletsAPI, WalletSharesAPI, UtilityService, Notify, KeychainsAPI, EnterpriseAPI, BG_DEV, SyncService, RequiredActionService, AnalyticsProxy) {
    // id of wallet to be shared
    var localWalletShare;
    // show the ui if user has access to any wallets
    $scope.noWalletsAcrossEnterprisesExist = null;
    // show the ui if filtered wallets exist
    $scope.filteredWalletsExist = null;
    // show the ui for no wallets existing
    $scope.noWalletsExist = null;
    // Helps in UI when share is in process
    $scope.processShare = false;
    // show the ui if filtered walletshares exist
    $scope.filteredWalletSharesExist = null;
    // show the ui for no wallet shares existing
    $scope.noWalletSharesExist = null;
    /**
      * show the wallet list once filtering listeners are stabilized
      * @private
      */
    function setFilteredWalletsForUI() {
      if (!_.isEmpty($rootScope.wallets.all)) {
        $scope.filteredWalletsExist = true;
        $scope.noWalletsExist = false;
      } else {
        $scope.filteredWalletsExist = false;
        $scope.noWalletsExist = true;
      }
    }
    /**
      * show the wallet shares list once filtering listeners are stabilized
      * @private
      */
    function setFilteredWalletSharesForUI() {
      // incase of success wallet share, we want to stop processing share before displayign wallets
      $scope.processShare = false;
      if (!_.isEmpty($rootScope.walletShares.all.incoming)) {
        $scope.filteredWalletSharesExist = true;
        $scope.noWalletSharesExist = false;
      } else {
        $scope.filteredWalletSharesExist = false;
        $scope.noWalletSharesExist = true;
      }
    }
    // show the UI when there are no wallets, walletshares in current enterprise but are present in other enterprises
    $scope.noWalletsInEnterprise = function () {
      return $scope.noWalletsExist && $scope.noWalletSharesExist && !$scope.noWalletsAcrossEnterprisesExist;
    };
    // show the welcome message if no wallets or walletshares exist and sharing isn't in process
    $scope.canShowWelcomeMessage = function () {
      return $scope.noWalletSharesExist && $scope.noWalletsAcrossEnterprisesExist && !$scope.processShare;
    };
    // Link off to the create new wallet flow
    $scope.createNewWallet = function () {
      // track the create flow kick-off
      AnalyticsProxy.track('CreateWalletStarted');
      // If the user has a weak login password, we force them to upgrade it
      // before they can create any more wallets
      if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
        return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
      }
      try {
        $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets/create');
      } catch (error) {
        console.error('Expect $rootScope\'s current enterprise to be set.');
      }
    };
    // function to check if the user can create wallets on the current enterprise
    $scope.canCreateWallet = function () {
      if ($rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal) {
        return true;
      }
      if (!$rootScope.currentUser.settings.enterprises) {
        return false;
      }
      return $rootScope.currentUser.settings.enterprises.some(function (enterprise) {
        if ($rootScope.enterprises.current && enterprise.id === $rootScope.enterprises.current.id) {
          return true;
        }
      });
    };
    // Link in to a specific wallet and set the current wallet on rootscope
    $scope.goToWallet = function (wallet) {
      WalletsAPI.setCurrentWallet(wallet);
    };
    /**
    * accepts wallet share.
    * Steps for accepting a wallet share
    *   - Fetch the details of the wallet share from the server.
    *   - Get ECDH keychain of the current user.
    *   - decrypt the xprv with the users passcode.
    *   - get the echd secret
    *   - get the shared wallet xprv with the secret and the pubkey
    *   - encrypt the shared wallet xprv with the passcode
    *   - send this data to the server
    * @params - The wallet share you want to accept
    * @returns {promise} with data/error from the server calls.
    */
    $scope.acceptShare = function (walletShare) {
      $scope.processShare = true;
      if (walletShare) {
        localWalletShare = walletShare;
      }
      var params = {
          state: 'accepted',
          shareId: localWalletShare.id
        };
      var role = $filter('bgPermissionsRoleConversionFilter')(localWalletShare.permissions);
      if (role === BG_DEV.WALLET.ROLES.ADMIN || role === BG_DEV.WALLET.ROLES.SPEND) {
        WalletSharesAPI.getSharedWallet({ shareId: localWalletShare.id }).then(function (data) {
          // check if the wallet is a cold wallet. If so accept share without getting secret etc. (this just behaves as a 'view only' share wallet)
          if (!data.keychain) {
            return WalletSharesAPI.updateShare(params).then(shareUserSuccess);
          } else {
            return KeychainsAPI.get($rootScope.currentUser.settings.ecdhKeychain).then(function (sharingKeychain) {
              if (!sharingKeychain.encryptedXprv) {
                throw new Error('EncryptedXprv was not found on sharing keychain');
              }
              if (!$scope.password) {
                var errorData = {
                    status: 401,
                    message: 'Missing Password',
                    data: {
                      needsPasscode: true,
                      key: null
                    }
                  };
                return $q.reject(UtilityService.ErrorHelper(errorData));
              }
              // Now we have the sharing keychain, we can work out the secret used for sharing the wallet with us
              sharingKeychain.xprv = UtilityService.Crypto.sjclDecrypt($scope.password, sharingKeychain.encryptedXprv);
              var rootExtKey = new BIP32(sharingKeychain.xprv);
              // Derive key by path (which is used between these 2 users only)
              var extKey = rootExtKey.derive(data.keychain.path);
              var secret = UtilityService.Crypto.getECDHSecret(extKey.eckey.priv, data.keychain.fromPubKey);
              // Yes! We got the secret successfully here, now decrypt the shared wallet xprv
              var decryptedSharedWalletXprv = UtilityService.Crypto.sjclDecrypt(secret, data.keychain.encryptedXprv);
              encryptedSharedWalletXprv = UtilityService.Crypto.sjclEncrypt($scope.password, decryptedSharedWalletXprv);
              params.encryptedXprv = encryptedSharedWalletXprv;
              return WalletSharesAPI.updateShare(params);
            });
          }
        }).then(shareUserSuccess).catch(onAcceptShareFail);
      } else {
        return WalletSharesAPI.updateShare(params).then(shareUserSuccess);
      }
    };
    function shareUserSuccess() {
      // TODO Barath. Might be a better (smoother for UI) way to accept share
      SyncService.sync();
    }
    function rejectShareSuccess() {
      $scope.processShare = false;
      WalletSharesAPI.getAllSharedWallets();
    }
    // reject a share
    $scope.rejectShare = function (walletShare) {
      $scope.processShare = true;
      WalletSharesAPI.cancelShare({ shareId: walletShare.id }).then(rejectShareSuccess).catch(Notify.errorHandler);
    };
    // Event Listeners
    // Listen for the enterprises's wallet shares to be set before showing the list
    var killWalletSharesListener = $rootScope.$on('WalletSharesAPI.FilteredWalletSharesSet', function (evt, data) {
        setFilteredWalletSharesForUI();
      });
    // Event Listeners
    // Listen for all user wallets to be set
    var killUserWalletsListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function (evt, data) {
        if (_.isEmpty(data.allWallets)) {
          $scope.noWalletsAcrossEnterprisesExist = true;
        } else {
          $scope.noWalletsAcrossEnterprisesExist = false;
        }
        setFilteredWalletsForUI();
      });
    // Clean up the listeners -- helps decrease run loop time and
    // reduce liklihood of references being kept on the scope
    $scope.$on('$destroy', function () {
      killWalletSharesListener();
      killUserWalletsListener();
    });
    function onAcceptShareFail(error) {
      if (UtilityService.API.isOtpError(error)) {
        // If the user needs to OTP, use the modal to unlock their account
        openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock }).then(function (result) {
          if (result.type === 'otpThenUnlockSuccess') {
            if (!result.data.otp) {
              throw new Error('Missing otp');
            }
            if (!result.data.password) {
              throw new Error('Missing login password');
            }
            $scope.password = result.data.password;
            // resubmit to share wallet
            return $scope.acceptShare();
          }
        }).catch(function () {
          $scope.processShare = false;
        });
      } else if (UtilityService.API.isPasscodeError(error)) {
        openModal({ type: BG_DEV.MODAL_TYPES.passwordThenUnlock }).then(function (result) {
          if (result.type === 'otpThenUnlockSuccess') {
            if (!result.data.password) {
              throw new Error('Missing login password');
            }
            $scope.password = result.data.password;
            // resubmit to share wallet
            return $scope.acceptShare();
          }
        }).catch(function () {
          $scope.processShare = false;
        });
      } else {
        $scope.processShare = false;
        // Otherwise just display the error to the user
        Notify.error(error.error || error);
      }
    }
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
            locals: function () {
              return {
                type: params.type,
                userAction: BG_DEV.MODAL_USER_ACTIONS.acceptShare
              };
            }
          }
        });
      return modalInstance.result;
    }
    function init() {
      $rootScope.setContext('enterpriseWalletsList');
      $scope.balance = { bitcoinTotal: 0 };
      $scope.noWalletsAcrossEnterprisesExist = false;
      $scope.filteredWalletsExist = false;
      $scope.noWalletsExist = false;
      $scope.filteredWalletSharesExist = false;
      $scope.noWalletSharesExist = false;
    }
    init();
  }
]);// Directive for the market widget on the side of dashboard
angular.module('BitGo.Enterprise.MarketWidgetDirective', []).directive('marketWidget', [
  '$rootScope',
  '$http',
  'MarketDataAPI',
  function ($rootScope, $http, MarketDataAPI) {
    return {
      restrict: 'E',
      templateUrl: '/enterprise/templates/marketWidget.html',
      scope: {},
      controller: [
        '$scope',
        function ($scope) {
          // sets and updates $scope.currency data on the isolate scope
          function setScope(currencyData) {
            // check if currency data is received first
            if (currencyData && currencyData.data && currencyData.data.current) {
              // restrict the price to 2 decimal values
              $scope.delta = (Math.round((currencyData.data.current.last - currencyData.data.current['24h_avg']) * 100) / 100).toFixed(2);
              $scope.changePercent = (Math.round($scope.delta / currencyData.data.current['24h_avg'] * 10000) / 100).toFixed(2);
              if (Number($scope.delta) > 0) {
                $scope.direction = 'up';
              } else if (Number($scope.delta) === 0) {
                $scope.direction = 'nochange';
              } else {
                $scope.direction = 'down';
              }
              currencyData.data.current.last = parseFloat(currencyData.data.current.last).toFixed(2);
              $scope.currency = currencyData;
            }
          }
          setScope($rootScope.currency);
          //initialize chartTime to one day
          $scope.chartTime = 'months';
          $rootScope.$on('MarketDataAPI.AppCurrencyUpdated', function (event, currencyData) {
            setScope(currencyData);
          });
          $scope.setTime = function (time) {
            if ($scope.chartTime !== time) {
              $scope.chartTime = time;
              $scope.updateChart(time);
            }
          };
          $scope.isCurrentTime = function (time) {
            return $scope.chartTime === time;
          };
        }
      ],
      link: function (scope, element, attr) {
        var chart;
        var timeRanges = [
            'week',
            'month',
            'months'
          ];
        function setYAxis(max, min) {
          max = Math.ceil(max);
          min = Math.floor(min);
          max = max + 4 - (max - min) % 4;
          chart.yAxis.tickValues([
            min,
            min + (max - min) / 4,
            min + (max - min) / 2,
            min + 3 * (max - min) / 4,
            max
          ]);
        }
        function setChartData(range, currency) {
          MarketDataAPI.price(range, currency).then(function (values) {
            var data = [{
                  values: values.prices,
                  key: 'Bitcoin value',
                  color: '#09a1d9'
                }];
            setYAxis(values.max, values.min);
            d3.select('#chart').datum(data).call(chart);  //Finally, render the chart!
          });
        }
        var isValidTime = function (time) {
          return _.indexOf(timeRanges, time) > -1;
        };
        scope.updateChart = function (time) {
          if (isValidTime(time) && scope.currency) {
            var data;
            switch (time) {
            case 'week':
              setChartData(7, scope.currency.currency);
              break;
            case 'month':
              setChartData(30, scope.currency.currency);
              break;
            case 'months':
              setChartData(90, scope.currency.currency);
              break;
            default:
              setChartData(90, scope.currency.currency);
              break;
            }
          }
        };
        nv.addGraph(function () {
          chart = nv.models.lineChart().margin({
            left: 25,
            right: 0,
            top: 10
          }).useInteractiveGuideline(false).transitionDuration(500).showLegend(false).showYAxis(true).showXAxis(false);
          //Show the x-axis
          chart.xAxis.tickFormat(d3.format(',r')).orient('bottom');
          chart.yAxis.tickFormat(d3.format('.00f')).tickValues([
            450,
            410,
            350
          ]).orient('left');
          if (scope.currency) {
            setChartData(90, scope.currency.currency);
          }
          //Update the chart when window resizes.
          nv.utils.windowResize(function () {
            if (!chart) {
              return;
            }
            if (chart.update && typeof chart.update === 'function') {
              chart.update();
            }
          });
          return chart;
        });
      }
    };
  }
]);angular.module('BitGo.Enterprise.MonthlyReportsDirective', []).directive('monthlyReports', [
  '$rootScope',
  'NotifyService',
  'ReportsAPI',
  'UtilityService',
  function ($rootScope, Notify, ReportsAPI, Utils) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // The date range for all wallets reports on this enterprise
          $scope.dateVisibleRange = null;
          // The current wallet for reports (if a user selects one)
          $scope.selectedWallet = null;
          // The selected month to see reports for all wallets in an enterprise for a given month
          $scope.selectedDate = null;
          // Flag to see if there are any reports for the current period
          $scope.hasReportsForCurrentPeriod = false;
          // Filtering function to show only wallets in the view that have a report
          // to show for the current month selected
          $scope.showWalletForCurrentPeriod = function (wallet) {
            var hasMonth;
            _.forEach(wallet.data.reportDates, function (reportDate) {
              _.forEach(reportDate.data, function (monthlyData) {
                if (monthlyData.dateVisible === $scope.selectedDate) {
                  $scope.hasReportsForCurrentPeriod = true;
                  hasMonth = true;
                  return;
                }
              });
            });
            return hasMonth;
          };
          // Function to fetch the monthly report data for a wallet from the server
          $scope.getReport = function (wallet, dateInfo) {
            var reportInfoObj;
            // If there is dateInfo passed (to specify getting a report for that)
            // specific period, use dateInfo to construct the fetch params
            if (dateInfo) {
              reportInfoObj = wallet.getReportDateInfoForPeriod(dateInfo.dateVisible);
            } else {
              reportInfoObj = wallet.getReportDateInfoForPeriod($scope.selectedDate);
            }
            var reportTitle = new moment(reportInfoObj.startTime);
            var reportStart = reportInfoObj.startTime;
            var reportEnd = reportInfoObj.endTime;
            var reportParams = {
                walletAddress: wallet.data.id,
                reportType: 'monthlyTransactionReport',
                dataType: 'pdf',
                startTime: reportStart,
                endTime: reportEnd
              };
            ReportsAPI.getReport(reportParams).then(function (data) {
              if (data.dataType === 'pdf') {
                // Safari does not support Blob downloads, and opening a Blob URL with
                // an unsupported data-type causes Safari to complain.
                // Github Issue: https://github.com/eligrey/FileSaver.js/issues/12
                if (bowser.name === 'Safari') {
                  document.location.href = 'data:application/pdf;base64, ' + data.data;
                } else {
                  var buffer = Utils.Converters.base64ToArrayBuffer(data.data);
                  var file = new Blob([buffer], { type: 'application/octet-stream' });
                  var name = 'BitGo-Monthly-Report-ID:' + wallet.data.id.slice(0, 6) + '-' + reportTitle.format('YYYY') + '-' + reportTitle.format('MM') + '.pdf';
                  saveAs(file, name);
                }
              }
            }).catch(Notify.errorHandler);
          };
          // Build a UI-consumable array of dates for the reports based on all wallets
          // in the enterprise
          function buildUIReportRange(allWalletRanges) {
            var yearlyReports = [];
            var monthlyReports = [];
            var year = '';
            var oldYear = '';
            // reset dateVisibleRange on the scope
            $scope.dateVisibleRange = [];
            // ranges will be an object of date objects for each wallet in the enterprise
            _.forIn(allWalletRanges, function (singleWalletRanges, walletId) {
              _.forEach(singleWalletRanges, function (rangeItem) {
                if (!rangeItem.dateVisible) {
                  throw new Error('Missing `dateVisible` property when using report range');
                }
                $scope.dateVisibleRange.push(rangeItem.dateVisible);
              });
              yearlyReports = [];
              monthlyReports = [];
              year = '';
              oldYear = '';
              //orders the reports in chunks based on year
              if (singleWalletRanges) {
                _.forEach(singleWalletRanges, function (month) {
                  //fetches the year of the report from the date visible
                  year = month.dateVisible.substr(month.dateVisible.length - 4);
                  if (year !== oldYear && oldYear !== '') {
                    yearlyReports.push({
                      year: oldYear,
                      data: monthlyReports
                    });
                    monthlyReports = [];
                  }
                  monthlyReports.push(month);
                  oldYear = year;
                });
                yearlyReports.push({
                  year: year,
                  data: monthlyReports
                });
                // incase $rootScope.wallets.all is emptied out due to navigation
                if ($rootScope.wallets.all[walletId]) {
                  // Add the report data to each wallet instance
                  $rootScope.wallets.all[walletId].setReportDates(yearlyReports);
                }
              }
            });
            // Filter out any duplicates from the all array and sort by time
            $scope.dateVisibleRange = _.uniq($scope.dateVisibleRange).sort(function (a, b) {
              var aTime = new moment(a);
              var bTime = new moment(b);
              return aTime - bTime;
            });
          }
          // Get report date ranges for all wallets in the current enterprise
          function getEnterpriseReportRange(wallets) {
            if (!wallets) {
              throw new Error('Expect wallets object when fetching an enterprise report range');
            }
            var params = {
                wallets: wallets,
                stepType: 'month'
              };
            ReportsAPI.getAllWalletsReportRange(params).then(function (ranges) {
              buildUIReportRange(ranges);
            }).catch(Notify.errorHandler);
          }
          // Event handlers
          // Set up the report data once the FilteredWallets have been set up (based on the
          // current enterprise and list of all possible wallets)
          var killWalletsSetListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function (evt, data) {
              getEnterpriseReportRange(data.enterpriseWallets.all);
            });
          // Clean out the scope listeners to reduce run loop and multiple registrations
          $scope.$on('$destroy', function () {
            killWalletsSetListener();
          });
          function init() {
            $scope.dateVisibleRange = [];
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc controller
 * @name PersonalSettingsController
 * @description
 * This controls the view for the personal wallet settings page and
   all subsections (it uses bg-state-manager) to handle template swapping
 */
angular.module('BitGo.Enterprise.PersonalSettingsController', []).controller('PersonalSettingsController', [
  '$scope',
  'InternalStateService',
  function ($scope, InternalStateService) {
    // The viewStates within the settings for personal wallets
    $scope.viewStates = ['users'];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.enterpriseSettingsTemplateSource = null;
    // gets the view template based on the $scope's currentSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
      }
      var tpl;
      switch ($scope.state) {
      case 'users':
        tpl = 'enterprise/templates/settings-partial-users.html';
        break;
      }
      return tpl;
    }
    // Events Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function () {
        $scope.enterpriseSettingsTemplateSource = getTemplate();
      });
    // Clean up the listeners when the scope is destroyed
    $scope.$on('$destroy', function () {
      killStateWatch();
    });
    $scope.setSubState = function () {
      $scope.$broadcast('EnterpriseSettingsController.showAllUsers');
    };
    function init() {
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'users';
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    }
    init();
  }
]);angular.module('BitGo.Enterprise.SettingsAddUserFormDirective', []).directive('addUserForm', [
  '$rootScope',
  '$q',
  'UserAPI',
  'NotifyService',
  'KeychainsAPI',
  'UtilityService',
  '$modal',
  'WalletSharesAPI',
  '$filter',
  'BG_DEV',
  function ($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, BG_DEV) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          var params;
          function formIsValid() {
            if (!$scope.email) {
              $scope.setFormError('Please enter an email address.');
              return false;
            }
            if (!$scope.walletId) {
              $scope.setFormError('Please choose a wallet to share.');
              return false;
            }
            if (!$scope.role) {
              $scope.setFormError('Please set a role for the user.');
              return false;
            }
            return true;
          }
          $scope.saveAddUserForm = function () {
            if (!$scope.message) {
              $scope.message = 'I\'d like to invite you to join a wallet on BitGo.';
            }
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              UserAPI.sharingkey({ email: $scope.email }).then(function (data) {
                params = {
                  user: data.userId,
                  permissions: $filter('bgPermissionsRoleConversionFilter')($scope.role, true),
                  message: $scope.message
                };
                $scope.otp = $scope.otp || '';
                if ($scope.role === BG_DEV.WALLET.ROLES.SPEND || $scope.role === BG_DEV.WALLET.ROLES.ADMIN) {
                  params.keychain = {
                    xpub: $rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub,
                    toPubKey: data.pubkey,
                    path: data.path
                  };
                  return $scope.shareWallet(params);
                }
                return WalletSharesAPI.createShare($scope.walletId, params).then($scope.onAddUserSuccess);
              }).catch(function (error) {
                if (error.error === 'key not found') {
                  Notify.error($scope.email + ' has not yet set up a BitGo account. Please have ' + $scope.email + ' sign up and log in to BitGo.');
                } else {
                  Notify.error(error.error);
                }
              });
            }
          };
        }
      ]
    };
  }
]);angular.module('BitGo.Enterprise.SettingsUsersManagerDirective', []).directive('settingsUsersManager', [
  'UtilityService',
  'NotifyService',
  'WalletsAPI',
  'RequiredActionService',
  'BG_DEV',
  function (Util, Notify, WalletsAPI, RequiredActionService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^EnterpriseSettingsController',
      controller: [
        '$scope',
        '$rootScope',
        function ($scope, $rootScope) {
          // view states for the user settings area
          $scope.viewStates = [
            'showAllUsers',
            'showOneUser',
            'addUser'
          ];
          // the current view state
          $scope.state = null;
          // template source for the current view
          $scope.userSettingsTemplateSource = null;
          // An enterprise user who was selected to view in detail
          $scope.selectedUser = null;
          // returns the view current view template (based on the $scope's current state)
          function getTemplate() {
            if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
              throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
            }
            var tpl;
            switch ($scope.state) {
            case 'showAllUsers':
              tpl = 'enterprise/templates/settings-partial-users-list.html';
              break;
            case 'showOneUser':
              tpl = 'enterprise/templates/settings-partial-users-manageuser.html';
              break;
            case 'addUser':
              tpl = 'enterprise/templates/settings-partial-users-adduser.html';
              break;
            }
            return tpl;
          }
          // Fires when an admin selects an Enterprise user to view in detail
          $scope.selectUser = function (userId, walletsAccessibleByUser) {
            $scope.selectedUserId = userId;
            $scope.setState('showOneUser');
          };
          // Event listeners
          var killStateWatch = $scope.$watch('state', function (state) {
              if (state) {
                // If the user has a weak login password and is trying to add a user
                // we force them to upgrade it before they can add someone
                if (state === 'addUser' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
                  return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
                }
                // Otherwise set the template as needed
                $scope.userSettingsTemplateSource = getTemplate();
              }
            });
          // Listener cleanup
          $scope.$on('$destroy', function () {
            killStateWatch();
          });
          // Watch for click on users tab in parent element
          $scope.$on('EnterpriseSettingsController.showAllUsers', function () {
            $scope.state = 'showAllUsers';
          });
          $scope.revokeAccess = function (bitcoinAddress, userId) {
            WalletsAPI.revokeAccess(bitcoinAddress, userId).then(revokeAccessSuccess).catch(Notify.errorHandler);
          };
          $scope.canDelete = function (userId) {
            return userId && userId !== $rootScope.currentUser.settings.id;
          };
          function revokeAccessSuccess(wallet) {
            WalletsAPI.getAllWallets();
            if (wallet.adminCount > 1) {
              Notify.success('Pending approval sent for revoking wallet access.');
            } else {
              Notify.success('Wallet access was revoked.');
            }
          }
          function init() {
            $scope.state = 'showAllUsers';
          }
          init();
        }
      ]
    };
  }
]);angular.module('BitGo.Interceptors.AuthTokenInterceptor', []).factory('AuthTokenInterceptor', [
  '$q',
  '$injector',
  function ($q, $injector) {
    return {
      request: function (config) {
        var CacheService = $injector.get('CacheService');
        config.headers = config.headers || {};
        // If we have access to the browser's session storage, we
        // stored the token there. However, if we didn't have access to
        // to it, we set the token on $rootScope
        var tokenCache = CacheService.getCache('Tokens');
        var token = tokenCache && tokenCache.get('token');
        if (token) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      },
      response: function (response) {
        return response || $q.when(response);
      }
    };
  }
]);angular.module('BitGo.Interceptors.BrowserInterceptor', []).factory('BrowserInterceptor', [
  '$q',
  '$location',
  function ($q, $location) {
    var UNSUPPORTED_BROWSERS = ['Windows Phone'];
    var currentBrowser = bowser.name;
    return {
      request: function (config) {
        if (_.contains(UNSUPPORTED_BROWSERS, currentBrowser)) {
          $location.path('/unsupported');
        }
        return config;
      },
      response: function (response) {
        return response || $q.when(response);
      }
    };
  }
]);/*
  About:
  - Deals with how we modify any incoming/outgoing HTTP requests before
  control gets in to the Service (API) layer (e.g. sometimes we want to
   decorate the response or redirect based on auth tokens, etc...)
*/
angular.module('BitGo.Interceptors', [
  'BitGo.Interceptors.AuthTokenInterceptor',
  'BitGo.Interceptors.VerificationInterceptor',
  'BitGo.Interceptors.BrowserInterceptor',
  'BitGo.Interceptors.NetworkBusyInterceptor'
]);angular.module('BitGo.Interceptors.NetworkBusyInterceptor', []).factory('NetworkBusyInterceptor', [
  '$q',
  '$rootScope',
  '$injector',
  function ($q, $rootScope, $injector) {
    $rootScope.networkRequests = 0;
    return {
      responseError: function (rejection) {
        // To avoid a circular dependency, use $injector to grab the service now
        var UserAPI = $injector.get('UserAPI');
        if (rejection.data && rejection.data.error) {
          // Error when there is an invalid access_token and the request
          // tried to access protected data. Distinctly different from a
          // 'needs OTP' error
          if (rejection.data.error === 'Authorization required') {
            UserAPI.endSession();
          }
        }
        return $q.reject(rejection);
      }
    };
  }
]);angular.module('BitGo.Interceptors.VerificationInterceptor', []).factory('VerificationInterceptor', [
  '$q',
  '$location',
  '$injector',
  '$rootScope',
  '$timeout',
  function ($q, $location, $injector, $rootScope, $timeout) {
    return {
      response: function (response) {
        var Util = $injector.get('UtilityService');
        var currentUser = $rootScope.currentUser;
        // URLs we want to check against for user phone/email verification
        var isCurrentUserFetch = response.config.url.indexOf('/user/me') !== -1;
        var isLoginDetailsFetch = response.config.url.indexOf('/user/login') !== -1;
        // Scrub any phone-or-email-verification-originated params from the url
        function scrubUrl() {
          Util.Url.scrubQueryString('phone');
          Util.Url.scrubQueryString('email');
        }
        if (isCurrentUserFetch || isLoginDetailsFetch) {
          // ensure response.user exists
          if (!response.data.user) {
            throw new Error('missing ressponse.data.user - data package changed');
          }
          var state;
          if (response.data.user.phone && !response.data.user.phone.verified) {
            state = 'verifyPhone';
          }
          if (response.data.user.phone && response.data.user.phone.phone === '') {
            state = 'setPhone';
          }
          if (response.data.user.email && !response.data.user.email.verified) {
            state = 'needsEmailVerify';
          }
          // scrub url before setting a new verification link
          scrubUrl();
          if (state) {
            $location.path('/login').search(state, true);
          } else {
            if (currentUser) {
              currentUser.setProperty({ hasAccess: true });
            }
          }
        }
        return response || $q.when(response);
      }
    };
  }
]);/**
 * @ngdoc controller
 * @name LandingController
 * @description
 * Manages logic for the BitGo main landing page
 */
angular.module('BitGo.Marketing.MarketingController', []).controller('MarketingController', [
  '$location',
  '$scope',
  '$rootScope',
  'NotifyService',
  'EnterpriseAPI',
  function ($location, $scope, $rootScope, NotifyService, EnterpriseAPI) {
    // We have one controller for all of the marketing pages, so we track
    // context switches using this URL-context map
    var URL_CONTEXT_MAP = {
        '/': 'marketingHome',
        '/platform': 'marketingAPI',
        '/enterprise': 'marketingEnterprise'
      };
    // the user info object that is submitted when someone inquires about API or platform
    $scope.userInfo = null;
    // Slide quotes for the landing page
    $scope.slides = [
      {
        msg: 'BitGo is the only company in the industry we trust to secure our hot wallet.  The integration was very straightforward, and now I can sleep better at night knowing that my customers\u2019 holdings are secured with BitGo.',
        person: 'Nejc Kodri\u010d',
        company: 'Bitstamp',
        position: 'CEO'
      },
      {
        msg: 'The BitGo Platform API will be an integral part of our core infrastructure.  Our systems need to be highly secure, scalable and reliable, and BitGo is the only platform that can operate at those requirements.',
        person: 'Danny Yang',
        company: 'MaiCoin',
        position: 'CEO'
      },
      {
        msg: 'BitGo offers a robust API layer, making it much easier to integrate our clients\' multisig wallets. Their entire team was extremely helpful during the setup process.',
        person: 'Greg Schvey',
        company: 'TradeBlock',
        position: 'CEO'
      }
    ];
    /**
    * Checks if form is valid befor esubmission
    * @private
    */
    function formIsValid() {
      return $scope.userInfo.email && $scope.userInfo.email !== '';
    }
    /**
    * Resets the platform/api inquiry form
    * @private
    */
    function resetForm() {
      $scope.userInfo = {
        company: '',
        email: '',
        industry: '',
        name: '',
        phone: ''
      };
    }
    /**
    * Sends a new enterprise inquiry to the marketing team
    * @public
    */
    $scope.onSubmitForm = function () {
      if (formIsValid()) {
        EnterpriseAPI.createInquiry($scope.userInfo).then(function () {
          NotifyService.success('Your request was sent, and we\'ll be in touch with you soon.');
          resetForm();
        }).catch(function () {
          NotifyService.error('There was an issue with submitting your form. Can you please try that again?');
        });
      }
    };
    function init() {
      $rootScope.setContext(URL_CONTEXT_MAP[$location.path()]);
      resetForm();
    }
    init();
  }
]);/**
 * @ngdoc module
 * @name BitGo.Marketing
 * @description
 * Module for all landing / marketing pages in the app
 */
angular.module('BitGo.Marketing', ['BitGo.Marketing.MarketingController']);/*
  About:
  - Main modal controller will control all instances of a modal opened.
  It needs to be specified when instantiating.

  Example:
  var modalInstance = $modal.open({
    templateUrl: 'foo.html',
    controller: 'ModalController',
    resolve: {
      // The return value is passed to ModalController as 'locals'
      locals: function () {
        return {
          type: _someValidType_,
          userAction: _someValidAction_
        };
      }
    }
  });

  Notes:
  - Expects a valid modal 'type' so that it can set a template and any
  sub-controllers/directives appropriately

  This controls: ModalOtpForm
*/
angular.module('BitGo.Modals.ModalController', []).controller('ModalController', [
  '$scope',
  '$modalInstance',
  'locals',
  'BG_DEV',
  function ($scope, $modalInstance, locals, BG_DEV) {
    // the current flow for the modal controller instance
    var currentModalFlow = null;
    // locals for the scope
    $scope.locals = locals;
    $scope.closeWithSuccess = function (result) {
      $modalInstance.close(result);
    };
    $scope.closeWithError = function (reason) {
      $modalInstance.dismiss(reason);
    };
    var killOtpSuccessListener = $scope.$on('modalOtpForm.OtpSuccess', function (evt, data) {
        if (!data.otp) {
          throw new Error('Missing modal close data');
        }
        if (currentModalFlow === BG_DEV.MODAL_TYPES.otp) {
          return $scope.closeWithSuccess({
            type: 'otpsuccess',
            data: data
          });
        }
      });
    var killOtpAndUnlockSuccessListener = $scope.$on('modalOtpThenUnlockManager.OtpAndUnlockSuccess', function (evt, data) {
        if (!data.password) {
          throw new Error('Missing modal close data');
        }
        $scope.closeWithSuccess({
          type: 'otpThenUnlockSuccess',
          data: data
        });
      });
    var killDismissOfflineWarningListener = $scope.$on('modalOfflineWarning.DismissOfflineWarning', function (evt, data) {
        $scope.closeWithSuccess({ type: 'dismissOfflineWarning' });
      });
    $scope.$on('$destroy', function () {
      killOtpSuccessListener();
      killOtpAndUnlockSuccessListener();
      killDismissOfflineWarningListener();
    });
    function getTemplate() {
      var tpl;
      switch (locals.type) {
      // This case handles the case when otp and password is needed
      case BG_DEV.MODAL_TYPES.otpThenUnlock:
        // Starts from the OTP state
        $scope.initialState = 'otp';
        tpl = 'modal/templates/otp-then-unlock.html';
        break;
      // This case handles the case when only password is needed
      case BG_DEV.MODAL_TYPES.passwordThenUnlock:
        // Sets initial state to password. (Starts the flow from there)
        $scope.initialState = 'password';
        tpl = 'modal/templates/otp-then-unlock.html';
        break;
      // This case handles the case when only otp is needed
      case BG_DEV.MODAL_TYPES.otp:
        tpl = 'modal/templates/otp.html';
        break;
      // This case handles when the app is offline
      case BG_DEV.MODAL_TYPES.offlineWarning:
        tpl = 'modal/templates/modal-offline-warning.html';
        break;
      default:
        tpl = 'modal/templates/default.html';
        break;
      }
      return tpl;
    }
    function init() {
      if (!locals.type || !_.has(BG_DEV.MODAL_TYPES, locals.type)) {
        throw new Error('Modal controller expected a valid type');
      }
      if (!locals.userAction || !_.has(BG_DEV.MODAL_USER_ACTIONS, locals.userAction)) {
        throw new Error('Modal controller expected a valid userAction');
      }
      $scope.templateSource = getTemplate();
      currentModalFlow = BG_DEV.MODAL_TYPES[locals.type];
    }
    init();
  }
]);/*
  Notes:
  - This module is for definition of all modal-specific controllers and
  directives used with the UI-Bootstrap service
*/
angular.module('BitGo.Modals', [
  'BitGo.Modals.ModalController',
  'BitGo.Modals.ModalStateService',
  'BitGo.Modals.ModalOtpFormDirective',
  'BitGo.Modals.ModalOtpThenUnlockManagerDirective',
  'BitGo.Modals.ModalPasswordFormDirective',
  'BitGo.Modals.ModalOfflineWarningDirective'
]).run([
  '$rootScope',
  '$compile',
  '$http',
  '$templateCache',
  'CONSTANTS',
  'ModalStateService',
  function ($rootScope, $compile, $http, $templateCache, CONSTANTS, ModalStateService) {
    // We need to handle the case when the user loses browser connection.
    // In this instance, we will not be able to fetch any templates we need
    // to render. To handle being able to show the offline-warning modal,
    // we force load and cache the necessary templates when the app is
    // instantiated
    _.forEach(CONSTANTS.TEMPLATES.REQUIRED_OFFLINE, function (template) {
      $http.get(template, { cache: $templateCache }).then(function (response) {
        // response.data is the actual template html
        // Compile the response, which automatically puts it into the cache
        $compile(response.data);
      });
    });
    // Listen for the App to have any BitGo service calls fail due to the
    // app going offline.
    $rootScope.$on('UtilityService.AppIsOffline', function (evt, data) {
      ModalStateService.triggerAppOfflineWarning();
    });
  }
]).constant('CONSTANTS', {
  TEMPLATES: {
    REQUIRED_OFFLINE: [
      'modal/templates/modalcontainer.html',
      'modal/templates/modal-offline-warning.html'
    ]
  }
});/**
 * @ngdoc directive
 * @name modalOfflineWarning
 * @description
 * Manages the modal warning for when a user loses connectivity
 * @example
 *   <div modal-offline-warning></div>
 */
angular.module('BitGo.Modals.ModalOfflineWarningDirective', []).directive('modalOfflineWarning', [
  'StatusAPI',
  function (StatusAPI) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        function ($scope) {
          /**
         * Helper - Attempts to reconnect the app to the BitGo service
         * @public
         */
          $scope.tryReconnect = function () {
            // Remove any error messages
            $scope.clearFormError();
            // Ping BitGo
            StatusAPI.ping().then(function (data) {
              $scope.$emit('modalOfflineWarning.DismissOfflineWarning');
            }).catch(function (error) {
              $scope.setFormError('Unable to reconnect.');
            });
          };
        }
      ]
    };
  }
]);angular.module('BitGo.Modals.ModalOtpFormDirective', []).directive('modalOtpForm', [
  'UtilityService',
  'UserAPI',
  'NotifyService',
  'BG_DEV',
  function (Util, UserAPI, NotifyService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        '$timeout',
        function ($scope, $timeout) {
          /** form data handler */
          $scope.form = null;
          function formIsValid() {
            return Util.Validators.otpOk($scope.form.otp);
          }
          function onSubmitSuccess() {
            $scope.$emit('modalOtpForm.OtpSuccess', {
              type: 'otpsuccess',
              otp: $scope.form.otp
            });
          }
          function onSubmitError(error) {
            $scope.clearFormError();
            $scope.setFormError('Please enter a valid code');
          }
          $scope.submitOTP = function () {
            $scope.clearFormError();
            if (formIsValid()) {
              var params = { otp: $scope.form.otp };
              // If creating an access token, do not try to do an unlock - we are using the otp directly
              if ($scope.locals.userAction === BG_DEV.MODAL_USER_ACTIONS.createAccessToken) {
                return onSubmitSuccess();
              }
              UserAPI.unlock(params).then(onSubmitSuccess).catch(onSubmitError);
            } else {
              onSubmitError();
            }
          };
          function onResendSuccess() {
            NotifyService.success('Your code was successfully resent.');
          }
          function onResendFail() {
            NotifyService.error('There was an issue sending the code.');
          }
          $scope.resendOTP = function () {
            var params = { forceSMS: true };
            UserAPI.sendOTP(params).then(onResendSuccess).catch(onResendFail);
          };
          function init() {
            $scope.form = { otp: '' };
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name modalOtpThenUnlockManager
 * @description
 * Manages the modal flow for unlocking then otp'ing a user
 * Requires: bg-state-manager
 * @example
 *   <div modal-otp-then-unlock-manager bg-state-manager></div>
 */
angular.module('BitGo.Modals.ModalOtpThenUnlockManagerDirective', []).directive('modalOtpThenUnlockManager', [function () {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        '$timeout',
        function ($scope, $timeout) {
          // valid view states
          $scope.viewStates = [
            'otp',
            'password'
          ];
          // form input fields across all states in the modal flow
          $scope.data = null;
          // Event Listeners (listen to advance/kill the flow)
          // Advance to the password step when the user otps successfully
          var killOtpSuccessListener = $scope.$on('modalOtpForm.OtpSuccess', function (evt, data) {
              if (!data.otp) {
                throw new Error('missing otp');
              }
              $scope.data.otp = data.otp;
              $scope.setState('password');
            });
          // Kill the flow when the user successfully decrypts their xprv
          var killPwVerifySuccessListener = $scope.$on('modalPasswordForm.PasswordVerifySuccess', function (evt, data) {
              if (!data.password) {
                throw new Error('missing password');
              }
              $scope.data.password = data.password;
              $scope.$emit('modalOtpThenUnlockManager.OtpAndUnlockSuccess', $scope.data);
            });
          // Clean up the scope listeners
          $scope.$on('$destroy', function () {
            killOtpSuccessListener();
            killPwVerifySuccessListener();
          });
          function init() {
            $scope.state = $scope.initialState;
            // All fields anticipated during this flow
            $scope.data = {
              password: '',
              otp: ''
            };
          }
          init();
        }
      ]
    };
  }]);/**
 * @ngdoc directive
 * @name modalPasswordForm
 * @description
 * Manages the form for the login password screen in the modal
 * Requires: bg-form-error
 * @example
 *   <div modal-password-form></div>
 */
angular.module('BitGo.Modals.ModalPasswordFormDirective', []).directive('modalPasswordForm', [
  '$q',
  '$rootScope',
  'UtilityService',
  'NotifyService',
  'KeychainsAPI',
  'WalletsAPI',
  'UserAPI',
  'BG_DEV',
  function ($q, $rootScope, UtilityService, NotifyService, KeychainsAPI, WalletsAPI, UserAPI, BG_DEV) {
    return {
      restrict: 'A',
      require: '^?ModalController',
      controller: [
        '$scope',
        '$timeout',
        function ($scope, $timeout) {
          // Form error types to set custom error messages per error (if needed)
          var ERRORS = {
              decryptFail: {
                type: 'decryptFail',
                msg: 'The password provided was invalid.'
              },
              invalidPassword: {
                type: 'invalidPassword',
                msg: 'The password provided was invalid.'
              }
            };
          // If the user is accepting a wallet share, then we use a unique ui
          $scope.isAcceptingShare = null;
          // form data handler
          $scope.form = null;
          /**
         * Validate the pw only form
         * @private
         */
          function passwordOnlyFormIsValid() {
            return $scope.form.password && $scope.form.password !== '';
          }
          function onPwVerifySuccess() {
            $scope.$emit('modalPasswordForm.PasswordVerifySuccess', {
              type: 'passwordverifysuccess',
              password: $scope.form.password
            });
          }
          function setLocalError(errorType) {
            $scope.setFormError(ERRORS[errorType].msg);
          }
          /**
         * Manage showing the correct error in the process
         * @param error {Object} bitGo formatted error object
         */
          function handleErrors(error) {
            switch (error.error) {
            case ERRORS.invalidPassword.type:
              setLocalError(ERRORS.invalidPassword.type);
              break;
            case ERRORS.decryptFail.type:
              setLocalError(ERRORS.decryptFail.type);
              break;
            default:
              NotifyService.error('An error occurred. Please refresh the page and try this again.');
              break;
            }
          }
          /**
         * Decrypt a keychain private key
         * @param {String} password
         * @param {Obj} bitGo keychain object
         * @returns {Obj} decrypted private key || undefined
         */
          function decryptKeychain(password, keychain) {
            try {
              // Check if the keychain is present. If not, it is a cold wallet
              if (keychain.encryptedXprv) {
                var privKey = UtilityService.Crypto.sjclDecrypt(password, keychain.encryptedXprv);
                return { key: privKey };
              }
              return true;
            } catch (e) {
              return undefined;
            }
          }
          /**
         * Decrypt a the user priv key (only for safe walletes)
         * @param {String} password
         * @param {Obj} the wallet for which to decrypt key
         * @returns {Obj} decrypted private key || undefined
         */
          function decryptUserPrivKey(password, wallet) {
            try {
              var privKey = UtilityService.Crypto.sjclDecrypt(password, wallet.data.private.userPrivKey);
              return { key: privKey };
            } catch (e) {
              return undefined;
            }
          }
          /**
         * Function to handle the decrypted piv key
         * @param {Obj} privkey
         * @returns Promise of success or rejecting the decryption
         */
          function checkDecrypted(decrypted) {
            // If we decrypt successfully, then return the right data; kill modal flow
            if (decrypted) {
              // delete the decrypted xprv immediately
              decrypted = null;
              return onPwVerifySuccess();
            }
            var errorData = {
                status: 500,
                message: ERRORS.decryptFail.type,
                data: {}
              };
            return $q.reject(new UtilityService.ErrorHelper(errorData));
          }
          /**
         * Fetch and attempt to decrypt a user keychain for a wallet
         * @private
         */
          function getUserKeychain() {
            var publicKey;
            // if the user is accepting a share, verify the password against the ECDH key
            if ($scope.isAcceptingShare) {
              publicKey = $rootScope.currentUser.settings.ecdhKeychain;
            } else {
              // if the wallet is a safe wallet, decrypt the user priv key to verify
              if (!$scope.locals.wallet.isSafehdWallet()) {
                var params = {
                    bitcoinAddress: $scope.locals.wallet.data.id,
                    gpk: true
                  };
                return WalletsAPI.getWallet(params, false, true).then(function (wallet) {
                  var decrypted = decryptUserPrivKey($scope.form.password, wallet);
                  return checkDecrypted(decrypted);
                });
              }
              // if the wallet is safehd
              publicKey = $scope.locals.wallet.data.private.keychains[0].xpub;
            }
            return KeychainsAPI.get(publicKey).then(function (keychain) {
              var decrypted = decryptKeychain($scope.form.password, keychain);
              return checkDecrypted(decrypted);
            });
          }
          $scope.verifyPassword = function () {
            $scope.clearFormError();
            if (passwordOnlyFormIsValid()) {
              getUserKeychain().catch(handleErrors);
            } else {
              setLocalError(ERRORS.invalidPassword.type);
            }
          };
          /**
         * Handles any specific setup we need to do in the modal based on an action
         * @private
         */
          function setModalActions() {
            if ($scope.locals.userAction === BG_DEV.MODAL_USER_ACTIONS.acceptShare) {
              $scope.isAcceptingShare = true;
            }
          }
          function init() {
            $scope.form = {
              password: '',
              passwordConfirm: ''
            };
            setModalActions();
          }
          init();
        }
      ],
      link: function (scope, ele, attrs) {
        /**
         * UI - Set the local password strength object
         * @param passwordStrength {Object}
         * @public
         */
        scope.checkStrength = function (passwordStrength) {
          scope.passwordStrength = passwordStrength;
        };
        /**
         * UI show the strength meter
         * @public
         */
        scope.showPasswordStrength = function () {
          return scope.form.password && scope.form.password.length && scope.passwordStrength;
        };
      }
    };
  }
]);/**
 * @ngdoc service
 * @name SyncService
 * @description
 * Singleton to manage the state for all modals in the app
 */
angular.module('BitGo.Modals.ModalStateService', []).factory('ModalStateService', [
  '$rootScope',
  '$modal',
  'BG_DEV',
  function ($rootScope, $modal, BG_DEV) {
    // If the app loses connection, we want to only show the warning modal
    // once. We set this flag to true if we ever receive this fail case.
    var OFFLINE_WARNING_SHOWING = false;
    /**
     * Helper - Handles the modal for when the app is offline
     * @private
     */
    function openWarningModal() {
      // The instance of the app blocking modal used to let the user know
      // they've lost connectivity. It can only be dismissed by receiving a
      // successful pingback from the server
      $modal.open({
        templateUrl: 'modal/templates/modalcontainer.html',
        controller: 'ModalController',
        backdrop: 'static',
        resolve: {
          locals: function () {
            return {
              type: BG_DEV.MODAL_TYPES.offlineWarning,
              userAction: BG_DEV.MODAL_USER_ACTIONS.offlineWarning
            };
          }
        }
      }).result.then(function (data) {
        OFFLINE_WARNING_SHOWING = false;
      }, function (error) {
        // kill the modal on error - this should never happen though
        OFFLINE_WARNING_SHOWING = false;
      });
    }
    /**
     * Trigger the app-blocking modal when the app loses connectivity
     * @private
     */
    function triggerAppOfflineWarning() {
      if (OFFLINE_WARNING_SHOWING) {
        return;
      }
      OFFLINE_WARNING_SHOWING = true;
      openWarningModal();
    }
    // Public API
    return { triggerAppOfflineWarning: triggerAppOfflineWarning };
  }
]);// Model for Enterprises
angular.module('BitGo.Models.EnterpriseModel', []).factory('EnterpriseModel', [
  '$rootScope',
  function ($rootScope) {
    // Constant to define the 'personal' enterprise
    // Note: everything is scoped to an enterprise; thus wallets without
    // an enterprise (personal wallets) can be grouped under the 'personal' enterprise
    var PERSONAL_ENTERPRISE = {
        id: 'personal',
        name: 'Personal',
        primaryContact: '',
        emergencyPhone: ''
      };
    // If there is no enterprise info passed in, it means we're
    // creating the `personal` enterprise object
    var personalEnterpriseData = PERSONAL_ENTERPRISE;
    // Enterprise Constructor
    function Enterprise(enterpriseData) {
      var data = enterpriseData || personalEnterpriseData;
      this.name = data.name;
      this.id = data.id;
      this.primaryContact = data.primaryContact;
      this.emergencyPhone = data.emergencyPhone;
      this.isPersonal = this.id === PERSONAL_ENTERPRISE.id && this.name === PERSONAL_ENTERPRISE.name;
      this.walletCount = 0;
      this.balance = 0;
      this.walletShareCount = {
        incoming: 0,
        outgoing: 0
      };
    }
    /**
     * Set the enterprise's overall balance based on all wallets
     * @param wallets {Object} collection of BitGo client wallet objects
     * @public
     */
    Enterprise.prototype.setBalance = function (wallets) {
      if (!wallets) {
        throw new Error('Missing wallets');
      }
      // build the balance for the enterprise
      function buildBalance(wallets) {
        if (!wallets) {
          return;
        }
        // Build the bitcoin balance
        return _.reduce(wallets, function (sum, wallet) {
          return sum + wallet.data.balance;
        }, 0);
      }
      var filteredWallets = {};
      var self = this;
      _.forIn(wallets, function (wallet) {
        var personalMatch = self.id === PERSONAL_ENTERPRISE.id && !wallet.data.enterprise;
        var enterpriseMatch = wallet.data.enterprise === self.id;
        if (personalMatch || enterpriseMatch) {
          filteredWallets[wallet.data.id] = wallet;
        }
      });
      self.balance = buildBalance(filteredWallets);
    };
    /**
     * Set the wallet count on the enterprise
     * @param wallets {Object} collection of BitGo client wallet objects
     * @public
     */
    Enterprise.prototype.setWalletCount = function (wallets) {
      if (!wallets) {
        throw new Error('Missing wallets');
      }
      var self = this;
      self.walletCount = 0;
      _.forIn(wallets, function (wallet) {
        var personalMatch = self.id === PERSONAL_ENTERPRISE.id && !wallet.data.enterprise;
        var enterpriseMatch = wallet.data.enterprise === self.id;
        if (personalMatch || enterpriseMatch) {
          self.walletCount++;
        }
      });
    };
    /**
     * Set the wallet count on the enterprise
     * @param wallets {Object} collection of BitGo client wallet objects
     * @public
     */
    Enterprise.prototype.setWalletShareCount = function (walletShares) {
      if (!walletShares) {
        throw new Error('Missing wallet shares');
      }
      var self = this;
      self.walletShareCount = {
        incoming: 0,
        outgoing: 0
      };
      _.forIn(walletShares.incoming, function (walletShare) {
        var personalMatch = self.id === PERSONAL_ENTERPRISE.id && !walletShare.enterprise;
        var enterpriseMatch = walletShare.enterprise === self.id;
        if (personalMatch || enterpriseMatch) {
          self.walletShareCount.incoming++;
        }
      });
      _.forIn(walletShares.outgoing, function (walletShare) {
        var personalMatch = self.id === PERSONAL_ENTERPRISE.id && !walletShare.enterprise;
        var enterpriseMatch = walletShare.enterprise === self.id;
        if (personalMatch || enterpriseMatch) {
          self.walletShareCount.outgoing++;
        }
      });
    };
    // Decorator: Adds users to the enterprise object (based on all wallets
    // associated with the enterprise)
    Enterprise.prototype.setUsers = function (wallets) {
      var result = {};
      var hasUsers = false;
      _.forIn(wallets, function (wallet) {
        // If the wallet has an array of users on it, then it is shared
        if (wallet.data.admin && wallet.data.admin.users) {
          hasUsers = true;
          // Build a user object keyed into with userIds
          _.forEach(wallet.data.admin.users, function (user) {
            if (!result[user.user]) {
              result[user.user] = [];
            }
            result[user.user].push({
              walletId: wallet.data.id,
              walletLabel: wallet.data.label,
              permissions: user.permissions
            });
          });
        }  // If the user is admin but the wallet does not have users
        else if (wallet.data.admin) {
          hasUsers = true;
          if (!result[$rootScope.currentUser.settings.id]) {
            result[$rootScope.currentUser.settings.id] = [];
          }
          result[$rootScope.currentUser.settings.id].push({
            walletId: wallet.data.id,
            walletLabel: wallet.data.label,
            permissions: 'admin,spend,view'
          });
        }
      });
      if (hasUsers) {
        this.users = result;
      }
    };
    /**
    * Decorator: Adds approvals to the enterprise object (based on all wallets
    * associated with the enterprise)
    * @param wallets {Object} all wallets associated with this enterprise
    * @returns {Int} num of keys in the enterprise's pending approval object
    * @public
    */
    Enterprise.prototype.setApprovals = function (wallets) {
      var result = {};
      _.forIn(wallets, function (wallet) {
        var approvals = wallet.data.pendingApprovals;
        if (approvals) {
          // Build the enterprise's pendingApprovals array
          _.forEach(approvals, function (approval) {
            result[approval.id] = approval;
          });
        }
      });
      this.pendingApprovals = result;
      return _.keys(this.pendingApprovals).length;
    };
    /**
    * remove the pending approval from the enterprise
    * @param {String} approval id to remove
    * @public
    */
    Enterprise.prototype.deleteApproval = function (approvalId) {
      if (!this.pendingApprovals) {
        return;
      }
      delete this.pendingApprovals[approvalId];
    };
    return { Enterprise: Enterprise };
  }
]);angular.module('BitGo.Model', [
  'BitGo.Models.EnterpriseModel',
  'BitGo.Models.UserModel',
  'BitGo.Models.WalletModel',
  'BitGo.Utility'
]);// Model for the App's Current User
angular.module('BitGo.Models.UserModel', []).factory('UserModel', [
  '$location',
  '$rootScope',
  'BG_DEV',
  function ($location, $rootScope, BG_DEV) {
    var defaultUserSettings = {
        id: null,
        currency: {
          currency: BG_DEV.CURRENCY.DEFAULTS.CURRENCY,
          bitcoinUnit: BG_DEV.CURRENCY.DEFAULTS.BITCOIN_UNIT
        },
        email: {
          email: '',
          verified: false
        },
        phone: {
          phone: '',
          verified: false
        }
      };
    function User(loggedIn, settings) {
      this.settings = settings;
      // set to true when a user has a valid token
      this.loggedIn = loggedIn;
      // set to true when a user has a saved/verified phone
      this.hasAccess = this.checkAccess();
    }
    User.prototype.phoneNotSet = function () {
      if (!this.settings.phone || this.settings.phone.phone === '') {
        return true;
      }
      return false;
    };
    User.prototype.phoneNotVerified = function () {
      return !this.settings.phone.verified;
    };
    User.prototype.emailNotSet = function () {
      if (!this.settings.email || this.settings.email.email === '') {
        return true;
      }
      return false;
    };
    User.prototype.emailNotVerified = function () {
      return !this.settings.email.verified;
    };
    User.prototype.checkAccess = function () {
      // ensure they have a verified email first
      if (this.emailNotSet() || this.emailNotVerified()) {
        return false;
      }
      if (this.phoneNotSet() || this.phoneNotVerified()) {
        return false;
      }
      return true;
    };
    User.prototype.setProperty = function (properties) {
      var self = this;
      _.forIn(properties, function (value, prop) {
        if (!_.has(self, prop)) {
          throw new Error(BG_DEV.ERRORS.INVALID_ROOT_USER_PROP);
        }
        self[prop] = value;
      });
    };
    function PlaceholderUser() {
      return new User(false, defaultUserSettings);
    }
    return {
      User: User,
      PlaceholderUser: PlaceholderUser
    };
  }
]);// Model for Wallets
angular.module('BitGo.Models.WalletModel', []).factory('WalletModel', [
  '$rootScope',
  'CacheService',
  'BG_DEV',
  function ($rootScope, CacheService, BG_DEV) {
    // map of functions to test policy violation conditions based on test data
    var policyTests = {
        'com.bitgo.whitelist.address': function (testAddress, policy) {
          if (!policy.condition.addresses || !policy.condition.addresses.length) {
            return false;
          }
          var whitelisted = _.some(policy.condition.addresses, function (address) {
              return address == testAddress;
            });
          return !whitelisted;
        },
        'com.bitgo.limit.tx': function (testAmount, policy) {
          if (!policy.condition.amount) {
            return false;
          }
          return parseFloat(testAmount) > policy.condition.amount;
        },
        'com.bitgo.limit.day': function (testAmount, policy) {
          if (!policy.condition.amount) {
            return false;
          }
          return parseFloat(testAmount) > policy.condition.amount;
        }
      };
    var walletCache = CacheService.getCache('Wallets') ? CacheService.getCache('Wallets') : new CacheService.Cache('localStorage', 'Wallets', 120 * 60 * 1000);
    function buildBalance(wallet) {
      // If wallet does not have a balance, check the cache for a balance.
      if (wallet.balance === undefined) {
        var cacheLookup = walletCache && walletCache.get(wallet.id);
        if (cacheLookup) {
          wallet.balance = cacheLookup.balance;
          wallet.confirmedBalance = cacheLookup.confirmedBalance;
        }
      }
    }
    function buildLink(wallet) {
    }
    function getWalletData(wallet) {
      buildBalance(wallet);
      buildLink(wallet);
      return wallet;
    }
    function Wallet(walletData) {
      var self = this;
      // get the user's role for this wallet
      function getWalletRole() {
        var permissions = self.data.permissions;
        if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) > -1) {
          return BG_DEV.WALLET.ROLES.ADMIN;
        } else if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1) {
          return BG_DEV.WALLET.ROLES.SPEND;
        } else if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.VIEW;
        } else {
          throw new Error('Missing a valid wallet role for wallet ' + self.data.id);
        }
      }
      // First set data on the wallet
      this.data = getWalletData(walletData);
      this.role = getWalletRole();
      this.multipleAdmins = self.data.adminCount > 1;
    }
    // Decorator: Adds report data information to the wallet instance
    Wallet.prototype.setReportDates = function (reportData) {
      this.data.reportDates = reportData;
    };
    /**
    * Check if the wallet in question has policies on it
    * @returns {Bool}
    * @public
    */
    Wallet.prototype.hasPolicy = function () {
      if (!this.data.admin || !this.data.admin.policy) {
        return false;
      }
      if (this.data.admin.policy && !this.data.admin.policy.rules) {
        console.error('Missing polcy rules');
        return false;
      }
      return true;
    };
    // Helper: Returns the report date object for the given time period
    Wallet.prototype.getReportDateInfoForPeriod = function (period) {
      var result;
      _.forEach(this.data.reportDates, function (reportInfo) {
        _.forEach(reportInfo.data, function (monthInfo) {
          if (period === monthInfo.dateVisible) {
            result = monthInfo;
          }
        });
      });
      return result;
    };
    // Helper: Lets caller know if a particular item violates a specified policy
    Wallet.prototype.checkPolicyViolation = function (testPolicyId, testData) {
      if (!_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, testPolicyId)) {
        throw new Error('Invalid testPolicyId');
      }
      if (!this.hasPolicy()) {
        return false;
      }
      var self = this;
      var violatesPolicy;
      _.forEach(self.data.admin.policy.rules, function (policyItem) {
        if (policyItem.id === testPolicyId) {
          violatesPolicy = policyTests[testPolicyId](testData, policyItem);
        }
      });
      return violatesPolicy || false;
    };
    /**
    * Return the whitelist policy for a wallet if it exists
    * @returns {Array} all whitelist wallet policy items
    * @public
    */
    Wallet.prototype.getWhitelist = function () {
      var self = this;
      var policy = self.hasPolicy();
      if (!policy) {
        return;
      }
      return _.filter(self.data.admin.policy.rules, function (policyItem) {
        return policyItem.id === BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address'];
      })[0];
    };
    /**
    * remove a pending approval from the wallet
    * @param {String} approval id
    * @public
    */
    Wallet.prototype.deleteApproval = function (approvalId) {
      var approvals = this.data.pendingApprovals;
      _.forEach(approvals, function (approval, index) {
        if (approval && approval.id === approvalId) {
          // mutate the original approvals array
          approvals.splice(index, 1);
        }
      });
    };
    /**
    * Add a new pending approval to the wallet's pending approvals array
    * @param approval {Object} BitGo pending approval object
    * @returns {Int} length of the wallets new pending approvals array
    * @public
    */
    Wallet.prototype.addApproval = function (approval) {
      if (!approval) {
        throw new Error('invalid approval');
      }
      this.data.pendingApprovals = this.data.pendingApprovals || [];
      this.data.pendingApprovals.push(approval);
      return this.data.pendingApprovals.length;
    };
    /**
    * Check if the wallet is a safehd wallet
    * @returns {Boolean} true if safehd, false if not
    * @public
    */
    Wallet.prototype.isSafehdWallet = function () {
      return this.data.type === BG_DEV.WALLET.WALLET_TYPES.SAFEHD;
    };
    /**
    * Check if the users role on the wallet is 'Admin'
    * @returns {Boolean} true if 'Admin', false if not
    * @public
    */
    Wallet.prototype.isRoleAdmin = function () {
      return this.role === BG_DEV.WALLET.ROLES.ADMIN;
    };
    /**
    * Check if the users role on the wallet is 'Viewer'
    * @returns {Boolean} true if 'Viewer', false if not
    * @public
    */
    Wallet.prototype.isRoleViewer = function () {
      return this.role === BG_DEV.WALLET.ROLES.VIEW;
    };
    return { Wallet: Wallet };
  }
]);// Module that manages the app's popover notifications
angular.module('BitGo.Notifications', ['BitGo.Notifications.NotifyService']);// Manages server error and success notifications in the app
angular.module('BitGo.Notifications.NotifyService', []).factory('NotifyService', [
  '$timeout',
  '$http',
  '$compile',
  '$templateCache',
  '$rootScope',
  function ($timeout, $http, $compile, $templateCache, $rootScope) {
    var templates = {
        info: '/notifications/templates/info.html',
        error: '/notifications/templates/error.html',
        success: '/notifications/templates/success.html'
      };
    var startTop = 75;
    var verticalSpacing = 15;
    var duration = 5000;
    var defaultType = 'info';
    var position = 'center';
    var container = document.body;
    // local instance of the message elements
    var messageElements = [];
    // Notifier Constructor
    var Notifier = function () {
    };
    Notifier.prototype.notify = function (args) {
      if (typeof args !== 'object') {
        args = { message: args };
      }
      // set up the locals
      args.type = args.type || defaultType;
      args.position = args.position || position;
      args.container = args.container || container;
      args.classes = args.classes || '';
      // set up the scope for the template
      var scope = args.scope ? args.scope.$new() : $rootScope.$new();
      scope.$message = args.message;
      scope.$classes = args.classes;
      try {
        $http.get(templates[args.type], { cache: $templateCache }).success(function (template) {
          // compile the template with the new scope
          var templateElement = $compile(template)(scope);
          // bind to the end of the opacity transition event, and when the
          // element is invisible, remove it from the messages array and view
          templateElement.bind('webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd', function (e) {
            if (e.propertyName === 'opacity' || e.originalEvent && e.originalEvent.propertyName === 'opacity') {
              templateElement.remove();
              messageElements.splice(messageElements.indexOf(templateElement), 1);
              layoutMessages();
            }
          });
          angular.element(args.container).append(templateElement);
          messageElements.push(templateElement);
          if (args.position === 'center') {
            $timeout(function () {
              templateElement.css('margin-left', '-' + templateElement[0].offsetWidth / 2 + 'px');
            });
          }
          scope.$close = function () {
            // at end of transition, message is removed
            templateElement.css('opacity', 0).attr('data-closing', 'true');
            // reflow the messages and clean up the old scope
            layoutMessages();
            scope.$destroy();
          };
          var layoutMessages = function () {
            var currentY = startTop;
            for (var i = messageElements.length - 1; i >= 0; i--) {
              var shadowHeight = 10;
              var element = messageElements[i];
              var height = element[0].offsetHeight;
              var top = currentY + height + shadowHeight;
              if (element.attr('data-closing')) {
                top += 20;
              } else {
                currentY += height + verticalSpacing;
              }
              element.css('top', top + 'px').css('margin-top', '-' + (height + shadowHeight) + 'px').css('visibility', 'visible');
            }
          };
          $timeout(function () {
            layoutMessages();
          });
          if (duration > 0) {
            $timeout(function () {
              scope.$close();
            }, duration);
          }
        }).error(function (data) {
          throw new Error('Template specified for cgNotify (' + args.type + ') could not be loaded. ' + data);
        });
      } catch (error) {
        console.log('Error loading the notification template: ', error.message);
      }
      var retVal = {};
      retVal.close = function () {
        if (scope.$close) {
          scope.$close();
        }
      };
      Object.defineProperty(retVal, 'message', {
        get: function () {
          return scope.$message;
        },
        set: function (val) {
          scope.$message = val;
        }
      });
      return retVal;
    };
    Notifier.prototype.config = function (args) {
      startTop = !angular.isUndefined(args.startTop) ? args.startTop : startTop;
      verticalSpacing = !angular.isUndefined(args.verticalSpacing) ? args.verticalSpacing : verticalSpacing;
      duration = !angular.isUndefined(args.duration) ? args.duration : duration;
      defaultType = args.type ? args.type : defaultType;
      position = !angular.isUndefined(args.position) ? args.position : position;
      container = args.container ? args.container : container;
    };
    Notifier.prototype.closeAll = function () {
      for (var i = messageElements.length - 1; i >= 0; i--) {
        var element = messageElements[i];
        element.css('opacity', 0);
      }
    };
    return {
      notify: function (args) {
        return new Notifier().notify(args);
      },
      success: function (msg) {
        var params = {
            type: 'success',
            message: msg
          };
        return this.notify(params);
      },
      successHandler: function (msg) {
        var args = {
            type: 'success',
            message: msg
          };
        var self = this;
        return function () {
          return self.notify(args);
        };
      },
      error: function (msg) {
        var params = {
            type: 'error',
            message: _.string.capitalize(msg)
          };
        return this.notify(params);
      },
      errorHandler: function (error) {
        var args = {
            type: 'error',
            message: _.string.capitalize(error.error)
          };
        return new Notifier().notify(args);
      },
      info: function (msg) {
        var params = {
            type: 'info',
            message: msg
          };
        return this.notify(params);
      }
    };
  }
]);/**
 * @ngdoc module
 * @name BitGo.PostAuth
 * @description
 * Manages all things dealing with post-login actions that need to happen
 */
angular.module('BitGo.PostAuth', ['BitGo.PostAuth.PostAuthService']);/**
 * @ngdoc service
 * @name PostAuthService
 * @description
 * Service for managing post sign-in actions and redirects
 */
angular.module('BitGo.PostAuth.PostAuthService', []).factory('PostAuthService', [
  '$location',
  function ($location) {
    // All valid post auth types to be run
    var RUN_TYPES = {
        walletRecover: {
          checkDataValidity: function (data) {
            return data.email;
          },
          run: function () {
            $location.path('/login');
            return true;
          }
        },
        path: {
          checkDataValidity: function (data) {
            return data && typeof data === 'string';
          },
          run: function () {
            if (!pendingPostAuth.data && typeof pendingPostAuth.data !== 'string') {
              console.log('Insufficient data to run post auth');
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
      pendingPostAuth = {
        type: type,
        data: data
      };
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
]);angular.module('BitGo.Settings.AboutFormDirective', []).directive('settingsAboutForm', [
  '$rootScope',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  function ($rootScope, UserAPI, Util, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          var validate = Util.Validators;
          $scope.settings = $rootScope.currentUser.settings;
          function formIsValid() {
            if (!$scope.settings.name.full) {
              $scope.setFormError('Please enter a name.');
              return false;
            }
            return true;
          }
          function onSaveAboutSuccess(settings) {
            $scope.getSettings();
          }
          function onSaveAboutFail(error) {
            if (Util.API.isOtpError(error)) {
              $scope.openModal().then(function (data) {
                if (data.type === 'otpsuccess') {
                  $scope.saveAboutForm();
                }
              }).catch(unlockFail);
            } else {
              Notify.error(error.error);
            }
          }
          $scope.hasChanges = function () {
            if (!$scope.settings || !$scope.localSettings) {
              return false;
            }
            if (!_.isEqual($scope.localSettings.name, $scope.settings.name)) {
              return true;
            }
            if ($scope.localSettings.timezone !== $scope.settings.timezone) {
              return true;
            }
            return false;
          };
          /**
         *  Saves changes to the about form
         *  @private
         */
          $scope.saveAboutForm = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var newSettings = {
                  otp: $scope.otp,
                  settings: {
                    name: { full: $scope.settings.name.full },
                    timezone: $scope.settings.timezone
                  }
                };
              $scope.saveSettings(newSettings).then(onSaveAboutSuccess).catch(onSaveAboutFail);
            }
          };
        }
      ]
    };
  }
]);angular.module('BitGo.Settings.CurrencyFormDirective', []).directive('settingsCurrencyForm', [
  '$rootScope',
  'NotifyService',
  function ($rootScope, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          function onSubmitSuccess() {
            $scope.getSettings();
          }
          $scope.submitCurrency = function () {
            var params = {
                otp: $scope.otp,
                settings: $scope.settings
              };
            $scope.saveSettings(params).then(onSubmitSuccess).catch(Notify.errorHandler);
          };
          $scope.hasChanges = function () {
            if (!$scope.settings) {
              return false;
            }
            if (!_.isEqual($scope.localSettings.currency, $scope.settings.currency)) {
              return true;
            }
            return false;
          };
          // Listen for changes to user's settings and update the
          // app's financial data/preferences if needed
          $rootScope.$on('SettingsController.HasNewSettings', function () {
            if ($scope.settings.currency.bitcoinUnit !== $rootScope.currency.bitcoinUnit) {
              $rootScope.$emit('SettingsCurrencyForm.ChangeBitcoinUnit', $scope.settings.currency.bitcoinUnit);
            }
            if ($scope.settings.currency.currency !== $rootScope.currency.currency) {
              $rootScope.$emit('SettingsCurrencyForm.ChangeAppCurrency', $scope.settings.currency.currency);
            }
          });
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name developersAccesstokenAddForm
 * @description
 * Manages the ui for adding new access tokens
 */
angular.module('BitGo.Settings.DevelopersAccesstokenAddFormDirective', []).directive('developersAccesstokenAddForm', [
  '$rootScope',
  '$modal',
  'NotifyService',
  'AccessTokensAPI',
  'UtilityService',
  'BG_DEV',
  function ($rootScope, $modal, NotifyService, AccessTokensAPI, UtilityService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^developersManager',
      controller: [
        '$scope',
        function ($scope) {
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
              {
                name: 'wallet_view_all',
                text: 'View',
                selected: true
              },
              {
                name: 'wallet_spend_all',
                text: 'Spend',
                selected: true
              },
              {
                name: 'wallet_manage_all',
                text: 'Manage Wallets',
                selected: true
              },
              {
                name: 'wallet_create',
                text: 'Create Wallets',
                selected: false
              }
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
              duration: 315360000,
              oAuthScopes: [
                'openid',
                'profile'
              ]
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
            if (!$scope.tokenParams.txValueLimit.toString()) {
              $scope.setFormError('New tokens must have a specified limit.');
              return false;
            }
            if (!$scope.tokenParams.duration) {
              $scope.setFormError('New tokens must have a specified duration.');
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
              openModal({ type: BG_DEV.MODAL_TYPES.otp }).then(function (result) {
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
            var ipRestrict = $scope.tokenParams.ipRestrict && $scope.tokenParams.ipRestrict.replace(/ /g, '').split(',');
            var selectedOAuthScope = _.filter($scope.accessToken.oAuthScopes, function (scope) {
                return scope.selected === true;
              });
            var selectedOAuthScopeNames = _.map(selectedOAuthScope, function (o) {
                return o.name;
              });
            // Always assume these 2 scopes by default, since we're in first-party mode
            selectedOAuthScopeNames.push('openid', 'profile');
            var tokenParams = {
                label: $scope.tokenParams.label,
                scope: selectedOAuthScopeNames,
                duration: $scope.tokenParams.duration,
                ipRestrict: ipRestrict !== '' ? ipRestrict : undefined,
                txValueLimit: $scope.tokenParams.txValueLimit,
                otp: $scope.otp
              };
            return AccessTokensAPI.add(tokenParams);
          }
          /**
        * Adds a new access token on to the user
        * @public
        */
          $scope.addNewToken = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              submitToken().then(function (data) {
                // reset local state
                initNewTokenParams();
                initNewOAuthScopes();
                // refresh the token list and take the user back to the list view
                $scope.setToken(data);
                $scope.refreshAccessTokens();
                // function in parent (developersManager)
                $scope.setState('list');
              }).catch(handleAddTokenError);
            }
          };
          /**
        * Toggles terms
        * @public
        */
          $scope.toggleTerms = function () {
            $scope.agreedToTerms = !$scope.agreedToTerms;
          };
          /**
        * Watch for state changes to clean up any state
        * @private
        */
          var killStateWatcher = $scope.$watch('state', function (state) {
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
          $scope.$on('$destroy', function () {
            killStateWatcher();
          });
          function init() {
            $scope.accessToken = {};
            initNewTokenParams();
            initNewOAuthScopes();
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name DevelopersForm
 * @description
 * Manages the ui for adding/removing access tokens for the API
 */
angular.module('BitGo.Settings.DevelopersFormDirective', []).directive('developersForm', [
  '$rootScope',
  'NotifyService',
  'AccessTokensAPI',
  function ($rootScope, NotifyService, AccessTokensAPI) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          console.log('test');
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name developersManager
 * @description
 * Manages the ui and sub directives for viewing/adding/removing access tokens
 */
angular.module('BitGo.Settings.DevelopersManagerDirective', []).directive('developersManager', [
  '$rootScope',
  'NotifyService',
  'AccessTokensAPI',
  function ($rootScope, NotifyService, AccessTokensAPI) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          // local oAuth scopes to filter the ui list against
          var OAUTH_SCOPES_MAP = [
              {
                name: 'wallet_view_all',
                text: 'View'
              },
              {
                name: 'wallet_spend_all',
                text: 'Spend'
              },
              {
                name: 'wallet_manage_all',
                text: 'Manage Wallets'
              },
              {
                name: 'wallet_create',
                text: 'Create Wallets'
              }
            ];
          // valid view states
          $scope.viewStates = [
            'add',
            'list'
          ];
          /**
        * Generate the scope's access token list
        * @public
        */
          $scope.refreshAccessTokens = function () {
            AccessTokensAPI.list().then(function (data) {
              var tokens = data.accessTokens;
              var scopeLookup = _.indexBy(OAUTH_SCOPES_MAP, 'name');
              $scope.accessTokenList = _.transform(tokens, function (result, token) {
                // Only show tokens with labels (long term access)
                if (!!token.label) {
                  // Do not display openid and profile scopes (they are implicit)
                  token.scope = _.map(_.intersection(_.keys(scopeLookup), token.scope), function (name) {
                    return scopeLookup[name].text;
                  });
                  return result.push(token);
                }
              });
            }).catch(function (error) {
              console.log('Error getting list of access tokens: ' + error.error);
            });
          };
          /**
        * Reset to list view when user changes top level sections within settings
        * @private
        */
          var killStateWatcher = $scope.$on('SettingsController.StateChangesd', function (evt, data) {
              if (data.newState) {
                $scope.setState('list');
              }
            });
          /**
        * Clean up all watchers when the scope is garbage collected
        * @private
        */
          $scope.$on('$destroy', function () {
            killStateWatcher();
          });
          $scope.startRemovingToken = function (id) {
            $scope.IdToConfirmRemove = id;
          };
          $scope.stopRemovingToken = function () {
            $scope.IdToConfirmRemove = null;
          };
          $scope.showRemovingConfirm = function (id) {
            return id === $scope.IdToConfirmRemove ? true : false;
          };
          $scope.removeAccessToken = function (accessTokenId) {
            AccessTokensAPI.remove(accessTokenId).then(function (data) {
              $scope.refreshAccessTokens();
            }).catch(function (error) {
              console.log('Error getting list of access tokens: ' + error.error);
            });
          };
          $scope.newToken = false;
          $scope.setToken = function (token) {
            $scope.newToken = token;
          };
          $scope.removeToken = function (token) {
            $scope.newToken = undefined;
          };
          function init() {
            $scope.state = 'list';
            $scope.accessTokenList = [];
            $scope.refreshAccessTokens();
          }
          init();
        }
      ]
    };
  }
]);angular.module('BitGo.Settings.NotificationFormDirective', []).directive('settingsNotificationForm', [
  '$rootScope',
  'NotifyService',
  function ($rootScope, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          $scope.digestIntervals = {
            daily: {
              name: 'daily',
              value: 86400
            },
            every_other_day: {
              name: 'every other day',
              value: 86400 * 2
            },
            weekly: {
              name: 'weekly',
              value: 86400 * 7
            },
            bi_weekly: {
              name: 'bi-weekly',
              value: 86400 * 7 * 2
            },
            monthly: {
              name: 'monthly',
              value: 86400 * 7 * 2 * 2
            }
          };
          function onSubmitSuccess() {
            $scope.getSettings();
          }
          // function to set/unset digest interval if digest is enabled/disabled 
          $scope.resetDigest = function () {
            //default to daily
            if ($scope.settings.digest.enabled) {
              $scope.settings.digest.intervalSeconds = 86400;
            }  //reset to empty when checkbox is not checked
            else {
              $scope.settings.digest.intervalSeconds = 0;
            }
          };
          $scope.hasChanges = function () {
            if (!$scope.settings) {
              return false;
            }
            if (!_.isEqual($scope.localSettings.notifications, $scope.settings.notifications)) {
              return true;
            }
            if (!_.isEqual($scope.localSettings.digest, $scope.settings.digest)) {
              return true;
            }
            return false;
          };
          $scope.submitNotifications = function () {
            var params = {
                otp: $scope.otp,
                settings: $scope.settings
              };
            $scope.saveSettings(params).then(onSubmitSuccess).catch(Notify.errorHandler);
          };
        }
      ]
    };
  }
]);angular.module('BitGo.Settings.PasswordFormDirective', []).directive('settingsPwForm', [
  '$rootScope',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'RequiredActionService',
  'BG_DEV',
  function ($rootScope, UserAPI, Util, Notify, RequiredActionService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          var validate = Util.Validators;
          // object containing the strength of the user's new password
          $scope.passwordStrength = null;
          // If the user has a weak login password, show the warning
          $scope.showWeakPasswordWarning = false;
          function formIsValid() {
            if (!$scope.settings.local) {
              $scope.setFormError('You must enter passwords in order to change your password.');
              return false;
            }
            if (!$scope.settings.local.oldPassword) {
              $scope.setFormError('Please enter your existing password.');
              return false;
            }
            if (!$scope.settings.local.newPassword) {
              $scope.setFormError('Please enter new password.');
              return false;
            }
            if (!$scope.settings.local.newPasswordConfirm) {
              $scope.setFormError('Please confirm new password.');
              return false;
            }
            if ($scope.settings.local.newPassword !== $scope.settings.local.newPasswordConfirm) {
              $scope.setFormError('Please enter matching passwords.');
              return false;
            }
            if ($scope.passwordStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
              $scope.setFormError('Please enter a stronger password.');
              return false;
            }
            return true;
          }
          $scope.hasChanges = function () {
            if (!$scope.settings || !$scope.settings.local) {
              return false;
            }
            if ($scope.settings.local.oldPassword && $scope.settings.local.newPassword && $scope.settings.local.newPassword == $scope.settings.local.newPasswordConfirm) {
              return true;
            }
            return false;
          };
          function resetForm() {
            $scope.settings.local.newPassword = null;
            $scope.settings.local.newPasswordConfirm = null;
            $scope.settings.local.oldPassword = null;
            $scope.passwordStrength = null;
          }
          function onGetEncryptedFail(error) {
            if (Util.API.isOtpError(error)) {
              $scope.openModal().then(function (data) {
                if (data.type === 'otpsuccess') {
                  $scope.savePw();
                }
              });
            } else {
              Notify.error(error.error);
            }
          }
          function savePwSuccess(settings) {
            // If the user was upgrading a legacy weak password as a result of
            // a required action, clear it out now
            if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
              RequiredActionService.removeAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
              $scope.showWeakPasswordWarning = false;
            }
            // Reset the form
            resetForm();
          }
          // Function to verify if the passcode the user put in is valid
          function checkPasscode(password) {
            return UserAPI.verifyPassword({ password: password });
          }
          // Decrypt a keychain private key
          function decryptXprv(encryptedXprv, passcode) {
            try {
              var xprv = Util.Crypto.sjclDecrypt(passcode, encryptedXprv);
              return xprv;
            } catch (e) {
              return undefined;
            }
          }
          function decryptThenReencrypt(encrypted, oldRawPassword, newRawPassword) {
            if (!encrypted.keychains) {
              return {};
            }
            var newKeychains = {};
            _.forOwn(encrypted.keychains, function (encryptedXprv, xpub) {
              var xprv = decryptXprv(encryptedXprv, oldRawPassword);
              if (xprv) {
                // reencrypt with newpassword
                newKeychains[xpub] = Util.Crypto.sjclEncrypt(newRawPassword, xprv);
              } else {
                // since we can't decrypt this, leave it untouched
                newKeychains[xpub] = encryptedXprv;
              }
            });
            return newKeychains;
          }
          $scope.savePw = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var oldRawPassword = $scope.settings.local.oldPassword;
              var newRawPassword = $scope.settings.local.newPassword;
              var oldPassword = Util.Crypto.sjclHmac($scope.settings.username, oldRawPassword);
              var newPassword = Util.Crypto.sjclHmac($scope.settings.username, newRawPassword);
              checkPasscode(oldPassword).then(function () {
                return UserAPI.getUserEncryptedData();
              }).then(function (encrypted) {
                var keychains = decryptThenReencrypt(encrypted, oldRawPassword, newRawPassword);
                return {
                  keychains: keychains,
                  version: encrypted.version,
                  oldPassword: oldPassword,
                  password: newPassword
                };
              }).then(function (params) {
                return UserAPI.changePassword(params);
              }).then(savePwSuccess).catch(onGetEncryptedFail);
            }
          };
          $scope.checkStrength = function (passwordStrength) {
            $scope.passwordStrength = passwordStrength;
          };
          $scope.showPasswordStrength = function () {
            var local = $scope.settings && $scope.settings.local;
            return local && local.newPassword && local.newPassword.length && $scope.passwordStrength;
          };
          function init() {
            // Check if the user has a weak legacy password upgrade action
            // that needs to be taken
            if (RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
              $scope.showWeakPasswordWarning = true;
            }
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name settingsPhoneForm
 * @description
 * Directive to manage the settings phone form
 */
angular.module('BitGo.Settings.PhoneFormDirective', []).directive('settingsPhoneForm', [
  '$rootScope',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  function ($rootScope, UserAPI, Util, Notify) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          // access to the utility class validators
          var validate = Util.Validators;
          // Bool to show/hide the verification
          var phoneNeedsVerification;
          function formIsValid() {
            if (!validate.phoneOk($scope.settings.phone.phone)) {
              $scope.setFormError('Please enter a valid phone number.');
              return false;
            }
            return true;
          }
          $scope.hasChanges = function () {
            if (!$scope.settings) {
              return false;
            }
            if (!_.isEqual($scope.localSettings.phone, $scope.settings.phone)) {
              return true;
            }
            return false;
          };
          /**
          * Resets the user's phone number back to the existing/verified number
          */
          function resetPhoneNumber() {
            $scope.settings.phone.phone = $scope.localSettings.phone.phone;
          }
          /**
          * Resets the phone verification state
          */
          function resetVerificationState() {
            phoneNeedsVerification = false;
            $scope.verificationOtp = '';
          }
          /**
          * Resets state if user abandons initial otp to change phone number
          */
          function unlockFail() {
            resetPhoneNumber();
            resetVerificationState();
          }
          function onSavePhoneSuccess(settings) {
            $scope.getSettings();
            resetVerificationState();
          }
          function onSavePhoneFail(error) {
            if (Util.API.isOtpError(error)) {
              $scope.openModal().then(function (data) {
                if (data.type === 'otpsuccess') {
                  phoneNeedsVerification = true;
                }
              }).catch(unlockFail);
            } else {
              Notify.error(error.error);
            }
          }
          /**
          * Logic in the UI to show/hide the verification form
          * @returns {Bool}
          */
          $scope.showVerificationForm = function () {
            return phoneNeedsVerification;
          };
          /**
          * Logic in the UI to show/hide the verified/unverified text
          * @returns {Bool}
          */
          $scope.needsVerification = function () {
            if (!$scope.settings) {
              return;
            }
            return !$scope.settings.phone.verified || !validate.phoneMatch($scope.settings.phone.phone, $scope.localSettings.phone.phone);
          };
          $scope.sendSMS = function () {
            // send the sms to their new phone number
            var params = {
                forceSMS: true,
                phone: $scope.settings.phone.phone
              };
            UserAPI.sendOTP(params).then(Notify.successHandler('Your code was sent.')).catch(Notify.errorHandler);
          };
          $scope.savePhoneForm = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var newSettings = {
                  otp: $scope.verificationOtp,
                  phone: $scope.settings.phone.phone
                };
              $scope.savePhone(newSettings).then(onSavePhoneSuccess).catch(onSavePhoneFail);
            }
          };
          $scope.cancelPhoneReset = function () {
            resetPhoneNumber();
            resetVerificationState();
          };
          function init() {
            resetVerificationState();
          }
          init();
        }
      ]
    };
  }
]);/*
  About:
  - The SettingsController deals with managing the section of the
  app where a user sets their personal info, notifications, settings, etc.

  Notes:
  - This manages: AboutForm, PhoneForm, CurrencyForm, PasswordForm, NotificationForm
*/
angular.module('BitGo.Settings.SettingsController', []).controller('SettingsController', [
  '$modal',
  '$rootScope',
  '$scope',
  '$q',
  'SettingsAPI',
  'UserAPI',
  'UtilityService',
  'InternalStateService',
  'BG_DEV',
  function ($modal, $rootScope, $scope, $q, SettingsAPI, UserAPI, Util, InternalStateService, BG_DEV) {
    // Possible view states (sections) for this controller
    $scope.viewStates = [
      'about',
      'phone',
      'password',
      'notification',
      'currency',
      'developers'
    ];
    // The initial view state; initialized later
    $scope.state = null;
    // initialize otp for settings updates
    $scope.otp = null;
    // verification otp is used when resetting the phone number (settings phone form)
    $scope.verificationOtp = null;
    // $scope.saveSettings is called from child directives. Returns a promise
    $scope.saveSettings = function (newSettings) {
      if (!newSettings) {
        throw new Error('invalid params');
      }
      return SettingsAPI.save(newSettings);
    };
    // $scope.savePhone is called from child directives. Returns a promise
    $scope.savePhone = function (params) {
      if (!params) {
        throw new Error('invalid params');
      }
      return SettingsAPI.savePhone(params);
    };
    // Triggers otp modal to open if user needs to otp before changing settings
    $scope.openModal = function (size) {
      var modalInstance = $modal.open({
          templateUrl: 'modal/templates/modalcontainer.html',
          controller: 'ModalController',
          scope: $scope,
          size: size,
          resolve: {
            locals: function () {
              return {
                type: BG_DEV.MODAL_TYPES.otp,
                userAction: BG_DEV.MODAL_USER_ACTIONS.otp
              };
            }
          }
        });
      return modalInstance.result;
    };
    function onGetSettingsSuccess(settings) {
      // settings bound to the ui
      $scope.settings = settings;
      // copy for detecting changes
      $scope.localSettings = _.cloneDeep($scope.settings);
      // Update settings of user on rootscope
      $rootScope.currentUser.settings = $scope.settings;
      // let scopes below know about the new settings received
      $rootScope.$emit('SettingsController.HasNewSettings');
    }
    function onGetSettingsFail(error) {
      console.log('Error with user settings fetch: ', error);
    }
    $scope.getSettings = function () {
      SettingsAPI.get().then(onGetSettingsSuccess).catch(onGetSettingsFail);
    };
    /**
    * Let all substates (tabs) in the settings area know of state changes
    * @private
    */
    var killStateWatcher = $scope.$watch('state', function (state) {
        if (state) {
          $scope.$broadcast('SettingsController.StateChangesd', { newState: state });
        }
      });
    /**
    * Clean up all watchers when the scope is garbage collected
    * @private
    */
    $scope.$on('$destroy', function () {
      killStateWatcher();
    });
    function init() {
      $rootScope.setContext('accountSettings');
      $scope.getSettings();
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'about';
    }
    init();
  }
]);/*
  About:
  - The BitGo.Settings module is the main module that deals with the main
  app user's account information, settings, and state
*/
angular.module('BitGo.Settings', [
  'BitGo.Settings.AboutFormDirective',
  'BitGo.Settings.CurrencyFormDirective',
  'BitGo.Settings.DevelopersAccesstokenAddFormDirective',
  'BitGo.Settings.DevelopersManagerDirective',
  'BitGo.Settings.NotificationFormDirective',
  'BitGo.Settings.PasswordFormDirective',
  'BitGo.Settings.PhoneFormDirective',
  'BitGo.Settings.SettingsController'
]);/**
 * @ngdoc controller
 * @name ToolsController
 * @description
 * Manages the all functionality for the new key creation tool
 */
angular.module('BitGo.Tools.ToolsController', []).controller('ToolsController', [
  '$scope',
  function ($scope) {
    $scope.random = '';
    $scope.creationDate = new Date().toLocaleString();
    // Generates a BIP32 key and populates it into the scope.
    $scope.onGenerateBIP32Key = function () {
      sjcl.random.addEntropy($scope.random, $scope.random.length, 'user');
      var randomBytes = new Array(256);
      new Bitcoin.SecureRandom().nextBytes(randomBytes);
      var seed = Bitcoin.Util.bytesToHex(randomBytes);
      $scope.newKey = new Bitcoin.BIP32().initFromSeed(seed);
      $scope.xpub = $scope.newKey.extended_public_key_string();
      $scope.xprv = $scope.newKey.extended_private_key_string();
      $scope.address = $scope.newKey.eckey.getBitcoinAddress().toString();
    };
    // Compute the address based on the inputs.
    var computeAddress = function () {
      if (!$scope.userKey || !$scope.backupKey || !$scope.bitgoKey) {
        return;
      }
      var pubKeys = [];
      pubKeys.push($scope.userKey.eckey.getPub());
      pubKeys.push($scope.backupKey.eckey.getPub());
      pubKeys.push($scope.bitgoKey.eckey.getPub());
      var address = Bitcoin.Address.createMultiSigAddress(pubKeys, 2);
      $scope.multisigAddress = address.toString();
    };
    $scope.$watch('userKey', function (userKey) {
      if (userKey) {
        console.log('userkey changed to ' + userKey.extended_public_key_string());
        computeAddress();
      }
    });
    $scope.$watch('backupKey', function (backupKey) {
      if (backupKey) {
        console.log('backupkey changed to ' + backupKey.extended_public_key_string());
        computeAddress();
      }
    });
    $scope.$watch('bitgoKey', function (bitgoKey) {
      if (bitgoKey) {
        console.log('bitgokey changed to ' + bitgoKey.extended_public_key_string());
        computeAddress();
      }
    });
  }
]);/**
 * @ngdoc module
 * @name BitGo.Tools
 * @description
 * Manages all things dealing with BitGo tools (Currently only the Key Creator)
 */
angular.module('BitGo.Tools', ['BitGo.Tools.ToolsController']);angular.module('BitGo.Utility.CacheService', []).factory('CacheService', [
  '$location',
  function ($location) {
    var BITGO_NAMESPACE = 'BG.';
    var VALID_STORAGE_TYPES = [
        'localStorage',
        'sessionStorage'
      ];
    // In-memory copy of all caches
    var cacheList = {};
    // Determines if the browser supports local or session storage
    function supportsStorageType(storageType) {
      if (!_.contains(VALID_STORAGE_TYPES, storageType)) {
        return false;
      }
      if ($location.protocol() === 'chrome-extension') {
        return false;  // Don't even try to touch window.localStorage or you'll get error messages in the console.
      }
      var storageTypeSupported;
      try {
        // Relevant conversation on github:
        // https://github.com/angular-translate/angular-translate/issues/629
        if (storageType in window) {
          if (window[storageType] !== null) {
            storageTypeSupported = true;
          }
        }
        // We might have the property on the window, but not have access
        // to storage -- test it
        var testKey = 'storageKey';
        window[storageType].setItem(testKey, 'foo');
        window[storageType].removeItem(testKey);
      } catch (e) {
        storageTypeSupported = false;
      }
      return storageTypeSupported;
    }
    // Facade for sessionStorage
    var SessionStorage = function (name) {
      this.name = name;
      this.store = window.sessionStorage;
    };
    SessionStorage.prototype.get = function (id) {
      id = this.name + '.' + id;
      // ensure it exists before parsing
      return window.sessionStorage[id] && JSON.parse(window.sessionStorage[id]);
    };
    SessionStorage.prototype.addOrUpdate = function (id, value) {
      id = this.name + '.' + id;
      // Session storage can only store strings
      window.sessionStorage[id] = JSON.stringify(value);
    };
    SessionStorage.prototype.remove = function (id) {
      id = this.name + '.' + id;
      delete window.sessionStorage[id];
    };
    SessionStorage.prototype.clear = function () {
      window.sessionStorage.clear();
    };
    // Facade for localStorage
    var LocalStorage = function (name) {
      this.name = name;
      this.store = window.localStorage;
    };
    LocalStorage.prototype.itemId = function (id) {
      return this.name + '.' + id;
    };
    LocalStorage.prototype.get = function (id) {
      id = this.itemId(id);
      var result;
      try {
        result = this.store.getItem(id);
      } catch (e) {
        console.log('LocalStorage could not get ' + id + ': ' + e);
        return undefined;
      }
      try {
        return JSON.parse(result);
      } catch (e) {
        this.remove(id);  // it's corrupt. nuke it.
      }
      return undefined;
    };
    LocalStorage.prototype.addOrUpdate = function (id, value) {
      id = this.itemId(id);
      try {
        return this.store.setItem(id, JSON.stringify(value));
      } catch (e) {
        console.log('LocalStorage could not addOrUpdate ' + id + ': ' + e);
      }
    };
    LocalStorage.prototype.remove = function (id) {
      id = this.itemId(id);
      try {
        this.store.removeItem(id);
      } catch (e) {
        console.log('LocalStorage could not remove ' + id + ': ' + e);
      }
    };
    LocalStorage.prototype.clear = function () {
      try {
        this.store.clear();
      } catch (e) {
        console.log('LocalStorage could not clear: ' + e);
      }
    };
    // Facade for in-memory cache if no access to localStorage / sessionStorage
    var MemoryStorage = function (name) {
      this.name = name;
      this.cache = {};
    };
    MemoryStorage.prototype.get = function (id) {
      return this.cache[id];
    };
    MemoryStorage.prototype.addOrUpdate = function (id, value) {
      this.cache[id] = value;
    };
    MemoryStorage.prototype.remove = function (id) {
      delete this.cache[id];
    };
    MemoryStorage.prototype.clear = function () {
      this.cache = {};
    };
    // Object allowing instantiation of various cache types
    var storageTypes = {
        localStorage: function (cacheName) {
          return supportsStorageType('localStorage') ? new LocalStorage(BITGO_NAMESPACE + cacheName) : new MemoryStorage(BITGO_NAMESPACE + cacheName);
        },
        sessionStorage: function (cacheName) {
          return supportsStorageType('sessionStorage') ? new SessionStorage(BITGO_NAMESPACE + cacheName) : new MemoryStorage(BITGO_NAMESPACE + cacheName);
        },
        memoryStorage: function (cacheName) {
          return new MemoryStorage(BITGO_NAMESPACE + cacheName);
        }
      };
    // Cache Factory function
    function Cache(storageType, cacheName, expirationIntervalMillis) {
      if (storageType != 'localStorage' && storageType != 'sessionStorage' && storageType != 'memoryStorage') {
        storageType = 'localStorage';
      }
      var cache = storageTypes[storageType](cacheName);
      this.expirationIntervalMillis = expirationIntervalMillis;
      this.storageType = storageType;
      this.storage = cache;
      // Add the instance to the cacheList
      cacheList[cacheName] = this;
    }
    Cache.prototype.add = function (id, value) {
      if (!value) {
        // Don't cache undefined or null items.
        return value;
      }
      value._created = Date.now();
      this.storage.addOrUpdate(id, value);
    };
    Cache.prototype.get = function (id) {
      var item = this.storage.get(id);
      if (this.isExpired(item)) {
        this.remove(item);
        item = undefined;
      }
      if (!item) {
        return undefined;  // BE SURE TO RETURN undefined AND NOT null
      }
      return item;
    };
    Cache.prototype.remove = function (id) {
      this.storage.remove(id);
    };
    // WARNING: this clears all cache data globally, not just this cache.
    Cache.prototype.clear = function () {
      this.storage.clear();
      cacheList = [];
    };
    Cache.prototype.isExpired = function (item) {
      return item && item._created && Date.now() - item._created > this.expirationIntervalMillis;
    };
    // Get a specific cache from the inMemory list of caches
    function getCache(cacheName) {
      return cacheList[cacheName];
    }
    // Pubic API for CacheService
    return {
      Cache: Cache,
      getCache: getCache
    };
  }
]);/*
  Notes:
  - The BitGo.Utility module is intended to be used throughout the app and
  should not be composed of (have dependencies on) any other modules
  outside of those in the BitGo.Utility namespace.
*/
angular.module('BitGo.Utility', [
  'BitGo.Utility.CacheService',
  'BitGo.Utility.UtilityService'
]);angular.module('BitGo.Utility.UtilityService', []).factory('UtilityService', [
  '$q',
  '$location',
  '$rootScope',
  'BG_DEV',
  function ($q, $location, $rootScope, BG_DEV) {
    /**
     * Helper function to convert a utf8 string to a Uint8Array of same length
     *
     * @private
     * @param {String} utf8 string
     * @returns {Array} Returns a new instance of Uint8Array
     */
    function utf8toByteArray(string) {
      var length = string.length;
      return new Uint8Array(length);
    }
    // Conversion Utils
    var Converters = {
        base64ToArrayBuffer: function (base64) {
          // convert base64 string to utf8
          var binaryString = window.atob(base64);
          // initialize a new byteArray from the decoded base64 string
          var byteArray = utf8toByteArray(binaryString);
          // convert the characters to ascii
          for (var index = 0; index < byteArray.length; index++) {
            var ascii = binaryString.charCodeAt(index);
            byteArray[index] = ascii;
          }
          return byteArray.buffer;
        },
        BTCtoSatoshis: function (val) {
          if (typeof val == 'undefined') {
            throw new Error('bad argument');
          }
          var valFloat = parseFloat(val);
          return Math.round(valFloat * 100000000);
        }
      };
    // Validation Utils
    var Validators = {
        emailOk: function (email) {
          return /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(email);
        },
        emailMatch: function (e1, e2) {
          try {
            e1 = e1.toLowerCase();
            e2 = e2.toLowerCase();
          } catch (e) {
            return false;
          }
          return e1 === e2;
        },
        phoneOk: function (phone) {
          if (!phone) {
            return false;
          }
          if (phone[0] !== '+') {
            phone = '+'.concat(phone);
          }
          return intlTelInputUtils.isValidNumber(phone);
        },
        phoneMatch: function (p1, p2) {
          if (!p1 || !p2) {
            return false;
          }
          return p1 === p2;
        },
        otpOk: function (otp) {
          return /^\d{7}$/.test(otp);
        },
        currencyOk: function (currency) {
          if (!currency) {
            return false;
          }
          return _.indexOf(BG_DEV.CURRENCY.VALID_CURRENCIES, currency) > -1;
        },
        bitcoinUnitOk: function (unit) {
          if (!unit) {
            return false;
          }
          return _.indexOf(BG_DEV.CURRENCY.VALID_BITCOIN_UNITS, unit) > -1;
        }
      };
    // Formatter Utils
    var Formatters = {
        email: function (email) {
          if (!email) {
            throw new Error('expected an email');
          }
          return email.trim().toLowerCase();
        },
        phone: function (phone) {
          if (!phone) {
            throw new Error('expected a phone');
          }
          if (phone[0] !== '+') {
            phone = '+'.concat(phone);
          }
          return intlTelInputUtils.formatNumberE164(phone);
        }
      };
    // Crypto Utils
    var Crypto = {
        generateRandomPassword: function (n_words) {
          n_words = n_words || 7;
          return Bitcoin.Base58.encode(sjcl.random.randomWords(n_words));
        },
        sjclEncrypt: function (password, message) {
          var options = {
              iter: 10000,
              ks: 256
            };
          return sjcl.encrypt(password, message, options);
        },
        sjclDecrypt: function (password, message) {
          return sjcl.decrypt(password, message);
        },
        sjclHmac: function (key, value) {
          var out = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(key), sjcl.hash.sha256).mac(value);
          return sjcl.codec.hex.fromBits(out).toLowerCase();
        },
        prng: undefined,
        setPrng: function (prng) {
          if (!prng) {
            throw new Error('no prng initialized');
          }
          // Kick off event watchers which are used to initialize the PRNG
          this.prng = prng;
        },
        getECDHSecret: function (privKey, pubKey) {
          var otherKey = new Bitcoin.ECKey('0');
          otherKey.setPub(pubKey);
          var secretPoint = otherKey.getPubPoint().multiply(privKey);
          var secret = secretPoint.getX().toBigInteger().toByteArrayUnsigned();
          return Bitcoin.Util.bytesToHex(secret).toLowerCase();
        }
      };
    // Bitcoin Utils
    var BitcoinJSLibAugment = {
        BIP32: {
          createFromXprv: function (xprv) {
            var rootExtKey;
            try {
              rootExtKey = new Bitcoin.BIP32(xprv);
            } catch (e) {
              // Check if this is the improperly encoded key problem.
              if (e.message !== 'Not enough data') {
                throw e;
              }
              rootExtKey = new Bitcoin.BIP32().initFromBadXprv(xprv);
            }
            return rootExtKey;
          }
        }
      };
    // Browser Utils
    var Global = {
        isChromeApp: location.protocol === 'chrome-extension:',
        browserIsUnsupported: function () {
          if (!bowser) {
            throw new Error('Bowser not detected -- needed to determine supported browsers');
          }
          return bowser.msie && bowser.version <= 9;
        }
      };
    // Url Utils
    var Url = {
        scrubQueryString: function (param) {
          var urlParams = $location.search();
          var scrubTypes = {
              phone: [
                'setPhone',
                'verifyPhone'
              ],
              email: ['needsEmailVerify']
            };
          if (!param || _.isEmpty(urlParams)) {
            return;
          }
          if (_.has(scrubTypes, param)) {
            _.forEach(scrubTypes[param], function (paramToRemove) {
              $location.search(paramToRemove, null);
            });
          }
        },
        getEnterpriseSectionFromUrl: function () {
          var url = $location.path().split('/');
          // E.g.: /enterprise/:enterpriseId/settings
          var currentSectionIdx = _.indexOf(url, 'enterprise') + 2;
          return url[currentSectionIdx];
        },
        getEnterpriseIdFromUrl: function () {
          var url = $location.path().split('/');
          // E.g.: /enterprise/:enterpriseId
          var curEnterpriseIdx = _.indexOf(url, 'enterprise') + 1;
          return url[curEnterpriseIdx];
        },
        getWalletIdFromUrl: function () {
          var url = $location.path().split('/');
          // E.g.: /enterprise/:enterpriseId/wallets/:walletId
          var curWalletIdx = _.indexOf(url, 'wallets') + 1;
          return url[curWalletIdx];
        },
        isMarketingPage: function () {
          var marketingPage = false;
          // check if the URL is the home page
          if ($location.path() === '/') {
            return true;
          }
          var url = $location.path().split('/');
          BG_DEV.MARKETING_PAGES.every(function (element) {
            var currentSectionIdx = _.indexOf(url, element);
            // Check if the element is the last value in the url path
            if (currentSectionIdx + 1 === url.length) {
              marketingPage = true;
              return false;
            }
            return true;
          });
          return marketingPage;
        }
      };
    // API Utils
    var API = {
        apiServer: undefined,
        getApiServer: function () {
          return this.apiServer;
        },
        setApiServer: function () {
          if (Global.isChromeApp) {
            var server = 'https://test.bitgo.com';
            // default to testnet.
            if (typeof APP_ENV === 'undefined') {
              console.log('WARNING:  Chrome app env undefined');
            } else if (APP_ENV.bitcoinNetwork != 'testnet') {
              server = 'https://www.bitgo.com';
            }
            this.apiServer = server;
          } else {
            this.apiServer = location.protocol + '//' + location.hostname + (location.port && ':' + location.port);
          }
          this.apiServer += '/api/v1';
        },
        promiseSuccessHelper: function (property) {
          return function (successData) {
            if (property && _.has(successData, property)) {
              return $q.when(successData[property]);
            } else {
              return $q.when(successData);
            }
          };
        },
        promiseErrorHelper: function () {
          return function (error) {
            // Handle the case when the user loses browser connection
            // Trigger an app-blocking error
            if (error.status === 0) {
              $rootScope.$emit('UtilityService.AppIsOffline');
            }
            var formattedError = {
                status: error.status,
                error: error.data && error.data.error || 'Oops!  Looks like BitGo servers are experiencing problems.  Try again later.'
              };
            if (error.data) {
              if (error.data.needsOTP) {
                formattedError.needsOTP = error.data.needsOTP;
              }
              if (error.data.needsEmailVerify) {
                formattedError.needsEmailVerify = error.data.needsEmailVerify;
              }
              if (error.data.needsAuthy) {
                formattedError.needsAuthy = error.data.needsAuthy;
              }
            }
            return $q.reject(formattedError);
          };
        },
        isOtpError: function (error) {
          if (!error) {
            throw new Error('Missing error');
          }
          if (error.data) {
            return error.status === 401 && error.data.needsOTP;
          }
          return error.status == 401 && error.needsOTP;
        },
        isPasscodeError: function (error) {
          if (!error) {
            throw new Error('Missing error');
          }
          return error.status === 401 && error.needsPasscode;
        },
        isUnlockError: function (error) {
          if (!error) {
            throw new Error('Missing error');
          }
          return error === 'Failed to sign input #0';
        }
      };
    // Constructs an error object we can throw and handle within the app
    function ErrorHelper(errorData) {
      if (!errorData.status || !errorData.message || !errorData.data) {
        throw new Error('Missing arguments');
      }
      var error = new Error(errorData.message);
      error.error = errorData.message;
      error.status = errorData.status;
      // Attach the properties
      _.forIn(errorData.data, function (value, key) {
        error[key] = value;
      });
      return error;
    }
    function initUtils() {
      // initialize the API route
      API.setApiServer();
    }
    initUtils();
    return {
      API: API,
      BitcoinJSLibAugment: BitcoinJSLibAugment,
      Converters: Converters,
      Crypto: Crypto,
      Formatters: Formatters,
      Global: Global,
      Url: Url,
      Validators: Validators,
      ErrorHelper: ErrorHelper
    };
  }
]);/**
 * @ngdoc directive
 * @name walletUserList
 * @description
 * Directive to manage the add user form after selecting a wallet. To be used along with bgAddWalletToUser directive
 * @example
 *   <div bg-add-user-to-wallet><form wallet-add-user-form></form></div>
 */
angular.module('BitGo.Wallet.WalletAddUserFormDirective', []).directive('walletAddUserForm', [
  '$rootScope',
  '$q',
  'UserAPI',
  'NotifyService',
  'KeychainsAPI',
  'UtilityService',
  '$modal',
  'WalletSharesAPI',
  '$filter',
  'BG_DEV',
  function ($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, BG_DEV) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          var params;
          function formIsValid() {
            if (!$scope.email) {
              $scope.setFormError('Please enter email');
              return false;
            }
            if (!$scope.role) {
              $scope.setFormError('Please set role for user');
              return false;
            }
            return true;
          }
          $scope.saveAddUserForm = function () {
            if (!$scope.message) {
              $scope.message = 'Hi! Join my wallet on BitGo!';
            }
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              UserAPI.sharingkey({ email: $scope.email }).then(function (data) {
                params = {
                  user: data.userId,
                  permissions: $filter('bgPermissionsRoleConversionFilter')($scope.role, true),
                  message: $scope.message
                };
                if ($scope.role === BG_DEV.WALLET.ROLES.SPEND || $scope.role === BG_DEV.WALLET.ROLES.ADMIN) {
                  params.keychain = {
                    xpub: $rootScope.wallets.current.data.private.keychains[0].xpub,
                    toPubKey: data.pubkey,
                    path: data.path
                  };
                  $scope.walletId = $rootScope.wallets.current.data.id;
                  return $scope.shareWallet(params);
                }
                return WalletSharesAPI.createShare($rootScope.wallets.current.data.id, params).then($scope.onAddUserSuccess);
              }).catch(function (error) {
                if (error.error === 'key not found') {
                  Notify.error($scope.email + ' does not have a sharing key. The sharing key will be generated when the user next logs in. Have ' + $scope.email + ' login to BitGo before sharing again.');
                } else {
                  Notify.error(error.error);
                }
              });
            }
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletApprovalTile
 * @description
 * Manages the logic for ingesting an enterprise pendingApproval item and outputting the right template item to the DOM
 * @example
 *   <tr wallet-approval-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Wallet.WalletApprovalTileDirective', []).directive('walletApprovalTile', [
  '$rootScope',
  '$compile',
  '$http',
  '$templateCache',
  'BG_DEV',
  function ($rootScope, $compile, $http, $templateCache, BG_DEV) {
    return {
      restrict: 'A',
      replace: true,
      link: function (scope, element, attrs) {
        function getPolicyTemplate(policyRuleRequest) {
          switch (policyRuleRequest.update.id) {
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address']:
            return 'bitcoinAddressWhitelist';
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.day']:
            return 'dailyLimit';
          case BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.tx']:
            return 'transactionLimit';
          default:
            throw new Error('invalid policy id');
          }
        }
        // Returns the template path to compile based on approvalItem.info.type
        var getTemplate = function (approvalItemType) {
          var template = '';
          switch (approvalItemType) {
          case 'policyRuleRequest':
            var id = scope.approvalItem.info.policyRuleRequest.update.id;
            if (!id || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, id)) {
              throw new Error('Invalid BitGo policy id');
            }
            template = 'wallet/templates/approvaltiles/' + getPolicyTemplate(scope.approvalItem.info.policyRuleRequest) + '.html';
            break;
          case 'transactionRequest':
          case 'userChangeRequest':
            template = 'wallet/templates/approvaltiles/' + approvalItemType + '.html';
            break;
          default:
            throw new Error('Expected valid approval type. Got: ' + approvalItemType);
          }
          return template;
        };
        // Set pretty time for the ui
        scope.approvalItem.prettyDate = new moment(scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');
        function initTemplate() {
          $http.get(getTemplate(scope.approvalItem.info.type), { cache: $templateCache }).success(function (html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        initTemplate();
      }
    };
  }
]);/*
  Notes:
  - This controls the views and states for a selected wallet in an enterprise
  - Manages state for these views: Transactions, Users, Policy, Send, Receive
*/
angular.module('BitGo.Wallet.WalletController', []).controller('WalletController', [
  '$timeout',
  '$scope',
  '$rootScope',
  '$location',
  '$filter',
  'UtilityService',
  'WalletsAPI',
  'LabelsAPI',
  'SyncService',
  'RequiredActionService',
  'BG_DEV',
  function ($timeout, $scope, $rootScope, $location, $filter, UtilityService, WalletsAPI, LabelsAPI, SyncService, RequiredActionService, BG_DEV) {
    // base string for the receive address' label
    var RECEIVE_ADDRESS_LABEL_BASE = 'Receive Address ';
    // view states for the user settings area
    $scope.viewStates = [
      'transactions',
      'users',
      'policy',
      'settings',
      'send',
      'receive'
    ];
    // the current view state
    $scope.state = null;
    // template source for the current view
    $scope.walletStateTemplateSource = null;
    // current receive address for the wallet
    $scope.currentReceiveAddress = null;
    // returns the view current view template based on the current viewState
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for a wallet');
      }
      var template;
      switch ($scope.state) {
      case 'transactions':
        template = 'wallet/templates/wallet-transactions-partial.html';
        break;
      case 'users':
        template = 'wallet/templates/wallet-users-partial.html';
        break;
      case 'policy':
        template = 'wallet/templates/wallet-policy-partial.html';
        break;
      case 'settings':
        template = 'wallet/templates/wallet-settings-partial.html';
        break;
      case 'send':
        template = 'wallet/templates/wallet-send-partial.html';
        break;
      case 'receive':
        template = 'wallet/templates/wallet-receive-partial.html';
        break;
      }
      return template;
    }
    /**
     * Get the newest usable receive address for the wallet
     * @param useExisting {Bool} is using an existing address ok
     * @returns {Promise}
     */
    $scope.generateNewReceiveAddressForWallet = function (useExisting) {
      if (typeof useExisting !== 'boolean') {
        throw new Error('invalid params');
      }
      return WalletsAPI.createReceiveAddress($rootScope.wallets.current.data.id, useExisting).then(function (address) {
        if (!address) {
          console.error('Missing a current receive address for the wallet');
        }
        $scope.currentReceiveAddress = address;
        return LabelsAPI.get($scope.currentReceiveAddress.address, $rootScope.wallets.current.data.id);
      }).then(function (label) {
        var formattedLabel = label ? label.label : RECEIVE_ADDRESS_LABEL_BASE + $scope.currentReceiveAddress.index;
        $scope.currentReceiveAddress.label = formattedLabel;
        $scope.currentReceiveAddress.temporaryLabel = formattedLabel;
        return $scope.currentReceiveAddress;
      });
    };
    $scope.setSubState = function () {
      $scope.$broadcast('WalletController.showAllUsers');
    };
    // Masthead wallet nav state
    $scope.isCurrentWalletState = function (state) {
      return $scope.state === state;
    };
    /**
     * Sets the current receive address object on scope for safe wallets
     * @params {object} - The safe wallet object
     */
    function setSafeReceiveAddress(wallet) {
      if (wallet && !wallet.isSafehdWallet()) {
        $scope.currentReceiveAddress = {
          address: wallet.data.id,
          label: wallet.data.label,
          temporaryLabel: wallet.data.label
        };
      }
    }
    // Event Listeners
    /**
     * Listen for changes in the wallet's state and swap templates / sync app as needed
     */
    var killStateListener = $scope.$watch('state', function (state) {
        if (state) {
          // If the user has a weak login password and they're trying to spend btc,
          // we force them to upgrade it before they can send any btc
          if (state === 'send' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
            return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
          }
          // Otherwise set the template as needed and sync the app state
          $scope.walletStateTemplateSource = getTemplate();
          SyncService.sync();
        }
      });
    /**
     * Listens for the current wallet to be set and init the current receive address
     */
    var killCurrentWalletListener = $scope.$watch('wallets.current', function (wallet) {
        if (wallet && !$scope.currentReceiveAddress) {
          // if the wallet is safe set the label and address from the wallet object itself
          if (wallet.data && !wallet.isSafehdWallet()) {
            setSafeReceiveAddress(wallet);
            return;
          }
          $scope.generateNewReceiveAddressForWallet(true);
        }
      });
    /**
     * Listen for the user to hop out of the send coins flow
     */
    var killTxCancelListener = $scope.$on('WalletSendManagerDirective.SendTxCancel', function (evt, data) {
        $scope.setState('transactions');
      });
    // Clean up the listeners -- helps decrease run loop time and
    // reduce liklihood of references being kept on the scope
    $scope.$on('$destroy', function () {
      killCurrentWalletListener();
      killTxCancelListener();
      killStateListener();
    });
    function init() {
      $scope.state = 'transactions';
      $scope.walletStateTemplateSource = getTemplate();
    }
    init();
  }
]);/*
  Notes:
  - This controls the flow and manages all states involved with creating a new wallet
  - Manages: walletCreateName, walletCreateBackup
*/
angular.module('BitGo.Wallet.WalletCreateController', []).controller('WalletCreateController', [
  '$scope',
  '$rootScope',
  '$location',
  'AnalyticsProxy',
  function ($scope, $rootScope, $location, AnalyticsProxy) {
    // view states for the user settings area
    $scope.viewStates = [
      'label',
      'backupkey',
      'passcode',
      'activate'
    ];
    // the current view state
    $scope.state = null;
    // template source for the current view
    $scope.createFlowTemplateSource = null;
    // the data model used by the ui-inputs during wallet creation
    $scope.inputs = null;
    // Additional properties that will be generated by steps in the process
    $scope.generated = null;
    // takes the user out of the wallet create flow
    // Accessible by all scopes inheriting this controller
    $scope.cancel = function () {
      // track the cancel
      AnalyticsProxy.track('CreateWalletCanceled');
      // Note: this redirect will also wipe all of the state that's been built up
      $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
    };
    // returns the view current view template (based on the $scope's current state)
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for wallet create flow');
      }
      var tpl;
      switch ($scope.state) {
      case 'label':
        tpl = 'wallet/templates/wallet-create-partial-label.html';
        break;
      case 'backupkey':
        tpl = 'wallet/templates/wallet-create-partial-backupkey.html';
        break;
      case 'passcode':
        tpl = 'wallet/templates/wallet-create-partial-passcode.html';
        break;
      case 'activate':
        tpl = 'wallet/templates/wallet-create-partial-activate.html';
        break;
      }
      return tpl;
    }
    // Event listeners
    var killStateWatch = $scope.$watch('state', function (state) {
        $scope.createFlowTemplateSource = getTemplate();
      });
    // Listener cleanup
    $scope.$on('$destroy', function () {
      killStateWatch();
    });
    function init() {
      $rootScope.setContext('createWallet');
      $scope.state = 'label';
      // All properties we expect the user to enter in creation
      $scope.inputs = {
        walletLabel: null,
        passcode: null,
        passcodeConfirm: null,
        useOwnBackupKey: false,
        backupPubKey: null,
        activationCodeConfirm: null
      };
      // All properties we expect to possibly be generated during creation
      $scope.generated = {
        backupKeychain: null,
        backupKey: null,
        walletKeychain: null,
        walletBackupKeychain: null,
        bitgoKeychain: null,
        activationCode: null,
        passcodeEncryptionCode: null,
        encryptedWalletPasscode: null,
        wallet: null
      };
    }
    init();
  }
]);/**
  Directive to manage the wallet activation step
  - Parent Controller is WalletCreateController
  - Manages generation/download of the Wallet Backup PDF
 */
angular.module('BitGo.Wallet.WalletCreateStepsActivateDirective', []).directive('walletCreateStepsActivate', [
  '$rootScope',
  '$location',
  '$timeout',
  'NotifyService',
  'WalletsAPI',
  'AnalyticsProxy',
  function ($rootScope, $location, $timeout, NotifyService, WalletsAPI, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // Determine if the user can activate the wallet
          $scope.canActivate = function () {
            return $scope.inputs.activationCodeConfirm && $scope.inputs.activationCodeConfirm.toString() === $scope.generated.activationCode.toString();
          };
          $scope.wrongActivationCode = function () {
            return $scope.inputs.activationCodeConfirm && $scope.inputs.activationCodeConfirm.toString() !== $scope.generated.activationCode.toString() && $scope.inputs.activationCodeConfirm.toString().length === $scope.generated.activationCode.toString().length;
          };
          // Creates the wallet based on the 3 keychains generated previously
          function createWallet() {
            var params = {
                label: $scope.inputs.walletLabel,
                xpubs: [
                  $scope.generated.walletKeychain.xpub,
                  $scope.generated.walletBackupKeychain.xpub,
                  $scope.generated.bitgoKeychain.xpub
                ]
              };
            return WalletsAPI.createSafeHD(params);
          }
          // Function to generate a client-side wallet PDF backup that contains
          // information needed to recover the wallet
          function downloadBackup() {
            try {
              // Create the activation code
              if (!$scope.generated.activationCode) {
                // If we're running e2e tests the port will be 7883
                // If this is the case, set the generation code to 1000
                if ($location.port() === 7883) {
                  $scope.generated.activationCode = 1000;
                } else {
                  $scope.generated.activationCode = Math.floor(Math.random() * 900000 + 100000);
                }
              }
              // Create the initial details for generating the backup PDF
              var date = new Date().toDateString();
              var pdfTitle = 'BitGo Keycard for ' + $scope.inputs.walletLabel + '.pdf';
              // PDF Basics
              // fonts
              var font = {
                  header: 24,
                  subheader: 15,
                  body: 12
                };
              // colors
              var color = {
                  black: '#000000',
                  darkgray: '#4c4c4c',
                  gray: '#9b9b9b',
                  red: '#e21e1e'
                };
              // document details
              var width = 8.5 * 72;
              var margin = 30;
              var y = 0;
              // Helpers for data formatting / positioning on the paper
              var left = function (x) {
                return margin + x;
              };
              var moveDown = function (ydelta) {
                y += ydelta;
              };
              var reformatJSON = function (json) {
                return JSON.stringify(JSON.parse(json), null, 2).replace('\t', '  ');
              };
              // Create the PDF instance
              var doc = new jsPDF('portrait', 'pt', 'letter');
              doc.setFont('helvetica');
              // PDF Header Area - includes the logo and company name
              // This is data for the BitGo logo in the top left of the PDF
              moveDown(30);
              // Bitgo shield is 30x36
              doc.addImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAkCAYAAACe0YppAAAGKklEQVRYCb1XW2xUVRRd9zEznRn6Rmh5aAoxmIgCVSIYMSGGGEUDLaRiYuIrEYzGDxMTTfzARGLQ+IGJBhN8hBgwhDYIfIB8IArySuVHHoqEIgTa0k5LC+087sO1z53buZOZgRlN3Omde3rOPnvts8/e65yr4d/I+oMmFrSuhu3asH7sQkeHXakZraIJncOzYBhPAc4L0PRFcF2ZfgSa9h0cax/a6nvKtVcaeGtvHNVVTdC1++DgEcBdQoBWhCI1sLlAK+1hhMKAbgDp5A02uqn3CzScgOmeg1vbi2e1sWLOaDjomhgeWgPNvBuu00ClZj7TuZqZfDfBDMdgmFykgGVo1ylmB4wAYIY8J2zq2ZlbcNFL5Svq0djWjUE4bg/6z+80kbjxGaLVr9Mi/yR0fBwaFyB5y8r81RWH9HrFoUwqp6HpcRj6bILxoVMMAyPmOXhXy3QNu2+5ZRnOmfxvLYmKlT6k/6+gEy67lsSgMpEtlkck2PZ6yv6tCDjELfq8NYqND0bVdn38QBU+ybbLRswqVgQs+bGiOYzlU5nllPZpIaxsNqW7YvEslDFNjMszbrtIM8RhupziOy1FwAJQFaFTo0wv6C41PQYqhKfhhxsNfDk/Rh7x1GZGdbhVwG9LqzE7bsByXOx+NI5jQza2X07j4k1OulMcXZfmuhJjLP5oUXDaeHyKiV2L4jAJXC0/t5HepIP242M4OmCVBhemy6S7xLddZKfi5jh6NGHh3v0jWHbkpgqxKJ4dddB6cBSLfhrFulNj6Bmjh5SmKh3vz4modskfXXbXPWmSWQ7zeb6UYoY2BzMuGsKucJqSW9znUwytdBzvy2CEC9y2MKbGWuI6TNq2PF+yM4IvTnL1AZ2nyvWS/OvrM8Kyx754zCpZxYc50lSVG7w0RiKkIyVFMtFw+kx6fZns5VmYWFPJaWpgSkTDK7MiiNOb1noDHdNJg5Qr4w7ePT2u2kV/JJGtjA1bu8KgVF2Ck7rBcNepFRSdkd95T0zHVwu80AZHDNp9ksl4ZsQGd6dQ5ASz7QQixmUTdqwfZvoCdPMhONkztnBKXs95lsz6s0mV6VJey5tDWNxgoJnJtXFuVNX3pj+TDGluC5QBg+e2Y/2FZ6oHdXRoNkvphDpz88yX/mcg5WLbpRS29qSw4cw4lh4axYH+3MauJKPlJYVvSmW0dox54WZLXTvg0Y+vUfgORk4lmqwm+6SYImdHhb48EU4vKnJB0NwDMuZRpmb8zEO8j/s8tZgDIbonFOmL2BVM6aohyhMzQlgzI8cFUucqX4KhlluMlWEi41ex4wG31wyic2gv71OvIhW4InGZ9WENexdPQlNUQyQLPrdWRzcpU4iskR4Fy2nEcrH5Im8iksFBEZKyrB/Q0cC7mQ+sFJwtLKsXOYEllgusGL+/RkdtIH4xrmReLRMlK6KdYLhPDlnY8EcK3QmGPRAh5UQmlWa1fu3PybnluuTtoT2IxJYjnatFwZtfZyg7k+hFF3n7NMvlg3NJfL8wjgvM8LWkzatMuGusY0UFQVBBikSB5HgnVtWv9oFzKsw0zvqQt8N0MExSjycHbRwfsMnbttq661zd/j6L93mulArdHFegsoycRQ9DatdKs/awwQeVd77aqsZjTIAtXHVQx9OipoRd9jDFSEYZ7mT2bFZWcrHLnyurte0vsKL+VHCgUL1rpBGac4Qn1py862rWy2kkjAw5up+hFQaTy8A1HodFJcSTKpP6nZeDJfzKGA7qFALLaFfiMRjhfTw84gXlJZkkIjODbdUZ+JHyYYBIx8vQNvlEYEQ180Ptj7Y3HIaVfJMXBMe7jPsDfAug726wHVAhH0g5Wchk1hUDFdXiwDKyavK3cDJv04irDElfOSKgum4jnX4Lqxu2l5ri+15qHOhMrOV+b+IqI+rbqbQms48k4brjrIw30F7/ze1U7wwss3cmnkYovJkfZTPzmG3CMs1I9lqpHtjOa2ivU3w8MVykUR6wTNwx3ELC/pTfx20qqfwPObm8CdO59g7W2TukxL+L4BR0lQ/sT901/Bw04z3u+zzVZdvdBP0IbXWdvko578qBxeqeqzHY8Ze4Uovf1lvxcgtP/crkHw61O1M66t+zAAAAAElFTkSuQmCC', left(0), y);
              moveDown(8);
              doc.setFontSize(font.body).setTextColor(color.gray);
              doc.text('Activation Code', left(460), y);
              doc.setFontSize(font.header).setTextColor(color.black);
              moveDown(22);
              doc.text('BitGo KeyCard', left(35), y);
              doc.setFontSize(font.header).setTextColor(color.gray);
              doc.text($scope.generated.activationCode.toString(), left(460), y);
              // Subheader
              // titles
              moveDown(margin);
              doc.setFontSize(font.body).setTextColor(color.gray);
              doc.text('Created on ' + date + ' for wallet named:', left(0), y);
              // copy
              moveDown(25);
              doc.setFontSize(font.subheader).setTextColor(color.black);
              doc.text($scope.inputs.walletLabel.toString(), left(0), y);
              // doc.text($scope.generatedActivationCode.toString(), left(392), y);
              // Red Bar
              moveDown(20);
              doc.setFillColor(255, 230, 230);
              doc.rect(left(0), y, width - 2 * margin, 32, 'F');
              // warning message
              moveDown(20);
              doc.setFontSize(font.body).setTextColor(color.red);
              doc.text('Print this document, or keep it securely offline. See second page for FAQ.', left(75), y);
              // PDF QR Code data
              var qrdata = {
                  user: {
                    title: 'A: User Key',
                    img: '#qrEncryptedUserKey',
                    desc: 'This is your private key, encrypted with your passcode.',
                    data: $scope.generated.walletKeychain.encryptedXprv
                  },
                  bitgo: {
                    title: 'C: BitGo Public Key',
                    img: '#qrBitgoKey',
                    desc: 'This is the public half of the key BitGo has generated for this wallet.',
                    data: $scope.generated.bitgoKeychain.xpub
                  },
                  passcode: {
                    title: 'D: Encrypted Wallet Password',
                    img: '#qrEncryptedWalletPasscode',
                    desc: 'This is the wallet password, encrypted client-side with a key held by BitGo.',
                    data: $scope.generated.encryptedWalletPasscode
                  }
                };
              // Backup entry depends on whether it's a user-supplied xpub or not
              if ($scope.inputs.useOwnBackupKey) {
                qrdata.backup = {
                  title: 'B: Backup Key',
                  img: '#qrEncryptedUserProvidedXpub',
                  desc: 'This is the public portion of your backup key, which you provided.',
                  data: $scope.generated.walletBackupKeychain.xpub
                };
              } else {
                qrdata.backup = {
                  title: 'B: Backup Key',
                  img: '#qrEncryptedBackupKey',
                  desc: 'This is your backup private key, encrypted with your passcode.',
                  data: $scope.generated.walletBackupKeychain.encryptedXprv
                };
              }
              // Generate the first page's data for the backup PDF
              moveDown(35);
              var qrSize = 130;
              [
                'user',
                'backup',
                'bitgo',
                'passcode'
              ].forEach(function (name) {
                var qr = qrdata[name];
                var topY = y;
                var textLeft = left(qrSize + 15);
                doc.addImage($(qr.img + ' img').attr('src'), left(0), y, qrSize, qrSize);
                doc.setFontSize(font.subheader).setTextColor(color.black);
                moveDown(10);
                doc.text(qr.title, textLeft, y);
                moveDown(15);
                doc.setFontSize(font.body).setTextColor(color.darkgray);
                doc.text(qr.desc, textLeft, y);
                moveDown(30);
                doc.setFontSize(font.body - 2);
                doc.text('Data:', textLeft, y);
                moveDown(15);
                var width = 72 * 8.5 - textLeft - 30;
                doc.setFont('courier').setFontSize(9).setTextColor(color.black);
                var lines = doc.splitTextToSize(qr.data, width);
                doc.text(lines, textLeft, y);
                doc.setFont('helvetica');
                // Move down the size of the QR code minus accumulated height on the right side, plus buffer
                moveDown(qrSize - (y - topY) + 15);
              });
              // Add 2nd Page
              doc.addPage();
              // 2nd page title
              y = 0;
              moveDown(55);
              doc.setFontSize(font.header).setTextColor(color.black);
              doc.text('BitGo KeyCard FAQ', left(0), y);
              // Questions data for 2nd page
              var questions = [
                  {
                    q: 'What is the KeyCard?',
                    a: [
                      'The KeyCard contains important information which can be used to recover the bitcoin ',
                      'from your wallet in several situations. Each BitGo wallet has its own, unique KeyCard. If you ',
                      'have created multiple wallets, you should retain the KeyCard for each of them.'
                    ]
                  },
                  {
                    q: 'What should I do with it?',
                    a: [
                      'You should print the KeyCard and/or save the PDF to an offline storage device. The print-out ',
                      'or USB stick should be kept in a safe place, such as a bank vault or home safe. It\'s a good idea ',
                      'to keep a second copy in a different location.',
                      '',
                      'Important: If you haven\'t provided an external backup key, then the original PDF should be ',
                      'deleted from any machine where the wallet will be regularly accessed to prevent malware from ',
                      'capturing both the KeyCard and your wallet passcode.'
                    ]
                  },
                  {
                    q: 'What should I do if I lose it?',
                    a: [
                      'If you have lost or damaged all copies of your KeyCard, your bitcoin is still safe, but this ',
                      'wallet should be considered at risk for loss. As soon as is convenient, you should use BitGo ',
                      'to empty the wallet into a new wallet, and discontinue use of the old wallet.'
                    ]
                  },
                  {
                    q: 'What if someone sees my KeyCard?',
                    a: [
                      'Don\'t panic! All sensitive information on the KeyCard is encrypted with your passcode, or with a',
                      'key which only BitGo has. But, in general, you should make best efforts to keep your ',
                      'KeyCard private. If your KeyCard does get exposed or copied in a way that makes you ',
                      'uncomfortable, the best course of action is to empty the corresponding wallet into another ',
                      'wallet and discontinue use of the old wallet.'
                    ]
                  },
                  {
                    q: 'What if I forget or lose my wallet password?',
                    a: [
                      'BitGo can use the information in QR Code D to help you recover access to your wallet. ',
                      'Without the KeyCard, BitGo is not able to recover funds from a wallet with a lost password.'
                    ]
                  },
                  {
                    q: 'What if BitGo becomes inaccessible for an extended period?',
                    a: [
                      'Your KeyCard and wallet passcode can be used together with BitGo\u2019s published open ',
                      'source tools at https://github.com/bitgo to recover your bitcoin. Note: You should never enter ',
                      'information from your KeyCard into tools other than the tools BitGo has published, or your ',
                      'funds may be at risk for theft.'
                    ]
                  },
                  {
                    q: 'Should I write my wallet password on my KeyCard?',
                    a: [
                      'No! BitGo\u2019s multi-signature approach to security depends on there not being a single point ',
                      'of attack. But if your wallet password is on your KeyCard, then anyone who gains access to ',
                      'your KeyCard will be able to steal your bitcoin. We recommend keeping your wallet password ',
                      'safe in a secure password manager such as LastPass, 1Password or KeePass.'
                    ]
                  }
                ];
              // Generate the second page's data for the backup PDF
              moveDown(30);
              questions.forEach(function (q) {
                doc.setFontSize(font.subheader).setTextColor(color.black);
                doc.text(q.q, left(0), y);
                moveDown(20);
                doc.setFontSize(font.body).setTextColor(color.darkgray);
                q.a.forEach(function (line) {
                  doc.text(line, left(0), y);
                  moveDown(font.body + 3);
                });
                moveDown(22);
              });
              // Save the PDF on the user's browser
              doc.save(pdfTitle);
            } catch (error) {
              NotifyService.error('There was an error generating the backup PDF. Please refresh your page and try this again.');
              // track the failed wallet backup download
              var metricsData = {
                  status: 'client',
                  message: error,
                  action: 'DownloadKeyCard'
                };
              AnalyticsProxy.track('Error', metricsData);
            }
          }
          // Downloads another copy of the same wallet backup PDF generated when
          // this directive initially loaded
          $scope.download = function () {
            downloadBackup();
            // track the additional download
            AnalyticsProxy.track('DownloadKeyCard');
          };
          // Creates the actual wallet
          $scope.activateWallet = function () {
            // clear any errors
            $scope.clearFormError();
            if ($scope.canActivate()) {
              createWallet().then(function (wallet) {
                // Note: wallet is a fully decorated client wallet object
                // Track successful wallet creation
                var metricsData = {
                    walletID: wallet.data.id,
                    walletName: wallet.data.label
                  };
                AnalyticsProxy.track('CreateWallet', metricsData);
                $scope.generated.wallet = wallet;
                // Get the latest wallets for the app
                WalletsAPI.getAllWallets();
                // redirect to the wallets dashboard
                $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
              }).catch();
            } else {
              $scope.setFormError('Please enter a the activation code from your backup.');
              // track the failed wallet activation
              var metricsData = {
                  status: 'client',
                  message: 'Invalid Activation Code',
                  action: 'CreateWallet'
                };
              AnalyticsProxy.track('Error', metricsData);
            }
          };
          function init() {
            // force the client to download a backup when this step initializes
            // wait for the html to load before downloading -- we need to pull qrcode
            // data off the tempalte or the PDF generator will throw;
            $timeout(function () {
              $scope.download();
            }, 1000);
          }
          init();
        }
      ]
    };
  }
]);/**
 * Directive to manage the wallet create backup step and all of its possible choices
 * This
 */
angular.module('BitGo.Wallet.WalletCreateStepsBackupkeyDirective', []).directive('walletCreateStepsBackupkey', [
  '$rootScope',
  'UtilityService',
  'NotifyService',
  'AnalyticsProxy',
  function ($rootScope, Utils, NotifyService, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // possible backupkey creation options
          var VALID_BACKUPKEY_OPTIONS = {
              inBrowser: {
                inBrowser: true,
                enabled: true
              },
              userProvided: {
                userProvided: true,
                enabled: true
              },
              coldKeyApp: {
                coldKeyApp: true,
                enabled: true
              }
            };
          // the currently selected backup key creation option
          $scope.option = null;
          // Checks if everything is valid before advancing the flow
          function isValidStep() {
            var isValid;
            switch ($scope.option) {
            case 'inBrowser':
              isValid = true;
              break;
            case 'userProvided':
              isValid = $scope.userXpubValid();
              break;  // case 'coldKeyApp':
                      //   break;
            }
            return isValid;
          }
          // If the user goes back to selecting the in-browser option,
          // clear the user-provided key info and the generated key info
          function clearBackupKeyInputs() {
            // Clear user key info
            $scope.inputs.useOwnBackupKey = false;
            $scope.inputs.backupPubKey = null;
            // Clear generated keychain info
            $scope.generated.backupKeychain = null;
            $scope.generated.backupKey = null;
          }
          // Attempts to generate a backup key from a user's provided xpub
          function generateBackupKeyFromXpub() {
            try {
              $scope.generated.backupKeychain = new Bitcoin.BIP32($scope.inputs.backupPubKey);
              var key = $scope.generated.backupKeychain.eckey;
              $scope.generated.backupKey = key;
            } catch (error) {
              return false;
            }
            return true;
          }
          // Determine if the user provided xpub is valid to in constructing
          // their wallet's backup keychain
          $scope.userXpubValid = function () {
            if (!$scope.inputs.backupPubKey || $scope.inputs.backupPubKey.length === 0) {
              return false;
            }
            return generateBackupKeyFromXpub();
          };
          // Disable backup key creation options on this scope
          function disableOptions(optsToDisable) {
            if (!optsToDisable) {
              throw new Error('Expect array of key creation options to disable');
            }
            _.forEach(optsToDisable, function (option) {
              if (_.has(VALID_BACKUPKEY_OPTIONS, option)) {
                VALID_BACKUPKEY_OPTIONS[option].enabled = false;
              }
            });
          }
          // set a backup key creation option
          $scope.setBackupkeyOption = function (option) {
            if (!option || !_.has(VALID_BACKUPKEY_OPTIONS, option)) {
              throw new Error('Expect a valid option when choosing a backup key option');
            }
            $scope.option = option;
            // Track the creation option selected
            var metricsData = { option: option };
            AnalyticsProxy.track('SelectBackupKeyOption', metricsData);
            // If the user chooses another backup key creation option,
            // clear the form data from the other (unselected) options
            if (option === 'inBrowser') {
              clearBackupKeyInputs();
            }
          };
          // Tells if the specific option is disabled based on the backup
          // key creation path selected
          $scope.optionIsDisabled = function (option) {
            if (_.has(VALID_BACKUPKEY_OPTIONS, option)) {
              return !VALID_BACKUPKEY_OPTIONS[option].enabled;
            }
            return false;
          };
          // UI - show/hide the backup key creation option
          $scope.showOption = function (option) {
            return $scope.option === option;
          };
          // advance the wallet creation flow
          // Note: this is called from the
          $scope.advanceBackupkey = function () {
            var metricsData;
            if (isValidStep()) {
              // track advancement from the backup key selection step
              metricsData = { option: $scope.option };
              AnalyticsProxy.track('SetBackupKey', metricsData);
              $scope.setState('passcode');
            } else {
              // track the failed advancement
              metricsData = {
                status: 'client',
                message: 'Invalid Backup Key xpub',
                action: 'SetBackupKey'
              };
              AnalyticsProxy.track('Error', metricsData);
            }
          };
          // Event handlers
          var killXpubWatcher = $scope.$watch('inputs.backupPubKey', function (xpub) {
              if (xpub && $scope.userXpubValid()) {
                // track the successful addition of a backup xpub
                AnalyticsProxy.track('ValidBackupXpubEntered');
                disableOptions([
                  'inBrowser',
                  'coldKeyApp'
                ]);
                $scope.inputs.useOwnBackupKey = true;
              }
            });
          // Clean up the listeners on the scope
          $scope.$on('$destroy', function () {
            killXpubWatcher();
          });
          // Initialize the controller
          function init() {
            $scope.option = 'inBrowser';
          }
          init();
        }
      ]
    };
  }
]);/**
  Directive to manage the wallet creation label step
  - Parent Controller is WalletCreateController
 */
angular.module('BitGo.Wallet.WalletCreateStepsLabelDirective', []).directive('walletCreateStepsLabel', [
  '$rootScope',
  'UtilityService',
  'NotifyService',
  'AnalyticsProxy',
  function ($rootScope, Utils, Notify, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // determines if the user cannot progress due to having an unsupported browser
          var isUnsupported = false;
          /**
         * Track client-only signup failure events
         * @param error {String}
         *
         * @private
         */
          function trackClientLabelFail(error) {
            if (typeof error !== 'string') {
              throw new Error('invalid error');
            }
            var metricsData = {
                status: 'client',
                message: error,
                action: 'LabelWallet'
              };
            AnalyticsProxy.track('Error', metricsData);
          }
          /**
         * Check if label step is valid
         *
         * @private
         */
          function isValidStep() {
            if (isUnsupported) {
              trackClientLabelFail('Unsupported Browser');
              $scope.setFormError('We do not support this version of Internet Explorer. Please upgrade to the latest version.');
              return false;
            }
            if ($scope.inputs.walletLabel === '' || !$scope.inputs.walletLabel) {
              trackClientLabelFail('Missing Wallet Name');
              $scope.setFormError('Please enter a wallet name.');
              return false;
            }
            if ($scope.inputs.walletLabel.indexOf('.') !== -1) {
              trackClientLabelFail('Invalid Wallet Name');
              $scope.setFormError('Wallet names cannot contain periods.');
              return false;
            }
            if ($scope.inputs.walletLabel.length > 50) {
              trackClientLabelFail('Invalid Wallet Name Length');
              $scope.setFormError('Wallet names cannot be longer than 50 characters.');
              return false;
            }
            return true;
          }
          /**
         * Check if the user's browser is supported (we do not support old IE versions)
         *
         * @private
         */
          function checkSupport() {
            if (Utils.Global.browserIsUnsupported()) {
              Notify.error('We do not support this version of Internet Explorer. Please upgrade to the latest version.');
              // kill advancement ability
              isUnsupported = true;
            }
          }
          $scope.advanceLabel = function () {
            // clear any errors
            $scope.clearFormError();
            if (isValidStep()) {
              // track the successful label advancement
              var metricsData = { walletLabel: $scope.inputs.walletLabel };
              AnalyticsProxy.track('LabelWallet', metricsData);
              // advance the form
              $scope.setState('backupkey');
            }
          };
          function init() {
            checkSupport();
          }
          init();
        }
      ]
    };
  }
]);/**
 * Directive to manage the wallet create passcode step
 * - Parent Controller is WalletCreateController
 * - Determines if the passcode the user enters is their correct account passcode
 * - Creates the 3 keychains needed for the wallet about to be made
 * - Manages the wallet create progress bar going from 0 to 5.
 */
angular.module('BitGo.Wallet.WalletCreateStepsPasscodeDirective', []).directive('walletCreateStepsPasscode', [
  '$q',
  '$rootScope',
  'UtilityService',
  'NotifyService',
  'KeychainsAPI',
  'UserAPI',
  '$timeout',
  'BG_DEV',
  'AnalyticsProxy',
  'AnalyticsUtilities',
  function ($q, $rootScope, Utils, Notify, KeychainsAPI, UserAPI, $timeout, BG_DEV, AnalyticsProxy, AnalyticsUtilities) {
    // valid password type options
    var VALID_PW_OPTIONS = {
        newWalletPw: true,
        loginPw: true
      };
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // Flag to show the wallet creation template when doing the
          // wallet creation work
          $scope.creatingWallet = null;
          // the currently selected wallet password option
          $scope.option = null;
          // Used to check the strength of a new user-entered password
          $scope.passcodeStrength = null;
          // Bool to show the pw strength meter
          $scope.showPasscodeStrength = null;
          /**
         * Track client-only signup failure events
         * @param error {String}
         *
         * @private
         */
          function trackClientSignupFail(error) {
            if (typeof error !== 'string') {
              throw new Error('invalid error');
            }
            var metricsData = {
                status: 'client',
                message: error,
                action: 'SetWalletPasscode'
              };
            AnalyticsProxy.track('Error', metricsData);
          }
          /**
         * Ensure a user-entered password form is valid
         * @private
         */
          function newWalletPasswordFormIsValid() {
            if (!$scope.inputs.passcode) {
              trackClientSignupFail('Custom Passcode Missing');
              $scope.setFormError('Please enter a strong password.');
              return false;
            }
            if (!$scope.passcodeStrength) {
              trackClientSignupFail('No Passcode Strength Module');
              $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
              return false;
            }
            if ($scope.passcodeStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
              trackClientSignupFail('Custom Passcode Weak');
              $scope.setFormError('Please enter a stronger password.');
              return false;
            }
            if ($scope.inputs.passcode != $scope.inputs.passcodeConfirm) {
              trackClientSignupFail('Custom Passcodes Do Not Match');
              $scope.setFormError('Please enter matching passwords.');
              return false;
            }
            return true;
          }
          /**
         * Verify if the login passcode the user entered is valid
         * @private
         */
          function loginPasswordFormCheck() {
            var key = $rootScope.currentUser.settings.email.email;
            var passcode = $scope.inputs.passcode || '';
            // We MAC the password with the user's email before verifying
            var params = { password: Utils.Crypto.sjclHmac(key, passcode) };
            return UserAPI.verifyPassword(params);
          }
          /**
         * Function to encrypt the wallet's passcode with a secure code
         * @private
         */
          function generatePasscodeEncryptionCode() {
            // Update the UI progress bar
            $scope.updateProgress(1);
            try {
              $scope.generated.passcodeEncryptionCode = Utils.Crypto.generateRandomPassword(10);
            } catch (e) {
              return $q.reject({ error: 'BitGo needs to gather more entropy for encryption. Please refresh your page and try this again.' });
            }
            $scope.generated.encryptedWalletPasscode = sjcl.encrypt($scope.generated.passcodeEncryptionCode, $scope.inputs.passcode);
            // Let the user see the heavy lifting that we're doing while creating the wallet.
            return $q.when(function () {
              $timeout(function () {
                return $scope.generated.encryptedWalletPasscode;
              }, 500);
            });
          }
          /**
         * Creates the user keychain for the wallet being created
         * @private
         */
          function createUserKeychain() {
            // Update the UI progress bar
            $scope.updateProgress(2);
            var params = {
                source: 'user',
                saveEncryptedXprv: true,
                passcode: $scope.inputs.passcode,
                originalPasscodeEncryptionCode: $scope.generated.passcodeEncryptionCode
              };
            // Return a promise
            return KeychainsAPI.createKeychain(params).then(function (keychain) {
              // advance the UI with CSS
              $scope.generated.walletKeychain = keychain;
              // Let the user see the heavy lifting that we're doing while creating the wallet.
              $timeout(function () {
                return true;
              }, 500);
            });
          }
          /**
         * Creates the user's backup keychain for the wallet being created
         * @private
         */
          function createBackupKeychain(callback) {
            // Update the UI progress bar
            $scope.updateProgress(3);
            var params = {
                source: 'user',
                passcode: $scope.inputs.passcode
              };
            // check if the user provided their own backup key
            if ($scope.generated.backupKeychain) {
              params.source = 'cold';
              params.extendedKey = $scope.generated.backupKeychain;
            }
            // Return a promise
            return KeychainsAPI.createKeychain(params).then(function (keychain) {
              // advance the UI with CSS
              $scope.generated.walletBackupKeychain = keychain;
              // Let the user see the heavy lifting that we're doing while creating the wallet.
              $timeout(function () {
                return true;
              }, 500);
            });
          }
          /**
         * Creates the bitgo keychain for the wallet being created
         * @private
         */
          function createBitGoKeychain(callback) {
            // Update the UI progress bar
            $scope.updateProgress(4);
            return KeychainsAPI.createBitGoKeychain().then(function (keychain) {
              // advance the UI with CSS
              $scope.generated.bitgoKeychain = keychain;
              // Let the user see the heavy lifting that we're doing while creating the wallet.
              $timeout(function () {
                return true;
              }, 500);
            });
          }
          /**
         * Wipe any passcode data on the scope
         * @private
         */
          function resetPasscodeInputs() {
            $scope.inputs.passcode = null;
            $scope.inputs.passcodeConfirm = null;
          }
          /**
         * Kicks off the keychain creation for the new wallet
         * @private
         */
          function advancePasscodeStep() {
            var metricsData;
            // initialize the UI for wallet creation progress
            $scope.creatingWallet = true;
            generatePasscodeEncryptionCode().then(createUserKeychain).then(createBackupKeychain).then(createBitGoKeychain).then(function () {
              // track the successful keychain creations/advancement
              metricsData = { option: $scope.option };
              AnalyticsProxy.track('SetWalletPasscode', metricsData);
              // Let the user see the heavy lifting that we're doing while creating the wallet.
              $timeout(function () {
                $scope.updateProgress(5);
                $scope.creatingWallet = false;
                $scope.setState('activate');
              }, 500);
            }).catch(function (error) {
              $scope.updateProgress();
              $scope.creatingWallet = false;
              resetPasscodeInputs();
              // Alert the user in the UI
              Notify.error(error.error);
              // track the failed advancement
              metricsData = {
                status: error.status,
                message: error.error,
                action: 'SetWalletPasscode'
              };
              AnalyticsProxy.track('Error', metricsData);
            });
          }
          /**
         * Ensures a wallet-specific passcode is valid before making keychains
         * @public
         */
          $scope.advanceWithNewWalletPasscode = function () {
            // clear any errors
            $scope.clearFormError();
            if (newWalletPasswordFormIsValid()) {
              advancePasscodeStep();
            }
          };
          /**
         * Ensures a the login passcode is valid before making keychains
         * @public
         */
          $scope.advanceWithLoginPasscode = function () {
            // clear any errors
            $scope.clearFormError();
            loginPasswordFormCheck().then(advancePasscodeStep).catch(function () {
              $scope.setFormError('Invalid login password.');
              // track the failed advancement with the account passcode
              var metricsData = {
                  status: 'client',
                  message: 'Account Passcode Invalid',
                  action: 'SetWalletPasscode'
                };
              AnalyticsProxy.track('Error', metricsData);
            });
          };
          /**
         * Watch option changes and modify scope data as needed
         * @private
         */
          var killOptionWatcher = $scope.$watch('option', function (option) {
              if (option) {
                resetPasscodeInputs();
              }
            });
          /**
         * Clean up the watchers when the directive is garbage collected
         * @private
         */
          $scope.$on('$destroy', function () {
            killOptionWatcher();
          });
          // Initialize the controller
          function init() {
            $scope.creatingWallet = false;
            // use the login password by default
            $scope.option = 'newWalletPw';
          }
          init();
        }
      ],
      link: function (scope, ele, attrs) {
        // Instance used to track how long it takes a user to enter a valid pw
        var analyticsPasswordMonitor;
        /**
         * Updates the UI progress bar as the keychains are created
         * @public
         */
        scope.updateProgress = function (step) {
          // Remove the class `processing-indicator--*` regardless
          $('.processing-indicator').removeClass(function (index, css) {
            return (css.match(/(^|\s)processing-indicator--\S+/g) || []).join(' ');
          });
          // If a valid step is passed in, let's augment the indicator class
          if (step) {
            var regex = new RegExp(/[1-5]/);
            if (regex.test(step)) {
              angular.element('.processing-indicator').addClass('processing-indicator--' + step);
            }
          }
        };
        /**
         * Set the password type to use when encrypting the wallet
         * @param option {String}
         * @public
         */
        scope.setPasswordOption = function (option) {
          // always clean out form errors when switching options
          scope.clearFormError();
          if (!option || !_.has(VALID_PW_OPTIONS, option)) {
            throw new Error('Expect a valid option when choosing a password method');
          }
          scope.option = option;
          // Track the password option selected
          var metricsData = { option: option };
          AnalyticsProxy.track('SelectWalletPasscodeOption', metricsData);
        };
        /**
         * UI - show/hide the correct password option
         * @param option {Object} option to use/show
         * @public
         */
        scope.showOption = function (option) {
          return scope.option === option;
        };
        /**
         * Set the local password strength object
         * @param passcodeStrength {Object}
         * @public
         */
        scope.checkStrength = function (passcodeStrength) {
          scope.passcodeStrength = passcodeStrength;
          // Track the time it takes the user to enter their first valid password
          analyticsPasswordMonitor.track('CreateCustomWalletPasscode', passcodeStrength);
        };
        /**
         * UI show the strength meter
         * @public
         */
        scope.showPasscodeStrength = function () {
          return scope.inputs.passcode && scope.inputs.passcode.length && scope.passcodeStrength;
        };
        function initLink() {
          // init an instance of the password time-to-complete tracker
          analyticsPasswordMonitor = new AnalyticsUtilities.time.PasswordCompletionMonitor();
        }
        initLink();
      }
    };
  }
]);// Module that manages all wallet functionality in the app
angular.module('BitGo.Wallet', [
  'BitGo.Wallet.WalletController',
  'BitGo.Wallet.WalletTransactionsManagerDirective',
  'BitGo.Wallet.WalletTransactionWallettxTileDirective',
  'BitGo.Wallet.WalletTransactionHistoryTileDirective',
  'BitGo.Wallet.WalletApprovalTileDirective',
  'BitGo.Wallet.WalletReceiveManagerDirective',
  'BitGo.Wallet.WalletReceiveCurrentReceiveAddressManager',
  'BitGo.Common.WalletReceiveAddressTileDirective',
  'BitGo.Wallet.WalletSendManagerDirective',
  'BitGo.Wallet.WalletSendStepsTypeahead',
  'BitGo.Wallet.WalletSendStepsPrepareTxDirective',
  'BitGo.Wallet.WalletSendStepsConfirmTxDirective',
  'BitGo.Wallet.WalletCreateController',
  'BitGo.Wallet.WalletCreateStepsLabelDirective',
  'BitGo.Wallet.WalletCreateStepsBackupkeyDirective',
  'BitGo.Wallet.WalletCreateStepsPasscodeDirective',
  'BitGo.Wallet.WalletCreateStepsActivateDirective',
  'BitGo.Wallet.WalletPolicyManagerDirective',
  'BitGo.Wallet.WalletPolicySpendingLimitDirective',
  'BitGo.Wallet.WalletPolicyWhitelistManagerDirective',
  'BitGo.Wallet.WalletPolicyWhitelistAddDirective',
  'BitGo.Wallet.walletPolicyWhitelistTileDirective',
  'BitGo.Wallet.WalletUsersManagerDirective',
  'BitGo.Wallet.WalletAddUserFormDirective',
  'BitGo.Wallet.WalletUserListDirective',
  'BitGo.Wallet.WalletPolicyWhitelistAddDirective',
  'BitGo.Wallet.WalletSettingsManagerDirective',
  'BitGo.Wallet.WalletSettingsGeneralFormDirective',
  'BitGo.Wallet.WalletSettingsPasscodeFormDirective',
  'BitGo.Wallet.WalletRecoverController'
]);/**
 * @ngdoc directive
 * @name walletPolicyManager
 * @description
 * Manages the all of the policy management state and its sub-directives
 * Depends on: bg-state-manager
 * @example
 *   <div wallet-policy-manager></div>
 */
angular.module('BitGo.Wallet.WalletPolicyManagerDirective', []).directive('walletPolicyManager', [
  '$rootScope',
  'NotifyService',
  'BG_DEV',
  function ($rootScope, NotifyService, BG_DEV) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // valid spending limit types
          var SPENDING_LIMIT_TYPES = {
              tx: true,
              day: true
            };
          // All valid view stats for the policy section
          $scope.viewStates = [
            'dailyLimit',
            'transactionLimit',
            'whitelist'
          ];
          /**
         * Logic to show/hide whitelist pending approvals
         * @public
         */
          $scope.showWhitelistApprovals = function () {
            var currentWallet = $rootScope.wallets.current;
            if (!currentWallet || !currentWallet.data.pendingApprovals.length) {
              return false;
            }
            return _.filter(currentWallet.data.pendingApprovals, function (approvalItem) {
              if (!approvalItem.info.policyRuleRequest) {
                return;
              }
              return approvalItem.info.policyRuleRequest.update.id === BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address'];
            }).length > 0;
          };
          /**
         * Logic to show/hide spending limit pending approvals
         * @public
         */
          $scope.showLimitApprovals = function (type) {
            if (!type || !_.has(SPENDING_LIMIT_TYPES, type)) {
              throw new Error('invalid spending limit type');
            }
            var currentWallet = $rootScope.wallets.current;
            if (!currentWallet || !currentWallet.data.pendingApprovals.length) {
              return false;
            }
            var typeString = 'com.bitgo.limit.' + type;
            return _.filter(currentWallet.data.pendingApprovals, function (approvalItem) {
              if (!approvalItem.info.policyRuleRequest) {
                return;
              }
              return approvalItem.info.policyRuleRequest.update.id === BG_DEV.WALLET.BITGO_POLICY_IDS[typeString];
            }).length > 0;
          };
          /**
         * Let all children views know when the section changes
         * @public
         */
          var killStateWatcher = $scope.$watch('state', function () {
              $scope.$broadcast('walletPolicyManager.PolicySectionChanged', { section: $scope.state });
            });
          $scope.$on('$destroy', function () {
            killStateWatcher();
          });
          function init() {
            $rootScope.setContext('walletPolicy');
            $scope.state = 'dailyLimit';
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletPolicySpendingLimit
 * @description
 * Manages the state for a policy spending limit type
 * @example
 *   <div wallet-policy-spending-limit policy-id="com.bitgo.limit.tx"></div>
 *   - or -
 *   <div wallet-policy-spending-limit policy-id="com.bitgo.limit.day"></div>
 */
angular.module('BitGo.Wallet.WalletPolicySpendingLimitDirective', []).directive('walletPolicySpendingLimit', [
  '$rootScope',
  'NotifyService',
  'PolicyAPI',
  'WalletsAPI',
  'WalletModel',
  'BG_DEV',
  function ($rootScope, NotifyService, PolicyAPI, WalletsAPI, WalletModel, BG_DEV) {
    // spending limit section names
    var DAILY_LIMIT_SECTION = 'dailyLimit';
    var TRANSACTION_LIMIT_SECTION = 'transactionLimit';
    // default policies if the user doesn't have one
    var DEFAULT_POLICIES = {
        'com.bitgo.limit.day': {
          action: { type: 'getApproval' },
          condition: { amount: null },
          id: 'com.bitgo.limit.day',
          type: 'dailyLimit',
          default: true
        },
        'com.bitgo.limit.tx': {
          action: { type: 'getApproval' },
          condition: { amount: null },
          id: 'com.bitgo.limit.tx',
          type: 'transactionLimit',
          default: true
        }
      };
    return {
      restrict: 'A',
      scope: true,
      controller: [
        '$scope',
        function ($scope) {
          // local copy of the daily limit policy to keep track of user changes
          $scope.localPolicy = null;
          // actual user policy (if it exists)
          $scope.actualPolicy = null;
          /**
         * Validate if the a policy amount is above or below OK thresholds
         * @param amount {Int} (satoshi) value of new policy being set
         * @private
         */
          function amountValid(amount) {
            if (typeof amount === 'undefined') {
              $scope.setFormError('Please enter a valid limit.');
              return false;
            }
            if (amount > BG_DEV.TX.MAXIMUM_BTC_SPENDING_LIMIT) {
              $scope.setFormError('This amount is too large to use.');
              return false;
            }
            return true;
          }
          /**
         * Set the spending limit policies on the scope data
         * @param policy {Object} BitGo policy object
         * @private
         */
          function setPolicyData(policy) {
            if (!policy) {
              throw new Error('missing policy');
            }
            $scope.actualPolicy = policy;
            // keep a local copy to watch for changes
            $scope.localPolicy = _.cloneDeep(policy);
          }
          /**
         * Init the spending limit policy based on user's policy
         * @private
         */
          function tryInitFromUserPolicy() {
            var defaultPolicy = DEFAULT_POLICIES[$scope.policyId];
            // the user may not have a policy, so set/use a default if needed
            if (!$rootScope.wallets.current.hasPolicy()) {
              return setPolicyData(defaultPolicy);
            }
            var policy = _.filter($rootScope.wallets.current.data.admin.policy.rules, function (policyRule, idx) {
                return policyRule.id === BG_DEV.WALLET.BITGO_POLICY_IDS[$scope.policyId];
              })[0];
            var userPolicy = policy || defaultPolicy;
            setPolicyData(userPolicy);
          }
          /**
         * Init the spending limit policies on the rootScope
         * @public
         */
          $scope.initPolicy = function () {
            if (!$rootScope.wallets.current) {
              throw new Error('Expecting current wallet on rootscope');
            }
            if ($rootScope.wallets.current.data.admin && $rootScope.wallets.current.data.admin.policy) {
              tryInitFromUserPolicy();
            } else {
              setPolicyData(DEFAULT_POLICIES[$scope.policyId]);
            }
          };
          /**
         * Update the local data to be in sync the new wallet data
         * @param updatedWallet {Object} BitGo wallet object
         * @private
         */
          function handlePolicyUpdate(updatedWallet) {
            // Update the current wallet throughout the app
            // b/c we might have new policies and pending approvals
            var wallet = new WalletModel.Wallet(updatedWallet);
            WalletsAPI.setCurrentWallet(wallet, true);
            // update local/actual policy with the latest data
            tryInitFromUserPolicy();
          }
          /**
         * Handle the returned pending approval from a policy update request
         * @param approval {Object} BitGo pending approval object
         * @private
         */
          function handlePolicyPendingApproval(approval) {
            NotifyService.success('This policy change was submitted for approval');
            // Add the pending approval in the current wallet
            $rootScope.wallets.current.addApproval(approval);
            // Then update the all pending approvals on the current enterprise
            // because the enterprise needs to know about all new pending approvals
            $rootScope.enterprises.current.setApprovals($rootScope.wallets.all);
            // reset the local/actual policy - no update is needed b/c of approval
            tryInitFromUserPolicy();
          }
          /**
         * Reset the user's local policy changes
         * @public
         */
          $scope.cancelPolicyChanges = function () {
            // clear any existing errors
            $scope.clearFormError();
            // then reset the policy
            tryInitFromUserPolicy();
          };
          /**
         * Delete the user's tx limit
         * @public
         */
          $scope.deletePolicy = function () {
            // clear any existing errors
            $scope.clearFormError();
            var params = {
                bitcoinAddress: $rootScope.wallets.current.data.id,
                id: $scope.localPolicy.id
              };
            PolicyAPI.deletePolicyRule(params).then(function (data) {
              if (data.pendingApproval) {
                return handlePolicyPendingApproval(data.pendingApproval);
              }
              handlePolicyUpdate(data);
            }).catch(NotifyService.errorHandler);
          };
          /**
         * Submit the user's tx limit change
         * @public
         */
          $scope.submitChange = function () {
            // clear any existing errors
            $scope.clearFormError();
            // validate the amount before saving
            if (!amountValid($scope.localPolicy.condition.amount)) {
              return;
            }
            var params = {
                bitcoinAddress: $rootScope.wallets.current.data.id,
                rule: $scope.localPolicy
              };
            PolicyAPI.updatePolicyRule(params).then(function (data) {
              if (data.pendingApproval) {
                return handlePolicyPendingApproval(data.pendingApproval);
              }
              handlePolicyUpdate(data);
            }).catch(NotifyService.errorHandler);
          };
          /**
         * Listens for the current wallet to be updated
         */
          var killCurrentWalletListener = $scope.$watch('wallets.current', function (wallet) {
              if (wallet) {
                $scope.initPolicy();
              }
            });
          /**
         * Listen for the section to change to clean up unsaved state
         */
          var killStateWatcher = $scope.$on('walletPolicyManager.PolicySectionChanged', function (evt, data) {
              if (data.section === DAILY_LIMIT_SECTION || data.section === TRANSACTION_LIMIT_SECTION) {
                tryInitFromUserPolicy();
              }
            });
          $scope.$on('$destroy', function () {
            killCurrentWalletListener();
            killStateWatcher();
          });
        }
      ],
      link: function (scope, ele, attrs) {
        /**
         * Logic to show/hide the daily limit save button
         * @public
         */
        scope.showSaveButton = function () {
          return scope.localPolicy && scope.actualPolicy && scope.localPolicy.condition.amount != scope.actualPolicy.condition.amount;
        };
        scope.showRemoveButton = function () {
          return scope.localPolicy.condition.amount == scope.actualPolicy.condition.amount && !scope.localPolicy.default;
        };
        scope.showCancelButton = function () {
          return scope.localPolicy.condition.amount != scope.actualPolicy.condition.amount;
        };
        function init() {
          if (!attrs.policyId || !_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, attrs.policyId)) {
            throw new Error('invalid policy ID');
          }
          scope.policyId = attrs.policyId;
          scope.initPolicy();
        }
        init();
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletPolicyWhitelistAdd
 * @description
 * Manages the whitelist add new address section
 * @example
 *   <div wallet-policy-whitelist-add></div>
 */
angular.module('BitGo.Wallet.WalletPolicyWhitelistAddDirective', []).directive('walletPolicyWhitelistAdd', [
  '$rootScope',
  'NotifyService',
  'PolicyAPI',
  'LabelsAPI',
  'WalletsAPI',
  'WalletModel',
  function ($rootScope, NotifyService, PolicyAPI, LabelsAPI, WalletsAPI, WalletModel) {
    return {
      restrict: 'A',
      require: '^?walletPolicyWhitelistManager',
      controller: [
        '$scope',
        function ($scope) {
          // data for an address to be added to the whitelist policy
          $scope.newAddress = null;
          function formIsValid() {
            if (!Bitcoin.Address.validate($scope.newAddress.address)) {
              $scope.setFormError('Please enter a valid bitcoin address.');
              return false;
            }
            if (!$scope.newAddress.label) {
              $scope.setFormError('Please enter a label for the address.');
              return false;
            }
            return true;
          }
          function resetForm() {
            $scope.newAddress = {
              address: null,
              label: ''
            };
          }
          /**
         * Save the label for an address
         */
          function saveAddressLabel() {
            // Handle data
            var params = {
                walletId: $rootScope.wallets.current.data.id,
                address: $scope.newAddress.address,
                label: $scope.newAddress.label
              };
            return LabelsAPI.add(params);
          }
          /**
         * Add an address to a whitelist for a wallet
         */
          $scope.addAddress = function () {
            var params = {
                bitcoinAddress: $rootScope.wallets.current.data.id,
                rule: {
                  id: $scope.policy.id,
                  condition: { add: $scope.newAddress.address },
                  action: { type: 'getApproval' }
                }
              };
            return $scope.updatePolicy(params).then(saveAddressLabel).then($scope.initPolicy).catch(NotifyService.errorHandler).finally(function () {
              resetForm();
              $scope.setState('list');
            });
          };
          /**
         * Handle form validation/errors and new address submittal
         */
          $scope.submitNewAddressForm = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              $scope.addAddress();
            }
          };
          function init() {
            resetForm();
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletPolicyWhitelistManager
 * @description
 * Manages the whitelist policy section in the app
 * Depends on:
 *   bg-state-manager
 *   bg-address-tile-labeling-manager
 * @example
 *   <div wallet-policy-whitelist-manager></div>
 */
angular.module('BitGo.Wallet.WalletPolicyWhitelistManagerDirective', []).directive('walletPolicyWhitelistManager', [
  '$rootScope',
  'NotifyService',
  'PolicyAPI',
  'LabelsAPI',
  'WalletsAPI',
  'WalletModel',
  'BG_DEV',
  function ($rootScope, NotifyService, PolicyAPI, LabelsAPI, WalletsAPI, WalletModel, BG_DEV) {
    // current section name
    var CURRENT_SECTION = 'whitelist';
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          var DEFAULT_WHITELIST_POLICY = {
              action: { type: 'getApproval' },
              condition: { addresses: [] },
              id: BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.whitelist.address'],
              type: BG_DEV.WALLET.POLICY_TYPES.bitcoinAddressWhitelist
            };
          // valid view states for the section
          $scope.viewStates = [
            'list',
            'add'
          ];
          // list of the bitcoin addresses whitelisted
          $scope.whitelist = null;
          // the user's whitelist policy
          $scope.policy = null;
          /**
         * Fetch the label for an address
         * @param address {String} bitcoin address
         */
          function getAddressLabel(params) {
            LabelsAPI.get(params.address, $rootScope.wallets.current.data.id).then(function (label) {
              var whitelistItem = {
                  index: params.index,
                  address: params.address
                };
              if (label) {
                whitelistItem.label = label.label || '';
                whitelistItem.temporaryLabel = label.label || '';
              } else {
                whitelistItem.label = '';
                whitelistItem.temporaryLabel = '';
              }
              $scope.whitelist.push(whitelistItem);
            }).catch(function (error) {
              console.error('Error fetching label for: ', address, error);
            });
          }
          /**
         * Update the local data to be in sync the new wallet data
         * @param updatedWallet {Object} BitGo wallet object
         * @private
         */
          function handlePolicyUpdate(updatedWallet) {
            // Update the current wallet throughout the app
            // b/c we might have new policies and pending approvals
            var wallet = new WalletModel.Wallet(updatedWallet);
            WalletsAPI.setCurrentWallet(wallet, true);
            // update local policy with the latest data
            $scope.initPolicy();
            return true;
          }
          /**
         * Handle the returned pending approval from a policy update request
         * @param approval {Object} BitGo pending approval object
         * @private
         */
          function handlePolicyPendingApproval(approval) {
            NotifyService.success('This policy change was submitted for approval');
            // Add the pending approval in the current wallet
            $rootScope.wallets.current.addApproval(approval);
            // Then update the all pending approvals on the current enterprise
            // because the enterprise needs to know about all new pending approvals
            $rootScope.enterprises.current.setApprovals($rootScope.wallets.all);
            return true;
          }
          /**
         * Submit the user's whitelist policy change
         * @param params {Object} contains params for policy update
         * @returns {Promise}
         * @public
         */
          $scope.updatePolicy = function (params) {
            if (!params || !params.rule || !params.bitcoinAddress) {
              throw new Error('invalid params');
            }
            return PolicyAPI.updatePolicyRule(params).then(function (data) {
              if (data.pendingApproval) {
                return handlePolicyPendingApproval(data.pendingApproval);
              }
              return handlePolicyUpdate(data);
            });
          };
          /**
         * Initialize the user's policy based on their latest data
         * @public
         */
          $scope.initPolicy = function () {
            if (!$rootScope.wallets.current) {
              throw new Error('Expecting current wallet on rootscope');
            }
            $scope.whitelist = [];
            $scope.policy = $rootScope.wallets.current.getWhitelist() || DEFAULT_WHITELIST_POLICY;
            _.forEach($scope.policy.condition.addresses, function (address, index) {
              var params = {
                  index: index,
                  address: address
                };
              getAddressLabel(params);
            });
          };
          /**
         * Remove an address from the user's whitelist
         * @public
         */
          $scope.removeAddress = function (tileItem) {
            if (!tileItem) {
              throw new Error('invalid params');
            }
            var params = {
                bitcoinAddress: $rootScope.wallets.current.data.id,
                rule: {
                  id: $scope.policy.id,
                  condition: { remove: tileItem.address },
                  action: { type: 'getApproval' }
                }
              };
            $scope.updatePolicy(params).catch(NotifyService.errorHandler);
          };
          // listen for the tile to be updated, then close it
          var killTileUpdateWatch = $scope.$on('bgListAddressTileLabeler.CurrentTileUpdated', function (evt, updatedWhitelistItem) {
              $scope.whitelist[updatedWhitelistItem.index] = updatedWhitelistItem;
            });
          /**
         * Listens for the current wallet to be updated
         */
          var killCurrentWalletListener = $scope.$watch('wallets.current', function (wallet) {
              if (wallet) {
                $scope.initPolicy();
              }
            });
          /**
         * Listen for the section to change to reset state
         */
          var killStateWatcher = $scope.$on('walletPolicyManager.PolicySectionChanged', function (evt, data) {
              if (data.section === CURRENT_SECTION) {
                $scope.state = 'list';
                $scope.initPolicy();
              }
            });
          /**
         * Clean up the listeners
         */
          $scope.$on('$destroy', function () {
            killTileUpdateWatch();
            killCurrentWalletListener();
            killStateWatcher();
          });
          function init() {
            $scope.state = 'list';
            $scope.initPolicy();
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletPolicyWhitelistAddressTile
 * @description
 * Manages template state and compiling for the whitelist address tile
 * Depends on:
 *    bg-list-address-tile-labeling-manager
 * @example
 *   <tr wallet-policy-whitelist-tile></tr>
 */
angular.module('BitGo.Wallet.walletPolicyWhitelistTileDirective', []).directive('walletPolicyWhitelistTile', [
  '$rootScope',
  '$http',
  '$compile',
  '$templateCache',
  'LabelsAPI',
  'NotifyService',
  function ($rootScope, $http, $compile, $templateCache, LabelsAPI, NotifyService) {
    return {
      restrict: 'A',
      scope: true,
      controller: [
        '$scope',
        function ($scope) {
          $scope.viewStates = [
            'initial',
            'labeling'
          ];
          /**
         * Cancel the labeling for the currently open tile
         */
          $scope.cancelTileItemEdit = function () {
            $scope.tileItem.temporaryLabel = $scope.tileItem.labelIsDefault ? '' : $scope.tileItem.label;
            $scope.$emit('walletPolicyWhitelistTile.CloseCurrentTile');
          };
          function init() {
            $scope.state = 'initial';
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        /**
         * Save a new label for an address
         * @param {Obj} tile item being updated
         * @param {String} new label for the address
         */
        scope.saveTileItemLabel = function (tileItem, label) {
          if (!label) {
            return;
          }
          if (!tileItem) {
            throw new Error('Missing params');
          }
          if (label === tileItem.label) {
            return;
          }
          // Handle data
          var params = {
              walletId: $rootScope.wallets.current.data.id,
              address: tileItem.address,
              label: label
            };
          return LabelsAPI.add(params).then(function (label) {
            params = {
              label: label.label,
              temporaryLabel: label.label,
              labelIsDefault: false,
              address: tileItem.address,
              index: tileItem.index
            };
            // update the local tile item first
            scope.tileItem.label = params.label;
            scope.tileItem.temporaryLabel = params.temporaryLabel;
            scope.tileItem.labelIsDefault = params.labelIsDefault;
            // broadcast the update of the tile item to relevant listeners
            scope.$emit('walletPolicyWhitelistTile.CurrentTileUpdated', params);
          }).catch(NotifyService.errorHandler).finally(function () {
            // always close the tile
            scope.cancelTileItemEdit();
          });
        };
        /**
         * Watch the tile index; show if this tile currently being labeled
         */
        var killTileIdxWatch = scope.$watch('currentTileIdx', function () {
            if (scope.tileItem.index === scope.currentTileIdx) {
              scope.setState('labeling');
            } else {
              scope.setState('initial');
            }
          });
        /**
         * Clean up the listeners
         */
        scope.$on('$destroy', function () {
          killTileIdxWatch();
        });
        function init() {
          $http.get('wallet/templates/wallet-policy-partial-whitelist-list-tile.html', { cache: $templateCache }).success(function (html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        init();
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletReceiveAddressTileDirective
 * @description
 * Manages template state and compiling for the receive address tile
 * Depends on:
 *    bg-list-address-tile-labeling-manager
 * @example
 *   <tr wallet-receive-address-tile></tr>
 */
angular.module('BitGo.Common.WalletReceiveAddressTileDirective', []).directive('walletReceiveAddressTile', [
  '$rootScope',
  '$http',
  '$compile',
  '$templateCache',
  'LabelsAPI',
  'NotifyService',
  function ($rootScope, $http, $compile, $templateCache, LabelsAPI, NotifyService) {
    return {
      restrict: 'A',
      scope: true,
      controller: [
        '$scope',
        function ($scope) {
          $scope.viewStates = [
            'initial',
            'labeling'
          ];
          /**
         * Cancel the labeling for the currently open tile
         */
          $scope.cancelTileItemEdit = function () {
            $scope.tileItem.temporaryLabel = $scope.tileItem.labelIsDefault ? '' : $scope.tileItem.label;
            $scope.$emit('walletReceiveAddressTile.CloseCurrentTile');
          };
          function init() {
            $scope.state = 'initial';
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        /**
         * Save a new label for an address
         * @param {Obj} tile item being updated
         * @param {String} new label for the address
         */
        scope.saveTileItemReceiveLabel = function (tileItem, label) {
          if (!tileItem) {
            throw new Error('Missing params');
          }
          // If the label was not changed
          if (label === tileItem.label) {
            return;
          }
          // Handle data
          var params = {
              walletId: $rootScope.wallets.current.data.id,
              address: tileItem.address,
              label: label
            };
          // If a label exists, save the new label
          if (label) {
            return LabelsAPI.add(params).then(function (label) {
              params = {
                label: label.label,
                temporaryLabel: label.label,
                labelIsDefault: false,
                address: tileItem.address,
                index: tileItem.index
              };
              // update the local tile item first
              scope.tileItem.label = params.label;
              scope.tileItem.temporaryLabel = params.temporaryLabel;
              scope.tileItem.labelIsDefault = params.labelIsDefault;
              // broadcast the update of the tile item to relevant listeners
              scope.$emit('walletReceiveAddressTile.CurrentTileUpdated', params);
            }).catch(NotifyService.errorHandler).finally(function () {
              // always close the tile
              scope.cancelTileItemEdit();
            });
          }  // If the label does not exist, delete the existing label
          else {
            // If the titleItem had a label by default
            if (tileItem.labelIsDefault) {
              //close the tile
              scope.cancelTileItemEdit();
              return;
            }
            return LabelsAPI.remove(params).then(function (label) {
              NotifyService.success('The label was removed.');
              params = {
                label: 'Receive Address ' + tileItem.index,
                temporaryLabel: '',
                labelIsDefault: true,
                address: tileItem.address,
                index: tileItem.index
              };
              // update the local tile item first
              scope.tileItem.label = params.label;
              scope.tileItem.temporaryLabel = params.temporaryLabel;
              scope.tileItem.labelIsDefault = params.labelIsDefault;
              // broadcast the update of the tile item to relevant listeners
              scope.$emit('walletReceiveAddressTile.CurrentTileUpdated', params);
            }).catch(NotifyService.errorHandler).finally(function () {
              // always close the tile
              scope.cancelTileItemEdit();
            });
          }
        };
        /**
         * Watch the tile index; show if this tile currently being labeled
         */
        var killTileIdxWatch = scope.$watch('currentTileIdx', function () {
            if (scope.tileItem.index === scope.currentTileIdx) {
              scope.setState('labeling');
            } else {
              scope.setState('initial');
            }
          });
        /**
         * Clean up the listeners
         */
        scope.$on('$destroy', function () {
          killTileIdxWatch();
        });
        function init() {
          $http.get('wallet/templates/wallet-receive-partial-address-list-tile.html', { cache: $templateCache }).success(function (html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        init();
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletReceiveCurrentReceiveAddressManager
 * @description
 * Manages logic for dealing with the current receive address (top section) of the receive page
 * @example
 *   <div wallet-receive-current-receive-address-manager></div>
 */
angular.module('BitGo.Wallet.WalletReceiveCurrentReceiveAddressManager', []).directive('walletReceiveCurrentReceiveAddressManager', [
  '$rootScope',
  '$timeout',
  '$compile',
  '$http',
  '$templateCache',
  'NotifyService',
  'LabelsAPI',
  'BG_DEV',
  function ($rootScope, $timeout, $compile, $http, $templateCache, NotifyService, LabelsAPI, BG_DEV) {
    return {
      restrict: 'A',
      replace: true,
      require: '^?walletReceiveManager',
      controller: [
        '$scope',
        function ($scope) {
          // state to let user know when an address is being generated
          $scope.addressBeingGenerated = null;
          /**
         * Logic to show/hide the main address label show/hide buttons
         */
          $scope.generateNewReceiveAddress = function () {
            if (!$scope.addressBeingGenerated) {
              // Lock the UI
              $scope.addressBeingGenerated = true;
              // This function exists in the ancestor WalletController
              // It was initially used to set up $scope.currentReceiveAddress
              $scope.generateNewReceiveAddressForWallet(false).then(function (tileItem) {
                // refetch the address list to keep the local index in sync
                $scope.initAddressList();
              }).catch(NotifyService.errorHandler).finally(function () {
                // always unlock the UI if something went wrong
                $scope.addressBeingGenerated = false;
              });
            }
          };
          /**
         * Empties the temporary address on current receive address textbox focus
         * @param {Obj} currentReceiveAddress - a bitgo address object
         */
          $scope.emptyTemporary = function (currentReceiveAddress) {
            if (!currentReceiveAddress || !currentReceiveAddress.index) {
              console.log('Could not get current receive address');
              return;
            }
            // reset temp address if the label is a default one
            if (currentReceiveAddress.temporaryLabel === 'Receive Address ' + currentReceiveAddress.index) {
              $scope.currentReceiveAddress.temporaryLabel = '';
            }
          };
          /**
         * Logic to disable the labelling text box on the most recent receive address
         */
          $scope.cannotEditLabel = function () {
            return $rootScope.wallets.current.role !== BG_DEV.WALLET.ROLES.ADMIN || !$rootScope.wallets.current.isSafehdWallet();
          };
          /**
         * Logic to show/hide 'generate address' button
         */
          $scope.canGenerateAddress = function () {
            return !$scope.addressBeingGenerated && $rootScope.wallets.current.role !== BG_DEV.WALLET.ROLES.VIEW && $rootScope.wallets.current.isSafehdWallet();
          };
          /**
         * Logic to show/hide the main address label show/hide buttons
         */
          $scope.canShowMainEditButtons = function () {
            if (!$scope.currentReceiveAddress) {
              return;
            }
            return $scope.currentReceiveAddress.temporaryLabel !== $scope.currentReceiveAddress.label;
          };
          function init() {
            $scope.addressBeingGenerated = false;
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        /**
         * Cancel editing the label for the primary address shown
         */
        scope.cancelMainLabelSave = function () {
          scope.currentReceiveAddress.temporaryLabel = scope.currentReceiveAddress.label;
        };
        /**
         * Save a new label for an address
         * @param {Obj} a bitgo address object
         * @param {String} new label for the address
         */
        scope.saveMainLabel = function (tileItem, label) {
          // Handle UI
          $timeout(function () {
            angular.element('input[name=temporaryLabel]').blur();
          }, 0);
          // Handle data
          var params = {
              walletId: $rootScope.wallets.current.data.id,
              address: tileItem.address,
              label: label
            };
          // Save the new label if there is a label present
          if (label) {
            return LabelsAPI.add(params).then(function (label) {
              NotifyService.success('The label was saved.');
              params = {
                label: label.label,
                address: tileItem,
                index: tileItem.index
              };
              scope.decorateAddresses(params, true);
            }).catch(NotifyService.errorHandler);
          }  // If there was no new label provided
          else {
            // if the label is default, cancel the save
            if (tileItem.label === 'Receive Address ' + tileItem.index) {
              scope.cancelMainLabelSave();
              return;
            }
            return LabelsAPI.remove(params).then(function (label) {
              NotifyService.success('The label was removed.');
              params = {
                label: 'Receive Address ' + tileItem.index,
                address: tileItem,
                labelIsDefault: true,
                index: tileItem.index
              };
              scope.decorateAddresses(params, true);
            }).catch(NotifyService.errorHandler);
          }
        };
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletReceiveManager
 * @description
 * Directive to manage the wallet receive page (top section and list areas)
 * @example
 *   <div wallet-receive-manager></div>
 */
angular.module('BitGo.Wallet.WalletReceiveManagerDirective', []).directive('walletReceiveManager', [
  '$q',
  '$timeout',
  '$rootScope',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'InfiniteScrollService',
  'WalletsAPI',
  'LabelsAPI',
  'BG_DEV',
  function ($q, $timeout, $rootScope, NotifyService, CacheService, UtilityService, InfiniteScrollService, WalletsAPI, LabelsAPI, BG_DEV) {
    return {
      restrict: 'A',
      require: '^?WalletController',
      controller: [
        '$scope',
        function ($scope) {
          // base string for the receive address' label
          var RECEIVE_ADDRESS_LABEL_BASE = 'Receive Address ';
          // the total of items we can possibly fetch
          var total;
          // the start index for the initial data fetch
          var startIdx;
          // limits the data fetch number of results
          var limit;
          // bool to let us know if address list is being fetched
          var gettingAddresses;
          // list of addresses belonging to the wallet (consumed for the UI)
          $scope.addresses = null;
          // index of the address tile being edited
          $scope.currentTileIdx = null;
          /**
         * Return whether or not the user can edit a label (ui logic)
         * @param tileItem {Object} a list tile item
         * @returns {Bool}
         */
          $scope.userCanEdit = function (tileItem) {
            if (!tileItem) {
              throw new Error('missing tile item');
            }
            if (tileItem.index === 0) {
              return false;
            }
            return $rootScope.wallets.current.role !== BG_DEV.WALLET.ROLES.VIEW;
          };
          /**
         * Decorate a addresses with updated properties
         * @param {Obj} params to update the address object in the list
         * @param {Bool} is the address the main/current receive address shown
         */
          $scope.decorateAddresses = function (params, isMainReceiveAddress) {
            if (!params.index.toString()) {
              // toString to account for 0 index
              throw new Error('Invalid params');
            }
            var listItem;
            _.forEach($scope.addresses, function (tileItem) {
              if (tileItem.index === params.index) {
                listItem = tileItem;
              }
            });
            if (!listItem) {
              throw new Error('Expected address object');
            }
            // add the label
            if (params.label) {
              listItem.label = params.label;
              listItem.temporaryLabel = params.label;
              // update the main receive address if needed
              if (isMainReceiveAddress) {
                $scope.currentReceiveAddress.label = params.label;
                $scope.currentReceiveAddress.temporaryLabel = params.label;
              }
            }
            // Handle setup for if the label is a default label vs. user-given
            if (params.labelIsDefault) {
              listItem.labelIsDefault = params.labelIsDefault;
              listItem.temporaryLabel = '';
            }
          };
          /**
         * Closes the current tile being edited
         */
          $scope.closeCurrentTile = function () {
            $scope.currentTileIdx = null;
          };
          /**
         * Opens a single address list tile to edit the label
         * @param {Obj} a bitgo address object
         */
          $scope.toggleActiveTile = function (tileItem) {
            // if the user is clicking on the existing open tile, close it
            if (isCurrentTile(tileItem.index)) {
              $scope.closeCurrentTile();
              return;
            }
            // if the user selects another tile, close the current one before
            // opening the next one
            if ($scope.currentTileIdx) {
              $scope.closeCurrentTile();
            }
            $scope.currentTileIdx = tileItem.index;
            $scope.$broadcast('walletReceiveManager.TileOpened', tileItem);
          };
          /**
         * Fetches all the addresses associated with the wallet and sets up the scope
         * Also sets the rootScope's scroll handler function
         * @returns {Promise}
         */
          $scope.getAddressesOnPageScroll = function () {
            // Kill the call if: we fetched all the items or if we're generating an address
            if (total && $scope.addresses.length >= total || gettingAddresses) {
              return $q.reject();
            }
            // lock further calls
            gettingAddresses = true;
            // make the call
            var params = {
                bitcoinAddress: $rootScope.wallets.current.data.id,
                chain: 0,
                limit: limit,
                details: true,
                skip: startIdx,
                sort: -1
              };
            return WalletsAPI.getAllAddresses(params).then(function (data) {
              if (!total) {
                total = data.total;
              }
              startIdx += limit;
              $scope.addresses = $scope.addresses.concat(data.addresses);
              // Get the label for each address
              _.forEach($scope.addresses, function (tileItem) {
                getAddressLabel(tileItem);
              });
              return true;
            }).catch(NotifyService.errorHandler).finally(function () {
              // unlock further calls
              gettingAddresses = false;
            });
          };
          /**
         * Fetch/set a fresh address list on the scope
         */
          $scope.initAddressList = function () {
            // reset local vars
            startIdx = 0;
            total = null;
            // reset scope vars
            $scope.addresses = [];
            $scope.getAddressesOnPageScroll();
          };
          // Event Listeners
          /**
         * Listen for changes to a tile item address obj and update it with the new details
         */
          var killDecorateReceiveAddrListener = $scope.$on('walletReceiveAddressTile.CurrentTileUpdated', function (evt, params) {
              if (!params.label || !params.address || !params.index.toString()) {
                // toString to handle 0 index
                throw new Error('Invalid params');
              }
              var isMainReceiveAddress = params.index === $scope.currentReceiveAddress.index;
              $scope.decorateAddresses(params, isMainReceiveAddress);
            });
          /**
         * Clean up listeners
         */
          $scope.$on('$destroy', function () {
            killDecorateReceiveAddrListener();
            // reset the global inifinte scroll handler
            InfiniteScrollService.clearScrollHandler();
          });
          /**
         * Fetch the label for an address
         * @param {Obj} a bitgo address object
         */
          function getAddressLabel(tileItem) {
            LabelsAPI.get(tileItem.address, $rootScope.wallets.current.data.id).then(function (label) {
              // Boolean to let us know if it is a user-given label vs. a default label
              var labelIsDefault = !label;
              var params = {
                  label: label ? label.label : RECEIVE_ADDRESS_LABEL_BASE + tileItem.index,
                  labelIsDefault: labelIsDefault,
                  index: tileItem.index
                };
              $scope.decorateAddresses(params, false);
            }).catch(function (error) {
              console.error('Error fetching label for: ', tileItem);
            });
          }
          /**
         * Helper to let us know what tile is being edited
         */
          function isCurrentTile(index) {
            return $scope.currentTileIdx === index;
          }
          function init() {
            $rootScope.setContext('walletReceive');
            limit = 25;
            gettingAddresses = false;
            $scope.initAddressList();
            // Set the global inifinte scroll handler
            InfiniteScrollService.setScrollHandler($scope.getAddressesOnPageScroll);
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc controller
 * @name WalletRecoverController
 * @description
 * Handles all functionality associated with recovering a single wallet
 *
 * This is a 2 step process:
 * 1) Attempt Decryption of the wallet's user key using a number of methods
 * 2) Re encrypt the xprv decrypted in step 1 and update the wallet
 */
angular.module('BitGo.Wallet.WalletRecoverController', []).controller('WalletRecoverController', [
  '$modal',
  '$rootScope',
  '$scope',
  'UtilityService',
  'BG_DEV',
  'NotifyService',
  'WalletsAPI',
  'KeychainsAPI',
  'WalletSharesAPI',
  function ($modal, $rootScope, $scope, UtilityService, BG_DEV, NotifyService, WalletsAPI, KeychainsAPI, WalletSharesAPI) {
    // valid password type options
    var RECOVERY_OPTIONS = {
        keycard: 'keycard',
        requestInvite: 'requestInvite'
      };
    // view states of the recovery process
    $scope.viewStates = [
      'initial',
      'recovery',
      'newpasscode',
      'requestedReshare',
      'done'
    ];
    // the recovery option being used for the wallet
    $scope.option = null;
    // the wallet-specific info we need for wallet recovery (box D)
    // Note: we only have this information set on the user if they were
    // the wallet's creator. If the user had the wallet shared with them
    // then this data will not be set, and they will not have box D
    $scope.walletRecoveryInfo = null;
    // The user-input values used during the recovery process
    $scope.userInputRecoveryData = null;
    // The new user-input password to re-encrypt the wallet being recovered
    $scope.newPasscode = null;
    $scope.newPasscodeConfirm = null;
    // object containing the strength of the user's new wallet passcode
    $scope.passcodeStrength = null;
    /**
    * Modal - Open a modal specifically for otp
    * @private
    */
    function openModal(size) {
      var modalInstance = $modal.open({
          templateUrl: 'modal/templates/modalcontainer.html',
          controller: 'ModalController',
          scope: $scope,
          size: size,
          resolve: {
            locals: function () {
              return {
                type: BG_DEV.MODAL_TYPES.otp,
                userAction: BG_DEV.MODAL_USER_ACTIONS.otp
              };
            }
          }
        });
      return modalInstance.result;
    }
    /**
     * UI - Show the invite box recovery option
     * @public
     */
    $scope.showInviteRecoveryOption = function () {
      // check if current wallet is set. This takes sometime when the user directly navigates through the URL.
      if ($rootScope.wallets.current) {
        var userIsAdmin = $rootScope.wallets.current.role === BG_DEV.WALLET.ROLES.ADMIN;
        var walletHasMultipleAdmins = $rootScope.wallets.current.multipleAdmins;
        if (!userIsAdmin || userIsAdmin && walletHasMultipleAdmins) {
          return true;
        }
      }
      return false;
    };
    /**
     * UI - Set the recovery type to use
     * @param option {String}
     * @public
     */
    $scope.setRecoveryOption = function (option) {
      if (!option || !_.has(RECOVERY_OPTIONS, option)) {
        throw new Error('invalid recovery option');
      }
      $scope.option = option;
    };
    /**
     * UI - show/hide the correct recovery option
     * @param option {Object} option to use/show
     * @public
     */
    $scope.showOption = function (option) {
      if (!option || !_.has(RECOVERY_OPTIONS, option)) {
        throw new Error('invalid recovery option');
      }
      return $scope.option === option;
    };
    /**
     * UI show the password update button
     * @returns {Bool}
     * @public
     */
    $scope.showUpdateButton = function () {
      if ($scope.newPasscode && $scope.newPasscode == $scope.newPasscodeConfirm) {
        return true;
      }
      return false;
    };
    /**
     * UI - Set the local passcode strength object
     * @param passcodeStrength {Object}
     * @public
     */
    $scope.checkStrength = function (passcodeStrength) {
      $scope.passcodeStrength = passcodeStrength;
    };
    /**
     * UI show the strength meter
     * @public
     */
    $scope.showPasscodeStrength = function () {
      return $scope.newPasscode && $scope.newPasscode.length && $scope.passcodeStrength;
    };
    /**
     * Step 1: Xprv / Invite - Attempt to decrypt an encrypted xPrv with a passcode
     * @param encryptedXprv {String} wallet's user encryptedXprv
     * @param passcode {String} existing (old) wallet passcode
     * @returns {String} user's decrypted private key || undefined
     * @private
     */
    function decryptKeychain(encryptedXprv, passcode) {
      try {
        var privKey = UtilityService.Crypto.sjclDecrypt(passcode, encryptedXprv);
        return privKey;
      } catch (e) {
        return;
      }
    }
    /**
     * Step 1: Xprv / Invite - Check validity of the xprv provided
     * @private
     */
    function userXprvFormValid() {
      if (!$scope.userInputRecoveryData.userXprv.toString()) {
        $scope.setFormError('Please enter a valid private key.');
        return false;
      }
      return true;
    }
    /**
     * Step 1: Xprv / Invite - Attempt verifying user-entered xprv
     * @public
     */
    $scope.recoverWithUserXprv = function () {
      $scope.clearFormError();
      if (userXprvFormValid()) {
        // init a new bip32 object baced on the xprv provided
        var testBip32;
        try {
          testBip32 = new Bitcoin.BIP32($scope.userInputRecoveryData.userXprv);
        } catch (e) {
          $scope.setFormError('Please enter a valid BIP32 master private key (xprv).');
          return;
        }
        var privateInfo = $rootScope.wallets.current.data.private;
        var userXpub = privateInfo.keychains[0].xpub;
        var testXpub = testBip32.extended_public_key_string();
        if (userXpub !== testXpub) {
          $scope.setFormError('Please enter a valid BIP32 master private key (xprv) for this wallet.');
          return;
        }
        // If the provided xprv's xpub matches the user xpub for the wallet
        // then advance to the re-encryption step
        $scope.userInputRecoveryData.decryptedXprv = $scope.userInputRecoveryData.userXprv;
        $scope.setState('newpasscode');
      }
    };
    /**
     * Step 1: Xprv / Invite - Check validity of the wallet keycard form
     * @private
     */
    function keycardBoxDFormValid() {
      if (!$scope.userInputRecoveryData.keycardBoxD.toString()) {
        $scope.setFormError('Please enter valid JSON.');
        return false;
      }
      return true;
    }
    /**
     * Step 1: Xprv / Invite - Attempt decryption using box D
     * @public
     */
    $scope.recoverWithKeycardBoxD = function () {
      $scope.clearFormError();
      if (keycardBoxDFormValid()) {
        var xprv = decryptKeychain($scope.walletRecoveryInfo.encryptedXprv, $scope.userInputRecoveryData.decryptedKeycardBoxD);
        if (!xprv) {
          $scope.setFormError('Unable to decrypt with the JSON provided');
          return;
        }
        $scope.userInputRecoveryData.decryptedXprv = xprv;
        $scope.setState('newpasscode');
      }
    };
    $scope.recoverWithReshare = function () {
      $scope.clearFormError();
      WalletSharesAPI.requestReshare($rootScope.wallets.current.data.id, {}).then(function () {
        $scope.setState('requestedReshare');
      }).catch(NotifyService.errorHandler);
    };
    /**
     * Step 2: Encrypt - Validate the pw form before updating
     * @private
     */
    function newPasscodeFormIsValid() {
      if (!$scope.passcodeStrength) {
        $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
        return false;
      }
      if (!$scope.newPasscode) {
        $scope.setFormError('Please enter new password.');
        return false;
      }
      if (!$scope.newPasscodeConfirm) {
        $scope.setFormError('Please confirm new password.');
        return false;
      }
      if ($scope.newPasscode !== $scope.newPasscodeConfirm) {
        $scope.setFormError('Please enter matching passwords.');
        return false;
      }
      if ($scope.passcodeStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
        $scope.setFormError('Please enter a stronger password.');
        return false;
      }
      return true;
    }
    /**
    * Handler - Handle the error cases that return from the keychain update call
    * @param error {Object} error object returned from the call
    * @private
    */
    function handleKeychainUpdateError(error) {
      if (UtilityService.API.isOtpError(error)) {
        // If the user needs to OTP, use the modal to unlock their account
        openModal().then(function (result) {
          if (result.type === 'otpsuccess') {
            $scope.finishRecovery();
          }
        });
      } else {
        NotifyService.error('There was an error with updating this keychain. Please refresh your page and try this again.');
      }
    }
    /**
     * Step 2: Encrypt - re-encrypt the wallet's user keychain with a new passcode
     * @public
     */
    $scope.finishRecovery = function () {
      $scope.clearFormError();
      if (newPasscodeFormIsValid()) {
        // Get the xpub for the xprv provided. It might not match with xpub on the wallet for legacy wallets
        var newBip32;
        try {
          newBip32 = new Bitcoin.BIP32($scope.userInputRecoveryData.decryptedXprv);
        } catch (e) {
          console.log(e.stack);
          NotifyService.error('There was an error with updating this keychain. Please refresh your page and try this again.');
          return;
        }
        // encrypt the xprv with the user's new passcode
        var newKeychainData = {
            encryptedXprv: UtilityService.Crypto.sjclEncrypt($scope.newPasscode, $scope.userInputRecoveryData.decryptedXprv),
            xpub: newBip32.extended_public_key_string()
          };
        KeychainsAPI.update(newKeychainData).then(function (newKeychain) {
          // Then ensure we reset the updated wallet (with the new private data) in the app
          return WalletsAPI.getWallet({ bitcoinAddress: $rootScope.wallets.current.data.id });
        }).then(function (updatedWallet) {
          // Finally, update the current wallet in the app and finish the process
          WalletsAPI.setCurrentWallet(updatedWallet, true);
          $scope.setState('done');
        }).catch(handleKeychainUpdateError);
      }
    };
    /**
    * Init - initializes the default recovery option for the user based on available data
    * @private
    */
    function initInitialRecoveryOption() {
      $scope.option = RECOVERY_OPTIONS.keycard;
      // If multiple admins on the wallet, best option is to request re-invite
      if ($scope.showInviteRecoveryOption()) {
        $scope.option = RECOVERY_OPTIONS.requestInvite;
      }
    }
    /**
    * Handler - Handle the error cases that return from the data initialization call
    * @param error {Object} error object returned from the call
    * @private
    */
    function handleInitRecoveryInfoError(error) {
      if (UtilityService.API.isOtpError(error)) {
        // If the user needs to OTP, use the modal to unlock their account
        openModal().then(function (result) {
          if (result.type === 'otpsuccess') {
            $scope.initRecoveryInfo();
          }
        });
      } else {
        // We hit this case if the user is on a shared wallet and doesn't have
        // any of the necessary recovery info associated with their keychain on the wallet
        // Specifically, $scope.walletRecoveryInfo is undefined in this state
        $scope.setState('recovery');
      }
    }
    /**
    * Init - Fetch the passcode encryption code for box D of the current wallet
    * @public
    */
    $scope.initRecoveryInfo = function () {
      var params = { walletAddress: $rootScope.wallets.current.data.id };
      WalletsAPI.getWalletPasscodeRecoveryInfo(params).then(function (data) {
        // If we have this data, it means that this was the wallet's creator
        // and they can use Box D to attempt wallet recovery
        $scope.walletRecoveryInfo = data.recoveryInfo;
        // Also, if we're in the initial step, advance the state to the actual recovery screen
        if ($scope.state === 'initial') {
          $scope.setState('recovery');
        }
      }).catch(handleInitRecoveryInfoError).finally(function () {
        initInitialRecoveryOption();
      });
    };
    /**
    * Watcher - watch recovery option changes to modify the scope as needed
    * @private
    */
    var killOptionWatch = $scope.$watch('option', function () {
        // clear errors (if possible) when the user switches recovery options
        if ($scope.clearFormError) {
          $scope.clearFormError();
        }
      });
    /**
    * Watcher - kill watchers when the scope is GC'd
    * @private
    */
    $scope.$on('$destroy', function () {
      killOptionWatch();
    });
    function init() {
      // set the first view state to initial
      $scope.state = 'initial';
      // init all the fields needed during the process
      $scope.userInputRecoveryData = {
        decryptedKeycardBoxD: '',
        decryptedXprv: '',
        keycardBoxD: '',
        userXprv: ''
      };
    }
    init();
  }
]);/**
  Directive to manage the wallet send flows
  - Parent Controller is WalletController
 */
angular.module('BitGo.Wallet.WalletSendManagerDirective', []).directive('walletSendManager', [
  '$timeout',
  '$rootScope',
  '$location',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'TransactionsAPI',
  'BG_DEV',
  function ($timeout, $rootScope, $location, NotifyService, CacheService, UtilityService, TransactionsAPI, BG_DEV) {
    return {
      restrict: 'A',
      require: '^WalletController',
      controller: [
        '$scope',
        function ($scope) {
          // viewstates for the send flow
          $scope.viewStates = [
            'prepareTx',
            'confirmAndSendTx'
          ];
          // current view state
          $scope.state = null;
          // the transaction object built as the user goes through the send flow
          $scope.transaction = null;
          // The actual bitcoin transaction object that will be signed and
          // sent to the BitGo server for processing
          $scope.pendingTransaction = null;
          // flag to show notice if we had to automatically add a fee
          $scope.showFeeAlert = null;
          // Get a copy of the Currency cache to use locally when switching between
          // currencies in the form (used when we allow currency switching)
          var currencyCache = CacheService.getCache('Currency');
          // Cancel the transaction send flow
          $scope.cancelSend = function () {
            $scope.$emit('WalletSendManagerDirective.SendTxCancel');
          };
          // Called to reset the send flow's state and local tx object
          $scope.resetSendManager = function () {
            $scope.$broadcast('WalletSendManagerDirective.ResetState');
            // reset the local state
            setNewTxObject();
            $scope.setState('prepareTx');
          };
          // resets the local, working version of the tx object
          function setNewTxObject() {
            delete $scope.transaction;
            // properties we can expect on the transaction object
            $scope.transaction = {
              blockchainFee: 0.0001 * 100000000,
              bitgoFee: 0,
              amount: null,
              total: null,
              confirmationTime: '',
              otp: '',
              passcode: '',
              recipientLabel: '',
              recipientWallet: null,
              recipientAddress: null,
              recipientAddressType: 'bitcoin',
              message: null
            };
          }
          // Creates a new pending transaction to be confirmed and send to the BitGo server
          $scope.createPendingTransaction = function (sender, recipient, fee) {
            $scope.pendingTransaction = new TransactionsAPI.TransactionBuilder(sender, recipient, fee);
          };
          function init() {
            $rootScope.setContext('walletSend');
            $scope.state = 'prepareTx';
            $scope.showFeeAlert = false;
            setNewTxObject();
          }
          init();
        }
      ]
    };
  }
]);/**
  Directive to manage the wallet send flows
  - Parent Controller is from the walletSendManagerDirective
 */
angular.module('BitGo.Wallet.WalletSendStepsConfirmTxDirective', []).directive('walletSendStepsConfirmTx', [
  '$filter',
  '$modal',
  '$timeout',
  '$rootScope',
  'NotifyService',
  'TransactionsAPI',
  'UtilityService',
  'WalletsAPI',
  'BG_DEV',
  'AnalyticsProxy',
  function ($filter, $modal, $timeout, $rootScope, NotifyService, TransactionsAPI, UtilityService, WalletsAPI, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^walletSendManager',
      controller: [
        '$scope',
        function ($scope) {
          // Max wallet sync fetch retries allowed
          var MAX_WALLET_SYNC_FETCHES = 5;
          // count for wallet sync data fetches
          var syncCounter;
          // flag letting us know when the transaction has been sent
          $scope.transactionSent = null;
          // flag letting us know if the sent transaction needs admin approval
          $scope.transactionNeedsApproval = null;
          // the transaction data returned after successful tx submittal
          $scope.returnedTransaction = null;
          // state for the ui buttons to be diabled
          $scope.processing = null;
          // Resets all the local state on this scope
          function resetLocalState() {
            $scope.transactionSent = null;
            $scope.transactionNeedsApproval = null;
            clearReturnedTxData();
          }
          // Triggers otp modal to open if user needs to otp before sending a tx
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
                  locals: function () {
                    return {
                      type: params.type,
                      wallet: $rootScope.wallets.current,
                      userAction: BG_DEV.MODAL_USER_ACTIONS.sendFunds
                    };
                  }
                }
              });
            return modalInstance.result;
          }
          function handleTxSendError(error) {
            if (UtilityService.API.isOtpError(error) || UtilityService.API.isUnlockError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock }).then(function (result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  // set the otp code on the transaction object before resubmitting it
                  $scope.transaction.otp = result.data.otp;
                  $scope.transaction.passcode = result.data.password;
                  // resubmit the tx on window close
                  $scope.sendTx();
                }
              }).catch(function (error) {
                $scope.processing = false;
              });
            } else if (UtilityService.API.isPasscodeError(error)) {
              openModal({ type: BG_DEV.MODAL_TYPES.passwordThenUnlock }).then(function (result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.password) {
                    throw new Error('Missing login password');
                  }
                  $scope.transaction.passcode = result.data.password;
                  // resubmit the tx on window close
                  $scope.sendTx();
                }
              }).catch(function (error) {
                $scope.processing = false;
              });
            } else {
              $scope.processing = false;
              // Otherwise just display the error to the user
              if (error && error.error) {
                NotifyService.errorHandler(error);
                return;
              }
              NotifyService.error('Your transaction was unable to be processed. Please ensure it does not violate any policies, then refresh your page and try sending again.');
            }
          }
          /**
         * Fetch a wallet to sync it's balance/data with the latest data from the server
         * based on the user's recent action taken
         */
          function syncCurrentWallet() {
            if (syncCounter >= MAX_WALLET_SYNC_FETCHES) {
              return;
            }
            var params = { bitcoinAddress: $rootScope.wallets.current.data.id };
            WalletsAPI.getWallet(params, false).then(function (wallet) {
              // If the new balance hasn't been picked up yet on the backend, refetch
              // to sync up the client's data
              if (wallet.data.balance === $rootScope.wallets.current.data.balance) {
                syncCounter++;
                $timeout(function () {
                  syncCurrentWallet();
                }, 2000);
                return;
              }
              // Since we possibly have a new pending approval
              // Since we have a new global balance on this enterprise
              // Fetch the latest wallet data
              // (this will also update the $rootScope.currentWallet)
              WalletsAPI.getAllWallets();
              // reset the sync counter
              syncCounter = 0;
            });
          }
          // submits the tx to BitGo for signing and submittal to the P2P network
          $scope.sendTx = function () {
            $scope.processing = true;
            $scope.pendingTransaction.signAndSendTransaction($scope.transaction.passcode, $scope.transaction.otp).then(function (transaction) {
              // Mixpanel general data
              var metricsData = {
                  walletID: $rootScope.wallets.current.data.id,
                  enterpriseID: $rootScope.enterprises.current.id,
                  txTotal: $scope.transaction.total,
                  requiresApproval: false
                };
              // Set the confirmation time on the transaction's local object for the UI
              $scope.transaction.confirmationTime = moment().format('MMMM Do YYYY, h:mm:ss A');
              // Handle the success state in the UI
              $scope.transactionSent = true;
              $scope.processing = false;
              if (transaction.pendingApproval) {
                // Track successful send + needs approval
                metricsData.requiresApproval = true;
                AnalyticsProxy.track('SendTx', metricsData);
                // Set local data
                $scope.returnedTransaction.approvalMessage = transaction.pendingApproval.error;
                $scope.returnedTransaction.needsApproval = true;
                return WalletsAPI.getAllWallets();
              } else {
                // Track successful send
                AnalyticsProxy.track('SendTx', metricsData);
                $scope.transaction.transactionId = transaction.transactionId;
                // Sync up the new balances data across the app
                return syncCurrentWallet();
              }
            }).catch(function (error) {
              handleTxSendError(error);
            });
          };
          // Cleans out the scope's transaction object and takes the user back to the first step
          $scope.sendMoreFunds = function () {
            resetLocalState();
            $scope.resetSendManager();
          };
          function clearReturnedTxData() {
            $scope.returnedTransaction = {
              approvalMessage: '',
              needsApproval: false
            };
          }
          function init() {
            if (!$scope.transaction) {
              throw new Error('Expect a transaction object when initializing');
            }
            syncCounter = 0;
            $scope.processing = false;
            clearReturnedTxData();
          }
          init();
        }
      ]
    };
  }
]);/**
  Directive to manage the wallet send flows
  - Parent Controller is from the walletSendManagerDirective
 */
angular.module('BitGo.Wallet.WalletSendStepsPrepareTxDirective', []).directive('walletSendStepsPrepareTx', [
  '$rootScope',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'BG_DEV',
  'LabelsAPI',
  function ($rootScope, NotifyService, CacheService, UtilityService, BG_DEV, LabelsAPI) {
    return {
      restrict: 'A',
      require: '^walletSendManager',
      controller: [
        '$scope',
        function ($scope) {
          // form error constants
          var ERRORS = {
              invalidRecipient: {
                type: 'invalidRecipient',
                msg: 'Please enter a valid recipient.'
              },
              sendToSelf: {
                type: 'sendToSelf',
                msg: 'You cannot send to yourself.'
              },
              invalidAmount: {
                type: 'invalidAmount',
                msg: 'Please enter a valid amount.'
              },
              insufficientFunds: {
                type: 'insufficientFunds',
                msg: 'You do not have sufficient funds to complete this transaction.'
              },
              amountTooSmall: {
                type: 'amountTooSmall',
                msg: 'This transaction amount is too small to send.'
              }
            };
          // shows the labeling field for the recipient address if it was manually
          // entered by the user
          $scope.showRecipientLabelField = function () {
            return $scope.transaction.recipientAddress && !$scope.transaction.recipientWallet;
          };
          // flag to let user know if they're violating the wallet spending limit
          $scope.violatesSpendingLimit = function () {
            var violatesTxLimit;
            var violatesDailyLimit;
            var amount = $scope.transaction.amount;
            try {
              violatesTxLimit = $rootScope.wallets.current.checkPolicyViolation(BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.tx'], amount);
              violatesDailyLimit = $rootScope.wallets.current.checkPolicyViolation(BG_DEV.WALLET.BITGO_POLICY_IDS['com.bitgo.limit.day'], amount);
              return violatesTxLimit || violatesDailyLimit;
            } catch (error) {
              console.log('Missing $rootScope.wallets.current: ', error);
              return false;
            }
          };
          // If the user enters a new label, we add the new label to their
          // labels so they can find it by label next time they send
          function saveLabel() {
            if ($scope.transaction.recipientLabel) {
              var fromWallet = $rootScope.wallets.current;
              var validBtcAddress = Bitcoin.Address.validate($scope.transaction.recipientAddress);
              if (validBtcAddress) {
                var params = {
                    walletId: fromWallet.data.id,
                    label: $scope.transaction.recipientLabel,
                    address: $scope.transaction.recipientAddress
                  };
                LabelsAPI.add(params).then(function (data) {
                }, function (error) {
                  console.log('Error when saving label for an address: ', error);
                });
              }
            }
          }
          /**
        * Return the total satoshi amount for the transaction
        * @private
        * @returns {Int} Tx total BTC amount
        */
          function txTotalSatoshis() {
            return parseFloat($scope.transaction.blockchainFee) + parseFloat($scope.transaction.bitgoFee) + parseFloat($scope.transaction.amount);
          }
          // Validate the transaciton input form
          function txIsValid() {
            var balance;
            var currentWallet;
            var currentWalletAddress;
            var fundsRemaining;
            var satoshisNeeded;
            var validRecipientAddress;
            try {
              // Wallet checking
              validRecipientAddress = Bitcoin.Address.validate($scope.transaction.recipientAddress);
              currentWallet = $rootScope.wallets.current;
              currentWalletAddress = currentWallet.data.id;
              // Funds checking
              balance = currentWallet.data.balance;
              satoshisNeeded = txTotalSatoshis();
              fundsRemaining = balance - satoshisNeeded;
            } catch (error) {
              // TODO (Gavin): show user an error here? What can they do?
              console.error('There was an issue preparing the transaction: ', error.message);
            }
            // set/update the transaction's total
            $scope.transaction.total = satoshisNeeded;
            // ensure a valid recipient address
            if (!validRecipientAddress) {
              $scope.setFormError(ERRORS.invalidRecipient.msg);
              return false;
            }
            // ensure they're not sending coins to this wallet's address
            if ($scope.transaction.recipientAddress === currentWalletAddress) {
              $scope.setFormError(ERRORS.sendToSelf.msg);
              return false;
            }
            // ensure a valid amount
            if (!parseFloat($scope.transaction.amount)) {
              $scope.setFormError(ERRORS.invalidAmount.msg);
              return false;
            }
            // ensure sufficient funds
            if (fundsRemaining + $scope.transaction.blockchainFee < 0) {
              $scope.setFormError(ERRORS.insufficientFunds.msg);
              return false;
            }
            // If they do have enough, but they're sending the total amount in their account,
            // automatically decrease the amount being sent by the blockchain 'required' fee,
            // then inform them that we deducted this amount and provide a reason why.
            if (fundsRemaining < 0) {
              // update the transaction amount being sent to the recipient
              $scope.transaction.amount = $scope.transaction.amount + fundsRemaining;
              // update the transaction total to account for the overdraft
              $scope.transaction.total = satoshisNeeded + fundsRemaining;
              $scope.showFeeAlert = true;
            }
            // ensure amount is greater than the minimum dust value
            if ($scope.transaction.amount <= BG_DEV.TX.MINIMUM_BTC_DUST) {
              $scope.setFormError(ERRORS.amountTooSmall.msg);
              return false;
            }
            return true;
          }
          function prepareTx() {
            // Set up objects for the TransactionAPI
            var sender = {
                wallet: $rootScope.wallets.current,
                otp: $scope.transaction.otp || '',
                passcode: $scope.transaction.passcode || '',
                message: $scope.transaction.message
              };
            var recipient = {
                type: $scope.transaction.recipientAddressType,
                address: $scope.transaction.recipientAddress,
                satoshis: parseFloat($scope.transaction.amount),
                message: $scope.transaction.message,
                suppressEmail: false
              };
            var fee = $scope.transaction.blockchainFee;
            // Create the scope's pending transaction
            $scope.createPendingTransaction(sender, recipient, fee);
            saveLabel();
          }
          // advances the transaction state if the for and inputs are valid
          $scope.advanceTransaction = function () {
            $scope.clearFormError();
            if (txIsValid()) {
              $scope.setState('confirmAndSendTx');
              return prepareTx();
            }
            return false;
          };
          function init() {
            if (!$scope.transaction) {
              throw new Error('Expect a transaction object when initializing');
            }
          }
          init();
        }
      ]
    };
  }
]);/**
  Directive to help with the wallet-select typeahead input
  - Parent controller comes from the walletSendStepsPrepareTx directive
 */
angular.module('BitGo.Wallet.WalletSendStepsTypeahead', []).directive('walletSendStepsTypeahead', [
  '$q',
  '$rootScope',
  'LabelsAPI',
  'WalletsAPI',
  function ($q, $rootScope, LabelsAPI, WalletsAPI) {
    return {
      restrict: 'A',
      require: '^walletSendStepsPrepareTx',
      controller: [
        '$scope',
        function ($scope) {
          // Timer to handle multiple events fired from the typeahead
          var timeout;
          // the view model for the dropdown wallet typeahead
          $scope.recipientViewValue = null;
          // the list of wallets expected in the typeahead's dropdown
          $scope.dropdownWallets = null;
          // was the address in the input selected from the dropdown list
          $scope.selectedFromDropdown = null;
          // flag to show an error if the user inputs an invalid bitcoin address
          $scope.recipientInvalid = null;
          // flag which tracks whether the dropdown is open or not
          $scope.isClosed = true;
          // flag which tracks whether the input element has focus
          $scope.isFocussed = null;
          /**
        * See if a bitcoin address has a label already associated with it
        * and manually set that value as the label on the transaction
        * @param bitcoinAddress {String}
        * @private
        */
          function setLabelFromManuallyEnteredAddress(bitcoinAddress) {
            var labelObj = _.filter($scope.dropdownWallets, function (wallet) {
                return wallet.data.id === bitcoinAddress;
              })[0];
            if (labelObj) {
              $scope.transaction.recipientLabel = labelObj.data.label;
            }
          }
          // Clears the recipient wallet
          $scope.clearRecipient = function () {
            $scope.selectedFromDropdown = null;
            // update the input viewValue
            $scope.recipientViewValue = null;
            // update the $scope's transaction object
            $scope.transaction.recipientWallet = null;
            $scope.transaction.recipientAddress = null;
          };
          // (Triggered when a user selects a wallet from the recipeint typeahead)
          // Sets the view value in the typeahead and sets the recipient wallet
          // on the scope's transaction object
          $scope.setRecipientFromTypeahead = function (selectedWallet) {
            // First, clean out the old recipient
            $scope.clearRecipient();
            // it was selected from the list
            $scope.selectedFromDropdown = true;
            // update the input viewValue
            $scope.recipientViewValue = selectedWallet.data.label;
            // update the $scope's transaction object
            $scope.transaction.recipientWallet = selectedWallet;
            $scope.transaction.recipientAddress = selectedWallet.data.id;
          };
          /**
        * Validate (and set if needed) the recipient address on the scope's transaction object
        * @param evt {Obj} event (optional)
        * @public
        */
          $scope.validateRecipient = function (evt) {
            // We wrap this in a 100ms timeout because the blur handler triggers
            // right before with the click event when selecting from the typeahead
            // and we only want to fire this once
            timeout = setTimeout(function () {
              if (timeout) {
                clearTimeout(timeout);
              }
              var address;
              var manuallyEntered = evt && !$scope.selectedFromDropdown;
              // If the user entered the address, then the recipient address
              // is the view value of the input
              if (manuallyEntered) {
                address = $scope.recipientViewValue;
              }
              // If the user selected an address from the list, the recipient wallet will
              // have been set; we can get recipientAddress from the transaction object
              if ($scope.transaction.recipientWallet) {
                address = $scope.transaction.recipientAddress;
              }
              // If the recipient is valid, set the address on the transaction object
              $scope.recipientInvalid = !Bitcoin.Address.validate(address);
              if (!$scope.recipientInvalid) {
                // if the user pasted in a valid address that has an existing label
                // set it in the label field manually so they know it's already labeled
                if (manuallyEntered) {
                  setLabelFromManuallyEnteredAddress(address);
                }
                $scope.transaction.recipientAddress = address;
              }
              $scope.$apply();
            }, 100);
          };
          // Event handlers
          // Watch for the recipientViewValue model to be wiped, then clean up the
          // scope's data model too
          var killViewValueWatcher = $scope.$watch('recipientViewValue', function (value) {
              if (!value) {
                $scope.clearRecipient();
              }
            });
          // When the state clears, clear out the view values
          var killResetStateListener = $scope.$on('WalletSendManagerDirective.ResetState', function () {
              $scope.clearRecipient();
            });
          // Listen for a recipient address object to be manually selected from the dropdown typeahead
          var killMatchSelectedListener = $scope.$on('bgTypeaheadTrigger.MatchSelected', function (evt, data) {
              if (!data.match) {
                throw new error('Expected match');
              }
              // First set the recipient wallet / recipeint address
              $scope.setRecipientFromTypeahead(data.match);
              // Then validate the selection
              $scope.validateRecipient();
            });
          // Listen for opening and closing of list of addresses in type ahead
          var killIsClosedListener = $scope.$on('typeaheadPopup.isClosed', function (evt, data) {
              $scope.isClosed = data;
              // If dropdown is closed and the input is not in focus, check recipient
              if (data && !$scope.isFocussed) {
                $scope.validateRecipient(evt);
              }
            });
          // Clean up the listeners when $scope is destroyed
          $scope.$on('$destroy', function () {
            killViewValueWatcher();
            killResetStateListener();
            killMatchSelectedListener();
            killIsClosedListener();
          });
          // For the typeahead, we convert rootScope's wallets.all into an array
          // We also fetch labels from the labels api and merge them into this list
          function initDropdownWallets() {
            // init the dropdown wallets array for the typeahead
            $scope.dropdownWallets = [];
            function initLabelsFromLabelsAPI() {
              return LabelsAPI.list().then(function (labels) {
                try {
                  // labels is an object with keys representing the recipient address
                  _.forIn(labels, function (labelsArray, address) {
                    // Each key contains an array of label objects that have
                    // a label and a wallet (to which that particular label is scoped)
                    _.forEach(labelsArray, function (labelObj, idx) {
                      // Only add the label to the list if it is valid to this wallet. Don't add the current wallet to the list
                      if (labelObj.walletId === $rootScope.wallets.current.data.id && address !== $rootScope.wallets.current.data.id) {
                        // Note: these objects mimic the structure on BitGo wallets
                        var dropdownItem = {
                            data: {
                              id: address,
                              label: labelObj.label
                            }
                          };
                        $scope.dropdownWallets.push(dropdownItem);
                      }
                    });
                  });
                } catch (error) {
                  console.log('Error setting up labels from the LabelsAPI');
                }
                return true;
              });
            }
            function initLabelsFromUserWallets() {
              _.forIn($rootScope.wallets.all, function (wallet) {
                // add all wallets except for the current one
                if (wallet.data.id !== $rootScope.wallets.current.data.id) {
                  $scope.dropdownWallets.push(wallet);
                }
              });
              return $q.when(true);
            }
            /**
          * Dedupe the list of dropdown wallets based on uniqueness of addresses
          * @private
          */
            function deDupe() {
              $scope.dropdownWallets = _.uniq($scope.dropdownWallets, function (wallet) {
                return wallet.data.id;
              });
              return $q.when(true);
            }
            // Load the labels
            initLabelsFromLabelsAPI().then(initLabelsFromUserWallets).then(deDupe).catch(function (error) {
              console.log('Error loading labels from the labels API: ', error);
            });
          }
          function init() {
            // Ensure $scope.transaction has been set already in the walletSend controller
            // We need it to set properties on based on the user choice from the typeahead dropdown
            if (!$scope.transaction) {
              throw new Error('Expect $scope.transaction to be set in order to instantiate the wallet typeahead helper');
            }
            $scope.recipientInvalid = false;
            initDropdownWallets();
          }
          init();
        }
      ],
      link: function (scope, elem, attrs) {
        // When the user enters the field, remove any error state from the field
        angular.element('input[name=\'recipientViewValue\']').on('focus', function (evt) {
          scope.isFocussed = true;
          scope.recipientInvalid = false;
          scope.$apply();
        });
        // When the user leaves the field, make sure the recipient address is valid
        angular.element('input[name=\'recipientViewValue\']').on('blur', function (evt) {
          // skip validation if no value in the field or if the dropdown is open
          scope.isFocussed = false;
          if (evt.currentTarget.value === '' || !scope.isClosed) {
            return;
          }
          scope.validateRecipient(evt);
          scope.$apply();
        });
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletSettingsGeneralForm
 * @description
 * Directive to manage the wallet settings. (delete and rename)
 * @example
 *   <div wallet-settings-general-form></div>
 */
angular.module('BitGo.Wallet.WalletSettingsGeneralFormDirective', []).directive('walletSettingsGeneralForm', [
  '$location',
  '$rootScope',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'WalletsAPI',
  'BG_DEV',
  'EnterpriseAPI',
  function ($location, $rootScope, UserAPI, Util, Notify, WalletsAPI, BG_DEV, EnterpriseAPI) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // the name of the current wallet
          $scope.walletName = null;
          $scope.confirmationMessage = false;
          function formIsValid() {
            if (!$scope.walletName) {
              $scope.setFormError('Please enter new wallet name.');
              return false;
            }
            if ($scope.walletName === $rootScope.wallets.current.data.label) {
              $scope.setFormError('Please change the wallet name before saving');
              return false;
            }
            return true;
          }
          /**
        * Called when the user confirms delete
        * @private
        */
          $scope.confirmDelete = function () {
            if ($rootScope.wallets.current.data.balance > 0) {
              if ($rootScope.wallets.current.role == BG_DEV.WALLET.ROLES.ADMIN && $rootScope.wallets.current.data.adminCount < 2) {
                Notify.error('Please transfer bitcoins before deleting');
                return false;
              }
            }
            WalletsAPI.removeWallet($rootScope.wallets.current).then(function () {
              Notify.success('Wallet was removed from dashboard');
              // if the user deletes the last wallet in an enterprise where he is not an admin, redirect him to the personal wallets page
              if (_.isEmpty($rootScope.wallets.all) && !isEnterpriseAdmin()) {
                EnterpriseAPI.setCurrentEnterprise($rootScope.enterprises.all.personal);
                $location.path('/enterprise/personal/wallets');
              } else {
                $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
              }
            }).catch(Notify.errorHandler);
          };
          $scope.showRenameButton = function () {
            return $scope.walletName !== $rootScope.wallets.current.data.label;
          };
          function onRenameSuccess(data) {
            WalletsAPI.getAllWallets();
          }
          $scope.saveLabelChange = function () {
            // clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var params = {
                  walletAddress: $rootScope.wallets.current.data.id,
                  label: $scope.walletName
                };
              WalletsAPI.renameWallet(params).then(onRenameSuccess).catch(Notify.errorHandler);
            }
          };
          function isEnterpriseAdmin() {
            var isAdmin = false;
            if ($rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal) {
              return true;
            }
            if ($rootScope.currentUser.settings.enterprises) {
              $rootScope.currentUser.settings.enterprises.forEach(function (enterprise) {
                if ($rootScope.enterprises.current && enterprise.id === $rootScope.enterprises.current.id) {
                  isAdmin = true;
                  return false;
                }
              });
            }
            return isAdmin;
          }
          function init() {
            $scope.walletName = $rootScope.wallets.current.data.label;
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletSettingsManager
 * @description
 * Manages the all of the wallet settings management state and its sub-directives
 * Depends on: bg-state-manager
 * @example
 *   <div wallet-settings-manager></div>
 */
angular.module('BitGo.Wallet.WalletSettingsManagerDirective', []).directive('walletSettingsManager', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // All valid view stats for the settings section
          $scope.viewStates = [
            'general',
            'passcode'
          ];
          /**
         * Let all children views know when the section changes
         * @public
         */
          var killStateWatcher = $scope.$watch('state', function (state) {
              if (state) {
                $scope.$broadcast('walletSettingsManager.SettingsSectionChanged', { section: state });
              }
            });
          /**
         * Clean up the listeners on garbage collection
         * @public
         */
          $scope.$on('$destroy', function () {
            killStateWatcher();
          });
          function init() {
            $rootScope.setContext('walletSettings');
            $scope.state = 'general';
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletSettingsPasscodeForm
 * @description
 * Directive to manage the wallet passcode
 * @example
 *   <div wallet-settings-passcode-form></div>
 */
angular.module('BitGo.Wallet.WalletSettingsPasscodeFormDirective', []).directive('walletSettingsPasscodeForm', [
  '$q',
  '$rootScope',
  '$modal',
  'UtilityService',
  'WalletsAPI',
  'KeychainsAPI',
  'NotifyService',
  'BG_DEV',
  function ($q, $rootScope, $modal, UtilityService, WalletsAPI, KeychainsAPI, NotifyService, BG_DEV) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // object containing the strength of the user's new passcode
          $scope.passcodeStrength = null;
          // existing wallet passcode
          $scope.oldPasscode = null;
          // new wallet passcode
          $scope.newPasscode = null;
          // new wallet passcode confirmation
          $scope.newPasscodeConfirm = null;
          /**
         * Validate the pw form before updating
         * @private
         */
          function formIsValid() {
            if (!$scope.passcodeStrength) {
              $scope.setFormError('There was an error testing your password strength. Please reload this page and try again.');
              return false;
            }
            if (!$scope.oldPasscode) {
              $scope.setFormError('Please enter a current wallet password.');
              return false;
            }
            if (!$scope.newPasscode) {
              $scope.setFormError('Please enter new password.');
              return false;
            }
            if (!$scope.newPasscodeConfirm) {
              $scope.setFormError('Please confirm new password.');
              return false;
            }
            if ($scope.newPasscode !== $scope.newPasscodeConfirm) {
              $scope.setFormError('Please enter matching passwords.');
              return false;
            }
            if ($scope.passcodeStrength.progress.value < BG_DEV.PASSWORD.MIN_STRENGTH) {
              $scope.setFormError('Please enter a stronger password.');
              return false;
            }
            return true;
          }
          /**
         * Open the modal for OTP
         * @param params {Object} params for modal
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
                  locals: function () {
                    return {
                      type: params.type,
                      userAction: BG_DEV.MODAL_USER_ACTIONS.otp
                    };
                  }
                }
              });
            return modalInstance.result;
          }
          /**
         * Handle errors returned from the server in the process
         * @param error {Object} Client-formatted error object
         * @private
         */
          function handleError(error) {
            if (UtilityService.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({ type: BG_DEV.MODAL_TYPES.otp }).then(function (result) {
                if (result.type === 'otpsuccess') {
                  // attempt to update the password automatically when done
                  $scope.updatePassword();
                }
              });
            } else if (UtilityService.API.isPasscodeError(error)) {
              $scope.setFormError('Invalid current wallet password.');
            } else {
              // Otherwise just display the error to the user
              NotifyService.error(error.error);
            }
          }
          /**
         * Attempt to decrypt an encrypted xPrv with a password
         * @param encryptedXprv {String} wallet's user encryptedXprv
         * @param passcode {String} existing (old) wallet passcode
         * @returns {String} user's decrypted private key || undefined
         * @private
         */
          function decryptKeychain(encryptedXprv, passcode) {
            try {
              var privKey = UtilityService.Crypto.sjclDecrypt(passcode, encryptedXprv);
              return privKey;
            } catch (e) {
              return;
            }
          }
          /**
         * Submit the updated password for the wallet's xprv
         * @public
         */
          $scope.updatePassword = function () {
            $scope.clearFormError();
            if (formIsValid()) {
              var privateInfo = $rootScope.wallets.current.data.private;
              var userXpub = privateInfo.keychains[0].xpub;
              var userPath = privateInfo.keychains[0].path;
              KeychainsAPI.get(userXpub).then(function (keychain) {
                // attempt to decrypt the xprv with the password provided
                var xprv = decryptKeychain(keychain.encryptedXprv, $scope.oldPasscode);
                if (!xprv) {
                  var error = {
                      status: 401,
                      message: 'Invalid current wallet password',
                      data: { needsPasscode: true }
                    };
                  return $q.reject(new UtilityService.ErrorHelper(error));
                }
                // Get the xpub for the xprv provided. It might not match with xpub on the wallet for legacy wallets
                var newBip32;
                try {
                  newBip32 = new Bitcoin.BIP32(xprv);
                } catch (e) {
                  console.log(e.stack);
                  var error = { error: 'There was an error with updating this password. Please refresh your page and try this again.' };
                  return $q.reject(error);
                }
                // encrypt the xprv with the user's new passcode
                var newKeychainData = {
                    encryptedXprv: UtilityService.Crypto.sjclEncrypt($scope.newPasscode, xprv),
                    xpub: newBip32.extended_public_key_string()
                  };
                return KeychainsAPI.update(newKeychainData);
              }).then(function (newKeychain) {
                // reset all fields when the keychain is updated
                initNewPasscodeFields();
                // then ensure we reset the updated wallet (with the new private data) in the app
                return WalletsAPI.getWallet({ bitcoinAddress: $rootScope.wallets.current.data.id });
              }).then(function (updatedWallet) {
                // Update (replace) the current wallet in the app
                WalletsAPI.setCurrentWallet(updatedWallet, true);
              }).catch(handleError);
            }
          };
          /**
         * Initialize new passcode values and fields
         * @private
         */
          function initNewPasscodeFields() {
            $scope.oldPasscode = '';
            $scope.newPasscode = '';
            $scope.newPasscodeConfirm = '';
          }
          function init() {
            initNewPasscodeFields();
          }
          init();
        }
      ],
      link: function (scope, ele, attrs) {
        /**
         * UI show the password update button
         * @returns {Bool}
         * @public
         */
        scope.showUpdateButton = function () {
          if (scope.oldPasscode && scope.newPasscode && scope.newPasscode == scope.newPasscodeConfirm) {
            return true;
          }
          return false;
        };
        /**
         * Set the local passcode strength object
         * @param passcodeStrength {Object}
         * @public
         */
        scope.checkStrength = function (passcodeStrength) {
          scope.passcodeStrength = passcodeStrength;
        };
        /**
         * UI show the strength meter
         * @public
         */
        scope.showPasscodeStrength = function () {
          return scope.newPasscode && scope.newPasscode.length && scope.passcodeStrength;
        };
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletTransactionTile
 * @description
 * Directive to display a single history item from a transactions's history list
 * Also handles the state management for the tile
 * @example
 *   <tr wallet-transaction-history-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Wallet.WalletTransactionHistoryTileDirective', []).directive('walletTransactionHistoryTile', [function () {
    var templateSources = {
        created: '/wallet/templates/historytiles/generic.html',
        approved: '/wallet/templates/historytiles/generic.html',
        signed: '/wallet/templates/historytiles/signed.html',
        unconfirmed: '/wallet/templates/historytiles/unconfirmed.html',
        confirmed: '/wallet/templates/historytiles/confirmed.html'
      };
    return {
      restrict: 'E',
      replace: true,
      template: '<ng-include src="setTemplateSource()"></ng-include>',
      scope: { item: '=item' },
      link: function (scope, element, attrs) {
        // We compile the template dynamically, only once we have a history item to show
        attrs.$observe('item', function (item) {
          if (!item) {
            return;
          }
          scope.action = scope.item.action;
          scope.setTemplateSource = function () {
            if (!templateSources[scope.action]) {
              throw new Error('Invalid history item type');
            }
            return templateSources[scope.action];
          };
          scope.setTemplateSource();
        });
      }
    };
  }]);/**
 * @ngdoc directive
 * @name walletTransactionTile
 * @description
 * Manages the logic for ingesting a transaction item and compiling the right template
 * Also handles the state management for the tile
 * @example
 *   <tr wallet-transaction-wallettx-tile ng-repeat="item in items"></tr>
 */
angular.module('BitGo.Wallet.WalletTransactionWallettxTileDirective', []).directive('walletTransactionWallettxTile', [
  '$rootScope',
  '$timeout',
  '$compile',
  '$http',
  '$templateCache',
  'TransactionsAPI',
  'NotifyService',
  function ($rootScope, $timeout, $compile, $http, $templateCache, TransactionsAPI, NotifyService) {
    return {
      restrict: 'A',
      replace: true,
      controller: [
        '$scope',
        function ($scope) {
          // object that will hold any temporary info before submittal
          $scope.temp = null;
          // bool for if the comment tile is in the process of updating
          $scope.processing = null;
          // $scope helper functions used throughout
          $scope.txIsUnconfirmed = function () {
            return $scope.tx.state === 'unconfirmed';
          };
          $scope.txIsWithdrawal = function () {
            return $scope.tx.amount < 0;
          };
          $scope.txIsTransfer = function () {
            return !!$scope.tx.otherWalletId;
          };
          $scope.txIsTransferWithinSameWallet = function () {
            return $scope.tx.otherWalletId && $scope.tx.otherWalletId === $scope.tx.walletId;
          };
          $scope.txIsOpen = function () {
            return $scope.tx.id === $scope.currentTxOpenId;
          };
          /**
         * Shows or hides the templates buttons based on if the user has modified the comment
         */
          $scope.canShowButtons = function () {
            return $scope.temp.comment !== $scope.tx.comment;
          };
          /**
         * sets the icon class based on the tx send/receive transfer/non-transfer state
         */
          $scope.txBuildListIcon = function () {
            var iconClass = '';
            var txReceived = $scope.tx.amount > 0;
            if ($scope.txIsTransfer($scope.tx)) {
              iconClass = txReceived ? 'icon-arrows-h u-colorGreen' : 'icon-arrows-h u-colorRed';
            } else {
              iconClass = txReceived ? 'icon icon--arrowRight u-colorGreen' : 'icon icon--arrowLeft u-colorRed';
            }
            return iconClass;
          };
          function resetTileState() {
            $scope.temp = { comment: $scope.tx.comment || '' };
            $scope.processing = false;
          }
          /**
         * Listens for the tile to be opened in order to fetch the history details
         */
          var killFetchHistoryListener = $scope.$on('walletTransactionsManager.TxTileOpened', function (event, tx) {
              if (!tx) {
                throw new Error('missing tx');
              }
              if (tx.id === $scope.tx.id) {
                TransactionsAPI.getTxHistory(tx.id).then(function (result) {
                  $scope.tx.history = result.transaction.history;
                }).catch(NotifyService.errorHandler);
              }
            });
          /**
         * Listens for the tile to be closed and resets the state
         */
          var killCloseListener = $scope.$on('walletTransactionsManager.TxTileClosed', function (event, tx) {
              if (!tx) {
                throw new Error('missing tx');
              }
              if (tx.id === $scope.tx.id) {
                resetTileState();
              }
            });
          /**
         * Clean up when the scope is destroyed
         */
          $scope.$on('$destroy', function () {
            killFetchHistoryListener();
            killCloseListener();
          });
          function init() {
            resetTileState();
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        // /**
        //  * Function to handle the showing of the address popover for this tx item
        //  * TODO (Gavin): This is a tricky popover to create - will take some devoted time
        //  * to get this thing working right
        //  * notes: http://plnkr.co/edit/QhshtRqwpdsirvdFj9JG?p=preview
        //  * notes: http://plnkr.co/edit/STaPZI2f9eTaRhnsr6Qm?p=preview
        //  */
        // trigger in html: ng-click="triggerAddressPopoverToggle($event, tx)"
        // scope.triggerAddressPopoverToggle = function(event, tx) {
        //   if (!event) {
        //     throw new Error('Expected an event passed');
        //   }
        //   event.stopPropagation();
        //   // To avoid the $digest error, we explicitly fire this in the
        //   // next digest loop
        //   $timeout(function() {
        //     angular.element('#addressModal-' + tx.id).trigger('showAddressPopover');
        //   }, 0);
        // };
        /**
         * The entire <tr> is a click target, so this contains the event to
         * whatever element the method was triggered on.
         */
        scope.killPropagation = function (event) {
          if (!event) {
            throw new Error('Expected an event passed');
          }
          event.stopPropagation();
        };
        /**
         * Updates the comment for this transaction
         */
        scope.saveComment = function (event) {
          if (!event) {
            throw new Error('Expected an event passed');
          }
          event.stopPropagation();
          // lock the UI
          scope.processing = true;
          TransactionsAPI.updateComment($rootScope.wallets.current.data.id, scope.tx.id, scope.temp.comment).then(function (result) {
            var updatedTx = result.transaction;
            scope.tx.comment = updatedTx.comment;
            scope.temp.comment = updatedTx.comment;
            // then close the field too
            scope.closeCurrentTx(event, scope.tx);
          }).catch(function (error) {
            NotifyService.error('There was an issue saving this memo. Please refresh the page and try the action again.');
          }).finally(function () {
            // always reset the processing state
            scope.processing = false;
          });
        };
        function initTemplate() {
          $http.get('wallet/templates/wallet-transaction-partial-listtile.html', { cache: $templateCache }).success(function (html) {
            element.html(html);
            $compile(element.contents())(scope);
          });
        }
        initTemplate();
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name walletTransactionsManager
 * @description
 * Directive to manage the wallet transactions list page
 * @example
 *   <div wallet-transactions-manager></div>
 */
angular.module('BitGo.Wallet.WalletTransactionsManagerDirective', []).directive('walletTransactionsManager', [
  '$q',
  '$timeout',
  '$rootScope',
  '$location',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'TransactionsAPI',
  'InfiniteScrollService',
  'WalletsAPI',
  function ($q, $timeout, $rootScope, $location, NotifyService, CacheService, UtilityService, TransactionsAPI, InfiniteScrollService, WalletsAPI) {
    return {
      restrict: 'A',
      require: '^WalletController',
      controller: [
        '$scope',
        function ($scope) {
          // Max wallet sync fetch retries allowed
          var MAX_WALLET_SYNC_FETCHES = 5;
          // format for dates in tiles
          var DATE_FORMAT = 'MMM Do YYYY, h:mm A';
          // The tx list used to populate the view
          $scope.transactions = null;
          // ID of the current tx in the list that is being edited
          $scope.currentTxOpenId = null;
          $scope.noTransactionPresent = false;
          // the total of items we can possibly fetch
          var total;
          // the start index for the initial data fetch
          var startIdx;
          // limits the data fetch number of results
          var limit;
          // count for wallet sync data fetches
          var syncCounter;
          // lock for if a fetch is currently out
          var requestInFlight;
          /**
         * Fetch a wallet to sync it's data up with the client's changes
         * @private
         */
          function syncCurrentWallet() {
            if (syncCounter >= MAX_WALLET_SYNC_FETCHES) {
              console.error('Expect BitGo balance for current wallet to be different than existing balance in local memory');
            }
            var params = { bitcoinAddress: $rootScope.wallets.current.data.id };
            WalletsAPI.getWallet(params, false).then(function (wallet) {
              // If the new balance hasn't been picked up yet on the backend, refetch
              // to sync up the client's data
              if (wallet.data.balance === $rootScope.wallets.current.data.balance) {
                syncCounter++;
                $timeout(function () {
                  syncCurrentWallet();
                }, 1000);
                return;
              }
              WalletsAPI.setCurrentWallet(wallet, true);
              initNewTxList();
              syncCounter = 0;
            });
          }
          /**
         * Logic to show/hide the list of approvals for any outstanding transactions
         * @public
         */
          $scope.showTxApprovals = function () {
            var currentWallet = $rootScope.wallets.current;
            if (!currentWallet || !currentWallet.data.pendingApprovals.length) {
              return false;
            }
            return _.filter(currentWallet.data.pendingApprovals, function (approvalItem) {
              return approvalItem.info.type === 'transactionRequest';
            }).length > 0;
          };
          /**
         * Closes the currently open tx that is being edited
         * @param event {Object} click event
         * @param tx {Object} wallet tx object
         * @public
         */
          $scope.closeCurrentTx = function (event, tx) {
            event.stopPropagation();
            $scope.$broadcast('walletTransactionsManager.TxTileClosed', tx);
            $scope.currentTxOpenId = null;
          };
          function isCurrentTx(tx) {
            return $scope.currentTxOpenId === tx.id;
          }
          /**
         * Opens a single tx to edit
         * @public
         */
          $scope.toggleTxView = function (event, tx) {
            if (!event) {
              throw new Error('Expected an event passed');
            }
            // if the user is clicking on the existing open tile, close it
            if (isCurrentTx(tx)) {
              $scope.closeCurrentTx(event, tx);
              return;
            }
            // if the user selects another tile, close the current one before
            // opening the next one
            if ($scope.currentTxOpenId) {
              $scope.closeCurrentTx(event, tx);
            }
            $scope.currentTxOpenId = tx.id;
            $scope.$broadcast('walletTransactionsManager.TxTileOpened', tx);
          };
          /**
         * Loads the tx list chunk by chunk for infinite scroll.
         * @returns {Promise}
         * @public
         */
          $scope.loadTxListOnPageScroll = function () {
            // If we fetch all the items, or have a request out, kill any further calls
            if (total && $scope.transactions.length >= total || requestInFlight) {
              return $q.reject();
            }
            var params = {
                skip: startIdx,
                limit: limit
              };
            // lock future calls while in flight
            requestInFlight = true;
            return TransactionsAPI.list($rootScope.wallets.current, params).then(function (data) {
              // Set the total so we know when to stop calling
              if (!total) {
                total = data.total;
              }
              startIdx += limit;
              var newSortedTxs;
              var newUnsortedTxs = $scope.transactions.concat(data.transactions);
              // Due to block timing oddities we need to manually take all
              // of the transactions available and filter out any unconfirmed,
              // and surface them at the top of the tx list
              /**
             * Sorts a list of unconfirmed txs
             * @param transactions {Array}
             * @returns {Array} sorted by createdDate
             * @private
             */
              function sortUnconfirmedTxs(transactions) {
                if (!transactions) {
                  throw new Error('missing transactions');
                }
                return _.sortBy(transactions, function (tx) {
                  return tx.createdDate;
                });
              }
              /**
             * Builds a list of sorted txs with unconfirmed at the top
             * @param unsortedTransactions {Array}
             * @returns {Array}
             * @private
             */
              function sortTransactionsForView(unsortedTransactions) {
                if (!unsortedTransactions) {
                  throw new Error('missing transactions');
                }
                var separatedTxs = _.partition(unsortedTransactions, function (tx) {
                    return tx.state === 'unconfirmed';
                  });
                var unconfirmed = separatedTxs[0];
                var confirmed = separatedTxs[1];
                var sortedUnconfirmed = sortUnconfirmedTxs(unconfirmed);
                return sortedUnconfirmed.concat(confirmed);
              }
              /*
             * Decorate each incoming tx with the running balance and pretty dates
             * @param transactions {Array}
             * @returns {Array}
             * @private
             */
              function decorateTransactionsForView(transactions) {
                if (!transactions) {
                  throw new Error('missing transactions');
                }
                var runningBalance = $rootScope.wallets.current.data.balance || 0;
                var prevTransactionAmount = 0;
                _.forEach(transactions, function (transaction) {
                  if (transaction.state === 'confirmed') {
                    transaction.prettyDate = new moment(transaction.confirmedDate).format(DATE_FORMAT);
                  } else {
                    transaction.prettyDate = new moment(transaction.createdDate).format(DATE_FORMAT);
                  }
                  // set the running balance for this tx
                  transaction.runningBalance = runningBalance - prevTransactionAmount;
                  // update the running balance for the next transaction
                  runningBalance -= prevTransactionAmount;
                  prevTransactionAmount = transaction.amount;
                });
                return transactions;
              }
              // Build the tx list for the view
              newSortedTxs = sortTransactionsForView(newUnsortedTxs);
              $scope.transactions = decorateTransactionsForView(newSortedTxs);
              // check transaction length on fetch
              if ($scope.transactions.length === 0) {
                $scope.noTransactionPresent = true;
              }
              requestInFlight = false;
              return true;
            }).catch(function (error) {
              requestInFlight = false;
              console.error('Error fetching transactions: ', error);
            });
          };
          /**
         * Listens for the current wallet to be set
         */
          var killCurrentWalletListener = $scope.$watch('wallets.current', function (wallet) {
              if (wallet && !$scope.transactions) {
                initNewTxList();
              }
            });
          /**
         * Listen for a transaction approval state to be updated and update the tx list
         */
          var killTxApprovalSetListener = $scope.$on('bgApprovalTileTxRequest.TxApprovalStateSet', function (evt, data) {
              //if the user approved the approval
              if (data && data.state === 'approved') {
                // Wait 2 seconds to allow the ui success message to get attention
                // then update the tx list for the user
                $timeout(function () {
                  syncCurrentWallet();
                }, 2000);
              }
            });
          /**
         * Clean up when the scope is destroyed
         */
          $scope.$on('$destroy', function () {
            // remove listeners
            killCurrentWalletListener();
            killTxApprovalSetListener();
            // reset the global inifinte scroll handler
            InfiniteScrollService.clearScrollHandler();
          });
          function initNewTxList() {
            startIdx = 0;
            delete $scope.transactions;
            $scope.transactions = [];
            $scope.loadTxListOnPageScroll();
          }
          function init() {
            $rootScope.setContext('walletTransactions');
            // initialize locals
            limit = 25;
            syncCounter = 0;
            requestInFlight = false;
            // Set the global inifinte scroll handler
            InfiniteScrollService.setScrollHandler($scope.loadTxListOnPageScroll);
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name walletUserList
 * @description
 * Manages the user list for a selected wallet. It helps handle accepting and approving shares as well
 * @example
 *   <div wallet-user-list></div>
 */
angular.module('BitGo.Wallet.WalletUserListDirective', []).directive('walletUserList', [
  '$rootScope',
  '$filter',
  'UserAPI',
  'NotifyService',
  'WalletSharesAPI',
  'WalletsAPI',
  function ($rootScope, $filter, UserAPI, Notify, WalletSharesAPI, WalletsAPI) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          function revokeAccessSuccess(wallet) {
            WalletsAPI.getAllWallets();
            if (wallet.adminCount > 1) {
              Notify.success('Your request to revoke access is pending approval.');
            } else {
              Notify.success('Wallet access was revoked.');
            }
          }
          $scope.revokeAccess = function (bitcoinAddress, userId) {
            WalletsAPI.revokeAccess(bitcoinAddress, userId).then(revokeAccessSuccess).catch(Notify.errorHandler);
          };
          $scope.hasApprovals = function () {
            var filter = $filter('bgApprovalsFilter');
            return filter($rootScope.wallets.current.data.pendingApprovals, false, 'userChangeRequest').length > 0;
          };
          $scope.canDelete = function (userId) {
            return userId && userId !== $rootScope.currentUser.settings.id;
          };
        }
      ],
      link: function (scope, element, attrs) {
        /**
         * Resend the invite email to join a share.
         *
         * @param walletShareId {String} the public id string of the wallet share
         */
        scope.resendEmail = function (walletShareId) {
          if (!walletShareId) {
            throw new Error('Expect walletShareId to be set');
          }
          WalletSharesAPI.resendEmail({ shareId: walletShareId }).then(function (result) {
            Notify.success('Wallet invite email was re-sent.');
          }).catch(Notify.errorHandler);
        };
        scope.rejectInvite = function (walletShareId) {
          if (!walletShareId) {
            throw new Error('Expect walletShareId to be set');
          }
          WalletSharesAPI.cancelShare({ shareId: walletShareId }).then(function (result) {
            $('#' + walletShareId).animate({
              height: 0,
              opacity: 0
            }, 500, function () {
              scope.$apply(function () {
                WalletSharesAPI.getAllSharedWallets();
                $('#' + walletShareId).remove();
              });
            });
          }).catch(Notify.errorHandler);
        };
      }
    };
  }
]);angular.module('BitGo.Wallet.WalletUsersManagerDirective', []).directive('walletUsersManager', [
  'UtilityService',
  'RequiredActionService',
  'BG_DEV',
  function (Util, RequiredActionService, BG_DEV) {
    return {
      restrict: 'A',
      require: '^WalletController',
      controller: [
        '$scope',
        '$rootScope',
        function ($scope, $rootScope) {
          // view states for the user settings area
          $scope.viewStates = [
            'showAllUsers',
            'addUser'
          ];
          // the current view state
          $scope.state = null;
          // template source for the current view
          $scope.userWalletTemplateSource = null;
          // returns the view current view template (based on the $scope's current state)
          function getTemplate() {
            if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
              throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
            }
            var tpl;
            switch ($scope.state) {
            case 'showAllUsers':
              tpl = 'wallet/templates/wallet-users-partial-listuser.html';
              break;
            case 'addUser':
              tpl = 'wallet/templates/wallet-users-partial-adduser.html';
              break;
            }
            return tpl;
          }
          // Event listeners
          var killStateWatch = $scope.$watch('state', function (state) {
              if (state) {
                // If the user has a weak login password and is trying to add a user
                // we force them to upgrade it before they can add anyone
                if (state === 'addUser' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
                  return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
                }
                // Otherwise set the template as needed
                $scope.userWalletTemplateSource = getTemplate();
              }
            });
          // Listener cleanup
          $scope.$on('$destroy', function () {
            killStateWatch();
          });
          // Watch for click on users tab in parent element
          $scope.$on('WalletController.showAllUsers', function () {
            $scope.state = 'showAllUsers';
          });
          function init() {
            $rootScope.setContext('walletUsers');
            $scope.state = 'showAllUsers';
          }
          init();
        }
      ]
    };
  }
]);