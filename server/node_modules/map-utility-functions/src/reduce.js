/**
 * Same as Array.reduce, but for Maps.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
 * @param {Map} map
 * @param {function(accumulator: *, value: *, key: *, map: Map): *} callback
 * @param {*} initialValue
 * @returns {*} - The result of reducing all of the key/value pairs in the map to a single value with the given callback.
 */
export default function reduce(map, callback, initialValue) {
  let accumulator = initialValue;
  for (let [key, value] of map) {
    accumulator = callback(accumulator, value, key, map);
  }
  return accumulator;
}