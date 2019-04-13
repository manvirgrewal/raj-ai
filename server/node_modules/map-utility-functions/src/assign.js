/**
 * Same as Object.assign, but for Maps.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 * @param {Map} target
 * @param {...Map} sources
 * @returns {Map} - The given map, with all of the key/value pairs from all of the source maps set on it. Keys from later
 * sources will overwrite keys from earlier sources in the list.
 */
export default function assign(target, ...sources) {
  for (let source of sources) {
    for (let [key, value] of source) {
      target.set(key, value);
    }
  }
  return target;
}