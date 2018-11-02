/**
 * @ngdoc service
 * @name FacebookProvider
 * @description
 * This manages the analytics calls to Facebook
 */
angular.module('BitGo.Analytics.FacebookProvider', [])

.factory('FacebookProvider', ['$rootScope', 'BG_DEV', 'UtilityService',
  function($rootScope, BG_DEV, UtilityService) {

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
        window._fbq.push(['track', '6023716497741', { 'value':'1', 'currency':'USD' } ]);
      } catch(error) {
        console.log('Facebook identify failed: ', error.error);
      }
    }


    // initialize FB analytics
    init();


    // In-app API

    return {
      identify: identify
    };
  }
]);
