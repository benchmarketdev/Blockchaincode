angular.module('BitGo.API.UserAPI', ['ngResource'])

.factory('UserAPI', ['$location', '$q', '$rootScope', 'featureFlags', 'UserModel', 'UtilityService', 'SDK', 'CacheService', 'AnalyticsProxy', 'BG_DEV',
  function($location, $q, $rootScope, featureFlags, UserModel, UtilityService, SDK, CacheService, AnalyticsProxy, BG_DEV) {
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
    $rootScope.$on('UtilityService.InvalidToken', function(evt, data) {
      endSession();
    });

    function setPlaceholderUser() {
      currentUser = $rootScope.currentUser = new UserModel.PlaceholderUser();
    }

    /* istanbul ignore next */
    function assertAuth(data) {
      console.assert(_.has(data, 'token_type'), "missing token_type");
      console.assert(_.has(data, 'access_token'), "missing access_token");
      console.assert(_.has(data, 'expires_in'), "missing expires_in");
    }

    /**
      * asserts if received data has necessary properties required for fetching other users
      * @param {object} The data received from the server when fetching another user
      */
    /* istanbul ignore next */
    function assertGeneralBitgoUserProperties(user) {
      console.assert(user, "missing user");
      console.assert(_.has(user, 'id'), "missing user.id");
      console.assert(_.has(user, 'email'), "missing user.email");
      console.assert(_.has(user.email, 'email'), "missing user.email.email");
    }

    /**
      * asserts if received data has necessary properties required for the main user
      * @param {object} The data received from the server for the main user
      */
    /* istanbul ignore next */
    function assertCurrentUserProperties(user) {
      console.assert(user, "missing user");
      console.assert(_.has(user, 'id'), "missing user.id");
      console.assert(_.has(user, 'username'), "missing user.username");
      console.assert(_.has(user, 'name'), "missing user.name");
      console.assert(_.has(user, 'email'), "missing user.email");
      console.assert(_.has(user.email, 'email'), "missing user.email.email");
      console.assert(_.has(user.email, 'verified'), "missing user.email.verified");
      console.assert(_.has(user, 'isActive'), "missing user.isActive");
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
        Raven.setUser({id: currentUser.settings.id});
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
      init: function() {
        var self = this;
        // If we have a token stored, then we should be able to use the API
        // already.  Attempt to get the current user.
        if (!tokenCache.get('token')) {
          return $q.reject('no token');
        }
        return self.me();
      },

      me: function() {
        return SDK.wrap(
          SDK.get().me()
        )
        .then(function(user) {
          assertCurrentUserProperties(user);
          setCurrentUser(user);
          return currentUser;
        });
      },

      // Get a BitGo user (not the app's main user)
      get: function(userId, useCache) {
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
        return SDK.wrap(
          SDK.get().getUser({ id: userId })
        )
        .then(function(user) {
          assertGeneralBitgoUserProperties(user);
          var decoratedUser = new UserModel.User(false, user);
          userCache.add(userId, decoratedUser);
          return decoratedUser;
        });
      },

      // Log the user in
      login: function(params) {
        // Wipe an existing user's token if a new user signs
        // in without logging out of the current user's account
        clearCurrentUser();
        if (currentUser.loggedIn) {
          // logout user so that it clears up wallets and enterprises on scope
          $rootScope.$emit('UserAPI.UserLogoutEvent');
        }

        // Flag for the new client - need email to be verified first
        params.isNewClient = true;

        return SDK.wrap(
          SDK.get()
          .authenticate({
            username: params.email,
            password: params.password,
            otp: params.otp,
            trust: !!params.trust
          })
        )
        .then(function(data) {
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
          var trackingData = {
            userID: data.user.id
          };
          AnalyticsProxy.loginUser(trackingData.userID);
          // Note: this data is sent w/ all future track calls while this person uses BitGo
          AnalyticsProxy.sendWithAllTrackingEvents(trackingData);
          // Track the successful login
          AnalyticsProxy.track('Login');

          return currentUser;
        })
        .then(function() {
          return SDK.doGet('/user/gatekeeper');
        })
        .then(function(result) {
          var features = _.map(result, function(v, k) { return { key: k, active: v }; });
          featureCache.add('features', features);
          featureFlags.set(features);
          return currentUser;
        });
      },

      signup: function(params) {
        // Wipe an existing user's token if a new user signs
        // up without logging out of the current user's account
        clearCurrentUser();

        return SDK.wrap(
          SDK.doPost('/user/signup', params, 'user')
        )
        .then(function(user) {
          // Mixpanel Tracking
          AnalyticsProxy.registerUser(user.userID);
          // Track the successful signup
          AnalyticsProxy.track('Signup');

          return user;
        });
      },

      getUserEncryptedData: function() {
        return SDK.wrap(
          SDK.doPost('/user/encrypted')
        );
      },

      resetPassword: function(params) {
        if (!params || !params.password || !params.email) {
          throw new Error('Invalid params');
        }
        return SDK.wrap(
          SDK.doPost('/user/resetpassword', params)
        );
      },

      verifyPassword: function(params) {
        if (!params.password) {
          throw new Error('Expect a password to verify');
        }
        return SDK.wrap(
          SDK.get().verifyPassword(_.pick(params, ['password']))
        )
        .then(function(valid) {
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

      changePassword: function(params) {
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
        return SDK.wrap(
          SDK.doPost('/user/changepassword', params)
        );
      },

      logout: function() {
        $rootScope.$emit('UserAPI.UserLogoutEvent');

        // Regardless of success or fail, we want to clear user data
        return $q.when(SDK.get().logout())
        .then(
          function(result) {
            // Track the successful logout
            AnalyticsProxy.track('Logout');
            AnalyticsProxy.shutdown();

            // clearing the SDK cache upon logout to make sure the user doesn't
            // stay logged in.
            clearCurrentUser();
            return result;
          },
          function(error) {
            // Track the failed logout
            var metricsData = {
              // Error Specific Data
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
          }
        );
      },

      endSession: endSession,

      // TODO(ben): add lock API when needed
      unlock: function(params) {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.get().unlock(params)
        );
      },

      session: function() {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.get().session()
        );
      },

      /**
       * Sets a key value pair in the clienet cache
       * @param { key: 'name_of_key', value: 'name_of_value' } 
       * @returns { Promise } 
       */
      putClientCache: function(params) {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPut('/user/clientCache', params)
        );
      },
      /**
       * Returns the client cache object
       * @param { Object } 
       * @returns { Promise } 
       */

      getClientCache: function() {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doGet('/user/clientCache')
        );
      },

      sendOTP: function(params) {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.get().sendOTP(params)
        );
      },

      newTOTP: function(onSuccess, onError) {
        return SDK.wrap(
          SDK.doGet('/user/otp/totp')
        );
      },

      removeOTPDevice: function(params) {
        if (!params.id) {
          throw new Error('OTP ID Missing for removal');
        }
        return SDK.wrap(
          SDK.doDelete('/user/otp/' + params.id, params)
        );
      },

      addOTPDevice: function(params) {
        // Make sure a params object exists
        if (!params) {
          throw new Error('OTP params Missing');
        }
        if (params.type) {
          return SDK.doPut('/user/otp', params);
        }
      },


      verify: function(parameters) {
        var VALID_TYPES = ['email', 'forgotpassword'];
        var type;
        if(parameters){
          type=parameters.type;
        }
        var verifyUrl = '';

        if (!type || (type && (_.indexOf(VALID_TYPES, type) === -1))) {
          throw new Error('Verify expects a valid verification type');
        }

        switch(parameters.type) {
          case 'email':
            verifyUrl = '/user/verifyemail';
            break;
          case 'forgotpassword':
            verifyUrl = '/user/verifyforgotpassword';
            break;
        }

        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doGet(verifyUrl, parameters, 'user')
        )
        .then(function(user) {
          assertCurrentUserProperties(user);
          return user;
        });
      },

      request: function(params) {
        // Flag for the new client - need email link to be to new client
        // TODO: remove once migrated
        params.isNewClient = true;

        return SDK.wrap(
          SDK.doPost('/user/requestverification', params)
        );
      },

      forgotpassword: function(params) {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPost('/user/forgotpassword', params)
        );
      },

      sharingkey: function(params){
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.get().getSharingKey(params)
        );
      },

      deactivate: function(params) {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPost('/user/deactivate', params)
        );
      },

      payment: function(paymentParams, subscriptionsParams) {
        if (!paymentParams.token || !subscriptionsParams.planId) {
          throw new Error('Invalid parameters for payment');
        }
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPost('/user/payments', paymentParams)
        )
        .then(function(data) {
          return SDK.doPost('/user/subscriptions', subscriptionsParams);
        })
        .catch(PromiseErrorHelper());
      },

      modifyPaymentMethod: function(paymentParams) {
        if (!paymentParams.paymentId ||
            !paymentParams.fingerprint ||
            !paymentParams.type) {
          throw new Error('Missing payment information');
        }
        if (paymentParams.type !== BG_DEV.BILLING.MODIFICATION_TYPE.add &&
            paymentParams.type !== BG_DEV.BILLING.MODIFICATION_TYPE.remove) {
          throw new Error('Invalid payment information');
        }
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPut('/user/payments/' + paymentParams.paymentId, paymentParams)
        );
      },

      createSubscription: function(params) {
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPost('/user/subscriptions', params)
        );
      },

      changeSubscription: function(params, subscriptionId) {
        if (!params.planId || !subscriptionId) {
          throw new Error('Invalid parameters to change subscription');
        }
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doPut('/user/subscriptions/' + subscriptionId, params)
        );
      },

      deleteSubscription: function(subscriptionId) {
        if (!subscriptionId) {
          throw new Error('Invalid parameters to change subscription');
        }
        /* istanbul ignore next */
        return SDK.wrap(
          SDK.doDelete('/user/subscriptions/' + subscriptionId)
        );
      }
    };
  }
]);
