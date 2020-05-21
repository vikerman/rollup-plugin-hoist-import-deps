import { walk } from 'estree-walker';
import MagicString from 'magic-string';

const VIRTUAL_ID_IMPORT = 'preloaddeps:import';
const MARKER = '"__IMPORT_DEPS__"';

export function hoistImportDeps(options) {
  options = options || { method: 'preload' };

  // Get the static deps of a chunk and return them as list lietral of strings
  // that can be passed as arguments to module preload method(__loadeDeps).
  const getDeps = (chunkName, bundle) => {
    let name = chunkName.startsWith('./') ? chunkName.substring(2) : chunkName;

    // AMD specifies dynamic imports without .js extension.
    // So add .js while looking up and remove .js while writing the import chunk name.
    let amd = false;
    if (!name.endsWith('.js')) {
      amd = true;
      name += '.js';
    }

    const chunk = bundle[name];
    if (chunk && chunk.imports.length > 0) {
      const ret = chunk.imports
        // remove the .js extension if it's AMD and using dynamic import method.
        .map(s => `"./${amd && options.method === 'import' ? s.substring(0, s.length - 3) : s}"`)
        .join(',');
      return ret;
    } else {
      return '';
    }
  };

  return {
    name: 'hoist-import-deps',

    resolveId(id) {
      if (id === VIRTUAL_ID_IMPORT) {
        return id;
      }
      return null;
    },

    // Add a virtual module for preloading dependencies.
    // The actual preloading mechanism can be configured in the plugin.
    load(id) {
      if (id === VIRTUAL_ID_IMPORT) {
        if (options.method === 'import') {
          return `export function __loadDeps(baseImport, ...deps) {
  for (const dep of deps) {
    import(dep);
  }
  return baseImport;
}`;
        } else {
          return `const seen = new Set();
export function __loadDeps(baseImport, ...deps) {
  if (typeof document !== 'undefined' && document.createElement != null && document.head != null) {
    for (const dep of deps) {
      if (seen.has(dep)) continue;
      const el = document.createElement('link');
      Object.assign(el, { href: dep, rel: 'preload', as: 'script', crossorigin: 'anonymous', onload: () => el.remove() });
      document.head.appendChild(el);
      seen.add(dep);
    }
  }
  return baseImport;
}`;
        }
      }
      return null;
    },

    // Hook into `transform` to convert dynamic import
    // ```
    // import("my-module")
    // ```
    // to
    // ```
    // import {__loadDeps} from 'preloaddeps:import';
    // ...
    // _loadDeps(import("my-module"), "__IMPORT_DEPS__")
    // ```
    //
    // This lets us identify the dynamic import site later using
    // the marker string even when the output type is not ESM and
    // the dynamic import expression has been transformed.
    transform(code, id) {
      if (id === VIRTUAL_ID_IMPORT) {
        return null;
      }

      const firstpass = /import\s*\([^\)]+\)/;
      if (!code.match(firstpass)) {
        return null;
      }

      let ast = null;
      try {
        ast = this.parse(code);
      } catch (err) {
        this.warn({
          code: 'PARSE_ERROR',
          message: `rollup-plugin-hoist-import-deps: failed to parse ${id}.`,
        });
      }
      if (!ast) {
        return null;
      }

      const magicString = new MagicString(code);
      let hasDynamicImport = false;
      walk(ast, {
        enter(node) {
          if (node.type === 'ImportExpression') {
            hasDynamicImport = true;
            magicString.prependLeft(node.start, '__loadDeps(');
            magicString.appendRight(node.end, `, ${MARKER})`);
          }
        },
      });
      if (hasDynamicImport) {
        magicString.prepend(`import {__loadDeps} from '${VIRTUAL_ID_IMPORT}';\n`);
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true }),
      };
    },

    // Transform
    // ```
    // _loadDeps(import("my-chunk"), "__IMPORT_DEPS__")
    // ```
    // from the `transform` step to
    // ```
    // _loadDeps(import("my-chunk"),"chunkA","chunkB")
    // where `chunkA` and `chunkB` are the static imports of `my-chunk`.
    // It is done in `generateBundle` instead of `renderChunk` because the full
    // chunk graph is available only at this point including the cases where the output
    // is not ESM and there are circular dependencies in the dynamic imports.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateBundle(_, bundle) {
      for (const chunkName of Object.keys(bundle)) {
        const chunk = bundle[chunkName];
        if (chunk.type !== 'chunk' || chunk.dynamicImports.length === 0) {
          continue;
        }

        const code = chunk.code;

        let ast = null;
        try {
          ast = this.parse(code);
        } catch (err) {
          this.warn({
            code: 'PARSE_ERROR',
            message: `rollup-plugin-hoist-import-deps: failed to parse ${chunk.fileName}.`,
          });
        }
        if (!ast) {
          continue;
        }

        const magicString = new MagicString(code);

        walk(ast, {
          enter(node, parent) {
            let importChunkName = null;
            if (node.type === 'Literal' && node.raw === MARKER) {
              const importExpr = parent.arguments[0];
              if (!importExpr) {
                return;
              }

              if (importExpr.type === 'ImportExpression') {
                // ESM output
                importChunkName = importExpr.source ? importExpr.source.value : null;
              } else {
                // non-ESM creates crazy Promise wrapper. Just walk it again to find the chunk name in it.
                walk(importExpr, {
                  enter(node) {
                    if (node.type === 'Literal') {
                      importChunkName = node.value;
                    }
                  },
                });
              }
            }

            if (importChunkName) {
              magicString.overwrite(node.start, node.end, getDeps(importChunkName, bundle));
            }
          },
        });

        chunk.code = magicString.toString();
        // TODO: Combine existing sourcemap with generated sourcemap.
        // Doesn't seem to adversely affect the sourcemap quality without it though.
      }
    },
  };
}
