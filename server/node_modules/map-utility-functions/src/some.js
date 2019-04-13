/**
 * Same as Array.some, but for Maps.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
 * @param {Map} map
 * @param {function(value: *, key: *, map: Map): boolean} callback
 * @param {*} thisArg
 * @returns {boolean} - True if the given callback returns true for any key/value pair in the map, false otherwise.
 */
export default function some(map, callback, thisArg = null) {
  for (let [key, value] of map) {
    if (callback.call(thisArg, value, key, map)) {
      return true;
    }
  }
  return false;
}