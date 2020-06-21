# [1.0.0](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.6.0...v1.0.0) (2020-06-21)


### Features

* support prefetch ([#31](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/31)) ([ad7068c](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/ad7068c4af4d0968dd8c886b015723df1cff37a2))


### BREAKING CHANGES

* - Remove `method` and `customPreload` options since the standard preload provides fallbacks for browsers that don't support preload.



# [0.6.0](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.5.0...v0.6.0) (2020-06-18)


### Features

* introduce 'custom' value for method ([#28](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/28)) ([bc646f2](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/bc646f22e484f5976c38bfd3343a96d1ec386721))



# [0.5.0](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.4.0...v0.5.0) (2020-06-13)


### Features

* add `baseUrl` option ([#23](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/23)) ([6da003c](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/6da003c423cb24f82e85a554251fd17fa7bbc757)), closes [#17](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/17) [#22](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/22) [#22](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/22)



# [0.4.0](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.3.3...v0.4.0) (2020-06-12)


### Features

* add option.setAnonymousCrossOrigin ([#19](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/19)) ([2498aff](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/2498afffaa9dcb0c90c6d3e8ef54a8588ba4087e)), closes [#12](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/12) [#18](https://github.com/vikerman/rollup-plugin-hoist-import-deps/issues/18)



## [0.3.3](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.3.2...v0.3.3) (2020-05-25)



## [0.3.2](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.3.1...v0.3.2) (2020-05-25)



## [0.3.1](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.3.0...v0.3.1) (2020-05-23)


### Bug Fixes

* fix `transform` for cases when there is no actual dynamic import ([f86329a](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/f86329a68fb8deffe91c831a19b6bfdd7cca4e72))



# [0.3.0](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.2.0...v0.3.0) (2020-05-21)


### Bug Fixes

* don't inject load script unless AST says so ([1360b2f](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/1360b2fe34276d52ed672c2acab7964b85da1237))



# [0.2.0](https://github.com/vikerman/rollup-plugin-hoist-import-deps/compare/v0.1.0...v0.2.0) (2020-05-20)


### Features

* use link preload by default to load the deps ([d5567e2](https://github.com/vikerman/rollup-plugin-hoist-import-deps/commit/d5567e20f58f91c68612801c26430625468ecaa7))



# 0.1.0 (2020-05-19)

- initial release
