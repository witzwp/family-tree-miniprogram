module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn']
  },
  globals: {
    'wx': 'readonly',
    'App': 'readonly',
    'Page': 'readonly',
    'Component': 'readonly',
    'getApp': 'readonly',
    'getCurrentPages': 'readonly'
  }
}
