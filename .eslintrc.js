module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  settings: {
    'import/core-modules': ['electron'],
  },
  extends: ['airbnb-base'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    electron: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'warn',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'no-console': 'off',
    'max-params': [
      'warn',
      { max: 3 },
    ],
    'class-methods-use-this': 'warn',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'function', next: '*' },
      { blankLine: 'always', prev: '*', next: 'export' },
      { blankLine: 'always', prev: '*', next: 'for' },
      { blankLine: 'always', prev: 'for', next: '*' },
    ],
  },
};
