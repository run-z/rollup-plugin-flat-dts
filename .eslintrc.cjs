module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', 'target/', '__snapshots__', '*.d.ts'],
  extends: ['@run-z'],
  overrides: [
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      env: {
        node: true,
      },
    },
    {
      files: ['*.ts'],
      extends: ['@run-z/eslint-config/typescript'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
      },
      env: {
        browser: true,
      },
    },
    {
      files: ['*.spec.ts'],
      extends: ['@run-z/eslint-config/jest'],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.spec.json',
      },
    },
  ],
};
