APP_ENV = {
  'version': '0.1.2',
  'revision': 'ffbd0f4',
  'date': 'Mon Jan 04 2016 16:11:09',
  'bitcoinNetwork': 'testnet'
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
    function getSDKEnv() {
      // Handle Chrome app
      if (location.protocol === 'chrome-extension:' && typeof APP_ENV !== 'undefined') {
        return APP_ENV.bitcoinNetwork === 'testnet' ? 'test' : 'prod';
      }
      // strip optional "." from the end of the hostname, if present (this almost
      // never occurs in practice, but technically a hostname can end in a
      // period).
      var hostname = location.hostname;
      if (hostname[hostname.length - 1] === '.') {
        hostname = hostname.substr(0, hostname.length - 1);
      }
      var envs = {
          'www.bitgo.com': 'prod',
          'staging.bitgo.com': 'staging',
          'webdev.bitgo.com': 'dev',
          'test.bitgo.com': 'test',
          'localhost': 'local'
        };
      return envs[hostname];
    }
    /**
      * Check the production state of the app
      *
      * @returns { Bool }
      * @private
      */
    function isProd() {
      var env = getSDKEnv();
      return env === 'prod' || env === 'staging';
    }
    config.env = {
      getSDKEnv: getSDKEnv,
      isProd: isProd
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
  /**
    * Dynamically call stripe javscript so that it only gets called after sanitizing referrer
    *
    * @private
    */
  function loadStripe() {
    if (location.protocol === 'chrome-extension:') {
      return;
    }
    var stripe = document.createElement('script');
    stripe.async = true;
    stripe.src = 'https://js.stripe.com/v2/';
    var scriptInst = document.getElementsByTagName('script')[0];
    scriptInst.parentNode.insertBefore(stripe, scriptInst);
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
    loadStripe();
  }
  init();
}(window));(function (global) {
  // Pre-initialization Checks
  //
  //
  // If, for some reason, AB is already on the window, skip all setup
  if (global.AB && global.AB.create && typeof global.AB.create === 'function') {
    return;
  }
  // Local Variables
  //
  //
  // Global AB test object
  var AB = {};
  // BitGo cookie for the user
  var bitgoCookie;
  // Storage object for all current AB tests
  var currentTests = {};
  // Holds all templates to be used in the AB tests
  var templates = {};
  // User's AB test id
  var userAbTestId;
  // AB Test Tool Class
  //
  //
  /**
   * Constructor for new AB test instances
   *
   * @param {String} name
   *
   * @returns {Object} AB test instance
   * @private
   */
  function ABFactory(name) {
    // TODO: this needs to be rewritten -- the salting was incorrect.
    // Salt to help randomize which group a user gets bucketed into
    // Which bucket the user will be dropped into
    this.userAbGroup = userAbTestId % 100;
    // Unique name for this AB test instance
    this.name = name;
    // Storage object for all tests associated with this instance
    this.tests = [];
    // The user's grouping bucket (test name) for the AB instance
    this.selectedTest = undefined;
    // Percentage allocated to all variants (100 total)
    this.variantsPct = 0;
    return this;
  }
  /**
   * Define an AB test variant to run
   *
   * @param {String} variantName
   * @param {Int} percent
   * @param {Function} testRunner
   *
   * @returns {Object} AB test instance
   * @public
   */
  ABFactory.prototype.variant = function (variantName, percent, testRunner) {
    var scrubbedPercent;
    var validPct;
    var variantFloor;
    var variantCeiling;
    var self = this;
    var hasMultipleVariants = self.tests.length > 0;
    // Ensure / scrub args
    scrubbedPercent = parseInt(percent, 10);
    if (typeof variantName !== 'string' || typeof scrubbedPercent !== 'number' || typeof testRunner !== 'function') {
      throw new Error('invalid variant invocation');
    }
    // Allow for graceful failure if no cookie
    if (!bitgoCookie) {
      console.error('Missing BitGo cookie -- not running AB tests');
      return self;
    }
    // Ensure the variant pct doesn't exceed the 99% threshold
    validPct = self.variantsPct + scrubbedPercent <= 99 ? true : false;
    if (!validPct) {
      throw new Error('Percentage for all variants must be <= 99.');
    }
    // set the floor for this variant, accounting for previous variants if needed
    variantFloor = hasMultipleVariants ? self.variantsPct + 1 : self.variantsPct;
    // increment the total percentage that is allotted to test variants
    self.variantsPct += scrubbedPercent;
    // set the ceiling for this variant
    variantCeiling = self.variantsPct;
    // add it to the variants storage for this AB test instance
    self.tests.push({
      name: variantName,
      floor: variantFloor,
      ceiling: variantCeiling,
      run: testRunner
    });
    // return the instance
    return self;
  };
  /**
   * Define an AB test control
   *
   * @param {Function} testRunner
   *
   * @returns {Object} AB test instance
   * @public
   */
  ABFactory.prototype.control = function (testRunner) {
    var variantFloor;
    var self = this;
    var hasMultipleVariants = self.tests.length > 0;
    // Ensure args
    if (typeof testRunner !== 'function') {
      throw new Error('invalid control invocation');
    }
    // Allow for graceful failure
    if (!bitgoCookie) {
      console.error('Missing BitGo cookie -- not running AB tests');
      return self;
    }
    // set the floor for the control, accounting for variants
    variantFloor = hasMultipleVariants ? self.variantsPct + 1 : self.variantsPct;
    // add the control to the tests if there's still room to run a control
    if (variantFloor <= 100) {
      self.tests.push({
        name: 'control',
        floor: variantFloor,
        ceiling: 100,
        run: testRunner
      });
    }
    // return the instance
    return self;
  };
  /**
   * Start an instance of an AB test
   *
   * @returns {Object} AB test instance
   * @public
   */
  ABFactory.prototype.start = function () {
    var hasControl;
    var selectedTest;
    var self = this;
    // Allow for graceful failure
    if (!bitgoCookie) {
      console.error('Missing BitGo cookie -- not running AB tests');
      return self;
    }
    // Run the appropriate test for the user based on their AbGroup
    _.forEach(self.tests, function (test) {
      if (test.floor <= self.userAbGroup && test.ceiling >= self.userAbGroup) {
        selectedTest = test;
      }
      if (test.name === 'control') {
        hasControl = true;
      }
    });
    // Ensure a control test was set
    if (!hasControl) {
      throw new Error('Cannot start test - no control was provided');
    }
    // Run the selected test
    self.selectedTest = selectedTest.name;
    selectedTest.run();
    // Return the instance
    return self;
  };
  // AB Test Tool API
  //
  //
  /**
    * Public API for AB test instance creation
    *
    * @param {String} name
    *
    * @public
    */
  function create(name) {
    if (typeof name !== 'string') {
      throw new Error('invalid AB test name');
    }
    // Return the instance if we already have it created
    if (_.has(currentTests, name)) {
      return currentTests[name];
    }
    // Otherwise, instantiate a new instance of an AB test
    var test = new ABFactory(name);
    // To allow for graceful failure, if the bitgo cookie was not set,
    // return a valid ab test instance, but don't do anything with it
    if (!bitgoCookie) {
      console.error('Missing BitGo cookie -- not running AB tests');
      return test;
    }
    // Add the new instance in the storage object then return the instance
    currentTests[name] = test;
    return test;
  }
  // Attach the AB test API
  AB.create = create;
  /**
    * Public API for completing an AB test instance
    *
    * @param {String} name
    * @param {Object} analytics
    *
    * @public
    */
  function complete(name, analytics) {
    var completedInfo;
    var test;
    // Ensure args
    if (typeof name !== 'string' || typeof analytics !== 'object' || typeof analytics.track !== 'function') {
      throw new Error('invalid AB test completion');
    }
    // Ensure the test exists
    if (!_.has(currentTests, name)) {
      throw new Error('cannot complete test ' + name + ': does not exist');
    }
    // Grab the AB test instance that is being completed
    test = currentTests[name];
    // Track the completion event through the analytics provider passed in
    completedInfo = {
      testName: test.name,
      tests: _.pluck(test.tests, 'name').join('; '),
      selectedTest: test.selectedTest,
      userAbTestId: userAbTestId
    };
    analytics.track('AbTestComp', completedInfo);
    return {
      test: test,
      completed: test.selectedTest
    };
  }
  AB.complete = complete;
  /**
    * Public API for registering all AB tests (with Mixpanel)
    *
    * @param {Object} analytics
    *
    * @public
    */
  function registerAll(analytics) {
    // Ensure args
    if (typeof analytics !== 'object' || typeof analytics.track !== 'function') {
      throw new Error('invalid AB test registration');
    }
    // Register each AB test independently
    _.forIn(currentTests, function (test) {
      var registrationInfo = {
          testName: test.name,
          tests: _.pluck(test.tests, 'name').join('; '),
          selectedTest: test.selectedTest,
          userAbTestId: userAbTestId
        };
      analytics.track('AbTestReg', registrationInfo);
    });
    return { tests: currentTests };
  }
  AB.registerAll = registerAll;
  /**
    * Public API for getting a template for a specified AB test
    *
    * @param {String} name
    *
    * @returns {String} template path string
    * @public
    */
  function getTemplate(name) {
    var tpl;
    // Ensure args
    if (typeof name !== 'string') {
      throw new Error('missing template name');
    }
    // check for and return the template
    tpl = templates[name];
    if (!tpl) {
      throw new Error('no template was set for this test: ' + name);
    }
    return tpl;
  }
  AB.getTemplate = getTemplate;
  /**
    * Public API for setting a template for a specified AB test
    *
    * @param {String} name
    * @param {String} template
    *
    * @returns {String} template path string
    * @public
    */
  function setTemplate(name, template) {
    var tpl;
    // Ensure args
    if (typeof name !== 'string' || typeof template !== 'string') {
      throw new Error('invalid setTemplate args');
    }
    // set the template
    templates[name] = template;
    return templates[name];
  }
  AB.setTemplate = setTemplate;
  /**
    * Public API for wiping all current AB tests
    *
    * @public
    */
  function deleteAll() {
    currentTests = {};
    templates = {};
  }
  AB.deleteAll = deleteAll;
  // AB Tools Helpers
  //
  //
  /**
   * Gets the bitgo cookie from the window and stores it in memory for AB tests
   *
   * @private
   */
  function getBitgoCookie() {
    var cookie;
    var cookies = document.cookie.split('; ');
    // Grab the BitGo cookie from the document
    _.forEach(cookies, function (c) {
      if (c.indexOf('bgAbTest=') === 0) {
        cookie = c.split('=')[1];
        return false;
      }
    });
    if (!cookie) {
      console.error('Missing BitGo cookie -- not running AB tests');
    }
    // Set the BitGo cookie locally
    bitgoCookie = cookie;
    return cookie;
  }
  /**
   * Set session-based user data to help with grouping for tests
   *
   * @private
   */
  function setUserAbTestId() {
    // Private helper to generate an ID from the base64 cookie ID
    function generateTestIdFromCookie(base64Str) {
      var cid;
      if (typeof base64Str !== 'string') {
        throw new Error('invalid string');
      }
      cid = JSON.parse(atob(base64Str)).cid;
      return parseInt(cid, 16);
    }
    try {
      userAbTestId = generateTestIdFromCookie(bitgoCookie);
    } catch (e) {
      console.error('Unable to set up AB tools -- not running AB tests');
    }
  }
  /**
   * AB Tools initialization handler
   *
   * @private
   */
  function init() {
    getBitgoCookie();
    setUserAbTestId();
  }
  // AB Initialization
  //
  //
  // Initialize the data for all AB tests
  init();
  // Attach the global AB object
  global.AB = AB;
}(window));/**
 * In this file should be the definition of all current client AB tests
 *
 * AB Test Notes:
 *
 * On Using AB Templates:
 * =====================================================================
 *  All AB template HTML should be added to the modules/ab/templates folder
 *
 *  When using an AB.templates template in the app, you can swap out the static
 *  string currently used to find the template
 *  - E.g.: var newTemplate = AB.getTemplate(__testName__);
 *
 *  To see this in use, check out the example below :)

  ======================================================================

  // Sample AB Test (rotates 3 different landing pages)
  // Step 1 (in this file): Define the AB test to be run
  //
  //

  ...some code...

  var testName = 'testA';

  AB
  .create(testName)
  .variant('variantA', 20, function() {
    // Be sure to add this template
    AB.setTemplate(testName, 'ab/templates/' + testName + '-variantA.html');
  })
  .variant('variantB', 40, function() {
    AB.setTemplate(testName, 'ab/templates/' + testName + '-variantB.html');
  })
  .control(function() {
    // For the control group we leave the template the same as the
    // current template path being used
    AB.setTemplate(testName, 'marketing/templates/landing.html');
  })
  .start();

  ...some more code...

  // Step 2 (elsewhere in the app): Use the template variable we set
  //
  //

  var abTemplate = AB.getTemplate('testA');
  $routeProvider.when('/', { templateUrl: abTemplate, controller: 'MarketingController' });

  ======================================================================

 *
 *
 */
var setupBitGoRoutes = function ($routeProvider) {
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
            // set post auth if not set already
            if (!PostAuthService.hasPostAuth()) {
              PostAuthService.setPostAuth('path', $location.path());
            }
            $location.path('/login');
          });
          return deferred.promise;
        }
      }
    ];
  var doneReferrerRedirect = false;
  var doReferrerRedirects = [
      '$location',
      function ($location, $document, $q) {
        if (!doneReferrerRedirect && $document[0].referrer) {
          doneReferrerRedirect = true;
          if ($document[0].referrer.indexOf('bitcoin.org') !== -1) {
            $location.path('/wallet');
          }
        }
      }
    ];
  // Proof of Reserves Partner Routes
  $routeProvider.when('/proof/:company/:proofId', {
    templateUrl: 'proofofreserves/templates/company-proof.html',
    controller: 'CompanyProofController'
  });
  $routeProvider.when('/vbb/:company/:proofId', {
    templateUrl: 'proofofreserves/templates/company-proof.html',
    controller: 'CompanyProofController'
  });
  $routeProvider.when('/vbb/terms', { templateUrl: 'proofofreserves/templates/proof-terms.html' });
  $routeProvider.when('/vbb/faq', { templateUrl: 'proofofreserves/templates/proof-faq.html' });
  // Marketing Routes
  $routeProvider.when('/', {
    templateUrl: 'marketing/templates/landing.html',
    controller: 'MarketingController',
    resolve: doReferrerRedirects
  });
  $routeProvider.when('/enterprise', {
    templateUrl: 'marketing/templates/enterprise.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/platform', {
    templateUrl: 'marketing/templates/platform.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/terms', {
    templateUrl: 'marketing/templates/terms.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/rewards-terms', {
    templateUrl: 'marketing/templates/rewards-terms.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/rewards-faq', {
    templateUrl: 'marketing/templates/rewards-faq.html',
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
  $routeProvider.when('/jobs', {
    templateUrl: 'marketing/templates/jobs.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/press', {
    templateUrl: 'marketing/templates/press.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/cases', {
    templateUrl: 'marketing/templates/cases.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/about', {
    templateUrl: 'marketing/templates/about.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/services_agreement', {
    templateUrl: 'marketing/templates/services_agreement.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/insurance', {
    templateUrl: 'marketing/templates/insurance.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/sla', {
    templateUrl: 'marketing/templates/sla.html',
    controller: 'MarketingController'
  });
  $routeProvider.when('/api-pricing', {
    templateUrl: 'marketing/templates/api_pricing.html',
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
  // Identity verification
  $routeProvider.when('/identity/verify', {
    templateUrl: 'identity/templates/verify.html',
    controller: 'IdentityController',
    resolve: requireAuth
  });
  // Hybrid Marketing/Auth Landing Pages
  $routeProvider.when('/wallet', {
    templateUrl: 'auth/templates/signup-walletvariant.html',
    controller: 'SignupController'
  });
  // Account Settings and create org Routes
  $routeProvider.when('/create-organization', {
    templateUrl: 'enterprise/templates/enterprise-create.html',
    controller: 'EnterpriseCreateController',
    resolve: requireAuth
  });
  $routeProvider.when('/settings', {
    templateUrl: 'settings/templates/settings.html',
    controller: 'SettingsController',
    resolve: requireAuth,
    reloadOnSearch: false
  });
  $routeProvider.when('/unsub', { templateUrl: 'settings/templates/emailunsubscribe.html' });
  // Enterprise Routes
  $routeProvider.when('/enterprise/:enterpriseId/settings', {
    templateUrl: 'enterprise/templates/enterprise-settings.html',
    controller: 'EnterpriseSettingsController',
    resolve: requireAuth
  });
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
  // Matchwallet Routes
  $routeProvider.when('/matchwallet/:matchwalletId', {
    templateUrl: 'matchwallet/templates/matchwallet.html',
    controller: 'MatchwalletController',
    resolve: requireAuth
  });
  // BitGo Customer Tools Routes
  $routeProvider.when('/tools/keychaincreator', {
    templateUrl: 'tools/templates/keychaincreator.html',
    controller: 'ToolsController'
  });
  // Unsupported Browser Route
  $routeProvider.when('/unsupported', { templateUrl: 'interceptors/templates/unsupported.html' });
};
var loadBitGoApp = function () {
  // Configure the app and module dependencies
  angular.module('BitGo', [
    'BitGo.Analytics',
    'BitGo.API',
    'BitGo.App',
    'BitGo.Auth',
    'BitGo.Common',
    'BitGo.Enterprise',
    'BitGo.Interceptors',
    'BitGo.Identity',
    'BitGo.Marketing',
    'BitGo.Modals',
    'BitGo.Model',
    'BitGo.Notifications',
    'BitGo.PostAuth',
    'BitGo.Proof',
    'BitGo.Settings',
    'BitGo.Tools',
    'BitGo.Utility',
    'BitGo.Wallet',
    'BitGo.Matchwallet',
    'angular-md5',
    'angularPayments',
    'ga',
    'feature-flags',
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
      setupBitGoRoutes($routeProvider);
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
      $httpProvider.interceptors.push('BrowserInterceptor');
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
    'BG_DEV',
    function (BG_DEV) {
      try {
        Stripe.setPublishableKey(BG_DEV.STRIPE.TEST.PUBKEY);
      } catch (e) {
        // incase stripe javascript does not load
        console.log(e.message);
      }
    }
  ]).config([
    '$compileProvider',
    function ($compileProvider) {
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
    }
  ]).run([
    '$rootScope',
    '$interval',
    'UtilityService',
    'UserAPI',
    'MarketDataAPI',
    'SyncService',
    'RequiredActionService',
    'SDK',
    function ($rootScope, $interval, UtilityService, UserAPI, MarketDataAPI, SyncService, RequiredActionService, SDK) {
      // Set the API route if it hasn't been set
      // REFACTOR(ben): remove
      if (!UtilityService.API.apiServer) {
        UtilityService.API.setApiServer();
      }
      // Initialize SJCL browser collectors
      function initPrng(ttl) {
        if (ttl < 4) {
          try {
            SDK.sjcl.random.startCollectors();
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
      $rootScope.TemplatePathPrefix = UtilityService.Global.isChromeApp ? 'index.html#' : '';
      // Set Bitcoin Network and external urls
      if (!BitGoConfig.env.isProd()) {
        $rootScope.externalTransactionUrl = 'https://tbtc.blockr.io/tx/info/';
        $rootScope.externalAddressUrl = 'https://tbtc.blockr.io/address/info/';
      } else {
        $rootScope.externalTransactionUrl = 'http://www.tradeblock.com/bitcoin/tx/';
        $rootScope.externalAddressUrl = 'https://www.tradeblock.com/bitcoin/address/';
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
  ]).run([
    'AnalyticsProxy',
    function (AnalyticsProxy) {
      AB.registerAll(AnalyticsProxy);
    }
  ]).constant('BG_DEV', {
    BILLING: {
      MODIFICATION_TYPE: {
        add: 'add',
        remove: 'remove'
      }
    },
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
      offlineWarning: 'offlineWarning',
      deactivationConfirmation: 'deactivationConfirmation',
      qrReceiveAddress: 'qrReceiveAddress',
      ssReceiveAltCoin: 'ssReceiveAltCoin',
      createWallet: 'createWallet',
      fundWallet: 'fundWallet',
      identityVerificationFailed: 'identityVerificationFailed'
    },
    MODAL_USER_ACTIONS: {
      otp: 'otp',
      createShare: 'createShare',
      acceptShare: 'acceptShare',
      sendFunds: 'sendFunds',
      approveSendFunds: 'approveSendFunds',
      createAccessToken: 'createAccessToken',
      offlineWarning: 'offlineWarning',
      deactivationConfirmation: 'deactivationConfirmation',
      qrReceiveAddress: 'qrReceiveAddress',
      ssReceiveAltCoin: 'ssReceiveAltCoin',
      createWallet: 'createWallet',
      fundWallet: 'fundWallet',
      identityVerificationFailed: 'identityVerificationFailed'
    },
    TX: { MINIMUM_BTC_DUST: 5460 },
    USER: {
      ACCOUNT_LEVELS: {
        basic: {
          level: 1,
          name: 'basic',
          prettyName: 'Basic',
          planId: 'Basic',
          cost: 0
        },
        plusAnnual: {
          level: 2,
          name: 'plus',
          prettyName: 'Plus',
          planId: 'PlusAnnual'
        },
        proAnnual: {
          level: 3,
          name: 'pro',
          prettyName: 'Pro',
          planId: 'ProAnnual'
        },
        plusMonthly: {
          level: 2,
          name: 'plus',
          prettyName: 'Plus',
          planId: 'PlusMonthly',
          cost: 10
        },
        proMonthly: {
          level: 3,
          name: 'pro',
          prettyName: 'Pro',
          planId: 'ProMonthly',
          cost: 30
        },
        grandfathered: {
          level: 1,
          name: 'grandfathered',
          prettyName: 'Basic',
          planId: 'Grandfathered',
          cost: 0
        }
      },
      BILLING_CYCLE: {
        monthly: 'Monthly',
        annual: 'Annual'
      }
    },
    REFERRER: { BITFINEX: 'bitfinex' },
    ENTERPRISE: {
      SUPPORT_PLAN_LEVELS: {
        OrgBasicMonthly: {
          level: 1,
          planId: 'OrgBasicMonthly',
          prettyName: 'Basic',
          cost: 0
        },
        OrgProMonthly: {
          level: 2,
          planId: 'OrgProMonthly',
          prettyName: 'Professional',
          cost: 30
        },
        OrgBusinessMonthly: {
          level: 3,
          planId: 'OrgBusinessMonthly',
          prettyName: 'Business',
          cost: 500
        },
        OrgBusinessPlusMonthly: {
          level: 4,
          planId: 'OrgBusinessPlusMonthly',
          prettyName: 'Business Plus',
          cost: 1500
        },
        custom: {
          level: 5,
          planId: 'custom',
          prettyName: 'Custom'
        },
        external: {
          level: 1,
          planId: 'external',
          prettyName: 'Pre existing'
        }
      },
      BITFINEX_ID: '5542a59828e67a7906f1b554f92571b8'
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
    AUDIT_LOG: {
      BACKUP_KEY_METHODS: {
        OFFLINE: 'cold',
        BROWSER: 'user'
      }
    },
    MARKETING_PATHS: [
      '/',
      '/platform',
      '/enterprise',
      '/terms',
      '/about',
      '/help',
      '/jobs',
      '/api',
      '/blog',
      '/p2sh_safe_address',
      '/privacy',
      '/press',
      '/cases',
      '/about',
      '/wallet',
      '/services_agreement',
      '/insurance',
      '/sla',
      '/api-pricing'
    ],
    ANALYTICS: {
      TOOLS: ['Mixpanel'],
      MIXPANEL: {
        NAME: 'Mixpanel',
        APP_TOKEN: BitGoConfig.env.isProd() ? '97c8108bf199a67ac9d2dace818b5a73' : 'f4ad58617c9bb4fd19d424da990fdb31'
      }
    },
    STRIPE: { TEST: { PUBKEY: BitGoConfig.env.isProd() ? 'pk_live_NFfhntKdt7M6SLS0WZYu6BcY' : 'pk_test_0fcm4T4oQ7twiU4aWnORa6PS' } },
    MATCHWALLET: { MIN_INVITATION_AMOUNT: 400000 },
    BACKUP_KEYS: {
      krsProviders: [{
          id: 'keyternal',
          displayName: 'Keyternal',
          image: '/img/keyternal_blur.png',
          url: 'https://keytern.al/'
        }]
    },
    APP_CONTEXTS: {
      signup: 'signup',
      login: 'login',
      forgotPassword: 'forgotPassword',
      resetPassword: 'resetPassword',
      identityVerification: 'identityVerification',
      enterpriseSettings: 'enterpriseSettings',
      enterpriseWalletsList: 'enterpriseWalletsList',
      enterpriseReports: 'enterpriseReports',
      enterpriseActivity: 'enterpriseActivity',
      createEnterprise: 'createEnterprise',
      walletSend: 'walletSend',
      walletReceive: 'walletReceive',
      walletTransactions: 'walletTransactions',
      walletPolicy: 'walletPolicy',
      walletUsers: 'walletUsers',
      walletSettings: 'walletSettings',
      createWallet: 'createWallet',
      matchwalletSend: 'matchwalletSend',
      matchwalletInvitations: 'matchwalletInvitations',
      accountSettings: 'accountSettings',
      marketingHome: 'marketingHome',
      marketingAPI: 'marketingAPI',
      marketingEnterprise: 'marketingEnterprise',
      marketingTerms: 'marketingTerms',
      marketingJobs: 'marketingJobs',
      marketingWhitePaper: 'marketingWhitePaper',
      marketingInsurance: 'marketingInsurance',
      marketingPrivacy: 'marketingPrivacy',
      marketingPress: 'marketingPress',
      marketingCases: 'marketingCases',
      marketingAbout: 'marketingAbout',
      marketingServicesAgreement: 'marketingServicesAgreement',
      marketingSla: 'marketingSla',
      marketingApiPricing: 'marketingApiPricing'
    }
  });
};
// This file is loaded by the server to pull the client routes dynamically, so it needs
// to be require-able.
if (typeof module !== 'undefined' && module.exports) {
  // For node
  module.exports = setupBitGoRoutes;
} else {
  // For client
  loadBitGoApp();
}/**
 * @ngdoc module
 * @name BitGo.Analytics
 * @description
 * Manages all things dealing with in-app analytics
 */
angular.module('BitGo.Analytics', [
  'BitGo.Analytics.AnalyticsProxyService',
  'BitGo.Analytics.AnalyticsUtilitiesService',
  'BitGo.Analytics.FacebookProvider',
  'BitGo.Analytics.GoogleAdwordsProvider',
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
  'FacebookProvider',
  'GoogleAdwordsProvider',
  function ($rootScope, $location, BG_DEV, MixpanelProvider, FacebookProvider, GoogleAdwordsProvider) {
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
    /**
    * @constructor
    * Triggers proper analytics events for measuring the time it takes a user
    * to enter a valid credit card
    * @public
    */
    utils.time.CreditCardCompletionMonitor = function () {
      this._states = {
        started: 'started',
        completed: 'completed'
      };
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
    utils.time.CreditCardCompletionMonitor.prototype.track = function (eventName, evtData) {
      // return data for the tracking call
      var data = {};
      var self = this;
      if (typeof eventName !== 'string' || !evtData || typeof evtData.currentPlan !== 'string' || typeof evtData.selectedPlan !== 'string') {
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
]);/**
 * @ngdoc service
 * @name FacebookProvider
 * @description
 * This manages the analytics calls to Facebook
 */
angular.module('BitGo.Analytics.FacebookProvider', []).factory('FacebookProvider', [
  '$rootScope',
  'BG_DEV',
  'UtilityService',
  function ($rootScope, BG_DEV, UtilityService) {
    /**
    * Initialize FB tracking object on the window
    * @private
    */
    function init() {
      if (UtilityService.Global.isChromeApp) {
        return;
      }
      var _fbq = window._fbq || (window._fbq = []);
      if (!_fbq.loaded) {
        var fbds = document.createElement('script');
        fbds.async = true;
        fbds.src = '//connect.facebook.net/en_US/fbds.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(fbds, s);
        _fbq.loaded = true;
      }
    }
    /**
    * Track FB user login
    * @private
    */
    function identify() {
      if (UtilityService.Global.isChromeApp) {
        return;
      }
      try {
        window._fbq = window._fbq || [];
        window._fbq.push([
          'track',
          '6023716497741',
          {
            'value': '1',
            'currency': 'USD'
          }
        ]);
      } catch (error) {
        console.log('Facebook identify failed: ', error.error);
      }
    }
    // initialize FB analytics
    init();
    // In-app API
    return { identify: identify };
  }
]);/**
 * @ngdoc service
 * @name GoogleAdwordsProvider
 * @description
 * Manages initializing Google Adwords
 */
angular.module('BitGo.Analytics.GoogleAdwordsProvider', []).factory('GoogleAdwordsProvider', [
  '$rootScope',
  'UtilityService',
  function ($rootScope, UtilityService) {
    /**
    * Initialize Google Adwords pixel
    * @private
    */
    function init() {
      if (UtilityService.Global.isChromeApp) {
        return;
      }
      // initialize variables for all tracking calls
      window.google_conversion_color = 'ffffff';
      window.google_conversion_format = '3';
      window.google_conversion_id = 947879481;
      window.google_conversion_label = '0vJFCMze9FwQufz9wwM';
      window.google_conversion_language = 'en';
      window.google_remarketing_only = false;
      // Fetch and inject Google's converstion script
      var scriptEle = document.createElement('script');
      scriptEle.src = '//www.googleadservices.com/pagead/conversion_async.js';
      var scriptInst = document.getElementsByTagName('script')[0];
      scriptInst.parentNode.insertBefore(scriptEle, scriptInst);
    }
    /**
    * Track a user signup in Google Adwords
    * @private
    */
    function identify() {
      function goog_report_conversion(url) {
        window.google_is_call = true;
        var opt = {};
        opt.onload_callback = function () {
          if (typeof url != 'undefined') {
            window.location = url;
          }
        };
        var conv_handler = window.google_trackConversion;
        if (typeof conv_handler == 'function') {
          conv_handler(opt);
        }
      }
      if (UtilityService.Global.isChromeApp) {
        return;
      }
      goog_report_conversion();
    }
    // Provider Initialization
    init();
    // In-app API
    return { identify: identify };
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
  'UtilityService',
  function ($rootScope, BG_DEV, UtilityService) {
    /**
    * Log instances in which Mixpanel is blocked
    * @private
    */
    function logMixpanelBlock(error) {
      // Mixpanel is not supported in the Chrome app due to CSP issues
      if (UtilityService.Global.isChromeApp) {
        return;
      }
      console.log('Mixpanel was blocked:', error.message);
      console.log('Please turn off any ad blockers that are running');
    }
    /**
    * Initialize Mixpanel analytics
    * @private
    */
    function init() {
      if (!window.mixpanel || typeof window.mixpanel.init !== 'function') {
        console.log('Mixpanel is not being loaded');
        return;
      }
      try {
        mixpanel.init(BG_DEV.ANALYTICS.MIXPANEL.APP_TOKEN);
        return true;
      } catch (e) {
        logMixpanelBlock(e);
      }
    }
    /**
    * Kill Mixpanel analytics for the current user (usually called on logout)
    * @private
    */
    function shutdown() {
      // Mixpanel is unclear about how to handle user logouts - best practices are used below
      // https://github.com/mixpanel/mixpanel-android/issues/97
      // http://stackoverflow.com.80bola.com/questions/21137286/what-should-i-do-when-users-log-out/22059786
      try {
        mixpanel.cookie.clear();
        init('');
        return true;
      } catch (e) {
        logMixpanelBlock(e);
      }
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
      // attempt event tracking
      try {
        // Track the event with data (if any)
        if (eventData) {
          mixpanel.track(eventName, eventData);
          return true;
        }
        // Otherwise just track the event
        mixpanel.track(eventName);
        return true;
      } catch (e) {
        logMixpanelBlock(e);
      }
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
      // attempt registration
      try {
        if (typeof registerOnce === 'boolean' && registerOnce) {
          mixpanel.register_once(data);
          return true;
        }
        mixpanel.register(data);
        return true;
      } catch (e) {
        logMixpanelBlock(e);
      }
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
      try {
        mixpanel.alias(userID);
        return true;
      } catch (e) {
        logMixpanelBlock(e);
      }
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
      try {
        mixpanel.identify(userID);
        return true;
      } catch (e) {
        logMixpanelBlock(e);
      }
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
 * @name SDK
 * @description
 * Manages authenticating with and caching the sdk object of the SDK, so that
 * the SDK can be used throughout the client.
 */
angular.module('BitGo.API.SDK', ['ngResource']).factory('SDK', [
  '$q',
  'CacheService',
  'UtilityService',
  function ($q, CacheService, Utils) {
    var sdkCache = new CacheService.Cache('sessionStorage', 'SDK');
    var PromiseErrorHelper = Utils.API.promiseErrorHelper;
    // if a URL other than one of the standard ones (www.bitgo.com, etc.) is
    // detected, this gets set to that URL
    var customRootURI;
    // the network (bitcoin or test) if we aren't using one of the standard
    // environments
    var customBitcoinNetwork;
    var env = BitGoConfig.env.getSDKEnv();
    if (!env) {
      customRootURI = 'https://' + location.host;
      customBitcoinNetwork = 'test';
    }
    // parameters for constructing SDK object
    var params = {
        env: env,
        customRootURI: customRootURI,
        customBitcoinNetwork: customBitcoinNetwork,
        validate: false
      };
    var sdk;
    return {
      bitcoin: BitGoJS.bitcoin,
      sjcl: BitGoJS.sjcl,
      get: function () {
        if (sdk) {
          return sdk;
        }
        return this.load();
      },
      getNetwork: function () {
        return this.bitcoin.networks[BitGoJS.getNetwork()];
      },
      doPost: function (url, data, field) {
        var sdk = this.get();
        return sdk.post(sdk.url(url)).send(data).result(field);
      },
      doPut: function (url, data, field) {
        var sdk = this.get();
        return sdk.put(sdk.url(url)).send(data).result(field);
      },
      doGet: function (url, data, field) {
        var sdk = this.get();
        return sdk.get(sdk.url(url)).query(data).result(field);
      },
      doDelete: function (url, data, field) {
        data = data || {};
        var sdk = this.get();
        return sdk.del(sdk.url(url)).send(data).result(field);
      },
      encrypt: function (password, message) {
        return this.get().encrypt({
          password: password,
          input: message
        });
      },
      decrypt: function (password, message) {
        return this.get().decrypt({
          password: password,
          input: message
        });
      },
      generateRandomPassword: function (numWords) {
        numWords = numWords || 5;
        var bytes = this.sjcl.codec.bytes.fromBits(this.sjcl.random.randomWords(numWords));
        return BitGoJS.bs58.encode(bytes);
      },
      passwordHMAC: function (email, password) {
        var sjcl = this.sjcl;
        var out = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(email), sjcl.hash.sha256).mac(password);
        return sjcl.codec.hex.fromBits(out).toLowerCase();
      },
      wrap: function (promise) {
        return $q.when(promise).catch(PromiseErrorHelper());
      },
      load: function () {
        var json = sdkCache.get('sdk');
        sdk = new BitGoJS.BitGo(params);
        if (json) {
          try {
            sdk.fromJSON(json);
          } catch (e) {
            // if there was an error loading the SDK JSON data, we'll make a
            // new one. If such an error ever occurs, it may mean a logged-in
            // user is no longer logged in.
            sdk = new BitGoJS.BitGo(params);
          }
        }
        return sdk;
      },
      save: function () {
        sdkCache.add('sdk', sdk.toJSON());
      },
      delete: function () {
        sdk = undefined;
        sdkCache.remove('sdk');
      }
    };
  }
]);/**
 * @ngdoc service
 * @name AccessTokensAPI
 * @description
 * This manages app API requests for the access token functionality in BitGo
 */
/* istanbul ignore next */
angular.module('BitGo.API.AccessTokensAPI', []).factory('AccessTokensAPI', [
  '$resource',
  'SDK',
  function ($resource, SDK) {
    /**
    * Add an access token to a user
    * @param params {Object}
    * @private
    */
    function add(params) {
      if (!params) {
        throw new Error('missing params');
      }
      return SDK.wrap(SDK.doPost('/user/accesstoken', params));
    }
    /**
    * Lists the access tokens for a user
    * @private
    */
    function list() {
      return SDK.wrap(SDK.doGet('/user/accesstoken'));
    }
    /**
    * Remove an access token for a user
    * @private
    */
    function remove(accessTokenId) {
      if (!accessTokenId) {
        throw new Error('missing accessTokenId');
      }
      return SDK.wrap(SDK.doDelete('/user/accesstoken/' + accessTokenId));
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
  'BitGo.API.IdentityAPI',
  'BitGo.API.KeychainsAPI',
  'BitGo.API.LabelsAPI',
  'BitGo.API.JobsAPI',
  'BitGo.API.MarketDataAPI',
  'BitGo.API.PolicyAPI',
  'BitGo.API.ProofsAPI',
  'BitGo.API.ReportsAPI',
  'BitGo.API.SDK',
  'BitGo.API.SettingsAPI',
  'BitGo.API.StatusAPI',
  'BitGo.API.TransactionsAPI',
  'BitGo.API.UserAPI',
  'BitGo.API.WalletsAPI',
  'BitGo.API.WalletSharesAPI',
  'BitGo.API.MatchwalletAPI',
  'BitGo.API.ssAPI',
  'BitGo.Model',
  'BitGo.Utility',
  'feature-flags'
]);/**
 * @ngdoc service
 * @name ApprovalsAPI
 * @description
 * Manages the http requests dealing with a wallet's approval objects
 */
/* istanbul ignore next */
angular.module('BitGo.API.ApprovalsAPI', []).factory('ApprovalsAPI', [
  '$q',
  '$location',
  '$resource',
  'SDK',
  '$rootScope',
  function ($q, $location, $resource, SDK, $rootScope) {
    /**
    * Updates a specific approval
    * @param {string} approvalId for the approval
    * @param {obj} object containing details needed to update the approval
    * @private
    */
    function update(approvalId, approvalData) {
      // TODO: SDK has method, but no way to construct a pending approval object from id
      return SDK.wrap(SDK.doPut('/pendingapprovals/' + approvalId, approvalData));
    }
    /**
    * Get all the pending approvals for a user
    * @public
    * @returns {promise} - with pending approvals data
    */
    function getApprovals(params) {
      if (!params.enterprise) {
        throw new Error('invalid params for getApprovals');
      }
      // TODO: SDK has method, but no way to construct a pending approval object from id
      return SDK.wrap(SDK.doGet('/pendingapprovals', params));
    }
    // When the enterprise is set, get all the approvals
    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function (evt, data) {
      // list of enterprises which the user is an admin on
      var adminEnterprises = [];
      _.forIn($rootScope.enterprises.all, function (enterprise) {
        if (enterprise.isAdmin && !enterprise.isPersonal) {
          adminEnterprises.push(enterprise);
        }
      });
      // Get all the pennding approvals and set it on the enterprise object
      return $q.all(adminEnterprises.map(function (enterprise) {
        return getApprovals({ enterprise: enterprise.id }).then(function (data) {
          $rootScope.enterprises.all[enterprise.id].setApprovals(data.pendingApprovals);
        });
      }));
    });
    /** In-client API */
    return {
      update: update,
      getApprovals: getApprovals
    };
  }
]);/* istanbul ignore next */
angular.module('BitGo.API.AuditLogAPI', []).factory('AuditLogAPI', [
  '$rootScope',
  'SDK',
  function ($rootScope, SDK) {
    // Get the audit log based on scoping provided in the params
    function get(params) {
      if (!params || !params.enterpriseId || typeof params.skip !== 'number' || typeof params.limit !== 'number') {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doGet('/auditLog', params));
    }
    // In-client API
    return { get: get };
  }
]);angular.module('BitGo.API.EnterpriseAPI', []).factory('EnterpriseAPI', [
  '$location',
  '$rootScope',
  'UtilityService',
  'CacheService',
  'EnterpriseModel',
  'NotifyService',
  'SDK',
  function ($location, $rootScope, UtilityService, CacheService, EnterpriseModel, NotifyService, SDK) {
    var DEFAULT_CACHED_ENTERPRISE_ID = 'personal';
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
      return SDK.wrap(SDK.doGet('/enterprise', {}, 'enterprises')).then(function (enterprises) {
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
        //redirect to correct url incase url in enterprise is wrong. Do not redirect if 'enterprise is not present in url'
        if (UtilityService.Url.getEnterpriseIdFromUrl() && UtilityService.Url.getEnterpriseIdFromUrl() !== $rootScope.enterprises.current.id) {
          $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/' + UtilityService.Url.getEnterpriseSectionFromUrl());
        }
        // Let listeners in the app know that the enterprise list was set
        $rootScope.$emit('EnterpriseAPI.CurrentEnterpriseSet', { enterprises: $rootScope.enterprises });
        return enterprises;
      });
    }
    /**
    * Creates an enterprise inquiry for the marketing team
    * @param inquiry {Object} contains necessary params for the post
    * @private
    */
    /* istanbul ignore next */
    function createInquiry(inquiry) {
      if (!inquiry) {
        throw new Error('invalid params');
      }
      return SDK.wrap(SDK.doPost('/enterprise/inquiry', inquiry));
    }
    /**
    * Creates an enterprise
    * @param params {Object} contains necessary stripe and enterprise data for creating an enterise
    * @public
    */
    /* istanbul ignore next */
    function addEnterprise(params) {
      if (!params || !params.name || !params.supportPlan || !params.token) {
        throw new Error('invalid params to add an enterprise');
      }
      return SDK.wrap(SDK.doPost('/enterprise', params));
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
    /**
    * Returns basic info for an enterprise - used publicly, not scoped to a user
    * @param { String } enterpriseName
    * @private
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function getInfoByName(enterprise) {
      if (!enterprise) {
        throw new Error('missing enterprise');
      }
      return SDK.wrap(SDK.doGet('/enterprise/name/' + enterprise));
    }
    /**
    * Returns latest service version
    * @public
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function getServicesAgreementVersion() {
      return SDK.wrap(SDK.doGet('/servicesAgreement'));
    }
    /**
    * Updates an array of enterprises to the latest service agreement
    * @public
    * @param { enterpriseIds: [array of enterprise ids] } - object
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function updateServicesAgreementVersion(params) {
      if (!params || !params.enterpriseIds) {
        throw new Error('Expected different parameters for updateServicesAgreementVersion');
      }
      return SDK.wrap(SDK.doPut('/enterprise/servicesAgreement', params));
    }
    /**
    * Gets users on a particular enterprise
    * @public
    * @param { enterpriseId: enterprise id to get the users for } - object
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function getEnterpriseUsers(params) {
      if (!params || !params.enterpriseId) {
        throw new Error('Expected different parameters for getEnterpriseUsers');
      }
      return SDK.wrap(SDK.doGet('/enterprise/' + params.enterpriseId + '/user', params));
    }
    /**
    * Add admin to a particular enterprise
    * @public
    * @param { 
        enterpriseId: enterprise id to get the users for
        username: username of the user to be added
      } 
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function addEnterpriseAdmin(params) {
      if (!params || !params.enterpriseId || !params.username) {
        throw new Error('Expected different parameters for addEnterpriseAdmin');
      }
      return SDK.wrap(SDK.doPost('/enterprise/' + params.enterpriseId + '/user', { username: params.username }));
    }
    /**
    * Update billing for a particular enterprise
    * @public
    * @param { 
        enterpriseId: enterprise id to change the billing for
        cardToken: 
        userPlan:
        supportPlan:
      }
    * Call needs to have atleast on of cardToken, userPlan, supportPlan values
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function updateEnterpriseBilling(params) {
      if (!params || !params.enterpriseId) {
        throw new Error('Expected different parameters for addEnterpriseAdmin');
      }
      if (!params.cardToken && !params.userPlan && !params.supportPlan) {
        throw new Error('Expected different parameters for addEnterpriseAdmin');
      }
      return SDK.wrap(SDK.doPut('/enterprise/' + params.enterpriseId + '/billing', params));
    }
    /**
    * Remove admin from a particular enterprise
    * @public
    * @param { 
        enterpriseId: enterprise id to get the users for
        username: username of the user to be removed
      } 
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function removeEnterpriseAdmin(params) {
      if (!params || !params.enterpriseId || !params.username) {
        throw new Error('Expected different parameters for addEnterpriseAdmin');
      }
      return SDK.wrap(SDK.doDelete('/enterprise/' + params.enterpriseId + '/user', { username: params.username }));
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
      getInfoByName: getInfoByName,
      getServicesAgreementVersion: getServicesAgreementVersion,
      updateServicesAgreementVersion: updateServicesAgreementVersion,
      getEnterpriseUsers: getEnterpriseUsers,
      addEnterpriseAdmin: addEnterpriseAdmin,
      updateEnterpriseBilling: updateEnterpriseBilling,
      removeEnterpriseAdmin: removeEnterpriseAdmin,
      getAllEnterprises: getAllEnterprises,
      setCurrentEnterprise: setCurrentEnterprise,
      getCurrentEnterprise: getCurrentEnterprise,
      createInquiry: createInquiry,
      addEnterprise: addEnterprise
    };
  }
]);angular.module('BitGo.API.IdentityAPI', []).factory('IdentityAPI', [
  '$rootScope',
  'SDK',
  function ($rootScope, SDK) {
    /**
     * Create a login with our KYC provider and return the oauth_key used
     * to verify identity.
     * @param identity {Object} - Include name, phone and finger strings
     * @returns Promise returning oauth_key
     */
    function createIdentity(identity) {
      return SDK.wrap(SDK.doPost('/identity/create', identity)).then(handleAPIErrors).then(function (res) {
        return res.oauth_key;
      });
    }
    /**
     * Verify information submitted during identity verification process
     * is valid and unique to the user
     * @param oauth_key {String} - Returned from createIdentity API endpoint
     * @returns return {Object} containing a boolean property called 'verified'
     */
    function verifyIdentity(oauth_key) {
      return SDK.wrap(SDK.doPost('/identity/verify', { oauth_key: oauth_key })).then(handleAPIErrors).then(function (res) {
        return res.verified;
      });
    }
    function handleAPIErrors(res) {
      if (res.error) {
        var error = new Error(res.error);
        error.retryTime = res.retryTime;
        throw error;
      }
      return res;
    }
    return {
      createIdentity: createIdentity,
      verifyIdentity: verifyIdentity
    };
  }
]);/**
 * @ngdoc service
 * @name jobsAPI
 * @description
 * This manages app API requests for listing jobs through the BitGo website
 */
/* istanbul ignore next */
angular.module('BitGo.API.JobsAPI', []).factory('JobsAPI', [
  'SDK',
  function (SDK) {
    /**
    * List the jobs posted on the workable website
    * @private
    */
    function list() {
      return SDK.wrap(SDK.doGet('/jobs'));
    }
    // Client API
    return { list: list };
  }
]);angular.module('BitGo.API.KeychainsAPI', []).factory('KeychainsAPI', [
  '$q',
  '$location',
  '$rootScope',
  'UtilityService',
  'UserAPI',
  'SDK',
  function ($q, $location, $rootScope, Utils, UserAPI, SDK) {
    var PromiseErrorHelper = Utils.API.promiseErrorHelper;
    // Helper: generates a new BIP32 keychain to use
    function generateKey() {
      var keyData = SDK.get().keychains().create();
      return SDK.bitcoin.HDNode.fromBase58(keyData.xprv);
    }
    /* istanbul ignore next */
    function getColdKey(secret) {
      if (typeof secret !== 'string') {
        throw Error('illegal argument');
      }
      return SDK.wrap(SDK.doGet('/coldkey/' + secret));
    }
    // Creates keychains on the BitGo server
    function createKeychain(data) {
      // source for the keychain being created (currently 'user' or 'cold')
      var source = data.source;
      // the passcode used to encrypt the xprv
      var passcode = data.passcode;
      // the BIP32 extended key used to create a keychain when a user wants to use their own backup
      var hdNode = data.hdNode;
      var saveEncryptedXprv = data.saveEncryptedXprv;
      // If the user doesn't provide a key, generate one
      if (!hdNode) {
        hdNode = generateKey();
      }
      // Each saved keychain object has these properties
      var keychainData = {
          source: data.source,
          xpub: hdNode.neutered().toBase58()
        };
      // If we're storing the encryptedXprv, include this with the request
      if (saveEncryptedXprv) {
        // The encrypted xprv; encrypted with the wallet's passcode
        keychainData.encryptedXprv = SDK.encrypt(passcode, hdNode.toBase58());
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
        if (hdNode.privKey) {
          data.xprv = hdNode.toBase58();
          if (!data.encryptedXprv) {
            data.encryptedXprv = SDK.encrypt(passcode, data.xprv);
          }
        }
        return data;
      }
      // Return the promise
      return $q.when(SDK.get().keychains().add(keychainData)).then(function (data) {
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
    /* istanbul ignore next */
    function createBitGoKeychain() {
      return SDK.wrap(SDK.get().keychains().createBitGo());
    }
    /**
     * Create and return a new backup keychain from a backup provider
     * @param {string} the name of the provider to create the xpub from
     * @returns {Obj} new backup keychain with krs xpub
     */
    /* istanbul ignore next */
    function createBackupKeychain(provider) {
      return SDK.wrap(SDK.get().keychains().createBackup({ provider: provider }));
    }
    // Get a specific BitGo keychain
    /* istanbul ignore next */
    function get(xpub) {
      return SDK.wrap(SDK.get().keychains().get({ xpub: xpub }));
    }
    /**
     * Update a bitgo keychain
     * @param {Obj} bitgo keychain object to update
     * @returns {Obj} updated bitgo keychain
     */
    /* istanbul ignore next */
    function update(params) {
      return SDK.wrap(SDK.get().keychains().update(params));
    }
    // In-client API
    return {
      get: get,
      update: update,
      createKeychain: createKeychain,
      createBitGoKeychain: createBitGoKeychain,
      createBackupKeychain: createBackupKeychain,
      generateKey: generateKey,
      getColdKey: getColdKey
    };
  }
]);angular.module('BitGo.API.LabelsAPI', []).factory('LabelsAPI', [
  '$location',
  '$rootScope',
  'CacheService',
  'SDK',
  function ($location, $rootScope, CacheService, SDK) {
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
    /* istanbul ignore next */
    function add(params) {
      return SDK.wrap(SDK.get().newWalletObject({ id: params.walletId }).setLabel({
        address: params.address,
        label: params.label
      })).then(function (data) {
        addLabelToCache(data);
        return data;
      });
    }
    /**
     * Delete a label for an address in a wallet
     * @param label {Object} Object containing a walletid and address
     * @return promise
     * @public
     */
    function remove(params) {
      return SDK.wrap(SDK.get().newWalletObject({ id: params.walletId }).deleteLabel({ address: params.address })).then(function (data) {
        removeLabelFromCache(data);
        return data;
      });
    }
    // Return a list of labeled addresses across all wallets
    function list() {
      // Cache was already loaded - return it
      if (!_.isEmpty(labelsCache)) {
        return SDK.wrap(labelsCache);
      }
      return SDK.wrap(SDK.doGet('/labels')).then(function (data) {
        _.forEach(data.labels, function (label) {
          addLabelToCache(label);
        });
        return labelsCache;
      });
    }
    // Return a label for an address hopefully scoped by wallet
    function get(address, walletId) {
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
  '$http',
  '$rootScope',
  'BG_DEV',
  'UtilityService',
  'CacheService',
  'SDK',
  function ($http, $rootScope, BG_DEV, Utils, CacheService, SDK) {
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
    // Flag to check if market data is available throughout the app
    $rootScope.marketDataAvailable = true;
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
      var cap = $rootScope.currency.data.current.last * $rootScope.blockchainData.blockchain.totalbc;
      $rootScope.blockchainData.marketcap = cap;
    }
    function setBlockchainData() {
      $rootScope.blockchainData = {
        blockchain: currencyCache.storage.get('blockchain'),
        updateTime: currencyCache.storage.get('updateTime')
      };
    }
    // Financial Data Setter
    function setFinancialData() {
      var currency = getAppCurrency();
      $rootScope.currency = {
        currency: currency,
        bitcoinUnit: getBitcoinUnit(),
        symbol: symbolMap[currency],
        data: {
          current: currencyCache.get('current')[currency],
          previous: currencyCache.get('previous')[currency]
        }
      };
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
      try {
        setFinancialData();
        setBlockchainData();
        setMarketCapData();
        $rootScope.marketDataAvailable = true;
        $rootScope.$emit('MarketDataAPI.AppCurrencyUpdated', $rootScope.currency);
      } catch (error) {
        console.log('error setting market data' + error);
        $rootScope.marketDataAvailable = false;
      }
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
        return SDK.wrap(SDK.get().market()).then(function (result) {
          if (!_.isEmpty(result.latest.currencies)) {
            var currency = getAppCurrency();
            setCurrencyCache(result);
            setInAppMarketData(currency);
            return $rootScope.currency;
          }
        });
      },
      price: function (range, currency) {
        if (!range) {
          throw new Error('Need range when getting market data');
        } else if (!currency) {
          throw new Error('Need currency when getting market data');
        }
        return SDK.wrap(SDK.doGet('/market/last/' + range + '/' + currency)).then(function (results) {
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
        });
      }
    };
  }
]);/**
 * @ngdoc service
 * @name matchwalletAPI
 * @description
 * Manages interactions with the matchwallet API endpoints and setting
 * related variables on $rootScope
 */
angular.module('BitGo.API.MatchwalletAPI', []).factory('MatchwalletAPI', [
  '$q',
  '$location',
  '$rootScope',
  '$injector',
  'WalletsAPI',
  'EnterpriseAPI',
  'MatchwalletModel',
  'NotifyService',
  'UtilityService',
  'CacheService',
  'featureFlags',
  'SDK',
  'BG_DEV',
  function ($q, $location, $rootScope, $injector, WalletsAPI, EnterpriseAPI, MatchwalletModel, Notify, UtilityService, CacheService, featureFlags, SDK, BG_DEV) {
    // fetch helpers
    var PromiseSuccessHelper = UtilityService.API.promiseSuccessHelper;
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // Cache setup
    var matchwalletCache = CacheService.getCache('matchwallets') || new CacheService.Cache('localStorage', 'matchwallets', 120 * 60 * 1000);
    // The user's invitation, if they have one
    $rootScope.invitation = null;
    /**
     * True if the user has unclaimed invitation gift.
     */
    function invitationGiftPending() {
      return $rootScope.invitation && !$rootScope.invitation.accepted && !$rootScope.invitation.rejected && !$rootScope.invitation.giftWalletId;
    }
    /**
     * @returns True if the user can send invites
     */
    function canSendInvites() {
      if (!$rootScope.invitation && !featureFlags.isOn('employee')) {
        return false;
      }
      if (!$rootScope.matchwallets || _.isEmpty($rootScope.matchwallets.all)) {
        return true;
      }
      var matchwallet = _.findLast($rootScope.matchwallets.all);
      return matchwallet.data.balance >= BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT && matchwallet.data.balance > BG_DEV.TX.MINIMUM_BTC_DUST;
    }
    /**
     * Create Matchwallet API endpoint helper
     * @returns new matchwallet object
     * @private
     */
    function createMatchwallet() {
      return SDK.wrap(SDK.doPost('/matchwallet/create')).then(function (matchwallet) {
        matchwallet = new MatchwalletModel.Matchwallet(matchwallet);
        // update the cache and rootScope wallets object
        matchwalletCache.add(matchwallet.data.id, matchwallet);
        $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
        return matchwallet;
      });
    }
    /**
      * initializes empty match wallet objects for the app / service
      * @private
      */
    function initEmptyMatchwallets() {
      $rootScope.matchwallets = {
        all: {},
        current: null
      };
    }
    /**
      * Clears all user match wallets from the match wallet cache
      * @private
      */
    function clearMatchwalletCache() {
      _.forIn($rootScope.matchwallets.all, function (matchwallet) {
        matchwalletCache.remove(matchwallet.data.id);
        console.assert(_.isUndefined(matchwalletCache.get(matchwallet.data.id)), matchwallet.data.id + ' was not removed from matchwalletCache');
      });
      initEmptyMatchwallets();
    }
    /**
      * Sets the new current matchwallet object on rootScope
      * @param matchwallet {Object} BitGo Matchwallet object
      * @param swapCurrentWallet {Bool} swap the current Matchwallet for the new one
      * @private
      */
    function setCurrentMatchwallet(matchwallet, swapCurrentMatchwallet) {
      if (!matchwallet) {
        throw new Error('Expect a wallet when setting the current wallet');
      }
      if (_.isEmpty($rootScope.matchwallets.all)) {
        throw new Error('Missing $rootScope.matchwallets.all');
      }
      var newCurrentMatchwallet = $rootScope.matchwallets.all[matchwallet.data.id];
      if (!newCurrentMatchwallet) {
        throw new Error('Matchwallet ' + matchwallet.data.id + ' not found when setting the current wallet');
      }
      // If we're swapping out the current wallet on rootScope
      if (swapCurrentMatchwallet) {
        $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
        newCurrentMatchwallet = matchwallet;
      }
      // Set the new current matchwallet
      $rootScope.matchwallets.current = newCurrentMatchwallet;
      // Broadcast the new event and go to the wallet's transaction list page
      var url = $location.path().split('/');
      var curWalletIdx = _.indexOf(url, 'matchwallet') + 1;
      if ($rootScope.matchwallets.current.data.id !== url[curWalletIdx]) {
        // wallet transactions path
        var path = '/matchwallet/' + $rootScope.matchwallets.current.data.id;
        $location.path(path);
      }
    }
    // Event Handlers
    function setMatchwallets() {
      var url = $location.path().split('/');
      var curWalletIdx = _.indexOf(url, 'matchwallet') + 1;
      var urlMatchwalletId = url[curWalletIdx];
      var urlCurrentMatchwallet = $rootScope.matchwallets.all[urlMatchwalletId];
      // handle wrong url by redirecting them to the dashboard
      if (urlMatchwalletId && !urlCurrentMatchwallet) {
        $location.path('/enterprise/personal/wallets');
      }
      if (urlMatchwalletId && urlCurrentMatchwallet) {
        setCurrentMatchwallet(urlCurrentMatchwallet);
      }
      setRewardsApproval();
    }
    // Fetch the details for a single wallet based on params criteria
    function getMatchwallet(params, cacheOnly) {
      if (!params) {
        throw new Error('Missing params for getting a wallet');
      }
      if (cacheOnly) {
        var result = matchwalletCache.get(params.id);
        return $q.when(result);
      }
      return SDK.wrap(SDK.doGet('/matchwallet/' + params.id)).then(function (matchwallet) {
        matchwallet = new MatchwalletModel.Matchwallet(matchwallet);
        // update the cache and rootScope wallets object
        matchwalletCache.add(params.id, matchwallet);
        $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
        return matchwallet;
      });
    }
    // Fetch the details for a user's invitation
    function fetchInvitation() {
      if (!$rootScope.currentUser.settings.signupToken) {
        return $q(function (resolve) {
          resolve(null);
        });
      }
      return SDK.wrap(SDK.doGet('/matchwallet/invitation')).catch(function (err) {
        return null;
      });
    }
    function emitMatchwalletsSetMessage() {
      $rootScope.$emit('MatchwalletAPI.UserMatchwalletsSet', $rootScope.matchwallets.all);
    }
    // Fetch all match wallets for a user
    function getAllMatchwallets(localMatchwalletsOnly) {
      // Returns all wallets
      if (localMatchwalletsOnly) {
        return $rootScope.matchwallets.all;
      }
      return SDK.wrap(SDK.doGet('/matchwallet', { limit: 10 })).then(function (data) {
        return $q.all(data.matchwallets.map(function (matchwallet) {
          return getMatchwallet({ id: matchwallet.id }, false).then(function (matchwallet) {
            $rootScope.matchwallets.all[matchwallet.data.id] = matchwallet;
          }).catch(function (error) {
            console.error(error);
          });
        })).then(function () {
          setMatchwallets();
          emitMatchwalletsSetMessage();
          return $rootScope.matchwallets.all;
        });
      }).catch(PromiseErrorHelper());
    }
    /**
     * Updates the match wallet settings
     * @param {Object} params for the wallet. Contains wallet id and a new label or rewardWalletId
     * @returns {Promise} with success/error
     * @public
     */
    function updateMatchwallet(params) {
      if (!params.id || !(params.label || params.rewardWalletId)) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPut('/matchwallet/' + params.id, params)).then(PromiseSuccessHelper(), PromiseErrorHelper());
    }
    /**
     * Sends an invitation
     * @params {Object} params for the invitation. Contains matchwallet id, email, amount and message
     * @returns {Promise} with success/error
     */
    function sendInvitation(params) {
      if (!params.id || !params.email || !params.amount) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPost('/matchwallet/' + params.id + '/send', params));
    }
    function setCurrentInvitation(invitation) {
      $rootScope.invitation = invitation;
      setRewardsApproval();
      $rootScope.$emit('MatchwalletAPI.UserInvitationSet', invitation);
    }
    function getInvitation() {
      return fetchInvitation().then(setCurrentInvitation);
    }
    // Fetch all wallets when the user signs in
    $rootScope.$on('UserAPI.CurrentUserSet', function (evt, user) {
      getAllMatchwallets();
      getInvitation();
    });
    // Clear the wallet cache on user logoout
    $rootScope.$on('UserAPI.UserLogoutEvent', function () {
      clearMatchwalletCache();
      delete $rootScope.invitation;
    });
    // Sets the "claim reward" approval on the personal enterprise
    function setRewardsApproval() {
      var personalEnterprise = _.find($rootScope.enterprises.all, { isPersonal: true });
      if (personalEnterprise) {
        var approvals = {};
        if ($rootScope.invitation && !$rootScope.invitation.accepted && !$rootScope.invitation.rejected && !$rootScope.invitation.giftWalletId) {
          approvals[$rootScope.invitation.id] = {
            id: $rootScope.invitation.id,
            enterprise: personalEnterprise.id,
            createDate: $rootScope.invitation.createDate,
            info: {
              type: 'invitation',
              gift: true,
              invitation: $rootScope.invitation
            },
            state: 'pending'
          };
        }
        if ($rootScope.matchwallets) {
          _($rootScope.matchwallets.all).values().pluck('data').pluck('invitations').flatten().value().forEach(function (invitation) {
            if (!invitation.accepted && !invitation.rejected && !invitation.rewardWalletId) {
              approvals[invitation.id] = {
                id: invitation.id,
                enterprise: personalEnterprise.id,
                createDate: invitation.createDate,
                info: {
                  type: 'invitation',
                  reward: true,
                  invitation: invitation
                },
                state: 'pending'
              };
            }
          });
        }
        personalEnterprise.setApprovals(approvals);
      }
    }
    function claimReward(invitation, rewardWalletId) {
      if (!invitation || !rewardWalletId) {
        throw new Error('Expcetd invitation and rewardWalletId');
      }
      invitation.accepted = true;
      if (invitation === $rootScope.invitation) {
        return SDK.wrap(SDK.doPost('/matchwallet/invitation/claim', { giftWalletId: rewardWalletId }));
      }
      return SDK.wrap(SDK.doPost('/matchwallet/invitation/' + invitation.id + '/claim', { rewardWalletId: rewardWalletId }));
    }
    function rejectReward(invitation) {
      if (!invitation) {
        throw new Error('Expcetd invitation');
      }
      invitation.rejected = true;
      if (invitation === $rootScope.invitation) {
        return SDK.wrap(SDK.doPost('/matchwallet/invitation/reject'));
      }
      return SDK.wrap(SDK.doPost('/matchwallet/invitation/' + invitation.id + '/reject'));
    }
    $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', setRewardsApproval);
    function init() {
      initEmptyMatchwallets();
    }
    init();
    // In-client API
    return {
      createMatchwallet: createMatchwallet,
      getMatchwallet: getMatchwallet,
      getAllMatchwallets: getAllMatchwallets,
      getInvitation: getInvitation,
      fetchInvitation: fetchInvitation,
      setCurrentMatchwallet: setCurrentMatchwallet,
      sendInvitation: sendInvitation,
      updateMatchwallet: updateMatchwallet,
      setCurrentInvitation: setCurrentInvitation,
      claimReward: claimReward,
      rejectReward: rejectReward,
      invitationGiftPending: invitationGiftPending,
      canSendInvites: canSendInvites
    };
  }
]);/* istanbul ignore next */
angular.module('BitGo.API.PolicyAPI', []).factory('PolicyAPI', [
  '$rootScope',
  'SDK',
  function ($rootScope, SDK) {
    /**
    * Update a policy rule on specified wallet
    * @param params {Object} params for the the policy update
    * @private
    */
    function updatePolicyRule(params) {
      if (!params.rule || !params.bitcoinAddress) {
        throw new Error('invalid params');
      }
      console.log(JSON.stringify(params.rule, null, 2));
      return SDK.wrap(SDK.get().newWalletObject({ id: params.bitcoinAddress }).updatePolicyRule(params.rule));
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
      return SDK.wrap(SDK.get().newWalletObject({ id: params.bitcoinAddress }).deletePolicyRule({ id: params.id }));
    }
    // In-client API
    return {
      updatePolicyRule: updatePolicyRule,
      deletePolicyRule: deletePolicyRule
    };
  }
]);/**
 * @ngdoc service
 * @name ProofsAPI
 * @description
 * Manages the http requests dealing with proof of reserves
 */
/* istanbul ignore next */
angular.module('BitGo.API.ProofsAPI', []).factory('ProofsAPI', [
  '$location',
  'SDK',
  function ($location, SDK) {
    /**
    * List all proofs
    * @private
    */
    function list() {
      return SDK.wrap(SDK.doGet('/proof'));
    }
    /**
    * Get a patner's proof based on hash
    * @private
    */
    function get(proofId) {
      if (!proofId) {
        throw new Error('missing proofId');
      }
      return SDK.wrap(SDK.doGet('/proof/' + proofId));
    }
    /**
    * Get a specific liability proof
    * @private
    */
    function getLiability(params) {
      if (!params.hash) {
        throw new Error('invalid params');
      }
      return SDK.wrap(SDK.doGet('/proof/liability/' + params.hash, {
        user: params.user,
        nonce: params.nonce
      }));
    }
    /** In-client API */
    return {
      get: get,
      getLiability: getLiability,
      list: list
    };
  }
]);angular.module('BitGo.API.ReportsAPI', []).factory('ReportsAPI', [
  '$q',
  '$location',
  '$rootScope',
  'SDK',
  'UtilityService',
  function ($q, $location, $rootScope, SDK, UtilityService) {
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // local copy of the report range for all wallets
    var startDates = {};
    /**
     * Gets the first transaction date for a wallet
     * @param   {object} params { walletAddress: String }
     * @returns {Promise}   promise for { walletId: String, startDate: Date }
     */
    function getWalletStartDate(params) {
      if (typeof startDates[params.walletAddress] !== 'undefined') {
        return $q.when(startDates[params.walletAddress]);
      }
      // Don't use wrap here -- we'll catch in getAllWalletsReportRange
      return $q.when(SDK.doGet('/reports/' + params.walletAddress + '/startDate', {}, 'startDate')).then(function (startDate) {
        // cache it
        startDates[params.walletAddress] = startDate;
        return startDate;
      });
    }
    /**
     * Gets a set of ranges based on a start date and time step
     * @param   {Date} startDate  start date
     * @param   {String} stepType  day|month
     * @returns {[Date]}           array of dates for starting reports
     */
    function getTimeRange(startDate, stepType) {
      var VALID_RANGE_STEP_TYPES = [
          'day',
          'month'
        ];
      console.assert(_.contains(VALID_RANGE_STEP_TYPES, stepType));
      if (!startDate) {
        return [];
      }
      var result = [];
      var now = moment.utc();
      var currentDate = new moment.utc(startDate).startOf(stepType);
      while (currentDate <= now) {
        result.push(new Date(currentDate));
        currentDate.add(1, stepType);
      }
      return result;
    }
    // Get the report range for each wallet in a list of wallets
    // E.g.: all wallets in a specific enterprise
    // The time interval can be configured by stepType ('day' | 'month')
    function getAllWalletsReportRange(params) {
      startDates = {};
      if (!params.wallets) {
        throw new Error('Expect list of wallets when getting report range for a wallet group');
      }
      // Reset the local report range object
      ranges = {};
      var formatDateForStepType = function (time, stepType) {
        console.assert(time instanceof Date);
        switch (stepType) {
        case 'month':
          return moment.utc(time).format('MMMM YYYY');
        // August 2014
        case 'day':
          return moment.utc(time).format('MMMM Do YYYY');
        // August 12th 2014
        default:
          throw new Error('unknown step type ' + stepType);
        }
      };
      // Fetch the report range for each wallet
      var fetches = [];
      _.forIn(params.wallets, function (wallet) {
        var walletData = { walletAddress: wallet.data.id };
        fetches.push(getWalletStartDate(walletData));
      });
      // Return the ranges of report dates
      return $q.all(fetches).then(function (data) {
        ranges = _.mapValues(startDates, function (startDate) {
          var range = getTimeRange(startDate, params.stepType || 'month');
          return range.map(function (start) {
            return {
              startTime: start,
              dateVisible: formatDateForStepType(start, params.stepType)
            };
          });
        });
        return ranges;
      }, PromiseErrorHelper());
    }
    // Get a specific report (based on params) for a specific wallet
    /* istanbul ignore next */
    function getReport(params) {
      return SDK.wrap(SDK.doGet('/reports/' + params.walletAddress, params));
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
]);/* istanbul ignore next */
angular.module('BitGo.API.SettingsAPI', []).factory('SettingsAPI', [
  '$location',
  '$rootScope',
  'SDK',
  function ($location, $rootScope, SDK) {
    function assertAuth(data) {
      console.assert(_.has(data, 'token_type'), 'missing token_type');
      console.assert(_.has(data, 'access_token'), 'missing access_token');
      console.assert(_.has(data, 'expires_in'), 'missing expires_in');
    }
    function assertSettings(settings) {
      console.assert(settings, 'missing settings');
      console.assert(_.has(settings, 'username'), 'missing settings.username');
      console.assert(_.has(settings, 'name'), 'missing settings.name');
      console.assert(_.has(settings.name, 'full'), 'missing settings.name.full');
      console.assert(_.has(settings.name, 'first'), 'missing settings.name.first');
      console.assert(_.has(settings.name, 'last'), 'missing settings.name.last');
      console.assert(_.has(settings, 'email'), 'missing settings.email');
      console.assert(_.has(settings.email, 'email'), 'missing settings.email.email');
      console.assert(_.has(settings.email, 'verified'), 'missing settings.email.verified');
      console.assert(_.has(settings, 'notifications'), 'missing notifications');
      console.assert(_.has(settings, 'isPrivateProfile'), 'missing isPrivateProfile');
      console.assert(_.has(settings.notifications, 'via_email'), 'missing settings.notifications.via_email');
      console.assert(_.has(settings.notifications, 'via_phone'), 'missing settings.notifications.via_phone');
      console.assert(_.has(settings.notifications, 'on_send_btc'), 'missing settings.notifications.on_send_btc');
      console.assert(_.has(settings.notifications, 'on_recv_btc'), 'missing settings.notifications.on_recv_btc');
      console.assert(_.has(settings.notifications, 'on_message'), 'missing settings.notifications.on_message');
      console.assert(_.has(settings.notifications, 'on_btc_change'), 'missing settings.notifications.on_btc_change');
      console.assert(_.has(settings.notifications, 'on_follow'), 'missing settings.notifications.on_follow');
      console.assert(_.has(settings.notifications, 'on_join'), 'missing settings.notifications.on_join');
      console.assert(_.has(settings, 'digest'), 'missing digest');
      console.assert(_.has(settings.digest, 'enabled'), 'missing settings.digest.enabled');
      console.assert(_.has(settings.digest, 'intervalSeconds'), 'missing settings.digest.intervalSeconds');
      return settings;
    }
    // In-client API
    return {
      get: function () {
        return SDK.wrap(SDK.doGet('/user/settings', {}, 'settings').then(function (settings) {
          return assertSettings(settings);
        }));
      },
      save: function (params) {
        if (!params) {
          throw new Error('invalid params');
        }
        return SDK.wrap(SDK.doPut('/user/settings', params));
      },
      savePhone: function (params) {
        if (!params) {
          throw new Error('invalid params');
        }
        return SDK.wrap(SDK.doPost('/user/settings/phone', params));
      }
    };
  }
]);/**
 * @ngdoc service
 * @name ssAPI
 * @description
 * This module is for managing all http requests for all ShapeShift API in the app
 * Also contains other api related methods like a list of errors, get errors etc.
 */
angular.module('BitGo.API.ssAPI', []).factory('ssAPI', [
  '$http',
  '$q',
  '$location',
  '$resource',
  '$rootScope',
  'UtilityService',
  'CacheService',
  function ($http, $q, $location, $resource, $rootScope, UtilityService, CacheService) {
    // Shapeshift API endpoint
    var kApiServer = 'https://shapeshift.io/';
    // simple in-memory
    var coinsList = [];
    /**  Shapeshift errors **/
    var shiftErrors = {
        unknownPair: {
          err: 'Unknown pair',
          msg: 'The selected address is temporarily unavailable for trades. Please try again later.'
        },
        invalidCoinType: {
          err: 'Please enter a valid alt-coin address or change the currency symbol',
          msg: 'Please enter a valid altCoin address or change the coin type'
        },
        invalidCoinAddress: {
          err: 'Please enter a valid address',
          msg: 'Please enter a valid address'
        },
        invalidReturnAddress: {
          err: 'Warning: Return address appears to be invalid for the deposit coin type.(final)',
          msg: 'Return address appears to be invalid for the deposit coin type. Please try again later.'
        },
        unavailableForTrades: {
          err: 'That pair is temporarily unavailable for trades.',
          msg: 'The selected address is temporarily unavailable for trades'
        },
        unableToContactAPI: {
          err: 404,
          msg: 'Unable to connect to ShapeShift. Please try again later.'
        },
        unableToGetSelectedCoin: {
          err: 'unableToGetSelectedCoin',
          msg: 'Please select a type of address to send bitcoins'
        },
        failedGetDepositAddress: {
          err: 'Failed to get deposit address.',
          msg: 'Unable to get deposit address from ShapeShift. Please try again later.'
        },
        shapeShiftWithdrawlAddress: {
          err: 'Please enter an address belonging to an external wallet.',
          msg: 'Please enter an address belonging to an external wallet.'
        },
        limitExceeded: {
          err: 'limitExceeded',
          msg: 'This transaction amount exceeds the ShapeShift limit'
        },
        underLimit: {
          err: 'underLimit',
          msg: 'This transaction amount is below the Shapeshift limit'
        },
        unableToGetDepositAddress: {
          err: 'unableToGetDepositAddress',
          msg: 'Unable to get deposit address from ShapeShift'
        },
        missingAltCoinName: {
          err: 'missingAltCoinName',
          msg: 'An error has occurred. Please try again later.'
        },
        invalidShiftParameters: {
          err: 'invalidShiftParameters',
          msg: 'An error has occurred. Please try again later.'
        },
        timeoutError: {
          err: 0,
          msg: 'Unable to process ShapeShift request. Please try again later.'
        },
        defaultError: {
          err: 'defaultError',
          msg: 'Unable to process ShapeShift request. Please try again later.'
        }
      };
    var coinsImages = {
        BTC: '/img/coins/bitcoin.png',
        BLK: '/img/coins/blackcoin.png',
        BITUSD: '/img/coins/bitusd.png',
        BTS: '/img/coins/bitshares.png',
        BTCD: '/img/coins/bitcoindark.png',
        CLAM: '/img/coins/clams.png',
        XCP: '/img/coins/counterparty.png',
        DASH: '/img/coins/dash.png',
        DGB: '/img/coins/digibyte.png',
        DOGE: '/img/coins/dogecoin.png',
        FTC: '/img/coins/feathercoin.png',
        GEMZ: '/img/coins/gemz.png',
        LTC: '/img/coins/litecoin.png',
        MSC: '/img/coins/mastercoin.png',
        MINT: '/img/coins/mintcoin.png',
        MAID: '/img/coins/maidsafe.png',
        XMR: '/img/coins/monero.png',
        NMC: '/img/coins/namecoin.png',
        NBT: '/img/coins/nubits.png',
        NXT: '/img/coins/nxt.png',
        NVC: '/img/coins/novacoin.png',
        POT: '/img/coins/potcoin.png',
        PPC: '/img/coins/peercoin.png',
        QRK: '/img/coins/quark.png',
        RDD: '/img/coins/reddcoin.png',
        XRP: '/img/coins/ripple.png',
        SDC: '/img/coins/shadowcash.png',
        START: '/img/coins/startcoin.png',
        SJCX: '/img/coins/storjcoinx.png',
        SWARM: '/img/coins/swarm.png',
        USDT: '/img/coins/tether.png',
        UNO: '/img/coins/unobtanium.png',
        VRC: '/img/coins/vericoin.png',
        VTC: '/img/coins/vertcoin.png',
        MONA: '/img/coins/monacoin.png',
        IFC: '/img/coins/infinitecoin.png',
        STR: '/img/coins/stellar.png',
        FLO: '/img/coins/florincoin.png',
        IOC: '/img/coins/iocoin.png',
        NEOS: '/img/coins/neoscoin.png',
        IXC: '/img/coins/ixcoin.png',
        OPAL: '/img/coins/opal.png',
        TRON: '/img/coins/positron.png',
        ARCH: '/img/coins/arch.png',
        DEFAULT: '/img/coins/default.png'
      };
    /**
     * Set into the coinsList object the list of coins
     * @param altCoins {Object} list of coins that comes from the ShapeShift API
     * @private
     */
    function loadAltCoinList(altCoins) {
      if (!altCoins) {
        throw new Error('missing alt coins');
      }
      // Create an entry record for each avaiable coin
      _.forIn(altCoins, function (altCoin) {
        // It is a coin? It is available?
        if (altCoin.status === 'available') {
          coinsList.push(getCoinEntry(altCoin));
        }
      });
    }
    /**
      This function sorts the list of coins based on the name
      property
      A-Z
      @private
    */
    function sortCoins() {
      coinsList.sort(function (a, b) {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
    }
    /**
      Creates a coin object, which is a representation of the coin but with extra attributes.
      @param altCoin Shapeshift object of the coin
      @returns {object}
      @private
    */
    function getCoinEntry(altCoin) {
      var entry = {
          name: altCoin.name,
          symbol: altCoin.symbol,
          image: getCoinImage(altCoin.symbol),
          status: altCoin.status,
          rate: 0,
          limit: 0,
          min: 0,
          minerFee: 0
        };
      return entry;
    }
    /**
      Search in the memory coinsList a coin by name
      @param name Name of the coin to Search
      @returns {object} - coin from coin list
      @private
    */
    function getByName(name) {
      return _.find(coinsList, function (altCoin) {
        return altCoin.name === name;
      });
    }
    /**
      There are two types of errors because of the design of the API
      1. Is when something fail on the request eg. Calling a non existing endpoint,
         this will cause the promise to fail, and the response will be on the format
         { status: 000, statusText: 'Error XXX' }
      2. The second escenario is when something fails internally, in this case
         we are going to receive the response 200, but the json will be like:
         { error: 'Unknown pair'}
      3. This third one is a logic one, so an error caused by us on the process, eg:
         We validate if the amount exceeds what ShapeShift supports, if exceed we throw an Error
         that will be founded here.

      So this function will look in the errors variable a match either for the status
      or the error string, and will return an object that handle several escenarios.
    
    @param {object} error
    @returns {object} - formatted error
    @public
    */
    function getError(error) {
      var err = error;
      // Do we have an error ?
      if (!_.isUndefined(err)) {
        // Find and get the error
        // It is on the message?
        if (!_.isUndefined(error.message)) {
          err = error.message;
        } else if (!_.isUndefined(error.status)) {
          err = error.status;
        }
        /**
          Shapeshift does not have a standard way of telling the user that it is using
          a address different than his chosing,
          Eg:
          Please enter a Bitshares registered account name or change the exchange type
          Please enter a Litecoin address or change the exchange type
        */
        if (err.startsWith('Please enter') && (err.endsWith('or change the currency symbol') || err.endsWith('change the exchange type'))) {
          shiftErrors.invalidCoinType.msg = err;
          return shiftErrors.invalidCoinType;
        }
        return _.find(shiftErrors, function (shiftError) {
          return shiftError.err === err;
        });
      } else {
        return err;
      }
    }
    /**
      Request the list of coins to shapeshift api
      url: shapeshift.io/getcoins
      method: GET

      Success Output:

          {
              "SYMBOL1" :
                  {
                      name: ["Currency Formal Name"],
                      symbol: <"SYMBOL1">,
                      image: ["https://shapeshift.io/images/coins/coinName.png"],
                      status: [available / unavailable]
                  }
              (one listing per supported currency)
          }

      The status can be either "available" or "unavailable". Sometimes coins become temporarily unavailable during updates or
      unexpected service issues.
    */
    function list() {
      // Cache was already loaded - return it
      if (!_.isEmpty(coinsList)) {
        return $q.when(coinsList);
      }
      // Get the list  of coins from ShapeShift
      var resource = $resource(kApiServer + 'getcoins/', {});
      return resource.get({}).$promise.then(function (data) {
        // Does Shapeshift return an error? :(
        if (!_.isUndefined(data.error)) {
          // Let's raise the exception to be handled on the catch block
          throw new Error(data.error);
        }
        // Load the coins in our in-memory object array
        loadAltCoinList(data);
        // Sort the coins
        sortCoins();
        // Return the in=memory object array
        return coinsList;
      });
    }
    /**
      This is the primary data input into ShapeShift
      @public
      @param: {
        url:  shapeshift.io/shift
        method: POST
        data type: JSON
        data required:
        withdrawal     = the address for resulting coin to be sent to
        pair           = what coins are being exchanged in the form [input coin]_[output coin]  ie btc_ltc
        returnAddress  = (Optional) address to return deposit to if anything goes wrong with exchange
        destTag        = (Optional) Destination tag that you want appended to a Ripple payment to you
        rsAddress      = (Optional) For new NXT accounts to be funded, you supply this on NXT payment to you
        apiKey         = (Optional) Your affiliate PUBLIC KEY, for volume tracking, affiliate payments, split-shifts, etc...
      }
      example data: {"withdrawal":"AAAAAAAAAAAAA", "pair":"btc_ltc", returnAddress:"BBBBBBBBBBB"}

      Success Output:
        {
          deposit: [Deposit Address (or memo field if input coin is BTS / BITUSD)],
          depositType: [Deposit Type (input coin symbol)],
          withdrawal: [Withdrawal Address], //-- will match address submitted in post
          withdrawalType: [Withdrawal Type (output coin symbol)],
          public: [NXT RS-Address pubkey (if input coin is NXT)],
          xrpDestTag : [xrpDestTag (if input coin is XRP)],
          apiPubKey: [public API attached to this shift, if one was given]
        }
    */
    function shift(params) {
      // We require the name of the coin to exchange
      if (_.isUndefined(params) || params === null) {
        throw new Error('invalidShiftParameters');
      }
      // Make API call to shapeshift :)
      var resource = $resource(kApiServer + 'shift/', {});
      return resource.save(params).$promise;
    }
    /**
      Create the params object to be passed to the shift endpoint call
      @private
      @param params: 
      {
        recipientAddress: withdrawal address / alt-coin address
        symbol: alt-coin symbol
      }
      @return object which has valid parameters to be passed to the shapeshift api/shift method.
      return {
        pair:           'btc_' + params.symbol,
        returnAddress:  Optional return address
        withdrawal:     recipientAddress
      }
    */
    function getShiftParams(params) {
      // Required parameters
      if (_.isUndefined(params.recipientAddress) || _.isUndefined(params.symbol)) {
        throw new Error('invalidShiftParameters');
      }
      // Do we want to create an address to receive bitcoins?
      if (!_.isUndefined(params.receive) && params.receive === true) {
        return {
          pair: params.symbol + '_btc',
          withdrawal: params.recipientAddress
        };
      } else {
        // Ohh right, we are going to send to an alternative address
        return {
          pair: 'btc_' + params.symbol,
          returnAddress: params.returnAddress,
          withdrawal: params.recipientAddress
        };
      }
    }
    /**
    url: shapeshift.io/marketinfo/[pair]
    method: GET

    [pair] (OPTIONAL) is any valid coin pair such as btc_ltc or ltc_btc.
    The pair is not required and if not specified will return an array of all market infos.

    Success Output:
      {
        "pair"     : "btc_ltc",
        "rate"     : 130.12345678,
        "limit"    : 1.2345,
        "min"      : 0.02621232,
        "minerFee" : 0.0001
      }

      @param {string} name: Symbol of the altcoin
      {boolean} receive: Whether we are sending or receiving altcoins
    */
    function getMarketInfo(name, receive) {
      // We require the name of the coin to exchange, we supposed to never
      // catch this error, if happens we have a bug :(
      if (_.isUndefined(name) || name === null) {
        throw new Error('missingAltCoinName');
      }
      // Get the alt coin loaded from cached
      var altCoin = getByName(name);
      // Pair is the symbol of two different coins
      var pair = 'btc_' + altCoin.symbol;
      // If we are receiving then the pair is alt_coin/btc
      if (receive === true) {
        pair = altCoin.symbol + '_btc';
      }
      // Get the market info from the shapeshift API,
      // we will set the rate to the coin information and return the promise :)
      var resource = $resource(kApiServer + 'marketinfo/' + pair, {});
      return resource.get({}).$promise.then(function (data) {
        // Does Shapeshift return an error? :(
        if (!_.isUndefined(data.error)) {
          // Let's raise the exception to be handled on the catch block
          throw new Error(data.error);
        }
        // Let's finish fullfilling the alt coin object
        altCoin.rate = data.rate;
        altCoin.limit = data.limit;
        altCoin.min = data.minimum;
        altCoin.minerFee = data.minerFee;
        return altCoin;
      });
    }
    /*
      function which gets the altcoin image string. If not present, return default image
      @param {object} coin
      @returns {string} - Source of the altcoin image
      @public
    */
    function getCoinImage(coin) {
      return _.isUndefined(coinsImages[coin]) ? coinsImages.DEFAULT : coinsImages[coin];
    }
    /*
      function used to convert decimal to integer. Multiplies with 1e8
      Used when doing arithmetic with altcoin rate
      @param {Integer} 
      @returns {Integer}
      @public
    */
    function decimalToInteger(val) {
      return parseInt(val * 100000000, 10);
    }
    /*
      function used to convert integer to decimal. Divided with 1e8
      Used when doing arithmetic.
      @param {Integer} 
      @returns {Integer}
      @public
    */
    function integerToDecimal(val) {
      return val / 100000000;
    }
    // In-client API
    return {
      list: list,
      getMarketInfo: getMarketInfo,
      getError: getError,
      getByName: getByName,
      getCoinImage: getCoinImage,
      getShiftParams: getShiftParams,
      shift: shift,
      decimalToInteger: decimalToInteger,
      integerToDecimal: integerToDecimal
    };
  }
]);/**
 * @ngdoc service
 * @name StatusAPI
 * @description
 * Manages the http requests dealing with server status/availability
 */
/* istanbul ignore next */
angular.module('BitGo.API.StatusAPI', []).factory('StatusAPI', [
  'SDK',
  function (SDK) {
    /**
    * Check BitGo service status
    * @private
    */
    function ping() {
      return SDK.wrap(SDK.get().ping());
    }
    /** In-client API */
    return { ping: ping };
  }
]);angular.module('BitGo.API.TransactionsAPI', []).factory('TransactionsAPI', [
  '$location',
  '$rootScope',
  'WalletsAPI',
  'KeychainsAPI',
  'SDK',
  'BG_DEV',
  function ($location, $rootScope, WalletsAPI, KeychainsAPI, SDK, BG_DEV) {
    /**
      * List all historical txs for a wallet
      * @param {object} wallet object
      * @param {object} params for the tx query
      * @returns {array} promise with array of wallettx items
      */
    /* istanbul ignore next */
    function list(wallet, params) {
      if (!wallet || !params) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doGet('/wallet/' + wallet.data.id + '/wallettx', { skip: params.skip || 0 }));
    }
    /**
      * Get the tx history for a single wallettx item
      * @param {string} wallettx id
      * @returns {object} promise with the updated wallettx obj
      */
    /* istanbul ignore next */
    function getTxHistory(walletTxId) {
      if (!walletTxId) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doGet('/wallettx/' + walletTxId));
    }
    /**
      * Update a commment on a wallettx item
      * @param {string} wallet id
      * @param {string} wallettx id
      * @param {string} new comment for the transaction
      * @returns {object} promise with the updated wallettx obj
      */
    /* istanbul ignore next */
    function updateComment(walletId, walletTxId, comment) {
      if (!walletId || !walletTxId || typeof comment === 'undefined') {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPost('/wallettx/' + walletTxId + '/comment', { comment: comment }));
    }
    // In-client API
    return {
      getTxHistory: getTxHistory,
      updateComment: updateComment,
      list: list
    };
  }
]);angular.module('BitGo.API.UserAPI', ['ngResource']).factory('UserAPI', [
  '$location',
  '$q',
  '$rootScope',
  'featureFlags',
  'UserModel',
  'UtilityService',
  'SDK',
  'CacheService',
  'AnalyticsProxy',
  'BG_DEV',
  function ($location, $q, $rootScope, featureFlags, UserModel, UtilityService, SDK, CacheService, AnalyticsProxy, BG_DEV) {
    var PromiseErrorHelper = UtilityService.API.promiseErrorHelper;
    // Cache setup
    var tokenCache = new CacheService.Cache('sessionStorage', 'Tokens');
    var featureCache = new CacheService.Cache('sessionStorage', 'Features');
    // flag which is set for every user when they login. It tracks whether an email has been sent out for verification
    // incase the user has an unverified email
    var emailVerificationCache = new CacheService.Cache('sessionStorage', 'emailVerification');
    var userCache = new CacheService.Cache('localStorage', 'Users', 60 * 60 * 1000);
    var currentUser;
    function endSession() {
      // emit a message so that all wallets/walletshares can be cleared out
      $rootScope.$emit('UserAPI.UserLogoutEvent');
      // Track the successful logout
      AnalyticsProxy.track('Logout');
      AnalyticsProxy.shutdown();
      clearCurrentUser();
      $location.path('/login');
    }
    // When detecting an expired token, end the user's session
    $rootScope.$on('UtilityService.InvalidToken', function (evt, data) {
      endSession();
    });
    function setPlaceholderUser() {
      currentUser = $rootScope.currentUser = new UserModel.PlaceholderUser();
    }
    /* istanbul ignore next */
    function assertAuth(data) {
      console.assert(_.has(data, 'token_type'), 'missing token_type');
      console.assert(_.has(data, 'access_token'), 'missing access_token');
      console.assert(_.has(data, 'expires_in'), 'missing expires_in');
    }
    /**
      * asserts if received data has necessary properties required for fetching other users
      * @param {object} The data received from the server when fetching another user
      */
    /* istanbul ignore next */
    function assertGeneralBitgoUserProperties(user) {
      console.assert(user, 'missing user');
      console.assert(_.has(user, 'id'), 'missing user.id');
      console.assert(_.has(user, 'email'), 'missing user.email');
      console.assert(_.has(user.email, 'email'), 'missing user.email.email');
    }
    /**
      * asserts if received data has necessary properties required for the main user
      * @param {object} The data received from the server for the main user
      */
    /* istanbul ignore next */
    function assertCurrentUserProperties(user) {
      console.assert(user, 'missing user');
      console.assert(_.has(user, 'id'), 'missing user.id');
      console.assert(_.has(user, 'username'), 'missing user.username');
      console.assert(_.has(user, 'name'), 'missing user.name');
      console.assert(_.has(user, 'email'), 'missing user.email');
      console.assert(_.has(user.email, 'email'), 'missing user.email.email');
      console.assert(_.has(user.email, 'verified'), 'missing user.email.verified');
      console.assert(_.has(user, 'isActive'), 'missing user.isActive');
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
    function handleVerification(user) {
      var state;
      if (user.email && !user.email.verified) {
        state = 'needsEmailVerify';
      }
      if (state) {
        // scrub url before setting a new verification link
        UtilityService.Url.scrubQueryString('device');
        UtilityService.Url.scrubQueryString('email');
        $location.path('/login').search(state, true);
        return false;
      }
      return true;
    }
    function setCurrentUser(user) {
      if (user) {
        var hasAccess = handleVerification(user);
        // Set up the app's user
        currentUser = $rootScope.currentUser = new UserModel.User(true, user);
        currentUser.setProperty({ hasAccess: hasAccess });
        Raven.setUser({ id: currentUser.settings.id });
        if (featureCache.get('features')) {
          featureFlags.set(featureCache.get('features'));
        }
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
      SDK.delete();
      featureCache.remove('features');
      if (currentUser.loggedIn) {
        clearAuthToken();
        clearEmailVerificationToken();
        Raven.setUser();
        setCurrentUser();
      }
    }
    // Initialize the factory
    function init() {
      setPlaceholderUser();
    }
    init();
    // In-client API
    /* istanbul ignore sendOTP */
    return {
      init: function () {
        var self = this;
        // If we have a token stored, then we should be able to use the API
        // already.  Attempt to get the current user.
        if (!tokenCache.get('token')) {
          return $q.reject('no token');
        }
        return self.me();
      },
      me: function () {
        return SDK.wrap(SDK.get().me()).then(function (user) {
          assertCurrentUserProperties(user);
          setCurrentUser(user);
          return currentUser;
        });
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
        return SDK.wrap(SDK.get().getUser({ id: userId })).then(function (user) {
          assertGeneralBitgoUserProperties(user);
          var decoratedUser = new UserModel.User(false, user);
          userCache.add(userId, decoratedUser);
          return decoratedUser;
        });
      },
      login: function (params) {
        // Wipe an existing user's token if a new user signs
        // in without logging out of the current user's account
        clearCurrentUser();
        if (currentUser.loggedIn) {
          // logout user so that it clears up wallets and enterprises on scope
          $rootScope.$emit('UserAPI.UserLogoutEvent');
        }
        // Flag for the new client - need email to be verified first
        params.isNewClient = true;
        return SDK.wrap(SDK.get().authenticate({
          username: params.email,
          password: params.password,
          otp: params.otp,
          trust: !!params.trust
        })).then(function (data) {
          // be sure to save the sdk to cache so that we aren't logged out
          // upon browser refresh
          SDK.save();
          assertAuth(data);
          assertCurrentUserProperties(data.user);
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
        }).then(function () {
          return SDK.doGet('/user/gatekeeper');
        }).then(function (result) {
          var features = _.map(result, function (v, k) {
              return {
                key: k,
                active: v
              };
            });
          featureCache.add('features', features);
          featureFlags.set(features);
          return currentUser;
        });
      },
      signup: function (params) {
        // Wipe an existing user's token if a new user signs
        // up without logging out of the current user's account
        clearCurrentUser();
        return SDK.wrap(SDK.doPost('/user/signup', params, 'user')).then(function (user) {
          // Mixpanel Tracking
          AnalyticsProxy.registerUser(user.userID);
          // Track the successful signup
          AnalyticsProxy.track('Signup');
          return user;
        });
      },
      getUserEncryptedData: function () {
        return SDK.wrap(SDK.doPost('/user/encrypted'));
      },
      resetPassword: function (params) {
        if (!params || !params.password || !params.email) {
          throw new Error('Invalid params');
        }
        return SDK.wrap(SDK.doPost('/user/resetpassword', params));
      },
      verifyPassword: function (params) {
        if (!params.password) {
          throw new Error('Expect a password to verify');
        }
        return SDK.wrap(SDK.get().verifyPassword(_.pick(params, ['password']))).then(function (valid) {
          if (valid) {
            return true;
          }
          // If invalid, return a needs passcode error
          var error = new UtilityService.ErrorHelper({
              status: 401,
              data: { needsPasscode: true },
              message: 'invalidPassword'
            });
          return $q.reject(error);
        });
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
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPost('/user/changepassword', params));
      },
      logout: function () {
        $rootScope.$emit('UserAPI.UserLogoutEvent');
        // Regardless of success or fail, we want to clear user data
        return $q.when(SDK.get().logout()).then(function (result) {
          // Track the successful logout
          AnalyticsProxy.track('Logout');
          AnalyticsProxy.shutdown();
          // clearing the SDK cache upon logout to make sure the user doesn't
          // stay logged in.
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
          // even upon a failed logout, we still want to clear the SDK from
          // cache to make sure the user doesn't somehow stay logged in.
          clearCurrentUser();
          $location.path('/login');
          return error;
        });
      },
      endSession: endSession,
      unlock: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.get().unlock(params));
      },
      session: function () {
        /* istanbul ignore next */
        return SDK.wrap(SDK.get().session());
      },
      putClientCache: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPut('/user/clientCache', params));
      },
      getClientCache: function () {
        /* istanbul ignore next */
        return SDK.wrap(SDK.doGet('/user/clientCache'));
      },
      sendOTP: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.get().sendOTP(params));
      },
      newTOTP: function (onSuccess, onError) {
        return SDK.wrap(SDK.doGet('/user/otp/totp'));
      },
      removeOTPDevice: function (params) {
        if (!params.id) {
          throw new Error('OTP ID Missing for removal');
        }
        return SDK.wrap(SDK.doDelete('/user/otp/' + params.id, params));
      },
      addOTPDevice: function (params) {
        // Make sure a params object exists
        if (!params) {
          throw new Error('OTP params Missing');
        }
        if (params.type) {
          return SDK.doPut('/user/otp', params);
        }
      },
      verify: function (parameters) {
        var VALID_TYPES = [
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
        case 'email':
          verifyUrl = '/user/verifyemail';
          break;
        case 'forgotpassword':
          verifyUrl = '/user/verifyforgotpassword';
          break;
        }
        /* istanbul ignore next */
        return SDK.wrap(SDK.doGet(verifyUrl, parameters, 'user')).then(function (user) {
          assertCurrentUserProperties(user);
          return user;
        });
      },
      request: function (params) {
        // Flag for the new client - need email link to be to new client
        // TODO: remove once migrated
        params.isNewClient = true;
        return SDK.wrap(SDK.doPost('/user/requestverification', params));
      },
      forgotpassword: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPost('/user/forgotpassword', params));
      },
      sharingkey: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.get().getSharingKey(params));
      },
      deactivate: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPost('/user/deactivate', params));
      },
      payment: function (paymentParams, subscriptionsParams) {
        if (!paymentParams.token || !subscriptionsParams.planId) {
          throw new Error('Invalid parameters for payment');
        }
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPost('/user/payments', paymentParams)).then(function (data) {
          return SDK.doPost('/user/subscriptions', subscriptionsParams);
        }).catch(PromiseErrorHelper());
      },
      modifyPaymentMethod: function (paymentParams) {
        if (!paymentParams.paymentId || !paymentParams.fingerprint || !paymentParams.type) {
          throw new Error('Missing payment information');
        }
        if (paymentParams.type !== BG_DEV.BILLING.MODIFICATION_TYPE.add && paymentParams.type !== BG_DEV.BILLING.MODIFICATION_TYPE.remove) {
          throw new Error('Invalid payment information');
        }
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPut('/user/payments/' + paymentParams.paymentId, paymentParams));
      },
      createSubscription: function (params) {
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPost('/user/subscriptions', params));
      },
      changeSubscription: function (params, subscriptionId) {
        if (!params.planId || !subscriptionId) {
          throw new Error('Invalid parameters to change subscription');
        }
        /* istanbul ignore next */
        return SDK.wrap(SDK.doPut('/user/subscriptions/' + subscriptionId, params));
      },
      deleteSubscription: function (subscriptionId) {
        if (!subscriptionId) {
          throw new Error('Invalid parameters to change subscription');
        }
        /* istanbul ignore next */
        return SDK.wrap(SDK.doDelete('/user/subscriptions/' + subscriptionId));
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
  '$location',
  '$rootScope',
  'WalletModel',
  'NotifyService',
  'CacheService',
  'LabelsAPI',
  'UserAPI',
  'SDK',
  function ($location, $rootScope, WalletModel, Notify, CacheService, LabelsAPI, UserAPI, SDK) {
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
      return SDK.wrap(SDK.get().wallets().listShares()).then(function (data) {
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
      });
    }
    /**
     * @description
     * Fetches details about a wallet share. Needed for accepting admin or spend wallet shares
     * @params {object} - requires a share id. (The id of the wallet share)
     * @returns {promise} - with data regarding the wallet share from the server
     * @public
     */
    /* istanbul ignore next */
    function getSharedWallet(params) {
      if (!params.walletShareId) {
        throw new Error('Invalid data when getting a wallet share');
      }
      return SDK.wrap(SDK.get().wallets().getShare(params));
    }
    /**
     * create a wallet share with another user
     * @param {String} Wallet id for the wallet to be shared
     * @param {object} params containing details of both users and keychain info for shared wallet
     * @returns {object} promise with data for the shared wallet
     */
    /* istanbul ignore next */
    function createShare(walletId, params) {
      if (!walletId || !params) {
        throw new Error('Invalid data when creating a wallet share');
      }
      return SDK.wrap(SDK.get().newWalletObject({ id: walletId }).createShare(params));
    }
    /**
     * Request a reshare of a wallet from admins on the wallet (just an email + setting a bit for now)
     *
     * @param   {String} walletId   wallet id
     * @param   {Object} params    params (none)
     * @returns {Promise}
     */
    /* istanbul ignore next */
    function requestReshare(walletId, params) {
      if (!walletId || !params) {
        throw new Error('Invalid data when requesting a reshare');
      }
      return SDK.wrap(SDK.doPost('/wallet/' + walletId + '/requestreshare', params));
    }
    /**
     * update a wallet share (either reject or save)
     * @param {object} params with data containing id and state(rejected or accepted)
     * @returns {object} promise with data from the updated share
     */
    /* istanbul ignore next */
    function updateShare(params) {
      return SDK.wrap(SDK.get().wallets().updateShare(params));
    }
    /**
     * update a wallet share (either reject or save)
     * @param {object} params with data containing id and state(rejected or accepted)
     * @returns {object} promise with data from the updated share
     */
    /* istanbul ignore next */
    function cancelShare(params) {
      return SDK.wrap(SDK.get().wallets().cancelShare(params));
    }
    /**
     * resend a wallet share email - for when you have already tried to share a
     * wallet with someone (which should have sent them an email), and you want
     * to send the email again
     *
     * @param {object} params with data containing id
     * @returns {object} promise with object saying whether the share was resent
     */
    /* istanbul ignore next */
    function resendEmail(params) {
      if (!params.walletShareId) {
        throw new Error('Invalid data when resending wallet share');
      }
      return SDK.wrap(SDK.doPost('/walletshare/' + params.walletShareId + '/resendemail', params));
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
  '$rootScope',
  'WalletModel',
  'NotifyService',
  'UtilityService',
  'CacheService',
  'LabelsAPI',
  'SDK',
  function ($q, $location, $rootScope, WalletModel, Notify, UtilityService, CacheService, LabelsAPI, SDK) {
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
    /**
      * Get all approvals given an array of wallets
      * @param list of wallets {Object}
      * @returns list of pending approvals on the wallet{Array}
      * @private
      */
    function getApprovals(wallets) {
      var allWalletsApprovals = [];
      if (wallets) {
        allWalletsApprovals = _(wallets).pluck('data').pluck('pendingApprovals').filter().flatten().value();
      }
      return allWalletsApprovals;
    }
    function setAllEnterpriseApprovals() {
      if (!$rootScope.enterprises.all) {
        console.log('Cannot set approvals on enterprises without a enterprises');
        return false;
      }
      _.forIn($rootScope.enterprises.all, function (enterprise) {
        var approvals = [];
        if (enterprise && enterprise.isPersonal) {
          approvals = getApprovals(getPersonalEnterpriseWallets(allWallets));
          enterprise.setApprovals(approvals);
        } else {
          approvals = getApprovals(getNormalEnterpriseWallets(allWallets, enterprise));
          enterprise.setApprovals(approvals);
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
      // handle wrong url by redirecting them to the dashboard. Create wallet is exception
      if (urlWalletId && !urlCurrentWallet && urlWalletId !== 'create') {
        $location.path('/enterprise/personal/wallets');
      }
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
      return SDK.wrap(SDK.get().wallets().getWallet({
        id: params.bitcoinAddress,
        gpk: params.gpk ? 1 : undefined
      })).then(function (wallet) {
        wallet = new WalletModel.Wallet(wallet.wallet);
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
    function getAllWallets(localWalletsOnly) {
      // Returns all wallets
      if (localWalletsOnly) {
        return allWallets;
      }
      return SDK.wrap(SDK.get().wallets().list({ limit: 500 })).then(function (data) {
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
            var curWallet = data.wallets[idx].wallet;
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
      });
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
      return SDK.wrap(SDK.get().wallets().add(walletData)).then(function (wallet) {
        // TODO (ben): WalletModel.Wallet should be dealing with SDK wallet objects
        // (or being entirely replaced by them, by having the SDK Wallet objects subsume their functionality)
        var decoratedWallet = new WalletModel.Wallet(wallet.wallet);
        walletCache.add(decoratedWallet.data.id, decoratedWallet);
        return decoratedWallet;
      });
    }
    /**
      * Create a new chain address for the wallet
      * @param bitcoinAddress {String}
      * @param chain {Int} is this an internal or external chain
      * @param allowExisting {Bool} if true, allow re-use of existing, unused addresses
      * @returns {Promise}
      */
    /* istanbul ignore next */
    function createChainAddress(bitcoinAddress, chain, allowExisting) {
      var wallet = walletCache.get(bitcoinAddress);
      return SDK.wrap(SDK.get().newWalletObject(wallet.data).createAddress({
        chain: chain,
        allowExisting: allowExisting ? '1' : undefined
      }));
    }
    /**
      * @description Revoke Access to a wallet for a particular user
      * @param {String} The bitcoin address of the wallet you want revoked
      * @param {String} The userId of the person to be revoked
      * @returns {promise} with success/error messages
    */
    /* istanbul ignore next */
    function revokeAccess(bitcoinAddress, userId) {
      if (!bitcoinAddress || !userId) {
        throw new Error('Invalid params');
      }
      var params = { user: userId };
      return SDK.wrap(SDK.doPost('/wallet/' + bitcoinAddress + '/policy/revoke', params));
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
    /* istanbul ignore next */
    function getAllAddresses(params) {
      if (!params.bitcoinAddress || !params.limit || !params.chain.toString()) {
        throw new Error('Invalid params');
      }
      params.sort = params.sort || 1;
      return SDK.wrap(SDK.get().newWalletObject({ id: params.bitcoinAddress }).addresses(params));
    }
    /**
     * Returns info needed to recover a specific wallet
     * @param {String} params for the wallet data recovery fetch
     * @returns {Promise} with wallet recovery info
     * @public
     */
    /* istanbul ignore next */
    function getWalletPasscodeRecoveryInfo(params) {
      if (!params.walletAddress) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPost('/wallet/' + params.walletAddress + '/passcoderecovery'));
    }
    /**
     * Deletes a wallet
     * @param {object} params for the wallet containing bicoin Address information
     * @returns {Promise} with success/error
     * @public
     */
    /* istanbul ignore next */
    function removeWallet(wallet) {
      if (!wallet) {
        throw new Error('Invalid params');
      }
      var params = { walletAddress: wallet.data.id };
      return SDK.wrap(SDK.get().newWalletObject({ id: wallet.data.id }).delete()).then(function () {
        wallet.data.pendingApprovals.forEach(function (pendingApproval) {
          $rootScope.enterprises.current.deleteApproval(pendingApproval.id);
        });
        removeWalletFromScope(wallet);
      });
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
    /* istanbul ignore next */
    function renameWallet(params) {
      if (!params.walletAddress || !params.label) {
        throw new Error('Invalid params');
      }
      return SDK.wrap(SDK.doPut('/wallet/' + params.walletAddress, params));
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
            return '/settings';
          }
        },
        'personal_settings:security': {
          path: function () {
            return '/settings';
          }
        },
        'personal_settings:subscriptions': {
          path: function () {
            return '/settings';
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
        if ($rootScope.enterprises.current && enterprise.id === $rootScope.enterprises.current.id || _.keys(enterprise.pendingApprovals).length + enterprise.walletShareCount.incoming === 0) {
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
    $scope.isPage = function (pagePath) {
      return $location.path() === pagePath;
    };
    /**
     * Logic to show to settings icon at the top nav bar
     * @public
     */
    $scope.canShowEnterpriseSettingsIcon = function () {
      if ($rootScope.enterprises && $rootScope.enterprises.current) {
        return $rootScope.enterprises.current.isAdmin && !$rootScope.enterprises.current.isPersonal && !Utils.Url.isAccountSettingsPage() && !Utils.Url.isCreateEnterprisePage();
      }
      return false;
    };
    /**
     * Logic to turn the top nav dropdown title blue if user is in settings
     * @public
     */
    $scope.isAccountSettingsSection = function () {
      return Utils.Url.isAccountSettingsPage();
    };
    /**
     * Logic to use when deciding if a url is enterprise settings
     * @public
     */
    $scope.isEnterpriseSettingsSection = function () {
      return Utils.Url.isEnterpriseSettingsPage();
    };
    /**
     * Logic to turn the top nav dropdown title blue if user is create enterprise
     * @public
     */
    $scope.isCreateEnterpriseSection = function () {
      return Utils.Url.isCreateEnterprisePage();
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
     * Go to the create enterprise section of the app
     * @public
     */
    $scope.goToAddEnterprise = function () {
      $location.path('/create-organization');
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
    $scope.goToEnterpriseSettings = function (enterprise) {
      if (!enterprise) {
        throw new Error('missing args');
      }
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
    var killBitcoinPriceListener = $rootScope.$on('MarketDataAPI.AppCurrencyUpdated', function (event, currencyData) {
        if (currencyData && currencyData.data && currencyData.data.current && currencyData.data.current.last) {
          $scope.priceDisplay = parseFloat(currencyData.data.current.last).toFixed(2);
        }
      });
    // Listen for the ng-view main content to be loaded
    var killViewLoadListener = $scope.$on('$viewContentLoaded', function () {
        $scope.isViewLoaded = true;
      });
    // Clean up the event listeners when the scope is destroyed
    // This keeps the angular run loop leaner and reduces the odds that
    // a reference to this scope is kept once the controller is scrapped
    $scope.$on('$destroy', function () {
      killPlaceholderUserSetListener();
      killUserSetListener();
      killBitcoinPriceListener();
      killViewLoadListener();
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
  '$location',
  'NotifyService',
  '$q',
  'MatchwalletAPI',
  'ApprovalsAPI',
  function ($rootScope, $timeout, EnterpriseAPI, WalletsAPI, WalletSharesAPI, $location, Notify, $q, MatchwalletAPI, ApprovalsAPI) {
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
  'BitGo.Auth.ServicesAgreementFormDirective',
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
      'setOtpDevice',
      'verifyPhone',
      'otp',
      'totpSetup',
      'terms'
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
    $scope.trustMachine = false;
    // list of enterprises which need to upgrade their service agreement version
    $scope.enterprisesList = [];
    $scope.setPostauth = function () {
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
    };
    var killUserLoginListener = $scope.$on('SignUserIn', function () {
        // empty the enterprise list
        $scope.enterprisesList = [];
        if ($rootScope.currentUser.isEnterpriseCustomer()) {
          return EnterpriseAPI.getServicesAgreementVersion().then(function (data) {
            // check each enterprise the user is on, check the version
            _.forEach($rootScope.currentUser.settings.enterprises, function (enterprise) {
              // if the latest version is not present, don't do anything
              if ($rootScope.enterprises.all[enterprise.id].latestSAVersionSigned === undefined) {
                return;
              }
              if (data.version > $rootScope.enterprises.all[enterprise.id].latestSAVersionSigned) {
                $scope.enterprisesList.push(enterprise.id);
              }
            });
            // If there is any enterprise which needs to be updated
            if ($scope.enterprisesList.length > 0) {
              return $scope.$emit('SetState', 'terms');
            }
            $scope.setPostauth();
          });
        }
        $scope.setPostauth();
      });
    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function (evt, data) {
        // stores settings returned after creating ecdh key for user
        var newSettings;
        $scope.user = $rootScope.currentUser;
        //check if user has ECDH keychain. If not, make it for her/him
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
          password: safePassword,
          otp: $scope.otpCode,
          forceSMS: !!forceSMS,
          trust: $scope.trustMachine
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
          'setOtpDevice',
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
  'UserAPI',
  function (Util, Notify, RequiredActionService, BG_DEV, AnalyticsProxy, UserAPI) {
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
            if (!$scope.user.settings.email.verified) {
              return $scope.$emit('SetState', 'needsEmailVerify');
            }
            // check the OTP devices
            if (user.settings.otpDevices.length) {
              return $scope.$emit('SignUserIn');
            }
            UserAPI.getClientCache().then(function (cache) {
              // if the verified user object has been returned and user
              // needs OTP, set access to false
              if (!cache.bypassSetOTP) {
                // if the verified user object has been returned and user
                // needs OTP, set access to false
                $scope.user.hasAccess = false;
                return $scope.$emit('SetState', 'setOtpDevice');
              }
              $scope.$emit('SignUserIn');
            });
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
            if ($scope.clearFormError) {
              $scope.clearFormError();
            }
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
  'SDK',
  function ($scope, $rootScope, $location, NotifyService, UtilityService, UserAPI, BG_DEV, SDK) {
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
            password: SDK.passwordHMAC(resetParams.email, $scope.form.password)
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
]);/**
 * @ngdoc directive
 * @name servicesAgreementForm
 * @description
 * This directive manages the form to agree to a new services agreement
 * @example
 *   <div services-agreement-form></div>
 */
angular.module('BitGo.Auth.ServicesAgreementFormDirective', []).directive('servicesAgreementForm', [
  'EnterpriseAPI',
  'NotifyService',
  function (EnterpriseAPI, Notify) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: [
        '$scope',
        function ($scope) {
          // variable to keeps track of whether the user has agreed to the agreement
          $scope.agreeToTerms = false;
          // TODO: on service agreement updates, change the file this points to
          $scope.ServicesAgreementSource = 'marketing/templates/services_agreement_v1.html';
          /**
         * Handles submit of services agreement form
         * @public
         */
          $scope.submitTerms = function () {
            // Clear any errors
            $scope.clearFormError();
            if ($scope.agreeToTerms) {
              EnterpriseAPI.updateServicesAgreementVersion({ enterpriseIds: $scope.enterprisesList }).then($scope.setPostauth).catch(submitTermsFail);
            } else {
              $scope.setFormError('Please agree to the services agreement.');
            }
          };
          function submitTermsFail() {
            Notify.error('There was an error in updating the services agreement version. Please contact BitGo');
            // Take them to the dashboard anyway
            $scope.setPostauth();
          }
        }
      ]
    };
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
          // Sets a new (unverified) phone number on the user
          // Note: as long as the phone number is not verified, we can set new phone
          // numbers on the user and sent otps to them -- but once verified, there
          // is an entirely different flow/route to change their phone number
          $scope.submitSetPhone = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              // Track the phone set success
              AnalyticsProxy.track('SetPhone');
              UserAPI.sendOTP({ phone: $scope.user.settings.phone.phone }).then(function () {
                $scope.$emit('SetState', 'verifyPhone');
              });
            } else {
              $scope.setFormError('Please add a valid phone number.');
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
    // Fields needed so to lock password and email from lastpass
    $scope.lockedPassword = null;
    $scope.lockedEmail = null;
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
  '$location',
  '$routeParams',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  'AnalyticsUtilities',
  'SDK',
  function ($rootScope, $timeout, $location, $routeParams, UserAPI, Util, Notify, BG_DEV, AnalyticsProxy, AnalyticsUtilities, SDK) {
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
            if (!Util.Validators.emailOk($scope.lockedEmail)) {
              $scope.setFormError('Please enter a valid email.');
              trackClientSignupFail('Invalid Email');
              return false;
            }
            if (!$scope.lockedPassword) {
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
            if ($scope.lockedPassword != $scope.passwordConfirm) {
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
            if (!$routeParams.email || $routeParams.email != $scope.lockedEmail) {
              return $scope.$emit('SetState', 'confirmEmail');
            }
            UserAPI.login({
              email: user.username,
              password: $scope.lockedPassword
            }).then(function () {
              $location.search('setOtpDevice', '1');
              $location.path('/login');
            });
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
            setLockedPassword();
            if (formIsValid()) {
              var formattedEmail = Util.Formatters.email($scope.lockedEmail);
              var newUser = {
                  email: formattedEmail,
                  password: SDK.passwordHMAC(formattedEmail, $scope.lockedPassword)
                };
              if (typeof $routeParams.token !== 'undefined') {
                newUser.token = $routeParams.token;
              }
              // if there's a referral going on and the utm source and campaign aren't empty, we wanna forward that
              if ($routeParams.utm_medium === 'referral' && $routeParams.utm_source && $routeParams.utm_campaign) {
                newUser.utm_campaign = $routeParams.utm_campaign;
                newUser.utm_source = $routeParams.utm_source;
              }
              UserAPI.signup(newUser).then(signupSuccess).catch(signupFail);
            }
          };
          function init() {
            // init an instance of the password time-to-complete tracker
            analyticsPasswordMonitor = new AnalyticsUtilities.time.PasswordCompletionMonitor();
            if ($routeParams.email) {
              $scope.user.settings.email.email = $routeParams.email;
            }
          }
          init();
        }
      ]
    };
  }
]);angular.module('BitGo.Auth.TwoFactorFormDirective', []).directive('twoFactorForm', [
  'UserAPI',
  'SettingsAPI',
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  'featureFlags',
  function (UserAPI, SettingsAPI, Util, Notify, BG_DEV, AnalyticsProxy, featureFlags) {
    return {
      restrict: 'A',
      require: '^LoginController',
      controller: [
        '$scope',
        '$rootScope',
        '$location',
        function ($scope, $rootScope, $location) {
          $scope.twoFactorMethods = [
            'totp',
            'yubikey',
            'authy',
            'text'
          ];
          $scope.twoFactorMethod = 'totp';
          /**
         * Checks if the user has a verified email before allowing login
         * @private
         */
          function userHasAccess() {
            if (!$scope.user.settings.email.verified) {
              $scope.$emit('SetState', 'needsEmailVerify');
              return false;
            }
            return true;
          }
          function formIsValid() {
            return Util.Validators.otpOk($scope.otpCode);
          }
          /**
         * Handle successful OTP push
         * @private
         */
          function onSendOTPSuccess() {
            // Clear any form errors
            $scope.clearFormError();
            // Set params for OTP device type
            var params = { type: $scope.forceSMS ? 'text' : 'authy' };
            AnalyticsProxy.track('OTP', params);
            // Route user to verification page
            $scope.setState('verifyPhone');
          }
          /**
         * Handle failed OTP push
         * @private
         */
          function onSendOTPFail() {
            // Clear any form errors
            $scope.clearFormError();
            // Set params for OTP device type
            var params = { type: $scope.forceSMS ? 'text' : 'authy' };
            // Track phone verification success
            AnalyticsProxy.track('OTP', params);
            // Provide error feedback
            $scope.setFormError('Please enter a valid phone number.');
          }
          /**
         * Handle successful Totp verification from the BitGo service
         * @param user {Object}
         * @private
         */
          function onTotpSuccess(user) {
            // Set params for OTP device type
            var params = { type: 'totp' };
            // Track phone verification success
            AnalyticsProxy.track('AddOTPDevice', params);
            if (userHasAccess()) {
              $scope.$emit('SignUserIn');
            }
          }
          /**
         * Handle failed Totp from the BitGo service
         * @param error {Object}
         * @private
         */
          function onTotpFail(error) {
            // Track the server verification fail
            var params = {
                status: error.status,
                message: error.error,
                action: 'AddOTPDevice',
                type: 'totp'
              };
            AnalyticsProxy.track('Error', params);
            Notify.error('Please enter a valid code');
          }
          /**
         * Handle successful Yubikey verification from the BitGo service
         * @param user {Object}
         * @private
         */
          function onYubikeySuccess(user) {
            var params = { type: 'yubikey' };
            // Track phone verification success
            AnalyticsProxy.track('AddOTPDevice', params);
            if (userHasAccess()) {
              $scope.$emit('SignUserIn');
            }
          }
          /**
         * Handle failed yubikey from the BitGo service
         * @param error {Object}
         * @private
         */
          function onYubikeyFail(error) {
            // Track the server verification fail
            var metricsData = {
                status: error.status,
                message: error.error,
                action: 'AddOTPDevice',
                type: 'yubikey'
              };
            AnalyticsProxy.track('Error', metricsData);
            Notify.error('Please enter a valid code');
          }
          /**
         * Handle successful phone verification from the BitGo service
         * @param user {Object}
         * @private
         */
          function onVerifySuccess(user) {
            var params = { type: 'authy' };
            // Track phone verification success
            AnalyticsProxy.track('AddOTPDevice', params);
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
                action: 'AddOTPDevice',
                type: 'authy'
              };
            AnalyticsProxy.track('Error', metricsData);
            Notify.error('Please enter a valid code');
          }
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
         * Allows user to defer two-step verification setup
         * @public
         */
          $scope.deferTwoFactor = function () {
            var params = {
                key: 'bypassSetOTP',
                value: 'true'
              };
            if (userHasAccess()) {
              return UserAPI.me().then(UserAPI.putClientCache(params)).then(function () {
                $scope.$emit('SignUserIn');
              });
            }
          };
          $scope.sendOTP = function (forceSMS) {
            // Clear any errors
            $scope.clearFormError();
            $scope.forceSMS = !!forceSMS;
            var params = {
                phone: $scope.user.settings.phone.phone,
                forceSMS: $scope.forceSMS
              };
            return UserAPI.sendOTP(params).then(onSendOTPSuccess).catch(onSendOTPFail);
          };
          $scope.submitVerifyPhone = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var params = {
                  type: 'authy',
                  otp: $scope.otpCode,
                  phone: $scope.user.settings.phone.phone,
                  label: 'Authy',
                  forceSMS: $scope.forceSMS
                };
              UserAPI.addOTPDevice(params).then(function () {
                return UserAPI.me();
              }).then(onVerifySuccess).catch(onVerifyFail);
            } else {
              $scope.setFormError('Please enter a valid 2-step verification code.');
            }
          };
          $scope.newTotp = function () {
            $scope.state = 'totpSetup';
            $scope.clearFormError();
            return UserAPI.newTOTP().then(function (totpUrl) {
              $scope.totpUrl = totpUrl;
            });
          };
          $scope.setTotp = function () {
            var params = {
                type: 'totp',
                otp: $scope.otpCode,
                hmac: $scope.totpUrl.hmac,
                key: $scope.totpUrl.key,
                label: 'Google Authenticator'
              };
            return UserAPI.addOTPDevice(params).then(function () {
              return UserAPI.me();
            }).then(onTotpSuccess).catch(onTotpFail);
          };
          $scope.cancelTotp = function () {
            return $scope.$emit('SetState', 'setOtpDevice');
          };
          $scope.submitSetYubikey = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              var params = {
                  type: 'yubikey',
                  otp: $scope.otpCode,
                  label: $scope.otpLabel
                };
              UserAPI.addOTPDevice(params).then(function () {
                return UserAPI.me();
              }).then(onYubikeySuccess).catch(onYubikeyFail);
            } else {
              $scope.setFormError('Please enter a valid Yubikey verification code.');
            }
          };
          $scope.submitOTP = function () {
            // Clear any errors
            $scope.clearFormError();
            if (formIsValid()) {
              $scope.attemptLogin().then(onSubmitOTPSuccess).catch(onSubmitOTPFail);
            } else {
              $scope.setFormError('Please enter a valid 2-step verification code.');
            }
          };
          $scope.resendOTP = function (forceSMS) {
            // Track the text resend
            AnalyticsProxy.track('ResendOtp');
            if ($scope.user.loggedIn) {
              // If there is a session user, they are verifying their phone
              // and we can use the sendOTP protected route
              var params = {
                  phone: $scope.user.settings.phone.phone,
                  forceSMS: !!forceSMS
                };
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
  '$rootScope',
  '$location',
  'UserAPI',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  function ($scope, $rootScope, $location, UserAPI, NotifyService, BG_DEV, AnalyticsProxy) {
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
            scope.verb = 'Add';
            return;
          }
          scope.addressInQuestion = scope.policyData.condition.remove;
          scope.verb = 'Remove';
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
  'SDK',
  function ($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, WalletsAPI, SyncService, BG_DEV, SDK) {
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
                    if (!result.data.otp && $rootScope.currentUser.settings.otpDevices > 0) {
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
          // TODO(ben): replace with SDK's shareWallet method?
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
                var xprv = SDK.decrypt($scope.password, data.encryptedXprv);
                // init a new bip32 object based on the xprv from the server
                var testHDNode;
                try {
                  testHDNode = SDK.bitcoin.HDNode.fromBase58(xprv);
                  console.assert(testHDNode.privKey);
                } catch (e) {
                  error.error = 'Could not share wallet. Invalid private key';
                  return $q.reject(error);
                }
                var testXpub = testHDNode.neutered().toBase58();
                // check if the xprv returned matches the xpub sent to the server
                if ($rootScope.wallets.all[$scope.walletId].data.private.keychains[0].xpub !== testXpub) {
                  error.error = 'This is a legacy wallet and cannot be shared.';
                  return $q.reject(error);
                }
                var eckey = SDK.bitcoin.ECKey.makeRandom();
                var secret = SDK.get().getECDHSecret({
                    otherPubKeyHex: createShareParams.keychain.toPubKey,
                    eckey: eckey
                  });
                createShareParams.keychain.fromPubKey = eckey.pub.toHex();
                createShareParams.keychain.encryptedXprv = SDK.encrypt(secret, xprv);
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
          /* istanbul ignore next - all functionality provided by modal controller */
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
 * @name bgApprovalTileEnterpriseRequest
 * @description
 * This directive manages the approval tile state for enterprise level approvals
 * @example
 *   <span bg-approval-tile-enterprise-request>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTileEnterpriseRequestDirective', []).directive('bgApprovalTileEnterpriseRequest', [
  '$rootScope',
  'ApprovalsAPI',
  'NotifyService',
  'BG_DEV',
  'SyncService',
  '$location',
  'EnterpriseAPI',
  'UtilityService',
  function ($rootScope, ApprovalsAPI, NotifyService, BG_DEV, SyncService, $location, EnterpriseAPI, UtilityService) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          /** All valid tile view states */
          $scope.viewStates = ['initial'];
          /** Show different templates if the approval is one the currentUser created */
          $scope.userIsCreator = $rootScope.currentUser.settings.id === $scope.approvalItem.creator;
          /**
        * Initializes the directive's controller state
        * @private
        */
          function init() {
            $scope.state = 'initial';
            $scope.approvalItem.prettyDate = new moment($scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');
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
              id: scope.approvalItem.id
            };
          ApprovalsAPI.update(data.id, data).then(function (result) {
            $('#' + scope.approvalItem.id).animate({
              height: 0,
              opacity: 0
            }, 500, function () {
              scope.$apply(function () {
                // remove the approval from the appropriate places
                $rootScope.enterprises.current.deleteApproval(scope.approvalItem.id);
                //if the approval results in removing the current user from the enterprise
                if (result.info.updateEnterpriseRequest && result.info.updateEnterpriseRequest.action == 'remove' && result.info.updateEnterpriseRequest.userId === $rootScope.currentUser.settings.id) {
                  // check if there are no wallets and if it was an approval
                  if (_.isEmpty($rootScope.wallets.all) && newState == 'approved') {
                    EnterpriseAPI.setCurrentEnterprise($rootScope.enterprises.all.personal);
                    $location.path('/enterprise/personal/wallets');
                  }
                }
                // handle the DOM cleanup
                $('#' + scope.approvalItem.id).remove();
                scope.$destroy();
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
 * @name
 * @description
 * 
 * @example
 *   <span bg-approval-tile-invitation>TILE CONTEXT</span>
 */
angular.module('BitGo.Common.BGApprovalTileInvitation', []).directive('bgApprovalTileInvitation', [
  '$rootScope',
  '$location',
  'MatchwalletAPI',
  function ($rootScope, $location, MatchwalletAPI) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          /** All valid tile view states */
          $scope.viewStates = ['initial'];
          /** Reward wallet ID will be set here from matchwallet-reward-wallet directive */
          $scope.rewardWalletId = null;
          $scope.goToIdentityVerification = function () {
            $location.path('/identity/verify');
          };
          $scope.goToCreateWallet = function () {
            $location.path('/enterprise/personal/wallets/create');
          };
          /**
        * Initializes the directive's controller state
        * @private
        */
          function init() {
            $scope.state = 'initial';
            $scope.approvalItem.prettyDate = new moment($scope.approvalItem.createDate).format('MMMM Do YYYY, h:mm:ss A');
            $scope.rewardWalletId = _.findLastKey($rootScope.wallets.all);
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
        // User can approve if they have verified their identity and created a wallet
        var isIdentified = $rootScope.currentUser.settings.identity.verified;
        if (scope.approvalItem.info.gift) {
          scope.canClaimReward = isIdentified && scope.rewardWalletId;
        } else if (scope.approvalItem.info.reward) {
          scope.canClaimReward = isIdentified && scope.approvalItem.info.invitation.giftClaimed && scope.rewardWalletId;
        }
        // If invited user accepted their invitation
        if (scope.approvalItem.info.reward) {
          scope.invitationAccepted = scope.approvalItem.info.invitation.giftClaimed;
        }
        // Animate and remove approval
        function removeItem() {
          $('#' + scope.approvalItem.id).animate({
            height: 0,
            opacity: 0
          }, 500, function () {
            scope.$apply(function () {
              // remove the approval from the appropriate places
              $('#' + scope.approvalItem.id).remove();
              scope.$destroy();
            });
          });
        }
        /**
        * Updates a pending approval's state / and the DOM once set
        * @param {string} approval's new state to set
        * @public
        */
        scope.setApprovalState = function (newState) {
          if (_.indexOf(validApprovalTypes, newState) === -1) {
            throw new Error('Expect valid approval state to be set');
          }
          if (newState === 'approved') {
            MatchwalletAPI.claimReward(scope.approvalItem.info.invitation, scope.rewardWalletId).then(removeItem);
          }
          if (newState === 'rejected') {
            MatchwalletAPI.rejectReward(scope.approvalItem.info.invitation).then(removeItem);
          }
        };
      }
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
          ApprovalsAPI.update(data.id, data).then(function (result) {
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
  '$q',
  '$modal',
  '$rootScope',
  'ApprovalsAPI',
  'TransactionsAPI',
  'SDK',
  'NotifyService',
  'UtilityService',
  'BG_DEV',
  'AnalyticsProxy',
  'UserAPI',
  function ($q, $modal, $rootScope, ApprovalsAPI, TransactionsAPI, SDK, NotifyService, UtilityService, BG_DEV, AnalyticsProxy, UserAPI) {
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
        // function which returns a needs unlock error
        function otpError() {
          return $q.reject(UtilityService.ErrorHelper({
            status: 401,
            data: {
              needsOTP: true,
              key: null
            },
            message: 'Missing otp'
          }));
        }
        /**
         * Get the outputs from a transaction hex
         *
         * @param {String} txhex a transaction in hex format
         *
         * @returns {Object} addresses and values measured in satoshis in the form:
         *                   {address1: value1, address2: value2, ...}
         * @private
         */
        function getRecipients(txhex) {
          var bitcoin = SDK.bitcoin;
          var tx = bitcoin.Transaction.fromHex(txhex);
          var recipients = {};
          // note that this includes change addresses
          tx.outs.forEach(function (txout) {
            var address = bitcoin.Address.fromOutputScript(txout.script, SDK.getNetwork()).toBase58Check();
            if (typeof recipients[address] === 'undefined') {
              recipients[address] = txout.value;  // value is measured in satoshis
            } else {
              // The SDK's API does not support sending multiple different
              // values to the same address. We have no choice but to throw an
              // error in this case - we can't approve the transaction. Note
              // that BitGo would never generate such a transaction, and the
              // only way this would occur is if a user is going out of their
              // way to produce a transaction with multiple outputs to the same
              // address. TODO: Update the SDK's API to support sending
              // multiple values to the same address.
              throw new Error('The same address is detected more than once in the outputs. Approval process does not currently support this case.');
            }
          });
          return recipients;
        }
        /**
         * Submit the tx to bitgo and see if it is valid before approving the approval
         *
         * @returns {undefined}
         */
        scope.submitTx = function () {
          // To approve a transaction, the inputs may have been already spent,
          // so we must build and sign a new transaction.
          var recipients;
          try {
            scope.txInfo.transaction = scope.approvalItem.info.transactionRequest;
            recipients = getRecipients(scope.txInfo.transaction.transaction);
          } catch (error) {
            NotifyService.error('There is an issue with this transaction. Please refresh the page and try your action again.');
            return;
          }
          if (Object.keys(recipients).length === 2) {
            // If the number of outputs is 2, then there is one destination
            // address, and one change address. Of the transaction outputs, now
            // contained insidethe recipients object, find the one that is to
            // the destinationAddress, and set recipients to that, so we can
            // rebuild a transaction to the correct destination address and
            // potentially a new change address. If the number of outputs is
            // NOT two, then we leave the "recipients" as is, which will leave
            // the outputs set to the multiple different destination addresses
            // plus the change addresses.
            var destinationAddress = scope.txInfo.transaction.destinationAddress;
            recipients = _.pick(recipients, [destinationAddress]);
          }
          scope.processing = true;
          var txhex, wallet, unspents;
          return UserAPI.session().then(function (session) {
            if (session) {
              // if the data returned does not have an unlock object, then the user is not unlocked
              if (!session.unlock) {
                return otpError();
              } else {
                // if the txvalue for this unlock exeeds transaction limit, we need to unlock again
                if (session.unlock.txValue !== 0 && scope.txInfo.transaction.requestedAmount > session.unlock.txValueLimit - session.unlock.txValue) {
                  return otpError();
                }
              }
              return $q.when(SDK.get().wallets().get({ id: scope.approvalItem.bitcoinAddress }));
            }
            throw new Error('Could not fetch user session');
          }).then(function (res) {
            wallet = res;
            return wallet.createTransaction({
              recipients: recipients,
              minConfirms: 1,
              enforceMinConfirmsForChange: false
            });
          }).then(function (res) {
            txhex = res.transactionHex;
            // unsigned txhex
            unspents = res.unspents;
            var fee = res.fee;
            // TODO: Display this fee
            return wallet.getEncryptedUserKeychain({});
          }).then(function (keychain) {
            // check if we have the passcode.
            // Incase the user has been unlocked, we dont have the passcode and need to return an error to pop up the modal
            if (!scope.txInfo.passcode) {
              return $q.reject(UtilityService.ErrorHelper({
                status: 401,
                data: {
                  needsPasscode: true,
                  key: null
                },
                message: 'Missing password'
              }));
            }
            // check if encrypted xprv is present. It is not present for cold wallets
            if (!keychain.encryptedXprv) {
              return $q.reject(UtilityService.ErrorHelper({
                status: 401,
                data: {},
                message: 'Cannot transact. No user key is present on this wallet.'
              }));
            }
            keychain.xprv = SDK.decrypt(scope.txInfo.passcode, keychain.encryptedXprv);
            return wallet.signTransaction({
              transactionHex: txhex,
              keychain: keychain,
              unspents: unspents
            });
          }).then(function (tx) {
            scope.txInfo.tx = tx.tx;
            // signed txhex
            scope.submitApproval('approved');
          }).catch(function (error) {
            if (UtilityService.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock }).then(function (result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  if (!result.data.otp && $rootScope.currentUser.settings.otpDevices > 0) {
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
            'userChangeRequest': true,
            'updateEnterpriseRequest': true
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
 * @name bgCreditCardFormDirective
 * @description
 * Directive to manage the credit card form
 * @example
 *   <div bg-credit-card-form></div>
 */
/**/
angular.module('BitGo.Common.BGCreditCardForm', []).directive('bgCreditCardForm', [
  '$rootScope',
  'BG_DEV',
  '$http',
  '$compile',
  '$templateCache',
  'NotifyService',
  '$location',
  'AnalyticsUtilities',
  function ($rootScope, BG_DEV, $http, $compile, $templateCache, Notify, $location, AnalyticsUtilities) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // Will be the instance of our credit card tracking monitor
          var creditCardCompletionMonitor;
          // Bool to init the card tracking monitor only once per tab load
          var cardMonitorInitialized;
          // Holds user payment data
          $scope.cc = {
            cvc: undefined,
            expiry: undefined,
            number: undefined,
            name: undefined
          };
          /**
        * Parses the cc expiration date
        *
        * @returns { Array } ['month', 'year']
        * @private
        */
          function parseExpry() {
            if (!$scope.cc.expiry) {
              return [];
            }
            return $scope.cc.expiry.replace(/ /g, '').split('/');
          }
          /**
        * Check if the payment form is valid
        *
        * @returns { Bool }
        * @private
        */
          function formValid() {
            try {
              if (!$scope.cc.name) {
                $scope.setFormError('Please provide the cardholder\'s name.');
                return false;
              }
              if (!Stripe.card.validateCardNumber($scope.cc.number)) {
                $scope.setFormError('Please enter a valid credit card number.');
                return false;
              }
              if (!$scope.cc.expiry || !Stripe.card.validateExpiry(parseExpry()[0], parseExpry()[1])) {
                $scope.setFormError('Please enter a valid expiration date.');
                return false;
              }
              if (!Stripe.card.validateCVC($scope.cc.cvc)) {
                $scope.setFormError('Please enter a valid cvc.');
                return false;
              }
              if ($scope.checkTerms && !$scope.terms) {
                $scope.setFormError('Please agree to the terms and conditions.');
                return false;
              }
              return true;
            } catch (e) {
              Notify.error('Could not validate credit card. ' + e.message + '. Please refresh and try again.');
            }
          }
          /**
        * UI - Track the user completing entrance of a valid credit card
        *
        * @private
        */
          function trackCard() {
            if (!$scope.userPlan || !$scope.selectedPlan || !$scope.userPlan.name || !$scope.selectedPlan.name) {
              return;
            }
            var evtData = {
                currentPlan: $scope.userPlan.name,
                selectedPlan: $scope.selectedPlan.name
              };
            creditCardCompletionMonitor.track('EnterCard', evtData);
          }
          /**
        * UI - Submit the user's credit card for payment
        *
        * @public
        */
          $scope.submitCard = function () {
            if (formValid()) {
              var stripeData = {
                  name: $scope.cc.name,
                  number: $scope.cc.number,
                  cvc: $scope.cc.cvc,
                  exp_month: parseExpry()[0],
                  exp_year: parseExpry()[1]
                };
              $scope.inProcess = true;
              Stripe.setPublishableKey(BG_DEV.STRIPE.TEST.PUBKEY);
              Stripe.card.createToken(stripeData, function (status, result) {
                if (result.error) {
                  $scope.inProcess = false;
                  Notify.error(result.error.message);
                  return;
                } else {
                  $scope.$emit('BGCreditCardForm.CardSubmitted', result);
                }
              });
            }
          };
          /**
        * UI - Track the user's first entrance of credit card data into the form
        *
        * @public
        */
          $scope.initCardTracker = function () {
            if (cardMonitorInitialized) {
              return;
            }
            cardMonitorInitialized = true;
            trackCard();
          };
          var killCardWatcher = $scope.$watch('cc.number', function () {
              if (typeof $scope.cc.number !== 'string' || $scope.cc.number === '') {
                return;
              }
              trackCard();
            });
          // Clean up when the scope is destroyed
          $scope.$on('$destroy', function () {
            // remove listeners
            killCardWatcher();
          });
          function init() {
            // set up credit card tracking
            creditCardCompletionMonitor = new AnalyticsUtilities.time.CreditCardCompletionMonitor();
            cardMonitorInitialized = false;
          }
          init();
        }
      ],
      link: function (scope, element, attrs) {
        // if terms are added to form (note: attrs have to be lower case letters)
        if (attrs.addterms == 'true') {
          scope.terms = false;
          // flag to check if terms have to be checked
          scope.checkTerms = true;
        }
      }
    };
  }
]);/*
  Notes:
  - This filter takes a number and transform fixed the decimals of it.
  - If given a value less than 1 (0.0005), 
    It shows the last decimal even if its greater than numberOfDecimals specified

  - E.g.:
  @param {Number} numberOfDecimals - null|'number'
  @param {Number} decorator - If invalid number will use this


  {{ 100000000 | bgDecimalFormat:null:nulll }} => '1.0000'
  {{ 50000000 | bgDecimalFormat:5:null }} => '5.00000'
  {{ 'string' | bgDecimalFormat:null:null }} => '--'
  {{ 'string' | bgDecimalFormat:null:'**' }} => '**'
*/
angular.module('BitGo.Common.BGDecimalFormatFilter', []).filter('bgDecimalFormat', [
  '$rootScope',
  'BG_DEV',
  function ($rootScope, BG_DEV) {
    return function (value, numberOfDecimals, decorator) {
      // default to 4 as the number of decimals
      numberOfDecimals = numberOfDecimals || 4;
      decorator = decorator || '--';
      // If there is no value return decorator
      if (!value) {
        return decorator;
      }
      // Remove text
      value = value.toString().replace(/[^0-9\.]/g, '').replace(/(\..*)\./g, '$1');
      if (!isNaN(value)) {
        var aux = value;
        if (aux > 0) {
          value = parseFloat(value).toFixed(numberOfDecimals);
          // There are cases when fixed for 2 decimals is not enought, we can get
          // 0.00 cause the original value is 0.00005 so we are going to loop
          // until we reach the first number so 0.000058 will become 0.00005
          while (parseFloat(value) === 0) {
            value = parseFloat(aux).toFixed(numberOfDecimals++);
          }
        }
      }
      // After removing the text do we got something?
      if (!value || value.toString().length === 0) {
        return decorator;
      }
      // Return the value formatted
      return value;
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
                case 'updateEnterpriseRequest':
                  managingDirective = 'bg-approval-tile-enterprise-request';
                  break;
                case 'invitation':
                  managingDirective = 'bg-approval-tile-invitation';
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
          // Flag to see if the label has been found
          scope.foundLabel = false;
          // When the addressId changes, walletId might not be loaded. Only fetch when both are present.
          if (!val || !attrs.walletId) {
            return;
          }
          // Otherwise fetch the label, trying the cache first
          LabelsAPI.get(attrs.addressId, attrs.walletId).then(function (label) {
            if (label) {
              scope.label = label.label;
              scope.foundLabel = true;
            } else {
              scope.foundLabel = false;
              scope.label = attrs.addressId;
            }
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
            scope.user = null;
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
        // Used to set cursor position based on change in input
        var OLD_RETURNED_VAL = '';
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
        var unit = attrs.bitcoinUnit || $rootScope.currency.bitcoinUnit;
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
        // returns the position of the cursor on the input field
        // http://stackoverflow.com/questions/263743/caret-position-in-textarea-in-characters-from-the-start
        function getCursorPosition() {
          //for browsers other than ie
          if (elem[0].selectionStart) {
            return elem[0].selectionStart;
          } else if (!document.selection) {
            return 0;
          }
          // for ie
          var c = '\x01';
          var sel = document.selection.createRange();
          var dul = sel.duplicate();
          var len = 0;
          dul.moveToElementText(node);
          sel.text = c;
          len = dul.text.indexOf(c);
          sel.moveStart('character', -1);
          sel.text = '';
          return len;
        }
        // sets the cursor of the cursor on the input field
        // http://stackoverflow.com/questions/22574295/set-caret-position-in-input-with-angularjs
        function setCursorPosition(caretPos) {
          // for ie
          if (elem[0].createTextRange) {
            try {
              var range = elem.createTextRange();
              range.move('character', caretPos);
              range.select();
            } catch (e) {
              elem[0].focus();
            }
          }  // for browsers other than ie
          else {
            if (elem[0].selectionStart) {
              elem[0].focus();
              elem[0].setSelectionRange(caretPos, caretPos);
            } else {
              elem[0].focus();
            }
          }
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
            var cursorPosition = getCursorPosition();
            ngModel.$setViewValue(RETURNED_VAL);
            ngModel.$render();
            // incase the user actually inputs a valid chracter, set the cursor according to where it was before
            if (RETURNED_VAL !== OLD_RETURNED_VAL) {
              setCursorPosition(cursorPosition);
            }
            OLD_RETURNED_VAL = RETURNED_VAL;
          }, 0);
          checkSatoshiError(RETURNED_VAL, type);
          // check if just a decimal point is entered. If so, change the value to 0.
          if (RETURNED_VAL === '.') {
            RETURNED_VAL = '0.';
          }
          satoshiValue = Number(RETURNED_VAL) * TYPES[type].modifier;
          return Math.round(satoshiValue);
        }
        // Event Handlers
        elem.bind('focus', function () {
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
          var valueAux = value / TYPES[type].modifier;
          // If the attribute toFixed is passed into the element
          // the resulting view value will be formatted using that number.
          if (typeof attrs.toFixed !== 'undefined') {
            valueAux = parseFloat(parseFloat(valueAux).toFixed(attrs.toFixed));
          }
          return valueAux;
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
]);angular.module('BitGo.Common.BGInputValidator', []).directive('bgInputValidator', [
  'SDK',
  function (SDK) {
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
            console.assert(!SDK.bitcoin.HDNode.fromBase58(xpub).privKey);
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
          case 'custom':
            modelInvalid = !attrs.custom(ngModel.$viewValue);
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
  }
]);/**
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
  'SDK',
  function ($parse, $timeout, SDK) {
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
            return SDK.decrypt(scope.recoveryInfo.passcodeEncryptionCode, json);
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
            if (!$rootScope.wallets.current.roleIsViewer()) {
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
});/**
 * @ngdoc directive
 * @name bgOtpDevicesDirective
 * @description
 * Directive to provide otp information on scope
 * @example
 * <div bg-otp-devices></div>
 */
angular.module('BitGo.Common.BGOtpDevicesDirective', []).directive('bgOtpDevices', [
  '$rootScope',
  '$modal',
  '$location',
  '$q',
  'BG_DEV',
  'UtilityService',
  'NotifyService',
  'AnalyticsProxy',
  'UserAPI',
  'CacheService',
  function ($rootScope, $modal, $location, $q, BG_DEV, Util, Notify, AnalyticsProxy, UserAPI, CacheService) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // set two factor auth methods
          $scope.twoFactorMethods = [
            'totp',
            'yubikey',
            'authy'
          ];
          // set Google Authenticator to be the default
          $scope.twoFactorMethod = 'totp';
          // Cache setup
          var unlockTimeCache = CacheService.getCache('unlockTime') || new CacheService.Cache('localStorage', 'unlockTime', 120 * 60 * 1000);
          /**
          *  UI - verifies if a method is the currently selected Otp method
          *  @public
          */
          $scope.isTwoFactorMethod = function (method) {
            return method === $scope.twoFactorMethod;
          };
          /**
          *  UI - sets the current Otp method on the scope
          *  @public
          */
          $scope.setTwoFactorMethod = function (method) {
            $scope.initFormFields();
            if (typeof method !== 'string') {
              throw new Error('invalid method');
            }
            $scope.twoFactorMethod = method;
            // Track the method selected
            var metricsData = { method: method };
            AnalyticsProxy.track('SelectOtpMethod', metricsData);
          };
          /**
          *  UI - retrieves relevant params from scope and returns a params object
          *  @public
          */
          $scope.userHasPhone = function () {
            if ($rootScope.currentUser.settings.phone.phone) {
              return true;
            }
            return false;
          };
          $scope.getOtpParams = function (otpDeviceType) {
            switch (otpDeviceType) {
            case 'totp':
              return {
                type: 'totp',
                otp: $scope.device.otpCode,
                hmac: $scope.device.totpUrl.hmac,
                key: $scope.device.totpUrl.key,
                label: 'Google Authenticator'
              };
            case 'yubikey':
              return {
                type: 'yubikey',
                otp: $scope.device.otpCode,
                label: $scope.device.otpLabel
              };
            case 'authy':
              return {
                type: 'authy',
                otp: $scope.device.otpCode,
                phone: $rootScope.inputPhone,
                label: 'Authy'
              };
            default:
              return null;
            }
          };
          /**
         * Sets the user on the otp device list page after a removal or addition of an otp device
         */
          $scope.refreshOtpDevices = function () {
            $scope.getSettings();
          };
          /**
         * Initializes form fields that may contain user input
         * @public
         */
          $scope.initFormFields = function (action) {
            $scope.device = {};
            $scope.formError = null;
            $scope.twoFactorMethod = 'totp';
            if (action === 'added') {
              $scope.device.added = true;
            }
            if (action === 'removed') {
              $scope.device.removed = true;
            }
          };
          /**
         * Triggers otp modal to open if user needs to otp before adding/removing a device
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
          function handleAddDeviceSuccess() {
            if ($rootScope.currentUser.settings.otpDevices.length === 0) {
              if (unlockTimeCache.get('unlockTime')) {
                unlockTimeCache.remove('unlockTime');
              }
            }
            $scope.initFormFields('added');
            $scope.setTemplate('twoStepVerificationList', true);
            Notify.success('Two-step verification device successfully added');
          }
          function handleRemoveDeviceSuccess() {
            $scope.initFormFields('removed');
            $scope.setTemplate('twoStepVerificationList');
            Notify.success('Two-step verification device successfully removed');
          }
          // Set user to the twoStepVerificationSelect page
          $scope.setTwoStepVerificationSelect = function () {
            $scope.initFormFields();
            $scope.setState('twoStepVerificationSelect');
            $scope.setTwoFactorMethod('totp');
          };
          /**
         * Handles error states associated with attempting to remove a device
         * @private
         */
          function handleRemoveDeviceError(error, params) {
            if (Util.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              return openModal({ type: BG_DEV.MODAL_TYPES.otp }).then(function (result) {
                if (result.type === 'otpsuccess') {
                  // automatically resubmit the otpDeviceId on modal close
                  $scope.removeDevice(params.id);
                }
              });
            }
            // Otherwise just display the error to the user
            Notify.error('This device has already been removed');
          }
          /**
         * Handles error states associated with attempting to add a device
         * @private
         */
          function handleAddDeviceError(error) {
            if (error.message === 'device is already registered') {
              return Notify.error('This device is already registered');
            }
            return Notify.error('Please enter a valid code');
          }
          function setPhoneVerificationState() {
            $rootScope.inputPhone = $scope.device.inputPhone;
            return $scope.setState('phoneVerification');
          }
          function phoneIsValid() {
            return Util.Validators.phoneOk($scope.device.inputPhone);
          }
          $scope.setPhoneVerification = function () {
            if ($scope.device.inputPhone === $scope.user.getPhone()) {
              return $scope.setFormError('This phone is already registered');
            }
            if (!phoneIsValid()) {
              return $scope.setFormError('Invalid phone number');
            }
            // set sendOTP params
            var params = { phone: $scope.device.inputPhone };
            return UserAPI.sendOTP(params).then(setPhoneVerificationState());
          };
          $scope.removeDevice = function (otpDeviceId) {
            if (!otpDeviceId) {
              return Notify.error('There was an error removing your device.  Please refresh the page and try again.');
            }
            var params = { id: otpDeviceId };
            return UserAPI.removeOTPDevice(params).then(function (data) {
              $scope.getSettings();
            }).then(function (data) {
              handleRemoveDeviceSuccess();
            }).catch(function (error) {
              handleRemoveDeviceError(error, params);
            });
          };
          $scope.unlockThenAddOtpDevice = function () {
            return UserAPI.unlock().then(function (res) {
              return UserAPI.addOTPDevice($scope.params);
            }).then(function (res) {
              $scope.refreshOtpDevices();
            }).then(handleAddDeviceSuccess).catch(function (error) {
              handleAddDeviceError(error);
            });
          };
          $scope.addOTPDevice = function (otpDeviceType) {
            // retrieve the params set to the scope form fields
            $scope.params = $scope.getOtpParams(otpDeviceType);
            // ensure that the otp device params were retrieved from scope
            if (otpDeviceType === null || !$scope.params) {
              return Notify.error('There was an error adding your device. Please refresh the page and try again.');
            }
            // if user is shown the select otp device view initially
            // will need an unlock, prior to adding an otp device
            if ($rootScope.currentUser.settings.otpDevices.length === 0) {
              return $scope.unlockThenAddOtpDevice();
            }
            return UserAPI.addOTPDevice($scope.params).then(function (res) {
              $scope.refreshOtpDevices();
            }).then(handleAddDeviceSuccess).catch(function (error) {
              handleAddDeviceError(error);
            });
          };
          $scope.device = {};
        }
      ]
    };
  }
]);angular.module('BitGo.Common.BGPasswordStrength', []).directive('bgPasswordStrength', function () {
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
]);/*
 * @ngdoc directive
 * @name BGQrCode
 * @description
 * Creates QR codes based on data in the text attribute
 * @example
  <div bg-qr-code></div>
*/
angular.module('BitGo.Common.BGQrCode', []).directive('bgQrCode', [
  '$rootScope',
  'BG_DEV',
  '$modal',
  function ($rootScope, BG_DEV, $modal) {
    return {
      restrict: 'AE',
      transclude: true,
      controller: [
        '$scope',
        function ($scope) {
          $scope.openModal = function (address, label) {
            var modalInstance = $modal.open({
                templateUrl: 'modal/templates/modalcontainer.html',
                controller: 'ModalController',
                scope: $scope,
                resolve: {
                  locals: function () {
                    return {
                      userAction: BG_DEV.MODAL_USER_ACTIONS.qrReceiveAddress,
                      type: BG_DEV.MODAL_TYPES.qrReceiveAddress,
                      address: address,
                      label: label
                    };
                  }
                }
              });
            return modalInstance.result;
          };
        }
      ],
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
  }
]);angular.module('BitGo.Common.BGStateManager', []).directive('bgStateManager', [function () {
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
  'BitGo.Common.BGApprovalTileEnterpriseRequestDirective',
  'BitGo.Common.BGApprovalTileInvitation',
  'BitGo.Common.BGApprovalTilePolicyRequestDirective',
  'BitGo.Common.BGApprovalTileTxRequestDirective',
  'BitGo.Common.BGBitcoinFormatFilter',
  'BitGo.Common.BGBitcoinToCurrencyFilter',
  'BitGo.Common.BGCapitalizeFilter',
  'BitGo.Common.BGCenterEllipsisFilter',
  'BitGo.Common.BGConfirmActionDirective',
  'BitGo.Common.BGCreditCardForm',
  'BitGo.Common.BGDecimalFormatFilter',
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
  'BitGo.Common.BGOtpDevicesDirective',
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
  'BitGo.Common.BGWalletSharesByWalletFilter',
  'BitGo.Common.SSDropDownDirective',
  'BitGo.API.SDK'
]);/**
* @ngdoc directive
* @name ssDropDown
* @description
* This module is a directive who is in charge of load a dropdown with the avaiable coins from
* the ssAPI, if an error happens will load only the bitcoin entry
* @return A dropdown with the available coins
* @example <ss-drop-down ignoreCoinsList="changeCoin" is-disabled="addressBeingGenerated" has-errors="unableToLoadAltCoins" alt="receiveAltCoin.altCoin" change="changeCoin" class="customSelect">
          </ss-drop-down>
*/
angular.module('BitGo.Common.SSDropDownDirective', []).directive('ssDropDown', [
  '$timeout',
  'ssAPI',
  'NotifyService',
  function ($timeout, ssAPI, NotifyService) {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: '/common/templates/ssDropdown.html',
      scope: {
        isDisabled: '=',
        alt: '=',
        triggerChange: '=change',
        hasErrors: '=hasErrors'
      },
      link: function (scope, elem, attr) {
        // The search string to filter the dropdown list by
        scope.search = '';
        var AltCoins = {
            init: function (altCoins) {
              // Asign to our local property
              this.altCoins = [];
              // Should we ignore coins?
              for (index = 0; index < altCoins.length; index++) {
                if (_.isUndefined(scope.alt.ignoreList) || scope.alt.ignoreList.indexOf(altCoins[index].name) === -1 && scope.alt.ignoreList.indexOf(altCoins[index].symbol) === -1) {
                  this.altCoins.push(altCoins[index]);
                }
              }
              scope.items = this.altCoins;
            },
            getDefaultCoins: function () {
              return [{
                  name: 'Bitcoin',
                  symbol: 'BTC',
                  image: ssAPI.getCoinImage('BTC'),
                  status: 'available'
                }];
            },
            display: function () {
              // Generate options
              var d = dropDownManager(scope, elem[0]);
              if (!_.isUndefined(attr.selected)) {
                var defaultCoin = ssAPI.getByName(attr.selected);
                if (defaultCoin !== null) {
                  scope.coinImg = defaultCoin.image;
                  scope.coinName = defaultCoin.name;
                  scope.hasCoinSelected = true;
                }
              }
              scope.changeCoin = function (coin) {
                scope.coinImg = coin.image;
                scope.coinName = coin.name;
                scope.hasCoinSelected = true;
                d.toggleList();
                if (typeof scope.triggerChange === 'function') {
                  scope.triggerChange(coin);
                }
              };
              scope.toggleList = function () {
                scope.search = '';
                scope.filtering = false;
                d.toggleList();
              };
              scope.keypressFilter = function (event) {
                var char = String.fromCharCode(event.which);
                if (event.keyCode === 27) {
                  d.hideFilter();
                  d.toggleList(true);
                  return;
                }
                // Only for the first letter, further times user will be typing on the input
                if (scope.search === '') {
                  scope.search += char;
                }
                d.filter.focus();
                d.showFilter();
              };
              scope.refresh = _.debounce(function () {
                d.load();
              }, 0);
            }
          };
        /**
        If an error ocurrs we want to show the toast to the user,
        and anyway load the dropdown with the Bitcoin value, so user can continue using
        the system :)
        @private
        @param err Object representing the error | String
        */
        var errorHandler = function (err) {
          if (!_.isUndefined(scope.hasErrors)) {
            scope.hasErrors = true;
          }
          // Show the error to the user
          var shiftError = ssAPI.getError(err);
          // If is an error that we don't have map yet, get the default
          if (shiftError === null) {
            shiftError = ssAPI.getError('defaultError');
          }
          // Show message on screen
          //NotifyService.error(shiftError.msg);
          var coinsContainer = document.getElementById('coins-container');
          while (coinsContainer.firstChild) {
            coinsContainer.removeChild(coinsContainer.firstChild);
          }
          // Init with just the bitcoin entry
          AltCoins.init(AltCoins.getDefaultCoins());
          // Display and compile the dropdown
          AltCoins.display();
        };
        // Make a call to the shapeshift API,
        // this method will return the available coins :)
        ssAPI.list().then(function (data) {
          // Shapeshift if something happens return an attribute instead of a http error
          // If no error!?
          if (_.isUndefined(data.error)) {
            // Init with the data from ShapeShift
            AltCoins.init(data);
            // Display and compile the dropdown
            AltCoins.display();
          } else {
            return errorHandler(data.error);
          }
        }).catch(errorHandler);
        // Dropdown component
        /**
        * Dropdown functionality, not dependent on library
        */
        function dropDownManager(scope, elem) {
          return {
            elem: elem,
            display: {},
            arrow: {},
            container: {},
            filter: {},
            load: function () {
              this.display = this.elem.querySelector('.display');
              this.arrow = this.elem.querySelector('.arrow');
              this.container = this.elem.querySelector('.container');
              this.filter = this.elem.querySelector('.inputFilter');
              this.addHoverHandlers();
            },
            addHoverHandlers: function () {
              var self = this;
              var timeoutId;
              function leave() {
                timeoutId = window.setTimeout(close, 500);
              }
              function enter() {
                window.clearTimeout(timeoutId);
              }
              function close() {
                self.toggleList(true);
              }
              self.display.addEventListener('mouseleave', leave);
              self.filter.addEventListener('mouseleave', leave);
              self.container.addEventListener('mouseleave', leave);
              self.display.addEventListener('mouseenter', enter);
              self.filter.addEventListener('mouseenter', enter);
              self.container.addEventListener('mouseenter', enter);
            },
            toggleList: function (close) {
              if (this.findClass(this.container, 'show') || close) {
                this.removeClass(this.container, 'show');
                this.removeClass(this.arrow, 'up');
                if (!this.findClass(this.arrow, 'down')) {
                  this.addClass(this.arrow, 'down');
                }
                this.hideFilter();
              } else {
                //  this.setImages();
                this.addClass(this.container, 'show');
                this.removeClass(this.arrow, 'down');
                this.addClass(this.arrow, 'up');
              }
            },
            showFilter: function () {
              this.removeClass(this.filter, 'hide');
            },
            hideFilter: function () {
              this.removeClass(this.filter, 'hide');
              this.addClass(this.filter, 'hide');
            },
            addClass: function (elem, className) {
              elem.className = elem.className + ' ' + className;
            },
            removeClass: function (elem, className) {
              var re = new RegExp('\\s*\\b' + className + '\\b');
              elem.className = elem.className.replace(re, '');
            },
            findClass: function (elem, className) {
              var re = new RegExp('\\s*\\b' + className + '\\b');
              return re.test(elem.className);
            }
          };
        }
      }
    };
  }
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
            if ($rootScope.enterprises && $rootScope.enterprises.current && !_.isEmpty($rootScope.enterprises.current.pendingApprovals)) {
              $scope.enterpriseApprovalsExist = true;
              $scope.noApprovalsExist = false;
            } else {
              $scope.enterpriseApprovalsExist = false;
              $scope.noApprovalsExist = true;
            }
          }
          $scope.goToSettings = function () {
            if ($rootScope.enterprises.current.isPersonal) {
              InternalStateService.goTo('personal_settings:users');
            } else {
              InternalStateService.goTo('enterprise_settings:users');
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
          // initialize the controller
          function init() {
            displayUI();
          }
          init();
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
  'BG_DEV',
  function ($q, Util, Notify, InfiniteScrollService, AuditLogAPI, BG_DEV) {
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
  'BG_DEV',
  function ($compile, $http, $templateCache, BG_DEV) {
    // Returns the template path to compile based on logItem.type
    /* istanbul ignore next */
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
      case 'changePolicy':
      case 'approvePolicy':
      case 'rejectPolicy':
      // User Shares
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
      // organizations
      case 'createEnterprise':
      // TODO: Barath. Fill all these in after backend changes
      case 'updateEnterpriseUser':
      case 'approveEnterpriseUser':
      case 'rejectEnterpriseUser':
      case 'updateEnterpriseSupport':
      case 'updateEnterpriseCredit':
      case 'updateEnterpriseUserPrice':
      // organization approvals                
      case 'acceptEnterpriseUser':
      case 'rejectEnterpriseUser':
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
    /* istanbul ignore next */
    return {
      restrict: 'A',
      replace: true,
      link: function (scope, element, attrs) {
        // backupsource constants are set on the scope so they be accessed from html
        scope.backupSource = BG_DEV.AUDIT_LOG.BACKUP_KEY_METHODS;
        function checkPolicyItem(logItemType) {
          switch (logItemType) {
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
        // Plans get the plans so that plan changes can be displayed
        scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
        // init the template
        $http.get(getTemplate(scope.logItem.type), { cache: $templateCache }).success(function (html) {
          element.html(html);
          $compile(element.contents())(scope);
        });
      }
    };
  }
]);/**
 * @ngdoc directive
 * @name csvReports
 * @description
 * This directive contains all the required functions displaying CSV reports
 * @example
 *   <div csv-reports></div>
 */
angular.module('BitGo.Enterprise.CSVReportsDirective', []).directive('csvReports', [
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
          // Function to fetch the monthly report data for a wallet from the server
          $scope.getReport = function (wallet) {
            var reportInfoObj;
            var reportParams = {
                walletAddress: wallet.data.id,
                period: 'all',
                format: 'csv'
              };
            ReportsAPI.getReport(reportParams).then(function (data) {
              if (data.format === 'csv') {
                // Safari does not support Blob downloads, and opening a Blob URL with
                // an unsupported data-type causes Safari to complain.
                // Github Issue: https://github.com/eligrey/FileSaver.js/issues/12
                if (bowser.name === 'Safari') {
                  document.location.href = 'data:text/csv, ' + data.data;
                } else {
                  var file = new Blob([data.data], { type: 'application/octet-stream' });
                  var name = wallet.data.label + '.csv';
                  saveAs(file, name);
                }
              }
            }).catch(Notify.errorHandler);
          };
        }
      ]
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
  'BG_DEV',
  'InternalStateService',
  'AnalyticsProxy',
  '$location',
  function ($scope, $rootScope, BG_DEV, InternalStateService, AnalyticsProxy, $location) {
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
    /**
     * UI - block the feature for the user
     *
     * @returns {Bool}
     */
    $scope.blockAuditLog = function () {
      return !$rootScope.currentUser.isPro() && $rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal;
    };
    /**
    * Take the user to the create organization page
    *
    * @public
    */
    $scope.goToCreateOrg = function () {
      AnalyticsProxy.track('clickUpsell', { type: 'auditLog' });
      $location.path('/create-organization');
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
        // Track a user landing on the audit log upsell
        if ($scope.state === 'auditlog' && $scope.blockAuditLog()) {
          AnalyticsProxy.track('arriveUpsell', { type: 'auditLog' });
        }
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
          case 'updateEnterpriseRequest':
          case 'invitation':
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
]);/**
 * @ngdoc controller
 * @name EnterpriseCreateController
 * @description
 * This controls the flow and manages all states involved with creating a new enterprise
 * Manages: enterpriseCreateStepslabel, enterpriseCreateStepsSupport, enterpriseCreateStepsBilling
 */
angular.module('BitGo.Enterprise.EnterpriseCreateController', []).controller('EnterpriseCreateController', [
  '$scope',
  '$rootScope',
  '$location',
  'AnalyticsProxy',
  'BG_DEV',
  function ($scope, $rootScope, $location, AnalyticsProxy, BG_DEV) {
    // view states for the enterprise creation
    $scope.viewStates = [
      'label',
      'support',
      'payment'
    ];
    // the current view state
    $scope.state = null;
    // template source for the current view
    $scope.createFlowTemplateSource = null;
    // the data model used by the ui-inputs during enterprise creation
    $scope.inputs = null;
    // takes the user out of the wallet create flow
    // Accessible by all scopes inheriting this controller
    $scope.cancel = function () {
      // track the cancel
      AnalyticsProxy.track('CreateOrganizationCancelled');
      // Note: this redirect will also wipe all of the state that's been built up
      $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
    };
    // returns the view current view template (based on the $scope's current state)
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise create flow');
      }
      var tpl;
      switch ($scope.state) {
      case 'label':
        tpl = 'enterprise/templates/enterprise-create-partial-label.html';
        break;
      case 'support':
        tpl = 'enterprise/templates/enterprise-create-partial-support.html';
        break;
      case 'payment':
        tpl = 'enterprise/templates/enterprise-create-partial-payment.html';
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
      $rootScope.setContext('createEnterprise');
      AnalyticsProxy.track('CreateOrganizationEntered');
      $scope.state = 'label';
      // All properties we expect the user to enter in creation
      $scope.inputs = {
        enterpriseSupportPlan: null,
        enterpriseLabel: null
      };
    }
    init();
  }
]);/**
 * @ngdoc directive
 * @name EnterpriseCreateStepsBillingDirective
 * @description
 * Directive to manage the org creation billinb step
 * Parent Controller is EnterpriseCreateController
 * @example
 *   <div enterprise-create-steps-billing></div>
 */
angular.module('BitGo.Enterprise.EnterpriseCreateStepsBillingDirective', []).directive('enterpriseCreateStepsBilling', [
  '$rootScope',
  'AnalyticsProxy',
  'BG_DEV',
  'EnterpriseAPI',
  '$location',
  'NotifyService',
  'EnterpriseModel',
  function ($rootScope, AnalyticsProxy, BG_DEV, EnterpriseAPI, $location, Notify, EnterpriseModel) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          /**
         * Go Back to choosing support plan of the org
         * @public
         */
          $scope.goBack = function () {
            AnalyticsProxy.track('CreateOrganizationBillingBack');
            $scope.setState('support');
          };
          /**
        * Add enterprise after getting new credit card info
        *
        * @public
        */
          var killCreditCardsListener = $scope.$on('BGCreditCardForm.CardSubmitted', function (evt, result) {
              if (!result.id) {
                throw new Error('Error handling Stripe result');
              }
              EnterpriseAPI.addEnterprise({
                token: result.id,
                name: $scope.inputs.enterpriseLabel,
                supportPlan: $scope.inputs.enterpriseSupportPlan.planId
              }).then(function (enterpriseData) {
                AnalyticsProxy.track('OrganizationCreated');
                $scope.inProcess = false;
                var enterprise = new EnterpriseModel.Enterprise(enterpriseData);
                // add the enterprise onto the user object
                if (!$rootScope.currentUser.settings.enterprises) {
                  $rootScope.currentUser.settings.enterprises = [];
                }
                $rootScope.currentUser.settings.enterprises.push({ id: enterprise.id });
                // add the enterprise to rootscope and redirect to new dashboard
                $rootScope.enterprises.all[enterprise.id] = enterprise;
                EnterpriseAPI.setCurrentEnterprise(enterprise);
                $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets');
              }).catch(function (err) {
                $scope.inProcess = false;
                Notify.error(err.error);
              });
            });
          // Clean up the listeners -- helps decrease run loop time and
          // reduce liklihood of references being kept on the scope
          $scope.$on('$destroy', function () {
            killCreditCardsListener();
          });
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name enterpriseCreateStepsLabel
 * @description
 * Directive to manage the org creation label step
 * Parent Controller is EnterpriseCreateController
 * @example
 *   <div enterprise-create-steps-label></div>
 */
angular.module('BitGo.Enterprise.EnterpriseCreateStepsLabelDirective', []).directive('enterpriseCreateStepsLabel', [
  '$rootScope',
  'AnalyticsProxy',
  function ($rootScope, AnalyticsProxy) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          /**
         * Track org create failure events
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
                action: 'LabelEnterprise'
              };
            AnalyticsProxy.track('Error', metricsData);
          }
          /**
         * Check if label step is valid
         *
         * @private
         */
          function isValidStep() {
            if ($scope.inputs.enterpriseLabel === '' || !$scope.inputs.enterpriseLabel) {
              trackClientLabelFail('Missing Enterprise Name');
              $scope.setFormError('Please enter organization  name.');
              return false;
            }
            if ($scope.inputs.enterpriseLabel.indexOf('.') !== -1) {
              trackClientLabelFail('Invalid Organization Name');
              $scope.setFormError('Organization names cannot contain periods.');
              return false;
            }
            if ($scope.inputs.enterpriseLabel.length > 50) {
              trackClientLabelFail('Invalid Organization Name Length');
              $scope.setFormError('Organization names cannot be longer than 50 characters.');
              return false;
            }
            return true;
          }
          /**
         * Advance the org creation flow by labelling enterprise
         *
         * @public
         */
          $scope.advanceLabel = function () {
            // clear any errors
            $scope.clearFormError();
            if (isValidStep()) {
              // track the successful label advancement
              var metricsData = { enterpriseLabel: $scope.inputs.enterpriseLabel };
              AnalyticsProxy.track('LabelEnterprise', metricsData);
              // advance the form
              $scope.setState('support');
            }
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name enterpriseCreateStepsSupport
 * @description
 * Directive to manage the org creation support step
 * Parent Controller is EnterpriseCreateController
 * @example
 *   <div enterprise-create-steps-support></div>
 */
angular.module('BitGo.Enterprise.EnterpriseCreateStepsSupportDirective', []).directive('enterpriseCreateStepsSupport', [
  '$rootScope',
  'AnalyticsProxy',
  'BG_DEV',
  function ($rootScope, AnalyticsProxy, BG_DEV) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // The valid user plans
          $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
          // if the plan was pre-selected
          if ($scope.inputs.enterpriseSupportPlan) {
            $scope.selectedPlanId = $scope.inputs.enterpriseSupportPlan.planId;
          } else {
            // default selected plan to professional
            $scope.selectedPlanId = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS.OrgProMonthly.planId;
          }
          /**
         * Go Back to the labelling of the org
         * @public
         */
          $scope.goBack = function () {
            AnalyticsProxy.track('CreateOrganizationSupportBack');
            $scope.setState('label');
          };
          /**
         * Advance the org creation flow by choosing support plan
         *
         * @public
         */
          $scope.advanceSupport = function () {
            // track the successful support plan choosing
            var metricsData = { enterpriseSupportPlan: BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS[$scope.selectedPlanId] };
            AnalyticsProxy.track('ChooseSupportPlan', metricsData);
            $scope.inputs.enterpriseSupportPlan = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS[$scope.selectedPlanId];
            // advance the form
            $scope.setState('payment');
          };
        }
      ]
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
  'BitGo.Enterprise.MatchwalletWidgetDirective',
  'BitGo.Enterprise.EnterpriseActivityController',
  'BitGo.Enterprise.ActivityAuditLogDirective',
  'BitGo.Enterprise.ActivityApprovalsDirective',
  'BitGo.Enterprise.AuditLogActivityTileDirective',
  'BitGo.Enterprise.EnterpriseApprovalTileDirective',
  'BitGo.Enterprise.EnterpriseSettingsController',
  'BitGo.Enterprise.EnterpriseSettingsCompanyDirective',
  'BitGo.Enterprise.EnterpriseSettingsSupportDirective',
  'BitGo.Enterprise.EnterpriseSettingsBillingDirective',
  'BitGo.Enterprise.EnterpriseReportsController',
  'BitGo.Enterprise.MonthlyReportsDirective',
  'BitGo.Enterprise.CSVReportsDirective',
  'BitGo.Enterprise.EnterpriseCreateController',
  'BitGo.Enterprise.EnterpriseCreateStepsLabelDirective',
  'BitGo.Enterprise.EnterpriseCreateStepsSupportDirective',
  'BitGo.Enterprise.EnterpriseCreateStepsBillingDirective'
]);/*
  Notes:
  - This controls the view for the enterprise wallet reporting page
*/
angular.module('BitGo.Enterprise.EnterpriseReportsController', []).controller('EnterpriseReportsController', [
  '$scope',
  '$rootScope',
  'NotifyService',
  'InternalStateService',
  'BG_DEV',
  'AnalyticsProxy',
  '$location',
  function ($scope, $rootScope, Notify, InternalStateService, BG_DEV, AnalyticsProxy, $location) {
    // The view viewStates within the enterprise reports section
    $scope.viewStates = [
      'monthly',
      'daily',
      'csv',
      'upsell'
    ];
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.activityTemplateSource = null;
    /**
     * UI - block the feature for the user
     *
     * @returns {Bool}
     */
    $scope.blockReports = function () {
      return $rootScope.currentUser.isBasic() && $rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal;
    };
    /**
    * Take the user to the create org page
    *
    * @public
    */
    $scope.goToCreateOrg = function () {
      AnalyticsProxy.track('clickUpsell', { type: 'reports' });
      $location.path('/create-organization');
    };
    // Return list of wallets sorted by name
    $scope.getWallets = function () {
      return _.chain($scope.wallets.all).values().sortBy(function (w) {
        return w.data.label;
      }).value();
    };
    // gets the view template based on the $scope's viewSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Missing $scope.state');
      }
      var template;
      switch ($scope.state) {
      case 'upsell':
        template = 'enterprise/templates/reports-partial-upsell.html';
        break;
      case 'monthly':
        template = 'enterprise/templates/reports-partial-monthly.html';
        break;
      case 'csv':
        template = 'enterprise/templates/reports-partial-csv.html';
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
        // Track a user landing on the reports upsell
        if ($scope.state === 'upsell' && $scope.blockReports()) {
          AnalyticsProxy.track('arriveUpsell', { type: 'reports' });
        }
      });
    // Clean up when the scope is destroyed
    $scope.$on('$destroy', function () {
      // remove listeners
      killStateWatch();
    });
    function init() {
      $rootScope.setContext('enterpriseReports');
      if ($scope.blockReports()) {
        $scope.state = 'upsell';
      } else {
        $scope.state = 'monthly';
      }
      $scope.activityTemplateSource = getTemplate();
    }
    init();
  }
]);/**
 * @ngdoc directive
 * @name enterpriseBillingFormDirective
 * @description
 * Directive to manage billing information for enterprises
 * @example
 *   <div enterprise-settings-billing></div>
 */
/**/
angular.module('BitGo.Enterprise.EnterpriseSettingsBillingDirective', []).directive('enterpriseSettingsBilling', [
  'BG_DEV',
  '$rootScope',
  'EnterpriseAPI',
  'NotifyService',
  function (BG_DEV, $rootScope, EnterpriseAPI, Notify) {
    return {
      restrict: 'A',
      require: '^EnterpriseSettingsController',
      controller: [
        '$scope',
        function ($scope) {
          $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
          // hardcoded now but this could change according to enterprise
          $scope.userCost = $scope.enterpriseUsers.count * 30;
          $scope.viewStates = [
            'showExistingCard',
            'addNewCard'
          ];
          $scope.state = null;
          /**
        * Update the billing info for the enteprise after getting a payment id from stripe
        * @public
        */
          $scope.$on('BGCreditCardForm.CardSubmitted', function (evt, result) {
            if (!result.id) {
              throw new Error('Error handling Stripe result');
            }
            EnterpriseAPI.updateEnterpriseBilling({
              cardToken: result.id,
              enterpriseId: $rootScope.enterprises.current.id
            }).then(function (newEnterprise) {
              $scope.state = 'showExistingCard';
              // check if payment existed before and present notification accordingly
              if ($rootScope.enterprises.current.hasPaymentOnFile()) {
                Notify.success('Your credit card was replaced');
              } else {
                Notify.success('A new credit card was added to the account');
              }
              // Tack on payment info onto the enterprise
              $rootScope.enterprises.current.customerData = newEnterprise.customerData;
              $scope.inProcess = false;
            }).catch(function (err) {
              $scope.inProcess = false;
              Notify.error(err.error);
            });
          });
          function init() {
            // Init the state based on whether the enterprise has a card on record or not
            if ($rootScope.enterprises.current.hasPaymentOnFile()) {
              $scope.state = 'showExistingCard';
            } else {
              $scope.state = 'addNewCard';
            }
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name enterpriseSettingsCompany
 * @description
 * Handles the addition and removal of admin users on the enterprise
 * @example
 * <div enterprise-settings-company>
 * </div>
 */
angular.module('BitGo.Enterprise.EnterpriseSettingsCompanyDirective', []).directive('enterpriseSettingsCompany', [
  '$rootScope',
  'UtilityService',
  'EnterpriseAPI',
  'NotifyService',
  'ApprovalsAPI',
  function ($rootScope, Util, EnterpriseAPI, Notify, ApprovalsAPI) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
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
          $scope.addAdmin = function () {
            var email = $scope.email;
            if (formIsValid()) {
              $scope.clearFormError();
              var params = {
                  username: email,
                  enterpriseId: $rootScope.enterprises.current.id
                };
              EnterpriseAPI.addEnterpriseAdmin(params).then(function (data) {
                //clear email if valid
                $scope.email = '';
                if ($scope.enterpriseUsers.adminUsers.length > 1) {
                  // add to enterprise users with pending approval
                  return ApprovalsAPI.getApprovals({ enterprise: $rootScope.enterprises.current.id }).then(function (data) {
                    $rootScope.enterprises.current.setApprovals(data.pendingApprovals);
                  });
                } else {
                  $scope.enterpriseUsers.adminUsers.push({ username: email });
                }
              }).catch(function (error) {
                if (error.error === 'invalid user') {
                  Notify.error('Please have ' + email + ' signup with BitGo before adding as an owner');
                } else {
                  Notify.errorHandler(error);
                }
              });
            }
          };
          /**
        * User cannot remove himself
        */
          $scope.canRemove = function (userId) {
            return userId !== $rootScope.currentUser.settings.id;
          };
          /**
        * Remove an admin from an enterprise
        * @params {string} username of admin to remove
        */
          $scope.removeAdmin = function (username) {
            var params = {
                username: username,
                enterpriseId: $rootScope.enterprises.current.id
              };
            EnterpriseAPI.removeEnterpriseAdmin(params).then(function (data) {
              if ($scope.enterpriseUsers.adminUsers.length > 1) {
                // get pending approvals
                return ApprovalsAPI.getApprovals({ enterprise: $rootScope.enterprises.current.id }).then(function (data) {
                  $rootScope.enterprises.current.setApprovals(data.pendingApprovals);
                });
              } else {
                // note: removing an enterprise admin always requires approval. Hence this should never be hit
                _.remove($scope.enterpriseUsers.adminUsers, function (user) {
                  return user.username == params.username;
                });
              }
            }).catch(Notify.errorHandler);
          };
        }
      ]
    };
  }
]);/*
  Notes:
  - This controls the view for the enterprise wallet settings page and
  all subsections (it uses bg-state-manager) to handle template swapping
*/
angular.module('BitGo.Enterprise.EnterpriseSettingsController', []).controller('EnterpriseSettingsController', [
  '$rootScope',
  '$scope',
  'InternalStateService',
  'EnterpriseAPI',
  'NotifyService',
  function ($rootScope, $scope, InternalStateService, EnterpriseAPI, Notify) {
    // The view viewStates within the enterprise settings for a specific enterprise
    $scope.viewStates = [
      'organization',
      'users',
      'support',
      'billing'
    ];
    // object which maps view states to correspoing html files
    var stateTemplates = {
        organization: 'enterprise/templates/settings-partial-company.html',
        users: 'enterprise/templates/settings-partial-users.html',
        support: 'enterprise/templates/settings-partial-support.html',
        billing: 'enterprise/templates/settings-partial-billing.html'
      };
    // The current view section
    $scope.state = undefined;
    // sets the template to use based on the section
    $scope.enterpriseSettingsTemplateSource = null;
    // scope variable to store data of enterprise users
    $scope.enterpriseUsers = {};
    // gets the view template based on the $scope's currentSection
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
      }
      return stateTemplates[$scope.state];
    }
    // Events Handlers
    // Watch for changes in the $scope's state and set the view's template
    var killStateWatch = $scope.$watch('state', function () {
        $scope.enterpriseSettingsTemplateSource = getTemplate();
      });
    // Listen for enteprises to be set
    var killEnterpriseListener = $rootScope.$on('EnterpriseAPI.CurrentEnterpriseSet', function () {
        EnterpriseAPI.getEnterpriseUsers({ enterpriseId: $rootScope.enterprises.current.id }).then(function (data) {
          $scope.enterpriseUsers = data;
        });
      });
    // Clean up the listeners when the scope is destroyed
    $scope.$on('$destroy', function () {
      killStateWatch();
      killEnterpriseListener();
    });
    function init() {
      $rootScope.setContext('enterpriseSettings');
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'organization';
      $scope.enterpriseSettingsTemplateSource = getTemplate();
    }
    init();
  }
]);/**
 * @ngdoc directive
 * @name enterpriseSettingsSupport
 * @description
 * Handles the addition and removal of admin users on the enterprise
 * @example
 * <div enterprise-settings-support>
 * </div>
 */
angular.module('BitGo.Enterprise.EnterpriseSettingsSupportDirective', []).directive('enterpriseSettingsSupport', [
  '$rootScope',
  'BG_DEV',
  'EnterpriseAPI',
  'NotifyService',
  function ($rootScope, BG_DEV, EnterpriseAPI, Notify) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // The valid user plans
          $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
          // check if the current org plan is valid
          if (!_.has($scope.plans, $rootScope.enterprises.current.supportPlan)) {
            //default to basic
            $rootScope.enterprises.current.supportPlan = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS.OrgBasicMonthly.planId;
          }
          // default selected plan to current plan
          $scope.selectedPlanId = $scope.plans[$rootScope.enterprises.current.supportPlan].planId;
          // flag to keep track of whether a new plan is selected
          $scope.newPlanSelected = false;
          // flag to decide whether to show confirmation state
          $scope.confirmationState = false;
          /**
        * Gets called when the user makes a change in plan selection
        */
          $scope.onSelectSupportPlan = function () {
            $scope.confirmationState = false;
            $scope.newPlanSelected = false;
            //if selected support plan is different from current support plan, show submit button and scroll to bottom
            if ($scope.selectedPlanId !== $scope.plans[$rootScope.enterprises.current.supportPlan].planId) {
              $scope.newPlanSelected = true;
              $('html, body').animate({ scrollTop: $(document).height() });
            }
          };
          /**
        * logic to show 'upgrade' or 'downgrade' based on what the user is doing
        * params {string} the planId with which compare the users current plan
        */
          $scope.isUpgrade = function (planId) {
            if (!planId) {
              throw new Error('isUpgrade requires planId');
            }
            return $scope.plans[$rootScope.enterprises.current.supportPlan].level < $scope.plans[planId].level;
          };
          /**
        * Function to change support plan
        */
          $scope.submitSupportPlan = function () {
            // if there is no card on file (for old enterprises) -> throw error
            if (!$rootScope.enterprises.current.hasPaymentOnFile()) {
              Notify.error('Please add a credit card before changing support plan');
              return;
            }
            var params = {
                enterpriseId: $rootScope.enterprises.current.id,
                supportPlan: $scope.selectedPlanId
              };
            EnterpriseAPI.updateEnterpriseBilling(params).then(function (data) {
              $scope.confirmationState = true;
              // update the users support plan
              $rootScope.enterprises.current.supportPlan = data.supportPlan;
            }).catch(Notify.errorHandler);
          };
          function init() {
            // if they are legacy users switch them over to custom
            if ($rootScope.enterprises.current.supportPlan === BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS.external.planId) {
              $scope.selectedPlanId = $scope.plans.custom.planId;
            }
          }
          init();
        }
      ]
    };
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
  'CacheService',
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
  'InternalStateService',
  'SDK',
  function ($q, $scope, $modal, $rootScope, CacheService, $location, $filter, WalletsAPI, WalletSharesAPI, UtilityService, Notify, KeychainsAPI, EnterpriseAPI, BG_DEV, SyncService, RequiredActionService, AnalyticsProxy, InternalStateService, SDK) {
    // start cache service for create wallet modal
    var enterpriseCache = new CacheService.Cache('sessionStorage', 'Enterprise', 60 * 60 * 1000);
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
    // keeps track of whether we received WalletsAPI.CurrentWalletsSet
    var receivedUserWalletsSetEvent = false;
    $scope.setTwoStepVerification = function () {
      InternalStateService.goTo('personal_settings:security');
    };
    /* istanbul ignore next */
    $scope.goToCreateOrg = function () {
      AnalyticsProxy.track('clickUpsell', {
        type: 'dashboardWidget',
        invitation: !!$rootScope.invitation
      });
      $location.path('/create-organization');
    };
    /* istanbul ignore next */
    $scope.redirectReferralLink = function () {
      AnalyticsProxy.track('clickReferral', {
        type: 'dashboardWidget',
        invitation: !!$rootScope.invitation
      });
    };
    function isBitfinexReferent() {
      var referrer = $rootScope.currentUser.settings.referrer;
      if (referrer && referrer.source && referrer.source.toLowerCase().indexOf(BG_DEV.REFERRER.BITFINEX.toLowerCase()) > -1) {
        return true;
      }
      return false;
    }
    /* istanbul ignore next */
    $scope.showReferralWidget = function () {
      // Check for bitfinex enterpise
      var isWalletListEmpty = _.isEmpty($rootScope.wallets.all);
      var isBitfinexEnterprise = $rootScope.enterprises.current && $rootScope.enterprises.current.id === BG_DEV.ENTERPRISE.BITFINEX_ID;
      /*
      Only show the dialog if a) the user has a wallet which b) is not associated with a Bitfinex enterprise and c) the
      user didn't come to us from or due to a referral by Bitfinex
       */
      return !isWalletListEmpty && !isBitfinexEnterprise && !isBitfinexReferent();
    };
    /* istanbul ignore next */
    $scope.showCreateOrgWidget = function () {
      return ($rootScope.currentUser.isBasic() || $rootScope.currentUser.isGrandfathered()) && !$rootScope.currentUser.isEnterpriseCustomer();
    };
    /* istanbul ignore next */
    $scope.otpDeviceNotSet = function () {
      return _.isEmpty($rootScope.currentUser.settings.otpDevices);
    };
    function showFundModal() {
      // Check for bitfinex enterpise
      // TODO: Barath - remove this and do a cleaner fix along with oauth/signup referral      
      if (!_.isEmpty($rootScope.wallets.all) && !isBitfinexReferent()) {
        return $rootScope.enterprises.current && $rootScope.enterprises.current.balance === 0 && $rootScope.enterprises.current.isPersonal;
      }
    }
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
      AnalyticsProxy.track('CreateWalletStarted', { invitation: !!$rootScope.invitation });
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
      if ($rootScope.enterprises.current && $rootScope.enterprises.current.isAdmin) {
        return true;
      }
    };
    // Link in to a specific wallet and set the current wallet on rootscope
    $scope.goToWallet = function (wallet) {
      WalletsAPI.setCurrentWallet(wallet);
    };
    // Go to identity verification page
    $scope.goToIdentityVerification = function goToIdentityVerification() {
      $location.path('/identity/verify');
    };
    /**
    * accept wallet share error handler.
    * @params - The wallet share you want to accept
    * @returns {function} which handles the appropriate errors from accepting a share. It calls modals etc
    */
    function AcceptShareErrorHandler(walletShare) {
      return function onAcceptShareFail(error) {
        if (UtilityService.API.isOtpError(error)) {
          // If the user needs to OTP, use the modal to unlock their account
          openModal({
            type: BG_DEV.MODAL_TYPES.otpThenUnlock,
            walletName: walletShare.walletLabel
          }).then(function (result) {
            if (result.type === 'otpThenUnlockSuccess') {
              if (!result.data.otp && !$scope.noOtpDeviceSet) {
                throw new Error('Missing otp');
              }
              if (!result.data.password) {
                throw new Error('Missing login password');
              }
              $scope.password = result.data.password;
              // resubmit to share wallet
              return $scope.acceptShare(walletShare);
            }
          }).catch(function () {
            $scope.processShare = false;
          });
        } else if (UtilityService.API.isPasscodeError(error)) {
          openModal({
            type: BG_DEV.MODAL_TYPES.passwordThenUnlock,
            walletName: walletShare.walletLabel
          }).then(function (result) {
            if (result.type === 'otpThenUnlockSuccess') {
              if (!result.data.password) {
                throw new Error('Missing login password');
              }
              $scope.password = result.data.password;
              // resubmit to share wallet
              return $scope.acceptShare(walletShare);
            }
          }).catch(function () {
            $scope.processShare = false;
          });
        } else {
          $scope.processShare = false;
          // Otherwise just display the error to the user
          Notify.error(error.error || error);
        }
      };
    }
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
      var params = {
          state: 'accepted',
          walletShareId: walletShare.id
        };
      var role = $filter('bgPermissionsRoleConversionFilter')(walletShare.permissions);
      if (role === BG_DEV.WALLET.ROLES.ADMIN || role === BG_DEV.WALLET.ROLES.SPEND) {
        WalletSharesAPI.getSharedWallet({ walletShareId: walletShare.id }).then(function (data) {
          // check if the wallet is a cold wallet. If so accept share without getting secret etc. (this just behaves as a 'view only' share wallet)
          if (!data.keychain) {
            return WalletSharesAPI.updateShare(params).then($scope.shareUserSuccess);
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
              sharingKeychain.xprv = SDK.decrypt($scope.password, sharingKeychain.encryptedXprv);
              var rootExtKey = SDK.bitcoin.HDNode.fromBase58(sharingKeychain.xprv);
              // Derive key by path (which is used between these 2 users only)
              var extKey = rootExtKey.deriveFromPath(data.keychain.path);
              var secret = SDK.get().getECDHSecret({
                  eckey: extKey.privKey,
                  otherPubKeyHex: data.keychain.fromPubKey
                });
              // Yes! We got the secret successfully here, now decrypt the shared wallet xprv
              var decryptedSharedWalletXprv = SDK.decrypt(secret, data.keychain.encryptedXprv);
              encryptedSharedWalletXprv = SDK.encrypt($scope.password, decryptedSharedWalletXprv);
              params.encryptedXprv = encryptedSharedWalletXprv;
              return WalletSharesAPI.updateShare(params);
            });
          }
        }).then($scope.shareUserSuccess).catch(AcceptShareErrorHandler(walletShare));
      } else {
        return WalletSharesAPI.updateShare(params).then($scope.shareUserSuccess);
      }
    };
    $scope.shareUserSuccess = function () {
      // TODO Barath. Might be a better (smoother for UI) way to accept share
      SyncService.sync();
    };
    function rejectShareSuccess() {
      $scope.processShare = false;
      WalletSharesAPI.getAllSharedWallets();
    }
    // reject a share
    $scope.rejectShare = function (walletShare) {
      $scope.processShare = true;
      WalletSharesAPI.cancelShare({ walletShareId: walletShare.id }).then(rejectShareSuccess).catch(Notify.errorHandler);
    };
    function showModal(walletsData) {
      var firstWalletPromptShown = enterpriseCache.get('firstWalletPromptShown');
      var fundWalletPromptShown = enterpriseCache.get('fundWalletPromptShown');
      var isWalletModal = true;
      // if this is the first wallet with no balance, show the fund wallet modal
      if (showFundModal() && !fundWalletPromptShown) {
        enterpriseCache.add('fundWalletPromptShown', true);
        openModal({
          type: BG_DEV.MODAL_TYPES.fundWallet,
          userAction: BG_DEV.MODAL_USER_ACTIONS.fundWallet,
          url: 'modal/templates/fundWallet.html'
        }, isWalletModal);
      } else if (_.isEmpty(walletsData.allWallets) && _.isEmpty($rootScope.walletShares.all.incoming) && !firstWalletPromptShown) {
        enterpriseCache.add('firstWalletPromptShown', true);
        openModal({
          type: BG_DEV.MODAL_TYPES.createWallet,
          userAction: BG_DEV.MODAL_USER_ACTIONS.createWallet,
          url: 'modal/templates/createWallet.html'
        }, isWalletModal);
      }
    }
    // Event Listeners
    // Listen for the enterprises's wallet shares to be set before showing the list
    var killWalletSharesListener = $rootScope.$on('WalletSharesAPI.FilteredWalletSharesSet', function (evt, data) {
        setFilteredWalletSharesForUI();
      });
    // Listen for all user wallets to be set
    var killUserWalletsListener = $rootScope.$on('WalletsAPI.UserWalletsSet', function (evt, data) {
        receivedUserWalletsSetEvent = true;
        if (_.isEmpty(data.allWallets)) {
          $scope.noWalletsAcrossEnterprisesExist = true;
        } else {
          $scope.noWalletsAcrossEnterprisesExist = false;
        }
        setFilteredWalletsForUI();
        showModal(data);
      });
    // Clean up the listeners -- helps decrease run loop time and
    // reduce liklihood of references being kept on the scope
    $scope.$on('$destroy', function () {
      killWalletSharesListener();
      killUserWalletsListener();
    });
    function openModal(params, isWalletModal) {
      if (!params || !params.type) {
        throw new Error('Missing modal params');
      }
      var modalInstance;
      if (isWalletModal) {
        modalInstance = $modal.open({
          templateUrl: params.url,
          controller: 'ModalController',
          scope: $scope,
          size: params.size,
          resolve: {
            locals: function () {
              return {
                type: params.type,
                userAction: params.userAction
              };
            }
          }
        });
      }  // if it is a wallet share accept
      else {
        // check for wallet name while accepting share
        if (!params.walletName) {
          throw new Error('Missing modal params');
        }
        modalInstance = $modal.open({
          templateUrl: 'modal/templates/modalcontainer.html',
          controller: 'ModalController',
          scope: $scope,
          size: params.size,
          resolve: {
            locals: function () {
              return {
                type: params.type,
                userAction: BG_DEV.MODAL_USER_ACTIONS.acceptShare,
                walletName: params.walletName
              };
            }
          }
        });
      }
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
          $scope.userHover = false;
          var today = new Date();
          $scope.currentDate = today.toUTCString().slice(5, 16);
          $scope.showData = function () {
            $scope.userHover = true;
          };
          $scope.hideData = function () {
            $scope.userHover = false;
          };
          // sets and updates $scope.currency data on the isolate scope
          function setScope(currencyData, marketDataAvailable) {
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
              currencyData.data.current.prevDayHigh = parseFloat(currencyData.data.current.prevDayHigh).toFixed(2);
              currencyData.data.current.prevDayLow = parseFloat(currencyData.data.current.prevDayLow).toFixed(2);
              $scope.currency = currencyData;
              $scope.marketDataAvailable = marketDataAvailable;
            }
          }
          setScope($rootScope.currency, $rootScope.marketDataAvailable);
          //initialize chartTime to one day
          $scope.chartTime = 'months';
          var killCurrencyUpdated = $rootScope.$on('MarketDataAPI.AppCurrencyUpdated', function (event, currencyData) {
              setScope(currencyData, $rootScope.marketDataAvailable);
            });
          // Clean up the listeners -- helps decrease run loop time and
          // reduce liklihood of references being kept on the scope
          $scope.$on('$destroy', function () {
            killCurrencyUpdated();
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
            top: 12
          }).useInteractiveGuideline(true).transitionDuration(500).showLegend(false).showYAxis(true).showXAxis(false);
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
]);/**
 * @ngdoc directive
 * @name matchwalletWidget
 * @description
 * The info box on the enterprise page that links to the user's match wallet.
 * @example
 * <div matchwallet-widget>
 *   <a ng-click="goToMatchwallet()">Invite</a>
 * </div>
 */
angular.module('BitGo.Enterprise.MatchwalletWidgetDirective', []).directive('matchwalletWidget', [
  '$rootScope',
  'MatchwalletAPI',
  'AnalyticsProxy',
  'UtilityService',
  function ($rootScope, MatchwalletAPI, AnalyticsProxy, UtilityService) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          var onMatchwalletCreateFailure = UtilityService.API.promiseErrorHelper();
          var onMatchwalletCreateSuccess = function (matchwallet) {
            AnalyticsProxy.track('create', {
              type: 'matchwallet',
              invitation: !!$rootScope.invitation
            });
            MatchwalletAPI.setCurrentMatchwallet(matchwallet);
          };
          // Matchwallet template helpers
          $scope.canSendInvites = function canSendInvites() {
            if ($rootScope.enterprises && $rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal) {
              return MatchwalletAPI.canSendInvites();
            }
          };
          // Go to bitgo rewards wallt
          $scope.goToMatchwallet = function () {
            AnalyticsProxy.track('click', {
              type: 'matchwallet',
              invitation: !!$rootScope.invitation
            });
            // create a matchwallet if none exists
            if (!$rootScope.matchwallets || _.isEmpty($rootScope.matchwallets.all)) {
              return MatchwalletAPI.createMatchwallet().then(onMatchwalletCreateSuccess).catch(onMatchwalletCreateFailure);
            }
            // Get most recently created rewards wallet
            var lastMatchwallet = _.findLast($rootScope.matchwallets.all);
            MatchwalletAPI.setCurrentMatchwallet(lastMatchwallet);
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name monthlyReports
 * @description
 * This directive contains all the required functions displaying monthly reports
 * @example
 *   <div monthly-reports></div>
 */
angular.module('BitGo.Enterprise.MonthlyReportsDirective', []).directive('monthlyReports', [
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
          // TODO(gavin): clean this up? can we do better than double loop?
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
            var reportTime = moment.utc(reportInfoObj.startTime);
            var reportStart = reportInfoObj.startTime;
            var reportParams = {
                walletAddress: wallet.data.id,
                start: Number(reportStart),
                period: 'month',
                format: 'pdf'
              };
            ReportsAPI.getReport(reportParams).then(function (data) {
              if (data.format === 'pdf') {
                // Safari does not support Blob downloads, and opening a Blob URL with
                // an unsupported data-type causes Safari to complain.
                // Github Issue: https://github.com/eligrey/FileSaver.js/issues/12
                if (bowser.name === 'Safari') {
                  document.location.href = 'data:application/pdf;base64, ' + data.data;
                } else {
                  var buffer = Utils.Converters.base64ToArrayBuffer(data.data);
                  var file = new Blob([buffer], { type: 'application/octet-stream' });
                  var name = 'BitGo-Monthly-' + wallet.data.id.slice(0, 8) + '-' + reportTime.format('YYYY-MM') + '.pdf';
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
            // TODO(gavin): clean up
            if (!_.isEmpty($rootScope.wallets.all)) {
              getEnterpriseReportRange($rootScope.wallets.all);
            }
          }
          init();
        }
      ]
    };
  }
]);angular.module('BitGo.Identity.CreateFormDirective', []).directive('identityCreateForm', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      require: '^IdentityController',
      controller: [
        '$scope',
        function ($scope) {
          function formIsValid() {
            if (!$scope.identity.name || $scope.identity.name === $rootScope.currentUser.settings.email.email) {
              $scope.setFormError('Please enter your legal name.');
              return false;
            }
            var phone = $scope.identity.phone;
            if (!phone) {
              $scope.setFormError('Please enter your phone number.');
              return false;
            }
            if (phone[0] !== '+') {
              phone = '+'.concat(phone);
            }
            if (!intlTelInputUtils.isValidNumber(phone)) {
              $scope.setFormError('Please enter a valid phone number.');
              return false;
            }
            if (!$scope.agree) {
              $scope.setFormError('Please agree to the terms and conditions');
              return false;
            }
            return true;
          }
          $scope.submitForm = function submitForm() {
            if (!formIsValid()) {
              return;
            }
            // Set to true when synapse iframe is set visible
            $scope.submitted = true;
            $scope.createIdentity();
          };
        }
      ]
    };
  }
]);angular.module('BitGo.Identity.IdentityController', []).controller('IdentityController', [
  '$rootScope',
  '$scope',
  '$modal',
  '$location',
  '$q',
  'SettingsAPI',
  'IdentityAPI',
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  function ($rootScope, $scope, $modal, $location, $q, SettingsAPI, IdentityAPI, Util, Notify, BG_DEV) {
    // Get name and phone user settings objects
    var settings = $rootScope.currentUser.settings || {};
    var name = settings.name || {};
    var phone = settings.phone || {};
    var email = settings.email || {};
    // User must agree to ToS
    $scope.agree = false;
    // Identity user submitted to identity/create
    $scope.identity = {
      fingerprint: null,
      oauth_key: null,
      name: name.full,
      phone: phone.phone
    };
    // Reset name if its the same as the user's email address
    if (name.full === email.email) {
      $scope.identity.name = null;
    }
    // Show a verification error and return to /settings
    function verifyError(error) {
      error = (error || {}).error || error || 'Verification failed';
      Notify.error(error);
      $location.path('/settings');
    }
    // Custom retry time moment string
    function retryTimeString(retryTime) {
      return retryTime ? moment(retryTime).fromNow().replace(/in a day/, 'tomorrow') : null;
    }
    function openModal(params) {
      return $modal.open({
        templateUrl: params.url,
        controller: 'ModalController',
        resolve: {
          locals: function () {
            return _.merge({
              type: BG_DEV.MODAL_TYPES[params.type],
              userAction: BG_DEV.MODAL_USER_ACTIONS[params.type]
            }, params.locals);
          }
        }
      }).result;
    }
    function onCreateIdentitySuccess(oauth_key) {
      if (!oauth_key) {
        return;
      }
      $scope.identity.oauth_key = oauth_key;
      // Set up iframe
      angular.element(document.body).addClass('identityDocumentVerification');
      setupKYCIframe({
        userInfo: {
          oauth_key: $scope.identity.oauth_key,
          fingerprint: $scope.identity.fingerprint,
          v3: true
        },
        development_mode: !_.includes([
          'test',
          'prod'
        ], BitGoConfig.env.getSDKEnv())
      });
      // Return promisified event callback
      // Synapse will send our window object a message event when
      // identity verification is completed or cancelled
      var d = $q.defer();
      $(window).one('message', d.resolve);
      return d.promise.then(function (event) {
        if (!event) {
          return;
        }
        try {
          if (event.originalEvent) {
            event = event.originalEvent;
          }
          $(document.body).removeClass('identityDocumentVerification');
          // Here we get some data back from Synapse including
          // results of the identity verification
          var data = JSON.parse(event.data);
          if (data.success) {
            // Enforce no duplicate identities
            return IdentityAPI.verifyIdentity($scope.identity.oauth_key).then(SettingsAPI.get).then(function () {
              Notify.success('You\'re verified!');
              $location.path('/settings');
            });
          } else if (data.cancel) {
            // User canceled
            verifyError('Verification canceled');
          } else {
            // Create account with KYC service
            return IdentityAPI.createIdentity({ fingerprint: ident.fingerprint }).then(function (oauth_key) {
              if (!oauth_key) {
                return;
              }
              ident.oauth_key = oauth_key;
              // Set up iframe
              angular.element(document.body).addClass('identityDocumentVerification');
              setupKYCIframe({
                userInfo: {
                  oauth_key: ident.oauth_key,
                  fingerprint: ident.fingerprint,
                  v3: true
                },
                development_mode: !BitGoConfig.env.isProd()
              });
              // Return promisified event callback
              // Synapse will send our window object a message event when
              // identity verification is completed or cancelled
              var d = $q.defer();
              $(window).one('message', d.resolve);
              return d.promise;
            }).then(function (event) {
              if (!event) {
                return;
              }
              try {
                if (event.originalEvent) {
                  event = event.originalEvent;
                }
                $(document.body).removeClass('identityDocumentVerification');
                // Here we get some data back from Synapse including
                // results of the identity verification
                var data = JSON.parse(event.data);
                if (data.success) {
                  // Enforce no duplicate identities
                  return IdentityAPI.verifyIdentity(ident.oauth_key).then(SettingsAPI.get).then(function () {
                    Notify.success('You\'re verified!');
                    $location.path('/settings');
                  });
                } else if (data.cancel) {
                  // User canceled
                  verifyError('Verification canceled');
                } else {
                  // Something went wrong
                  verifyError();
                }
              } catch (error) {
                console.log(error, event);
                verifyError();
              }
            }).catch(function (error) {
              openModal({
                url: 'identity/templates/identity-verification-failed-partial.html',
                type: 'identityVerificationFailed',
                locals: { retryTime: retryTimeString(error.retryTime) }
              }).then(function () {
                $location.path('/settings');
              });
            });
          }
        } catch (error) {
          console.log(error, event);
          verifyError();
        }
      }).catch(onCreateIdentityFail);
    }
    function onCreateIdentityFail(error) {
      if (Util.API.isOtpError(error)) {
        openModal({
          url: 'modal/templates/modalcontainer.html',
          type: 'otp'
        }).then(function (data) {
          if (data.type === 'otpsuccess') {
            $scope.createIdentity();
          }
        }).catch(onCreateIdentityFail);
      } else if (error.retryTime) {
        openModal({
          url: 'identity/templates/identity-verification-failed-partial.html',
          type: 'identityVerificationFailed',
          locals: { retryTime: retryTimeString(error.retryTime) }
        }).then(function () {
          $location.path('/settings');
        });
      } else if (error == 'cancel') {
        verifyError('Verification canceled');
      } else {
        verifyError(error);
      }
    }
    $scope.createIdentity = function createIdentity() {
      // Get browser fingerprint
      var d = $q.defer();
      new Fingerprint2().get(d.resolve);
      d.promise.then(function (fingerprint) {
        $scope.identity.fingerprint = fingerprint;
        return IdentityAPI.createIdentity($scope.identity);
      }).catch(onCreateIdentityFail).then(onCreateIdentitySuccess);
    };
    var killNameWatcher = $rootScope.$watch('currentUser.settings.name.full', function (name) {
        if (!$rootScope.currentUser.settings.email || $rootScope.currentUser.settings.email.email !== name) {
          $scope.identity.name = name;
        }
      });
    var killPhoneWatcher = $rootScope.$watch('currentUser.settings.phone.phone', function (phone) {
        $scope.identity.phone = phone;
      });
    var killIdentityWatcher = $rootScope.$watch('currentUser.settings.identity.verified', function (verified) {
        // Redirect to settings page if user is already verified
        if (verified) {
          $location.path('/settings');
        }
      });
    $scope.$on('$destroy', function () {
      angular.element(document.body).removeClass('identityDocumentVerification');
      killNameWatcher();
      killPhoneWatcher();
      killIdentityWatcher();
    });
    function init() {
      $rootScope.setContext('identityVerification');
    }
    init();
  }
]);/**
 * @ngdoc overview
 * @name BitGo.Identity
 * @description Handles identity verification
 */
angular.module('BitGo.Identity', [
  'BitGo.Identity.IdentityController',
  'BitGo.Identity.CreateFormDirective'
]);/* istanbul ignore next */
angular.module('BitGo.Interceptors.BrowserInterceptor', []).factory('BrowserInterceptor', [
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
angular.module('BitGo.Interceptors', ['BitGo.Interceptors.BrowserInterceptor']);/**
 * @ngdoc directive
 * @name jobsManager
 * @description
 * Directive to managing a listing of all jobs and state of the jobs page
 * @example
 *   <div jobs-manager></div>
 */
angular.module('BitGo.Marketing.JobsManagerDirective', []).directive('jobsManager', [
  'UtilityService',
  'RequiredActionService',
  'BG_DEV',
  'JobsAPI',
  'NotifyService',
  function (Util, RequiredActionService, BG_DEV, JobsAPI, Notify) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$rootScope',
        function ($scope, $rootScope) {
          // view states for the user settings area
          $scope.viewStates = [
            'showAllJobs',
            'showOneJob'
          ];
          // the current view state
          $scope.state = null;
          // template source for the current view
          $scope.jobTemplateSource = null;
          // The current job being selected
          $scope.currentJob = null;
          /**
        * Goes into one job and sets it as the currentJob
        * @params - The job which needs to be set
        * @private
        */
          $scope.goToJob = function (job) {
            if (!job) {
              return;
            }
            $scope.currentJob = job;
            $scope.setState('showOneJob');
          };
          // returns the view current view template (based on the $scope's current state)
          function getTemplate() {
            if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
              throw new Error('Expect $scope.state to be defined when setting template for enterprise settings');
            }
            var tpl;
            switch ($scope.state) {
            case 'showAllJobs':
              tpl = 'marketing/templates/allJobs.html';
              break;
            case 'showOneJob':
              tpl = 'marketing/templates/oneJob.html';
              break;
            }
            return tpl;
          }
          /**
        * Fetches all the jobs listed in the workable website
        * @private
        */
          function fetchJobs() {
            JobsAPI.list().then(function (data) {
              $scope.jobsList = data.jobs;
            }).catch(function (error) {
              Notify.error(error);
            });
          }
          // Event listeners
          var killStateWatch = $scope.$watch('state', function (state) {
              if (state) {
                $scope.jobTemplateSource = getTemplate();
              }
            });
          // Listener cleanup
          $scope.$on('$destroy', function () {
            killStateWatch();
          });
          function init() {
            $scope.state = 'showAllJobs';
            fetchJobs();
          }
          init();
        }
      ]
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
  'BG_DEV',
  function ($location, $scope, $rootScope, NotifyService, EnterpriseAPI, BG_DEV) {
    // We have one controller for all of the marketing pages, so we track
    // context switches using this URL-context map
    var URL_CONTEXT_MAP = {
        '/': BG_DEV.APP_CONTEXTS.marketingHome,
        '/platform': BG_DEV.APP_CONTEXTS.marketingAPI,
        '/enterprise': BG_DEV.APP_CONTEXTS.marketingEnterprise,
        '/terms': BG_DEV.APP_CONTEXTS.marketingTerms,
        '/jobs': BG_DEV.APP_CONTEXTS.marketingJobs,
        '/p2sh_safe_address': BG_DEV.APP_CONTEXTS.marketingWhitePaper,
        '/insurance': BG_DEV.APP_CONTEXTS.marketingInsurance,
        '/privacy': BG_DEV.APP_CONTEXTS.marketingPrivacy,
        '/press': BG_DEV.APP_CONTEXTS.marketingPress,
        '/cases': BG_DEV.APP_CONTEXTS.marketingCases,
        '/about': BG_DEV.APP_CONTEXTS.marketingAbout,
        '/services_agreement': BG_DEV.APP_CONTEXTS.marketingServicesAgreement,
        '/sla': BG_DEV.APP_CONTEXTS.marketingSla,
        '/api-pricing': BG_DEV.APP_CONTEXTS.marketingApiPricing
      };
    $scope.plans = BG_DEV.ENTERPRISE.SUPPORT_PLAN_LEVELS;
    // the user info object that is submitted when someone inquires about API or platform
    $scope.userInfo = null;
    // ServicesAgreement change whenever new version is updated
    $scope.ServicesAgreementSource = 'marketing/templates/services_agreement_v1.html';
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
      },
      {
        msg: 'Security is a top priority for us, and we are very excited about our partnership with BitGo, the recognized industry trend-setter for security of bitcoin storage and transactions.',
        person: 'Georgy Sokolov',
        company: 'e-Coin',
        position: 'Co-founder'
      },
      {
        msg: 'The safety of our clients\u2019 funds is our number one priority. BitGo\'s secure wallet and API allow us to innovate without compromising on our very high security standards.',
        person: 'Joe Lee',
        company: 'Magnr',
        position: 'CIO'
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
      } else {
        NotifyService.error('Please fill in email address before submitting');
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
angular.module('BitGo.Marketing', [
  'BitGo.Marketing.MarketingController',
  'BitGo.Marketing.JobsManagerDirective',
  'BitGo.Marketing.PressManagerDirective'
]);/**
 * @ngdoc directive
 * @name pressManager
 * @description
 * Directive to manage listing, pagination of press articles on the press page
 * @example
 *   <div press-manager></div>
 */
angular.module('BitGo.Marketing.PressManagerDirective', []).directive('pressManager', [function () {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        '$rootScope',
        function ($scope, $rootScope) {
          // view states for the user settings area
          $scope.viewStates = [
            'press',
            'branding'
          ];
          function init() {
            $scope.currentPage = 1;
            //The default page for pagination
            $scope.totalItems = 76;
            //Totals items to be paginated. Currently at 76 articles
            $scope.itemsPerPage = 12;
            //Number of items per page. Determines total number of pages
            $scope.state = 'press';
          }
          init();
        }
      ]
    };
  }]);/**
 * @ngdoc controller
 * @name MatchwalletController
 * @description
 * Controls the view state of the match wallet module.
 **/
angular.module('BitGo.Matchwallet.MatchwalletController', []).controller('MatchwalletController', [
  '$scope',
  'MatchwalletAPI',
  function ($scope, MatchwalletAPI) {
    // viewstates for the send flow
    $scope.viewStates = [
      'prepare',
      'confirmAndSend'
    ];
    // current view state
    $scope.state = 'prepare';
    // Matchwallet template helper
    $scope.canSendInvites = MatchwalletAPI.canSendInvites;
  }
]);// Module that manages match wallets and invitations
angular.module('BitGo.Matchwallet', [
  'BitGo.Matchwallet.MatchwalletController',
  'BitGo.Matchwallet.MatchwalletRewardWalletDirective',
  'BitGo.Matchwallet.MatchwalletSendManagerDirective',
  'BitGo.Matchwallet.MatchwalletSendStepsPrepareDirective',
  'BitGo.Matchwallet.MatchwalletSendStepsConfirmDirective'
]);/**
 * @ngdoc directive
 * @name matchwalletRewardWallet
 * @description
 * Directive to manage selecting a reward wallet
 * @example
 *   <div matchwallet-reward-wallet></div>
 */
angular.module('BitGo.Matchwallet.MatchwalletRewardWalletDirective', []).directive('matchwalletRewardWallet', [
  '$rootScope',
  'MatchwalletAPI',
  function ($rootScope, MatchwalletAPI) {
    return {
      restrict: 'A',
      templateUrl: 'matchwallet/templates/matchwallet-reward-wallet-partial.html',
      controller: [
        '$scope',
        function ($scope) {
          $scope.isCurrentRewardWallet = function (wallet) {
            if ($rootScope.matchwallets && $rootScope.matchwallets.current) {
              return $rootScope.matchwallets.current.data.rewardWalletId === wallet.data.id;
            } else if (_.isEmpty($rootScope.matchwallets.all)) {
              return $scope.rewardWalletId === wallet.data.id;
            }
          };
          function init() {
            if ($rootScope.matchwallets && $rootScope.matchwallets.current) {
              $scope.rewardWalletId = $rootScope.matchwallets.current.data.rewardWalletId;
            } else if ($rootScope.wallets) {
              $scope.rewardWalletId = _.findLastKey($rootScope.wallets.all);
            }
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name matchwalletSendManager
 * @description
 * Manages the state of the invitation send flow
 **/
angular.module('BitGo.Matchwallet.MatchwalletSendManagerDirective', []).directive('matchwalletSendManager', [
  '$rootScope',
  '$location',
  'BG_DEV',
  'AnalyticsProxy',
  function ($rootScope, $location, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^MatchwalletController',
      controller: [
        '$scope',
        function ($scope) {
          // Invitation default values
          var INVITATION_MESSAGE = 'Try out a BitGo secure wallet with some free bitcoin :)';
          // the invitation object built as the user goes through the send flow
          $scope.invitation = null;
          // Cancel the invitation send flow
          $scope.cancelSend = function () {
            AnalyticsProxy.track('cancelInvitation', {
              type: 'matchwallet',
              invitation: !!$rootScope.invitation
            });
            $location.path('/enterprise/personal/wallets');
          };
          // Called to reset the send flow's state and local invitation object
          $scope.resetSendManager = function () {
            // reset the local state
            setNewInvitationObject();
            $scope.setState('prepare');
          };
          // resets the local, working version of the invitation object
          function setNewInvitationObject() {
            delete $scope.invitation;
            // properties we can expect on the invitation object
            $scope.invitation = {
              matchwallet: null,
              amount: BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT,
              email: null,
              message: INVITATION_MESSAGE
            };
          }
          function init() {
            $rootScope.setContext('matchwalletSend');
            setNewInvitationObject();
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name matchwalletSendStepsConfirm
 * @description
 * Manages the send invitation confirmation step.
 **/
angular.module('BitGo.Matchwallet.MatchwalletSendStepsConfirmDirective', []).directive('matchwalletSendStepsConfirm', [
  '$q',
  '$timeout',
  '$rootScope',
  '$location',
  'NotifyService',
  'MatchwalletAPI',
  'UtilityService',
  'SDK',
  'BG_DEV',
  'AnalyticsProxy',
  function ($q, $timeout, $rootScope, $location, NotifyService, MatchwalletAPI, UtilityService, SDK, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^matchwalletSendManager',
      controller: [
        '$scope',
        function ($scope) {
          // Max wallet sync fetch retries allowed
          var MAX_WALLET_SYNC_FETCHES = 5;
          // count for wallet sync data fetches
          var syncCounter;
          // flag letting us know when the invitation has been sent
          $scope.invitationSent = null;
          // state for the ui buttons to be diabled
          $scope.processing = null;
          // flag set if last invitation was sent
          $scope.lastInvitationSent = false;
          $scope.goToActivityFeed = function () {
            $location.path('/enterprise/personal/activity');
          };
          // Resets all the local state on this scope
          function resetLocalState() {
            $scope.invitationSent = null;
          }
          function handleInvitationSendError(error) {
            $scope.processing = false;
            if (error && error.error) {
              NotifyService.errorHandler(error);
              return;
            }
            NotifyService.error('Your invitation was unable to be processed. Please refresh your page and try sending again.');
          }
          function openModal(params) {
            return $modal.open({
              templateUrl: params.url,
              controller: 'ModalController',
              scope: $scope,
              resolve: {
                locals: function () {
                  return _.merge({
                    type: BG_DEV.MODAL_TYPES[params.type],
                    userAction: BG_DEV.MODAL_USER_ACTIONS[params.type]
                  }, params.locals);
                }
              }
            }).result;
          }
          /**
         * Fetch a wallet to sync it's balance/data with the latest data from the server
         * based on the user's recent action taken
         */
          function syncCurrentMatchwallet() {
            if (syncCounter >= MAX_WALLET_SYNC_FETCHES) {
              return;
            }
            var params = { id: $rootScope.matchwallets.current.data.id };
            MatchwalletAPI.getMatchwallet(params, false).then(function (matchwallet) {
              // If the new balance hasn't been picked up yet on the backend, refetch
              // to sync up the client's data
              if (matchwallet.data.balance === $rootScope.matchwallets.current.data.balance) {
                syncCounter++;
                $timeout(function () {
                  syncCurrentMatchwallet();
                }, 2000);
                return;
              }
              // Since we have a new balance on this wallet
              // Fetch the latest wallet data
              // (this will also update the $rootScope.currentMatchwallet)
              MatchwalletAPI.getAllMatchwallets();
              // reset the sync counter
              syncCounter = 0;
            });
          }
          /**
         * Send invitation
         *
         * @returns {Object} promise for sending the invitation
         */
          $scope.sendInvitation = function () {
            $scope.processing = true;
            $scope.invitation.id = $rootScope.matchwallets.current.data.id;
            return MatchwalletAPI.sendInvitation($scope.invitation).then(function (res) {
              // Handle the success state in the UI
              var balance = $rootScope.matchwallets.current.data.balance - $scope.invitation.amount;
              if (balance < BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT) {
                $scope.lastInvitationSent = true;
              }
              $scope.invitationSent = true;
              $scope.processing = false;
              // Track successful send
              AnalyticsProxy.track('sendInvitation', {
                type: 'matchwallet',
                amount: $scope.invitation.amount,
                invitation: !!$rootScope.invitation
              });
              // Sync up the new balances data across the app
              return syncCurrentMatchwallet();
            }).catch(function (error) {
              handleInvitationSendError(error);
            });
          };
          // Cleans out the scope's invitation object and takes the user back to the first step
          $scope.sendMoreInvites = function () {
            AnalyticsProxy.track('sendMoreInvitations', {
              type: 'matchwallet',
              invitation: !!$rootScope.invitation
            });
            resetLocalState();
            $scope.resetSendManager();
          };
          function init() {
            if (!$scope.invitation) {
              throw new Error('Expect a transaction object when initializing');
            }
            syncCounter = 0;
            $scope.processing = false;
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name matchwalletSendStepsPrepare
 * @description
 * Manages the send invitation prepare step.
 **/
angular.module('BitGo.Matchwallet.MatchwalletSendStepsPrepareDirective', []).directive('matchwalletSendStepsPrepare', [
  '$q',
  '$rootScope',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'BG_DEV',
  'AnalyticsProxy',
  function ($q, $rootScope, NotifyService, CacheService, UtilityService, BG_DEV, AnalyticsProxy) {
    return {
      restrict: 'A',
      require: '^matchwalletSendManager',
      controller: [
        '$scope',
        function ($scope) {
          var minAmount = _.string.numberFormat(BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT / 100);
          // form error constants
          var ERRORS = {
              invalidEmail: { msg: 'Please enter a valid email address.' },
              sendToSelf: { msg: 'You cannot send to yourself.' },
              invalidAmount: { msg: 'Please enter a valid amount.' },
              insufficientFunds: { msg: 'Wallet does not contain enough funds to send this amount.' },
              alreadyInvited: { msg: 'You have already sent an invitation to this email address.' },
              invitationAmountTooSmall: { msg: 'The minimum invitation gift is ' + minAmount + ' bits' },
              amountTooSmall: { msg: 'This transaction amount is too small to send.' }
            };
          // function to set error on form and turn off processing flag
          function setErrorOnForm(errMsg) {
            if (!errMsg || typeof errMsg !== 'string') {
              throw new Error('Invalid form error');
            }
            $scope.setFormError(errMsg);
          }
          // Validate the transaciton input form
          function invitationIsValid() {
            var currentMatchwallet = $rootScope.matchwallets.current;
            var currentMatchwalletId = currentMatchwallet.data.id;
            var balance = currentMatchwallet.data.balance;
            var alreadyInvited = currentMatchwallet.data.invitations.filter(function (invitation) {
                return $scope.invitation.email == invitation.email;
              });
            // ensure a valid recipient address
            if (!($scope.invitation.email || '').match(/^[^@]+@[^@]+$/)) {
              setErrorOnForm(ERRORS.invalidEmail.msg);
              return false;
            }
            // ensure they're not sending coins to this wallet's address
            if ($scope.invitation.email == $rootScope.currentUser.settings.email.email) {
              setErrorOnForm(ERRORS.sendToSelf.msg);
              return false;
            }
            // ensure they're not sending coins to the same address multiple times
            if (alreadyInvited.length) {
              setErrorOnForm(ERRORS.alreadyInvited.msg);
              return false;
            }
            // ensure a valid amount
            if (!parseFloat($scope.invitation.amount)) {
              setErrorOnForm(ERRORS.invalidAmount.msg);
              return false;
            }
            // ensure they are not entering an amount greater than they're balance
            if ($scope.invitation.amount > balance) {
              setErrorOnForm(ERRORS.insufficientFunds.msg);
              return false;
            }
            // ensure amount is greater than the minimum invitation value
            if ($scope.invitation.amount < BG_DEV.MATCHWALLET.MIN_INVITATION_AMOUNT) {
              setErrorOnForm(ERRORS.invitationAmountTooSmall.msg);
              return false;
            }
            // ensure amount is greater than the minimum dust value
            if ($scope.invitation.amount <= BG_DEV.TX.MINIMUM_BTC_DUST) {
              setErrorOnForm(ERRORS.amountTooSmall.msg);
              return false;
            }
            return true;
          }
          // advances the invitation state if the for and inputs are valid
          $scope.advanceInvitation = function () {
            $scope.clearFormError();
            if (invitationIsValid()) {
              AnalyticsProxy.track('prepareInvitation', {
                type: 'matchwallet',
                invitation: !!$rootScope.invitation
              });
              $scope.setState('confirmAndSend');
            }
            // The result of this function is only ever checked in tests.
            // However, rather than return false, it is good practice to return a
            // promise, since this function is asynchronous, and thus should
            // always return a promise.
            return $q(function (resolve, reject) {
              return resolve(false);
            });
          };
          function init() {
            if (!$scope.invitation) {
              throw new Error('Expect a invitation object when initializing');
            }
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name modalAccountDeactivation
 * @description 
 * Directive to help with user account deactivation
 *
 */
angular.module('BitGo.Modals.ModalAccountDeactivationDirective', []).directive('modalAccountDeactivation', [
  '$location',
  'UtilityService',
  'NotifyService',
  'UserAPI',
  'BG_DEV',
  function ($location, Util, Notify, UserAPI, BG_DEV) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        '$timeout',
        function ($scope, $timeout) {
          $scope.viewStates = [
            'confirm',
            'form'
          ];
          $scope.data = null;
          function onLogoutSuccess() {
            $location.path('/login');
          }
          $scope.deactivateUser = function () {
            $scope.setState('form');
          };
          $scope.confirmDeactivation = function () {
            UserAPI.deactivate($scope.data).then(UserAPI.logout).then($scope.closeWithSuccess({ type: 'dismissOfflineWarning' })).then(onLogoutSuccess).then(function () {
              Notify.success('User Account Removed');
            }).catch(Notify.errorHandler);
          };
          function init() {
            $scope.state = 'confirm';
            // Including the form field 
            $scope.data = { deactivationForm: '' };
          }
          init();
        }
      ]
    };
  }
]);/*
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
        tpl = 'modal/templates/otp-password-unlock.html';
        break;
      // This case handles the case when only password is needed
      case BG_DEV.MODAL_TYPES.passwordThenUnlock:
        // Sets initial state to password. (Starts the flow from there)
        $scope.userUnlocked = true;
        // Get the time which the user is unlocked from cache if possible
        tpl = 'modal/templates/otp-password-unlock.html';
        break;
      // This case handles the case when only otp is needed
      case BG_DEV.MODAL_TYPES.otp:
        tpl = 'modal/templates/otp.html';
        break;
      // This case handles when the app is offline
      case BG_DEV.MODAL_TYPES.offlineWarning:
        tpl = 'modal/templates/modal-offline-warning.html';
        break;
      // This case handles user deactivation
      case BG_DEV.MODAL_TYPES.deactivationConfirmation:
        tpl = 'modal/templates/deactivationConfirmation.html';
        break;
      // This case handles the qr modal for viewing receiving addresses
      case BG_DEV.MODAL_TYPES.qrReceiveAddress:
        tpl = 'modal/templates/qrReceiveAddress.html';
        break;
      case BG_DEV.MODAL_TYPES.ssReceiveAltCoin:
        tpl = 'modal/templates/ssReceiveAltCoin.html';
        break;
      case BG_DEV.MODAL_TYPES.createWallet:
        tpl = 'modal/templates/createWallet.html';
        break;
      case BG_DEV.MODAL_TYPES.fundWallet:
        tpl = 'modal/templates/fundWallet.html';
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
      // if it's a modal for accepting share, we need wallet name as well
      if (locals.userAction === BG_DEV.MODAL_USER_ACTIONS.acceptShare && !locals.walletName) {
        throw new Error('Modal controller expected wallet name');
      }
      $scope.templateSource = getTemplate();
      currentModalFlow = BG_DEV.MODAL_TYPES[locals.type];
    }
    init();
  }
]);angular.module('BitGo.Modals.ModalCreateWallet', []).directive('modalCreateWallet', [
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  'AnalyticsProxy',
  '$window',
  '$location',
  'RequiredActionService',
  '$rootScope',
  'MatchwalletAPI',
  function (Util, NotifyService, BG_DEV, AnalyticsProxy, $window, $location, RequiredActionService, $rootScope, MatchwalletAPI) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        function ($scope) {
          $scope.invitationGiftPending = MatchwalletAPI.invitationGiftPending;
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
              $scope.closeWithSuccess();
            } catch (error) {
              console.error('Expect $rootScope\'s current enterprise to be set.');
            }
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name modalFundWalletDirective
 * @description
 * 
 * Manages the modal which prompts users with a wallet and no Bitcoin to fund their wallets or to buy bitcoin
 * Requires: ModalController
 * @example
 *   <div modal-fund-wallet></div>
 * 
 **/
/* istanbul ignore next - modal controller covers all functionality*/
angular.module('BitGo.Modals.ModalFundWallet', []).directive('modalFundWallet', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        function ($scope) {
          // Link off to the create new wallet flow
          $scope.modalFundWallet = _.findKey($rootScope.wallets.all);
        }
      ]
    };
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
  'BitGo.Modals.ModalOtpPasswordFormDirective',
  'BitGo.Modals.ModalOfflineWarningDirective',
  'BitGo.Modals.ModalAccountDeactivationDirective',
  'BitGo.Modals.ModalQrReceiveAddressDirective',
  'BitGo.Modals.ModalReceiveAltCoinDirective',
  'BitGo.Modals.ModalCreateWallet',
  'BitGo.Modals.ModalFundWallet'
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
        'CacheService',
        function ($scope, CacheService) {
          /** form data handler */
          $scope.form = null;
          // Cache setup
          var unlockTimeCache = CacheService.getCache('unlockTime') || new CacheService.Cache('sessionStorage', 'unlockTime', 120 * 60 * 1000);
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
              UserAPI.unlock(params).then(function (data) {
                unlockTimeCache.add('time', data.session.unlock.expires);
                onSubmitSuccess();
              }).catch(onSubmitError);
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
 * @name modalOtpPasswordFormDirective
 * @description
 * Manages the form for the modal with the otp and password fields. Also stores/gets the unlock time for the user
 * Requires: ModalController
 * @example
 *   <div modal-otp-password-form></div>
 */
angular.module('BitGo.Modals.ModalOtpPasswordFormDirective', []).directive('modalOtpPasswordForm', [
  '$rootScope',
  'UtilityService',
  'UserAPI',
  'NotifyService',
  'BG_DEV',
  'KeychainsAPI',
  '$q',
  'WalletsAPI',
  '$location',
  '$timeout',
  'CacheService',
  'SDK',
  function ($rootScope, Util, UserAPI, NotifyService, BG_DEV, KeychainsAPI, $q, WalletsAPI, $location, $timeout, CacheService, SDK) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        '$timeout',
        function ($scope, $timeout) {
          // If the user is accepting a wallet share, then we use a unique ui
          $scope.isAcceptingShare = null;
          // Error messages to be shown on the form
          $scope.otpError = false;
          $scope.passwordError = false;
          // form data handler
          $scope.form = null;
          // Cache setup
          var unlockTimeCache = CacheService.getCache('unlockTime') || new CacheService.Cache('sessionStorage', 'unlockTime', 120 * 60 * 1000);
          // variable to start and stop the $timeout function
          var timeOut;
          // unlock time contains the difference between the unlock expiration time and the current time (in seconds)
          $scope.unlockTimeRemaining = 0;
          // unlock time to be displayed on the modal (with the countdown)
          $scope.prettyUnlockTime = '2-step verification unlocked';
          // flag to indicate if a user has an otp device set
          $scope.otpDeviceSet = !!$scope.user.settings.otpDevices.length;
          /**
         * Validate the password field of the form;
         * @private
         */
          function passwordIsValid() {
            return $scope.form.password && $scope.form.password !== '';
          }
          /**
         * function to check if the otp submitted is valid
         * @private
         * @returns {boolean} indicating if otp is valid
         */
          function otpIsValid() {
            if ($scope.userUnlocked) {
              return true;
            }
            if (!$scope.otpDeviceSet) {
              return true;
            }
            return Util.Validators.otpOk($scope.form.otp);
          }
          function onPwVerifySuccess() {
            $scope.$emit('modalOtpThenUnlockManager.OtpAndUnlockSuccess', $scope.form);
          }
          /**
         * Sets the otp error on the form
         * @private
         * @params {object} error. We could have a custom error if needed
         */
          function onOtpSubmitError(error) {
            $scope.otpError = true;
          }
          /**
         * Converts seconds into a UI displayable format (m:ss)
         * @private
         * @params {number} The seconds needed to be displayed
         * @returns {String} Prettified time to be displayed
         */
          function getPrettyTime(seconds) {
            if (!seconds) {
              console.log('Could not get seconds to convert in modal');
              return;
            }
            var minutes = Math.floor(seconds / 60);
            seconds = seconds - minutes * 60;
            return minutes + ':' + ('0' + seconds).slice(-2);
          }
          /**
         * Function for counting down the unlock time. Sets the display variable on the scope for the UI
         */
          function onTimeout() {
            $scope.unlockTimeRemaining--;
            $scope.prettyUnlockTime = '2-step verification unlocked for ' + getPrettyTime($scope.unlockTimeRemaining);
            if ($scope.unlockTimeRemaining === 0) {
              $scope.prettyUnlockTime = '2-step verification unlocked';
              $timeout.cancel(timeOut);
              $scope.userUnlocked = false;
              return;
            }
            timeOut = $timeout(onTimeout, 1000);
          }
          /**
         * Starts the countdown
         */
          function startTimeout() {
            if ($scope.userUnlocked && $scope.otpDeviceSet) {
              if (unlockTimeCache.get('time')) {
                var endUnlockTime = new Date(unlockTimeCache.get('time'));
                var currentTime = new Date();
                $scope.unlockTimeRemaining = Math.floor((endUnlockTime.getTime() - currentTime.getTime()) / 1000);
              } else {
                throw new Error('Could not read unlock time from cache');
              }
              timeOut = $timeout(onTimeout, 1000);
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
                var privKey = SDK.decrypt(password, keychain.encryptedXprv);
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
              var privKey = SDK.decrypt(password, wallet.data.private.userPrivKey);
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
            return $q.reject();
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
          /**
         * Clears the form errors on the otp-password form
         * @private
         */
          function clearErrors() {
            $scope.otpError = false;
            $scope.passwordError = false;
          }
          /**
         * Function which redirects the user to wallet recovery and closes modal
         */
          $scope.forgotPassword = function () {
            $scope.closeWithError('cancel');
            if ($scope.isAcceptingShare) {
              $location.path('/forgotpassword');
            } else {
              $location.path('/enterprise/' + $rootScope.enterprises.current.id + '/wallets/' + $rootScope.wallets.current.data.id + '/recover');
            }
          };
          /**
         * Function which verifies submitted password. Shows error if not valid or there's a decryption error
         */
          function verifyPassword() {
            if (passwordIsValid()) {
              getUserKeychain().catch(function () {
                $scope.passwordError = true;
              });
            } else {
              $scope.passwordError = true;
            }
          }
          /**
         * Function for submitting the form. Unlocks the user if needed and calls verifyPassword function
         */
          $scope.submitVerification = function () {
            clearErrors();
            if (otpIsValid() || $scope.userUnlocked) {
              var params = { otp: $scope.form.otp };
              // If creating an access token, do not try to do an unlock - we are using the otp directly
              if ($scope.locals.userAction === BG_DEV.MODAL_USER_ACTIONS.createAccessToken || $scope.userUnlocked) {
                return verifyPassword();
              }
              UserAPI.unlock(params).then(function (data) {
                $scope.userUnlocked = true;
                unlockTimeCache.add('time', data.session.unlock.expires);
                startTimeout();
                verifyPassword();
              }).catch(onOtpSubmitError);
            } else {
              $scope.otpError = true;
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
          function onResendSuccess() {
            NotifyService.success('Your code was successfully resent.');
          }
          function onResendFail() {
            NotifyService.error('There was an issue sending the code.');
          }
          /**
         * Function which sends an sms message to the user for otp verification
         */
          $scope.resendOTP = function () {
            var params = { forceSMS: true };
            UserAPI.sendOTP(params).then(onResendSuccess).catch(onResendFail);
          };
          function init() {
            $scope.form = {
              otp: '',
              password: ''
            };
            setModalActions();
            startTimeout();
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name modalQrReceiveAddress
 * @description
 * Manages the qr receive address template
 * @example
 *   <div modal-qr-receive-address></div>
 */
angular.module('BitGo.Modals.ModalQrReceiveAddressDirective', []).directive('modalQrReceiveAddress', [
  '$rootScope',
  'StatusAPI',
  'WalletsAPI',
  'LabelsAPI',
  function ($rootScope, StatusAPI, WalletsAPI, LabelsAPI) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        function ($scope) {
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name modalReceiveAltCoin
 * @description
 * Manages AltCoin receive process, it shows the dropdown with
 * the different coins loaded, then when the user selects one of them
 * it makes a call to the ssAPI to retreive the deposit address
 * and the rate of conversion between pairs, it also shows a qr code with
 * the generated address
 */
angular.module('BitGo.Modals.ModalReceiveAltCoinDirective', []).directive('modalReceiveAltCoin', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      require: '^ModalController',
      controller: [
        '$scope',
        'ssAPI',
        'NotifyService',
        function ($scope, ssAPI, NotifyService) {
          // Does an error happens inside the dropdown?
          $scope.hasAltErrors = false;
          // Its the dropdown unable to load the altcions?
          $scope.unableToLoadAltCoins = false;
          // Are we generating a receive address for the altCoin?
          $scope.addressBeingGenerated = false;
          // the transaction object built as the user goes request a new receive address
          $scope.receiveAltCoin = {
            altCoin: {
              useAltCoin: false,
              selected: null,
              receive: true,
              symbol: null,
              rate: 0,
              limit: 0,
              min: 0,
              minerFee: 0,
              recipientAddress: $rootScope.wallets.current.data.id,
              returnAddres: null,
              depositAddress: null,
              label: null,
              ignoreList: ['BTC']
            }
          };
          /**
          Set the values to the current scope using the marketInfo response
          @private setAltCoinValuesToScope
          @param altCoin: Received data from ssAPI when calling the marketInfo api.
        */
          function setAltCoinValuesToScope(altCoin) {
            $scope.receiveAltCoin.altCoin.rate = altCoin.rate;
            $scope.receiveAltCoin.altCoin.limit = altCoin.limit;
            $scope.receiveAltCoin.altCoin.min = altCoin.min;
            $scope.receiveAltCoin.altCoin.minerFee = altCoin.minerFee;
            $scope.receiveAltCoin.altCoin.symbol = altCoin.symbol;
            $scope.receiveAltCoin.altCoin.label = $scope.receiveAltCoin.altCoin.selected;
          }
          /**
        This method validates the shift response data, by cheking
        the values on the response, if the data.error key is present
        means that we receive an error from Shapeshift :(
        @private validateShiftResponse
        @param data: Incoming response when fetching data from ssAPI
        */
          function validateShiftResponse(data) {
            // Something happens with Shapeshift? We should not hit
            // this statement never.
            if (_.isUndefined(data) || data === null) {
              throw new Error('unableToGetDepositAddress');
            }
            // Does Shapeshift return an error? :(
            if (!_.isUndefined(data.error)) {
              // Let's raise the exception to be handled on the catch block
              throw new Error(data.error);  // handled on the catch block
            }
          }
          /**
          When user change the type of coin we generate a new address for this
          by calling the ShapeShift API, to retreive a deposit address for it
          @public
        */
          $scope.changeCoin = function (altCoin) {
            // Get the coin
            $scope.receiveAltCoin.altCoin.selected = altCoin.name;
            //var altCoin = ssAPI.getByName($scope.receiveAltCoin.altCoin.selected);
            $scope.receiveAltCoin.altCoin.symbol = altCoin.symbol;
            $scope.addressBeingGenerated = true;
            $scope.hasAltErrors = false;
            // Use the Shapeshift API to get market info like rates, and limits
            ssAPI.getMarketInfo($scope.receiveAltCoin.altCoin.selected, true).then(function (altCoin) {
              // Let's check the response
              validateShiftResponse(altCoin);
              // Fill required data for shapeshift exchange.
              setAltCoinValuesToScope(altCoin);
              // Let's get the deposit address from Shapeshift :)
              var shiftParams = ssAPI.getShiftParams($scope.receiveAltCoin.altCoin);
              return ssAPI.shift(shiftParams);
            }).then(function (data) {
              // Let's check the response
              validateShiftResponse(data);
              // Asign the received address from shapeshift to be displayed on screen
              $scope.receiveAltCoin.altCoin.depositAddress = data.deposit;
              $scope.receiveAltCoin.altCoin.useAltCoin = true;
            }).catch(function (error) {
              $scope.hasAltErrors = true;
              // Try to find the error on the ShapeShift error dictionary, if the error is found means
              // that a known error happens on the shapeshift flow.
              var shapeshiftError = ssAPI.getError(error);
              if (shapeshiftError !== null) {
                // Show the error
                NotifyService.error(shapeshiftError.msg);
              } else {
                NotifyService.errorHandler(error);
              }
            }).finally(function () {
              $scope.addressBeingGenerated = false;
            });
          };
        }
      ]
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
  'BG_DEV',
  function ($rootScope, BG_DEV) {
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
      this.latestSAVersionSigned = data.latestSAVersionSigned;
      this.walletCount = 0;
      this.balance = 0;
      this.walletShareCount = {
        incoming: 0,
        outgoing: 0
      };
      this.supportPlan = data.supportPlan;
      this.customerData = data.customerData;
      // TODO Barath: A better way to check if the user is admin of an enterprise?
      this.isAdmin = !!data.primaryContact;
      // If the enterprise is personal, the user is an admin on it
      if (this.isPersonal) {
        this.isAdmin = true;
      }
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
    * Decorator: Adds approvals to the enterprise object 
    * @param approvals {Array} approvals associated with this enterprise
    * @returns {Int} num of keys in the enterprise's pending approval object
    * @public
    */
    Enterprise.prototype.setApprovals = function (approvals) {
      if (!approvals) {
        return;
      }
      if (!this.pendingApprovals) {
        this.pendingApprovals = {};
      }
      var self = this;
      _.forEach(approvals, function (approval) {
        self.pendingApprovals[approval.id] = approval;
      });
      return _.keys(this.pendingApprovals).length;
    };
    /**
    * Check if an enterprise has a credit card on file
    *
    * @returns { Bool }
    * @public
    */
    Enterprise.prototype.hasPaymentOnFile = function () {
      return this.customerData && this.customerData.sources && this.customerData.sources.data && this.customerData.sources.data.length > 0;
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
]);// Model for Match Wallets
angular.module('BitGo.Models.MatchwalletModel', []).factory('MatchwalletModel', function () {
  function Matchwallet(matchwalletData) {
    this.data = matchwalletData;
  }
  return { Matchwallet: Matchwallet };
});angular.module('BitGo.Model', [
  'BitGo.Models.EnterpriseModel',
  'BitGo.Models.UserModel',
  'BitGo.Models.WalletModel',
  'BitGo.Models.MatchwalletModel',
  'BitGo.Utility'
]);// Model for the App's Current User
angular.module('BitGo.Models.UserModel', []).factory('UserModel', [
  '$location',
  '$rootScope',
  'BG_DEV',
  function ($location, $rootScope, BG_DEV) {
    // holds basic settings for creating new placeholder users
    // (these are temp users used before a session signs in/up)
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
        },
        otpDevices: []
      };
    /**
    * Constructor for user objects
    *
    * @param { Bool } loggedIn - state of the user being created
    * @param { Object } settings - user settings object from BitGo service
    *
    * @returns { Object } new user instance used throughout the app
    * @public
    */
    function User(loggedIn, settings) {
      this.settings = settings;
      // set to true when a user has a valid token
      this.loggedIn = loggedIn;
      // set to true when a user has a saved/verified phone
      this.hasAccess = this.checkAccess();
      // This may be a temporary fix, since each user has a stripe subs, 
      // and hence must have a plan object,
      // yet there have been a number of Sentry bug reports indicate otherwise.
      // details: https://app.getsentry.com/bitgo/bitgo-client/group/70114184/
      this.plan = this.getPlan() || BG_DEV.USER.ACCOUNT_LEVELS.grandfathered;
    }
    /**
    * Get the plan on the user from the stripe object
    *
    * @public
    */
    User.prototype.getPlan = function () {
      if (this.settings.stripe) {
        var planId = this.settings.stripe.subscription.data.plan.id;
        return _.find(BG_DEV.USER.ACCOUNT_LEVELS, function (plan) {
          return plan.planId === planId;
        });
      }
    };
    /**
    * Check if the user is an enterprise customer
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isEnterpriseCustomer = function () {
      return this.settings.enterprises && this.settings.enterprises.length > 0;
    };
    /**
    * Check if the user's account is grandfathered
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isGrandfathered = function () {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.grandfathered.name;
    };
    /**
    * Check if the user's account is basic
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isBasic = function () {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.basic.name;
    };
    /**
    * Check if the user's account is plus
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isPlus = function () {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.plusMonthly.name;
    };
    /**
    * Check if the user's account is pro. If the user is an Enterprise customer, he is by default a pro user
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isPro = function () {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.proMonthly.name;
    };
    /**
     *  Check if the user has an Authy device
     *  @returns { bool }
     *  @public
     */
    User.prototype.isAuthyUser = function () {
      if (this.settings.otpDevices.length > 0) {
        var index = _.findIndex(this.settings.otpDevices, { 'type': 'authy' });
        return index > -1;
      }
    };
    /**
    * Get the users phone
    *
    * @public
    */
    User.prototype.getPhone = function () {
      var otpDevices = this.settings.otpDevices;
      if (!this.isAuthyUser()) {
        return false;
      }
      var index = function () {
        return _.findIndex(otpDevices, { 'type': 'authy' });
      };
      return this.settings.otpDevices[index()].phone;
    };
    /**
    * Check if the user's phone is set
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.phoneNotSet = function () {
      if (!this.settings.phone || this.settings.phone.phone === '') {
        return true;
      }
      return false;
    };
    /**
    * Check if the user's email is set
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.emailNotSet = function () {
      if (!this.settings.email || this.settings.email.email === '') {
        return true;
      }
      return false;
    };
    /**
    * Check if the user's email is verified
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.emailNotVerified = function () {
      return !this.settings.email.verified;
    };
    /**
    * Check if user has a credit card on file
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.hasPaymentOnFile = function () {
      return this.settings.stripe && this.settings.stripe.customer && this.settings.stripe.customer.data && this.settings.stripe.customer.data.sources && this.settings.stripe.customer.data.sources.data.length > 0;
    };
    /**
    * Check if the user has access to use the app, or if they need to upgrade
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.checkAccess = function () {
      // ensure they have a verified email first
      if (this.emailNotSet() || this.emailNotVerified()) {
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
        // Admin (can do everything)
        if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) > -1 && permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1 && permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.ADMIN;  // Spender (cannot set policy)
        } else if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) == -1 && permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1 && permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.SPEND;  // Viewer (cannot set policy or spend)
        } else if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) == -1 && permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) == -1 && permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
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
        console.error('Missing policy rules');
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
    * Check if the user's role on the wallet is Admin
    * @returns {Boolean} if is Admin
    * @public
    */
    Wallet.prototype.roleIsAdmin = function () {
      return this.role === BG_DEV.WALLET.ROLES.ADMIN;
    };
    /**
    * Check if the user's role on the wallet is a Viewer
    * @returns {Boolean} if user is Viewer
    * @public
    */
    Wallet.prototype.roleIsViewer = function () {
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
]);/**
 * @ngdoc controller
 * @name CompanyProofController
 * @description
 * Manages all things dealing with a company-wide proof of reserves
 */
angular.module('BitGo.Proof.CompanyProofController', []).controller('CompanyProofController', [
  '$scope',
  '$rootScope',
  '$location',
  '$q',
  'ProofsAPI',
  'EnterpriseAPI',
  'NotifyService',
  function ($scope, $rootScope, $location, $q, ProofsAPI, EnterpriseAPI, NotifyService) {
    var DEFAULT_PROOF_ID = 'latest';
    var ERROR_HANDLERS = {
        SERVER_INVALID_PROOF_ID: 'invalid proof id',
        SERVER_MISSING_ENTERPRISE: 'missing enterprise',
        CLIENT_FAIL_SINGLE_LIABILITY_BUILD: 'could not build single liability',
        CLIENT_INVALID_URL_FOR_REDIRECT: 'invalid url for redirect',
        CLIENT_NEEDS_REDIRECT_FROM_LATEST: 'needs redirect from latest'
      };
    // Boolean wto check if url entered is valid
    var validUrl = true;
    // Data for user-specific liabilities
    $scope.allUserLiabilities = [];
    // Holds the basic info for the current enterprise proof we're fetching
    $scope.currentEnterprise = undefined;
    // a pretty timestamp of the current enterprise proof
    $scope.prettyEnterpriseProofTimestamp = undefined;
    // visibility of details (which section is open)
    $scope.detailsVisible = undefined;
    // UI visible proof data for the enterprise and single user proofs
    $scope.enterpriseProofs = [];
    // an object holding all search query params from the url
    var query = $location.search();
    // Enterprise-specific data in the url - required
    // specific id for the enterprise proof to fetch
    var urlProofId;
    // enterprise name
    $scope.urlEnterpriseName = undefined;
    // User-specific data in the url - not required
    // nonce for the user for a specific liability proof
    var urlNonce;
    // id of the user that for which we're fetching a specific liability
    $scope.urlUserId = undefined;
    /**
    * Utility function to let us know if we're fetching a specific liability proof
    * @private
    * @returns { Bool }
    */
    function isUserSpecificProofUrl() {
      return query && _.has(query, 'user');
    }
    /**
    * Utility function to let us know if the url is right
    * @public
    * @returns { Bool }
    */
    $scope.isValidUrl = function () {
      return validUrl && ($scope.allUserLiabilities.length || !isUserSpecificProofUrl());
    };
    $scope.toggleDetails = function (section) {
      if ($scope.detailsVisible === section) {
        $scope.detailsVisible = undefined;
      } else {
        $scope.detailsVisible = section;
      }
    };
    $scope.detailsOpen = function (section) {
      return $scope.detailsVisible === section;
    };
    $scope.detailsLabel = function (section) {
      return $scope.detailsOpen(section) ? 'Close' : 'Details';
    };
    $scope.formatBalance = function (balance) {
      balance = Number(balance);
      var parts = balance.toString().split('.');
      var decimals = 2;
      if (parts.length === 2 && parts[1].length > 2) {
        decimals = parts[1].length;
      }
      return _.string.numberFormat(balance, decimals);
    };
    /**
    * URL - Parses the URL for all data we need to instantiate the proof controller
    * @private
    */
    function urlParseForParams() {
      // Valid / expected url formats:
      // /vbb/:enterpriseName/latest
      // /vbb/:enterpriseName/latest?user=[someuserid]&nonce=[somenonce]
      // /vbb/:enterpriseName/:proofId
      // /vbb/:enterpriseName/:proofId?user=[someuserid]&nonce=[somenonce]
      var urlParams = $location && $location.path().split('/');
      var startIdx = urlParams && urlParams.indexOf('vbb');
      // temp fix for changeTip
      if (startIdx === -1) {
        startIdx = urlParams.indexOf('proof');
      }
      function getProofIdFromUrl() {
        urlProofId = urlParams[startIdx + 2];
        if (!urlProofId) {
          // If no proof ID in the url, default to the latest proof
          urlProofId = DEFAULT_PROOF_ID;
        }
        return urlProofId;
      }
      $scope.urlEnterpriseName = urlParams[startIdx + 1].toLowerCase();
      $scope.urlUserId = query.user;
      urlNonce = query.nonce;
      urlProofId = getProofIdFromUrl();
    }
    /**
    * URL - Return the ID of the Proof that we're fetching
    * @private
    * @returns { String }
    */
    function urlGetProofIdForRedirect(proofs) {
      if (!proofs) {
        throw new Error(ERROR_HANDLERS.CLIENT_INVALID_URL_FOR_REDIRECT);
      }
      if (urlProofId === DEFAULT_PROOF_ID) {
        return proofs[0].id;
      }
      return _.filter(proofs, function (proof) {
        return proof.id === $scope.currentEnterprise.id;
      })[0];
    }
    /**
    * URL - Handle necessary redirects
    * @param { data } returned list of proofs for an enterprise
    * @private
    * @returns { Promise }
    */
    function urlHandleRedirect(data) {
      // If the proofid is 'latest' in the url, then grab the latest
      // proof from the list of proofs, set that as the proof to fetch,
      // and redirect to the proper formatted url
      if (urlProofId === DEFAULT_PROOF_ID) {
        var redirectId;
        try {
          redirectId = urlGetProofIdForRedirect(data.proofs);
        } catch (error) {
          throw new Error(ERROR_HANDLERS.CLIENT_INVALID_URL_FOR_REDIRECT);
        }
        return $q.reject({
          message: ERROR_HANDLERS.CLIENT_NEEDS_REDIRECT_FROM_LATEST,
          data: {
            path: '/vbb/' + $scope.urlEnterpriseName + '/' + redirectId,
            search: {
              user: $scope.urlUserId,
              nonce: urlNonce
            }
          }
        });
      }
      // Otherwise simply fetch the proof id from the url
      return ProofsAPI.get(urlProofId);
    }
    /**
    * UI Helper - Generate ui-consumable proof object (currently we only support xbt)
    * @param { Object } assets        a specific proof's assets
    * @param { Object } liabilities   a specific proof's liabilites
    * @private
    * @returns { Object } UI-consummable enterprise proof object
    */
    function uiGenerateEnterpriseXBTProof(assets, liabilities) {
      var currency = 'XBT';
      var proof = {
          currency: currency,
          assets: _.find(assets, function (asset) {
            return asset.currency === currency;
          }),
          liabilities: _.find(liabilities, function (liability) {
            return liability.currency === currency;
          }),
          solvent: false
        };
      if (parseFloat(proof.assets.sum) >= parseFloat(proof.liabilities.sum)) {
        proof.solvent = true;
      }
      return proof;
    }
    /**
    * Returns a ui-consummable currency string
    * @param { Object } any object that has a currency property to parse
    * @private
    * @returns { String } currency string
    */
    function uiGetPrettyCurrency(obj) {
      if (!obj || !obj.currency) {
        throw new Error('invalid currency args');
      }
      return obj.currency;
    }
    /**
    * UI Helper - Generate ui-consumable fetched liability object
    * @param { Object } liability   a single user liability
    * @private
    * @returns { Object } UI-consummable liability proof object
    */
    function uiGenerateSingleLiabilityProof(liability) {
      var result = {
          message: 'Data may be independently verified by pasting this JSON into the tool at http://syskall.com/proof-of-liabilities/#verify',
          currency: uiGetPrettyCurrency(liability),
          root: {
            sum: liability.sum,
            hash: liability.rootHash
          }
        };
      if (liability.proof) {
        result.user = liability.proof.user;
        result.partial_tree = liability.proof.partial_tree;
        try {
          verifySingleLiabilityProof(liability.proof.partial_tree, liability.proof.root);
          result.valid = true;
        } catch (error) {
        }
      }
      result.details = JSON.stringify(result, null, 2);
      return result;
    }
    /**
      * Verify a proof of a single liability
      * @param { Object } liability tree object
      * @param { String } liability root object
      * @private
      * @returns { Object } valid single liability proof
      */
    function verifySingleLiabilityProof(partialTree, root) {
      var treeString = JSON.stringify({ 'partial_tree': partialTree });
      var deserializedPartial = lproof.deserializePartialTree(treeString);
      return lproof.verifyTree(deserializedPartial, root);
    }
    /**
    * Builds specific enterprise proof; checks if we need to get a specific
    * liability and attest to it -- this is based on the url
    * @param { data } specified proof data based on specific proof id
    * @private
    * @returns { Promise }   promise for an array of liability records
    */
    function buildEnterpriseProof(data) {
      var enterpriseProof = data.proof;
      $scope.proofDetails = JSON.stringify(data.proof, null, 2);
      // UI - Set up the date for the view
      $scope.prettyEnterpriseProofTimestamp = moment.utc(enterpriseProof.date).format('dddd MMMM Do YYYY, h:mm:ss A UTC');
      // UI - add XBT solvency proof
      $scope.enterpriseProofs.push(uiGenerateEnterpriseXBTProof(enterpriseProof.assets, enterpriseProof.liabilities));
      var liabilities = _.map(enterpriseProof.liabilities, function (liability) {
          liability = _.extend({}, liability);
          // Don't look up liability inclusion data if it's not a user-specific URL
          if (!isUserSpecificProofUrl()) {
            return liability;
          }
          var params = {
              hash: liability.rootHash,
              nonce: urlNonce || '',
              user: $scope.urlUserId
            };
          return ProofsAPI.getLiability(params).then(function (proof) {
            liability.proof = proof;
            return liability;
          }).catch(function (err) {
            return liability;
          });
        });
      return $q.all(liabilities).then(function (liabilities) {
        // Build data for Other (Fiat) Liabilities section
        $scope.otherLiabilities = liabilities.map(function (liability) {
          var ret = _.pick(liability, [
              'currency',
              'sum',
              'rootHash'
            ]);
          ret.details = JSON.stringify(ret, null, 2);
          return ret;
        }).filter(function (x) {
          return x.currency !== 'XBT';
        });
        // Data for user-specific liabilities
        $scope.allUserLiabilities = _.filter(liabilities.map(uiGenerateSingleLiabilityProof), 'user');
      });
    }
    /**
    * Initialize the controller
    * @private
    */
    function init() {
      // Grab the all params needed to construct the page from the url
      urlParseForParams();
      // 1) Get the enterprise ID based on the name parsed from the url
      return EnterpriseAPI.getInfoByName($scope.urlEnterpriseName).then(function (enterprise) {
        $scope.currentEnterprise = enterprise;
        return ProofsAPI.list(enterprise.id);
      }).then(urlHandleRedirect).then(buildEnterpriseProof).then(function () {
        $scope.loaded = true;
      }).catch(function (error) {
        var reason = error.message || error.error;
        switch (reason) {
        case ERROR_HANDLERS.CLIENT_NEEDS_REDIRECT_FROM_LATEST:
          // replace 'latest' in the url with the most recent enterprise proof id
          return $location.path(error.data.path).search(error.data.search);
        case ERROR_HANDLERS.CLIENT_FAIL_SINGLE_LIABILITY_BUILD:
        // happens when a single user liability fails to validate on the client
        // Fail state turns the UI balances boxes for the user red
        case ERROR_HANDLERS.CLIENT_INVALID_URL_FOR_REDIRECT:
        case ERROR_HANDLERS.SERVER_INVALID_PROOF_ID:
        case ERROR_HANDLERS.SERVER_MISSING_ENTERPRISE:
          validUrl = false;
          break;
        default:
          NotifyService.error('There was an error verifying this proof of reserves. Please ensure the url is correct and refresh your page.');
          console.log('Failed proof: ', reason);
          break;
        }
        $scope.loaded = true;
      });
    }
    // Initialize the proof controller
    init();
  }
]);/**
 * @ngdoc module
 * @name BitGo.Proof
 * @description
 * Manages all things dealing with proof of reserves
 */
angular.module('BitGo.Proof', ['BitGo.Proof.CompanyProofController']);/**
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
                selected: true
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
            if (!$scope.tokenParams.txValueLimit || !$scope.tokenParams.txValueLimit.toString()) {
              $scope.setFormError('New tokens must have a specified spending limit.');
              return false;
            }
            if (!$scope.tokenParams.duration) {
              $scope.setFormError('New tokens must have a specified duration.');
              return false;
            }
            var permissions = _.filter($scope.accessToken.oAuthScopes, function (permission) {
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
            } else {
              NotifyService.error('Form is invalid. Please correct errors and submit again.');
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
  'AccessTokensAPI',
  function (AccessTokensAPI) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$scope',
        function ($scope) {
          // restricts user access to token if no otp device is set
          $scope.restrictedAccess = null;
          $scope.removeAccessToken = function (accessTokenId) {
            AccessTokensAPI.remove(accessTokenId).then(function (data) {
              $scope.refreshAccessTokens();
            }).catch(function (error) {
              console.log('Error getting list of access tokens: ' + error.error);
            });
          };
          /**
         * Initializes the users access state
         * @private
         */
          function init() {
            if ($scope.user.settings.otpDevices.length === 0) {
              $scope.restrictedAccess = true;
            }
          }
          init();
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
          var killStateWatcher = $scope.$on('SettingsController.StateChanged', function (evt, data) {
              if (data.newState) {
                $scope.setState('list');
              }
            });
          $scope.newToken = false;
          $scope.setToken = function (token) {
            $scope.newToken = token;
          };
          $scope.removeToken = function (token) {
            $scope.newToken = undefined;
          };
          /**
        * Clean up all watchers when the scope is garbage collected
        * @private
        */
          $scope.$on('$destroy', function () {
            killStateWatcher();
          });
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
]);angular.module('BitGo.Settings.PasswordFormDirective', []).directive('settingsPwForm', [
  '$rootScope',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'RequiredActionService',
  'BG_DEV',
  'SDK',
  function ($rootScope, UserAPI, Util, Notify, RequiredActionService, BG_DEV, SDK) {
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
            $scope.formError = null;
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
            return Notify.success('Your password has been successfully updated');
          }
          // Function to verify if the passcode the user put in is valid
          function checkPasscode(password) {
            return UserAPI.verifyPassword({ password: password });
          }
          // Decrypt a keychain private key
          function decryptXprv(encryptedXprv, passcode) {
            try {
              var xprv = SDK.decrypt(passcode, encryptedXprv);
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
                newKeychains[xpub] = SDK.encrypt(newRawPassword, xprv);
              } else {
                // since we can't decrypt this, leave it untouched
                newKeychains[xpub] = encryptedXprv;
              }
            });
            return newKeychains;
          }
          $scope.savePw = function () {
            if (formIsValid()) {
              var oldRawPassword = $scope.settings.local.oldPassword;
              var newRawPassword = $scope.settings.local.newPassword;
              var oldPassword = SDK.passwordHMAC($scope.settings.username, oldRawPassword);
              var newPassword = SDK.passwordHMAC($scope.settings.username, newRawPassword);
              checkPasscode(oldRawPassword).then(function () {
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
            $scope.formError = null;
          }
          init();
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name PreferencesForm
 * @description
 * Directive to manage the currency and notification settings
 * @example
 *   <div settings-preferences-form></div>
 */
/**/
angular.module('BitGo.Settings.PreferencesFormDirective', []).directive('settingsPreferencesForm', [
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
              name: 'Daily',
              value: 86400
            },
            weekly: {
              name: 'Weekly',
              value: 86400 * 7
            },
            monthly: {
              name: 'Monthly',
              value: 86400 * 7 * 2 * 2
            }
          };
          function onSubmitSuccess() {
            $scope.getSettings();
          }
          $scope.submitPreferences = function () {
            // remove otp devices from settings
            var settings = _.omit($scope.settings, 'otpDevices');
            var params = {
                otp: $scope.otp,
                settings: settings
              };
            $scope.saveSettings(params).then(onSubmitSuccess).catch(Notify.errorHandler);
          };
          $scope.hasPreferenceChanges = function () {
            if (!$scope.settings || !$scope.localSettings) {
              return false;
            }
            if (!_.isEqual($scope.localSettings.currency, $scope.settings.currency)) {
              return true;
            }
            if (!_.isEqual($scope.localSettings.notifications, $scope.settings.notifications)) {
              return true;
            }
            // convert from string back to number as the input tag modifies value to string
            $scope.settings.digest.intervalSeconds = Number($scope.settings.digest.intervalSeconds);
            if (!_.isEqual($scope.localSettings.digest, $scope.settings.digest)) {
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
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 * @name settingsProfileFormDirective
 * @description
 * Directive to manage the user settings. (delete and rename)
 * @example
 *   <div settings-profile-form></div>
 */
angular.module('BitGo.Settings.ProfileFormDirective', []).directive('settingsProfileForm', [
  '$q',
  '$rootScope',
  '$location',
  '$modal',
  'UserAPI',
  'UtilityService',
  'NotifyService',
  'BG_DEV',
  'WalletsAPI',
  'AnalyticsProxy',
  function ($q, $rootScope, $location, $modal, UserAPI, Util, Notify, BG_DEV, WalletsAPI, AnalyticsProxy) {
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
          function onLogoutSuccess() {
            $location.path('/login');
          }
          function logoutUser() {
            return UserAPI.logout();
          }
          $scope.needsIdentityVerification = function () {
            return !(($rootScope.currentUser.settings || {}).identity || {}).verified;
          };
          $scope.goToIdentityVerification = function () {
            $location.path('/identity/verify');
          };
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
          /**
         * Modal - Open a modal for user deactivation
         * @private
         */
          function openModal(params) {
            var modalInstance = $modal.open({
                templateUrl: 'modal/templates/modalcontainer.html',
                controller: 'ModalController',
                scope: $scope,
                resolve: {
                  locals: function () {
                    return {
                      userAction: BG_DEV.MODAL_USER_ACTIONS.deactivationConfirmation,
                      type: params.type
                    };
                  }
                }
              });
            return modalInstance.result;
          }
          /**
        * Called when the user confirms deactivation
        *
        * @private
        */
          $scope.confirmDeactivate = function () {
            var userCacheEmpty = _.isEmpty(WalletsAPI.getAllWallets(true));
            if (!userCacheEmpty) {
              Notify.error('Please remove all wallets before deactivating account.');
              return false;
            } else {
              openModal({ type: BG_DEV.MODAL_TYPES.deactivationConfirmation });
            }
          };
        }
      ]
    };
  }
]);/**
 * @ngdoc directive
 *
 * @name securityManagerDirective
 *
 * @description
 *
 * Directive to manage the password and otp device settings
 *
 * @example
 *
 * <div security-manager-directive></div>
 */
angular.module('BitGo.Settings.SecurityManagerDirective', []).directive('securityManagerDirective', [
  '$rootScope',
  function ($rootScope) {
    return {
      restrict: 'A',
      require: '^SettingsController',
      controller: [
        '$rootScope',
        '$scope',
        '$modal',
        '$q',
        'UserAPI',
        'BG_DEV',
        'CacheService',
        function ($rootScope, $scope, $modal, $q, UserAPI, BG_DEV, CacheService) {
          // set the security tab views
          $scope.viewStates = [
            'twoStepVerificationList',
            'twoStepVerificationSelect',
            'phoneVerification',
            'addTotpDevice',
            'password'
          ];
          $scope.state = 'twoStepVerificationList';
          /**
         * Is used to check if the user should be encouraged to setup two-step verification
         * @private
         */
          function needsTwoStepVerification() {
            return $scope.securityView === 'twoStepVerificationList' && $rootScope.currentUser.settings.otpDevices.length === 0;
          }
          /**
         * Triggers otp modal to open if user needs to otp before adding/removing a device
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
          function getTemplate(ignoreOTP) {
            if (needsTwoStepVerification() && !ignoreOTP) {
              $scope.setTemplate('twoStepVerificationSelect');
            }
            var tplMap = {
                addTotpDevice: 'settings/templates/add-totp-device.html',
                password: 'settings/templates/password.html',
                phoneVerification: 'settings/templates/phone-verification.html',
                twoStepVerificationList: 'settings/templates/two-step-verification-list.html',
                twoStepVerificationSelect: 'settings/templates/two-step-verification-select.html'
              };
            return tplMap[$scope.securityView];
          }
          $scope.checkUnlock = function () {
            UserAPI.session().then(function (session) {
              if (session) {
                // if the data returned does not have an unlock object, then the user is not unlocked
                if (session.unlock) {
                  return $scope.setTemplate('twoStepVerificationSelect');
                }
                $scope.openModal({ type: BG_DEV.MODAL_TYPES.otp }).then(function (result) {
                  if (result.type === 'otpsuccess') {
                    $scope.setTemplate('twoStepVerificationSelect');
                  }
                });
              }
            });
          };
          $scope.fetchTotpParams = function () {
            UserAPI.newTOTP().then(function (totpUrl) {
              $scope.device = { totpUrl: totpUrl };
              // on fetch success set state to 'addTotpDevice'
              $scope.setState('addTotpDevice');
            });
          };
          $scope.setTemplate = function (state, ignoreOTP) {
            $scope.securityView = state;
            $scope.templateSource = getTemplate(ignoreOTP);
          };
          // Event listeners
          var killStateWatch = $scope.$watch('state', function (state) {
              $scope.securityView = state;
              $scope.templateSource = getTemplate();
            });
        }
      ]
    };
  }
]);/*
 * @ngdoc directive
 * @name settingsController
 * @description
 * The SettingsController deals with managing the section of the app where
 * a user sets their personal info, notification, setings, etc.
 * 
 * This manages: AboutForm, PhoneForm, CurrencyForm, SecurityForm, NotificationForm
 *
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
      'profile',
      'security',
      'preferences',
      'api_access',
      'subscriptions',
      'billing'
    ];
    // initialize otp for settings updates
    $scope.otp = null;
    // verification otp is used when resetting the phone number (settings phone form)
    $scope.verificationOtp = null;
    $scope.settingsStateTemplateSource = null;
    // $scope.saveSettings is called from child directives. Returns a promise
    $scope.saveSettings = function (newSettings) {
      if (!newSettings) {
        throw new Error('invalid params');
      }
      return SettingsAPI.save(newSettings);
    };
    function getTemplate() {
      if (!$scope.state || _.indexOf($scope.viewStates, $scope.state) === -1) {
        throw new Error('Expect $scope.state to be defined when setting template for a wallet');
      }
      var template;
      switch ($scope.state) {
      case 'profile':
        template = 'settings/templates/profile.html';
        break;
      case 'security':
        template = 'settings/templates/security.html';
        break;
      case 'preferences':
        template = 'settings/templates/preferences.html';
        break;
      case 'api_access':
        template = 'settings/templates/api_access.html';
        break;
      case 'subscriptions':
        template = 'settings/templates/subscriptions.html';
        break;
      case 'billing':
        template = 'settings/templates/billing.html';
        break;
      }
      return template;
    }
    // $scope.savePhone is called from child directives. Returns a promise
    $scope.savePhone = function (params) {
      if (!params) {
        throw new Error('invalid params');
      }
      return UserAPI.addOtp(params);
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
    $scope.setTwoStepVerification = function () {
      $scope.setState('security');
    };
    /**
    * Let all substates (tabs) in the settings area know of state changes
    * @private
    */
    var killStateWatcher = $scope.$watch('state', function (state) {
        if (state) {
          $scope.$broadcast('SettingsController.StateChanged', { newState: state });
        }
        if (_.indexOf($scope.viewStates, $scope.state) === -1) {
          return;
        }
        $scope.settingsStateTemplateSource = getTemplate();
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
      $scope.state = InternalStateService.getInitState($scope.viewStates) || 'profile';
    }
    init();
  }
]);/*
  About:
  - The BitGo.Settings module is the main module that deals with the main
  app user's account information, settings, and state
*/
angular.module('BitGo.Settings', [
  'BitGo.Settings.ProfileFormDirective',
  'BitGo.Settings.DevelopersFormDirective',
  'BitGo.Settings.DevelopersAccesstokenAddFormDirective',
  'BitGo.Settings.DevelopersManagerDirective',
  'BitGo.Settings.PreferencesFormDirective',
  'BitGo.Settings.SettingsController',
  'BitGo.Settings.SecurityManagerDirective',
  'BitGo.Settings.PasswordFormDirective'
]);/**
 * @ngdoc controller
 * @name ToolsController
 * @description
 * Manages the all functionality for the new key creation tool
 */
angular.module('BitGo.Tools.ToolsController', []).controller('ToolsController', [
  '$scope',
  'SDK',
  'KeychainsAPI',
  function ($scope, SDK, KeychainsAPI) {
    $scope.random = '';
    $scope.creationDate = new Date().toLocaleString();
    // Generates a BIP32 key and populates it into the scope.
    $scope.onGenerateBIP32Key = function () {
      SDK.sjcl.random.addEntropy($scope.random, $scope.random.length, 'user');
      $scope.newKey = KeychainsAPI.generateKey();
      $scope.xpub = $scope.newKey.neutered().toBase58();
      $scope.xprv = $scope.newKey.toBase58();
      $scope.address = $scope.newKey.pubKey.getAddress(SDK.getNetwork()).toBase58Check();
    };
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
    /** [VisibleError description] */
    function VisibleError(str) {
      var err = new Error(str);
      err.error = str;
      return err;
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
          return /^\d{6,7}$/.test(otp) || /^[a-z]{44}$/.test(otp);
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
              device: ['setOtpDevice'],
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
          BG_DEV.MARKETING_PATHS.forEach(function (testUrl) {
            if (testUrl === $location.path()) {
              marketingPage = true;
              return false;  // short circuit the forEach
            }
          });
          return marketingPage;
        },
        isAccountSettingsPage: function () {
          var url = $location.path().split('/');
          // E.g.: /settings
          return url.indexOf('settings') === 1;
        },
        isEnterpriseSettingsPage: function () {
          var url = $location.path().split('/');
          // E.g.: /enterprise//enterpriseId/settings
          return url.indexOf('settings') === 3;
        },
        isCreateEnterprisePage: function () {
          var url = $location.path().split('/');
          // E.g.: /create-organization
          return url.indexOf('create-organization') > -1;
        }
      };
    // API Utils
    var API = {
        apiServer: undefined,
        getApiServer: function () {
          return this.apiServer;
        },
        setApiServer: function () {
          var server;
          if (Global.isChromeApp) {
            server = 'https://test.bitgo.com';  // default to testnet.
          } else {
            server = location.protocol + '//' + location.hostname + (location.port && ':' + location.port);
          }
          if (typeof APP_ENV !== 'undefined' && APP_ENV.bitcoinNetwork !== 'testnet') {
            server = 'https://www.bitgo.com';
          }
          this.apiServer = server + '/api/v1';
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
            /**
           * Decide whether or not to show an app offline error
           * @param error {Object}
           * @private
           * @returns {Bool}
           */
            function showOfflineError(error) {
              // Don't show an offline error if on a marketing page
              if (!error || Url.isMarketingPage()) {
                return false;
              }
              // Trigger the error only if the user is logged in and using the app
              if (error.status === 0 && $rootScope.currentUser.loggedIn) {
                return true;
              }
              return false;
            }
            // Handle the case when the user loses browser connection
            if (showOfflineError(error)) {
              $rootScope.$emit('UtilityService.AppIsOffline');
            }
            if (error.invalidToken) {
              $rootScope.$emit('UtilityService.InvalidToken');
            }
            var formattedError = {
                status: error.status,
                error: error.data && error.data.error || 'Oops!  Looks like BitGo servers are experiencing problems.  Try again later.'
              };
            // handle errors generated by SDK
            if (error.message) {
              formattedError.error = error.message;
              if (error.needsOTP) {
                formattedError.needsOTP = true;
              }
            }
            // handle errors generated by $resource
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
      Converters: Converters,
      Formatters: Formatters,
      Global: Global,
      Url: Url,
      Validators: Validators,
      ErrorHelper: ErrorHelper,
      VisibleError: VisibleError
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
  'InternalStateService',
  'AnalyticsProxy',
  '$location',
  function ($rootScope, $q, UserAPI, Notify, KeychainsAPI, UtilityService, $modal, WalletSharesAPI, $filter, BG_DEV, InternalStateService, AnalyticsProxy, $location) {
    return {
      restrict: 'A',
      controller: [
        '$scope',
        function ($scope) {
          // will hold form data
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
      ],
      link: function (scope, ele, attrs) {
        /**
         * UI - block the feature for the user
         *
         * @returns {Bool}
         */
        scope.blockRole = function () {
          if (scope.role === BG_DEV.WALLET.ROLES.VIEW) {
            return !$rootScope.currentUser.isPro() && $rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal;
          }
          return false;
        };
        /**
        * Take the user to the create organization page
        *
        * @public
        */
        scope.goToCreateOrg = function () {
          AnalyticsProxy.track('clickUpsell', { type: 'addPremiumUser' });
          $location.path('/create-organization');
        };
        // Listen for the selected role to change, and if this role is
        // blocked, trigger a mixpanel event for showing the upsell
        var killRoleListener = scope.$watch('role', function (newRole) {
            if (scope.role === BG_DEV.WALLET.ROLES.VIEW && scope.blockRole()) {
              AnalyticsProxy.track('triggerUpsell', { type: 'addPremiumUser' });
            }
          });
        // Clean up listeners on when scope is gc'd
        scope.$on('$destroy', function () {
          killRoleListener();
        });
      }
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
    var killStateListener = $scope.$watch('state', function (newState, oldState) {
        if (newState) {
          // If the user has a weak login password and they're trying to spend btc,
          // we force them to upgrade it before they can send any btc
          if (newState === 'send' && RequiredActionService.hasAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW)) {
            return RequiredActionService.runAction(BG_DEV.REQUIRED_ACTIONS.WEAK_PW);
          }
          // Otherwise set the template as needed and sync the app state
          $scope.walletStateTemplateSource = getTemplate();
          // sync only if old state is not equal to new state
          // If they are the same it means, we are initializing the controller and url change will handle sync
          if (oldState !== newState) {
            SyncService.sync();
          }
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
      AnalyticsProxy.track('CreateWalletCanceled', { invitation: !!$rootScope.invitation });
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
              // Backup entry depends on who supplied the xpub
              if ($scope.inputs.backupKeyProvider) {
                var backupKeyProviderName = $scope.inputs.backupKeyProviderDisplayName();
                var backupKeyProviderUrl = $scope.inputs.backupKeyProviderUrl();
                // User supplied the xpub
                qrdata.backup = {
                  title: 'B: Backup Key',
                  img: '#qrEncryptedUserProvidedXpub',
                  desc: 'This is the public half of your key held at ' + backupKeyProviderName + ', a key recovery service. \r\n' + 'For more information visit: ' + backupKeyProviderUrl,
                  data: $scope.generated.walletBackupKeychain.xpub
                };
              } else if ($scope.inputs.useOwnBackupKey) {
                // User supplied the xpub
                qrdata.backup = {
                  title: 'B: Backup Key',
                  img: '#qrEncryptedUserProvidedXpub',
                  desc: 'This is the public portion of your backup key, which you provided.',
                  data: $scope.generated.walletBackupKeychain.xpub
                };
                // update description for backup keys generated from ColdKey app
                if ($scope.inputs.coldKey === $scope.inputs.backupPubKey) {
                  qrdata.backup.desc = 'This is the public portion of your backup key generated using BitGo KeyTool.';
                }
              } else {
                // User generated in the current session
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
  '$timeout',
  'BG_DEV',
  'UtilityService',
  'KeychainsAPI',
  'NotifyService',
  'AnalyticsProxy',
  'SDK',
  'featureFlags',
  function ($rootScope, $timeout, BG_DEV, Utils, KeychainsAPI, NotifyService, AnalyticsProxy, SDK, featureFlags) {
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
              krsProvided: {
                krsProvided: true,
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
              break;
            case 'coldKeyApp':
              isValid = $scope.userXpubValid();
              break;
            case 'krsProvided':
              isValid = true;
              break;
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
            // Clear selected backup key provider
            $scope.inputs.backupKeyProvider = null;
          }
          // Attempts to generate a backup key from a user's provided xpub
          function generateBackupKeyFromXpub() {
            try {
              $scope.generated.backupKeychain = SDK.bitcoin.HDNode.fromBase58($scope.inputs.backupPubKey);
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
            var metricsData = {
                option: option,
                invitation: !!$rootScope.invitation
              };
            AnalyticsProxy.track('SelectBackupKeyOption', metricsData);
            // prevent timeout from endless api calling
            $scope.waitingForColdKey = false;
            // If the user chooses another backup key creation option,
            // clear the form data from the other (unselected) options
            clearBackupKeyInputs();
            // scroll to bottom
            $('html body').animate({ scrollTop: $(document).height() });
            if (option === 'krsProvided') {
              $scope.inputs.backupKeyProvider = $scope.backupKeyProviders[0].id;
            } else if (option === 'coldKeyApp') {
              // set up the variables for the passcodeStep
              $scope.inputs.backupKeySource = null;
              // set up qr code for coldkey app
              var coldKeySecret = 'ckid' + SDK.generateRandomPassword();
              var coldKeyQRCode = {
                  v: 1,
                  e: SDK.get().env || 'dev',
                  s: coldKeySecret
                };
              $scope.inputs.coldKeySecret = coldKeySecret;
              $scope.inputs.coldKeyQRCode = JSON.stringify(coldKeyQRCode);
              // We start polling in the background to check for a cold key
              $scope.waitingForColdKey = true;
              var currentStep = $scope.currentStep;
              var scheduleColdKeyCheck = function () {
                var kPollInterval = 2 * 1000;
                if (!$scope.waitingForColdKey) {
                  return;  // done!
                }
                $timeout(function () {
                  KeychainsAPI.getColdKey($scope.inputs.coldKeySecret).then(function (response) {
                    if (response.xpub) {
                      $scope.waitingForColdKey = false;
                      $scope.inputs.coldKey = $scope.inputs.backupPubKey = response.xpub;
                      if ($scope.userXpubValid()) {
                        $('html body').animate({ scrollTop: $(document).height() });
                      }
                    }
                  }).catch(function (error) {
                    if (error.status === 404) {
                      scheduleColdKeyCheck();
                    } else {
                      NotifyService.errorHandler(error);
                    }
                  });
                }, kPollInterval);
              };
              scheduleColdKeyCheck();
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
                // enable only the selected option
                disableOptions(_.keys(VALID_BACKUPKEY_OPTIONS));
                _.find(VALID_BACKUPKEY_OPTIONS, $scope.option).enabled = true;
                $scope.inputs.useOwnBackupKey = true;
              }
            });
          // Clean up the listeners on the scope
          $scope.$on('$destroy', function () {
            killXpubWatcher();
          });
          // Initialize the controller
          function init() {
            if (featureFlags.isOn('krs')) {
              $scope.backupKeyProviders = BG_DEV.BACKUP_KEYS.krsProviders;
              $scope.inputs = $scope.inputs || {};
              var backupKeyProvidersById = _.indexBy($scope.backupKeyProviders, 'id');
              $scope.inputs.backupKeyProviderDisplayName = function () {
                return backupKeyProvidersById[$scope.inputs.backupKeyProvider].displayName;
              };
              $scope.inputs.backupKeyProviderUrl = function () {
                return backupKeyProvidersById[$scope.inputs.backupKeyProvider].url;
              };
              $scope.inputs.backupKeyProvider = $scope.backupKeyProviders[0].id;
              $scope.option = 'krsProvided';
            } else {
              $scope.option = 'inBrowser';
            }
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
              var metricsData = {
                  walletLabel: $scope.inputs.walletLabel,
                  invitation: !!$rootScope.invitation
                };
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
  'NotifyService',
  'KeychainsAPI',
  'UserAPI',
  '$timeout',
  'BG_DEV',
  'AnalyticsProxy',
  'AnalyticsUtilities',
  'SDK',
  function ($q, $rootScope, Notify, KeychainsAPI, UserAPI, $timeout, BG_DEV, AnalyticsProxy, AnalyticsUtilities, SDK) {
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
            return UserAPI.verifyPassword({ password: $scope.inputs.passcode || '' });
          }
          /**
         * Function to encrypt the wallet's passcode with a secure code
         * @private
         */
          function generatePasscodeEncryptionCode() {
            // Update the UI progress bar
            $scope.updateProgress(1);
            try {
              $scope.generated.passcodeEncryptionCode = SDK.generateRandomPassword();
            } catch (e) {
              return $q.reject({ error: 'BitGo needs to gather more entropy for encryption. Please refresh your page and try this again.' });
            }
            $scope.generated.encryptedWalletPasscode = SDK.encrypt($scope.generated.passcodeEncryptionCode, $scope.inputs.passcode);
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
            // always return a promise
            var callCreateBackupAPIs = function () {
              // simply call the create backup route if a krs was selected
              if ($scope.inputs.backupKeyProvider) {
                return KeychainsAPI.createBackupKeychain($scope.inputs.backupKeyProvider);
              }
              var params = {
                  source: 'user',
                  passcode: $scope.inputs.passcode
                };
              // check if the user provided their own backup key
              if ($scope.generated.backupKeychain) {
                params.source = 'cold';
                params.hdNode = $scope.generated.backupKeychain;
              }
              // Return a promise
              return KeychainsAPI.createKeychain(params);
            };
            return callCreateBackupAPIs().then(function (keychain) {
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
              metricsData = {
                option: $scope.option,
                invitation: !!$rootScope.invitation
              };
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
            $scope.option = 'loginPw';
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
          var metricsData = {
              option: option,
              invitation: !!$rootScope.invitation
            };
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
  'BitGo.Wallet.WalletRecoverController',
  'BitGo.API.SDK'
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
  'AnalyticsProxy',
  function ($rootScope, NotifyService, BG_DEV, AnalyticsProxy) {
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
            AnalyticsProxy.track('WalletPolicyEntered');
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
            // clear any existing errors
            if ($scope.clearFormError) {
              $scope.clearFormError();
            }
            // clear any errors satoshi errors
            $scope.satoshiError = false;
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
            $rootScope.enterprises.current.setApprovals(approval);
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
  'SDK',
  function ($rootScope, NotifyService, PolicyAPI, LabelsAPI, WalletsAPI, WalletModel, SDK) {
    return {
      restrict: 'A',
      require: '^?walletPolicyWhitelistManager',
      controller: [
        '$scope',
        function ($scope) {
          // data for an address to be added to the whitelist policy
          $scope.newAddress = null;
          function formIsValid() {
            if (!$scope.newAddress.address || !SDK.get().verifyAddress({ address: $scope.newAddress.address })) {
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
                  type: 'bitcoinAddressWhitelist',
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
  'InternalStateService',
  'AnalyticsProxy',
  '$location',
  function ($rootScope, NotifyService, PolicyAPI, LabelsAPI, WalletsAPI, WalletModel, BG_DEV, InternalStateService, AnalyticsProxy, $location) {
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
            $rootScope.enterprises.current.setApprovals(approval);
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
                  type: 'bitcoinAddressWhitelist',
                  condition: { remove: tileItem.address },
                  action: { type: 'getApproval' }
                }
              };
            $scope.updatePolicy(params).catch(NotifyService.errorHandler);
          };
          /**
         * UI - block the feature for the user
         *
         * @returns {Bool}
         */
          $scope.blockWhitelist = function () {
            return $rootScope.currentUser.isBasic() && $rootScope.enterprises.current && $rootScope.enterprises.current.isPersonal;
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
         * This listener is fired when the user navigates to the whitelist policy section
         */
          var killStateWatcher = $scope.$on('walletPolicyManager.PolicySectionChanged', function (evt, data) {
              if (data.section === CURRENT_SECTION) {
                init();
                // Track a user navigating to whitelist and landing on the upsell
                if ($scope.blockWhitelist()) {
                  AnalyticsProxy.track('arriveUpsell', { type: 'whitelist' });
                }
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
      ],
      link: function (scope, ele, attrs) {
        /**
        * Take the user to the create org page
        *
        * @public
        */
        scope.goToCreateOrg = function () {
          AnalyticsProxy.track('clickUpsell', { type: 'whitelist' });
          $location.path('/create-organization');
        };
      }
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
  '$modal',
  '$templateCache',
  'NotifyService',
  'LabelsAPI',
  'BG_DEV',
  'ssAPI',
  function ($rootScope, $timeout, $compile, $http, $modal, $templateCache, NotifyService, LabelsAPI, BG_DEV, ssAPI) {
    return {
      restrict: 'A',
      replace: true,
      require: '^?walletReceiveManager',
      controller: [
        '$scope',
        function ($scope) {
          // Open the modal when the user clicks on receive alt-coin
          $scope.useAltCoin = function () {
            var modalInstance = $modal.open({
                templateUrl: 'modal/templates/ssReceiveAltCoin.html',
                scope: $scope,
                resolve: {
                  locals: function () {
                    return {
                      userAction: BG_DEV.MODAL_USER_ACTIONS.ssReceiveAltCoin,
                      type: BG_DEV.MODAL_TYPES.ssReceiveAltCoin
                    };
                  }
                }
              });
            return modalInstance.result;
          };
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
  'AnalyticsProxy',
  function ($q, $timeout, $rootScope, NotifyService, CacheService, UtilityService, InfiniteScrollService, WalletsAPI, LabelsAPI, BG_DEV, AnalyticsProxy) {
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
            if (!params.index && params.index !== 0) {
              // 0 index should be valid
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
            AnalyticsProxy.track('WalletReceiveEntered');
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
  'SDK',
  'BG_DEV',
  'NotifyService',
  'WalletsAPI',
  'KeychainsAPI',
  'WalletSharesAPI',
  function ($modal, $rootScope, $scope, UtilityService, SDK, BG_DEV, NotifyService, WalletsAPI, KeychainsAPI, WalletSharesAPI) {
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
    function decryptKeychain(passcode, encryptedXprv) {
      try {
        var privKey = SDK.decrypt(passcode, encryptedXprv);
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
          testBip32 = SDK.bitcoin.HDNode.fromBase58($scope.userInputRecoveryData.userXprv);
        } catch (e) {
          $scope.setFormError('Please enter a valid BIP32 master private key (xprv).');
          return;
        }
        var privateInfo = $rootScope.wallets.current.data.private;
        var userXpub = privateInfo.keychains[0].xpub;
        var testXpub = testBip32.neutered().toBase58();
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
        var xprv = decryptKeychain($scope.userInputRecoveryData.decryptedKeycardBoxD, $scope.walletRecoveryInfo.encryptedXprv);
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
          newBip32 = SDK.bitcoin.HDNode.fromBase58($scope.userInputRecoveryData.decryptedXprv);
        } catch (e) {
          console.log(e.stack);
          NotifyService.error('There was an error with updating this keychain. Please refresh your page and try this again.');
          return;
        }
        // encrypt the xprv with the user's new passcode
        var newKeychainData = {
            encryptedXprv: SDK.encrypt($scope.newPasscode, $scope.userInputRecoveryData.decryptedXprv),
            xpub: newBip32.neutered().toBase58()
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
  '$q',
  '$timeout',
  '$rootScope',
  '$location',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'TransactionsAPI',
  'SDK',
  'BG_DEV',
  'AnalyticsProxy',
  function ($q, $timeout, $rootScope, $location, NotifyService, CacheService, UtilityService, TransactionsAPI, SDK, BG_DEV, AnalyticsProxy) {
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
              blockchainFeeEstimate: 0.0001 * 100000000,
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
              message: null,
              altCoin: {
                useAltCoin: false,
                selected: null,
                symbol: null,
                rate: 0,
                limit: 0,
                min: 0,
                minerFee: 0,
                rateSatoshis: 0,
                recipientAddress: null,
                returnAddres: null,
                depositAddress: null
              }
            };
          }
          // Creates a new pending transaction to be confirmed and send to the BitGo server
          $scope.createPendingTransaction = function (sender, recipient) {
            $scope.pendingTransaction = {
              sender: sender,
              recipient: recipient
            };
            var wallet;
            var walletId;
            var recipients = {};
            recipients[recipient.address] = recipient.satoshis;
            // now, get to asynchronously get inputs before getting the fee for
            // spending those inputs.
            walletId = $rootScope.wallets.current.data.id;
            return $q.when(SDK.get().wallets().get({ id: walletId })).then(function (res) {
              wallet = res;
              // In order to calculate the fee, we need to gather unspents and
              // try building a transaction. This is not the transaction that
              // will actually be signed - another one will be created if they
              // agree to the fee. For this transaction, which is merely used to
              // calculate the fee, we do not need to gather a new change
              // address, and therefore pass in a placeholder address (the user's
              // wallet id).
              return wallet.createTransaction({
                recipients: recipients,
                changeAddress: wallet.id(),
                minConfirms: 1,
                enforceMinConfirmsForChange: false
              });
            }).then(function (res) {
              var txhex = res.transactionHex;
              var unspents = res.unspents;
              var fee = res.fee;
              $scope.pendingTransaction.unsignedTxHex = txhex;
              $scope.transaction.feeRate = res.feeRate;
              $scope.pendingTransaction.fee = fee;
              $scope.transaction.total = $scope.transaction.amount + fee;
              $scope.transaction.blockchainFee = fee;
            });
          };
          function init() {
            $rootScope.setContext('walletSend');
            AnalyticsProxy.track('WalletSendEntered');
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
  '$q',
  '$filter',
  '$modal',
  '$timeout',
  '$rootScope',
  'NotifyService',
  'TransactionsAPI',
  'UtilityService',
  'WalletsAPI',
  'SDK',
  'BG_DEV',
  'AnalyticsProxy',
  'UserAPI',
  'ssAPI',
  function ($q, $filter, $modal, $timeout, $rootScope, NotifyService, TransactionsAPI, UtilityService, WalletsAPI, SDK, BG_DEV, AnalyticsProxy, UserAPI, ssAPI) {
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
          $scope.getTotalAltCoin = function () {
            var ssRateOnSatoshis = parseInt($scope.transaction.altCoin.rate * 100000000, 10);
            var ssFee = parseInt($scope.transaction.altCoin.minerFee * 100000000, 10);
            var totalAlt = $scope.transaction.amount * ssRateOnSatoshis;
            totalAlt = totalAlt / 100000000;
            totalAlt = totalAlt - ssFee;
            totalAlt = totalAlt / 100000000;
            return totalAlt;  // (((( transaction.amount * parseInt($scope.transaction.altCoin.rate*1e8, 10) )/1e8) - (parseInt(transaction.altCoin.minerFee*1e8,10)))*1e8)
          };
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
          // function which returns a needs unlock error
          function otpError() {
            return $q.reject(UtilityService.ErrorHelper({
              status: 401,
              data: {
                needsOTP: true,
                key: null
              },
              message: 'Missing otp'
            }));
          }
          function handleTxSendError(error) {
            if (UtilityService.API.isOtpError(error)) {
              // If the user needs to OTP, use the modal to unlock their account
              openModal({ type: BG_DEV.MODAL_TYPES.otpThenUnlock }).then(function (result) {
                if (result.type === 'otpThenUnlockSuccess') {
                  // set the otp code on the transaction object before resubmitting it
                  // only set if an otp was required
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
              Raven.captureException(error, { tags: { loc: 'ciaffux5b0001sw52cnz1jpk7' } });
              $scope.processing = false;
              // Otherwise just display the error to the user
              var defaultMsg = 'Your transaction was unable to be processed. Please ensure it does not violate any policies, then refresh your page and try sending again.';
              var errMsg = error && (error.error || error.message) || defaultMsg;
              NotifyService.error(errMsg);
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
          /**
         * Submit the tx to BitGo for signing and submittal to the P2P network
         *
         * @returns {Object} promise for sending the tx
         */
          $scope.sendTx = function () {
            $scope.processing = true;
            var walletId = $rootScope.wallets.current.data.id;
            // the transaction to be submitted in hex format
            var txhex;
            // an SDK wallet object to be retrieved using the SDK
            var wallet;
            // the list of unspents to be used in signing
            var unspents;
            // the recipients of the transaction
            var recipients = {};
            recipients[$scope.pendingTransaction.recipient.address] = $scope.pendingTransaction.recipient.satoshis;
            return UserAPI.session().then(function (session) {
              if (session) {
                // if the data returned does not have an unlock object, then the user is not unlocked
                if (!session.unlock) {
                  return otpError();
                } else {
                  // if the txvalue for this unlock exeeds transaction limit, we need to unlock again
                  if (session.unlock.txValue !== 0 && $scope.pendingTransaction.recipient.satoshis > session.unlock.txValueLimit - session.unlock.txValue) {
                    return otpError();
                  }
                }
              } else {
                throw new Error('Could not fetch user session');
              }
              // check if we have the passcode.  Incase the user has been
              // unlocked, but we dont have the passcode (which is needed to
              // decrypt the private key whether unlocked or not) and need to
              // return an error to pop up the modal
              if (!$scope.transaction.passcode) {
                return $q.reject(UtilityService.ErrorHelper({
                  status: 401,
                  data: {
                    needsPasscode: true,
                    key: null
                  },
                  message: 'Missing password'
                }));
              }
            }).then(function () {
              return SDK.get().wallets().get({ id: walletId });
            }).then(function (res) {
              wallet = res;
              // set the same fee rate as when the transaction was prepared. (The fee can only change now if transaction inputs change)
              return wallet.createTransaction({
                recipients: recipients,
                feeRate: $scope.transaction.feeRate,
                minConfirms: 1,
                enforceMinConfirmsForChange: false
              });
            }).then(function (res) {
              txhex = res.transactionHex;
              // unsigned txhex
              unspents = res.unspents;
              var fee = res.fee;
              var prevFee = $scope.pendingTransaction.fee;
              var txIsInstant = $scope.transaction.isInstant;
              $scope.pendingTransaction.fee = fee;
              $scope.transaction.blockchainFee = fee;
              if (prevFee !== fee) {
                throw new Error('Transaction inputs have changed - please reconfirm fees');
              }
              if (wallet.type() === 'safehd') {
                // safehd is the default wallet type
                return wallet.getEncryptedUserKeychain({}).then(function (keychain) {
                  // check if encrypted xprv is present. It is not present for cold wallets
                  if (!keychain.encryptedXprv) {
                    return $q.reject(UtilityService.ErrorHelper({
                      status: 401,
                      data: {},
                      message: 'Cannot transact. No user key is present on this wallet.'
                    }));
                  }
                  keychain.xprv = SDK.decrypt($scope.transaction.passcode, keychain.encryptedXprv);
                  return wallet.signTransaction({
                    transactionHex: txhex,
                    keychain: keychain,
                    unspents: unspents
                  });
                });
              } else if (wallet.type() === 'safe') {
                // legacy support for safe wallets
                var decryptSigningKey = function (account, passcode) {
                  if (account.chain) {
                    throw new Error('This wallet is no longer supported by the BitGo web app. Please contact support@bitgo.com.');
                  }
                  try {
                    var privKey = SDK.decrypt(passcode, account.private.userPrivKey);
                    return { key: privKey };
                  } catch (e) {
                    throw new Error('Invalid password: ' + e);
                  }
                };
                var passcode = $scope.transaction.passcode;
                params = {
                  bitcoinAddress: wallet.id(),
                  gpk: true
                };
                return WalletsAPI.getWallet(params, false).then(function (w) {
                  var account = w.data;
                  var signingKey = decryptSigningKey(account, passcode).key;
                  return wallet.signTransaction({
                    transactionHex: txhex,
                    signingKey: signingKey,
                    unspents: unspents
                  });
                });
              } else {
                throw new Error('wallet type not supported');
              }
            }).then(function (signedtx) {
              if (!signedtx) {
                throw new Error('failed to sign transaction');
              }
              signedtx.message = $scope.transaction.message;
              signedtx.instant = $scope.transaction.isInstant ? true : false;
              return wallet.sendTransaction(signedtx);
            }).then(function (res) {
              // Set the confirmation time on the transaction's local object for the UI
              $scope.transaction.confirmationTime = moment().format('MMMM Do YYYY, h:mm:ss A');
              // Handle the success state in the UI
              $scope.transactionSent = true;
              $scope.processing = false;
              // Mixpanel general data
              var metricsData = {
                  walletID: $rootScope.wallets.current.data.id,
                  enterpriseID: $rootScope.enterprises.current.id,
                  invitation: !!$rootScope.invitation
                };
              // tx needs approval
              if (res.status === 'pendingApproval') {
                metricsData.requiresApproval = true;
                // Track successful send
                AnalyticsProxy.track('SendTx', metricsData);
                // Set local data
                $scope.returnedTransaction.approvalMessage = res.error;
                $scope.returnedTransaction.needsApproval = true;
                return WalletsAPI.getAllWallets();
              }
              // transaction sent success
              var hash = res.hash;
              metricsData.requiresApproval = false;
              // Track successful send
              AnalyticsProxy.track('SendTx', metricsData);
              $scope.transaction.transactionId = hash;
              // Sync up the new balances data across the app
              return syncCurrentWallet();
            }).catch(function (error) {
              if (error.message) {
                error.error = error.message;
              }
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
  '$q',
  '$rootScope',
  'NotifyService',
  'CacheService',
  'UtilityService',
  'BG_DEV',
  'LabelsAPI',
  'SDK',
  'featureFlags',
  'ssAPI',
  function ($q, $rootScope, NotifyService, CacheService, UtilityService, BG_DEV, LabelsAPI, SDK, featureFlags, ssAPI) {
    return {
      restrict: 'A',
      require: '^walletSendManager',
      controller: [
        '$scope',
        function ($scope) {
          // Flag to indicate whether getting pair info from ShapeShift is in process
          $scope.gatheringMarketInfo = false;
          // This flag is passed to the ss-dropdown, to indicate whenever an error happen
          $scope.hasAltErrors = false;
          // Flag to indicate that an error ocurrs loading the AltCoins
          $scope.unableToLoadAltCoins = false;
          // Flag to indicate whether transaction creation is in process
          $scope.gatheringUnspents = false;
          // Flag to show the dropdown, this variable will become true when user click on "Want to send.." link..
          $scope.showAltCoinDropDown = false;
          // Flag to show instant confirm advert
          $scope.showInstantWalletAdvert = false;
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
          /**
        This object is used for the changing values from one input to another
        by changing it on any of them
        If user changes the BTC will automatically calculates the amount on the AltCoin
        If user changes the AltCoin will automatically calculates the amount on the BTC
        */
          function CoinAmount() {
            var bitcoins = null;
            var altCoins = null;
            // Clear amounts
            var clearValues = function () {
              altCoins = null;
              bitcoins = null;
              $scope.transaction.amount = null;
            };
            this.__defineGetter__('bitcoins', function () {
              return bitcoins;
            });
            this.__defineGetter__('altCoins', function () {
              return altCoins;
            });
            this.__defineSetter__('bitcoins', function (val) {
              bitcoins = val;
              if (!isNaN(val)) {
                // Do we have a rate?
                if ($scope.transaction.altCoin.rate !== null && $scope.transaction.altCoin.rate > 0) {
                  /*
                  We are using the satoshis converter so in order to have the correct
                  rate on the altcoin we should make that calculations using integers
                  */
                  altCoins = bitcoins * ssAPI.decimalToInteger($scope.transaction.altCoin.rate);
                  altCoins = ssAPI.integerToDecimal(altCoins);
                  $scope.transaction.amount = bitcoins;
                }
              } else {
                clearValues();
              }
            });
            this.__defineSetter__('altCoins', function (val) {
              altCoins = val;
              if (!isNaN(val)) {
                // Do we have a rate?
                if ($scope.transaction.altCoin.rate !== null && $scope.transaction.altCoin.rate > 0) {
                  /*
                We are using the satoshis converter so in order to have the correct
                rate on the altcoin we should make that calculations using integers
                */
                  bitcoins = val / ssAPI.decimalToInteger($scope.transaction.altCoin.rate);
                  bitcoins = ssAPI.decimalToInteger(bitcoins);
                  $scope.transaction.amount = bitcoins;
                }
              } else {
                clearValues();
              }
            });
          }
          /**
         If the message is null, we are going to set the initial one with the following:
         Sent to {coin} address {address} via ShapeShift
         First check if the user has change to use an AltCoin!, if not we don't want to change
         nothing :) */
          $scope.changeMemo = function () {
            if (hasChangeCoin) {
              var newAddress = $scope.transaction.altCoin.recipientAddress === null ? '' : $scope.transaction.altCoin.recipientAddress + ' ';
              var newMessage = 'Sent to ' + $scope.transaction.altCoin.selected + ' address ' + newAddress + 'via ShapeShift';
              $scope.transaction.message = newMessage;
            }
          };
          var hasChangeCoin = false;
          $scope.altCoinAmount = new CoinAmount();
          function clearChangeCoinValues() {
            // Clear if errors and clear values
            hasChangeCoin = false;
            $scope.hasAltErrors = false;
            $scope.recipientInvalid = false;
            $scope.recipientViewValue = null;
            $scope.altCoinAmount.bitcoins = 0;
            $scope.transaction.recipientLabel = null;
            $scope.transaction.amount = null;
            $scope.transaction.message = null;
            $scope.transaction.altCoin.symbol = '--';
            $scope.transaction.altCoin.rate = 0;
            $scope.transaction.altCoin.recipientAddress = null;
            $scope.transaction.altCoin.useAltCoin = false;
          }
          /**
          This method handles the change even on the dropdown,
          Everytime the user changes the coin we must clear some values
          Like memo's, amounts, and others,
          If the coin is an AltCoin we are going to call the API to bring us
          the information about the pair btc_alt
        */
          $scope.changeCoin = function (coin) {
            //
            $scope.transaction.altCoin.selected = coin.name;
            $scope.transaction.altCoin.image = coin.image;
            // Clear the form from errors each time we change the coin
            if (_.isFunction($scope.clearFormError)) {
              $scope.clearFormError();
            }
            // Clear some scope values when user changes the coin
            clearChangeCoinValues();
            // Does the user selects an AltCoin? :)
            if (coin.symbol !== 'BTC') {
              $scope.transaction.altCoin.useAltCoin = true;
              $scope.transaction.recipientLabel = null;
              hasChangeCoin = true;
              // Change the memo when the user changes the type of coin
              $scope.changeMemo();
              // Get coin information! Rate and limits!
              getMarketInfo(coin.name);
            }
          };
          function showShapeshiftError(msg) {
            var shapeshiftError = null;
            // Try to find the error on the ShapeShift error dictionary, if the error is found means
            // that a known error happens on the shapeshift flow.
            shapeshiftError = ssAPI.getError(msg);
            if (shapeshiftError !== null) {
              // Show the error at the top of the page
              $scope.setFormError(shapeshiftError.msg);
              // Move the user to the top of the page
              window.scrollTo(0, 0);
            }
            return shapeshiftError;
          }
          function getMarketInfo(name) {
            // Disable dropdown and change text on the button by changing this flag
            $scope.gatheringMarketInfo = true;
            ssAPI.getMarketInfo(name).then(function (altCoin) {
              // Fill required data for shapeshift exchange.
              $scope.transaction.altCoin.rate = altCoin.rate;
              $scope.transaction.altCoin.limit = altCoin.limit;
              $scope.transaction.altCoin.min = altCoin.min;
              $scope.transaction.altCoin.minerFee = altCoin.minerFee;
              $scope.transaction.altCoin.symbol = altCoin.symbol;
            }).catch(function (error) {
              // Disable next button until user selects another coin that does not have errors :
              $scope.hasAltErrors = true;
              showShapeshiftError(error);
            }).finally(function () {
              // Enable things back.
              $scope.gatheringMarketInfo = false;
            });
          }
          /**
          Handles the ng-click event for the link "Want to send AltCoin",
          by toogle this flag, will show the dropdown and hide the link
        */
          $scope.useAltCoin = function () {
            $scope.showAltCoinDropDown = true;
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
              var validBtcAddress = SDK.get().verifyAddress({ address: $scope.transaction.recipientAddress });
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
          // function to set error on form and turn off processing flag
          function setErrorOnForm(errMsg) {
            if (!errMsg || typeof errMsg !== 'string') {
              throw new Error('Invalid form error');
            }
            $scope.setFormError(errMsg);
            $scope.gatheringUnspents = false;
          }
          // Validate the transaciton input form
          function txIsValid() {
            var balance;
            var currentWallet;
            var currentWalletAddress;
            var validRecipientAddress;
            // ensure if recipient address is present
            if (!$scope.transaction.recipientAddress) {
              setErrorOnForm(ERRORS.invalidRecipient.msg);
              return false;
            }
            try {
              // Wallet checking
              validRecipientAddress = $scope.transaction.altCoin.useAltCoin === true ? true : SDK.get().verifyAddress({ address: $scope.transaction.recipientAddress });
              currentWallet = $rootScope.wallets.current;
              currentWalletAddress = currentWallet.data.id;
              // Funds checking
              balance = currentWallet.data.balance;
            } catch (error) {
              // TODO (Gavin): show user an error here? What can they do?
              console.error('There was an issue preparing the transaction: ', error.message);
            }
            // ensure a valid recipient address
            if (!validRecipientAddress) {
              setErrorOnForm(ERRORS.invalidRecipient.msg);
              return false;
            }
            // ensure they're not sending coins to this wallet's address
            if ($scope.transaction.recipientAddress === currentWalletAddress) {
              setErrorOnForm(ERRORS.sendToSelf.msg);
              return false;
            }
            // ensure a valid amount
            if (!parseFloat($scope.transaction.amount)) {
              setErrorOnForm(ERRORS.invalidAmount.msg);
              return false;
            }
            // ensure they are not entering an amount greater than they're balance
            if ($scope.transaction.amount > balance) {
              setErrorOnForm(ERRORS.insufficientFunds.msg);
              return false;
            }
            // ensure amount is greater than the minimum dust value
            if ($scope.transaction.amount <= BG_DEV.TX.MINIMUM_BTC_DUST) {
              setErrorOnForm(ERRORS.amountTooSmall.msg);
              return false;
            }
            // ShapeShift validations
            if ($scope.transaction.altCoin.useAltCoin) {
              // If user checks the box but not selects a type of coin let's throw an exception
              if ($scope.transaction.altCoin.selected === null) {
                showShapeshiftError('unableToGetSelectedCoin');
                return false;
              }
              // Get back the satoshis to the original value on bitcoins
              var amount = ssAPI.integerToDecimal($scope.transaction.amount);
              // Does the transaction exceed the shapeshift limit?
              if (amount > $scope.transaction.altCoin.limit) {
                showShapeshiftError('limitExceeded');
                return false;
              }
              // Shapeshift also has a lower limit, are we trying to sent lower than that?
              if (amount < $scope.transaction.altCoin.min) {
                showShapeshiftError('underLimit');
                // handled on the catch block
                return false;
              }
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
            var createPendingTransaction = function () {
              return $scope.createPendingTransaction(sender, recipient).then(function () {
                saveLabel();
              });
            };
            // If we are using an alt-coin, let's use the shapeshift api to get the coin information
            if ($scope.transaction.altCoin.useAltCoin) {
              // Set other required data
              $scope.transaction.altCoin.returnAddress = $rootScope.wallets.current.data.id;
              var shiftParams = ssAPI.getShiftParams($scope.transaction.altCoin);
              // Get the deposit address from Shapeshift!
              return ssAPI.shift(shiftParams).then(function (data) {
                // Something happens with Shapeshift? We should not hit
                // this statement ever.
                if (_.isUndefined(data) || data === null) {
                  throw new Error('unableToGetDepositAddress');
                }
                // Does Shapeshift return an error? :(
                if (!_.isUndefined(data.error)) {
                  // Let's raise the exception to be handled on the catch block
                  throw new Error(data.error);  // handled on the catch block
                }
                // Let's make sure to receive the deposit address
                if (typeof data.deposit !== 'undefined') {
                  // Let's set the deposit address :D
                  $scope.transaction.altCoin.depositAddress = data.deposit;
                  // Assign new deposit address
                  $scope.transaction.recipientAddress = data.deposit;
                  recipient.address = data.deposit;
                } else {
                  throw new Error('unableToGetDepositAddress');
                }
              }).then(createPendingTransaction);
            } else {
              return createPendingTransaction();
            }
          }
          // advances the transaction state if the for and inputs are valid
          $scope.advanceTransaction = function (amountSpendWasReduced) {
            // amountSpendWasReduced is used to repesent how much lower the total
            // amount the user can send is if they are trying to send an amount
            // that is larger than for which they can afford the blockchain fees.
            // i.e., if they try to spend their full balance, this will be
            // automatically reduced by amountSpendWasReduced to an amount they
            // can afford to spend. This variable must be scoped to the
            // advanceTransaction method so that every time they click the "next"
            // button it gets reset to undefined, in case they blick back and
            // next over and over changing the total amount, ensuring that it
            // gets recomputed each time.
            $scope.transaction.amountSpendWasReduced = amountSpendWasReduced;
            $scope.gatheringUnspents = true;
            /**
            Since we are using a separate control when using alt-coins,
            lets set the value of the control to the transaction recipient
          */
            if ($scope.transaction.altCoin.useAltCoin) {
              $scope.transaction.recipientAddress = $scope.transaction.altCoin.recipientAddress;
            }
            $scope.clearFormError();
            if (txIsValid()) {
              return prepareTx().then(function () {
                $scope.gatheringUnspents = false;
                $scope.setState('confirmAndSendTx');
              }).catch(function (error) {
                $scope.gatheringUnspents = false;
                if (error == 'Error: Insufficient funds') {
                  var fee = error.result.fee;
                  var available = error.result.available;
                  // An insufficient funds error might happen for a few reasons.
                  // The user might spending way more money than they have, in
                  // which case this is an actual error. Or an insufficient funds
                  // error might occur if they are spending the same or slightly
                  // less than their total balance, and they don't have enough
                  // money to pay the balance. If the former, throw an error, if
                  // the latter, we try to handle it specially, explained below.
                  if (typeof fee === 'undefined' || fee >= $scope.transaction.amount) {
                    NotifyService.error('You do not have enough funds in your wallet to pay for the blockchain fees for this transaction.');
                  } else {
                    // If the user is trying to spend a large amount and they
                    // don't quite have enough funds to pay the fees, then we
                    // automatically subtract the fee from the amount they are
                    // sending and try again. In order to prevent a possible
                    // infinite loop if this still isn't good enough, we keep
                    // track of whether we have already tried this, and if we
                    // have, we throw an error. Furthermore, we create an
                    // automaticallySubtractinFee variable so that the client can
                    // optionally display a warning if desired.
                    if (!amountSpendWasReduced) {
                      amountSpendWasReduced = $scope.transaction.amount - (available - fee);
                      // If the amount reduced is  too large (this can happen when not enough confirmed funds) or the fee exceeds available amount -> notify user  
                      if (amountSpendWasReduced > 1000000 || available - fee <= 0) {
                        NotifyService.error('You do not have enough confirmed funds in your wallet.');
                        return;
                      }
                      $scope.transaction.amount = available - fee;
                      $scope.advanceTransaction(amountSpendWasReduced);
                    } else {
                      NotifyService.error('You do not have enough funds in your wallet to pay for the blockchain fees for this transaction.');
                    }
                  }
                } else {
                  // Try to find the error on the ShapeShift error dictionary, if the error is found means
                  // that a known error happens on the shapeshift flow.
                  if (showShapeshiftError(error) === null) {
                    // Default case
                    Raven.captureException(error, { tags: { loc: 'ciaffxsd00000wc52djlzz2tp' } });
                    NotifyService.error('Your transaction was unable to be processed. Please ensure it does not violate any policies, then refresh your page and try sending again.');
                  }
                }
              });
            }
            // The result of this function is only ever checked in tests.
            // However, rather than return false, it is good practice to return a
            // promise, since this function is asynchronous, and thus should
            // always return a promise.
            return $q(function (resolve, reject) {
              return resolve(false);
            });
          };
          /**
          Handles the ng-click event for the Instant Transaction advert
        */
          $scope.toggleAdvert = function () {
            $scope.showInstantWalletAdvert = !$scope.showInstantWalletAdvert;
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
  'SDK',
  function ($q, $rootScope, LabelsAPI, WalletsAPI, SDK) {
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
              // If we are using an alt-coin we are going to delegate the address validation to Shapeshift
              $scope.recipientInvalid = $scope.transaction.altCoin.useAltCoin === true ? false : !SDK.get().verifyAddress({ address: address });
              if (!$scope.recipientInvalid) {
                // if the user pasted in a valid address that has an existing label
                // set it in the label field manually so they know it's already labeled
                if (manuallyEntered) {
                  setLabelFromManuallyEnteredAddress(address);
                }
              }
              $scope.transaction.recipientAddress = address;
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
  'SDK',
  function ($q, $rootScope, $modal, UtilityService, WalletsAPI, KeychainsAPI, NotifyService, BG_DEV, SDK) {
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
         * @param passcode {String} existing (old) wallet passcode
         * @param encryptedXprv {String} wallet's user encryptedXprv
         * @returns {String} user's decrypted private key || undefined
         * @private
         */
          function decryptKeychain(passcode, encryptedXprv) {
            try {
              var privKey = SDK.decrypt(passcode, encryptedXprv);
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
                var xprv = decryptKeychain($scope.oldPasscode, keychain.encryptedXprv);
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
                  newBip32 = SDK.bitcoin.HDNode.fromBase58(xprv);
                  console.assert(newBip32.privKey);
                } catch (e) {
                  console.log(e.stack);
                  var error = { error: 'There was an error with updating this password. Please refresh your page and try this again.' };
                  return $q.reject(error);
                }
                // encrypt the xprv with the user's new passcode
                var newKeychainData = {
                    encryptedXprv: SDK.encrypt($scope.newPasscode, xprv),
                    xpub: newBip32.neutered().toBase58()
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
  'AnalyticsProxy',
  function ($q, $timeout, $rootScope, $location, NotifyService, CacheService, UtilityService, TransactionsAPI, InfiniteScrollService, WalletsAPI, AnalyticsProxy) {
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
            AnalyticsProxy.track('WalletTransactionsEntered');
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
          WalletSharesAPI.resendEmail({ walletShareId: walletShareId }).then(function (result) {
            Notify.success('Wallet invite email was re-sent.');
          }).catch(Notify.errorHandler);
        };
        scope.rejectInvite = function (walletShareId) {
          if (!walletShareId) {
            throw new Error('Expect walletShareId to be set');
          }
          WalletSharesAPI.cancelShare({ walletShareId: walletShareId }).then(function (result) {
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
  'AnalyticsProxy',
  function (Util, RequiredActionService, BG_DEV, AnalyticsProxy) {
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
            AnalyticsProxy.track('WalletUsersEntered');
            $scope.state = 'showAllUsers';
          }
          init();
        }
      ]
    };
  }
]);