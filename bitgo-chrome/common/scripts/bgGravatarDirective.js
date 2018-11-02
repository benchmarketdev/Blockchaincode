/**
 * @ngdoc directive
 * @name BGGravatarDirective
 * @requires md5
 * @description
 * Directive to include a gravatar image given a user's email address.
 * @param {string} email The email address to fetch a gravatar for
 * @param {string} name The alt-text for the image
 * @param {string} height The height of the image
 * @param {string} width The width of the image
 * @example
 *   <span bg-gravatar email="john@doe.com"></span>
 */
angular.module('BitGo.Common.BGGravatarDirective', [])

.directive('bgGravatar', [ 'md5', function(md5) {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      name: '@',
      height: '@',
      width: '@',
      email: '@'
    },
    link: function(scope, el, attr) {
      scope.$watch('email', function (newValue, oldValue, scope) {
        if (newValue) {
          scope.emailHash = md5.createHash(newValue);
        }
      });
    },
    template: '<img alt="{{ name }}" height="{{ height }}"  width="{{ width }}" src="https://secure.gravatar.com/avatar/{{ emailHash }}.jpg?s={{ width }}&d=mm">'
  };
}]);
