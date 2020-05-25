# RELEASE PROCESS

## Publishing a new release

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

This should in turn kick off the release Github Action at
`.github/workflows/publish.yml`, which should publish the build to NPM.
