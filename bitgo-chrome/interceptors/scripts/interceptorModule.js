/*
  About:
  - Deals with how we modify any incoming/outgoing HTTP requests before
  control gets in to the Service (API) layer (e.g. sometimes we want to
   decorate the response or redirect based on auth tokens, etc...)
*/
angular.module('BitGo.Interceptors', [
  // Modules for BitGo.Interceptors composition
  'BitGo.Interceptors.BrowserInterceptor'
]);
