/*

 * @ngdoc filter
 * @name bgOrderObjectsBy

 * @param {items} objects - The object you want to order
 * @param {key} objects - The key which you want to order things by
 * @param {reverse} boolean - Lets you order in the reverse order

 * @description
 * This filter orders objects based on the keys
   (The built in orderBy filter in Angular only does arrays)

 * @example
 * <div ng-repeat="wallet in wallets.all | bgOrderObjectsBy:'data.label'">
 * {{ item in items | bgOrderObjectsBy:'color':true }}
*/

angular.module('BitGo.Common.BGOrderObjectsByFilter', [])

.filter('bgOrderObjectsBy', function () {
  var object;
  return function (objects, key, reverse) {
    // clone object so that objet passed in is not directly modified
    var items = _.clone(objects);
    if (!items || _.isEmpty(items)) {
      return;
    }
    if (!key) {
      throw new Error('missing sort key');
    }
    var sortBy = [];
    var sorted = [];

    function getValueFromKeys(item, keys) {
      _.forEach(keys, function(key) {
        if (_.has(item, key)) {
          item = item[key];
        } else {
          throw new Error('Expected object key to exist');
        }
      });
      return item;
    }

    var keys = key.split('.');
    _.forIn(items, function(item) {
      sortBy.push(getValueFromKeys(item, keys));
    });
    sortBy.sort(function (a, b) {
      return (a > b ? 1 : -1);
    });
    if(reverse){
      sortBy.reverse();
    }

    _.forEach(sortBy, function(sortVal) {
      _.forIn(items, function(item, itemKey) {
        var label = getValueFromKeys(item, keys);
        if (label === sortVal) {
          sorted.push(item);
          // delete properties from the object so that if there are objects with the same label, they don't get counted twice
          delete items[itemKey];
        }
      });
    });
    return sorted;
  };
});
