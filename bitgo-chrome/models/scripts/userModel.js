// Model for the App's Current User
angular.module('BitGo.Models.UserModel', [])

.factory('UserModel', ['$location', '$rootScope', 'BG_DEV',
  function($location, $rootScope, BG_DEV) {

    // holds basic settings for creating new placeholder users
    // (these are temp users used before a session signs in/up)
    var defaultUserSettings = {
      id: null,
      currency: {
        currency: BG_DEV.CURRENCY.DEFAULTS.CURRENCY,
        bitcoinUnit: BG_DEV.CURRENCY.DEFAULTS.BITCOIN_UNIT,
      },
      email: { email: '', verified: false },
      phone: { phone: '', verified: false },
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
    User.prototype.getPlan = function() {
      if (this.settings.stripe) {
        var planId = this.settings.stripe.subscription.data.plan.id;
        return _.find(BG_DEV.USER.ACCOUNT_LEVELS, function(plan) {
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
    User.prototype.isEnterpriseCustomer = function() {
      return this.settings.enterprises && this.settings.enterprises.length > 0;
    };

    /**
    * Check if the user's account is grandfathered
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isGrandfathered = function() {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.grandfathered.name;
    };

    /**
    * Check if the user's account is basic
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isBasic = function() {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.basic.name;
    };

    /**
    * Check if the user's account is plus
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isPlus = function() {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.plusMonthly.name;
    };

    /**
    * Check if the user's account is pro. If the user is an Enterprise customer, he is by default a pro user
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.isPro = function() {
      return this.plan.name === BG_DEV.USER.ACCOUNT_LEVELS.proMonthly.name;
    };

    /**
     *  Check if the user has an Authy device
     *  @returns { bool }
     *  @public
     */
    User.prototype.isAuthyUser = function() {
      if (this.settings.otpDevices.length > 0) {

        var index = _.findIndex(this.settings.otpDevices, { 'type': 'authy' });
        return ( index > -1 );
      }
    };

    /**
    * Get the users phone
    *
    * @public
    */
    User.prototype.getPhone = function() {
      var otpDevices = this.settings.otpDevices;
      if (!this.isAuthyUser()) {
        return false;
      }
      var index = function() {
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
    User.prototype.phoneNotSet = function() {
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
    User.prototype.emailNotSet = function() {
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
    User.prototype.emailNotVerified = function() {
      return !this.settings.email.verified;
    };

    /**
    * Check if user has a credit card on file
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.hasPaymentOnFile = function() {
      return  this.settings.stripe &&
              this.settings.stripe.customer &&
              this.settings.stripe.customer.data &&
              this.settings.stripe.customer.data.sources &&
              this.settings.stripe.customer.data.sources.data.length > 0;
    };

    /**
    * Check if the user has access to use the app, or if they need to upgrade
    *
    * @returns { Bool }
    * @public
    */
    User.prototype.checkAccess = function() {
      // ensure they have a verified email first
      if (this.emailNotSet() || this.emailNotVerified()) {
        return false;
      }
      return true;
    };

    User.prototype.setProperty = function(properties) {
      var self = this;
      _.forIn(properties, function(value, prop) {
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
]);
