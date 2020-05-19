import pkg from './package.json';

export default {
  input: './src/index.js',
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  output: [
    {
      file: './dist/index.mjs',
      format: 'es',
    },
    {
      file: './dist/index.js',
      format: 'cjs',
    },
  ],
};
