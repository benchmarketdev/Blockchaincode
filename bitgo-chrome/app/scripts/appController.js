/*
  About:
  - This manages state for overarching components in the app (e.g. header bar)
*/
angular.module('BitGo.App.AppController', [])

.controller('AppController', ['$scope', '$rootScope', '$location', 'UserAPI', 'EnterpriseAPI', 'UtilityService', '$timeout',
  function($scope, $rootScope, $location, UserAPI, EnterpriseAPI, Utils, $timeout) {
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
      _.forIn($rootScope.enterprises.all, function(enterprise) {

        if ( ($rootScope.enterprises.current && (enterprise.id === $rootScope.enterprises.current.id)) ||
             (_.keys(enterprise.pendingApprovals).length + enterprise.walletShareCount.incoming) === 0 ) {
          return;
        }
        if (enterprise.walletShareCount.incoming > 0) {
          openDropdown = true;
          return false;
        }
        _.forOwn(enterprise.pendingApprovals, function(approval) {
          if (approval.creator !== $rootScope.currentUser.settings.id) {
            openDropdown = true;
            return false;
          }
        });
      });
      return openDropdown;
    };

    // Header State Controls
    $scope.isCurrentEnterpriseSection = function(section) {
      return Utils.Url.getEnterpriseSectionFromUrl() === section;
    };

    $scope.isPage = function(pagePath) {
      return $location.path() === pagePath;
    };

    /**
     * Logic to show to settings icon at the top nav bar
     * @public
     */
    $scope.canShowEnterpriseSettingsIcon = function() {
      if ($rootScope.enterprises && $rootScope.enterprises.current) {
        return $rootScope.enterprises.current.isAdmin && !$rootScope.enterprises.current.isPersonal && !Utils.Url.isAccountSettingsPage() && !Utils.Url.isCreateEnterprisePage();
      }
      return false;
    };

    /**
     * Logic to turn the top nav dropdown title blue if user is in settings
     * @public
     */
    $scope.isAccountSettingsSection = function() {
      return Utils.Url.isAccountSettingsPage();
    };

    /**
     * Logic to use when deciding if a url is enterprise settings
     * @public
     */
    $scope.isEnterpriseSettingsSection = function() {
      return Utils.Url.isEnterpriseSettingsPage();
    };

    /**
     * Logic to turn the top nav dropdown title blue if user is create enterprise
     * @public
     */
    $scope.isCreateEnterpriseSection = function() {
      return Utils.Url.isCreateEnterprisePage();
    };

    /**
     * Logic to show active tile in the top level nav
     * @param id {String} enterprise id
     * @public
     */
    $scope.isCurrentEnterprise = function(id) {
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
    $scope.isDropdownSection = function(section) {
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
    $scope.goToGlobalSettings = function() {
      $location.path('/settings');
    };

    /**
     * Go to the create enterprise section of the app
     * @public
     */
    $scope.goToAddEnterprise = function() {
      $location.path('/create-organization');
    };

    /**
     * Sign the user out of the app
     * @public
     */
    $scope.logout = function() {
      $location.path('/logout');
    };

    $scope.enterpriseIsPersonal = function() {
      return $rootScope.enterprises.current &&
             $rootScope.enterprises.current.isPersonal;
    };

    /**
     * Sets the current enterprise and navigates to their wallets
     * @param {Object} bitgo client enterprise object
     * @public
     */
    $scope.goToEnterprise = function(enterprise) {
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
    $scope.goToEnterpriseSettings = function(enterprise) {
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
    $scope.showApprovalIcon = function(enterpriseId) {
      if (!$rootScope.enterprises.all[enterpriseId] || _.keys($rootScope.enterprises.all[enterpriseId].pendingApprovals).length === 0) {
        return false;
      }
      $scope.relevantApprovalCount[enterpriseId] = 0;
      _.forOwn($rootScope.enterprises.all[enterpriseId].pendingApprovals, function(approval) {
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
    $scope.showApprovalAndSharesIcon = function(enterpriseId) {
      if (!$rootScope.enterprises.all[enterpriseId] || (_.keys($rootScope.enterprises.all[enterpriseId].pendingApprovals).length + $rootScope.enterprises.all[enterpriseId].walletShareCount.incoming) === 0) {
        return false;
      }
      $scope.approvalAndSharesCount[enterpriseId] = 0;
      _.forOwn($rootScope.enterprises.all[enterpriseId].pendingApprovals, function(approval) {
        if (approval.creator !== $rootScope.currentUser.settings.id) {
          $scope.approvalAndSharesCount[enterpriseId]++;
        }
      });
      $scope.approvalAndSharesCount[enterpriseId] += $rootScope.enterprises.all[enterpriseId].walletShareCount.incoming;
      return $scope.approvalAndSharesCount[enterpriseId] > 0;
    };

    // Event handlers
    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function(evt, data) {
      // When the currentUser is set, update the local user
      updateAppUser();
      // open the enterprise dropdown if there are any pending approvals or shares across enterprises
      if (hasApprovalsOrShares()) {
        // add timeout so that it gets added to the next digest cycle
        $timeout(function() {
          $scope.toggleDropdown = true;
        }, 0);
      }
    });

    var killPlaceholderUserSetListener = $rootScope.$on('UserAPI.PlaceholderUserSet', function(evt, data) {
      updateAppUser();
    });

    var killBitcoinPriceListener = $rootScope.$on('MarketDataAPI.AppCurrencyUpdated', function(event, currencyData) {
      if (currencyData && currencyData.data && currencyData.data.current && currencyData.data.current.last){
        $scope.priceDisplay = parseFloat(currencyData.data.current.last).toFixed(2);
      }
    });

    // Listen for the ng-view main content to be loaded
    var killViewLoadListener = $scope.$on('$viewContentLoaded', function() {
      $scope.isViewLoaded = true;
    });

    // Clean up the event listeners when the scope is destroyed
    // This keeps the angular run loop leaner and reduces the odds that
    // a reference to this scope is kept once the controller is scrapped
    $scope.$on('$destroy', function() {
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
]);
