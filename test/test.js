const fs = require('fs');
const test = require('ava');
const { rollup } = require('rollup');
const { Parser } = require('acorn');

const { hoistImportDeps } = require('../dist');

process.chdir(__dirname);

// Test with all output formats that support code splitting.
const FORMATS = ['es', 'system', 'cjs', 'amd'];

test(`add __loadDeps wrapper if module has dynamic import`, t => {
  const plugin = hoistImportDeps();
  plugin.parse = code => {
    return Parser.parse(code, { sourceType: 'module', ecmaVersion: 11 });
  };
  plugin.warn = (...args) => {
    console.log(...args);
  };

  const { code, map } = plugin.transform(
    `import {a} from './a.js';
     async function t() {import ('./b.js')}`,
    'test.js',
  );
  t.is(
    code,
    `import {__loadDeps} from 'preloaddeps:import';\nimport {a} from './a.js';
     async function t() {__loadDeps(import ('./b.js'), "__IMPORT_DEPS__")}`,
  );
  t.not(map, null);
});

test(`don't add __loadDeps wrapper if module has no dynamic imports`, t => {
  const plugin = hoistImportDeps();
  let parseCalled = false;
  plugin.parse = code => {
    parseCalled = true;
    return Parser.parse(code, { sourceType: 'module', ecmaVersion: 11 });
  };
  plugin.warn = (...args) => {
    console.log(...args);
  };

  const ret = plugin.transform(
    `import {a} from './a.js';
     function t() {return 10;}`,
    'test.js',
  );

  // First pass saw there were no dynamic imports.
  // So AST parse was never called.
  t.is(ret, null);
  t.is(parseCalled, false);
});

test(`don't add __loadDeps wrapper if module has no (actual) dynamic imports`, t => {
  const plugin = hoistImportDeps();
  let parseCalled = false;
  plugin.parse = code => {
    parseCalled = true;
    return Parser.parse(code, { sourceType: 'module', ecmaVersion: 11 });
  };
  plugin.warn = (...args) => {
    console.log(...args);
  };

  const ret = plugin.transform(
    `import {a} from './a.js';
    /* Hey I'm a comment to trick the first pass - import('blah') */
     function t() {return 10;}`,
    'test.js',
  );

  // Code not transformed even though first pass thought there was a dynamic
  // import.
  t.is(ret, null);

  // AST parse was acyually called before realizing there were no dynamic
  // imports.
  t.is(parseCalled, true);
});

test(`add crossorigin attribute by default`, t => {
  const plugin = hoistImportDeps();
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf(`crossOrigin: 'anonymous'`) !== -1);
});

test(`don't add crossorigin attribute if options.setAnonymousCrossOrigin is set to false`, t => {
  const plugin = hoistImportDeps({ setAnonymousCrossOrigin: false });
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf('crossOrigin') === -1);
});

test(`use empty baseUrl by default`, t => {
  const plugin = hoistImportDeps();
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf(`dep.substring(2)`) === -1);
});

test(`use baseUrl when specified with no '/'`, t => {
  const plugin = hoistImportDeps({ baseUrl: 'client' });
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf(`dep = '/client/' + dep.substring(2);`) !== -1);
});

test(`use baseUrl when specified with leading '/'`, t => {
  const plugin = hoistImportDeps({ baseUrl: '/client' });
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf(`dep = '/client/' + dep.substring(2);`) !== -1);
});

test(`use baseUrl when specified with both leading and trailing '/'`, t => {
  const plugin = hoistImportDeps({ baseUrl: '/client/' });
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf(`dep = '/client/' + dep.substring(2);`) !== -1);
});

test(`use baseUrl when specified with trailing '/'`, t => {
  const plugin = hoistImportDeps({ baseUrl: 'client/' });
  const moduleCode = plugin.load('preloaddeps:import');
  t.assert(moduleCode.indexOf(`dep = '/client/' + dep.substring(2);`) !== -1);
});

FORMATS.forEach(format => {
  test(`${format}:e2e`, async t => {
    // Produce output with plugin.
    const bundle = await rollup({
      input: './fixtures/simple/a.js',
      plugins: [hoistImportDeps({})],
      onwarn: _ => null,
    });
    await bundle.write({ format, dir: `./output/${format}` });

    // Compare with snapshot.
    t.snapshot(fs.readFileSync(`./output/${format}/a.js`).toString());

    // Load the output to sanity check the produced code.
    if (format === 'cjs') {
      global.window = {};
      const { threeXPlusOne } = require(`./output/cjs/a.js`);
      t.is(await threeXPlusOne(20), 61);
      t.is(global.window['HAS_HOIST_PREFETCH'], true);
    }
  });
});
