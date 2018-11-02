/* istanbul ignore next */
angular.module('BitGo.API.SettingsAPI', [])

.factory('SettingsAPI', ['$location', '$rootScope', 'SDK',
  function($location, $rootScope, SDK) {
    function assertAuth(data) {
      console.assert(_.has(data, 'token_type'), "missing token_type");
      console.assert(_.has(data, 'access_token'), "missing access_token");
      console.assert(_.has(data, 'expires_in'), "missing expires_in");
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
      // Get all settings
      get: function() {
        return SDK.wrap(
          SDK.doGet('/user/settings', {}, 'settings')
          .then(function(settings) {
            return assertSettings(settings);
          })
        );
      },
      // Set Specific User Settings
      save: function(params) {
        if (!params) {
          throw new Error('invalid params');
        }
        return SDK.wrap(
          SDK.doPut('/user/settings', params)
        );
      },
      // Save a new phone number on the user
      savePhone: function(params) {
        if (!params) {
          throw new Error('invalid params');
        }
        return SDK.wrap(
          SDK.doPost('/user/settings/phone', params)
        );
      },
    };
  }
]);
