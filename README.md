# rollup-plugin-hoist-import-deps

Change dynamic import call sites to also parallely load the static imports of the dynamic chunk being loaded.

This can avoid waterfalls when dynamically importing chunks and can improve performance of lazy loading chunks, especially on slow/high latency connections.

## Install

```sh
npm i --save-dev rollup-plugin-hoist-import-deps
```

or

```sh
yarn add -D rollup-plugin-hoist-import-deps
```

## Usage

```js
import { hoistImportDeps } from 'rollup-plugin-hoist-import-deps';

export default {
  entry: 'src/main.js',
  output: {
    dir: 'output',
    format: 'es',
  },
  plugins: [hoistImportDeps()],
};
```

## Example

Lets say you have a entry-point file `a.js` that dynamically imports `b.js`
and `b.js` in turn statically imports `c.js`.

```js
// a.js
export async function myFunction(x) {
  const { inc } = await import('./b.js'); // Dynamic import

  return x * inc(x);
}
```

```js
// b.js
import { add } from './c.js'; // Static import

export function inc(x) {
  return add(x, 1);
}
```

```js
// c.js
export function add(x, y) {
  return x + y;
}
```

Without this plugin, the output chunk for `a.js` would look something like:

```js
// output/a.js
async function myFunction(x) {
  const { inc } = await import('./b-467ea706.js');

  return x * inc(x);
}

export { myFunction };
```

With the plugin the output chunks for `a.js` would be transformed to look
something like:

```js
function __loadDeps(baseImport, ...deps) {
  for (const dep of deps) {
    import(dep);
  }
  return baseImport;
}

async function myFunction(x) {
  const { inc } = await __loadDeps(import('./b-467ea706.js'), './c-a66d9c36.js');

  return x * inc(x);
}

export { myFunction };
```

So when `./b-467ea706.js` is dynamically imported it avoids the JS load waterfall where its static import `./c-a66d9c36.js` is loaded in parallel instead of sequentially after downloading and parsing the chunk
`./b-467ea706.js`.

This plugin can make a significant (positive) difference when say lazily loading code over a slow/high latency 3G connection (in the order of 1-2 seconds).

## Caveat

One thing to notice is that the transformation can affect the implicit load
order which could be a problem if the imported chunks have side-effects and your program relies on the order on loading of these chunks.

In general, it is better not to rely on the loading order and it is especially
important when using this plugin.
