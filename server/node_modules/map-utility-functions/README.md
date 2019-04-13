# map-utility-functions
A utility function library for working with ES2015 map objects.

## API

### assign(target: Map, sources: ...Map): Map

Works the same as [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign), but for maps instead of objects.

```javascript
const assign = require('map-utility-functions').assign;
// import { assign } from 'map-utility-functions'; // ES2015 syntax
const x = new Map();
x.set('key1', 1);
x.set('key2', 2);
const y = new Map();
y.set('key2', 5);
y.set('key3', 6);
assign(x, y); // Map { 'key1' => 1, 'key2' => 5, 'key3' => 6 }
```

### every(map: Map, callback: function(value: *, key: *, map: Map): boolean, thisArg: *): boolean

Works the same as [Array.every](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every), but for maps instead of arrays.

```javascript
const every = require('map-utility-functions').every;
// import { every } from 'map-utility-functions'; // ES2015 syntax
const x = new Map();
x.set('key1', 5);
x.set('key2', 6);
every(x, (value) => value > 1); // true
every(x, (value, key) => key.startsWith('test')); // false
```

### filter(map: Map, callback: function(value: *, key: *, map: Map): boolean, thisArg: *): Map

Works the same as [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter), but for maps instead of arrays.

```javascript
const filter = require('map-utility-functions').filter;
// import { every } from 'map-utility-functions'; // ES2015 syntax
const x = new Map();
x.set('key1', 1);
x.set('key2', 2);
const y = filter(x, (value) => value > 1); // Map { 'key2' => 2 }
const z = filter(x, (value, key) => key === 'key1'); // Map { 'key1' => 1 }
```

### reduce(map: Map, callback: function(accumulator: *, value: *, key: *, map: Map): *, initialValue: *): *

Works the same as [Array.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce), but for maps instead of arrays.

```javascript
const reduce = require('map-utility-functions').reduce;
// import { reduce } from 'map-utility-functions'; // ES2015 syntax
const x = new Map();
x.set(1, 1);
x.set(2, 2);
x.set(3, 3);
reduce(x, (accumulator, value, key) => accumulator + value + key, 0); // 12
```

### some(map: Map, callback: function(value: *, key: *, map: Map): boolean, thisArg: *): boolean

Works the same as [Array.some](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some), but for maps instead of arrays.

```javascript
const some = require('map-utility-functions').some;
// import { some } from 'map-utility-functions'; // ES2015 syntax
const x = new Map();
x.set('key1', 1);
x.set('key2', 2);
some(x, (value) => value > 0); // true
some(x, (value, key) => key.length > 10); // false
```
