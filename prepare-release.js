#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const { exec } = require('child_process');
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
exec('./node_modules/.bin/standard-changelog', err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

async function commitAndPush() {
  // Commit to git after prompting user
  let ok = await yesno({
    question: 'Commit changes to git and add tag (y/N)?',
    defaultValue: false,
  });

  if (!ok) {
    console.log('Bye');
    process.exit(0);
  }

  exec(`git commit -a -m "release: v${version}"`, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
  exec(`git tag "v${version}"`, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });

  // Prompt to push to origin
  ok = await yesno({
    question: 'Push changes and tag to origin (y/N)?',
    defaultValue: false,
  });

  if (!ok) {
    console.log('Quitting without push...');
    process.exit(0);
  }

  exec(`git push origin`, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
  exec(`git push origin --tags`, err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });

  process.exit(0);
}
commitAndPush();
