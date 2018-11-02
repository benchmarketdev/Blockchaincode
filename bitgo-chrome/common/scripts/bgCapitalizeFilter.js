/*
  Filter to capitalize the first character of a word
  {{ foo | bgCapitalize }} => Foo
  {{ bar | bgCapitalize }} => Bar
*/
angular.module('BitGo.Common.BGCapitalizeFilter', [])

.filter('bgCapitalize', [
  function () {
    return function(input) {
      return !!input ? input.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }) : '';
    };
  }
]);
