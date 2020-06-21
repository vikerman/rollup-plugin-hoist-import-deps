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

## Options

### `baseUrl`

Type: `String`<br>
Default: `''`

The `baseUrl` of be used when preloading the JavaScript files. This is the path of the JS files relative to the `index.html` (or whatever HTML that is loading the scripts).

Valid only when `method` is `preload`.

Example - If your index.html is served from `/` and the JS is served from `/client`, set `baseUrl` to `'client'` so that the
`href` in the preload links are properly preficed with `/client'.

```js
    plugins: [hoistImportDeps({baseUrl: 'client'})],
```

### `setAnonymousCrossOrigin`

Type: `boolean`<br>
Default: `true`

Whether to set the crossorigin attribute of the link element to `'anonymous'` when using the link preload method. In certain cases setting this flag to `false` becomes necessary (See https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/12).

Valid only when `method` is `preload`.

Don't set this option to `false` unless you know what you are doing.

Example:

```js
    plugins: [hoistImportDeps({setAnonymousCrossOrigin: false})],
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
     // Preload code goes here.
     ...
  }
  return import(baseImport);
}

async function myFunction(x) {
  const { inc } = await __loadDeps('./b-467ea706.js', './c-a66d9c36.js');

  return x * inc(x);
}

export { myFunction };
```

So when `./b-467ea706.js` is dynamically imported it avoids the JS load
waterfall where its static import `./c-a66d9c36.js` is loaded in parallel
instead of sequentially after downloading and parsing the chunk
`./b-467ea706.js`.

This plugin can make a significant (positive) difference when say lazily
loading code over a slow/high latency 3G connection (in the order of 1-2
seconds).

## Preload fallback

The preload code first tried to use link preload as the method to preload the
static dependencies. If that's not supported in the browser it just falls back
to using `fetch` to preload the dependencies.

## Prefetch support

This plugin also allows you to prefetch the script specified by your dynamic
import, by setting `window.HOIST_PREFETCH`. This puts the preloader code in
prefetch mode where both dependencies and the actual import are prefetched
istead of actually being loaded. This tries to use the browser link prefetch
method which will download the scripts in lower priority. When link prefetch
is unavailable it just uses fetch with requestIdleCallback.

In the following example instead of loading `b.js` and preload it's
dependencies, it will prefetch `b.js` and its dependencies.

Later when actual `import('./b.js')` is executed without the prefetch, it
will load the modules from the prefetch cache instead of going to the
network.

```js
window.HOIST_PREFETCH = true;
try {
  import('./b.js');
} finally {
  window.HOIST_PREFETCH = undefined;
}
```
