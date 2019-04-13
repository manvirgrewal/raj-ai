import some from './some';

/**
 * Same as Array.every, but for Maps.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
 * @param {Map} map
 * @param {function(value: *, key: *, map: Map): boolean} callback
 * @param {*} thisArg
 * @returns {boolean} - True if the given callback returns true for every key/value pair in the map, false otherwise.
 */
export default function every(map, callback, thisArg = null) {
  const notEvery = some(map, (value, key) => !callback.call(thisArg, value, key, map));
  return !notEvery;
}