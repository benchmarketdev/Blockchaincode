angular.module('BitGo.Identity.IdentityController', [])
/**
 * @ngdoc controller
 * @name BitGo.Identity.IdentityController
 * @description Controller for identity verification process
 */
.controller('IdentityController', ['$rootScope', '$scope', '$modal', '$location', '$q', 'SettingsAPI', 'IdentityAPI', 'UtilityService', 'NotifyService', 'BG_DEV',
  function($rootScope, $scope, $modal, $location, $q, SettingsAPI, IdentityAPI, Util, Notify, BG_DEV) {

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
      error = (error || {}).error || error || "Verification failed";
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
          v3: true // oauth_key used instead of email / password login
        },
        // TODO(johndriscoll): May want to restrict to prod only after some testing
        development_mode: !_.includes(['test', 'prod'], BitGoConfig.env.getSDKEnv())
      });
      // Return promisified event callback
      // Synapse will send our window object a message event when
      // identity verification is completed or cancelled
      var d = $q.defer();
      $(window).one('message', d.resolve);
      return d.promise
      .then(function(event) {
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
            return IdentityAPI.verifyIdentity($scope.identity.oauth_key)
            .then(SettingsAPI.get)
            .then(function() {
              Notify.success("You're verified!");
              $location.path('/settings');
            });
          } else if (data.cancel) {
            // User canceled
            verifyError("Verification canceled");
          } else {
            // Create account with KYC service
            return IdentityAPI.createIdentity({ fingerprint: ident.fingerprint })
            .then(function(oauth_key) {
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
                  v3: true // oauth_key used instead of email / password login
                },
                development_mode: !BitGoConfig.env.isProd()
              });
              // Return promisified event callback
              // Synapse will send our window object a message event when
              // identity verification is completed or cancelled
              var d = $q.defer();
              $(window).one('message', d.resolve);
              return d.promise;
            })
            .then(function(event) {
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
                  return IdentityAPI.verifyIdentity(ident.oauth_key)
                  .then(SettingsAPI.get)
                  .then(function() {
                    Notify.success("You're verified!");
                    $location.path('/settings');
                  });
                } else if (data.cancel) {
                  // User canceled
                  verifyError("Verification canceled");
                } else {
                  // Something went wrong
                  verifyError();
                }
              } catch (error) {
                console.log(error, event);
                verifyError();
              }
            })
            .catch(function(error) {
              openModal({
                url: 'identity/templates/identity-verification-failed-partial.html',
                type: 'identityVerificationFailed',
                locals: { retryTime: retryTimeString(error.retryTime) }
              })
              .then(function() {
                $location.path('/settings');
              });
            });
          }
        } catch (error) {
          console.log(error, event);
          verifyError();
        }
      })
      .catch(onCreateIdentityFail);
    }

    function onCreateIdentityFail(error) {
      if (Util.API.isOtpError(error)) {
        openModal({
          url: 'modal/templates/modalcontainer.html',
          type: 'otp'
        })
        .then(function(data) {
          if (data.type === 'otpsuccess') {
            $scope.createIdentity();
          }
        })
        .catch(onCreateIdentityFail);
      } else if (error.retryTime) {
        openModal({
          url: 'identity/templates/identity-verification-failed-partial.html',
          type: 'identityVerificationFailed',
          locals: { retryTime: retryTimeString(error.retryTime) }
        })
        .then(function() {
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
      d.promise
      .then(function(fingerprint) {
        $scope.identity.fingerprint = fingerprint;
        return IdentityAPI.createIdentity($scope.identity);
      })
      .catch(onCreateIdentityFail)
      .then(onCreateIdentitySuccess);
    };

    var killNameWatcher = $rootScope.$watch('currentUser.settings.name.full', function(name) {
      if (!$rootScope.currentUser.settings.email ||
          $rootScope.currentUser.settings.email.email !== name) {
        $scope.identity.name = name;
      }
    });

    var killPhoneWatcher = $rootScope.$watch('currentUser.settings.phone.phone', function(phone) {
      $scope.identity.phone = phone;
    });

    var killIdentityWatcher = $rootScope.$watch('currentUser.settings.identity.verified', function(verified) {
      // Redirect to settings page if user is already verified
      if (verified) {
        $location.path('/settings');
      }
    });

    $scope.$on('$destroy', function() {
      angular.element(document.body).removeClass('identityDocumentVerification');
      killNameWatcher();
      killPhoneWatcher();
      killIdentityWatcher();
    });

    function init() {
      $rootScope.setContext('identityVerification');
    }
    init();

  }]
);