import { $, question } from 'zx';

const VERSION_PATTERN = '\\d+\\.\\d+\\.\\d+';
const VERSION_REGEXP = new RegExp(VERSION_PATTERN);

const getVersion = async () => {
  const version = await question('What version are you releasing? ');

  if (!VERSION_REGEXP.test(version)) {
    throw new Error('version should be in format like 1.0.0');
  }

  return version;
};

const setPackageJsonVersion = async (version: string) => {
  await $`npm version ${version} --commit-hooks false --git-tag-version false`; // root package.json
  await $`npm version ${version} --workspaces --commit-hooks false --git-tag-version false`;
};

const version = await getVersion();
// other actions like create release branch, create tag, bump version in .env, make a changelog
await setPackageJsonVersion(version);
