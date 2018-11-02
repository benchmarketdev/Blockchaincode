/**
 * @ngdoc module
 * @name BitGo.Analytics
 * @description
 * Manages all things dealing with in-app analytics
 */
angular.module('BitGo.Analytics', [
  // Utilities depends on the AnalyticsProxy
  'BitGo.Analytics.AnalyticsProxyService',
  'BitGo.Analytics.AnalyticsUtilitiesService',
  'BitGo.Analytics.FacebookProvider',
  'BitGo.Analytics.GoogleAdwordsProvider',
  'BitGo.Analytics.MixpanelProvider'
]);
