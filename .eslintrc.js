module.exports = {
  plugins: ["ember"],
  extends: [
    "eslint:recommended",
    "plugin:ember/recommended",
    "plugin:prettier/recommended",
  ],
  env: {
    browser: true,
  },
  rules: {},
  overrides: [
    // node files
    {
      files: [
        "./.eslintrc.js",
        "./.prettierrc.js",
        "./.template-lintrc.js",
        "./ember-cli-build.js",
        "./index.js",
        "./testem.js",
        "./blueprints/*/index.js",
        "./config/**/*.js",
        "./tests/dummy/config/**/*.js",
      ],
      parserOptions: {
        sourceType: "script",
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ["node"],
      extends: ["plugin:node/recommended"],
    },
    {
      // test files
      files: ["tests/**/*-test.{js,ts}"],
      extends: ["plugin:qunit/recommended"],
    },
  ],
};
