/**
 * Same as Array.filter, but for Maps.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
 * @param {Map} map
 * @param {function(value: *, key: *, map: Map): boolean} callback
 * @param {*} thisArg
 * @returns {Map} - A new map, only containing key/value pairs for which the given callback returns true.
 */
export default function filter(map, callback, thisArg = null) {
  const result = new Map();
  for (let [key, value] of map) {
    if (callback.call(thisArg, value, key, map)) {
      result.set(key, value);
    }
  }
  return result;
}