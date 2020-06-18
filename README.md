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

### `method`

Type: `'preload' | 'import' | 'custom'`<br>
Default: `'preload'`

This controls whether to use link preload to preload the static dependencies or whether to use dynamic imports. The default is to use the link preload method.

See [Preload vs. Dynamic Import](#preload-vs-dynamic-import)) section for comparison of the two methods.

If the `method` is set to `custom` then the preload code is used from `options.customPreload` string.

Example:

```js
    plugins: [hoistImportDeps({method: 'import'})],
```

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

### `customPreload`

Type: (options: Options) => String
Default: undefined

Specifies a function that acts as a custom preload loader. The function accepts the `rollup-plugin-hoist-import-deps` options as input and returns a string that represents the custom loader. Valid only when `method` is custom.

The custom loader code should export a function with the signature `function __loadDeps(baseImport, ...deps)` that return the result of dynamically importing `baseImport` while preloading `deps`.

For example, this can be used to overload the preload method to use `prefetch` instead of `preload` under certain conditions.

Example:

```js
plugins: [
  hoistImportDeps({
    method: 'custom',
    customPreload: (options) => {
      return `
export function __loadDeps(baseImport, ...deps) {
  if (window.HOIST_PREFETCH) {
    // Prefetch baseImport and deps
    ...
  } else {
    // Do regular preload of deps and import of baseImport
    ...
  }
}`,
  }),
];
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
const seen = new Set();␊
function __loadDeps(baseImport, ...deps) {
  if (typeof document !== 'undefined' && document.createElement != null && document.head != null) {
    for (const dep of deps) {
      if (seen.has(dep)) continue;
      const el = document.createElement('link');
      Object.assign(el, { href: dep, rel: 'preload', as: 'script', crossOrigin: 'anonymous', onload: () => el.remove() });
      document.head.appendChild(el);
      seen.add(dep);
    }
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

This plugin can make a significant (positive) difference when say lazily loading
code over a slow/high latency 3G connection (in the order of 1-2 seconds).

## Preload vs. Dynamic Import

By default the plugin uses `preload` link tags as the method to preload the
dependencies. It can be set to use dynamic imports instead by passing `{method: 'import'}` to the plugin.

```js
  ...
   plugins: [hoistImportDeps({method: 'import'})],
```

The ouput chunk then looks like:

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

Using preload link tags preserves the load order of the transitive imports of
the dynamically loaded chunk. However, it is not supported in all browsers
including Firefox where it is behind a flag (though [it is slated to be enabled by default with the release of Firefox 79](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features#HTML) [on 2020-07-28](https://wiki.mozilla.org/Release_Management/Calendar)). The full compatibility across
browsers can be found [here](https://caniuse.com/#feat=link-rel-preload).

Dynamic imports on the other hand should be transformed properly to support
all browsers when using the right rollup config (For example using the
[legacyBuild](https://open-wc.org/building/building-rollup.html#supporting-older-browsers) in open-wc).
However using dynamic imports will load the transitive static imports out of order.
This could cause issues if there are side effects when loading the modules and if the program
relies upon the original order of loading these modules.
