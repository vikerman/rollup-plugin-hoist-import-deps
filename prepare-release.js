#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const yesno = require('yesno');

if (process.argv.length < 3) {
  console.error(`Usage: ./${path.basename(process.argv[1])} <New release version>`);
  process.exit(1);
}

const version = process.argv[2];
if (semver.valid(version) == null) {
  console.error(`Invalid semver ${version}`);
  process.exit(1);
}

process.chdir(__dirname);

async function update() {
  // Update package.json
  console.log('Updating package.json...');
  const pkg = JSON.parse(fs.readFileSync('./package.json').toString());
  if (!semver.gt(version, pkg.version)) {
    console.error(`New version ${version} is not greater than current version ${pkg.version}`);
    process.exit(1);
  }
  pkg.version = version;
  fs.writeFileSync('./package.json', `${JSON.stringify(pkg, null, '  ')}\n`);

  // Run standard-changelog
  console.log('Running standard-changelog...');
  try {
    await exec('./node_modules/.bin/standard-changelog');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // Commit to git after prompting user
  let ok = await yesno({
    question: 'Commit changes to git and add tag (y/N)?',
    defaultValue: false,
  });

  if (!ok) {
    console.log('Bye');
    process.exit(0);
  }

  try {
    await exec(`git commit -a -m "release: v${version}"`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    await exec(`git tag "v${version}"`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  // Prompt to push to origin
  ok = await yesno({
    question: 'Push changes and tag to origin (y/N)?',
    defaultValue: false,
  });

  if (!ok) {
    console.log('Quitting without push...');
    process.exit(0);
  }

  try {
    await exec(`git push origin`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  try {
    await exec(`git push origin --tags`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}
update();
