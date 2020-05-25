# RELEASE PROCESS

## Publishing a new release

### Step 1: Run `prepare-release.js`

In the root directory run

```sh
node prepare-release.js <NEW VERSION NUMBER>
```

This will

- Validate that the new version is greater than the current one
- Update package.json to the new version number
- Update CHANGELOG.md by running `standard-changelog`
- Prompt you to create a release commit and tag it with the version number
- Prompt you to push the commit and tag to origin

### Steps 2: Create a release in Github

- Click on `Releases` tab and click on Tags (or go to https://github.com/vikerman/rollup-plugin-hoist-import-deps/tags)
- Click on the newly created tag version name and click on `Edit release`
- Set the version name to same as tag name
- Click on `Publish release` to create a release.

This should in turn kick off the release Github Action at
`.github/workflows/publish.yml`, which should publish the build to NPM.
