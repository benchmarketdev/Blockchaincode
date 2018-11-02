// Model for Wallets
angular.module('BitGo.Models.WalletModel', [])

.factory('WalletModel', ['$rootScope', 'CacheService', 'BG_DEV',
  function($rootScope, CacheService, BG_DEV) {

    // map of functions to test policy violation conditions based on test data
    var policyTests = {
      "com.bitgo.whitelist.address": function(testAddress, policy) {
        if (!policy.condition.addresses || !policy.condition.addresses.length) {
          return false;
        }
        var whitelisted = _.some(policy.condition.addresses, function(address) {
          return address == testAddress;
        });
        return !whitelisted;
      },
      "com.bitgo.limit.tx": function(testAmount, policy) {
        if (!policy.condition.amount) {
          return false;
        }
        return parseFloat(testAmount) > policy.condition.amount;
      },
      "com.bitgo.limit.day": function(testAmount, policy) {
        if (!policy.condition.amount) {
          return false;
        }
        return parseFloat(testAmount) > policy.condition.amount;
      }
    };

    var walletCache = CacheService.getCache('Wallets') ?
                      CacheService.getCache('Wallets') :
                      new CacheService.Cache('localStorage', 'Wallets', 120 * 60 * 1000);

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
      // TODO (Gavin): handle this when we know link structure
      // if (wallet.type === 'coinbase') {
      //   wallet.link = 'account/coinbase/' + wallet.id;
      // } else {
      //   wallet.link = 'account/' + wallet.id;
      // }
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
        if (permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) > -1 &&
            permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1 &&
            permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.ADMIN;

        // Spender (cannot set policy)
        } else if ( permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) == -1 &&
                    permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) > -1 &&
                    permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
          return BG_DEV.WALLET.ROLES.SPEND;

        // Viewer (cannot set policy or spend)
        } else if ( permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.ADMIN) == -1 &&
                    permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.SPEND) == -1 &&
                    permissions.indexOf(BG_DEV.WALLET.PERMISSIONS.VIEW) > -1) {
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
    Wallet.prototype.setReportDates = function(reportData) {
      this.data.reportDates = reportData;
    };

    /**
    * Check if the wallet in question has policies on it
    * @returns {Bool}
    * @public
    */
    Wallet.prototype.hasPolicy = function() {
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
    Wallet.prototype.getReportDateInfoForPeriod = function(period) {
      var result;
      _.forEach(this.data.reportDates, function(reportInfo) {
        _.forEach(reportInfo.data, function(monthInfo) {
          if (period === monthInfo.dateVisible) {
            result = monthInfo;
          }
        });
      });
      return result;
    };

    // Helper: Lets caller know if a particular item violates a specified policy
    Wallet.prototype.checkPolicyViolation = function(testPolicyId, testData) {
      if (!_.has(BG_DEV.WALLET.BITGO_POLICY_IDS, testPolicyId)) {
        throw new Error('Invalid testPolicyId');
      }
      if (!this.hasPolicy()) {
        return false;
      }
      var self = this;
      var violatesPolicy;
      _.forEach(self.data.admin.policy.rules, function(policyItem) {
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
    Wallet.prototype.getWhitelist = function() {
      var self = this;
      var policy = self.hasPolicy();
      if (!policy) {
        return;
      }
      return _.filter(self.data.admin.policy.rules, function(policyItem) {
        return policyItem.id === BG_DEV.WALLET.BITGO_POLICY_IDS["com.bitgo.whitelist.address"];
      })[0];
    };

    /**
    * remove a pending approval from the wallet
    * @param {String} approval id
    * @public
    */
    Wallet.prototype.deleteApproval = function(approvalId) {
      var approvals = this.data.pendingApprovals;
      _.forEach(approvals, function(approval, index) {
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
    Wallet.prototype.addApproval = function(approval) {
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
    Wallet.prototype.isSafehdWallet = function() {
      return this.data.type === BG_DEV.WALLET.WALLET_TYPES.SAFEHD;
    };

    /**
    * Check if the user's role on the wallet is Admin
    * @returns {Boolean} if is Admin
    * @public
    */
    Wallet.prototype.roleIsAdmin = function() {
      return this.role === BG_DEV.WALLET.ROLES.ADMIN;
    };

    /**
    * Check if the user's role on the wallet is a Viewer
    * @returns {Boolean} if user is Viewer
    * @public
    */
    Wallet.prototype.roleIsViewer = function() {
      return this.role === BG_DEV.WALLET.ROLES.VIEW;
    };

    return {
      Wallet: Wallet
    };
  }
]);
