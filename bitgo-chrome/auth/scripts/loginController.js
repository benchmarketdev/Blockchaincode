/**
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
angular.module('BitGo.Auth.LoginController', [])

.controller('LoginController', ['$scope', '$rootScope', '$location', 'UserAPI', 'UtilityService', 'KeychainsAPI', 'SettingsAPI', 'NotifyService', 'PostAuthService', 'EnterpriseAPI', 'RequiredActionService', 'BG_DEV', 'CacheService',
  function($scope, $rootScope, $location, UserAPI, Util, KeychainsAPI, SettingsAPI, Notify, PostAuthService, EnterpriseAPI, RequiredActionService, BG_DEV, CacheService) {
    $scope.viewStates = ['login', 'needsEmailVerify', 'setOtpDevice', 'verifyPhone', 'otp', 'totpSetup', 'terms'];

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

    $scope.setPostauth = function() {
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

    var killUserLoginListener = $scope.$on('SignUserIn', function() {
      // empty the enterprise list
      $scope.enterprisesList = [];

      if ($rootScope.currentUser.isEnterpriseCustomer()) {
        return EnterpriseAPI.getServicesAgreementVersion()
        .then(function(data) {
          // check each enterprise the user is on, check the version
          _.forEach($rootScope.currentUser.settings.enterprises, function(enterprise) {
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

    var killUserSetListener = $rootScope.$on('UserAPI.CurrentUserSet', function(evt, data) {
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
        KeychainsAPI.createKeychain(params)
        .then(function(data){
          newSettings = {
            otp: null,
            settings: {
              ecdhKeychain: data.xpub
            }
          };
          return SettingsAPI.save(newSettings);
        }).then(function(){
          $rootScope.currentUser.settings.ecdhKeychain = newSettings.settings.ecdhKeychain;
        }).catch(function(error){
          console.error('Error setting the user ecdh keychain: ', error.error);
        });
      }
    });

    // Event handler cleanup
    $scope.$on('$destroy', function() {
      killUserSetListener();
      killUserLoginListener();
    });

    $scope.attemptLogin = function(forceSMS) {
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

    $scope.sendEmailVerification = function() {
      var email = $scope.user.settings.email.email;
      if (email) {
        var params = {
          type: "email",
          email: email
        };
        UserAPI.request(params)
        .then(Notify.successHandler('Your email was sent.'))
        .catch(function(error) {
          Notify.error("There was an issue resending your email. Please refresh your page and try this again.");
        });
      }
    };

    function getVerificationState() {
      var verificationStates = ['needsEmailVerify', 'setOtpDevice', 'verifyPhone'];
      var result;
      var foundState;
      var urlStates = $location.search();

      _.forEach(verificationStates, function(state) {
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
]);
