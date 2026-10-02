import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    eslint.configs.recommended,

    {
        files: ['src/**/*.ts', 'tests/**/*.ts'],

        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaVersion: 'latest'
            },
            globals: {
                ...globals.node,
                ...globals.jest
            }
        },

        plugins: {
            '@typescript-eslint': tseslint
        },

        rules: {
            ...tseslint.configs.recommended.rules,

            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],

            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',
            'no-console': 'off',
            'prefer-const': 'off',
            'no-useless-escape': 'off',
            'no-useless-catch': 'off',
            'no-extra-semi': 'off'
        }
    },

    {
        ignores: ['dist', 'node_modules', 'coverage']
    }
];
