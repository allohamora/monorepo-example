import { $ } from 'zx';
import type { NodePlopAPI } from 'plop';

const PACKAGE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function configurePlop(plop: NodePlopAPI): void {
  plop.setGenerator('package', {
    description: 'Create a package in packages',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Package name:',

        validate: (value) => {
          if (typeof value !== 'string' || value.length === 0) {
            return 'Package name is required.';
          }

          if (!PACKAGE_NAME_PATTERN.test(value)) {
            return 'Use kebab-case letters/numbers only (no slashes).';
          }

          return true;
        },
      },
    ],
    actions: () => [
      {
        type: 'add',
        path: 'packages/{{name}}/package.json',
        templateFile: 'plop-templates/package/package.json.hbs',
      },
      {
        type: 'add',
        path: 'packages/{{name}}/.prettierignore',
        templateFile: 'plop-templates/package/.prettierignore.hbs',
      },
      async () => {
        await $`npm install`;

        return 'npm install';
      },
    ],
  });
}
