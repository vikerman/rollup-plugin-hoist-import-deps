const fs = require('fs');
const test = require('ava');
const { rollup } = require('rollup');

const { hoistImportDeps } = require('../dist');

process.chdir(__dirname);

// Test with all output formats that support code splitting.
const FORMATS = ['es', 'system', 'cjs', 'amd'];
const METHODS = ['preload', 'import'];

METHODS.forEach(method => {
  FORMATS.forEach(format =>
    test(`${format}:${method}:simple`, async t => {
      // Produce output with plugin.
      const bundle = await rollup({
        input: './fixtures/simple/a.js',
        plugins: [hoistImportDeps({ method })],
        onwarn: _ => null,
      });
      await bundle.write({ format, dir: `./output/${format}/${method}` });

      // Compare with snapshot.
      t.snapshot(fs.readFileSync(`./output/${format}/${method}/a.js`).toString());

      // Load the output to sanity check the produced code.
      if (format == 'cjs') {
        const { threeXPlusOne } = require(`./output/cjs/${method}/a.js`);
        t.is(await threeXPlusOne(20), 61);
      }
    }),
  );
});
