/*
  Notes:
  - The BitGo.Utility module is intended to be used throughout the app and
  should not be composed of (have dependencies on) any other modules
  outside of those in the BitGo.Utility namespace.
*/
angular.module('BitGo.Utility', [
  // Modules for BitGo.Utility composition
  'BitGo.Utility.CacheService',
  'BitGo.Utility.UtilityService'
]);
