angular.module('BitGo.Common.BGPasswordStrength', [])

/**
 * Realtime feedback for password strength
 */
.directive('bgPasswordStrength', function() {
  return {
    restrict: 'A',
    scope: {
      passwordStrength: '=bgPasswordStrength',
      onPasswordChange: '&onPasswordChange'
    },
    link: function(scope, element, attr) {
      var priorScore = 0;
      var checkPassword = function() {
        if (typeof(zxcvbn) != 'undefined') {
          var password = element[0].value;
          scope.passwordStrength = zxcvbn(password);
          var crack_time = scope.passwordStrength.crack_time * 1.5;
          var crack_time_display;

          // Compute the "time to crack" sentence
          var seconds_per_minute = 60;
          var seconds_per_hour = seconds_per_minute * 60;
          var seconds_per_day = seconds_per_hour * 24;
          var seconds_per_month = seconds_per_day * 30;
          var seconds_per_year = seconds_per_month * 12;
          var seconds_per_decade = seconds_per_year * 10;
          var seconds_per_century = seconds_per_decade * 10;

          if (crack_time < seconds_per_minute * 2) {
            crack_time_display = "about a minute";
          } else if (crack_time < seconds_per_hour * 2) {
            var minutes = Math.round(crack_time / seconds_per_minute);
            crack_time_display = "about " + minutes + " minutes";
          } else if (crack_time < seconds_per_day * 2) {
            var hours = Math.round(crack_time / seconds_per_hour);
            crack_time_display = "about " + hours + " hours";
          } else if (crack_time < seconds_per_month * 2) {
            var days = Math.round(crack_time / seconds_per_day);
            crack_time_display = "about " + days + " days";
          } else if (crack_time < seconds_per_year * 2) {
            var months = Math.round(crack_time / seconds_per_month);
            crack_time_display = "about " + months + " months";
          } else if (crack_time < seconds_per_decade * 2) {
            var years = Math.round(crack_time / seconds_per_year);
            crack_time_display = "about " + years + " years";
          } else if (crack_time < seconds_per_century) {
            var decades = Math.round(crack_time / seconds_per_decade);
            crack_time_display = "about " + decades + " decades";
          } else {
            crack_time_display = "more than a century";
          }
          scope.passwordStrength.crack_time_display = crack_time_display;

          // Compute details about how this password was cracked
          var types = [];
          var passwordDetails = "";
          scope.passwordStrength.match_sequence.forEach(function(match, index) {
            var type;
            switch(match.pattern) {
              case 'dictionary':
                type = "the " + match.dictionary_name + " dictionary";
                break;
              case 'date':
                type = "a simple date";
                break;
              case 'sequence':
                type = "a pattern sequence";
                break;
              case 'spatial':
                type = "keys that are close to each other on the keyboard";
                break;
              case 'digits':
                type = "easy to guess digits";
                break;
            }
            if (type && types.indexOf(type) == -1) {
              types.push(type);
              if (!passwordDetails.length) {
                passwordDetails += 'BitGo detects this password is comprised of: ';
              } else {
                if (index == scope.passwordStrength.match_sequence.length - 1) {
                  passwordDetails += " and ";
                } else {
                  passwordDetails += ', ';
                }
              }
              passwordDetails += type;
            }
          });
          scope.passwordStrength.details = passwordDetails;

          // Compute indicator for a progress meter
          var progress = {};
          progress.value = (scope.passwordStrength.score + 1) / 5 * 100;
          progress.class = ['passwordStrength-fill--1',
                            'passwordStrength-fill--2',
                            'passwordStrength-fill--3',
                            'passwordStrength-fill--4',
                            'passwordStrength-fill--5'][scope.passwordStrength.score];
          scope.passwordStrength.progress = progress;
          scope.$apply(scope.passwordStrength);
          if ((priorScore != progress.value) && scope.onPasswordChange) {
            scope.onPasswordChange();
            priorScore = progress.value;
          }
        }
      };
      element.bind("change", checkPassword);
      element.bind("keyup", checkPassword);
    }
  };
});
