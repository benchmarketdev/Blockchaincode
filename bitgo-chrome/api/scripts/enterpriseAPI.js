angular.module('BitGo.API.EnterpriseAPI', [])
/*
  Notes:
  - This module is for managing all http requests and local caching/state
  for all Enterprise objects in the app
*/
.factory('EnterpriseAPI', ['$location', '$rootScope', 'UtilityService', 'CacheService', 'EnterpriseModel', 'NotifyService', 'SDK',
  function($location, $rootScope, UtilityService, CacheService, EnterpriseModel, NotifyService, SDK) {
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
        $rootScope.$emit('EnterpriseAPI.CurrentEnterpriseSet', {
          enterprises: $rootScope.enterprises
        });
      }
    }

    // Fetch all enterprises for the user
    function getAllEnterprises() {
      return SDK.wrap(
        SDK.doGet('/enterprise', {}, 'enterprises')
      )
      .then(function(enterprises) {
        // Reset the rootScope enterprise list
        $rootScope.enterprises.all = {};

        // Create all 'real' enterprise objects
        _.forEach(enterprises, function(enterpriseData) {
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
        _.forIn($rootScope.enterprises.all, function(enterprise) {
          if (enterprise.id === curEnterpriseId) {
            $rootScope.enterprises.current = enterprise;
          }
        });
        //redirect to correct url incase url in enterprise is wrong. Do not redirect if 'enterprise is not present in url'
        if (UtilityService.Url.getEnterpriseIdFromUrl() && (UtilityService.Url.getEnterpriseIdFromUrl() !== $rootScope.enterprises.current.id)) {
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
      return SDK.wrap(
        SDK.doPost('/enterprise/inquiry', inquiry)
      );
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
      return SDK.wrap(
        SDK.doPost('/enterprise', params)
      );
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
      _.forIn($rootScope.enterprises.all, function(enterprise) {
        enterprise.setWalletShareCount(walletShares);
      });
    }

    /**
    * Decorates each enterprise with wallet data once every wallet returns
    * @param wallets {Object} collection of BitGo client wallet objects
    * @private
    */
    function decorateEnterprisesWithWalletData(wallets) {
      _.forIn($rootScope.enterprises.all, function(enterprise) {
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
      return SDK.wrap(
        SDK.doGet('/enterprise/name/' + enterprise)
      );
    }

    /**
    * Returns latest service version
    * @public
    * @returns { Promise }
    */
    /* istanbul ignore next */
    function getServicesAgreementVersion() {
      return SDK.wrap(
        SDK.doGet('/servicesAgreement')
      );
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
      return SDK.wrap(
        SDK.doPut('/enterprise/servicesAgreement', params)
      );
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
      return SDK.wrap(
        SDK.doGet('/enterprise/' + params.enterpriseId + '/user', params)
      );
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
      return SDK.wrap(
        SDK.doPost('/enterprise/' + params.enterpriseId + '/user', {username: params.username})
      );
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
      return SDK.wrap(
        SDK.doPut('/enterprise/' + params.enterpriseId + '/billing', params)
      );
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
      return SDK.wrap(
        SDK.doDelete('/enterprise/' + params.enterpriseId + '/user', {username: params.username})
      );
    }

    // Event Handling
    $rootScope.$on('UserAPI.CurrentUserSet', function(evt, user) {
      initUserCurrentEnterpriseCache();
      getAllEnterprises();
    });

    $rootScope.$on('UserAPI.UserLogoutEvent', function(evt, user) {
      // clear enterprises on rootscope on logout
      init();
    });

    $rootScope.$on('WalletsAPI.UserWalletsSet', function(evt, data) {
      if (_.isEmpty(data.allWallets)) {
        return;
      }
      // Set users on the current enterprise
      setCurrentEnterpriseUsers();
      // Decorate all enterprises with the latest wallet data
      decorateEnterprisesWithWalletData(data.allWallets);
    });

    $rootScope.$on('WalletSharesAPI.AllUserWalletSharesSet', function(evt, data) {
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
]);
