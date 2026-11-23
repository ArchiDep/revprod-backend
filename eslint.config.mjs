import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import { flatConfigs as importConfigs } from 'eslint-plugin-import-x';
import promisePlugin from 'eslint-plugin-promise';
import sonarPlugin from 'eslint-plugin-sonarjs';
import unicornplugin from 'eslint-plugin-unicorn';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist',
      'frontend/dist',
      'node_modules',
      'public',
      'tmp',
      'frontend/node_modules'
    ]
  },
  js.configs.all,
  importConfigs.recommended,
  promisePlugin.configs['flat/recommended'],
  sonarPlugin.configs.recommended,
  unicornplugin.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 15,
      sourceType: 'module'
    },
    rules: {
      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: true
        }
      ],
      'id-length': [
        'error',
        {
          exceptions: ['i', 'n']
        }
      ],
      'import-x/order': [
        'error',
        {
          alphabetize: {
            order: 'asc'
          },

          groups: [
            ['builtin', 'external'],
            ['internal', 'sibling', 'parent']
          ],
          'newlines-between': 'always'
        }
      ],
      'init-declarations': 'off',
      'max-params': ['error', 5],
      'max-statements': ['error', 25],
      'new-cap': ['error', { capIsNewExceptions: ['Router'] }],
      'no-magic-numbers': 'off',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
      'no-ternary': 'off',
      'no-undefined': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-use-before-define': [
        'error',
        {
          functions: false,
          classes: false,
          variables: true,
          allowNamedExports: false
        }
      ],
      'one-var': ['error', 'never'],
      'promise/no-callback-in-promise': 'off',
      'sonarjs/new-cap': 'off',
      // The course deploys over HTTP before it introduces TLS.
      'sonarjs/no-clear-text-protocols': 'off',
      'sort-keys': 'off',
      'sort-imports': 'off',
      'unicorn/catch-error-name': [
        'error',
        {
          name: 'err'
        }
      ],
      'unicorn/explicit-length-check': [
        'error',
        {
          'non-zero': 'not-equal'
        }
      ],
      'unicorn/import-style': 'off',
      // Documentation comments start each line with an asterisk.
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
      // Modules such as the database keep their state in top-level variables.
      'unicorn/no-top-level-assignment-in-function': 'off',
      // A chain of else if can return from each branch.
      'unicorn/no-useless-else': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/name-replacements': [
        'error',
        {
          allowList: {
            db: true,
            err: true,
            func: true,
            req: true,
            res: true
          },
          replacements: {
            application: false
          }
        }
      ],
      // The course deploys over HTTP before it introduces TLS.
      'unicorn/prefer-https': 'off'
    }
  },
  {
    files: ['tests/**/*.js'],
    rules: {
      // The Fetch API returns null for missing headers.
      'unicorn/no-null': 'off'
    }
  }
];
