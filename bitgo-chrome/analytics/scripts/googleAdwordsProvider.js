/**
 * @ngdoc service
 * @name GoogleAdwordsProvider
 * @description
 * Manages initializing Google Adwords
 */
angular.module('BitGo.Analytics.GoogleAdwordsProvider', [])

.factory('GoogleAdwordsProvider', ['$rootScope', 'UtilityService',
  function($rootScope, UtilityService) {

    /**
    * Initialize Google Adwords pixel
    * @private
    */
    function init() {
      if (UtilityService.Global.isChromeApp) {
        return;
      }
      // initialize variables for all tracking calls
      window.google_conversion_color = "ffffff";
      window.google_conversion_format = "3";
      window.google_conversion_id = 947879481;
      window.google_conversion_label = "0vJFCMze9FwQufz9wwM";
      window.google_conversion_language = "en";
      window.google_remarketing_only = false;

      // Fetch and inject Google's converstion script
      var scriptEle = document.createElement('script');
      scriptEle.src = "//www.googleadservices.com/pagead/conversion_async.js";

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
        opt.onload_callback = function() {
          if (typeof(url) != 'undefined') {
            window.location = url;
          }
        };
        var conv_handler = window.google_trackConversion;
        if (typeof(conv_handler) == 'function') {
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

    return {
      identify: identify
    };
  }
]);
